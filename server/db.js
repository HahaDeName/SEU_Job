const mysql = require('mysql2/promise');

// 创建连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'seu_job',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL 数据库连接成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('MySQL 数据库连接失败:', error.message);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};
