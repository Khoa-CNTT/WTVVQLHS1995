-- Thêm cột purpose và notes vào bảng Appointments
ALTER TABLE Appointments ADD COLUMN IF NOT EXISTS purpose TEXT DEFAULT '';
ALTER TABLE Appointments ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Thêm index để tìm kiếm lịch hẹn nhanh hơn
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON Appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lawyer_id ON Appointments(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON Appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON Appointments(start_time);

-- Cập nhật lại các lịch hẹn hiện có (nếu có)
UPDATE Appointments 
SET purpose = 'Tư vấn pháp luật', notes = 'Tạo tự động khi cập nhật cấu trúc bảng'
WHERE purpose IS NULL OR notes IS NULL; 