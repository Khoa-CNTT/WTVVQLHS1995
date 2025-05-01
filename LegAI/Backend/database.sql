-- Bảng Users
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    full_name VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    failed_attempts INT NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE
);

-- Bảng UserProfiles
CREATE TABLE UserProfiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) NOT NULL,
    bio TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng LegalDocuments
CREATE TABLE LegalDocuments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_number VARCHAR(100),         -- Số hiệu văn bản
    issuing_body VARCHAR(200),            -- Cơ quan ban hành
    version VARCHAR(20),                  -- Phiên bản văn bản
    content TEXT NOT NULL,                -- Nội dung đầy đủ
    summary TEXT,                         -- Tóm tắt nội dung
    issued_date DATE NOT NULL,            -- Ngày ban hành
    effective_date DATE,                  -- Ngày hiệu lực
    expiry_date DATE,                     -- Ngày hết hiệu lực
    language VARCHAR(10) NOT NULL,        -- Ngôn ngữ (vi, en, ...)
    source_url TEXT,                      -- Link tham khảo nguồn văn bản
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng LegalKeywords
CREATE TABLE LegalKeywords (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES LegalDocuments(id) ON DELETE CASCADE,
    UNIQUE (document_id, keyword) -- Một keyword không được trùng trong cùng một tài liệu
);

-- Bảng LegalCases
CREATE TABLE LegalCases (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    lawyer_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(255),
    case_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    ai_content TEXT,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    fee_amount DECIMAL(12, 2),
    fee_details JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (lawyer_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng Contracts
CREATE TABLE Contracts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    contract_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    signature VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng Appointments
CREATE TABLE Appointments (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    lawyer_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    purpose TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    case_id INTEGER REFERENCES LegalCases(id),
    appointment_type VARCHAR(50) DEFAULT 'consultation',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (lawyer_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng AIConsultations
CREATE TABLE AIConsultations (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng LiveChats
CREATE TABLE LiveChats (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    lawyer_id INT,
    status VARCHAR(50) NOT NULL DEFAULT 'waiting', -- 'waiting', 'active', 'closed'
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (lawyer_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- Bảng ChatMessages
CREATE TABLE ChatMessages (
    id SERIAL PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES LiveChats(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Tạo bảng Transactions để lưu thông tin giao dịch thanh toán
CREATE TABLE IF NOT EXISTS Transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id),
    lawyer_id INTEGER REFERENCES Users(id),
    case_id INTEGER REFERENCES LegalCases(id),
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    description TEXT,
    fee_details JSONB,
    payment_provider VARCHAR(100),
    transaction_code VARCHAR(100),
    payment_details JSONB,
    confirmation_notes TEXT,
    confirmation_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tạo bảng BankAccounts để lưu thông tin tài khoản ngân hàng
CREATE TABLE IF NOT EXISTS BankAccounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id),
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(100) NOT NULL,
    branch VARCHAR(100),
    is_default BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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

-- Bảng LawyerDetails
CREATE TABLE LawyerDetails (
    id SERIAL PRIMARY KEY,
    lawyer_id INT NOT NULL,
    certification VARCHAR(255) NOT NULL,
    experience_years INT NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    rating DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lawyer_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng DigitalSignatures
CREATE TABLE DigitalSignatures (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL,
    user_id INT NOT NULL,
    signature_hash VARCHAR(255) NOT NULL,
    signed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (contract_id) REFERENCES Contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng DocumentTemplates
CREATE TABLE DocumentTemplates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    language VARCHAR(50) NOT NULL
);

-- Bảng LawyerAvailability
CREATE TABLE LawyerAvailability (
    id SERIAL PRIMARY KEY,
    lawyer_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (lawyer_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng FeeReferences
CREATE TABLE FeeReferences (
    id SERIAL PRIMARY KEY,
    case_type VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    base_fee DECIMAL(12, 2) NOT NULL,
    percentage_fee DECIMAL(5, 2) DEFAULT 0,
    calculation_method VARCHAR(50) DEFAULT 'fixed',
    min_fee DECIMAL(12, 2),
    max_fee DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm index để tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON Appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lawyer_id ON Appointments(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON Appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON Appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_livechats_customer_id ON LiveChats(customer_id);
CREATE INDEX IF NOT EXISTS idx_livechats_lawyer_id ON LiveChats(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON Transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_lawyer_id ON Transactions(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_legalkeywords_document_id ON LegalKeywords(document_id);
CREATE INDEX IF NOT EXISTS idx_legalkeywords_keyword ON LegalKeywords(keyword);
CREATE INDEX IF NOT EXISTS idx_legal_cases_user_id ON LegalCases(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_lawyer_id ON LegalCases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_case_type ON LegalCases(case_type);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON LegalCases(status);
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON CaseDocuments(case_id);
CREATE INDEX IF NOT EXISTS idx_fee_references_case_type ON FeeReferences(case_type);
CREATE INDEX IF NOT EXISTS idx_transactions_case_id ON Transactions(case_id);

-- Cập nhật dữ liệu hiện có trong bảng Appointments
UPDATE Appointments 
SET purpose = 'Tư vấn pháp luật', notes = 'Tạo tự động khi cập nhật cấu trúc bảng'
WHERE purpose IS NULL OR notes IS NULL;

-- Bảng quản lý hồ sơ pháp lý cá nhân
CREATE TABLE UserLegalDocs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    file_type VARCHAR(20) NOT NULL, -- pdf, docx, jpg, png, etc.
    file_url VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    thumbnail_url VARCHAR(255),
    is_encrypted BOOLEAN DEFAULT TRUE,
    encryption_key VARCHAR(255),
    access_level VARCHAR(50) DEFAULT 'private', -- private, shared, public
    metadata JSONB, -- Lưu trữ dữ liệu phân tích từ AI
    tags TEXT[], -- Từ khóa tìm kiếm
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng quản lý quyền truy cập vào hồ sơ pháp lý cá nhân (để chia sẻ hồ sơ)
CREATE TABLE UserLegalDocAccess (
    id SERIAL PRIMARY KEY,
    doc_id INT NOT NULL,
    granted_to INT NOT NULL, -- user_id được cấp quyền
    granted_by INT NOT NULL, -- user_id cấp quyền
    access_type VARCHAR(50) NOT NULL, -- read, edit, delete
    valid_until TIMESTAMP, -- NULL = vĩnh viễn
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doc_id) REFERENCES UserLegalDocs(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_to) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES Users(id) ON DELETE CASCADE
);

-- Thêm index để tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_user_legal_docs_user_id ON UserLegalDocs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_legal_docs_category ON UserLegalDocs(category);
CREATE INDEX IF NOT EXISTS idx_user_legal_docs_tags ON UserLegalDocs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_legal_docs_metadata ON UserLegalDocs USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_user_legal_doc_access_doc_id ON UserLegalDocAccess(doc_id);
CREATE INDEX IF NOT EXISTS idx_user_legal_doc_access_granted_to ON UserLegalDocAccess(granted_to);

-- Bảng tài liệu vụ án
-- CREATE TABLE IF NOT EXISTS CaseDocuments (
--   id SERIAL PRIMARY KEY,
--   case_id INTEGER REFERENCES LegalCases(id) NOT NULL,
--   original_name VARCHAR(255) NOT NULL,
--   file_path VARCHAR(255) NOT NULL,
--   mime_type VARCHAR(100),
--   encryption_key VARCHAR(255),
--   size INTEGER,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   deleted_at TIMESTAMP
-- );

-- Thêm dữ liệu mẫu cho bảng phí
INSERT INTO FeeReferences (case_type, description, base_fee, percentage_fee, calculation_method, min_fee, max_fee)
VALUES 
  ('civil', 'Vụ án dân sự', 2000000, 1.5, 'percentage', 2000000, 100000000),
  ('criminal', 'Vụ án hình sự', 5000000, 0, 'fixed', 5000000, 50000000),
  ('administrative', 'Vụ án hành chính', 3000000, 1.0, 'percentage', 3000000, 50000000),
  ('labor', 'Tranh chấp lao động', 1500000, 2.0, 'percentage', 1500000, 30000000),
  ('commercial', 'Tranh chấp thương mại', 3000000, 2.5, 'percentage', 3000000, 150000000),
  ('land', 'Tranh chấp đất đai', 4000000, 1.8, 'percentage', 4000000, 100000000),
  ('divorce', 'Ly hôn và chia tài sản', 3500000, 2.0, 'percentage', 3500000, 50000000),
  ('intellectual', 'Sở hữu trí tuệ', 5000000, 3.0, 'percentage', 5000000, 200000000);

-- Bổ sung trường case_id vào bảng Transactions nếu chưa có
ALTER TABLE Transactions ADD COLUMN IF NOT EXISTS case_id INTEGER REFERENCES LegalCases(id);

-- Bổ sung trường case_id vào bảng Appointments nếu chưa có
ALTER TABLE Appointments ADD COLUMN IF NOT EXISTS case_id INTEGER REFERENCES LegalCases(id);
ALTER TABLE Appointments ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'consultation';

-- Bổ sung trường payment_info vào bảng Transactions nếu chưa có
ALTER TABLE Transactions ADD COLUMN IF NOT EXISTS payment_info JSONB;