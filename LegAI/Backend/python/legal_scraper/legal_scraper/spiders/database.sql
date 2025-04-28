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
CREATE TABLE IF NOT EXISTS ScrapedUrls (
    url TEXT PRIMARY KEY,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng LegalCases
CREATE TABLE LegalCases (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng Contracts
CREATE TABLE Contracts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    contract_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    signature VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

-- Bảng Transactions
CREATE TABLE Transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    lawyer_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (lawyer_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng AuditLogs
CREATE TABLE AuditLogs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

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
    case_type VARCHAR(50) NOT NULL,
    base_fee DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    description TEXT
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


-- Cập nhật dữ liệu hiện có trong bảng Appointments
UPDATE Appointments 
SET purpose = 'Tư vấn pháp luật', notes = 'Tạo tự động khi cập nhật cấu trúc bảng'
WHERE purpose IS NULL OR notes IS NULL;