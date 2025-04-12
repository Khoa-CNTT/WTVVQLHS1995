-- Thêm cột is_deleted vào bảng users nếu chưa tồn tại
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE users
        ADD COLUMN is_deleted BOOLEAN DEFAULT false;
        
        -- Cập nhật dữ liệu hiện có
        UPDATE users
        SET is_deleted = false;
    END IF;
END
$$; 