const PaymentsApp = {
    paymentsData: generateMockPaymentsData(1000),
    filteredData: [],
    currentObject: null,
    currentPage: 1,
    pageSize: 50,
};

function generateMockPaymentsData(count) {
    const objects = [
        "Мавзолей Ходжи Ахмеда Ясави", "Мавзолей Айна-Биби", "Мавзолей Айша-Биби",
        "Мечеть Нур-Астана", "Музей Первого Президента", "Мавзолей Карахан",
        "Мечеть Хазрет Султан", "Музей Истории", "Мавзолей Бабаджи-Хатун",
        "Мечеть Аль-Акса", "Музей-заповедник Отырар", "Мавзолей Арыстан Баб",
    ];
    const terminals = Array.from({ length: 20 }, (_, i) => `T${String(i + 1).padStart(3, '0')}`);
    const paymentTypes = ["Kaspi.kz", "Купюрами", "Монеты"];
    const statuses = ["Действует", "Отменён", "Ошибка"];
    const startDate = new Date('2025-05-19');
    const endDate = new Date('2025-06-18');
    const data = [];

    for (let i = 0; i < count; i++) {
        const dateOffset = Math.floor(Math.random() * (endDate - startDate) / (1000 * 60 * 60 * 24));
        const date = new Date(startDate.getTime() + dateOffset * 24 * 60 * 60 * 1000);
        const dateString = date.toISOString().split('T')[0];
        const hour = Math.floor(Math.random() * (22 - 6) + 6);
        const minute = Math.floor(Math.random() * 60);
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const amount = Math.floor(Math.random() * (100000 - 500) + 500);
        const refund = Math.random() < 0.1 ? Math.floor(amount * Math.random() * 0.5) : 0;
        const status = statuses[Math.random() < 0.8 ? 0 : Math.random() < 0.75 ? 1 : 2];

        data.push({
            id: i + 1,
            object: objects[Math.floor(Math.random() * objects.length)],
            terminal: terminals[Math.floor(Math.random() * terminals.length)],
            date: dateString,
            time: time,
            type: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
            amount: amount,
            refund: refund,
            processId: `P${String(i + 1).padStart(3, '0')}`,
            transactionId: `TX${String(i + 1).padStart(3, '0')}`,
            status: status
        });
    }
    return data;
}

window.initializePaymentsPage = function () {
    console.log('Инициализация страницы платежей:', new Date().toISOString());
    PaymentsApp.filteredData = [...PaymentsApp.paymentsData];
    setDefaultDates();
    updateDashboardStats(PaymentsApp.filteredData);
    loadPaymentsTable(PaymentsApp.filteredData, PaymentsApp.currentPage);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.removeEventListener('input', PaymentsApp.debounceFilterData);
        searchInput.addEventListener('input', PaymentsApp.debounceFilterData);
        console.log('Привязан обработчик input к searchInput');
    } else {
        console.warn('searchInput не найден');
    }

    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    if (dateFrom) {
        dateFrom.removeEventListener('change', filterData);
        dateFrom.addEventListener('change', filterData);
    }
    if (dateTo) {
        dateTo.removeEventListener('change', filterData);
        dateTo.addEventListener('change', filterData);
    }
};

PaymentsApp.debounceFilterData = function () {
    clearTimeout(PaymentsApp.debounceTimeout);
    PaymentsApp.debounceTimeout = setTimeout(filterData, 300);
};

function updateDashboardStats(data) {
    console.log('Обновление статистики дашборда, данных:', data.length);
    const totalAmount = data.reduce((sum, p) => sum + p.amount, 0);
    const uniqueObjects = new Set(data.map(p => p.object)).size;
    updateElement('todayPayments', formatAmount(totalAmount));
    updateElement('todayVisitors', data.length);
    updateElement('todayRevenue', formatAmount(data.length ? Math.round(totalAmount / data.length) : 0));
    updateElement('todayGrowth', `${uniqueObjects} из 50`);
}

function loadPaymentsTable(data, page) {
    console.log('Загрузка таблицы платежей, страница:', page, 'данных:', data.length);
    const tbody = document.getElementById('paymentsTable');
    if (!tbody) {
        console.error('paymentsTable не найден');
        return;
    }

    tbody.innerHTML = '';
    const start = (page - 1) * PaymentsApp.pageSize;
    const end = start + PaymentsApp.pageSize;
    const pageData = data.slice(start, end);

    pageData.forEach(payment => {
        const row = document.createElement('tr');
        const typeClass = payment.type === 'Kaspi.kz' ? 'bg-danger' :
            payment.type === 'Купюрами' ? 'bg-success' : 'bg-primary';
        row.innerHTML = `
            <td>${payment.id}</td>
            <td><a href="#" class="object-link" data-object="${encodeURIComponent(payment.object)}" data-date="${payment.date}">${payment.object}</a></td>
            <td>${payment.terminal}</td>
            <td>${formatDate(payment.date)}</td>
            <td><span class="badge ${typeClass} text-white">${payment.type}</span></td>
            <td>${formatAmount(payment.amount)}</td>
            <td>${formatAmount(payment.refund)}</td>
            <td>${payment.processId}</td>
            <td>${payment.transactionId}</td>
            <td>${getStatusBadge(payment.status)}</td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.object-link').forEach(link => {
        link.removeEventListener('click', handleObjectLink);
        link.addEventListener('click', handleObjectLink);
    });

    renderPagination(data.length, page);
}

function renderPagination(totalItems, currentPage) {
    console.log('Рендеринг пагинации, элементов:', totalItems, 'страница:', currentPage);
    const paginationControls = document.getElementById('paginationControls');
    if (!paginationControls) {
        console.error('paginationControls не найден');
        return;
    }

    const totalPages = Math.ceil(totalItems / PaymentsApp.pageSize);
    let paginationHTML = `
        <nav aria-label="Payments table pagination">
            <ul class="pagination mb-0">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">«</a>
                </li>
    `;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
        if (startPage > 2) paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }

    paginationHTML += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">»</a>
                </li>
            </ul>
        </nav>
    `;

    paginationControls.innerHTML = paginationHTML;

    paginationControls.querySelectorAll('.page-link[data-page]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page)) {
                PaymentsApp.currentPage = page;
                loadPaymentsTable(PaymentsApp.filteredData, PaymentsApp.currentPage);
            }
        });
    });
}

function handleObjectLink(e) {
    e.preventDefault();
    const objectName = decodeURIComponent(e.target.dataset.object);
    const paymentDate = e.target.dataset.date;
    console.log('Клик по объекту:', objectName, 'дата:', paymentDate);
    showDashboard(objectName, paymentDate);
}

function formatDate(dateString) {
    return dateString ? new Date(dateString).toLocaleDateString('ru-RU') : '';
}

function formatAmount(amount) {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';
}

function getStatusBadge(status) {
    const badgeClass = status === 'Действует' ? 'bg-success' : status === 'Отменён' ? 'bg-danger' : 'bg-warning';
    return `<span class="badge ${badgeClass}">${status}</span>`;
}

function filterData() {
    console.log('Фильтрация данных');
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';

    PaymentsApp.filteredData = PaymentsApp.paymentsData.filter(payment => {
        if (dateFrom && payment.date < dateFrom) return false;
        if (dateTo && payment.date > dateTo) return false;
        if (searchTerm) {
            const searchString = [
                payment.id.toString(),
                payment.object,
                payment.terminal,
                payment.date,
                payment.type,
                payment.amount.toString(),
                payment.refund.toString(),
                payment.processId,
                payment.transactionId,
                payment.status
            ].join(' ').toLowerCase();
            if (!searchString.includes(searchTerm)) return false;
        }
        return true;
    });

    console.log('Отфильтровано:', PaymentsApp.filteredData.length, 'записей');
    PaymentsApp.currentPage = 1;
    updateDashboardStats(PaymentsApp.filteredData);
    loadPaymentsTable(PaymentsApp.filteredData, PaymentsApp.currentPage);
}

function showDashboard(objectName, paymentDate) {
    console.log('Переход на дашборд:', objectName, paymentDate);
    PaymentsApp.currentObject = objectName;
    const mainPage = document.getElementById('mainPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const subtitle = document.getElementById('dashboardSubtitle');

    if (mainPage && dashboardPage && subtitle) {
        mainPage.style.display = 'none';
        dashboardPage.style.display = 'block';
        loadDashboardData(objectName, paymentDate);
    } else {
        console.error('Не найдены элементы:', { mainPage, dashboardPage, subtitle });
    }
}

function loadDashboardData(objectName, paymentDate) {
    console.log('Загрузка данных дашборда:', objectName, paymentDate);
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;
    let objectData = PaymentsApp.filteredData.filter(p => p.object === objectName);

    if (dateFrom && dateTo) {
        objectData = objectData.filter(p => p.date >= dateFrom && p.date <= dateTo);
    } else if (paymentDate) {
        objectData = objectData.filter(p => p.date === paymentDate);
    }

    let dateText = 'Нет данных';
    if (objectData.length) {
        if (dateFrom && dateTo) {
            dateText = `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
        } else if (paymentDate) {
            dateText = formatDate(paymentDate);
        } else {
            const dates = objectData.map(p => new Date(p.date));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            dateText = `${minDate.toLocaleDateString('ru-RU')} - ${maxDate.toLocaleDateString('ru-RU')}`;
        }
    }

    updateElement('dashboardSubtitle', `Детальный анализ по объекту: ${objectName} (${dateText})`);

    if (!objectData.length) {
        updateElement('successRate', '0%');
        updateElement('avgAmount', '0 ₸');
        updateElement('maxAmount', '0 ₸');
        updateElement('refundRate', '0%');
        updateActivityTimeline([]);
        console.warn('Нет данных для объекта:', objectName);
        if (typeof Chart !== 'undefined') {
            createAllCharts([]);
        }
        return;
    }

    const totalPayments = objectData.length;
    const totalAmount = objectData.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunds = objectData.reduce((sum, p) => sum + p.refund, 0);
    const activePayments = objectData.filter(p => p.status === 'Действует').length;
    const successRate = totalPayments > 0 ? (activePayments / totalPayments * 100).toFixed(1) : 0;
    const avgAmount = totalPayments > 0 ? Math.round(totalAmount / totalPayments) : 0;
    const maxAmount = totalPayments > 0 ? Math.max(...objectData.map(p => p.amount)) : 0;
    const refundRate = totalAmount > 0 ? (totalRefunds / totalAmount * 100).toFixed(1) : 0;

    updateElement('successRate', successRate + '%');
    updateElement('avgAmount', formatAmount(avgAmount));
    updateElement('maxAmount', formatAmount(maxAmount));
    updateElement('refundRate', refundRate + '%');

    const successRateFill = document.getElementById('successRateFill');
    const successRateFillMain = document.getElementById('successRateFillMain');
    if (successRateFill) successRateFill.style.width = successRate + '%';
    if (successRateFillMain) successRateFillMain.style.width = successRate + '%'; // Обновляем на главной странице

    updateActivityTimeline(objectData);
    if (typeof Chart !== 'undefined') {
        createAllCharts(objectData);
    } else {
        console.warn('Chart.js не загружен, диаграммы не будут отображены');
    }
}

function backToMain() {
    console.log('Возврат на главную страницу');
    PaymentsApp.currentObject = null;
    const dashboardPage = document.getElementById('dashboardPage');
    const mainPage = document.getElementById('mainPage');

    if (dashboardPage && mainPage) {
        dashboardPage.style.display = 'none';
        mainPage.style.display = 'block';
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
    else console.warn(`Элемент ${id} не найден`);
}

function updateActivityTimeline(data) {
    console.log('Обновление таймлайна активности, данных:', data.length);
    const timeline = document.getElementById('activityTimeline');
    if (!timeline) {
        console.error('activityTimeline не найден');
        return;
    }

    const sortedData = data.sort((a, b) => {
        const aDateTime = new Date(`${a.date} ${a.time || '00:00'}`);
        const bDateTime = new Date(`${b.date} ${b.time || '00:00'}`);
        return bDateTime - aDateTime;
    });
    const recentData = sortedData.slice(0, 5);

    timeline.innerHTML = '';
    recentData.forEach(payment => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        const iconClass = payment.status === 'Действует' ? 'bg-success' : payment.status === 'Отменён' ? 'bg-danger' : 'bg-warning';
        const iconSymbol = payment.status === 'Действует' ? 'check' : 'x';
        timelineItem.innerHTML = `
            <div class="timeline-icon ${iconClass} text-white">
                <i class="bi bi-${iconSymbol}"></i>
            </div>
            <div class="timeline-content">
                <h6>${payment.type} - ${formatAmount(payment.amount)}</h6>
                <p>${payment.terminal} • ${formatDate(payment.date)} ${payment.time || ''}</p>
            </div>
        `;
        timeline.appendChild(timelineItem);
    });
}

function createAllCharts(data) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js не загружен');
        return;
    }
    try {
        createPaymentTypesChart(data);
    } catch (e) { console.error('Ошибка в createPaymentTypesChart:', e); }
    try {
        createDailyPaymentsChart(data);
    } catch (e) { console.error('Ошибка в createDailyPaymentsChart:', e); }
    try {
        createStatusChart(data);
    } catch (e) { console.error('Ошибка в createStatusChart:', e); }
    try {
        createHourlyChart(data);
    } catch (e) { console.error('Ошибка в createHourlyChart:', e); }
    try {
        createWeekdayChart(data);
    } catch (e) { console.error('Ошибка в createWeekdayChart:', e); }
    try {
        createTerminalChart(data);
    } catch (e) { console.error('Ошибка в createTerminalChart:', e); }
    try {
        createHeatmapChart(data);
    } catch (e) { console.error('Ошибка в createHeatmapChart:', e); }
}

function createPaymentTypesChart(data) {
    const canvas = document.getElementById('paymentTypesChart');
    if (!canvas) {
        console.error('paymentTypesChart не найден');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Не удалось получить контекст для paymentTypesChart');
        return;
    }

    if (!data.length) {
        canvas.parentElement.style.display = 'none';
        return;
    } else {
        canvas.parentElement.style.display = 'block';
    }

    if (window.paymentTypesChart && typeof window.paymentTypesChart.destroy === 'function') {
        window.paymentTypesChart.destroy();
    }

    const typeCounts = {};
    data.forEach(payment => {
        typeCounts[payment.type] = (typeCounts[payment.type] || 0) + 1;
    });

    const typeColors = {
        'Kaspi.kz': '#dc3545',
        'Купюрами': '#28a745',
        'Монеты': '#007bff'
    };

    window.paymentTypesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(typeCounts).length ? Object.keys(typeCounts) : ["Нет данных"],
            datasets: [{
                data: Object.keys(typeCounts).length ? Object.values(typeCounts) : [1],
                backgroundColor: Object.keys(typeCounts).length ? Object.keys(typeCounts).map(type => typeColors[type] || "#d1d5db") : ["#d1d5db"],
                borderWidth: 3,
                borderColor: "#fff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { size: 12 }
                    }
                }
            }
        }
    });

    console.log('Диаграмма типов платежей создана:', Object.keys(typeCounts));
}

function createDailyPaymentsChart(data) {
    const canvas = document.getElementById('dailyPaymentsChart');
    if (!canvas) {
        console.error('dailyPaymentsChart не найден');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Не удалось получить контекст для dailyPaymentsChart');
        return;
    }

    if (!data.length) {
        canvas.parentElement.style.display = 'none';
        return;
    } else {
        canvas.parentElement.style.display = 'block';
    }

    if (window.dailyPaymentsChart && typeof window.dailyPaymentsChart.destroy === 'function') {
        window.dailyPaymentsChart.destroy();
    }

    const dailyData = {};
    data.forEach(payment => {
        const date = formatDate(payment.date);
        dailyData[date] = (dailyData[date] || 0) + payment.amount;
    });

    const labels = Object.keys(dailyData).sort();
    const values = labels.map(date => dailyData[date]);

    window.dailyPaymentsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ["Нет данных"],
            datasets: [{
                label: "Сумма платежей (₸)",
                data: labels.length ? values : [0],
                borderColor: "#667eea",
                backgroundColor: "rgba(102, 126, 234, 0.1)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#667eea",
                pointBorderColor: "#fff",
                pointBorderWidth: 3,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) { return new Intl.NumberFormat('ru-RU').format(value) + ' ₸'; }
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: labels.length === 1 ? 1 : 10
                    }
                }
            },
            plugins: {
                legend: { display: true }
            }
        }
    });

    console.log('Диаграмма ежедневных платежей создана:', labels.length);
}

function createStatusChart(data) {
    const canvas = document.getElementById('statusChart');
    if (!canvas) {
        console.error('statusChart не найден');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Не удалось получить контекст для statusChart');
        return;
    }

    if (!data.length) {
        canvas.parentElement.style.display = 'none';
        return;
    } else {
        canvas.parentElement.style.display = 'block';
    }

    if (window.statusChart && typeof window.statusChart.destroy === 'function') {
        window.statusChart.destroy();
    }

    const statusCounts = {};
    data.forEach(payment => {
        statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1;
    });

    window.statusChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(statusCounts).length ? Object.keys(statusCounts) : ["Нет данных"],
            datasets: [{
                label: "Количество",
                data: Object.keys(statusCounts).length ? Object.values(statusCounts) : [1],
                backgroundColor: Object.keys(statusCounts).length ? Object.keys(statusCounts).map(status =>
                    status === "Действует" ? "#28a745" : status === "Отменён" ? "#dc3545" : "#ffc107"
                ) : ["#d1d5db"],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });

    console.log('Диаграмма статусов создана:', Object.keys(statusCounts));
}

function createHourlyChart(data) {
    const canvas = document.getElementById('hourlyChart');
    if (!canvas) {
        console.error('hourlyChart не найден');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Не удалось получить контекст для hourlyChart');
        return;
    }

    if (!data.length) {
        canvas.parentElement.style.display = 'none';
        return;
    } else {
        canvas.parentElement.style.display = 'block';
    }

    if (window.hourlyChart && typeof window.hourlyChart.destroy === 'function') {
        window.hourlyChart.destroy();
    }

    const hourlyData = {};
    for (let i = 0; i < 24; i++) hourlyData[i + ':00'] = 0;

    data.forEach(payment => {
        if (payment.time) {
            const hour = parseInt(payment.time.split(':')[0]);
            const hourLabel = hour + ':00';
            hourlyData[hourLabel] = (hourlyData[hourLabel] || 0) + 1;
        }
    });

    window.hourlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(hourlyData).length ? Object.keys(hourlyData) : ["Нет данных"],
            datasets: [{
                label: "Количество платежей",
                data: Object.keys(hourlyData).length ? Object.values(hourlyData) : [0],
                backgroundColor: "rgba(102, 126, 234, 0.6)",
                borderColor: "#667eea",
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                },
                x: {
                    ticks: { maxTicksLimit: 12 }
                }
            }
        }
    });

    console.log('Часовая диаграмма создана:', Object.keys(hourlyData).length);
}

function createWeekdayChart(data) {
    const canvas = document.getElementById('weekdayChart');
    if (!canvas) {
        console.error('weekdayChart не найден');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Не удалось получить контекст для weekdayChart');
        return;
    }

    if (!data.length) {
        canvas.parentElement.style.display = 'none';
        return;
    } else {
        canvas.parentElement.style.display = 'block';
    }

    if (window.weekdayChart && typeof window.weekdayChart.destroy === 'function') {
        window.weekdayChart.destroy();
    }

    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const weekdayData = {};
    weekdays.forEach(day => weekdayData[day] = 0);

    data.forEach(payment => {
        const date = new Date(payment.date);
        const weekday = weekdays[date.getDay() === 0 ? 6 : date.getDay() - 1];
        weekdayData[weekday] += payment.amount;
    });

    window.weekdayChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: Object.keys(weekdayData).length ? Object.keys(weekdayData) : ["Нет данных"],
            datasets: [{
                data: Object.keys(weekdayData).length ? Object.values(weekdayData) : [1],
                backgroundColor: Object.keys(weekdayData).length ? [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 205, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                    "rgba(255, 159, 64, 0.6)",
                    "rgba(199, 199, 199, 0.6)"
                ] : ["#d1d5db"],
                borderWidth: 2,
                borderColor: "#fff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { padding: 15 }
                }
            }
        }
    });

    console.log('Диаграмма по дням недели создана:', Object.keys(weekdayData).length);
}

function createTerminalChart(data) {
    const canvas = document.getElementById('terminalChart');
    if (!canvas) {
        console.error('terminalChart не найден');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Не удалось получить контекст для terminalChart');
        return;
    }

    if (!data.length) {
        canvas.parentElement.style.display = 'none';
        return;
    } else {
        canvas.parentElement.style.display = 'block';
    }

    if (window.terminalChart && typeof window.terminalChart.destroy === 'function') {
        window.terminalChart.destroy();
    }

    const terminalData = {};
    data.forEach(payment => {
        if (!terminalData[payment.terminal]) terminalData[payment.terminal] = { amount: 0, count: 0 };
        terminalData[payment.terminal].amount += payment.amount;
        terminalData[payment.terminal].count += 1;
    });

    const terminals = Object.keys(terminalData);
    const amounts = terminals.map(t => terminalData[t].amount);
    const counts = terminals.map(t => terminalData[t].count);

    window.terminalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: terminals.length ? terminals : ["Нет данных"],
            datasets: [
                {
                    label: "Сумма (₸)",
                    data: terminals.length ? amounts : [0],
                    backgroundColor: "rgba(102, 126, 234, 0.6)",
                    borderColor: "#667eea",
                    borderWidth: 1,
                    yAxisID: "y"
                },
                {
                    label: "Количество транзакций",
                    data: terminals.length ? counts : [0],
                    type: "line",
                    borderColor: "#dc3545",
                    backgroundColor: "rgba(220, 53, 69, 0.1)",
                    borderWidth: 3,
                    fill: false,
                    yAxisID: "y1"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            scales: {
                y: {
                    type: "linear",
                    display: true,
                    position: "left",
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) { return new Intl.NumberFormat('ru-RU').format(value) + ' ₸'; }
                    }
                },
                y1: {
                    type: "linear",
                    display: true,
                    position: "right",
                    beginAtZero: true,
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });

    console.log('Диаграмма терминалов создана:', terminals.length);
}

function createHeatmapChart(data) {
    const canvas = document.getElementById('heatmapChart');
    if (!canvas) {
        console.error('heatmapChart не найден');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Не удалось получить контекст для heatmapChart');
        return;
    }

    if (!data.length) {
        canvas.parentElement.style.display = 'none';
        return;
    } else {
        canvas.parentElement.style.display = 'block';
    }

    if (window.heatmapChart && typeof window.heatmapChart.destroy === 'function') {
        window.heatmapChart.destroy();
    }

    const heatmapData = [];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const dataGrid = {};
    days.forEach(day => hours.forEach(hour => dataGrid[`${day}-${hour}`] = 0));

    data.forEach(payment => {
        const date = new Date(payment.date);
        const day = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
        const hour = payment.time ? parseInt(payment.time.split(':')[0]) : 0;
        dataGrid[`${day}-${hour}`] += payment.amount;
    });

    days.forEach((day, dayIndex) => {
        hours.forEach(hour => {
            const value = dataGrid[`${day}-${hour}`] || 0;
            heatmapData.push({ x: hour, y: dayIndex, v: value });
        });
    });

    window.heatmapChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Активность платежей',
                data: heatmapData.length ? heatmapData : [{ x: 0, y: 0, v: 0 }],
                backgroundColor: function (context) {
                    const value = context.raw.v;
                    const maxValue = Math.max(...heatmapData.map(d => d.v), 1);
                    const alpha = Math.min(value / maxValue, 1);
                    return `rgba(102, 126, 234, ${alpha})`;
                },
                pointRadius: function (context) {
                    const value = context.raw.v;
                    const maxValue = Math.max(...heatmapData.map(d => d.v), 1);
                    return Math.max(3, Math.min((value / maxValue) * 15, 15));
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    title: { display: true, text: 'Час дня' },
                    min: 0,
                    max: 23,
                    ticks: { stepSize: 2 }
                },
                y: {
                    title: { display: true, text: 'День недели' },
                    min: -0.5,
                    max: 6.5,
                    ticks: {
                        callback: function (value) {
                            const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
                            return days[Math.round(value)] || '';
                        }
                    }
                }
            }
        }
    });

    console.log('Тепловая карта создана:', heatmapData.length);
}

function setDefaultDates() {
    console.log('Установка дат по умолчанию');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    if (dateFrom && dateTo) {
        dateFrom.value = '';
        dateTo.value = '';
    }
}

function updatePageSize() {
    console.log('Обновление размера страницы');
    const select = document.getElementById('pageSizeSelect');
    if (select) {
        PaymentsApp.pageSize = parseInt(select.value);
        PaymentsApp.currentPage = 1;
        loadPaymentsTable(PaymentsApp.filteredData, PaymentsApp.currentPage);
    }
}

window.loadPaymentsTable = loadPaymentsTable;
window.setDefaultDates = setDefaultDates;
window.showDashboard = showDashboard;
window.backToMain = backToMain;
window.filterData = filterData;
window.updatePageSize = updatePageSize;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен:', new Date().toISOString());
    window.initializePaymentsPage();
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        pageSizeSelect.removeEventListener('change', updatePageSize);
        pageSizeSelect.addEventListener('change', updatePageSize);
        console.log('Привязан обработчик change к pageSizeSelect');
    }
});