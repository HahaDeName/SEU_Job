// 全局变量
let currentPage = 1;
let editingId = null;

// 页面加载时获取数据
document.addEventListener('DOMContentLoaded', () => {
    loadJobs();
    setupEventListeners();
});

// 设置事件监听
function setupEventListeners() {
    // 新增按钮
    document.getElementById('addBtn').addEventListener('click', () => {
        editingId = null;
        document.getElementById('modalTitle').textContent = '新增招聘信息';
        document.getElementById('jobForm').reset();
        document.getElementById('jobId').value = '';
        showModal();
    });

    // 关闭模态框
    document.getElementById('modalClose').addEventListener('click', hideModal);
    document.getElementById('cancelBtn').addEventListener('click', hideModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) hideModal();
    });

    // 表单提交
    document.getElementById('jobForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveJob();
    });

    // 登出按钮
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            const res = await fetch('/logout', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                window.location.href = '/login';
            }
        } catch (err) {
            console.error('登出失败:', err);
        }
    });
}

// 加载招聘信息
async function loadJobs() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20,
            active: false
        });

        const res = await fetch(`/api/jobs?${params}`);
        const data = await res.json();

        if (data.success) {
            renderTable(data.data.jobs);
            renderPagination(data.data.pagination);
        }
    } catch (err) {
        console.error('加载失败:', err);
    }
}

// 渲染表格
function renderTable(jobs) {
    const tbody = document.getElementById('jobTableBody');

    if (jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = jobs.map(job => `
        <tr>
            <td>${escapeHtml(job.title)}</td>
            <td>${escapeHtml(job.company || '-')}</td>
            <td>${getContentIndicators(job)}</td>
            <td>
                <span class="status-badge ${job.is_active ? 'status-active' : 'status-inactive'}">
                    ${job.is_active ? '上架' : '下架'}
                </span>
            </td>
            <td>${job.original_time ? new Date(job.original_time).toLocaleDateString('zh-CN') : '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="editJob(${job.id})">编辑</button>
                    <button class="action-btn" onclick="toggleJob(${job.id})">
                        ${job.is_active ? '下架' : '上架'}
                    </button>
                    <button class="action-btn action-btn-danger" onclick="deleteJob(${job.id})">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 渲染分页
function renderPagination(pagination) {
    const { page, pages } = pagination;
    const container = document.getElementById('pagination');

    if (pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    html += `<button ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">上一页</button>`;

    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
            html += `<button class="${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += '<button disabled>...</button>';
        }
    }

    html += `<button ${page >= pages ? 'disabled' : ''} onclick="goToPage(${page + 1})">下一页</button>`;
    container.innerHTML = html;
}

// 跳转页面
function goToPage(page) {
    currentPage = page;
    loadJobs();
}

// 显示模态框
function showModal() {
    document.getElementById('modalOverlay').classList.add('active');
}

// 隐藏模态框
function hideModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// 获取内容标识
function getContentIndicators(job) {
    const indicators = [];
    if (job.content_text) indicators.push('📝');
    if (job.content_image) indicators.push('🖼️');
    if (job.content_link) indicators.push('🔗');
    return indicators.join(' ') || '-';
}

// 编辑招聘信息
async function editJob(id) {
    try {
        const res = await fetch(`/api/jobs/${id}`);
        const data = await res.json();

        if (data.success) {
            const job = data.data;
            editingId = id;
            document.getElementById('modalTitle').textContent = '编辑招聘信息';
            document.getElementById('jobId').value = job.id;
            document.getElementById('formTitle').value = job.title;
            document.getElementById('formCompany').value = job.company || '';
            document.getElementById('formSummary').value = job.summary || '';
            document.getElementById('formText').value = job.content_text || '';
            document.getElementById('formImage').value = job.content_image || '';
            document.getElementById('formLink').value = job.content_link || '';
            document.getElementById('formTags').value = job.tags || '';
            showModal();
        }
    } catch (err) {
        console.error('获取详情失败:', err);
    }
}

// 保存招聘信息
async function saveJob() {
    const jobData = {
        title: document.getElementById('formTitle').value,
        company: document.getElementById('formCompany').value,
        summary: document.getElementById('formSummary').value,
        content_text: document.getElementById('formText').value || null,
        content_image: document.getElementById('formImage').value || null,
        content_link: document.getElementById('formLink').value || null,
        tags: document.getElementById('formTags').value || null
    };

    try {
        const url = editingId ? `/api/jobs/${editingId}` : '/api/jobs';
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData)
        });

        const data = await res.json();

        if (data.success) {
            hideModal();
            loadJobs();
            alert(editingId ? '更新成功' : '创建成功');
        } else {
            alert(data.message || '操作失败');
        }
    } catch (err) {
        console.error('保存失败:', err);
        alert('保存失败，请重试');
    }
}

// 切换上下架状态
async function toggleJob(id) {
    try {
        const res = await fetch(`/api/jobs/${id}/toggle`, { method: 'PATCH' });
        const data = await res.json();

        if (data.success) {
            loadJobs();
        } else {
            alert(data.message || '操作失败');
        }
    } catch (err) {
        console.error('切换失败:', err);
    }
}

// 删除招聘信息
async function deleteJob(id) {
    if (!confirm('确定要删除这条招聘信息吗？')) return;

    try {
        const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            loadJobs();
            alert('删除成功');
        } else {
            alert(data.message || '删除失败');
        }
    } catch (err) {
        console.error('删除失败:', err);
    }
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
