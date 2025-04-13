-- Thêm cột is_deleted vào bảng users nếu chưa tồn tại
ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT false;
UPDATE users SET is_deleted = false;

-- Cập nhật các người dùng bị xóa mềm (username bắt đầu bằng 'deleted_')
UPDATE users SET is_deleted = true WHERE username LIKE 'deleted_%'; 