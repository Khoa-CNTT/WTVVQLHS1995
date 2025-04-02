const { Pool } = require("pg");
const { DB_URL } = require("./env");

const pool = new Pool({
  connectionString: DB_URL, // Ví dụ: "postgresql://user:password@localhost:5432/dbname"
});

pool.connect((err) => {
  if (err) {
    console.error("Database connection error:", err.stack);
    process.exit(1);
  }
  console.log("PostgreSQL connected");
});

module.exports = pool;