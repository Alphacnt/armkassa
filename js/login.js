document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Проверка: если пользователь уже вошел, перенаправляем на главную
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        console.log('User already logged in, redirecting to index.html');
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        const indexPath = isInPagesFolder ? '../index.html' : 'index.html';
        window.location.href = indexPath;
        return;
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Показываем UX-задержку (1.5 сек)
        const loginButton = loginForm.querySelector('button');
        loginButton.disabled = true;
        loginButton.textContent = 'Проверка...';

        setTimeout(() => {
            // Мок-данные
            const validUsername = 'admin';
            const validPassword = '1234';

            if (username === validUsername && password === validPassword) {
                // Успешный вход
                sessionStorage.setItem('isLoggedIn', 'true');
                // Сохраняем мок-токен для совместимости с sidebarLoader.js
                localStorage.setItem('authToken', 'mock-token');
                console.log('Login successful, redirecting to index.html');
                const isInPagesFolder = window.location.pathname.includes('/pages/');
                const indexPath = isInPagesFolder ? '../index.html' : 'index.html';
                window.location.href = indexPath;
            } else {
                // Ошибка входа
                alert('Неверный логин или пароль');
                loginButton.disabled = false;
                loginButton.textContent = 'Войти в систему';
            }
        }, 1500);
    });
});