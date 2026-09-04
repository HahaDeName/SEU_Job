const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// 获取招聘信息列表
router.get('/jobs', async (req, res) => {
    const { page = 1, limit = 20, keyword, active } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];

    // 是否只显示上架的
    if (active !== 'false') {
        where.push('is_active = ?');
        params.push(true);
    }

    // 关键词搜索
    if (keyword) {
        where.push('(title LIKE ? OR company LIKE ? OR summary LIKE ?)');
        const kw = `%${keyword}%`;
        params.push(kw, kw, kw);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    try {
        // 查询总数
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM jobs ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // 查询数据
        const [rows] = await pool.execute(
            `SELECT * FROM jobs ${whereClause} ORDER BY original_time DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        return res.json({
            success: true,
            data: {
                jobs: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('查询失败:', error);
        return res.json({ success: false, message: '查询失败' });
    }
});

// 获取单条招聘信息
router.get('/jobs/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.json({ success: false, message: '招聘信息不存在' });
        }

        return res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('查询失败:', error);
        return res.json({ success: false, message: '查询失败' });
    }
});

// 新增招聘信息（管理员）
router.post('/jobs', requireAdmin, async (req, res) => {
    const { title, company, summary, content_text, content_image, content_link, tags } = req.body;

    if (!title) {
        return res.json({ success: false, message: '标题为必填项' });
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO jobs (title, company, summary, content_text, content_image, content_link, tags)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, company || '', summary || '', content_text || null, content_image || null, content_link || null, tags || null]
        );

        return res.json({ success: true, message: '创建成功', data: { id: result.insertId } });
    } catch (error) {
        console.error('创建失败:', error);
        return res.json({ success: false, message: '创建失败' });
    }
});

// 编辑招聘信息（管理员）
router.put('/jobs/:id', requireAdmin, async (req, res) => {
    const { title, company, summary, content_text, content_image, content_link, tags } = req.body;

    try {
        const [result] = await pool.execute(
            `UPDATE jobs SET title = ?, company = ?, summary = ?,
             content_text = ?, content_image = ?, content_link = ?, tags = ?
             WHERE id = ?`,
            [title, company, summary, content_text, content_image, content_link, tags, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.json({ success: false, message: '招聘信息不存在' });
        }

        return res.json({ success: true, message: '更新成功' });
    } catch (error) {
        console.error('更新失败:', error);
        return res.json({ success: false, message: '更新失败' });
    }
});

// 删除招聘信息（管理员）
router.delete('/jobs/:id', requireAdmin, async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM jobs WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.json({ success: false, message: '招聘信息不存在' });
        }

        return res.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('删除失败:', error);
        return res.json({ success: false, message: '删除失败' });
    }
});

// 上下架切换（管理员）
router.patch('/jobs/:id/toggle', requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT is_active FROM jobs WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.json({ success: false, message: '招聘信息不存在' });
        }

        const newStatus = !rows[0].is_active;
        await pool.execute('UPDATE jobs SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

        return res.json({ success: true, message: '状态已切换', data: { is_active: newStatus } });
    } catch (error) {
        console.error('切换失败:', error);
        return res.json({ success: false, message: '切换失败' });
    }
});

module.exports = router;
