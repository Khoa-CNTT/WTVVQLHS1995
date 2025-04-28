const { Pool } = require('pg');
const fs = require('fs').promises;

// Thông tin kết nối PostgreSQL
const pool = new Pool({
  user: 'postgres',          // Thay bằng tên người dùng PostgreSQL
  host: 'localhost',             // Host (localhost nếu chạy local)
  database: 'legai', // Thay bằng tên cơ sở dữ liệu
  password: '123456',      // Thay bằng mật khẩu
  port: 5432                       // Port mặc định của PostgreSQL
});

// Danh sách các bảng cần xuất
const requiredTables = [
  'legaldocuments',   // Chuyển thành chữ thường để khớp với PostgreSQL
  'legalkeywords',
  'aiconsultations',
  'documenttemplates',
  'feereferences'
];

// Hàm kiểm tra bảng có tồn tại
async function checkTableExists(tableName) {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    `, [tableName]);
    return res.rows.length > 0;
  } catch (err) {
    console.error(`Lỗi khi kiểm tra bảng ${tableName}:`, err.message);
    return false;
  }
}

// Hàm lấy dữ liệu từ một bảng
async function fetchTableData(tableName) {
  try {
    const res = await pool.query(`SELECT * FROM "${tableName}"`);
    return res.rows;
  } catch (err) {
    console.error(`Lỗi khi lấy dữ liệu từ bảng ${tableName}:`, err.message);
    return [];
  }
}

// Hàm xuất dữ liệu sang file JSON
async function exportToJson(outputFile) {
  try {
    // Tạo object để lưu dữ liệu
    const allData = {};

    // Lấy dữ liệu từ các bảng cần thiết
    for (const table of requiredTables) {
      console.log(`Đang kiểm tra bảng: ${table}`);
      const tableExists = await checkTableExists(table);
      if (!tableExists) {
        console.log(`Bảng ${table} không tồn tại trong cơ sở dữ liệu.`);
        allData[table] = [];
        continue;
      }

      console.log(`Đang xử lý bảng: ${table}`);
      const data = await fetchTableData(table);
      allData[table] = data;
      console.log(`Hoàn tất xử lý bảng ${table}: ${data.length} bản ghi`);
    }

    // Kiểm tra xem có dữ liệu nào được xuất không
    if (Object.values(allData).every(data => data.length === 0)) {
      console.log('Không có dữ liệu để xuất từ các bảng được chỉ định.');
      return;
    }

    // Ghi dữ liệu vào file JSON
    await fs.writeFile(outputFile, JSON.stringify(allData, null, 2), { encoding: 'utf8' });
    console.log(`Dữ liệu đã được xuất ra file: ${outputFile}`);
  } catch (err) {
    console.error('Lỗi khi xuất dữ liệu:', err.message);
  } finally {
    // Đóng kết nối
    await pool.end();
    console.log('Đã đóng kết nối PostgreSQL.');
  }
}

// Chạy hàm xuất dữ liệu
exportToJson('legal_data.json');