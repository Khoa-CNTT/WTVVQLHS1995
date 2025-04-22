const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

// Phân loại văn bản dựa trên tiêu đề
const getDocumentType = (title) => {
  const title_lower = title.toLowerCase();
  
  if (title_lower.includes('luật') || title_lower.includes('bộ luật')) 
    return 'Luật';
  if (title_lower.includes('nghị định') || title_lower.includes('nđ-cp')) 
    return 'Nghị định';
  if (title_lower.includes('thông tư')) 
    return 'Thông tư';
  if (title_lower.includes('quyết định') || title_lower.startsWith('qđ')) 
    return 'Quyết định';
  if (title_lower.includes('nghị quyết')) 
    return 'Nghị quyết';
  if (title_lower.includes('văn bản hợp nhất') || title_lower.includes('vbhn')) 
    return 'Văn bản hợp nhất';
  if (title_lower.includes('công văn')) 
    return 'Công văn';
  if (title_lower.includes('thông báo')) 
    return 'Thông báo';
  if (title_lower.includes('dự thảo') || title_lower.includes('dự án')) 
    return 'Dự thảo';
  if (title_lower.includes('chỉ thị')) 
    return 'Chỉ thị';
  
  return 'Văn bản khác';
};

// Xác định cơ quan ban hành từ tiêu đề
const getIssuingBody = (title) => {
  const title_lower = title.toLowerCase();
  
  if (title_lower.includes('chính phủ')) 
    return 'Chính phủ';
  if (title_lower.includes('quốc hội')) 
    return 'Quốc hội';
  if (title_lower.includes('bộ tài chính') || title_lower.includes('btc')) 
    return 'Bộ Tài chính';
  if (title_lower.includes('bộ công thương')) 
    return 'Bộ Công Thương';
  if (title_lower.includes('bộ tư pháp')) 
    return 'Bộ Tư pháp';
  if (title_lower.includes('bộ lao động')) 
    return 'Bộ Lao động - Thương binh và Xã hội';
  if (title_lower.includes('bộ xây dựng')) 
    return 'Bộ Xây dựng';
  if (title_lower.includes('bộ y tế')) 
    return 'Bộ Y tế';
  if (title_lower.includes('bộ giáo dục')) 
    return 'Bộ Giáo dục và Đào tạo';
  if (title_lower.includes('bộ nội vụ')) 
    return 'Bộ Nội vụ';
  if (title_lower.includes('bộ ngoại giao')) 
    return 'Bộ Ngoại giao';
  if (title_lower.includes('bộ tài nguyên')) 
    return 'Bộ Tài nguyên và Môi trường';
  if (title_lower.includes('ngân hàng nhà nước') || title_lower.includes('nhnn')) 
    return 'Ngân hàng Nhà nước Việt Nam';
  
  return 'Chưa xác định'; // Trả về giá trị mặc định nếu không xác định được
};

/**
 * Phân tích và trích xuất ngày ban hành từ nội dung văn bản
 * @param {string} content - Nội dung cần trích xuất ngày
 * @returns {string|null} Ngày ban hành định dạng YYYY-MM-DD hoặc null nếu không tìm thấy
 */
const parseDateFromContent = (content) => {
  if (!content) return null;
  
  // Các định dạng chuẩn
  const datePatterns = [
    // Hà Nội, ngày 02 tháng 4 năm 2025
    /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i,
    
    // 02/4/2025
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    
    // ngày 02/4/2025
    /ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i,
    
    // ngày 02-4-2025
    /ngày\s+(\d{1,2})-(\d{1,2})-(\d{4})/i,
    
    // 02-4-2025
    /(\d{1,2})-(\d{1,2})-(\d{4})/,
    
    // 2025-04-02 (ISO format)
    /(\d{4})-(\d{1,2})-(\d{1,2})/
  ];
  
  // Tìm kiếm theo từng mẫu
  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      // Lấy các thành phần ngày tháng năm từ kết quả match
      let day, month, year;
      
      if (pattern.toString().includes('\\d{4})-')) {
        // Định dạng ISO
        [, year, month, day] = match;
      } else {
        // Các định dạng khác
        [, day, month, year] = match;
      }
      
      // Chuyển đổi thành số
      day = parseInt(day, 10);
      month = parseInt(month, 10);
      year = parseInt(year, 10);
      
      // Kiểm tra tính hợp lệ của ngày tháng
      if (month < 1 || month > 12) continue;
      if (day < 1 || day > 31) continue;
      if (year < 1900 || year > 2100) continue;
      
      // Định dạng lại thành YYYY-MM-DD
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }
  
  // Không tìm thấy định dạng ngày hợp lệ
  return null;
};

/**
 * Thu thập dữ liệu hợp đồng từ trang thuvienphapluat.vn
 * @param {number} limit - Số lượng hợp đồng cần thu thập
 * @returns {Promise<Array>} Danh sách hợp đồng đã thu thập
 */
const scrapeContracts = async (limit = 10) => {
  try {
    console.log(`Bắt đầu thu thập ${limit} hợp đồng từ thuvienphapluat.vn...`);
    
    // URLs thu thập dữ liệu - sử dụng nhiều trang hợp đồng
    const urls = [
      'https://thuvienphapluat.vn/hopdong',
      'https://thuvienphapluat.vn/hop-dong/Thue/13/',
      'https://thuvienphapluat.vn/hop-dong/Mua-Ban/1/',
      'https://thuvienphapluat.vn/hop-dong/Lao-dong/3/'
    ];
    
    const contracts = [];
    
    // Lặp qua các URL để thu thập dữ liệu từ nhiều trang
    for (const url of urls) {
      if (contracts.length >= limit) break;
      
      console.log(`Đang gửi yêu cầu HTTP đến: ${url}`);
      
      // Thêm timeout và headers để mô phỏng trình duyệt
      const config = {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      };
      
      try {
        // Gửi request để lấy trang
        const response = await axios.get(url, config);
        
        console.log(`Đã nhận phản hồi từ server: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers['content-type']}`);
        console.log(`Kích thước dữ liệu: ${response.data ? response.data.length : 0} bytes`);
        
        // Load dữ liệu HTML vào cheerio
        const $ = cheerio.load(response.data);
        
        // Tìm tất cả các liên kết có chứa "/hopdong/" hoặc "/hop-dong/"
        console.log('Tìm kiếm các liên kết hợp đồng...');
        
        // Lấy tất cả các liên kết
        const allLinks = $('a');
        console.log(`Tổng số liên kết trên trang: ${allLinks.length}`);
        
        // Lọc các liên kết có chứa /hopdong/ hoặc /hop-dong/ và chưa có trong danh sách contracts
        const contractLinks = allLinks.filter((i, el) => {
          const href = $(el).attr('href');
          return href && (href.includes('/hopdong/') || href.includes('/hop-dong/'));
        });
        
        console.log(`Tìm thấy ${contractLinks.length} liên kết hợp đồng`);
        
        contractLinks.each((index, element) => {
          if (contracts.length >= limit) return false;
          
          const title = $(element).text().trim();
          const href = $(element).attr('href');
          
          // Bỏ qua nếu không có tiêu đề hoặc tiêu đề quá ngắn (có thể là nút điều hướng)
          if (!title || title.length < 10) return;
          
          const url = href.startsWith('http') ? href : `https://thuvienphapluat.vn${href}`;
          
          // Kiểm tra trùng lặp
          const isDuplicate = contracts.some(doc => doc.url === url || doc.title === title);
          
          if (!isDuplicate) {
            console.log(`Đã tìm thấy hợp đồng: "${title}" - ${url}`);
            
            contracts.push({
              title,
              url,
              created_at: new Date()
            });
          }
        });
        
        console.log(`Đã thu thập được ${contracts.length}/${limit} hợp đồng từ ${url}`);
        
      } catch (urlError) {
        console.error(`Lỗi khi xử lý URL ${url}:`, urlError.message);
      }
    }
    
    console.log(`Tổng cộng: Thu thập được ${contracts.length} hợp đồng.`);

    return contracts.slice(0, limit); // Đảm bảo không vượt quá limit
  } catch (error) {
    console.error('Lỗi khi thu thập hợp đồng:', error);
    
    // Log thêm thông tin chi tiết về lỗi
    if (error.response) {
      // Lỗi từ server (trả về mã lỗi)
      console.error(`Lỗi phản hồi từ server: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      // Lỗi không nhận được phản hồi
      console.error('Không nhận được phản hồi từ server');
    } else {
      // Các lỗi khác (ví dụ: lỗi cú pháp)
      console.error(`Lỗi khác: ${error.message}`);
    }
    
    throw error;
  }
};

/**
 * Thu thập dữ liệu văn bản pháp luật từ API của thuvienphapluat.vn
 * @param {number} limit - Số lượng văn bản cần thu thập
 * @returns {Promise<Array>} Danh sách văn bản đã thu thập
 */
const scrapeLegalDocumentsFromAPI = async (limit = 10) => {
  try {
    console.log(`Bắt đầu thu thập ${limit} văn bản pháp luật từ API thuvienphapluat.vn...`);
    
    // API endpoint
    const apiUrl = 'https://thuvienphapluat.vn/api/GetVanBans?';
    
    // Tham số mặc định
    const params = {
      page: 1,
      pageSize: limit,
      sort: 'date',
      view: 'multi',
      type: 'all',
      _: Date.now() // Cache busting
    };
    
    // Xây dựng URL cho request
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const url = apiUrl + queryString;
    
    console.log(`Đang gửi yêu cầu API đến: ${url}`);
    
    // Headers mô phỏng trình duyệt
    const config = {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://thuvienphapluat.vn/page/tim-van-ban.aspx',
        'Origin': 'https://thuvienphapluat.vn'
      }
    };
    
    // Gửi request đến API
    const response = await axios.get(url, config);
    
    console.log(`Đã nhận phản hồi từ API: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    // Nếu có dữ liệu JSON từ API
    if (response.data && response.data.html) {
      console.log(`Nhận được dữ liệu HTML từ API (${response.data.html.length} bytes)`);
      
      // Parse HTML từ API response
      const $ = cheerio.load(response.data.html);
      const documents = [];
      
      $('.vb-item').each((index, element) => {
        try {
          const titleElement = $(element).find('.vb-title a');
          const title = titleElement.text().trim();
          const href = titleElement.attr('href');
          const url = href.startsWith('http') ? href : `https://thuvienphapluat.vn${href}`;
          
          // Thêm thông tin bổ sung
          const infoElement = $(element).find('.vb-subtitle');
          const documentInfo = infoElement.text().trim();
          
          console.log(`Đã tìm thấy văn bản qua API: "${title}" - ${url}`);
          
          documents.push({
            title,
            url,
            info: documentInfo,
            created_at: new Date()
          });
        } catch (elementError) {
          console.error('Lỗi khi xử lý phần tử văn bản:', elementError);
        }
      });
      
      console.log(`Thu thập được ${documents.length} văn bản pháp luật từ API.`);
      return documents;
    } else {
      console.log('Không tìm thấy dữ liệu HTML trong phản hồi API');
      return [];
    }
  } catch (error) {
    console.error('Lỗi khi thu thập văn bản pháp luật từ API:', error);
    return []; // Trả về mảng rỗng thay vì throw error để có thể tiếp tục với phương pháp scraping HTML
  }
};

/**
 * Thu thập dữ liệu văn bản pháp luật từ trang thuvienphapluat.vn
 * @param {number} limit - Số lượng văn bản cần thu thập
 * @returns {Promise<Array>} Danh sách văn bản đã thu thập
 */
const scrapeLegalDocuments = async (limit = 10) => {
  try {
    console.log(`Bắt đầu thu thập ${limit} văn bản pháp luật từ thuvienphapluat.vn...`);
    
    // Thử phương pháp API trước
    let documents = await scrapeLegalDocumentsFromAPI(limit);
    
    // Nếu API không trả về kết quả, thử phương pháp scraping HTML
    if (documents.length === 0) {
      console.log('Không lấy được dữ liệu từ API, đang chuyển sang phương pháp scraping HTML...');
      
      // URL thu thập dữ liệu - sử dụng trang chủ thay vì trang tìm kiếm
      const urls = [
        'https://thuvienphapluat.vn/',
        'https://thuvienphapluat.vn/van-ban/Bo-may-hanh-chinh/',
        'https://thuvienphapluat.vn/van-ban/Doanh-nghiep/',
        'https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/'
      ];
      
      documents = [];
      
      // Lặp qua các URL để thu thập dữ liệu từ nhiều trang
      for (const url of urls) {
        if (documents.length >= limit) break;
        
        console.log(`Đang gửi yêu cầu HTTP đến: ${url}`);
        
        // Thêm timeout và headers để mô phỏng trình duyệt
        const config = {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        };
        
        try {
          // Gửi request để lấy trang
          const response = await axios.get(url, config);
          
          console.log(`Đã nhận phản hồi từ server: ${response.status} ${response.statusText}`);
          console.log(`Content-Type: ${response.headers['content-type']}`);
          console.log(`Kích thước dữ liệu: ${response.data ? response.data.length : 0} bytes`);
          
          // Load dữ liệu HTML vào cheerio
          const $ = cheerio.load(response.data);
          
          // Phương pháp 1: Tìm tất cả các liên kết có chứa "/vbpq/"
          console.log('Tìm kiếm các liên kết văn bản pháp quy...');
          
          // Lấy tất cả các liên kết
          const allLinks = $('a');
          console.log(`Tổng số liên kết trên trang: ${allLinks.length}`);
          
          // Lọc các liên kết có chứa /vbpq/ và chưa có trong danh sách documents
          const vbpqLinks = allLinks.filter((i, el) => {
            const href = $(el).attr('href');
            return href && (href.includes('/vbpq/') || href.includes('/van-ban/'));
          });
          
          console.log(`Tìm thấy ${vbpqLinks.length} liên kết văn bản pháp quy`);
          
          vbpqLinks.each((index, element) => {
            if (documents.length >= limit) return false;
            
            const title = $(element).text().trim();
            const href = $(element).attr('href');
            
            // Bỏ qua nếu không có tiêu đề hoặc tiêu đề quá ngắn (có thể là nút điều hướng)
            if (!title || title.length < 15) return;
            
            const url = href.startsWith('http') ? href : `https://thuvienphapluat.vn${href}`;
            
            // Kiểm tra trùng lặp
            const isDuplicate = documents.some(doc => doc.url === url || doc.title === title);
            
            if (!isDuplicate) {
              console.log(`Đã tìm thấy văn bản pháp quy: "${title}" - ${url}`);
              
              documents.push({
                title,
                url,
                created_at: new Date()
              });
            }
          });
          
          console.log(`Đã thu thập được ${documents.length}/${limit} văn bản pháp luật từ ${url}`);
          
        } catch (urlError) {
          console.error(`Lỗi khi xử lý URL ${url}:`, urlError.message);
        }
      }
      
      console.log(`Thu thập được ${documents.length} văn bản pháp luật từ HTML.`);
    }
    
    console.log(`Tổng cộng: Thu thập được ${documents.length} văn bản pháp luật.`);
    
    return documents.slice(0, limit); // Đảm bảo không vượt quá limit
  } catch (error) {
    console.error('Lỗi khi thu thập văn bản pháp luật:', error);
    
    // Log thêm thông tin chi tiết về lỗi
    if (error.response) {
      // Lỗi từ server (trả về mã lỗi)
      console.error(`Lỗi phản hồi từ server: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      // Lỗi không nhận được phản hồi
      console.error('Không nhận được phản hồi từ server');
    } else {
      // Các lỗi khác (ví dụ: lỗi cú pháp)
      console.error(`Lỗi khác: ${error.message}`);
    }
    
    throw error;
  }
};

/**
 * Lưu danh sách hợp đồng vào cơ sở dữ liệu
 * @param {Array} contracts - Danh sách hợp đồng
 * @returns {Promise<number>} - Số lượng hợp đồng đã lưu thành công
 */
async function saveContractsToDatabase(contracts) {
  let savedCount = 0;
  
  try {
    if (!Array.isArray(contracts) || contracts.length === 0) {
      console.log('Không có hợp đồng nào để lưu vào cơ sở dữ liệu');
      return 0;
    }

    console.log(`Bắt đầu lưu ${contracts.length} hợp đồng vào cơ sở dữ liệu...`);

    // Lặp qua từng hợp đồng và lưu vào cơ sở dữ liệu
    for (const contract of contracts) {
      try {
        // Kiểm tra nếu hợp đồng đã tồn tại trong cơ sở dữ liệu
        const checkExistingQuery = `
          SELECT id FROM DocumentTemplates 
          WHERE title = $1 AND template_type = 'contract'
        `;
        
        const existingResult = await pool.query(checkExistingQuery, [contract.title]);
        
        if (existingResult.rows.length > 0) {
          console.log(`Hợp đồng "${contract.title}" đã tồn tại trong cơ sở dữ liệu`);
          continue;
        }
        
        // Lấy nội dung HTML từ URL của hợp đồng
        let contentHtml = '';
        try {
          console.log(`Đang tải nội dung từ ${contract.url}...`);
          
          const response = await axios.get(contract.url, {
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
            }
          });
          
          // Parse HTML với cheerio
          const $ = cheerio.load(response.data);
          
          // Tìm nội dung chính của hợp đồng
          const contentElement = $('.vbContent, .doc-content, .content1, .contract-content, #divContentHD');
          
          if (contentElement.length > 0) {
            contentHtml = contentElement.html();
            
            // Kiểm tra nếu nội dung chỉ là thông báo cập nhật
            const textContent = contentElement.text().trim().toLowerCase();
            if (
              textContent.includes('đang cập nhật') || 
              textContent.includes('bạn vui lòng') ||
              textContent.includes('tải về') ||
              textContent.includes('nhận thông báo qua email') ||
              textContent.length < 100 // Nội dung quá ngắn có thể là thông báo
            ) {
              console.log(`Bỏ qua hợp đồng "${contract.title}" vì nội dung không khả dụng`);
              continue;
            }
          } else {
            console.log(`Không tìm thấy nội dung cho hợp đồng "${contract.title}", bỏ qua`);
            continue;
          }
        } catch (fetchError) {
          console.error(`Lỗi khi lấy nội dung từ ${contract.url}:`, fetchError.message);
          continue; // Bỏ qua nếu không lấy được nội dung
        }

        // Thêm hợp đồng vào bảng DocumentTemplates
        const insertQuery = `
          INSERT INTO DocumentTemplates(
            title,
            template_type,
            content,
            language
          )
          VALUES($1, $2, $3, $4)
          RETURNING id
        `;
        
        const values = [
          contract.title,
          'contract',  // Mẫu hợp đồng
          contentHtml, // Lưu trực tiếp nội dung HTML
          'vi'  // Mặc định là tiếng Việt
        ];
        
        const result = await pool.query(insertQuery, values);
        
        if (result.rows.length > 0) {
          savedCount++;
          console.log(`Đã lưu hợp đồng: ${contract.title}`);
        }
      } catch (error) {
        console.error(`Lỗi khi lưu hợp đồng "${contract.title}":`, error);
        // Tiếp tục với hợp đồng tiếp theo nếu có lỗi
      }
    }
    
    console.log(`Đã lưu thành công ${savedCount}/${contracts.length} hợp đồng vào bảng DocumentTemplates`);
    return savedCount;
    
  } catch (error) {
    console.error('Lỗi khi lưu hợp đồng vào cơ sở dữ liệu:', error);
    return savedCount;
  }
}

/**
 * Lưu danh sách văn bản pháp luật vào bảng LegalDocuments trong cơ sở dữ liệu
 * @param {Array} documents - Danh sách văn bản pháp luật
 * @returns {Promise<number>} - Số lượng văn bản đã lưu thành công
 */
async function saveLegalDocumentsToDatabase(documents) {
  let savedCount = 0;
  
  try {
    if (!Array.isArray(documents) || documents.length === 0) {
      console.log('Không có văn bản nào để lưu vào cơ sở dữ liệu');
      return 0;
    }

    console.log(`Bắt đầu lưu ${documents.length} văn bản vào bảng LegalDocuments...`);

    // Lặp qua từng văn bản và lưu vào cơ sở dữ liệu
    for (const doc of documents) {
      try {
        // Kiểm tra nếu văn bản đã tồn tại trong cơ sở dữ liệu
        const checkExistingQuery = `
          SELECT id FROM LegalDocuments 
          WHERE title = $1
        `;
        
        const existingResult = await pool.query(checkExistingQuery, [doc.title]);
        
        if (existingResult.rows.length > 0) {
          console.log(`Văn bản "${doc.title}" đã tồn tại trong cơ sở dữ liệu`);
          continue;
        }
        
        // Xác định loại văn bản và cơ quan ban hành dựa trên tiêu đề
        const document_type = getDocumentType(doc.title);
        const issuing_body = getIssuingBody(doc.title);
        
        // Lấy nội dung HTML từ URL
        let contentHtml = '';
        let textContent = '';
        
        try {
          console.log(`Đang tải nội dung từ ${doc.url}...`);
          
          const response = await axios.get(doc.url, {
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
            }
          });
          
          // Parse HTML với cheerio
          const $ = cheerio.load(response.data);
          
          // Tìm nội dung chính của văn bản
          // Các class thường dùng trên thuvienphapluat.vn
          const contentElement = $('.vbContent, .doc-content, .content1, .văn-bản-content, #divContentHD');
          
          if (contentElement.length > 0) {
            contentHtml = contentElement.html();
            textContent = contentElement.text().trim();
            
            // Kiểm tra nếu nội dung chỉ là thông báo cập nhật
            const lowercaseContent = textContent.toLowerCase();
            if (
              lowercaseContent.includes('đang cập nhật') || 
              lowercaseContent.includes('bạn vui lòng') ||
              lowercaseContent.includes('tải về') ||
              lowercaseContent.includes('nhận thông báo qua email') ||
              lowercaseContent.length < 100 // Nội dung quá ngắn có thể là thông báo
            ) {
              console.log(`Bỏ qua văn bản "${doc.title}" vì nội dung không khả dụng`);
              continue;
            }
          } else {
            console.log(`Không tìm thấy nội dung cho văn bản "${doc.title}", bỏ qua`);
            continue;
          }
        } catch (fetchError) {
          console.error(`Lỗi khi lấy nội dung từ ${doc.url}:`, fetchError.message);
          continue; // Bỏ qua nếu không lấy được nội dung
        }
        
        // Tạo tóm tắt (có thể cải thiện sau này bằng AI)
        const summary = `Văn bản ${doc.title}. Loại: ${document_type}. Cơ quan ban hành: ${issuing_body || 'Chưa xác định'}.`;
        
        // Trích xuất ngày ban hành từ nội dung
        let issued_date = parseDateFromContent(textContent);
        console.log(`Ngày ban hành được trích xuất từ văn bản "${doc.title}": ${issued_date || 'Không tìm thấy'}`);
        
        // Nếu không trích xuất được, sử dụng ngày hiện tại
        if (!issued_date) {
          issued_date = new Date().toISOString().split('T')[0];
          console.log(`Sử dụng ngày hiện tại làm ngày ban hành: ${issued_date}`);
        }
        
        // Thêm văn bản vào bảng LegalDocuments
        const insertQuery = `
          INSERT INTO LegalDocuments(
            title,
            document_type,
            issuing_body,
            version,
            content,
            summary,
            issued_date,
            language,
            source_url,
            created_at
          )
          VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `;
        
        const values = [
          doc.title,
          document_type,
          issuing_body,
          '1.0',  // Version mặc định
          contentHtml, // Lưu trực tiếp nội dung HTML
          summary,
          issued_date,
          'vi',  // Mặc định là tiếng Việt
          doc.url,
          new Date()
        ];
        
        const result = await pool.query(insertQuery, values);
        
        if (result.rows.length > 0) {
          savedCount++;
          console.log(`Đã lưu văn bản: ${doc.title}`);
          
          // Thêm từ khóa cho văn bản nếu có thể
          try {
            // Trích xuất các từ khóa từ tiêu đề
            const documentId = result.rows[0].id;
            const title_keywords = doc.title.split(/\s+/)
              .filter(word => word.length > 4)  // Chỉ lấy từ có ít nhất 5 ký tự
              .filter(word => !['trong', 'ngoài', 'được', 'những', 'rằng', 'theo', 'ngày', 'tháng', 'năm'].includes(word.toLowerCase()))
              .slice(0, 5);  // Giới hạn 5 từ khóa
            
            if (title_keywords.length > 0) {
              for (const keyword of title_keywords) {
                await pool.query(
                  'INSERT INTO LegalKeywords(document_id, keyword) VALUES($1, $2) ON CONFLICT DO NOTHING',
                  [documentId, keyword]
                );
              }
            }
          } catch (keywordError) {
            console.error(`Lỗi khi thêm từ khóa cho văn bản: ${keywordError.message}`);
            // Tiếp tục xử lý văn bản tiếp theo
          }
        }
      } catch (error) {
        console.error(`Lỗi khi lưu văn bản "${doc.title}":`, error);
        // Tiếp tục với văn bản tiếp theo nếu có lỗi
      }
    }
    
    console.log(`Đã lưu thành công ${savedCount}/${documents.length} văn bản vào bảng LegalDocuments`);
    return savedCount;
    
  } catch (error) {
    console.error('Lỗi khi lưu văn bản vào cơ sở dữ liệu:', error);
    return savedCount;
  }
}

module.exports = {
  scrapeContracts,
  scrapeLegalDocuments,
  scrapeLegalDocumentsFromAPI,
  saveContractsToDatabase,
  saveLegalDocumentsToDatabase
}; 