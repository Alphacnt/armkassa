console.log('terminal_settings.js loaded successfully at:', new Date().toISOString());

// Мок-данные для хранения настроек (в реальном приложении можно использовать localStorage или API)
let settings = {
    ipAddress: '',
    port: '',
    useHttps: false,
    username: '',
    accessToken: '',
    refreshToken: '',
    expirationDate: ''
};

let isInitialized = false;

// Инициализация страницы
window.initializeTerminalSettingsPage = function() {
    if (isInitialized) return;
    isInitialized = true;
    console.log('initializeTerminalSettingsPage called');

    const elements = {
        ipAddress: document.getElementById('ipAddress'),
        port: document.getElementById('port'),
        useHttps: document.getElementById('useHttps'),
        username: document.getElementById('username'),
        accessToken: document.getElementById('accessToken'),
        refreshToken: document.getElementById('refreshToken'),
        expirationDate: document.getElementById('expirationDate'),
        registerBtn: document.getElementById('registerBtn'),
        refreshTokenBtn: document.getElementById('refreshTokenBtn'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn'),
        statusAlert: document.getElementById('statusAlert')
    };

    console.log('DOM elements status:', elements);

    const requiredElements = ['ipAddress', 'port', 'useHttps', 'username', 'accessToken', 'refreshToken', 'expirationDate', 'registerBtn', 'refreshTokenBtn', 'saveSettingsBtn', 'statusAlert'];
    for (const key of requiredElements) {
        if (!elements[key]) {
            console.error(`Critical element ${key} not found`);
            isInitialized = false;
            return;
        }
    }

    // Загрузка сохранённых настроек (мок)
    loadSettings();

    elements.registerBtn.addEventListener('click', registerTerminal);
    elements.refreshTokenBtn.addEventListener('click', refreshToken);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
};

function loadSettings() {
    console.log('Loading settings:', settings);
    document.getElementById('ipAddress').value = settings.ipAddress;
    document.getElementById('port').value = settings.port;
    document.getElementById('useHttps').checked = settings.useHttps;
    document.getElementById('username').value = settings.username;
    document.getElementById('accessToken').value = settings.accessToken;
    document.getElementById('refreshToken').value = settings.refreshToken;
    document.getElementById('expirationDate').value = settings.expirationDate;
}

function registerTerminal() {
    console.log('Registering terminal');
    const ipAddress = document.getElementById('ipAddress').value;
    const port = document.getElementById('port').value;
    const username = document.getElementById('username').value;

    if (!ipAddress || !port || !username) {
        showAlert('Ошибка: Заполните IP Address, Port и Username.', 'danger');
        return;
    }

    // Мок-логика регистрации (в реальном случае запрос к API)
    settings.ipAddress = ipAddress;
    settings.port = port;
    settings.useHttps = document.getElementById('useHttps').checked;
    settings.username = username;
    settings.accessToken = generateMockToken();
    settings.refreshToken = generateMockToken();
    settings.expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +1 день

    loadSettings();
    showAlert('Регистрация успешно выполнена. Токены сгенерированы.', 'success');
}

function refreshToken() {
    console.log('Refreshing access token');
    const refreshToken = document.getElementById('refreshToken').value;

    if (!refreshToken) {
        showAlert('Ошибка: Refresh Token не указан.', 'danger');
        return;
    }

    // Мок-логика обновления токена (в реальном случае запрос к API)
    settings.accessToken = generateMockToken();
    settings.expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +1 день

    loadSettings();
    showAlert('Токен доступа успешно обновлён.', 'success');
}

function saveSettings() {
    console.log('Saving settings');
    settings.ipAddress = document.getElementById('ipAddress').value;
    settings.port = document.getElementById('port').value;
    settings.useHttps = document.getElementById('useHttps').checked;
    settings.username = document.getElementById('username').value;
    settings.accessToken = document.getElementById('accessToken').value;
    settings.refreshToken = document.getElementById('refreshToken').value;
    settings.expirationDate = document.getElementById('expirationDate').value;

    // Валидация (простая проверка)
    if (!settings.ipAddress || !settings.port || !settings.username || !settings.accessToken || !settings.refreshToken || !settings.expirationDate) {
        showAlert('Ошибка: Заполните все обязательные поля.', 'danger');
        return;
    }

    // Мок-логика сохранения (в реальном случае отправка на сервер)
    console.log('Settings saved:', settings);
    showAlert('Настройки успешно сохранены.', 'success');
}

function generateMockToken() {
    return 'mock_' + Math.random().toString(36).substr(2, 15);
}

function showAlert(message, type) {
    const alert = document.getElementById('statusAlert');
    alert.textContent = message;
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.style.display = 'block';
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing terminal settings page');
    window.initializeTerminalSettingsPage();
});