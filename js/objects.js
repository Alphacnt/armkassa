document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Bootstrap модальных окон
    const newObjectModal = new bootstrap.Modal(document.getElementById('newObjectModal'));
    const editObjectModal = new bootstrap.Modal(document.getElementById('editObjectModal'));
    const deleteObjectModal = new bootstrap.Modal(document.getElementById('deleteObjectModal'));

    let objects = JSON.parse(localStorage.getItem('objects')) || []; // Загружаем объекты из localStorage
    let counterparties = JSON.parse(localStorage.getItem('counterparties')) || []; // Загружаем контрагентов

    // Сохраняем объекты в localStorage
    function saveObjects() {
        localStorage.setItem('objects', JSON.stringify(objects));
    }

    // Рендерим объекты при загрузке страницы
    renderObjects();

    // Загружаем контрагентов в выпадающий список
    function loadCounterparties(selectId) {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Выберите контрагента</option>';
        counterparties.forEach(counterparty => {
            const option = document.createElement('option');
            option.value = counterparty.id;
            option.textContent = counterparty.name;
            select.appendChild(option);
        });
    }

    // Показать модальное окно создания объекта
    window.showNewObjectModal = () => {
        if (counterparties.length === 0) {
            showToast('Сначала создайте хотя бы одного контрагента на странице Контрагенты!', 'danger');
            return;
        }
        resetNewObjectModal();
        loadCounterparties('newCounterparty');
        newObjectModal.show();
    };

    // Сброс модального окна создания объекта
    function resetNewObjectModal() {
        document.getElementById('newName').value = '';
        document.getElementById('newCounterparty').value = '';
        document.getElementById('newAddress').value = '';
    }

    // Создание объекта
    window.createObject = () => {
        const name = document.getElementById('newName').value.trim();
        const counterpartyId = parseInt(document.getElementById('newCounterparty').value);
        const address = document.getElementById('newAddress').value.trim();

        if (!name) {
            showToast('Наименование обязательно для заполнения!', 'danger');
            return;
        }

        if (!counterpartyId) {
            showToast('Выберите контрагента!', 'danger');
            return;
        }

        const object = {
            id: objects.length + 1,
            name,
            counterpartyId,
            address
        };

        objects.push(object);
        saveObjects();
        newObjectModal.hide();
        renderObjects();
        showToast('Объект создан успешно!', 'success');
    };

    // Рендеринг таблицы объектов
    function renderObjects() {
        const tableBody = document.getElementById('objectsTable');
        tableBody.innerHTML = '';
        objects.forEach(object => {
            const counterparty = counterparties.find(c => c.id === object.counterpartyId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="object-checkbox" data-id="${object.id}"></td>
                <td>${object.id}</td>
                <td>${object.name}</td>
                <td>${counterparty ? counterparty.name : 'Контрагент удалён'}</td>
                <td>${object.address || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editObject(${object.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="showDeleteModal(${object.id})"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        updateDeleteButtonState();
    }

    // Обновление состояния кнопки удаления
    function updateDeleteButtonState() {
        const checkboxes = document.querySelectorAll('.object-checkbox:checked');
        document.getElementById('deleteSelectedBtn').disabled = checkboxes.length === 0;
    }

    // Удаление выбранных объектов
    window.deleteSelected = () => {
        const selectedIds = Array.from(document.querySelectorAll('.object-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
        if (selectedIds.length > 0) {
            objects = objects.filter(object => !selectedIds.includes(object.id));
            saveObjects();
            renderObjects();
            showToast('Выбранные объекты удалены!', 'success');
        }
    };

    // Показать модальное окно удаления
    window.showDeleteModal = (id) => {
        document.getElementById('deleteObjectId').textContent = id;
        document.getElementById('confirmDeleteBtn').dataset.id = id;
        deleteObjectModal.show();
    };

    // Подтверждение удаления
    window.confirmDelete = () => {
        const id = parseInt(document.getElementById('confirmDeleteBtn').dataset.id);
        objects = objects.filter(object => object.id !== id);
        saveObjects();
        deleteObjectModal.hide();
        renderObjects();
        showToast('Объект удалён!', 'success');
    };

    // Редактирование объекта
    window.editObject = (id) => {
        if (counterparties.length === 0) {
            showToast('Сначала создайте хотя бы одного контрагента на странице Контрагенты!', 'danger');
            return;
        }
        const object = objects.find(o => o.id === id);
        if (object) {
            document.getElementById('editName').value = object.name;
            loadCounterparties('editCounterparty');
            document.getElementById('editCounterparty').value = object.counterpartyId;
            document.getElementById('editAddress').value = object.address || '';
            document.getElementById('saveEditBtn').dataset.id = id;
            editObjectModal.show();
        }
    };

    // Сохранение изменений объекта
    window.saveEdit = () => {
        const id = parseInt(document.getElementById('saveEditBtn').dataset.id);
        const object = objects.find(o => o.id === id);
        if (object) {
            const name = document.getElementById('editName').value.trim();
            const counterpartyId = parseInt(document.getElementById('editCounterparty').value);
            const address = document.getElementById('editAddress').value.trim();

            if (!name) {
                showToast('Наименование обязательно для заполнения!', 'danger');
                return;
            }

            if (!counterpartyId) {
                showToast('Выберите контрагента!', 'danger');
                return;
            }

            object.name = name;
            object.counterpartyId = counterpartyId;
            object.address = address;

            saveObjects();
            editObjectModal.hide();
            renderObjects();
            showToast('Объект обновлён!', 'success');
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
        if (e.target.classList.contains('object-checkbox')) {
            updateDeleteButtonState();
        }
    });
});