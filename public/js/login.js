document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // 隐藏错误信息
    errorMsg.style.display = 'none';

    // 禁用按钮
    submitBtn.disabled = true;
    submitBtn.textContent = '验证中...';

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = '/';
        } else {
            errorMsg.textContent = data.message || '密码错误';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        errorMsg.textContent = '网络错误，请重试';
        errorMsg.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '进 入';
    }
});
