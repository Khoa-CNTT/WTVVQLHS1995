-- Bảng quản lý hợp đồng
CREATE TABLE IF NOT EXISTS Contracts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id),
    title VARCHAR(255) NOT NULL,
    contract_type VARCHAR(100) NOT NULL,
    partner VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    signature VARCHAR(255),
    file_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Index cho các truy vấn phổ biến
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON Contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON Contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON Contracts(deleted_at); 