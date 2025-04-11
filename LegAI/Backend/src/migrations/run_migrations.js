// Script thực thi migrations
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Kết nối database
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'legai',
    port: process.env.DB_PORT || 5432,
});

async function runMigrations() {
    console.log('Bắt đầu chạy migrations...');
    
    try {
        // Lấy danh sách file migration
        const migrationsPath = path.join(__dirname);
        const migrationFiles = fs.readdirSync(migrationsPath)
            .filter(file => file.endsWith('.sql'))
            .sort();

        if (migrationFiles.length === 0) {
            return;
        }

        // Thực thi từng migration
        for (const file of migrationFiles) {
            const filePath = path.join(migrationsPath, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            
            await pool.query(sql);
        }

    } catch (error) {
        console.error('Lỗi khi thực thi migrations:', error);
    } finally {
        pool.end();
    }
}

// Chạy migrations
runMigrations(); 