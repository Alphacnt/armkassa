document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Bootstrap модальных окон
    const newTerminalModal = new bootstrap.Modal(document.getElementById('newTerminalModal'));
    const editTerminalModal = new bootstrap.Modal(document.getElementById('editTerminalModal'));
    const deleteTerminalModal = new bootstrap.Modal(document.getElementById('deleteTerminalModal'));

    let terminals = JSON.parse(localStorage.getItem('terminals')) || []; // Загружаем терминалы
    let objects = JSON.parse(localStorage.getItem('objects')) || []; // Загружаем объекты

    // Сохраняем терминалы в localStorage
    function saveTerminals() {
        localStorage.setItem('terminals', JSON.stringify(terminals));
    }

    // Рендерим терминалы при загрузке страницы
    renderTerminals();

    // Загружаем объекты в выпадающий список
    function loadObjects(selectId) {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Выберите объект</option>';
        objects.forEach(object => {
            const option = document.createElement('option');
            option.value = object.id;
            option.textContent = object.name;
            select.appendChild(option);
        });
    }

    // Показать модальное окно создания терминала
    window.showNewTerminalModal = () => {
        if (objects.length === 0) {
            showToast('Сначала создайте хотя бы один объект на странице Объекты!', 'danger');
            return;
        }
        resetNewTerminalModal();
        loadObjects('newObject');
        newTerminalModal.show();
    };

    // Сброс модального окна создания терминала
    function resetNewTerminalModal() {
        document.getElementById('newIdentifier').value = '';
        document.getElementById('newName').value = '';
        document.getElementById('newObject').value = '';
        document.getElementById('newNote').value = '';
        document.getElementById('newLogin').value = '';
        document.getElementById('newPassword').value = '';
    }

    // Создание терминала
    window.createTerminal = () => {
        const identifier = document.getElementById('newIdentifier').value.trim();
        const name = document.getElementById('newName').value.trim();
        const objectId = parseInt(document.getElementById('newObject').value);
        const note = document.getElementById('newNote').value.trim();
        const login = document.getElementById('newLogin').value.trim();
        const password = document.getElementById('newPassword').value.trim();

        if (!identifier) {
            showToast('Идентификатор обязателен для заполнения!', 'danger');
            return;
        }

        if (!name) {
            showToast('Наименование обязательно для заполнения!', 'danger');
            return;
        }

        if (!objectId) {
            showToast('Выберите объект!', 'danger');
            return;
        }

        if (!note) {
            showToast('Примечание обязательно для заполнения!', 'danger');
            return;
        }

        if (!login) {
            showToast('Логин обязателен для заполнения!', 'danger');
            return;
        }

        if (!password) {
            showToast('Пароль обязателен для заполнения!', 'danger');
            return;
        }

        const terminal = {
            id: terminals.length + 1,
            identifier,
            name,
            objectId,
            note,
            login,
            password
        };

        terminals.push(terminal);
        saveTerminals();
        newTerminalModal.hide();
        renderTerminals();
        showToast('Терминал создан успешно!', 'success');
    };

    // Рендеринг таблицы терминалов
    function renderTerminals() {
        const tableBody = document.getElementById('terminalsTable');
        tableBody.innerHTML = '';
        terminals.forEach(terminal => {
            const object = objects.find(o => o.id === terminal.objectId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="terminal-checkbox" data-id="${terminal.id}"></td>
                <td>${terminal.id}</td>
                <td>${terminal.name}</td>
                <td>${terminal.identifier}</td>
                <td>${object ? object.name : 'Объект удалён'}</td>
                <td>${terminal.login}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editTerminal(${terminal.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="showDeleteModal(${terminal.id})"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        updateDeleteButtonState();
    }

    // Обновление состояния кнопки удаления
    function updateDeleteButtonState() {
        const checkboxes = document.querySelectorAll('.terminal-checkbox:checked');
        document.getElementById('deleteSelectedBtn').disabled = checkboxes.length === 0;
    }

    // Удаление выбранных терминалов
    window.deleteSelected = () => {
        const selectedIds = Array.from(document.querySelectorAll('.terminal-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
        if (selectedIds.length > 0) {
            terminals = terminals.filter(terminal => !selectedIds.includes(terminal.id));
            saveTerminals();
            renderTerminals();
            showToast('Выбранные терминалы удалены!', 'success');
        }
    };

    // Показать модальное окно удаления
    window.showDeleteModal = (id) => {
        document.getElementById('deleteTerminalId').textContent = id;
        document.getElementById('confirmDeleteBtn').dataset.id = id;
        deleteTerminalModal.show();
    };

    // Подтверждение удаления
    window.confirmDelete = () => {
        const id = parseInt(document.getElementById('confirmDeleteBtn').dataset.id);
        terminals = terminals.filter(terminal => terminal.id !== id);
        saveTerminals();
        deleteTerminalModal.hide();
        renderTerminals();
        showToast('Терминал удалён!', 'success');
    };

    // Редактирование терминала
    window.editTerminal = (id) => {
        if (objects.length === 0) {
            showToast('Сначала создайте хотя бы один объект на странице Объекты!', 'danger');
            return;
        }
        const terminal = terminals.find(t => t.id === id);
        if (terminal) {
            document.getElementById('editIdentifier').value = terminal.identifier;
            document.getElementById('editName').value = terminal.name;
            loadObjects('editObject');
            document.getElementById('editObject').value = terminal.objectId;
            document.getElementById('editNote').value = terminal.note;
            document.getElementById('editLogin').value = terminal.login;
            document.getElementById('editPassword').value = terminal.password;
            document.getElementById('saveEditBtn').dataset.id = id;
            editTerminalModal.show();
        }
    };

    // Сохранение изменений терминала
    window.saveEdit = () => {
        const id = parseInt(document.getElementById('saveEditBtn').dataset.id);
        const terminal = terminals.find(t => t.id === id);
        if (terminal) {
            const identifier = document.getElementById('editIdentifier').value.trim();
            const name = document.getElementById('editName').value.trim();
            const objectId = parseInt(document.getElementById('editObject').value);
            const note = document.getElementById('editNote').value.trim();
            const login = document.getElementById('editLogin').value.trim();
            const password = document.getElementById('editPassword').value.trim();

            if (!identifier) {
                showToast('Идентификатор обязателен для заполнения!', 'danger');
                return;
            }

            if (!name) {
                showToast('Наименование обязательно для заполнения!', 'danger');
                return;
            }

            if (!objectId) {
                showToast('Выберите объект!', 'danger');
                return;
            }

            if (!note) {
                showToast('Примечание обязательно для заполнения!', 'danger');
                return;
            }

            if (!login) {
                showToast('Логин обязателен для заполнения!', 'danger');
                return;
            }

            if (!password) {
                showToast('Пароль обязателен для заполнения!', 'danger');
                return;
            }

            terminal.identifier = identifier;
            terminal.name = name;
            terminal.objectId = objectId;
            terminal.note = note;
            terminal.login = login;
            terminal.password = password;

            saveTerminals();
            editTerminalModal.hide();
            renderTerminals();
            showToast('Терминал обновлён!', 'success');
        }
    };

    // Показ уведомления
    function showToast(message, type) {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        setTimeout(() => toast.remove(), 3000);
    }

    // Обработчик для чекбоксов
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('terminal-checkbox')) {
            updateDeleteButtonState();
        }
    });
});