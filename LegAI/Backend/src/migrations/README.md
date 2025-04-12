# Migration Guide

File này chứa các hướng dẫn để chạy migration database trong ứng dụng LegAI.

## Thêm cột is_deleted

File migration `add_is_deleted_column.sql` thêm cột `is_deleted` vào bảng `users` để hỗ trợ tính năng xóa mềm (soft delete).

### Chạy migration

```bash
# Di chuyển vào thư mục migration
cd src/migrations

# Chạy script migration
node run_migrations.js
```

### Migration thủ công

Nếu bạn muốn chạy migration thủ công thông qua PostgreSQL:

```sql
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
```

## Giải thích chức năng Soft Delete

Soft Delete là một kỹ thuật xóa mềm, giúp:

1. Không xóa dữ liệu hoàn toàn khỏi database
2. Đánh dấu bản ghi là "đã xóa" thông qua cột `is_deleted`
3. Dữ liệu không hiển thị trong ứng dụng nhưng vẫn được giữ lại trong database
4. Tránh lỗi ràng buộc khóa ngoại (foreign key constraint)
5. Có thể khôi phục dữ liệu nếu cần 