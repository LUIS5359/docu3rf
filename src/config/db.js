// src/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306, // ⚠️ cambia a 3306 (puerto estándar RDS)
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'db_rrhh_muni',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10,
  queueLimit: 0,
  dateStrings: true
});

// Helper opcional para transacciones
pool.withTransaction = async (fn) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    conn.release();
    return result;
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
};

// Test de conexión al iniciar
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('[DB] Pool conectado correctamente.');
  } catch (err) {
    console.error('[DB] Error de conexión:', err.message);
    // ⚠️ En Railway no salgas del proceso, solo muestra error
    if (process.env.RAILWAY_ENVIRONMENT !== 'production') process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') testConnection();

module.exports = pool;
