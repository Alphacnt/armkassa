document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Bootstrap модальных окон
    const newInventoryModal = new bootstrap.Modal(document.getElementById('newInventoryModal'));
    const editInventoryModal = new bootstrap.Modal(document.getElementById('editInventoryModal'));
    const deleteInventoryModal = new bootstrap.Modal(document.getElementById('deleteInventoryModal'));

    let inventory = JSON.parse(localStorage.getItem('inventory')) || []; // Загружаем инвентарь

    // Сохраняем инвентарь в localStorage
    function saveInventory() {
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }

    // Рендерим инвентарь при загрузке страницы
    renderInventory();

    // Показать модальное окно создания инвентаря
    window.showNewInventoryModal = () => {
        resetNewInventoryModal();
        newInventoryModal.show();
    };

    // Сброс модального окна создания
    function resetNewInventoryModal() {
        document.getElementById('newName').value = '';
        document.getElementById('newSize').value = '';
        document.getElementById('newQuantity').value = '';
        document.getElementById('newCost').value = '';
    }

    // Создание инвентаря
    window.createInventory = () => {
        console.log('createInventory called'); // Отладка
        const name = document.getElementById('newName').value.trim();
        const size = document.getElementById('newSize').value.trim();
        const quantity = parseInt(document.getElementById('newQuantity').value);
        const cost = parseFloat(document.getElementById('newCost').value);

        if (!name) {
            showToast('Наименование обязательно для заполнения!', 'danger');
            return;
        }

        if (!size) {
            showToast('Размер обязателен для заполнения!', 'danger');
            return;
        }

        if (isNaN(quantity) || quantity < 1) {
            showToast('Количество должно быть положительным целым числом!', 'danger');
            return;
        }

        if (isNaN(cost) || cost < 0) {
            showToast('Стоимость должна быть положительным числом!', 'danger');
            return;
        }

        const item = {
            id: inventory.length + 1,
            name,
            size,
            quantity,
            cost
        };

        inventory.push(item);
        saveInventory();
        newInventoryModal.hide();
        renderInventory();
        showToast('Инвентарь создан успешно!', 'success');
    };

    // Привязка события к кнопке "Создать"
    document.getElementById('createInventoryBtn').addEventListener('click', window.createInventory);

    // Рендеринг таблицы инвентаря
    function renderInventory() {
        console.log('Rendering inventory:', inventory); // Отладка
        const tableBody = document.getElementById('inventoryTable');
        tableBody.innerHTML = '';
        inventory.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="inventory-checkbox" data-id="${item.id}"></td>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.size}</td>
                <td>${item.quantity}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editInventory(${item.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="showDeleteModal(${item.id})"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        updateDeleteButtonState();
    }

    // Обновление состояния кнопки удаления
    function updateDeleteButtonState() {
        const checkboxes = document.querySelectorAll('.inventory-checkbox:checked');
        document.getElementById('deleteSelectedBtn').disabled = checkboxes.length === 0;
    }

    // Удаление выбранных элементов инвентаря
    window.deleteSelected = () => {
        const selectedIds = Array.from(document.querySelectorAll('.inventory-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
        if (selectedIds.length > 0) {
            inventory = inventory.filter(item => !selectedIds.includes(item.id));
            saveInventory();
            renderInventory();
            showToast('Выбранный инвентарь удалён!', 'success');
        }
    };

    // Показать модальное окно удаления
    window.showDeleteModal = (id) => {
        document.getElementById('deleteInventoryId').textContent = id;
        document.getElementById('confirmDeleteBtn').dataset.id = id;
        deleteInventoryModal.show();
    };

    // Подтверждение удаления
    window.confirmDelete = () => {
        const id = parseInt(document.getElementById('confirmDeleteBtn').dataset.id);
        inventory = inventory.filter(item => item.id !== id);
        saveInventory();
        deleteInventoryModal.hide();
        renderInventory();
        showToast('Инвентарь удалён!', 'success');
    };

    // Редактирование инвентаря
    window.editInventory = (id) => {
        const item = inventory.find(i => i.id === id);
        if (item) {
            document.getElementById('editName').value = item.name;
            document.getElementById('editSize').value = item.size;
            document.getElementById('editQuantity').value = item.quantity;
            document.getElementById('editCost').value = item.cost;
            document.getElementById('saveEditBtn').dataset.id = id;
            editInventoryModal.show();
        }
    };

    // Сохранение изменений инвентаря
    window.saveEdit = () => {
        const id = parseInt(document.getElementById('saveEditBtn').dataset.id);
        const item = inventory.find(i => i.id === id);
        if (item) {
            const name = document.getElementById('editName').value.trim();
            const size = document.getElementById('editSize').value.trim();
            const quantity = parseInt(document.getElementById('editQuantity').value);
            const cost = parseFloat(document.getElementById('editCost').value);

            if (!name) {
                showToast('Наименование обязательно для заполнения!', 'danger');
                return;
            }

            if (!size) {
                showToast('Размер обязателен для заполнения!', 'danger');
                return;
            }

            if (isNaN(quantity) || quantity < 1) {
                showToast('Количество должно быть положительным целым числом!', 'danger');
                return;
            }

            if (isNaN(cost) || cost < 0) {
                showToast('Стоимость должна быть положительным числом!', 'danger');
                return;
            }

            item.name = name;
            item.size = size;
            item.quantity = quantity;
            item.cost = cost;

            saveInventory();
            editInventoryModal.hide();
            renderInventory();
            showToast('Инвентарь обновлён!', 'success');
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
        if (e.target.classList.contains('inventory-checkbox')) {
            updateDeleteButtonState();
        }
    });
});