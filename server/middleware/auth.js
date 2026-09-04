// 访客认证中间件
function requireGuest(req, res, next) {
    if (req.session && req.session.isLoggedIn) {
        return next();
    }
    return res.redirect('/login');
}

// 管理员认证中间件
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(403).json({ success: false, message: '无权限' });
}

module.exports = {
    requireGuest,
    requireAdmin
};
