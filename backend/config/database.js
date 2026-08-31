const mysql = require("mysql2/promise");
require("dotenv").config();

console.log("========== DB CONFIG ==========");
console.log("HOST =", process.env.DB_HOST);
console.log("PORT =", process.env.DB_PORT);
console.log("USER =", process.env.DB_USER);
//console.log("PASSWORD =", process.env.DB_PASSWORD);
console.log("DATABASE =", process.env.DB_NAME);
console.log("===============================");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",
});

module.exports = pool;
