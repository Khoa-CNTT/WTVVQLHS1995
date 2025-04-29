-- Kiểm tra và cập nhật bảng LegalCases
DO $$
BEGIN
    -- Kiểm tra xem cột file_url đã tồn tại trong bảng LegalCases chưa
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'legalcases'
        AND column_name = 'file_url'
    ) THEN
        -- Thêm cột file_url vào bảng LegalCases nếu chưa tồn tại
        ALTER TABLE LegalCases ADD COLUMN file_url VARCHAR(255);
        RAISE NOTICE 'Đã thêm cột file_url vào bảng LegalCases';
    ELSE
        RAISE NOTICE 'Cột file_url đã tồn tại trong bảng LegalCases';
    END IF;
END $$;

-- Cập nhật các trường khác nếu cần
ALTER TABLE LegalCases ALTER COLUMN is_ai_generated SET DEFAULT false;

-- Tạo chỉ mục cho file_url nếu cần tìm kiếm theo đường dẫn file
CREATE INDEX IF NOT EXISTS idx_legal_cases_file_url ON LegalCases (file_url);

-- Ghi chú về việc sử dụng bảng
COMMENT ON COLUMN LegalCases.file_url IS 'Đường dẫn tới file đính kèm của vụ án'; 