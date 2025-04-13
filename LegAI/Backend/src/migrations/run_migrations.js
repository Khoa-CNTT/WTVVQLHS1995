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
        // Thực thi SQL migrations
        await runSqlMigrations();
        
        // Thực thi JS migrations
        await runJsMigrations();

        console.log('Migrations đã hoàn thành!');
    } catch (error) {
        console.error('Lỗi khi thực thi migrations:', error);
    } finally {
        pool.end();
    }
}

async function runSqlMigrations() {
    // Lấy danh sách file migration SQL
    const migrationsPath = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

    if (migrationFiles.length === 0) {
        console.log('Không có SQL migrations để chạy.');
        return;
    }

    console.log(`Thực thi ${migrationFiles.length} SQL migrations...`);
    
    // Thực thi từng migration
    for (const file of migrationFiles) {
        console.log(`Đang chạy SQL migration: ${file}`);
        const filePath = path.join(migrationsPath, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        try {
            await pool.query(sql);
            console.log(`✓ Đã thực thi: ${file}`);
        } catch (error) {
            console.error(`✗ Lỗi khi thực thi ${file}:`, error.message);
            // Tiếp tục với file tiếp theo thay vì dừng lại
        }
    }
}

async function runJsMigrations() {
    // Lấy danh sách file migration JS
    const migrationsPath = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.js') && file !== 'run_migrations.js')
        .sort();

    if (migrationFiles.length === 0) {
        console.log('Không có JS migrations để chạy.');
        return;
    }

    console.log(`Thực thi ${migrationFiles.length} JS migrations...`);
    
    // Thực thi từng migration
    for (const file of migrationFiles) {
        console.log(`Đang chạy JS migration: ${file}`);
        const migrationPath = path.join(migrationsPath, file);
        
        try {
            const migration = require(migrationPath);
            if (typeof migration === 'function') {
                await migration();
            } else if (typeof migration.default === 'function') {
                await migration.default();
            } else {
                console.warn(`⚠️ Migration ${file} không export function, bỏ qua.`);
            }
            console.log(`✓ Đã thực thi: ${file}`);
        } catch (error) {
            console.error(`✗ Lỗi khi thực thi ${file}:`, error.message);
            // Tiếp tục với file tiếp theo thay vì dừng lại
        }
    }
}

// Chạy migrations khi được gọi trực tiếp
if (require.main === module) {
    runMigrations()
        .then(() => console.log('Quá trình migration hoàn tất.'))
        .catch(err => console.error('Migration thất bại:', err));
}

module.exports = runMigrations; 