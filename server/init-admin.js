require('dotenv').config();

const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function initAdmin() {
    const username = 'admin';
    const password = 'admin123'; // 默认密码，建议首次登录后修改

    try {
        // 检查是否已存在管理员
        const [existing] = await pool.execute(
            'SELECT id FROM admins WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            console.log('管理员账号已存在');
            process.exit(0);
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 插入管理员
        await pool.execute(
            'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
            [username, passwordHash]
        );

        console.log('管理员账号创建成功');
        console.log(`用户名: ${username}`);
        console.log(`密码: ${password}`);
        console.log('请首次登录后修改密码！');

        process.exit(0);
    } catch (error) {
        console.error('创建管理员失败:', error);
        process.exit(1);
    }
}

initAdmin();
