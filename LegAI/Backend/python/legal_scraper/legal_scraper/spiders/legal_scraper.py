import scrapy
import psycopg2
from datetime import datetime
from urllib.parse import urljoin, urlparse, parse_qs
import pdfplumber
import requests
import io
from scrapy.http import FormRequest, Request
import re

class LegalDocumentSpider(scrapy.Spider):
    name = "legal_document_spider"
    allowed_domains = ["thuvienphapluat.vn"]
    start_urls = [
        "https://thuvienphapluat.vn/page/tim-van-ban.aspx",
        "https://thuvienphapluat.vn/van-ban-moi-ban-hanh",
        "https://thuvienphapluat.vn/phap-luat-bo-nganh",
        "https://thuvienphapluat.vn/tra-cuu-phap-luat-moi.aspx",
    ]

    # Thêm các danh mục văn bản quan trọng
    legal_categories = [
        "https://thuvienphapluat.vn/van-ban-moi",
    ]
    
    # Từ điển năm
    years = list(range(1945, 2026))  # Từ 1945 đến 2025
    
    # Từ điển loại văn bản pháp luật
    document_types_dict = {
        "Luật": "LUẬT",
        "Bộ luật": "BỘ LUẬT",
        "Hiến pháp": "HIẾN PHÁP", 
        "Lệnh": "LỆNH",
        "Nghị quyết": "NGHỊ QUYẾT",
        "Nghị định": "NGHỊ ĐỊNH",
        "Quyết định": "QUYẾT ĐỊNH",
        "Thông tư": "THÔNG TƯ",
        "Chỉ thị": "CHỈ THỊ",
        "Công điện": "CÔNG ĐIỆN",
        "Công văn": "CÔNG VĂN",
        "Văn bản hợp nhất": "VĂN BẢN HỢP NHẤT",
        "Văn bản khác": "VĂN BẢN KHÁC",
        "Thông báo": "THÔNG BÁO"
    }

    # Các cấu hình thu thập
    DEBUG_MODE = True  # Đặt True để bật chế độ debug
    SAVE_HTML = False  # Đặt True để lưu HTML
    DOCUMENT_LIMIT = 1000000  # Số lượng văn bản tối đa thu thập trên mỗi trang
    PAGE_LIMIT = 1000000000  # Số trang tối đa thu thập
    SAVE_ALL = False  # Đặt True để lưu tất cả văn bản mà không kiểm tra trùng lặp
    LIGHT_MODE = False  # Đặt True để chỉ thu thập từ một số danh mục giới hạn

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'DOWNLOAD_DELAY': 2.0,  # Tăng thời gian chờ giữa các request lên 2 giây
        'CONCURRENT_REQUESTS': 2,  # Giảm số request đồng thời xuống 2
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
        'COOKIES_ENABLED': False  # Tắt cookies để giảm nguy cơ bị phát hiện
    }

    def __init__(self):
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
        """Tạo các bảng nếu chưa tồn tại"""
        try:
            # Tạo bảng LegalDocuments nếu chưa tồn tại
            self.cur.execute("""
                CREATE TABLE IF NOT EXISTS LegalDocuments (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    document_type VARCHAR(100),
                    document_number VARCHAR(100),
                    issuing_body VARCHAR(200),
                    version VARCHAR(20),
                    content TEXT NOT NULL,
                    summary TEXT,
                    issued_date DATE,
                    effective_date DATE,
                    expiry_date DATE,
                    language VARCHAR(10),
                    source_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Tạo bảng LegalKeywords nếu chưa tồn tại
            self.cur.execute("""
                CREATE TABLE IF NOT EXISTS LegalKeywords (
                    id SERIAL PRIMARY KEY,
                    document_id INTEGER REFERENCES LegalDocuments(id),
                    keyword VARCHAR(100) NOT NULL,
                    UNIQUE(document_id, keyword)
                )
            """)
            
            # Tạo bảng ScrapedUrls để tránh thu thập trùng lặp
            self.cur.execute("""
                CREATE TABLE IF NOT EXISTS ScrapedUrls (
                    url TEXT PRIMARY KEY,
                    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            self.conn.commit()
            self.logger.info("Database tables created or already exist")
        except Exception as e:
            self.logger.error(f"Error creating tables: {e}")
            self.conn.rollback()

    def start_requests(self):
        # Thu thập từ các danh mục văn bản với nhiều trang
        for category_url in self.legal_categories:
            # Truy cập trang đầu tiên
            yield Request(url=category_url, callback=self.parse)
            
            # Thêm các trang phân trang (từ trang 2 đến 50) - Tăng số lượng trang
            for page in range(2, 51):  # Lấy từ trang 2 đến trang 50
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

    def parse_ministry_pages(self, response):
        """Thu thập các liên kết đến trang văn bản của các bộ ngành"""
        ministry_links = response.css('div.ministry-item a::attr(href)').getall()
        if not ministry_links:
            ministry_links = response.css('a[href*="/Bo-"]::attr(href)').getall()
        
        for link in ministry_links:
            full_url = urljoin(response.url, link)
            yield Request(url=full_url, callback=self.parse)

    def parse(self, response):
        self.logger.info(f"Parsing page: {response.url}")
        
        # Kiểm tra URL phân trang đã quét để tránh lặp vô hạn, nhưng không lưu vào DB
        parsed_url = urlparse(response.url)
        # Lấy cả path và query params để xác định URL duy nhất
        full_path = parsed_url.path
        if parsed_url.query:
            full_path = f"{full_path}?{parsed_url.query}"
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}{full_path}"
        
        # Chỉ kiểm tra URL phân trang trong bộ nhớ (không lưu vào DB)
        if hasattr(self, 'scraped_list_pages') and base_url in self.scraped_list_pages:
            self.logger.info(f"List page already scraped: {base_url}")
            return
        
        # Lưu URL phân trang vào bộ nhớ tạm (không lưu vào DB)
        if not hasattr(self, 'scraped_list_pages'):
            self.scraped_list_pages = set()
        self.scraped_list_pages.add(base_url)
        
        # Tìm liên kết đến trang chi tiết văn bản
        document_links = response.css('div.vb-item a[href*="/van-ban/"]::attr(href), table.vb-list a[href*="/van-ban/"]::attr(href)').getall()
        if not document_links:
            document_links = response.css('ul.list-van-ban li a[href*="/van-ban/"]::attr(href)').getall()
            if not document_links:
                document_links = response.css('a[href*="/van-ban/"]::attr(href)').getall()
                if document_links:
                    document_links = [link for link in document_links if 'tim-van-ban' not in link and 'dang-nhap' not in link]

        self.logger.info(f"Found {len(document_links)} document links")
        
        # Giới hạn số lượng văn bản thu thập trên mỗi trang
        docs_limit = 5 if self.LIGHT_MODE else self.DOCUMENT_LIMIT  # Chỉ lấy 5 văn bản trên mỗi trang trong chế độ nhẹ
        
        # Áp dụng giới hạn số lượng văn bản
        for idx, link in enumerate(document_links[:docs_limit]):
            full_url = urljoin(response.url, link)
            self.logger.info(f"Processing document link: {full_url}")
            # Trang đầu tiên có độ ưu tiên cao hơn
            priority = 100 if 'page=' not in response.url else 50
            yield Request(
                url=full_url, 
                callback=self.parse_document,
                priority=priority - idx  # Giảm độ ưu tiên theo vị trí trong trang
            )

        # Nếu đang ở chế độ nhẹ, không theo dõi các liên kết phân trang tìm thấy
        if self.LIGHT_MODE:
            return
            
        # Tìm liên kết phân trang
        next_page_selectors = [
            'a.next::attr(href)',
            'a.pager-next::attr(href)',
            'a[title*="Next"]::attr(href)',
            'a[rel="next"]::attr(href)',
            'a.next-page::attr(href)',
            'a[href*="page="]::attr(href)'
        ]
        
        for selector in next_page_selectors:
            next_page = response.css(selector).get()
            if next_page:
                break
                
        if next_page:
            full_next_url = urljoin(response.url, next_page)
            parsed_next = urlparse(full_next_url)
            
            # Kiểm tra nếu là URL phân trang thực sự
            if 'page=' in parsed_next.query:
                params = parse_qs(parsed_next.query)
                if 'page' in params:
                    page_num = params['page'][0]
                    try:
                        page_num = int(page_num)
                        if page_num > 1 and page_num <= self.PAGE_LIMIT:  # Giới hạn số trang
                            self.logger.info(f"Found next page: {full_next_url}")
                            yield Request(url=full_next_url, callback=self.parse)
                    except ValueError:
                        pass

    def parse_document(self, response):
        self.logger.info(f"Parsing document: {response.url}")
        
        # Lưu URL hiện tại để tham chiếu khi cần thiết
        self.current_url = response.url
        
        # Chuẩn hóa URL để loại bỏ các tham số tab
        normalized_url = self.normalize_url(response.url)
        
        # Kiểm tra xem URL hiện tại có phải là trang chi tiết văn bản không
        # URL chi tiết văn bản thường có dạng /van-ban/{name}/{id} hoặc /van-ban/{id}/{name}
        if '/van-ban/' not in normalized_url or any(category in normalized_url for category in [
            '/van-ban-moi/', 
            '/van-ban-phap-luat/', 
            '/van-ban-hop-nhat/', 
            '/chu-de-van-ban/',
            '/tim-van-ban']):
            self.logger.info(f"Not a document detail page, skipping: {normalized_url}")
            return
        
        # Kiểm tra URL đã thu thập để tránh thu thập trùng lặp
        if self.conn is not None and self.cur is not None and not self.SAVE_ALL:
            self.cur.execute("SELECT url FROM ScrapedUrls WHERE url = %s", (normalized_url,))
            if self.cur.fetchone():
                self.logger.info(f"Document URL already scraped: {normalized_url}")
                return
                
            # Lưu URL văn bản đã thu thập
            self.cur.execute("INSERT INTO ScrapedUrls (url) VALUES (%s)", (normalized_url,))
            self.conn.commit()
        
        # Chỉ lưu HTML khi DEBUG_MODE và SAVE_HTML được bật
        if self.DEBUG_MODE and self.SAVE_HTML:
            with open(f"debug_doc_{normalized_url.split('/')[-1].replace('?', '_')}.html", "w", encoding="utf-8") as f:
                f.write(response.text)
        
        # Kiểm tra đăng nhập nếu cần
        if "Bạn vui lòng đăng nhập" in response.text:
            self.logger.warning("Login required. Attempting login.")
            yield FormRequest(
                url="https://thuvienphapluat.vn/dang-nhap",
                formdata={
                    'username': 'trankimt11@gmail.com',
                    'password': 'trankimthinh208'
                },
                callback=self.after_login,
                meta={'original_url': response.url}
            )
            return

        # Trích xuất thông tin cơ bản của văn bản
        data = self.extract_document_data(response)
        
        # Cập nhật URL đã chuẩn hóa để tránh trùng lặp
        data['source_url'] = normalized_url
        
        # Chỉ in dữ liệu đã trích xuất khi DEBUG_MODE được bật
        if self.DEBUG_MODE:
            self.logger.info(f"Extracted data: {data}")
        
        # Kiểm tra các trường quan trọng không được phép rỗng
        required_fields = ['title', 'content']
        for field in required_fields:
            if not data.get(field):
                self.logger.warning(f"Required field '{field}' is empty for document: {normalized_url}, skipping")
                return

        # Lưu vào cơ sở dữ liệu nếu kết nối đã được thiết lập
        if self.conn is None or self.cur is None:
            self.logger.warning("Skipping database operations - running in database-less mode")
            return
            
        try:
            # Chỉ kiểm tra trùng lặp nếu không phải chế độ lưu tất cả
            if not self.SAVE_ALL:
                # Kiểm tra văn bản trùng lặp (trùng tiêu đề và cùng ngày ban hành)
                if data.get('issued_date'):
                    self.cur.execute("""
                        SELECT id FROM LegalDocuments 
                        WHERE title = %s AND issued_date = %s
                    """, (data['title'], data['issued_date']))
                    existing_doc = self.cur.fetchone()
                    if existing_doc:
                        self.logger.info(f"Skipping duplicate document (same title and issued date): {data['title']}")
                        return
                else:
                    # Nếu không có ngày ban hành, kiểm tra trùng URL đã chuẩn hóa
                    self.cur.execute("""
                        SELECT id FROM LegalDocuments 
                        WHERE source_url LIKE %s
                    """, (self.get_base_url(data['source_url']) + '%',))
                    existing_doc = self.cur.fetchone()
                    if existing_doc:
                        self.logger.info(f"Skipping duplicate document (similar URL): {data['title']}")
                        return
            
            # Tạo câu lệnh SQL động dựa trên các trường có dữ liệu
            fields = [k for k, v in data.items() if v is not None]
            values = [data[field] for field in fields]
            placeholders = ', '.join(['%s'] * len(fields))
            fields_str = ', '.join(fields)
            
            sql = f"""
                INSERT INTO LegalDocuments (
                    {fields_str}
                ) VALUES ({placeholders})
                RETURNING id
            """
            
            self.cur.execute(sql, values)
            document_id = self.cur.fetchone()[0]

            # Lưu từ khóa vào bảng LegalKeywords
            keywords = self.extract_keywords(data['title'])
            for keyword in keywords:
                self.cur.execute("""
                    INSERT INTO LegalKeywords (document_id, keyword)
                    VALUES (%s, %s) ON CONFLICT (document_id, keyword) DO NOTHING
                """, (document_id, keyword))

            self.conn.commit()
            self.logger.info(f"Saved document: {data['title']} (ID: {document_id})")
        except Exception as e:
            self.logger.error(f"Error saving document: {e}")
            self.conn.rollback()

    def extract_document_data(self, response):
        """Trích xuất tất cả thông tin văn bản từ trang chi tiết"""
        data = {
            'source_url': response.url
        }
        
        # Kiểm tra các class chính của thuvienphapluat.vn
        content_container = response.css('div#divContentDoc, div.cldivContentDocVn')
        
        # Tiêu đề văn bản - kiểm tra nhiều vị trí khác nhau
        title = response.css('div.box-title h1::text').get()
        if not title:
            # Tìm tiêu đề trong nội dung centered
            title = response.css('p[align="center"]:contains("VỀ VIỆC")::text').get()
            if not title:
                title = response.css('p[style*="text-align:center"]:contains("VỀ VIỆC")::text').get()
                if not title:
                    # Thử tìm trong phần tử <p> có đoạn "VỀ VIỆC" hoặc ở các vị trí khác
                    title_elements = response.xpath('//p[contains(text(), "VỀ VIỆC")]/text()').getall()
                    if title_elements:
                        title = ' '.join([t.strip() for t in title_elements if t.strip()])
                    else:
                        # Tìm kiếm bất kỳ phần tử <p> căn giữa nào có phần chữ dài
                        centered_ps = response.css('p[align="center"]::text, p[style*="text-align:center"]::text').getall()
                        for p in centered_ps:
                            if p and len(p.strip()) > 30:  # Giả sử tiêu đề thường dài hơn 30 ký tự
                                title = p.strip()
                                break
        
        # Nếu vẫn không tìm thấy tiêu đề, thử lấy từ số hiệu và loại văn bản
        if not title:
            doc_number = response.css('div.box-info span:contains("Số hiệu") + span::text').get()
            doc_type = response.css('div.box-info span:contains("Loại văn bản") + span::text').get()
            if doc_number and doc_type:
                title = f"{doc_type.strip()} số {doc_number.strip()}"
            elif doc_number:
                title = f"Văn bản số {doc_number.strip()}"
        
        # Nếu vẫn không có tiêu đề, tạo tiêu đề dựa trên URL
        if not title:
            parsed_url = urlparse(response.url)
            path_parts = parsed_url.path.split('/')
            if len(path_parts) > 2:
                # Lấy phần cuối của URL và chuyển thành dạng tiêu đề
                url_title = path_parts[-1].replace('-', ' ').replace('.aspx', '')
                title = f"Văn bản: {url_title}"
        
        if title:
            data['title'] = title.strip()
        else:
            # Đặt một tiêu đề mặc định để tránh lỗi
            data['title'] = f"Văn bản pháp luật - {response.url}"
        
        # Thông tin văn bản từ phần meta
        doc_number = response.css('div.box-info span:contains("Số hiệu") + span::text').get()
        if doc_number:
            data['document_number'] = doc_number.strip()
            
        issuing_body = response.css('div.box-info span:contains("Cơ quan ban hành") + span::text').get()
        if issuing_body:
            data['issuing_body'] = issuing_body.strip()
            
        effective_date_str = response.css('div.box-info span:contains("Ngày hiệu lực") + span::text').get()
        if effective_date_str:
            try:
                date_parts = effective_date_str.strip().split('/')
                if len(date_parts) == 3:
                    data['effective_date'] = datetime.strptime(effective_date_str.strip(), '%d/%m/%Y').date()
            except ValueError:
                self.logger.warning(f"Invalid effective date format: {effective_date_str}")
                
        expiry_date_str = response.css('div.box-info span:contains("Ngày hết hiệu lực") + span::text').get()
        if expiry_date_str and 'còn hiệu lực' not in expiry_date_str.lower():
            try:
                date_parts = expiry_date_str.strip().split('/')
                if len(date_parts) == 3:
                    data['expiry_date'] = datetime.strptime(expiry_date_str.strip(), '%d/%m/%Y').date()
            except ValueError:
                self.logger.warning(f"Invalid expiry date format: {expiry_date_str}")
        
        # Loại văn bản
        document_type = self.extract_document_type(response)
        if document_type:
            data['document_type'] = document_type
            
        # Phiên bản
        version = response.css('span.version::text').get(default='1.0').strip()
        data['version'] = version
        
        # Ngày ban hành
        issued_date = self.extract_issued_date(response)
        if issued_date:
            data['issued_date'] = issued_date
            
        # Nội dung - thu thập từ các vị trí khác nhau
        content = self.extract_content(response)
        if content:
            data['content'] = content
            
            # Tóm tắt từ nội dung
            plain_content = re.sub(r'<.*?>', ' ', content)
            plain_content = re.sub(r'\s+', ' ', plain_content).strip()
            summary = plain_content[:500] + '...' if len(plain_content) > 500 else plain_content
            data['summary'] = summary
            
        # Ngôn ngữ
        data['language'] = 'vi'
        
        return data
        
    def extract_document_type(self, response):
        """Trích xuất loại văn bản pháp luật"""
        # Bật logging chi tiết để gỡ lỗi nếu ở chế độ DEBUG
        if self.DEBUG_MODE:
            self.logger.info(f"Đang xác định loại văn bản cho: {response.url}")
        
        # Xác định từ URL trước tiên (ưu tiên cao nhất)
        url_path = response.url.lower()
        
        # Kiểm tra từ tên file URL
        if "/luat-" in url_path or "-l-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ tên file: LUẬT")
            return "LUẬT"
        elif "/nghi-quyet-" in url_path or "-nq-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ tên file: NGHỊ QUYẾT")
            return "NGHỊ QUYẾT"
        elif "/nghi-dinh-" in url_path or "-nd-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ tên file: NGHỊ ĐỊNH")
            return "NGHỊ ĐỊNH"
        elif "/thong-tu-" in url_path or "-tt-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ tên file: THÔNG TƯ")
            return "THÔNG TƯ"
        elif "/quyet-dinh-" in url_path or "-qd-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ tên file: QUYẾT ĐỊNH")
            return "QUYẾT ĐỊNH"
        elif "/chi-thi-" in url_path or "-ct-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ tên file: CHỈ THỊ")
            return "CHỈ THỊ"
        elif "/cong-van-" in url_path or "-cv-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ tên file: CÔNG VĂN")
            return "CÔNG VĂN"
        elif "/thong-bao-" in url_path or "-tb-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ tên file: THÔNG BÁO")
            return "THÔNG BÁO"
        
        # Kiểm tra mã ký hiệu văn bản trong URL
        if "/nq-" in url_path or "nq-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ mã ký hiệu: NGHỊ QUYẾT")
            return "NGHỊ QUYẾT"
        elif "/nd-" in url_path or "nd-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ mã ký hiệu: NGHỊ ĐỊNH")
            return "NGHỊ ĐỊNH"
        elif "/tt-" in url_path or "tt-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ mã ký hiệu: THÔNG TƯ")
            return "THÔNG TƯ"
        elif "/qd-" in url_path or "qd-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ mã ký hiệu: QUYẾT ĐỊNH")
            return "QUYẾT ĐỊNH"
        elif "/ct-" in url_path or "ct-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ mã ký hiệu: CHỈ THỊ")
            return "CHỈ THỊ"
        elif "/cv-" in url_path or "cv-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ mã ký hiệu: CÔNG VĂN")
            return "CÔNG VĂN"
        elif "/tb-" in url_path or "tb-" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ mã ký hiệu: THÔNG BÁO")
            return "THÔNG BÁO"
        
        # Thử lấy từ meta
        doc_type_meta = response.css('div.box-info span:contains("Loại văn bản") + span::text').get()
        if doc_type_meta:
            doc_type_meta = doc_type_meta.strip()
            if self.DEBUG_MODE:
                self.logger.info(f"Tìm thấy loại văn bản từ meta: {doc_type_meta}")
                
            # Kiểm tra từ điển loại văn bản
            for key, value in self.document_types_dict.items():
                if key.lower() in doc_type_meta.lower():
                    if self.DEBUG_MODE:
                        self.logger.info(f"Xác định loại văn bản: {value} (từ meta)")
                    return value
            
            # Nếu không khớp với các loại trong từ điển nhưng vẫn có giá trị
            # Tạo loại văn bản dựa trên meta
            if doc_type_meta:
                doc_type_upper = doc_type_meta.upper()
                if self.DEBUG_MODE:
                    self.logger.info(f"Sử dụng loại văn bản từ meta trực tiếp: {doc_type_upper}")
                return doc_type_upper
        
        # Tìm kiếm trong tiêu đề văn bản
        title = response.css('div.box-title h1::text').get() or ''
        if title:
            title_upper = title.upper()
            for key, value in self.document_types_dict.items():
                if key.upper() in title_upper:
                    if self.DEBUG_MODE:
                        self.logger.info(f"Xác định loại văn bản: {value} (từ tiêu đề)")
                    return value
        
        # Nếu không có trong meta, tìm trong nội dung
        for key, doc_type in self.document_types_dict.items():
            # Tìm kiếm tiêu đề có thể chứa loại văn bản
            type_centered = response.css(f'p[align="center"] *:contains("{key}")::text, p[style*="text-align:center"] *:contains("{key}")::text').get()
            if type_centered:
                if self.DEBUG_MODE:
                    self.logger.info(f"Xác định loại văn bản: {doc_type} (từ text căn giữa)")
                return doc_type
                
            # Tìm trong các thẻ <b> hoặc <span> có thể chứa loại văn bản
            type_text = response.xpath(f'//b[contains(text(), "{key}")]/text() | //span[contains(text(), "{key}")]/text()').get()
            if type_text:
                if self.DEBUG_MODE:
                    self.logger.info(f"Xác định loại văn bản: {doc_type} (từ thẻ b/span)")
                return doc_type
                
            # Tìm kiếm trong phần đầu của trang
            first_paragraphs = response.css('div.content1 p::text, div#bodyContent p::text, div.vbContent p::text').getall()[:10]
            for para in first_paragraphs:
                if para and key.upper() in para.upper():
                    if self.DEBUG_MODE:
                        self.logger.info(f"Xác định loại văn bản: {doc_type} (từ đoạn văn đầu)")
                    return doc_type
        
        # Tìm kiếm CÔNG ĐIỆN đặc biệt
        cong_dien_selectors = [
            'p[align="center"] b span:contains("CÔNG ĐIỆN")::text',
            'p[style*="text-align:center"] b span:contains("CÔNG ĐIỆN")::text',
            'p[align="center"] b:contains("CÔNG ĐIỆN")::text',
            'p[style*="text-align:center"] b:contains("CÔNG ĐIỆN")::text'
        ]
        
        for selector in cong_dien_selectors:
            cong_dien = response.css(selector).get()
            if cong_dien and "CÔNG ĐIỆN" in cong_dien.upper():
                if self.DEBUG_MODE:
                    self.logger.info("Xác định loại văn bản: CÔNG ĐIỆN (từ selector đặc biệt)")
                return "CÔNG ĐIỆN"
            
        # Kiểm tra nội dung HTML trực tiếp
        html_content = response.css('div.content1').get() or response.css('div#bodyContent').get() or response.css('div.vbContent').get()
        if html_content:
            html_lower = html_content.lower()
            for key, value in self.document_types_dict.items():
                if key.lower() in html_lower:
                    if self.DEBUG_MODE:
                        self.logger.info(f"Xác định loại văn bản: {value} (từ nội dung HTML)")
                    return value
        
        # Kiểm tra từ phần đường dẫn URL - ưu tiên thấp nhất
        if "nghi-quyet" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ đường dẫn: NGHỊ QUYẾT")
            return "NGHỊ QUYẾT"
        elif "nghi-dinh" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ đường dẫn: NGHỊ ĐỊNH")
            return "NGHỊ ĐỊNH"
        elif "thong-tu" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ đường dẫn: THÔNG TƯ")
            return "THÔNG TƯ"
        elif "quyet-dinh" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ đường dẫn: QUYẾT ĐỊNH")
            return "QUYẾT ĐỊNH"
        elif "chi-thi" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ đường dẫn: CHỈ THỊ")
            return "CHỈ THỊ"
        elif "cong-van" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ đường dẫn: CÔNG VĂN")
            return "CÔNG VĂN"
        elif "thong-bao" in url_path:
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ đường dẫn: THÔNG BÁO")
            return "THÔNG BÁO"
        elif "luat" in url_path and not any(x in url_path for x in ["nghi-dinh", "thong-tu", "quyet-dinh", "nghi-quyet"]):
            if self.DEBUG_MODE:
                self.logger.info(f"Xác định loại văn bản từ đường dẫn: LUẬT")
            return "LUẬT"
                    
        if self.DEBUG_MODE:
            self.logger.info("Không xác định được loại văn bản cụ thể, sử dụng VĂN BẢN KHÁC")
        return 'VĂN BẢN KHÁC'
        
    def extract_issued_date(self, response):
        """Trích xuất ngày ban hành văn bản"""
        # Thử lấy từ meta
        issued_date_meta = response.css('div.box-info span:contains("Ngày ban hành") + span::text').get()
        if issued_date_meta:
            try:
                date_parts = issued_date_meta.strip().split('/')
                if len(date_parts) == 3:
                    return datetime.strptime(issued_date_meta.strip(), '%d/%m/%Y').date()
            except ValueError:
                self.logger.warning(f"Invalid issued date format from meta: {issued_date_meta}")
        
        # Nếu không có trong meta, tìm trong nội dung
        issued_date_str = response.css('p[style*="text-align:right"] i::text, p[align="right"] i::text').get(default='').strip()
        if not issued_date_str:
            issued_date_str = response.xpath('//td/p[contains(@align, "right")]/i/text()').get(default='').strip()
            if not issued_date_str:
                issued_date_str = response.xpath('//td/p[@style and contains(@style, "text-align:right")]/i/text()').get(default='').strip()

        if issued_date_str:
            # Sử dụng regex để lấy ngày, tháng, năm - bỏ qua phần địa điểm
            match = re.search(r'ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})', issued_date_str)
            if match:
                day, month, year = match.groups()
                try:
                    return datetime.strptime(f"{day.zfill(2)}/{month.zfill(2)}/{year}", '%d/%m/%Y').date()
                except ValueError:
                    self.logger.warning(f"Invalid date format after parsing: {issued_date_str}")
        
        return None
        
    def extract_content(self, response):
        """Trích xuất nội dung văn bản"""
        # Thu thập nội dung từ các container tiêu chuẩn
        content_selectors = [
            'div.content1',
            'div#bodyContent',
            'div.vbContent',
            'div#divContentDoc',
            'div.cldivContentDocVn'
        ]
        
        for selector in content_selectors:
            content = response.css(f'{selector}').get()
            if content:
                if self.DEBUG_MODE:
                    self.logger.info(f"Found content with selector: {selector}")
                return content
                
        # Nếu không tìm thấy container, lấy toàn bộ nội dung từ phần tử chứa đầu tiên
        main_content = response.css('div.container, div.main-content, div#main').get()
        if main_content:
            if self.DEBUG_MODE:
                self.logger.info("Found content in main container")
            return main_content
            
        # Nếu vẫn không có, thử trích xuất từ PDF
        pdf_link = response.css('a[href*=".pdf"]::attr(href)').get()
        if pdf_link:
            if self.DEBUG_MODE:
                self.logger.info(f"Found PDF link: {pdf_link}")
            pdf_url = urljoin(response.url, pdf_link)
            try:
                pdf_response = requests.get(pdf_url, timeout=10)
                pdf_response.raise_for_status()
                with pdfplumber.open(io.BytesIO(pdf_response.content)) as pdf:
                    pdf_content = ''.join(page.extract_text() or '' for page in pdf.pages)
                    if pdf_content:
                        if self.DEBUG_MODE:
                            self.logger.info("Successfully extracted PDF content")
                        return pdf_content
            except Exception as e:
                self.logger.error(f"Error extracting PDF from {pdf_url}: {e}")
                
        # Nếu vẫn không có nội dung, lấy toàn bộ body
        body_content = response.css('body').get()
        if body_content:
            if self.DEBUG_MODE:
                self.logger.info("Using body content as fallback")
            return body_content
            
        # Không tìm thấy nội dung gì
        self.logger.error("Could not find any content")
        return None

    def after_login(self, response):
        original_url = response.meta['original_url']
        if "Đăng nhập thành công" in response.text:
            self.logger.info("Login successful. Retrying original URL.")
            yield Request(url=original_url, callback=self.parse_document)
        else:
            self.logger.error("Login failed.")

    def extract_keywords(self, title):
        if not title:
            return []
            
        words = title.lower().split()
        common_words = {'về', 'của', 'trong', 'nghị', 'định', 'luật', 'thông', 'tư', 'quyết', 'và', 'các', 'với', 'theo', 'cho', 'đến'}
        keywords = [word for word in words if word.lower() not in common_words and len(word) > 3]
        
        # Trích xuất cụm từ quan trọng
        important_phrases = []
        phrases = [
            "bảo hiểm xã hội", "thuế thu nhập", "đất đai", "nhà ở", 
            "xây dựng", "kinh doanh", "doanh nghiệp", "lao động", 
            "việc làm", "giáo dục", "y tế", "môi trường", "đầu tư",
            "chứng khoán", "ngân hàng", "tài chính", "xuất nhập khẩu"
        ]
        
        for phrase in phrases:
            if phrase in title.lower():
                important_phrases.append(phrase)
        
        # Kết hợp từ khóa đơn và cụm từ
        all_keywords = important_phrases + keywords
        return all_keywords[:10]  # Giới hạn 10 từ khóa

    def closed(self, reason):
        self.cur.close()
        self.conn.close()
        self.logger.info("Database connection closed")

    def normalize_url(self, url):
        """Chuẩn hóa URL bằng cách loại bỏ các tham số tab và các tham số không cần thiết"""
        parsed_url = urlparse(url)
        
        # Lấy các query params
        params = parse_qs(parsed_url.query)
        
        # Loại bỏ tham số 'tab'
        if 'tab' in params:
            del params['tab']
            
        # Tạo lại chuỗi query
        query_string = '&'.join([f"{k}={v[0]}" for k, v in params.items()])
        
        # Tạo lại URL
        normalized_url = parsed_url._replace(query=query_string).geturl()
        
        return normalized_url
        
    def get_base_url(self, url):
        """Lấy URL cơ bản (không bao gồm tham số query)"""
        parsed_url = urlparse(url)
        return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"