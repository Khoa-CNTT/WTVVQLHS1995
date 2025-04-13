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

CREATE TABLE UserProfiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) NOT NULL,
    bio TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE LegalDocuments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    issued_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    language VARCHAR(50) NOT NULL
);

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
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

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
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE Appointments (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    lawyer_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Users(id),
    FOREIGN KEY (lawyer_id) REFERENCES Users(id)
);

CREATE TABLE AIConsultations (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE LiveChats (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    lawyer_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    messages TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES Users(id),
    FOREIGN KEY (lawyer_id) REFERENCES Users(id)
);

CREATE TABLE Transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    lawyer_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (lawyer_id) REFERENCES Users(id)
);

CREATE TABLE AuditLogs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE LawyerDetails (
    id SERIAL PRIMARY KEY,
    lawyer_id INT NOT NULL,
    certification VARCHAR(255) NOT NULL,
    experience_years INT NOT NULL,
    specialization VARCHAR(50) NOT NULL,
    rating DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lawyer_id) REFERENCES Users(id)
);

CREATE TABLE DigitalSignatures (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL,
    user_id INT NOT NULL,
    signature_hash VARCHAR(255) NOT NULL,
    signed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (contract_id) REFERENCES Contracts(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE DocumentTemplates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    language VARCHAR(50) NOT NULL
);

CREATE TABLE LawyerAvailability (
    id SERIAL PRIMARY KEY,
    lawyer_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (lawyer_id) REFERENCES Users(id)
);

CREATE TABLE FeeReferences (
    id SERIAL PRIMARY KEY,
    case_type VARCHAR(50) NOT NULL,
    base_fee DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    description TEXT
);