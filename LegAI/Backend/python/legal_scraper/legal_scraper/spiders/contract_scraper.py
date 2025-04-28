import scrapy
import psycopg2
from datetime import datetime
from urllib.parse import urljoin, urlparse, parse_qs, urlencode, urlunparse
import requests
import io
from scrapy.http import FormRequest, Request
import re
import os
import sqlite3
import unicodedata
from unidecode import unidecode
import logging
import json
import time

class ContractDocumentSpider(scrapy.Spider):
    name = "contract_document_spider"
    allowed_domains = ["thuvienphapluat.vn"]
    start_urls = [
        "https://thuvienphapluat.vn/hopdong",
    ]

    # Các danh mục hợp đồng
    contract_categories = [
        "https://thuvienphapluat.vn/hopdong",
    ]
    
    # Từ điển loại hợp đồng
    contract_types_dict = {
        "1": "Đất đai, nhà ở",
        "3": "Dịch vụ",
        "4": "Kinh doanh-hợp tác",
        "5": "Sở hữu trí tuệ",
        "6": "Lao động",
        "7": "Xây dựng",
        "9": "Bảo lãnh nhà đất",
        "10": "Chuyển đổi nhà đất",
        "11": "Môi giới nhà đất",
        "12": "Mua bán nhà đất",
        "13": "Mượn nhà đất",
        "14": "Tặng - cho nhà đất",
        "15": "Thế chấp nhà đất",
        "16": "Thuê mướn nhà đất",
        "17": "Ủy quyền nhà đất",
        "18": "Hàng hóa",
        "19": "Tài sản khác",
        "20": "Biên bản thanh lý, phụ lục",
        "21": "Vật",
        "22": "Tiền",
        "23": "Giấy tờ có giá",
        "24": "Khác"
    }

    # Các cấu hình thu thập
    DEBUG_MODE = True  # Đặt True để bật chế độ debug
    SAVE_DOC = False    # Đặt True để lưu tệp doc/docx
    DOCUMENT_LIMIT = 1000000  # Số lượng văn bản tối đa thu thập trên mỗi trang
    PAGE_LIMIT = 1000000000  # Số trang tối đa thu thập
    SAVE_ALL = False  # Đặt True để lưu tất cả văn bản mà không kiểm tra trùng lặp
    LIGHT_MODE = True  # Đặt True để chỉ thu thập từ một số danh mục giới hạn

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'DOWNLOAD_DELAY': 3.0,  # Tăng thời gian chờ giữa các request lên 3 giây
        'CONCURRENT_REQUESTS': 1,  # Giảm số request đồng thời xuống 1
        'CONCURRENT_REQUESTS_PER_DOMAIN': 1,  # Thêm giới hạn 1 request đồng thời trên mỗi domain
        'ROBOTSTXT_OBEY': False,
        'LOG_LEVEL': 'INFO',
        'HTTPCACHE_ENABLED': True,
        'HTTPCACHE_EXPIRATION_SECS': 86400,
        'CLOSESPIDER_PAGECOUNT': 5000000,  # Tăng giới hạn số trang thu thập
        'RETRY_TIMES': 3,  # Giảm số lần thử lại xuống 3
        'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],  # Mã lỗi cần thử lại
        'AUTOTHROTTLE_ENABLED': True,  # Bật tính năng tự động điều chỉnh tốc độ
        'AUTOTHROTTLE_START_DELAY': 5,  # Thời gian chờ ban đầu
        'AUTOTHROTTLE_MAX_DELAY': 60,  # Thời gian chờ tối đa
        'AUTOTHROTTLE_TARGET_CONCURRENCY': 1.0,  # Mục tiêu đồng thời
        'AUTOTHROTTLE_DEBUG': True,  # In thông tin debug về việc điều chỉnh tốc độ
        'COOKIES_ENABLED': False,  # Tắt cookies để giảm nguy cơ bị phát hiện
        'FEED_EXPORT_ENCODING': 'utf-8'  # Đảm bảo dữ liệu xuất ra được mã hóa UTF-8
    }

    def __init__(self):
        # Thiết lập thư mục để lưu hợp đồng
        self.contracts_dir = os.path.abspath('contracts')
        if not os.path.exists(self.contracts_dir):
            os.makedirs(self.contracts_dir)
            
        # Đặt giới hạn mặc định cho số lượng hợp đồng cần thu thập
        self.contract_limit = 20  # Mặc định chỉ thu thập 20 hợp đồng
        
        try:
            self.conn = psycopg2.connect(
                dbname="legai",
                user="postgres",
                password="123456",
                host="localhost",
                port="5432"
            )
            self.cur = self.conn.cursor()
            self.logger.info("Connected to PostgreSQL database")
            
            # Đảm bảo bảng đã được tạo
            self.create_tables_if_not_exist()
        except Exception as e:
            self.logger.error(f"Failed to connect to database: {e}")
            # Tiếp tục chạy ngay cả khi có lỗi kết nối cơ sở dữ liệu
            self.conn = None
            self.cur = None
            self.logger.warning("Running in database-less mode for debugging")
    
    def create_tables_if_not_exist(self):
        """Kiểm tra sự tồn tại của bảng DocumentTemplates và ScrapedUrls"""
        try:
            # Kiểm tra sự tồn tại của bảng DocumentTemplates
            self.cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'documenttemplates'
                )
            """)
            
            if not self.cur.fetchone()[0]:
                self.logger.error("Bảng DocumentTemplates không tồn tại trong cơ sở dữ liệu")
            else:
                self.logger.info("Bảng DocumentTemplates đã tồn tại")
                
            # Kiểm tra bảng ScrapedUrls
            self.cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'scrapedurls'
                )
            """)
            
            if not self.cur.fetchone()[0]:
                self.logger.error("Bảng ScrapedUrls không tồn tại trong cơ sở dữ liệu")
            else:
                self.logger.info("Bảng ScrapedUrls đã tồn tại")
            
            self.conn.commit()
            self.logger.info("Kiểm tra bảng thành công")
        except Exception as e:
            self.logger.error(f"Error checking tables: {e}")
            self.conn.rollback()

    def start_requests(self):
        # Thu thập từ các danh mục hợp đồng với nhiều trang
        for category_url in self.contract_categories:
            # Truy cập trang đầu tiên
            yield Request(url=category_url, callback=self.parse)
            
            # Thêm các trang phân trang (từ trang 2 đến 30)
            for page in range(2, 31):  # Lấy từ trang 2 đến trang 30
                # Tạo URL phân trang
                if "?" in category_url:
                    paginated_url = f"{category_url}&page={page}"
                else:
                    paginated_url = f"{category_url}?page={page}"
                
                self.logger.info(f"Đã lên lịch URL phân trang: {paginated_url}")
                yield Request(
                    url=paginated_url,
                    callback=self.parse,
                    meta={'page': page}
                )

    def parse(self, response):
        """Xử lý trang danh sách hợp đồng mẫu và trích xuất các liên kết đến trang chi tiết"""
        self.logger.info(f"Đang phân tích trang danh sách: {response.url}")
        
        # Trích xuất tất cả liên kết đến trang chi tiết hợp đồng mẫu
        contract_links = response.css('a.news_title::attr(href), a.link_blue_under::attr(href)').getall()
        
        # Nếu không tìm thấy link với bộ selector trên, thử với các selector khác
        if not contract_links:
            contract_links = response.css('div.content-list a[href*="/hopdong/"]::attr(href)').getall()
            if not contract_links:
                # Thử tìm tất cả các link có chứa "/hopdong/" và số ID
                contract_links = response.css('a[href*="/hopdong/"]::attr(href)').getall()
                contract_links = [link for link in contract_links if re.search(r'/hopdong/\d+/', link)]
        
        self.logger.info(f"Tìm thấy {len(contract_links)} liên kết mẫu hợp đồng trên trang")
        
        counter = 0
        for link in contract_links:
            absolute_url = response.urljoin(link)
            normalized_url = self.normalize_url(absolute_url)
            
            # Kiểm tra URL trong cơ sở dữ liệu PostgreSQL (ScrapedUrls)
            if self.conn is not None and self.cur is not None:
                try:
                    self.cur.execute("SELECT COUNT(*) FROM scrapedurls WHERE url = %s", (normalized_url,))
                    exists = self.cur.fetchone()[0] > 0
                    
                    if exists:
                        self.logger.info(f"Bỏ qua URL đã thu thập: {normalized_url}")
                        continue
                except Exception as e:
                    self.logger.error(f"Lỗi khi kiểm tra URL {normalized_url}: {e}")
            
            # Giới hạn số lượng hợp đồng cần thu thập nếu được chỉ định
            document_limit = getattr(self, 'DOCUMENT_LIMIT', 20)
            if document_limit and counter >= document_limit:
                self.logger.info(f"Đã đạt đến giới hạn {document_limit} hợp đồng")
                break
            
            self.logger.info(f"Đang lên lịch thu thập: {normalized_url}")
            counter += 1
            
            # Tạo yêu cầu cho trang chi tiết
            yield scrapy.Request(
                url=absolute_url,
                callback=self.parse_contract,
                meta={'dont_redirect': True}
            )
        
        # Xử lý phân trang - lấy các số trang từ danh sách phân trang
        # Phương pháp 1: Tìm các link phân trang cụ thể
        pagination_links = response.css('div.pager a::attr(href)').getall()
        pagination_links = [link for link in pagination_links if 'page=' in link]
        
        # Nếu không tìm thấy link phân trang, thử tìm bằng cách khác
        if not pagination_links:
            # Phương pháp 2: Tìm nút "Trang tiếp"
            next_page = response.css('a.next::attr(href), a[rel="next"]::attr(href)').get()
            if next_page:
                next_page_url = response.urljoin(next_page)
                page_limit = getattr(self, 'PAGE_LIMIT', 30)
                current_page = response.meta.get('page', 1)
                
                if current_page < page_limit:
                    self.logger.info(f"Trang tiếp theo: {next_page_url}")
                    yield scrapy.Request(
                        url=next_page_url,
                        callback=self.parse,
                        meta={'page': current_page + 1}
                    )
            # Phương pháp 3: Xây dựng URL phân trang dựa vào URL hiện tại
            else:
                current_url = response.url
                parsed_url = urlparse(current_url)
                query_params = parse_qs(parsed_url.query)
                
                # Xác định trang hiện tại
                current_page = int(query_params.get('page', ['1'])[0]) if 'page' in query_params else 1
                next_page = current_page + 1
                
                if next_page <= getattr(self, 'PAGE_LIMIT', 30):
                    # Tạo URL cho trang tiếp theo
                    query_params['page'] = [str(next_page)]
                    query_string = urlencode(query_params, doseq=True)
                    next_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{query_string}"
                    
                    self.logger.info(f"Tự tạo URL trang tiếp theo: {next_url}")
                    yield scrapy.Request(
                        url=next_url,
                        callback=self.parse,
                        meta={'page': next_page}
                    )

    def parse_contract(self, response):
        """Phân tích và trích xuất thông tin từ trang chi tiết hợp đồng"""
        self.logger.info(f"Đang phân tích trang chi tiết hợp đồng: {response.url}")
        
        # Chuẩn hóa URL
        normalized_url = self.normalize_url(response.url)
        
        # Kiểm tra URL đã được crawl chưa trong PostgreSQL
        if self.conn is not None and self.cur is not None:
            try:
                self.cur.execute("SELECT COUNT(*) FROM scrapedurls WHERE url = %s", (normalized_url,))
                exists = self.cur.fetchone()[0] > 0
                
                if exists:
                    self.logger.info(f"URL đã được crawl trước đó: {normalized_url}")
                    return
            except Exception as e:
                self.logger.error(f"Lỗi khi kiểm tra URL {normalized_url}: {e}")
        
        # Trích xuất dữ liệu hợp đồng
        contract_data = self.extract_contract_data(response)
        contract_data['source_url'] = normalized_url
        
        # Ghi URL vào bảng ScrapedUrls
        if self.conn is not None and self.cur is not None:
            try:
                status = 'processing'
                self.cur.execute(
                    "INSERT INTO scrapedurls (url, status, created_at) VALUES (%s, %s, %s)",
                    (normalized_url, status, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
                )
                self.conn.commit()
            except Exception as e:
                self.logger.error(f"Lỗi khi lưu URL vào cơ sở dữ liệu: {e}")
                self.conn.rollback()
        
        # Kiểm tra cấu hình SAVE_DOC
        if self.SAVE_DOC and 'download_url' in contract_data:
            download_url = contract_data['download_url']
            self.logger.info(f"SAVE_DOC=True: Tìm thấy link tải và sẽ tải file: {download_url}")
            
            # Tạo tên file từ tiêu đề
            file_name = self.clean_filename(contract_data.get('title', 'contract'))
            
            # Đảm bảo thư mục contracts tồn tại
            contracts_dir = os.path.abspath('contracts')
            if not os.path.exists(contracts_dir):
                os.makedirs(contracts_dir)
                self.logger.info(f"Đã tạo thư mục contracts tại {contracts_dir}")
            
            file_path = os.path.join(contracts_dir, f"{file_name}.doc")
            
            # Gửi request tải file
            self.logger.info(f"Đang tải file từ {download_url}")
            yield scrapy.Request(
                url=download_url,
                callback=self.save_contract_file,
                meta={
                    'contract_data': contract_data,
                    'file_path': file_path,
                    'source_url': normalized_url
                }
            )
        else:
            if not self.SAVE_DOC:
                self.logger.info(f"SAVE_DOC=False: Không tải file, chỉ lưu nội dung HTML")
            elif 'download_url' not in contract_data:
                self.logger.info(f"Không tìm thấy link tải cho: {normalized_url}")
            
            # Lưu dữ liệu trực tiếp vào cơ sở dữ liệu
            self.save_contract_data(contract_data, normalized_url)

    def save_contract_file(self, response):
        """Lưu tệp hợp đồng và dữ liệu vào cơ sở dữ liệu"""
        file_path = response.meta['file_path']
        data = response.meta['contract_data']
        normalized_url = response.meta['source_url']
        
        # Tạo thư mục nếu chưa tồn tại
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Lưu tệp
        with open(file_path, 'wb') as f:
            f.write(response.body)
        
        self.logger.info(f"Đã lưu tệp hợp đồng vào {file_path}")
        
        # Cập nhật đường dẫn tệp trong dữ liệu
        data['file_path'] = file_path
        
        # Lưu dữ liệu vào cơ sở dữ liệu
        self.save_contract_data(data, normalized_url)

    def save_contract_data(self, data, normalized_url):
        """Lưu dữ liệu mẫu hợp đồng vào cơ sở dữ liệu"""
        if self.conn is None or self.cur is None:
            self.logger.warning("Không thể lưu dữ liệu: không có kết nối cơ sở dữ liệu")
            return
            
        try:
            # Kiểm tra các trường cần thiết
            if not data.get('title'):
                self.logger.warning(f"Bỏ qua mẫu hợp đồng không có tiêu đề: {normalized_url}")
                return
                
            # Chuẩn bị nội dung mẫu hợp đồng - ưu tiên lấy nội dung HTML
            content = data.get('content', '')
            
            # Nếu không có nội dung HTML, dùng link tải
            if not content or len(content) < 100:  # Nếu nội dung quá ngắn, có thể không phải HTML đầy đủ
                content = data.get('download_url', normalized_url)
                if 'file_path' in data:
                    # Nếu đã lưu tệp, thêm thông tin về đường dẫn tệp
                    content += f"\nFile đã lưu: {data['file_path']}"
            
            # Lấy các trường từ dữ liệu
            title = data.get('title', '')
            template_type = data.get('contract_type', 'Hợp đồng')
            language = data.get('language', 'vi')
            
            # Chèn vào bảng DocumentTemplates
            self.cur.execute("""
                INSERT INTO DocumentTemplates (title, template_type, content, language)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (title, template_type, content, language))
            
            template_id = self.cur.fetchone()[0]
            self.conn.commit()
            
            self.logger.info(f"Đã lưu mẫu hợp đồng: {title} (ID: {template_id})")
            
            # Lưu từ khóa nếu có
            if 'keywords' in data and data['keywords']:
                keywords = [k.strip() for k in data['keywords'].split(',')]
                for keyword in keywords:
                    if keyword:
                        try:
                            # Thêm logic để lưu từ khóa vào bảng phù hợp nếu cần
                            pass
                        except Exception as e:
                            self.logger.warning(f"Không thể lưu từ khóa {keyword}: {e}")
                            
        except Exception as e:
            self.logger.error(f"Lỗi khi lưu mẫu hợp đồng: {e}")
            self.conn.rollback()

    def extract_contract_data(self, response):
        """Trích xuất dữ liệu chi tiết từ trang mẫu hợp đồng bao gồm nội dung HTML"""
        data = {}
        
        # Đảm bảo encoding đúng
        if hasattr(response, 'encoding') and not response.encoding:
            response = response.replace(encoding='utf-8')
        
        # Trích xuất tiêu đề - đảm bảo mã hóa Unicode đúng với tiếng Việt
        title_selectors = [
            'h1.detailcom-title::text',
            '.detailsame-title h1::text',
            '.detailcom-title-pc::text',
            'h1.articletitle::text',
            '.content-detail h1::text',
            'h1::text'
        ]
        
        for selector in title_selectors:
            title = response.css(selector).get()
            if title:
                title = title.strip()
                self.logger.info(f"Tiêu đề gốc: {title}")
                # Kiểm tra và khôi phục dấu tiếng Việt nếu cần
                if not self.has_vietnamese_accent(title) and self.detect_vietnamese_without_accent(title):
                    title = self.restore_vietnamese_accents(title, response)
                    self.logger.info(f"Tiêu đề đã được khôi phục dấu: {title}")
                data['title'] = title
                break
        
        if not data.get('title'):
            # Nếu không tìm thấy tiêu đề, dùng URL
            url_title = response.url.split('/')[-1].replace('-', ' ').replace('.aspx', '')
            # Khôi phục dấu cho tiêu đề từ URL nếu có thể
            if self.detect_vietnamese_without_accent(url_title):
                url_title = self.restore_vietnamese_accents(url_title, response)
            data['title'] = url_title
        
        # Trích xuất nội dung HTML của hợp đồng
        content_selectors = [
            'div.divTNPL',          # Container phổ biến cho nội dung hợp đồng
            'div.contract-content',  # Container nội dung hợp đồng
            'div.content1',          # Nội dung chính
            'div#bodyContent',       # Phần thân nội dung
            'div.vbContent',         # Nội dung văn bản
            'div.nq_chitiet',        # Chi tiết nội quy
            'div.detail_content'     # Chi tiết nội dung
        ]
        
        html_content = None
        for selector in content_selectors:
            content = response.css(selector).get()
            if content:
                html_content = content
                self.logger.info(f"Tìm thấy nội dung HTML với selector: {selector}")
                self.logger.info(f"Nội dung HTML (tiêu đề): {content[:100]}")
                break
        
        # Nếu không tìm thấy nội dung bằng selector cụ thể, thử tìm theo h1
        if not html_content:
            self.logger.info("Không tìm thấy nội dung với các selector tiêu chuẩn")
            if data.get('title'):
                title_xpath = f"//h1[contains(text(), '{data['title']}')]"
                title_element = response.xpath(title_xpath)
                if title_element:
                    self.logger.info(f"Tìm thấy phần tử h1 với tiêu đề: {data['title']}")
                    # Lấy phần tử div cha
                    parent = title_element.xpath('ancestor::div[1]').get()
                    if parent:
                        html_content = parent
                        self.logger.info("Trích xuất nội dung từ div cha của h1")
        
        # Nếu vẫn không tìm thấy, tìm nội dung từ các đặc điểm phổ biến của trang hợp đồng
        if not html_content:
            # Thử tìm các thẻ p đầu tiên sau h1
            h1_element = response.xpath('//h1')
            if h1_element:
                # Lấy tất cả các thẻ p sau h1
                paragraphs = h1_element.xpath('following::p')
                if paragraphs:
                    # Gộp 10 đoạn đầu tiên
                    html_content = ''.join([p.get() for p in paragraphs[:20]])
                    self.logger.info("Trích xuất nội dung từ các thẻ p sau h1")
        
        # Nếu vẫn không có nội dung, lấy toàn bộ body
        if not html_content:
            self.logger.info("Không tìm thấy nội dung với các phương pháp khác, lấy toàn bộ body")
            html_content = response.css('div.container').get() or response.css('body').get()
            
        # Lưu nội dung HTML vào dữ liệu
        if html_content:
            data['content'] = html_content
        
        # Tiếp tục với phần còn lại của phương thức
        # Tìm link tải cho mẫu hợp đồng
        download_selectors = [
            'a.download-button::attr(href)',
            'a[href*="download"]::attr(href)',
            'a[href*=".doc"]::attr(href)',
            'a[href*=".docx"]::attr(href)',
            'a[href*="uploads"]::attr(href)',
            'p b.btaive a::attr(href)',
            '.resource-button a::attr(href)'
        ]
        
        for selector in download_selectors:
            download_link = response.css(selector).get()
            if download_link:
                download_url = urljoin(response.url, download_link)
                data['download_url'] = download_url
                break
        
        # Nếu không tìm được link trực tiếp, kiểm tra các onclick
        if not data.get('download_url'):
            download_script = response.css('p b.btaive a::attr(onclick)').get()
            if download_script:
                match = re.search(r"window.open\('([^']+)'\)", download_script)
                if match:
                    download_url = match.group(1)
                    data['download_url'] = urljoin(response.url, download_url)
        
        # Nếu vẫn không tìm được link, thử tạo URL trực tiếp từ tên
        if not data.get('download_url') and data.get('title'):
            contract_name = data.get('title').upper().replace(' ', '%20')
            direct_download_urls = [
                f"https://files.thuvienphapluat.vn/uploads/hopdong/{contract_name}.doc",
                f"https://files.thuvienphapluat.vn/uploads/hopdong/{contract_name}1.doc"
            ]
            
            for url in direct_download_urls:
                data['download_url'] = url
                break
        
        # Trích xuất loại hợp đồng
        # Xác định loại văn bản từ tiêu đề hoặc URL
        contract_type = None
        
        # Dictionary loại văn bản chính
        document_types = {
            "hợp đồng": "Hợp đồng",
            "mẫu hợp đồng": "Hợp đồng",
            "mẫu đơn": "Đơn",
            "đơn": "Đơn",
            "biên bản": "Biên bản",
            "bản cam kết": "Bản cam kết",
            "cam kết": "Bản cam kết",
            "giấy ủy quyền": "Giấy ủy quyền",
            "quyết định": "Quyết định",
            "thông báo": "Thông báo",
            "công văn": "Công văn",
            "tờ khai": "Tờ khai"
        }
        
        # Thử xác định từ tiêu đề
        if 'title' in data:
            title_lower = data['title'].lower()
            for key, value in document_types.items():
                if key in title_lower:
                    contract_type = value
                    self.logger.info(f"Đã xác định loại văn bản từ tiêu đề: {contract_type}")
                    break
        
        # Nếu không xác định được từ tiêu đề, thử dựa vào URL
        if not contract_type:
            url_path = response.url.lower()
            # Từ đường dẫn URL
            if "maudon" in url_path:
                contract_type = "Đơn"
            elif "bienban" in url_path:
                contract_type = "Biên bản"
            elif "camket" in url_path:
                contract_type = "Bản cam kết"
            elif "uyquyen" in url_path:
                contract_type = "Giấy ủy quyền"
            elif "hopdong" in url_path:
                contract_type = "Hợp đồng"
        
        # Nếu vẫn không xác định được, sử dụng "Hợp đồng" làm mặc định
        if not contract_type:
            contract_type = "Hợp đồng"
            
        data['contract_type'] = contract_type
        
        # Trích xuất từ khóa
        keywords = response.css('meta[name="keywords"]::attr(content)').get()
        if keywords:
            data['keywords'] = keywords
        else:
            tag_elements = response.css('.tagbox a::text').getall()
            if tag_elements:
                data['keywords'] = ', '.join([tag.strip() for tag in tag_elements])
        
        # Trích xuất ngày cập nhật
        update_date = None
        date_selectors = [
            '.detailcom-time::text',
            '.news_time::text',
            '.fl.ng-scope time::text'
        ]
        
        for selector in date_selectors:
            date_text = response.css(selector).get()
            if date_text:
                match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', date_text)
                if match:
                    update_date = match.group(1)
                    data['update_date'] = update_date
                    break
        
        # Thêm ngôn ngữ
        data['language'] = 'vi'
        
        # Thêm URL nguồn
        data['source_url'] = response.url
        
        return data
        
    def download_doc(self, url):
        """Tải tệp doc/docx từ URL"""
        try:
            # Nếu URL bắt đầu bằng "javascript:" hoặc chứa script, thì phải xử lý đặc biệt
            if url.startswith('javascript:') or 'javascript:void(0)' in url:
                # Thử tạo URL tải xuống dựa trên ID hợp đồng trong URL gốc
                # Ví dụ: từ "/hopdong/33907/HOP-DONG-THOA-THUAN-CUNG-CAP-DICH-VU-CONG-TAC-XA-HOI"
                # -> "//files.thuvienphapluat.vn/uploads/hopdong/HOP DONG THOA THUAN CUNG CAP DICH VU CONG TAC XA HOI.doc"
                parsed_url = urlparse(self.current_url)
                path_parts = parsed_url.path.split('/')
                if len(path_parts) > 2 and path_parts[1] == 'hopdong' and path_parts[2].isdigit():
                    # Lấy phần tên từ URL
                    contract_name = path_parts[3].replace('-', ' ')
                    # Tạo URL tải xuống
                    download_url = f"https://files.thuvienphapluat.vn/uploads/hopdong/{contract_name}.doc"
                    self.logger.info(f"Generated download URL from javascript button: {download_url}")
                    url = download_url
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://thuvienphapluat.vn/'
            }
            
            response = requests.get(url, timeout=30, headers=headers)
            response.raise_for_status()
            
            # Kiểm tra xem có phải là file Word không
            content_type = response.headers.get('Content-Type', '')
            if 'msword' not in content_type and 'vnd.openxmlformats-officedocument.wordprocessingml.document' not in content_type:
                # Nếu không phải file Word, có thể đây là trang HTML của hợp đồng
                self.logger.warning(f"Downloaded content is not a Word document. Content-Type: {content_type}")
                # Tự tạo file word với nội dung HTML
                return None
                
            return response.content
        except Exception as e:
            self.logger.error(f"Error downloading document: {e}")
            return None
    
    def save_doc_file(self, url, title):
        """Lưu tệp doc/docx vào thư mục"""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Tạo tên file từ tiêu đề
            safe_title = re.sub(r'[^\w\s-]', '', title)
            safe_title = re.sub(r'[\s-]+', '_', safe_title)
            
            # Xác định phần mở rộng tệp
            content_type = response.headers.get('Content-Type', '')
            if 'msword' in content_type:
                ext = '.doc'
            elif 'vnd.openxmlformats-officedocument.wordprocessingml.document' in content_type:
                ext = '.docx'
            else:
                ext = '.doc'  # Mặc định
            
            # Đảm bảo thư mục contracts tồn tại với đường dẫn tuyệt đối
            contracts_dir = os.path.abspath('contracts')
            if not os.path.exists(contracts_dir):
                os.makedirs(contracts_dir)
                self.logger.info(f"Created contracts directory at {contracts_dir}")
            
            # Lưu tệp với đường dẫn tuyệt đối
            filename = os.path.join(contracts_dir, f"{safe_title}{ext}")
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            self.logger.info(f"Saved document to: {filename}")
            return True
        except Exception as e:
            self.logger.error(f"Error saving document file: {e}")
            return False

    def closed(self, reason):
        if self.conn and self.cur:
            self.cur.close()
            self.conn.close()
            self.logger.info("Database connection closed")

    def normalize_url(self, url):
        """Chuẩn hóa URL để tránh trùng lặp khi so sánh"""
        parsed_url = urlparse(url)
        # Loại bỏ các tham số không cần thiết từ query string
        if parsed_url.query:
            params = parse_qs(parsed_url.query)
            # Loại bỏ các tham số không quan trọng như utm_, ref, etc.
            filtered_params = {k: v for k, v in params.items() 
                              if not k.startswith('utm_') and k not in ['ref', 'source']}
            query_string = urlencode(filtered_params, doseq=True) if filtered_params else ''
            parsed_url = parsed_url._replace(query=query_string)
        
        # Loại bỏ dấu gạch chéo cuối cùng nếu có
        path = parsed_url.path
        if path.endswith('/'):
            path = path[:-1]
        parsed_url = parsed_url._replace(path=path)
        
        # Đảm bảo tất cả đều là chữ thường
        normalized = parsed_url._replace(netloc=parsed_url.netloc.lower())
        
        # Chuyển đổi parsed_url trở lại thành chuỗi URL
        return urlunparse(normalized)

    def clean_filename(self, filename):
        """Làm sạch tên tệp để tránh các ký tự không hợp lệ trong tên tệp"""
        if not filename:
            return "contract_unknown"
            
        # Loại bỏ các ký tự không hợp lệ trong tên tệp
        clean_name = re.sub(r'[\\/*?:"<>|]', '', filename)
        # Thay thế khoảng trắng bằng dấu gạch dưới
        clean_name = re.sub(r'\s+', '_', clean_name)
        # Giới hạn độ dài tên tệp
        if len(clean_name) > 100:
            clean_name = clean_name[:100]
        
        return clean_name 

    def has_vietnamese_accent(self, text):
        """Kiểm tra xem văn bản có dấu tiếng Việt không"""
        vietnamese_accents = ['á', 'à', 'ả', 'ã', 'ạ', 'ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ',
                             'â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ', 'é', 'è', 'ẻ', 'ẽ', 'ẹ',
                             'ê', 'ế', 'ề', 'ể', 'ễ', 'ệ', 'í', 'ì', 'ỉ', 'ĩ', 'ị',
                             'ó', 'ò', 'ỏ', 'õ', 'ọ', 'ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ',
                             'ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ', 'ú', 'ù', 'ủ', 'ũ', 'ụ',
                             'ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ',
                             'đ', 'Á', 'À', 'Ả', 'Ã', 'Ạ', 'Ă', 'Ắ', 'Ằ', 'Ẳ', 'Ẵ',
                             'Ặ', 'Â', 'Ấ', 'Ầ', 'Ẩ', 'Ẫ', 'Ậ', 'É', 'È', 'Ẻ', 'Ẽ',
                             'Ẹ', 'Ê', 'Ế', 'Ề', 'Ể', 'Ễ', 'Ệ', 'Í', 'Ì', 'Ỉ', 'Ĩ',
                             'Ị', 'Ó', 'Ò', 'Ỏ', 'Õ', 'Ọ', 'Ô', 'Ố', 'Ồ', 'Ổ', 'Ỗ',
                             'Ộ', 'Ơ', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ', 'Ú', 'Ù', 'Ủ', 'Ũ',
                             'Ụ', 'Ư', 'Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự', 'Ý', 'Ỳ', 'Ỷ', 'Ỹ', 'Ỵ', 'Đ']
        for char in text:
            if char.lower() in vietnamese_accents:
                return True
        return False
    
    def detect_vietnamese_without_accent(self, text):
        """Phát hiện xem văn bản có thể là tiếng Việt không dấu không"""
        # Từ tiếng Việt thường gặp không dấu
        vietnamese_words = ['hop dong', 'quyen', 'nghia vu', 'thoa thuan', 'dich vu', 'kinh doanh', 
                           'mua ban', 'cho thue', 'so huu', 'tai san', 'thanh ly', 'uy quyen', 
                           'thue', 'lao dong', 'chuyen nhuong', 'phan phoi', 'nha dat', 'xay dung']
        
        text_lower = text.lower()
        for word in vietnamese_words:
            if word in text_lower:
                return True
        return False
    
    def restore_vietnamese_accents(self, text_without_accent, response):
        """Thử khôi phục dấu tiếng Việt cho văn bản không dấu"""
        # Phương pháp 1: Tìm kiếm trong metadata hoặc breadcrumbs
        meta_title = response.css('meta[property="og:title"]::attr(content), meta[name="title"]::attr(content)').get()
        if meta_title and self.has_vietnamese_accent(meta_title):
            return meta_title.strip()
        
        # Phương pháp 2: Tìm trong breadcrumbs hoặc heading khác
        breadcrumb_titles = response.css('.breadcrumb li:last-child::text, .breadcrumb-item.active::text').getall()
        for title in breadcrumb_titles:
            if title and self.has_vietnamese_accent(title):
                return title.strip()
        
        # Phương pháp 3: Tìm trong nội dung trang
        # Tạo pattern để tìm kiếm tiêu đề có dấu trong nội dung
        text_pattern = re.sub(r'\s+', '\\s+', re.escape(text_without_accent))
        pattern = re.compile(f'({text_pattern})', re.IGNORECASE)
        
        # Tìm trong nội dung HTML
        html_content = response.css('div.divTNPL, div.contract-content, div#bodyContent, div.vbContent').get()
        if html_content:
            # Loại bỏ HTML tags để dễ tìm kiếm
            text_content = re.sub(r'<[^>]+>', ' ', html_content)
            matches = pattern.findall(text_content)
            for match in matches:
                if self.has_vietnamese_accent(match):
                    return match
        
        # Phương pháp 4: Thử dựng lại tiêu đề từ URL
        if 'url' in response.meta and response.meta['url']:
            url_parts = response.meta['url'].split('/')
            if url_parts and len(url_parts) > 3:
                url_title = url_parts[-1].replace('-', ' ').replace('.aspx', '')
                # Chuyển đổi từ dạng URL sang dạng tiêu đề
                url_title = ' '.join(word.capitalize() for word in url_title.split())
                if url_title != text_without_accent and self.has_vietnamese_accent(url_title):
                    return url_title
        
        # Nếu không khôi phục được, trả về nguyên bản
        return text_without_accent 