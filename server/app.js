require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const { testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件配置 ====================

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));
app.use('/static', express.static(path.join(__dirname, '../static')));

// Session 配置
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_MAX_AGE) || 7200000 // 默认2小时
    }
}));

// 模板引擎配置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ==================== 路由挂载 ====================

// 页面路由
const pagesRouter = require('./routes/pages');
app.use('/', pagesRouter);

// 认证路由
const authRouter = require('./routes/auth');
app.use('/', authRouter);

// API 路由
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// ==================== 错误处理 ====================

// 404 页面
app.use((req, res) => {
    res.status(404).send('页面未找到');
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).send('服务器内部错误');
});

// ==================== 启动服务器 ====================

async function startServer() {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('无法连接数据库，服务器启动失败');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`服务器已启动: http://localhost:${PORT}`);
        console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
}

startServer();
