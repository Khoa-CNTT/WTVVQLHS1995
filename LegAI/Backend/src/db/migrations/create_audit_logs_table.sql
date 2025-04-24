-- Migration: Tạo bảng AuditLogs để lưu các hoạt động và thông báo
CREATE TABLE IF NOT EXISTS AuditLogs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES Users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id INTEGER,
  details TEXT,
  notification_shown BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index để tăng tốc truy vấn
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON AuditLogs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON AuditLogs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_notification_shown ON AuditLogs(notification_shown);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON AuditLogs(created_at);

-- Comment giải thích bảng và các cột
COMMENT ON TABLE AuditLogs IS 'Lưu trữ các hoạt động quan trọng và thông báo cho người dùng';
COMMENT ON COLUMN AuditLogs.user_id IS 'ID của người dùng thực hiện hành động';
COMMENT ON COLUMN AuditLogs.action IS 'Loại hành động (ví dụ: AUTO_UPDATE, NODE_SCRAPE)';
COMMENT ON COLUMN AuditLogs.table_name IS 'Tên bảng liên quan đến hành động';
COMMENT ON COLUMN AuditLogs.record_id IS 'ID của bản ghi liên quan';
COMMENT ON COLUMN AuditLogs.details IS 'Chi tiết về hành động';
COMMENT ON COLUMN AuditLogs.notification_shown IS 'Thông báo đã được hiển thị cho người dùng hay chưa';
COMMENT ON COLUMN AuditLogs.created_at IS 'Thời gian tạo bản ghi'; 