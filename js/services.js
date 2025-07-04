console.log('services.js loaded'); // Отладка загрузки скрипта

// Глобальные переменные
let services = [];
let inventory = [];

// Функция рендеринга
function renderServices() {
    console.log('renderServices called, services:', services); // Отладка
    const tableBody = document.getElementById('servicesTable');
    if (!tableBody) {
        console.error('servicesTable not found');
        return;
    }
    tableBody.innerHTML = '';
    services.forEach(service => {
        console.log('Rendering service:', service); // Отладка
        const inventoryList = (Array.isArray(service.inventoryIds) ? service.inventoryIds : []).map(id => {
            const item = inventory.find(i => i.id === id);
            return item ? item.name : 'Инвентарь удалён';
        }).join(', ') || '-';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="service-checkbox" data-id="${service.id}"></td>
            <td>${service.id}</td>
            <td>${service.name}</td>
            <td>${service.cost.toFixed(2)}</td>
            <td>${inventoryList}</td>
            <td>${service.countInTickets ? '<span class="text-success">✅</span>' : '<span class="text-danger">❌</span>'}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-service-btn" data-id="${service.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger delete-service-btn" data-id="${service.id}"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Привязка событий для кнопок
    document.querySelectorAll('.edit-service-btn').forEach(btn => {
        btn.removeEventListener('click', handleEditService); // Удаляем старые обработчики
        btn.addEventListener('click', handleEditService);
    });
    document.querySelectorAll('.delete-service-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteService); // Удаляем старые обработчики
        btn.addEventListener('click', handleDeleteService);
    });

    updateDeleteButtonState();
}

function handleEditService(e) {
    const id = parseInt(e.target.closest('button').dataset.id);
    editService(id);
}

function handleDeleteService(e) {
    const id = parseInt(e.target.closest('button').dataset.id);
    showDeleteModal(id);
}

// Инициализация страницы
window.initializeServicesPage = function() {
    console.log('initializeServicesPage called'); // Отладка
    // Инициализация Bootstrap модальных окон
    const newServiceModal = new bootstrap.Modal(document.getElementById('newServiceModal'));
    const editServiceModal = new bootstrap.Modal(document.getElementById('editServiceModal'));
    const deleteServiceModal = new bootstrap.Modal(document.getElementById('deleteServiceModal'));

    // Загружаем данные
    services = JSON.parse(localStorage.getItem('services')) || [];
    console.log('Raw services from localStorage:', services); // Отладка
    services = services.map((service, index) => {
        console.log(`Normalizing service ${index}:`, service); // Отладка
        return {
            id: service.id || index + 1,
            name: service.name || 'Без названия',
            cost: service.cost || 0,
            inventoryIds: Array.isArray(service.inventoryIds) ? service.inventoryIds : [],
            countInTickets: service.countInTickets !== undefined ? service.countInTickets : false,
            salesChannels: Array.isArray(service.salesChannels) ? service.salesChannels : []
        };
    });
    inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    console.log('Inventory:', inventory); // Отладка

    // Привязка событий
    const newServiceBtn = document.getElementById('newServiceBtn');
    const createServiceBtn = document.getElementById('createServiceBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (newServiceBtn) newServiceBtn.addEventListener('click', showNewServiceModal);
    if (createServiceBtn) createServiceBtn.addEventListener('click', createService);
    if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', deleteSelected);
    if (saveEditBtn) saveEditBtn.addEventListener('click', saveEdit);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);

    // Рендерим таблицу
    renderServices();
};

// Сохраняем услуги в localStorage
function saveServices() {
    console.log('Saving services:', services); // Отладка
    localStorage.setItem('services', JSON.stringify(services));
}

// Показать модальное окно создания услуги
function showNewServiceModal() {
    console.log('showNewServiceModal called'); // Отладка
    resetNewServiceModal();
    loadInventory('new', []);
    const newServiceModal = bootstrap.Modal.getInstance(document.getElementById('newServiceModal'));
    newServiceModal.show();
}

// Сброс модального окна создания
function resetNewServiceModal() {
    console.log('resetNewServiceModal called'); // Отладка
    document.getElementById('newName').value = '';
    document.getElementById('newCost').value = '';
    document.getElementById('newCountInTickets').checked = false;
    document.querySelectorAll('#newSalesChannelsContainer .form-check-input').forEach(input => input.checked = false);
}

// Загрузка инвентаря в чекбоксы
function loadInventory(mode, selectedInventoryIds) {
    console.log('loadInventory called, mode:', mode, 'selectedInventoryIds:', selectedInventoryIds); // Отладка
    const container = document.getElementById(`${mode}InventoryContainer`);
    container.innerHTML = '';
    if (inventory.length === 0) {
        container.innerHTML = '<p class="text-muted">Нет доступного инвентаря. Создайте инвентарь на странице Инвентарь.</p>';
        return;
    }
    inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" id="${mode}Inventory${item.id}" value="${item.id}" ${selectedInventoryIds.includes(item.id) ? 'checked' : ''}>
            <label class="form-check-label" for="${mode}Inventory${item.id}">${item.name} (${item.size}, ${item.quantity} шт., ${item.cost} тенге.)</label>
        `;
        container.appendChild(div);
    });
}

// Создание услуги
function createService() {
    console.log('createService called'); // Отладка
    const name = document.getElementById('newName').value.trim();
    const cost = parseFloat(document.getElementById('newCost').value);
    const inventoryIds = Array.from(document.querySelectorAll('#newInventoryContainer .form-check-input:checked')).map(input => parseInt(input.value));
    const countInTickets = document.getElementById('newCountInTickets').checked;
    const salesChannels = Array.from(document.querySelectorAll('#newSalesChannelsContainer .form-check-input:checked')).map(input => input.value);

    if (!name) {
        showToast('Наименование обязательно для заполнения!', 'danger');
        return;
    }

    if (isNaN(cost) || cost < 0) {
        showToast('Стоимость должна быть положительным числом!', 'danger');
        return;
    }

    if (salesChannels.length === 0) {
        showToast('Выберите хотя бы один вид продаж!', 'danger');
        return;
    }

    const service = {
        id: services.length + 1,
        name,
        cost,
        inventoryIds,
        countInTickets,
        salesChannels
    };

    services.push(service);
    saveServices();
    const newServiceModal = bootstrap.Modal.getInstance(document.getElementById('newServiceModal'));
    newServiceModal.hide();
    renderServices();
    showToast('Услуга создана успешно!', 'success');
}

// Обновление состояния кнопки удаления
function updateDeleteButtonState() {
    const checkboxes = document.querySelectorAll('.service-checkbox:checked');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.disabled = checkboxes.length === 0;
    }
}

// Удаление выбранных услуг
function deleteSelected() {
    console.log('deleteSelected called'); // Отладка
    const selectedIds = Array.from(document.querySelectorAll('.service-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
    if (selectedIds.length > 0) {
        services = services.filter(service => !selectedIds.includes(service.id));
        saveServices();
        renderServices();
        showToast('Выбранные услуги удалены!', 'success');
    }
}

// Показать модальное окно удаления
function showDeleteModal(id) {
    console.log('showDeleteModal called, id:', id); // Отладка
    document.getElementById('deleteServiceId').textContent = id;
    document.getElementById('confirmDeleteBtn').dataset.id = id;
    const deleteServiceModal = bootstrap.Modal.getInstance(document.getElementById('deleteServiceModal'));
    deleteServiceModal.show();
}

// Подтверждение удаления
function confirmDelete() {
    console.log('confirmDelete called'); // Отладка
    const id = parseInt(document.getElementById('confirmDeleteBtn').dataset.id);
    services = services.filter(service => service.id !== id);
    saveServices();
    const deleteServiceModal = bootstrap.Modal.getInstance(document.getElementById('deleteServiceModal'));
    deleteServiceModal.hide();
    renderServices();
    showToast('Услуга удалена!', 'success');
}

// Редактирование услуги
function editService(id) {
    console.log('editService called, id:', id); // Отладка
    const service = services.find(s => s.id === id);
    if (service) {
        document.getElementById('editName').value = service.name;
        document.getElementById('editCost').value = service.cost;
        loadInventory('edit', service.inventoryIds || []);
        document.getElementById('editCountInTickets').checked = service.countInTickets;
        document.querySelectorAll('#editSalesChannelsContainer .form-check-input').forEach(input => {
            input.checked = service.salesChannels.includes(input.value);
        });
        document.getElementById('saveEditBtn').dataset.id = id;
        const editServiceModal = bootstrap.Modal.getInstance(document.getElementById('editServiceModal'));
        editServiceModal.show();
    }
}

// Сохранение изменений услуги
function saveEdit() {
    console.log('saveEdit called'); // Отладка
    const id = parseInt(document.getElementById('saveEditBtn').dataset.id);
    const service = services.find(s => s.id === id);
    if (service) {
        const name = document.getElementById('editName').value.trim();
        const cost = parseFloat(document.getElementById('editCost').value);
        const inventoryIds = Array.from(document.querySelectorAll('#editInventoryContainer .form-check-input:checked')).map(input => parseInt(input.value));
        const countInTickets = document.getElementById('editCountInTickets').checked;
        const salesChannels = Array.from(document.querySelectorAll('#editSalesChannelsContainer .form-check-input:checked')).map(input => input.value);

        if (!name) {
            showToast('Наименование обязательно для заполнения!', 'danger');
            return;
        }

        if (isNaN(cost) || cost < 0) {
            showToast('Стоимость должна быть положительным числом!', 'danger');
            return;
        }

        if (salesChannels.length === 0) {
            showToast('Выберите хотя бы один вид продаж!', 'danger');
            return;
        }

        service.name = name;
        service.cost = cost;
        service.inventoryIds = inventoryIds;
        service.countInTickets = countInTickets;
        service.salesChannels = salesChannels;

        saveServices();
        const editServiceModal = bootstrap.Modal.getInstance(document.getElementById('editServiceModal'));
        editServiceModal.hide();
        renderServices();
        showToast('Услуга обновлена!', 'success');
    }
}

// Показ уведомления
function showToast(message, type) {
    console.log('showToast called:', message, type); // Отладка
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
    if (e.target.classList.contains('service-checkbox')) {
        updateDeleteButtonState();
    }
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing services page');
    window.initializeServicesPage();
});