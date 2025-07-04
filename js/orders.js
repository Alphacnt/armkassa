console.log('orders.js loaded successfully at:', new Date().toISOString());

// Моковые данные для сеансов (15–30 июня 2025, 6 сеансов в день)
const mockSessions = Array.from({ length: 96 }, (_, i) => {
    const day = 15 + Math.floor(i / 6);
    const hours = [10, 12, 14, 16, 18, 20][i % 6];
    return {
        id: i + 1,
        title: `Сеанс катания ${hours}:00`,
        time: `${hours.toString().padStart(2, '0')}:00`,
        date: `2025-06-${day.toString().padStart(2, '0')}`,
        price: 2000 + (i % 3) * 500
    };
});

const mockServices = [
    { id: 1, name: 'Аренда коньков', price: 1000 },
    { id: 2, name: 'Пингвин для поддержки', price: 1500 },
    { id: 3, name: 'Заточка коньков', price: 800 },
    { id: 4, name: 'Шкафчик для хранения', price: 500 },
    { id: 5, name: 'Инструктор (30 мин)', price: 3000 }
];

let orders = [];
let filteredOrders = [];
let selectedSession = null;
let selectedServices = [];
let isInitialized = false;
let isCreatingOrder = false;
let isCardPaid = false;
let editSelectedSession = null;
let currentPage = 1;
let rowsPerPage = 50;
const MAX_SERVICES = 5;

// Инициализация страницы
window.initializeOrdersPage = function () {
    if (isInitialized) {
        console.log('Orders page already initialized, skipping');
        return;
    }
    isInitialized = true;
    console.log('initializeOrdersPage called at:', new Date().toISOString());

    const elements = {
        ordersTable: document.getElementById('ordersTable'),
        newOrderBtn: document.getElementById('newOrderBtn'),
        newOrderModal: document.getElementById('newOrderModal'),
        editOrderModal: document.getElementById('editOrderModal'),
        deleteOrderModal: document.getElementById('deleteOrderModal'),
        nextBtn: document.getElementById('nextBtn'),
        backBtn: document.getElementById('backBtn'),
        createOrderBtn: document.getElementById('createOrderBtn'),
        payCardBtn: document.getElementById('payCardBtn'),
        deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
        saveEditBtn: document.getElementById('saveEditBtn'),
        confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
        searchInput: document.getElementById('searchInput'),
        dateFilter: document.getElementById('dateFilter'),
        statusFilter: document.getElementById('statusFilter'),
        ticketCount: document.getElementById('ticketCount'),
        customDate: document.getElementById('customDate'),
        sessionSelect: document.getElementById('sessionSelect'),
        paymentMethod: document.getElementById('paymentMethod'),
        cashAmount: document.getElementById('cashAmount'),
        changeAmount: document.getElementById('changeAmount'),
        totalDue: document.getElementById('totalDue'),
        addServiceBtn: document.getElementById('addServiceBtn'),
        pageSizeSelect: document.getElementById('pageSizeSelect')
    };

    // Проверка критических элементов
    const requiredElements = ['ordersTable', 'newOrderBtn', 'newOrderModal'];
    for (const key of requiredElements) {
        if (!elements[key]) {
            console.error(`Critical element ${key} not found`);
            showToast(`Ошибка: элемент ${key} не найден!`, 'danger');
            isInitialized = false;
            return;
        }
    }

    // Инициализация модальных окон
    let newOrderModal, editOrderModal, deleteOrderModal;
    try {
        newOrderModal = new bootstrap.Modal(elements.newOrderModal, { backdrop: 'static' });
        editOrderModal = elements.editOrderModal ? new bootstrap.Modal(elements.editOrderModal, { backdrop: 'static' }) : null;
        deleteOrderModal = elements.deleteOrderModal ? new bootstrap.Modal(elements.deleteOrderModal, { backdrop: 'static' }) : null;
    } catch (error) {
        console.error('Error initializing Bootstrap modals:', error);
        showToast('Ошибка инициализации модальных окон!', 'danger');
        isInitialized = false;
        return;
    }

    // Загрузка заказов
    try {
        const storedOrders = localStorage.getItem('orders');
        console.log('Stored orders:', storedOrders);
        orders = storedOrders ? JSON.parse(storedOrders) : [];
        orders = orders.map((order, index) => ({
            id: order.id || index + 1,
            session: order.session || { title: 'Неизвестно', time: '', date: '', price: 0 },
            services: Array.isArray(order.services) ? order.services : [],
            ticketCount: order.ticketCount || 1,
            paymentMethod: order.paymentMethod || 'card',
            total: order.total || 0,
            status: order.status || 'Не оплачен',
            date: order.date || new Date().toISOString(),
            saleType: order.saleType || 'Продажа'
        }));
        filteredOrders = [...orders];
    } catch (error) {
        console.error('Error loading orders from localStorage:', error);
        showToast('Ошибка загрузки заказов!', 'danger');
        orders = [];
        filteredOrders = [];
    }

    if (elements.pageSizeSelect) {
        elements.pageSizeSelect.value = rowsPerPage.toString();
    }

    bindEvents();
    filterOrders();
};

// Привязка событий
function bindEvents() {
    const elements = {
        newOrderBtn: document.getElementById('newOrderBtn'),
        nextBtn: document.getElementById('nextBtn'),
        backBtn: document.getElementById('backBtn'),
        createOrderBtn: document.getElementById('createOrderBtn'),
        payCardBtn: document.getElementById('payCardBtn'),
        deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
        saveEditBtn: document.getElementById('saveEditBtn'),
        confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
        searchInput: document.getElementById('searchInput'),
        dateFilter: document.getElementById('dateFilter'),
        statusFilter: document.getElementById('statusFilter'),
        ticketCount: document.getElementById('ticketCount'),
        customDatetime: document.getElementById('customDate'),
        sessionSelect: document.getElementById('sessionSelect'),
        paymentMethod: document.getElementById('paymentMethod'),
        cashAmount: document.getElementById('cashAmount'),
        addServiceBtn: document.getElementById('addServiceBtn'),
        pageSizeSelect: document.getElementById('pageSizeSelect')
    };

    const events = [
        { element: elements.newOrderBtn, type: 'click', handler: showNewOrderModal },
        { element: elements.nextBtn, type: 'click', handler: nextStep },
        { element: elements.backBtn, type: 'click', handler: goBackStep },
        { element: elements.createOrderBtn, type: 'click', handler: createOrder },
        { element: elements.payCardBtn, type: 'click', handler: payByCard },
        { element: elements.deleteSelectedBtn, type: 'click', handler: deleteSelected },
        { element: elements.saveEditBtn, type: 'click', handler: saveEdit },
        { element: elements.confirmDeleteBtn, type: 'click', handler: confirmDelete },
        { element: elements.searchInput, type: 'input', handler: filterOrders },
        { element: elements.dateFilter, type: 'change', handler: filterOrders },
        { element: elements.statusFilter, type: 'change', handler: filterOrders },
        { element: elements.ticketCount, type: 'input', handler: calculateTotal },
        { element: elements.customDate, type: 'change', handler: loadSessions },
        { element: elements.sessionSelect, type: 'change', handler: selectSession },
        { element: elements.paymentMethod, type: 'change', handler: handlePaymentMethod },
        { element: elements.cashAmount, type: 'input', handler: calculateChange },
        { element: elements.pageSizeSelect, type: 'change', handler: handleRowsPerPage }
    ];

    events.forEach(({ element, type, handler }) => {
        if (element) {
            element.removeEventListener(type, handler);
            element.addEventListener(type, handler);
            console.log(`Event ${type} bound to ${element.id || element.tagName}`);
        } else {
            console.warn(`Element for ${type} event not found`);
        }
    });

    document.removeEventListener('change', handleCheckboxChange);
    document.addEventListener('change', handleCheckboxChange);
}

// Обработчик изменения количества записей
function handleRowsPerPage() {
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        rowsPerPage = parseInt(pageSizeSelect.value, 10);
        currentPage = 1;
        console.log('Rows per page changed to:', rowsPerPage);
        filterOrders();
    } else {
        console.warn('pageSizeSelect not found');
    }
}

// Сохранение30/6/2025 заказов
function saveOrders() {
    console.log('Saving orders:', orders);
    try {
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log('Orders saved to localStorage');
    } catch (error) {
        console.error('Error saving orders to localStorage:', error);
        showToast('Ошибка сохранения заказов!', 'danger');
    }
}

// Показать модальное окно создания
function showNewOrderModal() {
    console.log('showNewOrderModal called');
    resetNewOrderModal();
    const newOrderModal = bootstrap.Modal.getInstance(document.getElementById('newOrderModal'));
    if (newOrderModal) {
        newOrderModal.show();
    } else {
        console.error('New order modal instance not found');
        showToast('Ошибка открытия модального окна!', 'danger');
    }
}

// Сброс модального окна
function resetNewOrderModal() {
    console.log('resetNewOrderModal called');
    isCreatingOrder = false;
    isCardPaid = false;
    selectedSession = null;
    selectedServices = [];
    
    const elements = {
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        backBtn: document.getElementById('backBtn'),
        nextBtn: document.getElementById('nextBtn'),
        createOrderBtn: document.getElementById('createOrderBtn'),
        payCardBtn: document.getElementById('payCardBtn'),
        sessionSelect: document.getElementById('sessionSelect'),
        servicesContainer: document.getElementById('servicesContainer'),
        ticketCount: document.getElementById('ticketCount'),
        paymentMethod: document.getElementById('paymentMethod'),
        cashPaymentFields: document.getElementById('cashPaymentFields'),
        addServiceBtn: document.getElementById('addServiceBtn'),
        customDate: document.getElementById('customDate'),
        cashAmount: document.getElementById('cashAmount'),
        changeAmount: document.getElementById('changeAmount'),
        totalDue: document.getElementById('totalDue'),
        ticketsAmount: document.getElementById('ticketsAmount'),
        discountAmount: document.getElementById('discountAmount'),
        totalAmount: document.getElementById('totalAmount'),
        selectedSessionInfo: document.getElementById('selectedSessionInfo')
    };

    if (elements.step1) elements.step1.classList.remove('hidden');
    if (elements.step2) elements.step2.classList.add('hidden');
    if (elements.backBtn) elements.backBtn.style.display = 'none';
    if (elements.nextBtn) {
        elements.nextBtn.style.display = 'inline-block';
        elements.nextBtn.disabled = true;
    }
    if (elements.createOrderBtn) elements.createOrderBtn.style.display = 'none';
    if (elements.payCardBtn) elements.payCardBtn.style.display = 'none';
    if (elements.sessionSelect) {
        elements.sessionSelect.innerHTML = '<option value="">Выберите сеанс</option>';
    }
    if (elements.servicesContainer) {
        elements.servicesContainer.innerHTML = `
            <div class="mb-3 service-select-wrapper">
                <select class="form-select" onchange="calculateTotal()">
                    <option value="">Выберите услугу</option>
                </select>
            </div>
        `;
    }
    if (elements.ticketCount) elements.ticketCount.value = 1;
    if (elements.paymentMethod) elements.paymentMethod.value = 'card';
    if (elements.cashPaymentFields) elements.cashPaymentFields.classList.add('hidden');
    if (elements.addServiceBtn) elements.addServiceBtn.disabled = false;
    if (elements.customDate) elements.customDate.value = '';
    if (elements.cashAmount) elements.cashAmount.value = '';
    if (elements.changeAmount) elements.changeAmount.value = '';
    if (elements.totalDue) elements.totalDue.value = '';
    if (elements.ticketsAmount) elements.ticketsAmount.textContent = '0 ₸';
    if (elements.discountAmount) elements.discountAmount.textContent = '0 ₸';
    if (elements.totalAmount) elements.totalAmount.textContent = '0 ₸';
    if (elements.selectedSessionInfo) elements.selectedSessionInfo.innerHTML = '';

    loadServices();
    calculateTotal();
}

// Выбор даты
window.selectDate = function (type) {
    console.log('selectDate called, type:', type);
    let date;
    if (type === 'today') {
        date = new Date().toISOString().split('T')[0];
    } else if (type === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        date = tomorrow.toISOString().split('T')[0];
    }
    const customDate = document.getElementById('customDate');
    if (customDate) {
        customDate.value = date;
        loadSessions();
    } else {
        console.warn('customDate input not found');
        showToast('Ошибка: поле даты не найдено!', 'danger');
    }
};

// Загрузка сеансов
function loadSessions() {
    console.log('loadSessions called');
    const date = document.getElementById('customDate')?.value;
    const sessionSelect = document.getElementById('sessionSelect');
    if (!sessionSelect) {
        console.warn('sessionSelect not found');
        showToast('Ошибка: поле выбора сеанса не найдено!', 'danger');
        return;
    }
    if (!date) {
        console.log('No date selected');
        sessionSelect.innerHTML = '<option value="">Выберите сеанс</option>';
        return;
    }

    sessionSelect.innerHTML = '<option value="">Выберите сеанс</option>';
    const filteredSessions = mockSessions.filter(session => session.date === date);
    console.log('Filtered sessions:', filteredSessions);
    filteredSessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session.id;
        option.textContent = `${session.title} (${session.time}, ${session.price} ₸)`;
        sessionSelect.appendChild(option);
    });
}

// Выбор сеанса
function selectSession() {
    console.log('selectSession called');
    const sessionSelect = document.getElementById('sessionSelect');
    if (!sessionSelect) {
        console.warn('sessionSelect not found');
        showToast('Ошибка: поле выбора сеанса не найдено!', 'danger');
        return;
    }
    const sessionId = parseInt(sessionSelect.value);
    selectedSession = mockSessions.find(session => session.id === sessionId) || null;
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = !selectedSession;
    } else {
        console.warn('nextBtn not found');
    }
    console.log('Selected session:', selectedSession);
    calculateTotal();
}

// Загрузка услуг
function loadServices() {
    console.log('loadServices called');
    const servicesContainer = document.getElementById('servicesContainer');
    if (!servicesContainer) {
        console.warn('servicesContainer not found');
        showToast('Ошибка: контейнер услуг не найден!', 'danger');
        return;
    }
    const selects = servicesContainer.querySelectorAll('.form-select');
    const currentSelections = Array.from(selects).map(select => select.value);
    
    selects.forEach((select, index) => {
        select.innerHTML = '<option value="">Выберите услугу</option>';
        mockServices.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${service.name} (${service.price} ₸)`;
            select.appendChild(option);
        });
        if (currentSelections[index]) {
            select.value = currentSelections[index];
        }
    });
}

// Добавление нового select для услуг
window.addServiceSelect = function () {
    console.log('addServiceSelect called');
    const container = document.getElementById('servicesContainer');
    if (!container) {
        console.warn('servicesContainer not found');
        showToast('Ошибка: контейнер услуг не найден!', 'danger');
        return;
    }
    const currentCount = container.querySelectorAll('.service-select-wrapper').length;
    if (currentCount >= MAX_SERVICES) {
        const addServiceBtn = document.getElementById('addServiceBtn');
        if (addServiceBtn) addServiceBtn.disabled = true;
        return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-3 service-select-wrapper';
    wrapper.innerHTML = `
        <select class="form-select" onchange="calculateTotal()">
            <option value="">Выберите услугу</option>
        </select>
        <button class="btn btn-outline-danger mt-2" onclick="removeServiceSelect(this)">Удалить</button>
    `;
    container.appendChild(wrapper);
    loadServices();
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) addServiceBtn.disabled = currentCount + 1 >= MAX_SERVICES;
};

// Удаление select для услуг
window.removeServiceSelect = function (btn) {
    console.log('removeServiceSelect called');
    if (!btn || !btn.parentElement) {
        console.warn('Invalid button or parent element');
        return;
    }
    btn.parentElement.remove();
    calculateTotal();
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) {
        addServiceBtn.disabled = document.querySelectorAll('#servicesContainer .service-select-wrapper').length >= MAX_SERVICES;
    }
};

// Переход к следующему шагу
function nextStep() {
    console.log('nextStep called');
    const elements = {
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        backBtn: document.getElementById('backBtn'),
        nextBtn: document.getElementById('nextBtn'),
        createOrderBtn: document.getElementById('createOrderBtn'),
        selectedSessionInfo: document.getElementById('selectedSessionInfo')
    };

    if (!elements.step1 || !elements.step2) {
        console.warn('step1 or step2 not found');
        showToast('Ошибка: шаги модального окна не найдены!', 'danger');
        return;
    }

    elements.step1.classList.add('hidden');
    elements.step2.classList.remove('hidden');
    if (elements.backBtn) elements.backBtn.style.display = 'inline-block';
    if (elements.nextBtn) elements.nextBtn.style.display = 'none';
    if (elements.createOrderBtn) elements.createOrderBtn.style.display = 'inline-block';
    if (elements.selectedSessionInfo) {
        elements.selectedSessionInfo.innerHTML = selectedSession ? `
            Выбранный сеанс: ${selectedSession.title} (${selectedSession.time}, ${selectedSession.date}, ${selectedSession.price} ₸)
        ` : 'Сеанс не выбран';
    }
    handlePaymentMethod();
    calculateTotal();
}

// Возврат к предыдущему шагу
function goBackStep() {
    console.log('goBackStep called');
    const elements = {
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        backBtn: document.getElementById('backBtn'),
        nextBtn: document.getElementById('nextBtn'),
        createOrderBtn: document.getElementById('createOrderBtn'),
        payCardBtn: document.getElementById('payCardBtn'),
        addServiceBtn: document.getElementById('addServiceBtn')
    };

    if (!elements.step1 || !elements.step2) {
        console.warn('step1 or step2 not found');
        showToast('Ошибка: шаги модального окна не найдены!', 'danger');
        return;
    }

    elements.step1.classList.remove('hidden');
    elements.step2.classList.add('hidden');
    if (elements.backBtn) elements.backBtn.style.display = 'none';
    if (elements.nextBtn) elements.nextBtn.style.display = 'inline-block';
    if (elements.createOrderBtn) elements.createOrderBtn.style.display = 'none';
    if (elements.payCardBtn) elements.payCardBtn.style.display = 'none';
    isCardPaid = false;
    if (elements.addServiceBtn) elements.addServiceBtn.disabled = false;
    calculateTotal();
}

// Обработка способа оплаты
function handlePaymentMethod() {
    console.log('handlePaymentMethod called');
    const method = document.getElementById('paymentMethod')?.value;
    const cashFields = document.getElementById('cashPaymentFields');
    const createBtn = document.getElementById('createOrderBtn');
    const payCardBtn = document.getElementById('payCardBtn');

    if (!method || !createBtn || !payCardBtn) {
        console.warn('paymentMethod, createOrderBtn or payCardBtn not found');
        return;
    }

    if (method === 'cash') {
        if (cashFields) cashFields.classList.remove('hidden');
        createBtn.style.display = 'inline-block';
        payCardBtn.style.display = 'none';
        calculateChange();
    } else {
        if (cashFields) cashFields.classList.add('hidden');
        createBtn.style.display = isCardPaid ? 'inline-block' : 'none';
        payCardBtn.style.display = isCardPaid ? 'none' : 'inline-block';
    }
}

// Расчёт сдачи
function calculateChange() {
    console.log('calculateChange called');
    const totalDue = parseFloat(document.getElementById('totalDue')?.value) || 0;
    const cashAmount = parseFloat(document.getElementById('cashAmount')?.value) || 0;
    const change = cashAmount - totalDue;
    const changeAmount = document.getElementById('changeAmount');
    if (changeAmount) {
        changeAmount.value = change >= 0 ? change.toFixed(2) : 0;
    }
    const createOrderBtn = document.getElementById('createOrderBtn');
    if (createOrderBtn) {
        createOrderBtn.disabled = change < 0 || !selectedSession;
    }
}

// Оплата картой
function payByCard() {
    console.log('payByCard called');
    if (isCardPaid) return;
    showToast('Идёт связь с терминалом...', 'info');
    setTimeout(() => {
        isCardPaid = true;
        showToast('Оплата картой прошла успешно!', 'success');
        const payCardBtn = document.getElementById('payCardBtn');
        const createOrderBtn = document.getElementById('createOrderBtn');
        if (payCardBtn) payCardBtn.style.display = 'none';
        if (createOrderBtn) {
            createOrderBtn.style.display = 'inline-block';
            createOrderBtn.disabled = !selectedSession;
        }
    }, 2000);
}

// Расчёт итоговой суммы
function calculateTotal() {
    console.log('calculateTotal called');
    const ticketCount = parseInt(document.getElementById('ticketCount')?.value) || 1;
    selectedServices = [];
    const servicesContainer = document.getElementById('servicesContainer');
    if (servicesContainer) {
        servicesContainer.querySelectorAll('.form-select').forEach(select => {
            const serviceId = parseInt(select.value);
            if (serviceId) {
                const service = mockServices.find(s => s.id === serviceId);
                if (service && !selectedServices.some(s => s.id === service.id)) {
                    selectedServices.push(service);
                }
            }
        });
    }

    const sessionPrice = selectedSession ? selectedSession.price : 0;
    const servicesTotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const total = ticketCount * (sessionPrice + servicesTotal);

    const elements = {
        ticketsAmount: document.getElementById('ticketsAmount'),
        discountAmount: document.getElementById('discountAmount'),
        totalAmount: document.getElementById('totalAmount'),
        totalDue: document.getElementById('totalDue'),
        createOrderBtn: document.getElementById('createOrderBtn')
    };

    if (elements.ticketsAmount) elements.ticketsAmount.textContent = `${total} ₸`;
    if (elements.discountAmount) elements.discountAmount.textContent = '0 ₸';
    if (elements.totalAmount) elements.totalAmount.textContent = `${total} ₸`;
    if (elements.totalDue) elements.totalDue.value = total;
    if (elements.createOrderBtn) elements.createOrderBtn.disabled = total === 0 || !selectedSession;
    if (document.getElementById('paymentMethod')?.value === 'cash') calculateChange();
}

// Создание заказа
function createOrder() {
    console.log('createOrder called at:', new Date().toISOString());
    if (isCreatingOrder) {
        showToast('Заказ уже создаётся!', 'warning');
        return;
    }
    isCreatingOrder = true;

    try {
        if (!selectedSession) {
            showToast('Выберите сеанс!', 'danger');
            isCreatingOrder = false;
            return;
        }

        const ticketCount = parseInt(document.getElementById('ticketCount')?.value) || 1;
        const paymentMethod = document.getElementById('paymentMethod')?.value;
        const sessionPrice = selectedSession.price;
        const servicesTotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
        const total = ticketCount * (sessionPrice + servicesTotal);

        let status = 'Не оплачен';
        if (paymentMethod === 'cash') {
            const cashAmount = parseFloat(document.getElementById('cashAmount')?.value) || 0;
            status = cashAmount >= total ? 'Оплачено' : 'Не оплачен';
            if (cashAmount < total) {
                showToast('Недостаточно наличных!', 'danger');
                isCreatingOrder = false;
                return;
            }
        } else if (paymentMethod === 'card' && isCardPaid) {
            status = 'Оплачено';
        } else {
            showToast('Оплата картой не подтверждена!', 'danger');
            isCreatingOrder = false;
            return;
        }

        const maxId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) : 0;
        const order = {
            id: maxId + 1,
            session: selectedSession,
            services: [...selectedServices],
            ticketCount,
            paymentMethod,
            total,
            status,
            date: new Date().toISOString(),
            saleType: 'Продажа'
        };

        if (orders.some(o => o.id === order.id)) {
            showToast('Заказ с таким ID уже существует!', 'danger');
            isCreatingOrder = false;
            return;
        }

        orders.push(order);
        saveOrders();
        const newOrderModal = bootstrap.Modal.getInstance(document.getElementById('newOrderModal'));
        if (newOrderModal) newOrderModal.hide();
        filterOrders();
        showToast('Заказ создан успешно!', 'success');
    } catch (error) {
        console.error('Error creating order:', error);
        showToast('Ошибка при создании заказа!', 'danger');
    } finally {
        isCreatingOrder = false;
    }
}

// Рендеринг таблицы
function renderOrders() {
    console.log('renderOrders called, filteredOrders:', filteredOrders.length);
    const tableBody = document.getElementById('ordersTable');
    if (!tableBody) {
        console.error('Orders table body not found');
        showToast('Ошибка: таблица заказов не найдена!', 'danger');
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pagedOrders = filteredOrders.slice(start, end);

    tableBody.innerHTML = pagedOrders.length ? pagedOrders.map(order => `
        <tr>
            <td><input type="checkbox" class="order-checkbox" data-id="${order.id}"></td>
            <td>${order.id}</td>
            <td>${new Date(order.date).toLocaleString('ru-RU')}</td>
            <td>${order.total} ₸</td>
            <td><span class="badge ${order.status === 'Оплачено' ? 'bg-success' : 'bg-danger'}">${order.total} ₸</span></td>
            <td>${order.ticketCount}</td>
            <td>${order.status}</td>
            <td>${order.saleType}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-order-btn" data-id="${order.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger delete-order-btn" data-id="${order.id}"><i class="bi bi-trash"></i></button>
                <button class="btn btn-sm btn-success print-order-btn" data-id="${order.id}"><i class="bi bi-printer"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="9" class="text-center py-4">Нет данных для отображения.</td></tr>';

    bindActionButtons();
    updateDeleteButtonState();
    renderPagination();
}

// Рендеринг пагинации
function renderPagination() {
    console.log('renderPagination called');
    const pagination = document.getElementById('paginationContainer');
    if (!pagination) {
        console.warn('paginationContainer not found');
        return;
    }

    pagination.innerHTML = '<nav><ul class="pagination mb-0"></ul></nav>';
    const ul = pagination.querySelector('ul');
    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
    const createPageItem = (page, text = page, active = false, disabled = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
        if (!disabled) {
            li.addEventListener('click', e => {
                e.preventDefault();
                currentPage = page;
                renderOrders();
            });
        }
        ul.appendChild(li);
    };

    createPageItem(currentPage - 1, '«', false, currentPage === 1);
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        createPageItem(i, i, i === currentPage);
    }
    createPageItem(currentPage + 1, '»', false, currentPage === totalPages);
}

// Привязка событий для кнопок
function bindActionButtons() {
    console.log('bindActionButtons called');
    document.querySelectorAll('.edit-order-btn').forEach(btn => {
        btn.removeEventListener('click', handleEditOrder);
        btn.addEventListener('click', handleEditOrder);
    });
    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteOrder);
        btn.addEventListener('click', handleDeleteOrder);
    });
    document.querySelectorAll('.print-order-btn').forEach(btn => {
        btn.removeEventListener('click', handlePrintOrder);
        btn.addEventListener('click', handlePrintOrder);
    });
}

// Редактирование заказа
function handleEditOrder(e) {
    const id = parseInt(e.target.closest('button').dataset.id);
    console.log('handleEditOrder called, id:', id);
    editOrder(id);
}

// Показать модальное окно удаления
function handleDeleteOrder(e) {
    const id = parseInt(e.target.closest('button').dataset.id);
    console.log('handleDeleteOrder called, id:', id);
    showDeleteModal(id);
}

// Печать заказа
function handlePrintOrder(e) {
    const id = parseInt(e.target.closest('button').dataset.id);
    console.log('handlePrintOrder called, id:', id);
    const order = orders.find(o => o.id === id);
    if (order) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Печать заказа #${order.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .order-details { max-width: 600px; margin: 0 auto; }
                        .order-details h2 { text-align: center; }
                        .order-details table { width: 100%; border-collapse: collapse; }
                        .order-details th, .order-details td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        .order-details th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <div class="order-details">
                        <h2>Заказ #${order.id}</h2>
                        <table>
                            <tr><th>Сеанс</th><td>${order.session.title} (${order.session.time}, ${order.session.date})</td></tr>
                            <tr><th>Услуги</th><td>${order.services.map(s => `${s.name} (${s.price} ₸)`).join(', ') || 'Нет услуг'}</td></tr>
                            <tr><th>Количество билетов</th><td>${order.ticketCount}</td></tr>
                            <tr><th>Сумма</th><td>${order.total} ₸</td></tr>
                            <tr><th>Статус</th><td>${order.status}</td></tr>
                            <tr><th>Тип продажи</th><td>${order.saleType}</td></tr>
                            <tr><th>Способ оплаты</th><td>${order.paymentMethod === 'card' ? 'Оплата картой' : 'Оплата наличными'}</td></tr>
                            <tr><th>Дата и время</th><td>${new Date(order.date).toLocaleString('ru-RU')}</td></tr>
                        </table>
                    </div>
                    <script>
                        window.print();
                        window.onafterprint = () => window.close();
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
}

// Фильтрация заказов
function filterOrders() {
    console.log('filterOrders called');
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const date = document.getElementById('dateFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';

    filteredOrders = orders.filter(order => {
        const matchesSearch = order.id.toString().includes(search) ||
            order.session.title.toLowerCase().includes(search) ||
            order.services.some(service => service.name.toLowerCase().includes(search));
        const matchesDate = date ? order.date.split('T')[0] === date : true;
        const matchesStatus = status ? order.status === status : true;
        return matchesSearch && matchesDate && matchesStatus;
    });

    currentPage = 1;
    renderOrders();
}

// Обновление кнопки удаления
function updateDeleteButtonState() {
    console.log('updateDeleteButtonState called');
    const checkboxes = document.querySelectorAll('.order-checkbox:checked');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.disabled = checkboxes.length === 0;
    }
}

// Удаление выбранных
function deleteSelected() {
    console.log('deleteSelected called');
    const selectedIds = Array.from(document.querySelectorAll('.order-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
    if (selectedIds.length > 0) {
        orders = orders.filter(order => !selectedIds.includes(order.id));
        saveOrders();
        filterOrders();
        showToast('Выбранные заказы удалены!', 'success');
    }
}

// Показать модальное окно удаления
function showDeleteModal(id) {
    console.log('showDeleteModal called, id:', id);
    const deleteOrderId = document.getElementById('deleteOrderId');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (deleteOrderId) deleteOrderId.textContent = id;
    if (confirmDeleteBtn) confirmDeleteBtn.dataset.id = id;
    const deleteOrderModal = bootstrap.Modal.getInstance(document.getElementById('deleteOrderModal'));
    if (deleteOrderModal) {
        deleteOrderModal.show();
    } else {
        console.warn('deleteOrderModal not found');
        showToast('Ошибка: модальное окно удаления не найдено!', 'danger');
    }
}

// Подтверждение удаления
function confirmDelete() {
    console.log('confirmDelete called');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (!confirmDeleteBtn) {
        console.warn('confirmDeleteBtn not found');
        return;
    }
    const id = parseInt(confirmDeleteBtn.dataset.id);
    orders = orders.filter(order => order.id !== id);
    saveOrders();
    const deleteOrderModal = bootstrap.Modal.getInstance(document.getElementById('deleteOrderModal'));
    if (deleteOrderModal) deleteOrderModal.hide();
    filterOrders();
    showToast('Заказ удалён!', 'success');
}

// Редактирование заказа
function editOrder(id) {
    console.log('editOrder called, id:', id);
    const order = orders.find(o => o.id === id);
    if (!order) {
        showToast('Заказ не найден!', 'danger');
        return;
    }
    editSelectedSession = order.session;
    selectedServices = [...order.services];
    const elements = {
        editCustomDate: document.getElementById('editCustomDate'),
        editTicketCount: document.getElementById('editTicketCount'),
        editPaymentMethod: document.getElementById('editPaymentMethod'),
        editTotalDue: document.getElementById('editTotalDue'),
        editServicesContainer: document.getElementById('editServicesContainer'),
        addEditServiceBtn: document.getElementById('addEditServiceBtn'),
        saveEditBtn: document.getElementById('saveEditBtn')
    };

    if (!elements.editCustomDate || !elements.editTicketCount || !elements.editPaymentMethod || !elements.editServicesContainer) {
        console.warn('Edit modal elements missing');
        showToast('Ошибка: элементы модального окна редактирования не найдены!', 'danger');
        return;
    }

    elements.editCustomDate.value = order.session.date;
    elements.editTicketCount.value = order.ticketCount;
    elements.editPaymentMethod.value = order.paymentMethod;
    elements.editTotalDue.value = order.total;
    elements.editServicesContainer.innerHTML = selectedServices.length > 0 ? selectedServices.map(() => `
        <div class="mb-3 service-select-wrapper">
            <select class="form-select" onchange="updateEditTotal()">
                <option value="">Выберите услугу</option>
            </select>
            <button class="btn btn-outline-danger mt-2" onclick="removeEditServiceSelect(this)">Удалить</button>
        </div>
    `).join('') : `
        <div class="mb-3 service-select-wrapper">
            <select class="form-select" onchange="updateEditTotal()">
                <option value="">Выберите услугу</option>
            </select>
        </div>
    `;
    if (elements.addEditServiceBtn) elements.addEditServiceBtn.disabled = selectedServices.length >= MAX_SERVICES;
    if (elements.saveEditBtn) elements.saveEditBtn.dataset.id = id;

    loadEditSessions();
    loadEditServices();
    setTimeout(() => {
        const selects = document.querySelectorAll('#editServicesContainer .form-select');
        selectedServices.forEach((service, index) => {
            if (selects[index]) selects[index].value = service.id;
        });
    }, 100);
    updateEditTotal();
    handleEditPaymentMethod();
    const editOrderModal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
    if (editOrderModal) {
        editOrderModal.show();
    } else {
        console.warn('editOrderModal not found');
        showToast('Ошибка: модальное окно редактирования не найдено!', 'danger');
    }
}

// Загрузка сеансов для редактирования
function loadEditSessions() {
    console.log('loadEditSessions called');
    const date = document.getElementById('editCustomDate')?.value;
    const sessionSelect = document.getElementById('editSessionSelect');
    if (!sessionSelect) {
        console.warn('editSessionSelect not found');
        return;
    }

    sessionSelect.innerHTML = '<option value="">Выберите сеанс</option>';
    if (!date) return;

    const filteredSessions = mockSessions.filter(session => session.date === date);
    filteredSessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session.id;
        option.textContent = `${session.title} (${session.time}, ${session.price} ₸)`;
        if (editSelectedSession && editSelectedSession.id === session.id) option.selected = true;
        sessionSelect.appendChild(option);
    });

    sessionSelect.removeEventListener('change', selectEditSession);
    sessionSelect.addEventListener('change', selectEditSession);
}

function selectEditSession() {
    console.log('selectEditSession called');
    const sessionSelect = document.getElementById('editSessionSelect');
    if (!sessionSelect) return;
    const sessionId = parseInt(sessionSelect.value);
    editSelectedSession = mockSessions.find(session => session.id === sessionId) || null;
    updateEditTotal();
}

// Загрузка услуг для редактирования
function loadEditServices() {
    console.log('loadEditServices called');
    const selects = document.querySelectorAll('#editServicesContainer .form-select');
    const currentSelections = Array.from(selects).map(select => select.value);
    
    selects.forEach((select, index) => {
        select.innerHTML = '<option value="">Выберите услугу</option>';
        mockServices.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${service.name} (${service.price} ₸)`;
            select.appendChild(option);
        });
        if (currentSelections[index]) {
            select.value = currentSelections[index];
        }
    });
}

// Добавление select для услуг в редактировании
window.addEditServiceSelect = function () {
    console.log('addEditServiceSelect called');
    const container = document.getElementById('editServicesContainer');
    if (!container) {
        console.warn('editServicesContainer not found');
        return;
    }
    const currentCount = container.querySelectorAll('.service-select-wrapper').length;
    if (currentCount >= MAX_SERVICES) {
        const addEditServiceBtn = document.getElementById('addEditServiceBtn');
        if (addEditServiceBtn) addEditServiceBtn.disabled = true;
        return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-3 service-select-wrapper';
    wrapper.innerHTML = `
        <select class="form-select" onchange="updateEditTotal()">
            <option value="">Выберите услугу</option>
        </select>
        <button class="btn btn-outline-danger mt-2" onclick="removeEditServiceSelect(this)">Удалить</button>
    `;
    container.appendChild(wrapper);
    loadEditServices();
    const addEditServiceBtn = document.getElementById('addEditServiceBtn');
    if (addEditServiceBtn) addEditServiceBtn.disabled = currentCount + 1 >= MAX_SERVICES;
};

// Удаление select для услуг в редактировании
window.removeEditServiceSelect = function (btn) {
    console.log('removeEditServiceSelect called');
    if (!btn || !btn.parentElement) {
        console.warn('Invalid button or parent element');
        return;
    }
    btn.parentElement.remove();
    updateEditTotal();
    const addEditServiceBtn = document.getElementById('addEditServiceBtn');
    if (addEditServiceBtn) {
        addEditServiceBtn.disabled = document.querySelectorAll('#editServicesContainer .service-select-wrapper').length >= MAX_SERVICES;
    }
};

// Обработка способа оплаты в редактировании
function handleEditPaymentMethod() {
    console.log('handleEditPaymentMethod called');
    const method = document.getElementById('editPaymentMethod')?.value;
    const cashFields = document.getElementById('editCashPaymentFields');
    const saveBtn = document.getElementById('saveEditBtn');
    const payCardBtn = document.getElementById('editPayCardBtn');

    if (!method || !saveBtn || !payCardBtn) {
        console.warn('editPaymentMethod, saveEditBtn or editPayCardBtn not found');
        return;
    }

    if (method === 'cash') {
        if (cashFields) cashFields.classList.remove('hidden');
        saveBtn.style.display = 'inline-block';
        payCardBtn.style.display = 'none';
        calculateEditChange();
    } else {
        if (cashFields) cashFields.classList.add('hidden');
        saveBtn.style.display = isCardPaid ? 'inline-block' : 'none';
        payCardBtn.style.display = isCardPaid ? 'none' : 'inline-block';
    }
}

// Расчёт сдачи в редактировании
function calculateEditChange() {
    console.log('calculateEditChange called');
    const totalDue = parseFloat(document.getElementById('editTotalDue')?.value) || 0;
    const cashAmount = parseFloat(document.getElementById('editCashAmount')?.value) || 0;
    const change = cashAmount - totalDue;
    const editChangeAmount = document.getElementById('editChangeAmount');
    if (editChangeAmount) {
        editChangeAmount.value = change >= 0 ? change.toFixed(2) : 0;
    }
    const saveEditBtn = document.getElementById('saveEditBtn');
    if (saveEditBtn) {
        saveEditBtn.disabled = change < 0 || !editSelectedSession;
    }
}

// Оплата картой в редактировании
window.editPayByCard = function () {
    console.log('editPayByCard called');
    if (isCardPaid) return;
    showToast('Идёт связь с терминалом...', 'info');
    setTimeout(() => {
        isCardPaid = true;
        showToast('Оплата картой прошла успешно!', 'success');
        const editPayCardBtn = document.getElementById('editPayCardBtn');
        const saveEditBtn = document.getElementById('saveEditBtn');
        if (editPayCardBtn) editPayCardBtn.style.display = 'none';
        if (saveEditBtn) {
            saveEditBtn.style.display = 'inline-block';
            saveEditBtn.disabled = !editSelectedSession;
        }
    }, 2000);
}

// Обновление суммы в редактировании
function updateEditTotal() {
    console.log('updateEditTotal called');
    const ticketCount = parseInt(document.getElementById('editTicketCount')?.value) || 1;
    selectedServices = [];
    const editServicesContainer = document.getElementById('editServicesContainer');
    if (editServicesContainer) {
        editServicesContainer.querySelectorAll('.form-select').forEach(select => {
            const serviceId = parseInt(select.value);
            if (serviceId) {
                const service = mockServices.find(s => s.id === serviceId);
                if (service && !selectedServices.some(s => s.id === service.id)) {
                    selectedServices.push(service);
                }
            }
        });
    }

    const sessionPrice = editSelectedSession ? editSelectedSession.price : 0;
    const servicesTotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const total = ticketCount * (sessionPrice + servicesTotal);

    const elements = {
        editTicketsAmount: document.getElementById('editTicketsAmount'),
        editDiscountAmount: document.getElementById('editDiscountAmount'),
        editTotalAmount: document.getElementById('editTotalAmount'),
        editTotalDue: document.getElementById('editTotalDue'),
        saveEditBtn: document.getElementById('saveEditBtn')
    };

    if (elements.editTicketsAmount) elements.editTicketsAmount.textContent = `${total} ₸`;
    if (elements.editDiscountAmount) elements.editDiscountAmount.textContent = '0 ₸';
    if (elements.editTotalAmount) elements.editTotalAmount.textContent = `${total} ₸`;
    if (elements.editTotalDue) elements.editTotalDue.value = total;
    if (elements.saveEditBtn) elements.saveEditBtn.disabled = total === 0 || !editSelectedSession;
    if (document.getElementById('editPaymentMethod')?.value === 'cash') calculateEditChange();
}

// Сохранение изменений
function saveEdit() {
    console.log('saveEdit called');
    const saveEditBtn = document.getElementById('saveEditBtn');
    if (!saveEditBtn) {
        console.warn('saveEditBtn not found');
        return;
    }
    const id = parseInt(saveEditBtn.dataset.id);
    const order = orders.find(o => o.id === id);
    if (!order) {
        showToast('Заказ не найден!', 'danger');
        return;
    }
    if (!editSelectedSession) {
        showToast('Выберите сеанс!', 'danger');
        return;
    }

    const ticketCount = parseInt(document.getElementById('editTicketCount')?.value) || 1;
    const paymentMethod = document.getElementById('editPaymentMethod')?.value;
    const sessionPrice = editSelectedSession.price;
    const servicesTotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const total = ticketCount * (sessionPrice + servicesTotal);

    let status = 'Не оплачен';
    if (paymentMethod === 'cash') {
        const cashAmount = parseFloat(document.getElementById('editCashAmount')?.value) || 0;
        status = cashAmount >= total ? 'Оплачено' : 'Не оплачен';
        if (cashAmount < total) {
            showToast('Недостаточно наличных!', 'danger');
            return;
        }
    } else if (paymentMethod === 'card' && isCardPaid) {
        status = 'Оплачено';
    } else {
        showToast('Оплата картой не подтверждена!', 'danger');
        return;
    }

    order.session = editSelectedSession;
    order.ticketCount = ticketCount;
    order.paymentMethod = paymentMethod;
    order.services = [...selectedServices];
    order.total = total;
    order.status = status;
    saveOrders();
    const editOrderModal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
    if (editOrderModal) editOrderModal.hide();
    filterOrders();
    showToast('Заказ обновлён!', 'success');
}

// Показ уведомления
function showToast(message, type) {
    console.log('showToast called:', message, type);
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        console.warn('Toast container not found');
        return;
    }
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

// Обработчик чекбоксов
function handleCheckboxChange(e) {
    if (e.target.classList.contains('order-checkbox')) {
        updateDeleteButtonState();
    }
}

// Совместимость с inline
window.showNewOrderModal = showNewOrderModal;
window.selectDate = selectDate;
window.loadSessions = loadSessions;
window.nextStep = nextStep;
window.goBackStep = goBackStep;
window.calculateTotal = calculateTotal;
window.createOrder = createOrder;
window.filterOrders = filterOrders;
window.deleteSelected = deleteSelected;
window.showDeleteModal = showDeleteModal;
window.confirmDelete = confirmDelete;
window.editOrder = editOrder;
window.saveEdit = saveEdit;
window.printOrder = handlePrintOrder;
window.addServiceSelect = addServiceSelect;
window.removeServiceSelect = removeServiceSelect;
window.addEditServiceSelect = addEditServiceSelect;
window.removeEditServiceSelect = removeEditServiceSelect;
window.editPayByCard = editPayByCard;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing orders page');
    if (!isInitialized) window.initializeOrdersPage();
});