CREATE TABLE Reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    lawyer_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (lawyer_id) REFERENCES Users(id),
    UNIQUE(user_id, lawyer_id)
); 