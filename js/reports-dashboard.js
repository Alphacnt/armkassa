console.log('reports.js loaded at:', new Date().toISOString());

// Вспомогательная функция — безопасно получить элемент
function el(id) {
    return document.getElementById(id) || null;
}

// Модуль данных
const DataModule = {
    paymentsData: [],
    filteredData: [],
    async fetchPaymentsData() {
        try {
            this.paymentsData = window.generateMockPaymentsData(1000);
            this.filteredData = [...this.paymentsData];
            console.log('Payments data loaded:', this.paymentsData.length);
        } catch (error) {
            console.error('Error fetching payments data:', error);
        }
    },
    filterData({ dateFrom, dateTo, searchTerm }) {
        this.filteredData = this.paymentsData.filter(payment => {
            // Фильтр по датам: учитываем пустые значения
            if (dateFrom && payment.date < dateFrom) return false;
            if (dateTo && payment.date > dateTo) return false;
            // Фильтр по поиску
            if (searchTerm) {
                const searchString = [
                    payment.object,
                    payment.date,
                    payment.amount.toString(),
                    payment.type,
                    payment.status
                ].join(' ').toLowerCase();
                if (!searchString.includes(searchTerm.toLowerCase())) return false;
            }
            return true;
        });
        console.log('Filtered data:', this.filteredData.length);
    },
    aggregateByObject(data = this.filteredData) {
        const byObject = {};
        data.forEach(payment => {
            if (!byObject[payment.object]) {
                byObject[payment.object] = {
                    totalAmount: 0,
                    transactions: 0,
                    byType: { 'Купюрами': 0, 'Монеты': 0, 'Kaspi.kz': 0 },
                    byDate: {},
                    byHour: Array(24).fill(0),
                    terminals: new Set()
                };
            }
            byObject[payment.object].totalAmount += payment.amount;
            byObject[payment.object].transactions += 1;
            byObject[payment.object].byType[payment.type] += payment.amount;
            byObject[payment.object].terminals.add(payment.terminal);
            const date = payment.date;
            byObject[payment.object].byDate[date] = (byObject[payment.object].byDate[date] || 0) + payment.amount;
            if (payment.time) {
                const hour = parseInt(payment.time.split(':')[0]);
                byObject[payment.object].byHour[hour] += 1;
            }
        });
        return byObject;
    },
    aggregateByTerminal(data = this.filteredData) {
        const byTerminal = {};
        data.forEach(payment => {
            if (!byTerminal[payment.terminal]) {
                byTerminal[payment.terminal] = { transactions: 0, amount: 0 };
            }
            byTerminal[payment.terminal].transactions += 1;
            byTerminal[payment.terminal].amount += payment.amount;
        });
        return byTerminal;
    }
};

// Модуль рендеринга
const RenderModule = {
    formatAmount(amount) {
        return new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';
    },
    formatDate(dateString) {
        return dateString ? new Date(dateString).toLocaleDateString('ru-RU') : '–';
    },
    formatDateRange(dateFrom, dateTo) {
        if (!dateFrom && !dateTo) return '';
        if (dateFrom && dateTo) return `${this.formatDate(dateFrom)} – ${this.formatDate(dateTo)}`;
        return this.formatDate(dateFrom || dateTo);
    },

    updateStatsCards(data, isSingleObject = false) {
        const objects = DataModule.aggregateByObject(data);
        const totalObjects = Object.keys(objects).length;
        const totalRevenue = Object.values(objects).reduce((sum, obj) => sum + obj.totalAmount, 0);
        const totalTransactions = Object.values(objects).reduce((sum, obj) => sum + obj.transactions, 0);
        let topObject = { name: '–', totalAmount: 0 };
        // if (!isSingleObject) {
        //     topObject = Object.entries(objects).reduce((top, [name, obj]) =>
        //         obj.totalAmount > top.totalAmount ? { name, totalAmount: obj.totalAmount } : top,
        //         { name: '–', totalAmount: 0 }
        //     );
        // }
        // безопасно обращаемся к DOM
        const totalObjectsEl = el('totalObjects');
        const totalObjectsLabelEl = el('totalObjectsLabel');
        const totalRevenueEl = el('totalRevenue');
        const totalTransactionsEl = el('totalTransactions');
        const topObjectEl = el('topObject');
        const topObjectLabelEl = el('topObjectLabel');

        if (totalObjectsEl) totalObjectsEl.textContent = isSingleObject ? (Object.keys(objects)[0] ? [...Object.values(objects)[0].terminals].length : 0) : totalObjects;
        if (totalObjectsLabelEl) totalObjectsLabelEl.textContent = isSingleObject ? 'Всего терминалов' : 'Всего объектов';
        if (totalRevenueEl) totalRevenueEl.textContent = this.formatAmount(totalRevenue);
        if (totalTransactionsEl) totalTransactionsEl.textContent = totalTransactions;
        if (topObjectEl) topObjectEl.textContent = this.formatAmount(totalRevenue / (totalTransactions || 1));
        if (topObjectLabelEl) topObjectLabelEl.textContent = 'Средний чек';
    },

    renderReportsTable(data) {
        const tbody = el('reportsTable');
        if (!tbody) {
            console.warn('Элемент reportsTable не найден — пропускаю renderReportsTable');
            return;
        }
        tbody.innerHTML = '';
        const objects = DataModule.aggregateByObject(data);
        Object.entries(objects).forEach(([object, stats], index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><a href="#" class="object-link" data-object="${encodeURIComponent(object)}">${object}</a></td>
                <td>${this.formatDate(Object.keys(stats.byDate)[0] || '–')}</td>
                <td>${this.formatAmount(stats.totalAmount)}</td>
                <td>${this.formatAmount(stats.byType['Купюрами'])}</td>
                <td>${this.formatAmount(stats.byType['Монеты'])}</td>
                <td>${this.formatAmount(stats.byType['Kaspi.kz'])}</td>
                <td>${stats.transactions}</td>
                <td><span class="badge bg-success">Активен</span></td>
            `;
            tbody.appendChild(row);
        });
        // Навешивание обработчиков только если они есть
        document.querySelectorAll('.object-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.reportsShowDashboard(decodeURIComponent(e.currentTarget.dataset.object));
            });
        });
    },

    renderDetailedStatsTable(data, isSingleObject = false) {
        const tbody = document.getElementById('detailedStatsTable');
        tbody.innerHTML = '';
        const objects = DataModule.aggregateByObject(data);
        const totalRevenue = Object.values(objects).reduce((sum, obj) => sum + obj.totalAmount, 0);
        Object.entries(objects).forEach(([object, stats]) => {
            const percentage = totalRevenue ? ((stats.totalAmount / totalRevenue) * 100).toFixed(1) : 0;
            const avgCheck = stats.transactions ? Math.round(stats.totalAmount / stats.transactions) : 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${object}</td>
                <td>${this.formatAmount(stats.totalAmount)}</td>
                <td>${this.formatAmount(stats.byType['Купюрами'])}</td>
                <td>${this.formatAmount(stats.byType['Монеты'])}</td>
                <td>${this.formatAmount(stats.byType['Kaspi.kz'])}</td>
                <td>${stats.transactions}</td>
                <td>${this.formatAmount(avgCheck)}</td>
                <td>${percentage}%</td>
            `;
            tbody.appendChild(row);
        });
        // Скрыть колонку "% от общего" для одного объекта
        document.querySelectorAll('#detailedStatsTable th:last-child, #detailedStatsTable td:last-child')
            .forEach(el => el.style.display = isSingleObject ? 'none' : '');
    },
    updateDashboardSubtitle(objectName, dateFrom, dateTo) {
        const subtitle = document.getElementById('dashboardSubtitle');
        if (!subtitle) {
            console.error('dashboardSubtitle element not found');
            return;
        }

        // Подпись: если выбран объект — указываем его, иначе "Сводная аналитика"
        const subtitleTextEl = document.getElementById('subtitleText');
        const title = objectName || 'Сводная аналитика';
        if (subtitleTextEl) {
            subtitleTextEl.textContent = title;
        } else {
            // fallback: обновляем весь контейнер
            subtitle.textContent = title;
        }

        // Установить значения полей даты (если переданы строки в формате YYYY-MM-DD)
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        if (typeof dateFrom === 'string' && dateFromInput) dateFromInput.value = dateFrom;
        if (typeof dateTo === 'string' && dateToInput) dateToInput.value = dateTo;

        // Дополнительно можно показать компактный текст диапазона (если нужен)
        // const rangeText = RenderModule.formatDateRange(dateFrom, dateTo);
        // const smallRangeEl = document.getElementById('subtitleRange');
        // if (smallRangeEl) smallRangeEl.textContent = rangeText;
    }
};



// Модуль графиков
const ChartModule = {
    charts: {},
    destroyCharts() {
        Object.values(this.charts).forEach(chart => chart?.destroy());
        this.charts = {};
    },
    createPaymentTypesChart(data) {
        const canvas = document.getElementById('paymentTypesChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const typeTotals = { 'Купюрами': 0, 'Монеты': 0, 'Kaspi.kz': 0 };
        data.forEach(payment => {
            typeTotals[payment.type] += payment.amount;
        });
        this.charts.paymentTypesChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(typeTotals),
                datasets: [{
                    data: Object.values(typeTotals),
                    backgroundColor: ['#28a745', '#007bff', '#dc3545'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    },
    createObjectRevenueChart(data, isSingleObject = false) {
        const canvas = document.getElementById('objectRevenueChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const objects = DataModule.aggregateByObject(data);
        this.charts.objectRevenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: isSingleObject ? [Object.keys(objects)[0]] : Object.keys(objects),
                datasets: [{
                    label: 'Сумма (₸)',
                    data: Object.values(objects).map(obj => obj.totalAmount),
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: value => RenderModule.formatAmount(value) }
                    }
                }
            }
        });
    },
    createDailyRevenueChart(data) {
        const canvas = document.getElementById('dailyRevenueChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const byDate = {};
        data.forEach(payment => {
            byDate[payment.date] = (byDate[payment.date] || 0) + payment.amount;
        });
        this.charts.dailyRevenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(byDate).sort(),
                datasets: [{
                    label: 'Сумма (₸)',
                    data: Object.values(byDate),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: value => RenderModule.formatAmount(value) }
                    }
                }
            }
        });
    },
    createObjectTransactionsChart(data, isSingleObject = false) {
        const canvas = document.getElementById('objectTransactionsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const objects = DataModule.aggregateByObject(data);
        this.charts.objectTransactionsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: isSingleObject ? [Object.keys(objects)[0]] : Object.keys(objects),
                datasets: [{
                    label: 'Транзакций',
                    data: Object.values(objects).map(obj => obj.transactions),
                    backgroundColor: 'rgba(40, 167, 69, 0.6)',
                    borderColor: '#28a745',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    },
    createHourlyActivityChart(data) {
        const canvas = document.getElementById('hourlyActivityChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const hourly = Array(24).fill(0);
        data.forEach(payment => {
            if (payment.time) {
                const hour = parseInt(payment.time.split(':')[0]);
                hourly[hour] += 1;
            }
        });
        this.charts.hourlyActivityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Транзакций',
                    data: hourly,
                    backgroundColor: 'rgba(220, 53, 69, 0.6)',
                    borderColor: '#dc3545',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    },
    createTopTerminalsChart(data) {
        const canvas = document.getElementById('topTerminalsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const terminals = DataModule.aggregateByTerminal(data);
        const sortedTerminals = Object.entries(terminals)
            .sort((a, b) => b[1].transactions - a[1].transactions)
            .slice(0, 5);
        this.charts.topTerminalsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedTerminals.map(([terminal]) => terminal),
                datasets: [{
                    label: 'Транзакций',
                    data: sortedTerminals.map(([_, stats]) => stats.transactions),
                    backgroundColor: 'rgba(255, 193, 7, 0.6)',
                    borderColor: '#ffc107',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: { x: { beginAtZero: true } }
            }
        });
    }
};

// Модуль управления
const AppModule = {
    isInitialized: false,
    currentObject: null,
    async initialize() {
        if (this.isInitialized) {
            console.log('Reports page already initialized, skipping');
            return;
        }
        this.isInitialized = true;
        console.log('Initializing reports page');

        // 1) загрузить данные
        await DataModule.fetchPaymentsData();

        // 2) привязать обработчики (включая те, которые могут отсутствовать на странице)
        this.bindEventListeners();

        // 3) применить фильтр по умолчанию (показываем все)
        this.setDefaultFilters();

        // 4) рендер таблицы только если элемент присутствует
        if (el('reportsTable')) {
            RenderModule.renderReportsTable(DataModule.filteredData);
        } else {
            console.log('reportsTable отсутствует в DOM — таблица не будет отрисована');
        }

        // 5) показать дашборд (если есть) — чарты сами проверят наличие canvas
        if (el('dashboardPage')) {
            window.reportsShowDashboard(null);
        }
    },
    cleanup() {
        this.isInitialized = false;
        this.currentObject = null;
        ChartModule.destroyCharts();
        document.getElementById('newReportBtn')?.removeEventListener('click', this.handleFilter);
        document.getElementById('searchInput')?.removeEventListener('input', this.handleFilter);
        document.getElementById('exportExcelBtn')?.removeEventListener('click', this.handleExport);
        document.getElementById('showAllAnalyticsBtn')?.removeEventListener('click', this.handleShowAllAnalytics);
    },
    bindEventListeners() {
        // кнопки/поля — навешиваем безопасно
        el('newReportBtn')?.addEventListener('click', this.handleFilter.bind(this));
        el('searchInput')?.addEventListener('input', this.handleFilter.bind(this));
        el('exportExcelBtn')?.addEventListener('click', this.handleExport.bind(this));
        el('showAllAnalyticsBtn')?.addEventListener('click', this.handleShowAllAnalytics.bind(this));

        // период/объект на дашборде (если присутствуют)
        el('objectSelect')?.addEventListener('change', (e) => {
            this.currentObject = e.target.value === 'all' ? null : e.target.value;
            // если дашборд открыт — перерисовать его
            if (el('dashboardPage') && el('dashboardPage').style.display !== 'none') {
                window.reportsShowDashboard(this.currentObject);
            }
        });
        el('dateFrom')?.addEventListener('change', this.handleFilter.bind(this));
        el('dateTo')?.addEventListener('change', this.handleFilter.bind(this));
        el('applyPeriodBtn')?.addEventListener('click', this.handleFilter.bind(this));
    },
    setDefaultFilters() {
        const dateFrom = el('dateFrom');
        const dateTo = el('dateTo');
        if (dateFrom && dateTo) {
            dateFrom.value = '';
            dateTo.value = '';
        }
        // применяем общий фильтр (берём текущие значения полей, если они есть)
        const df = dateFrom?.value || '';
        const dt = dateTo?.value || '';
        DataModule.filterData({ dateFrom: df, dateTo: dt, searchTerm: '' });
    },
    handleFilter() {
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';
        const searchTerm = document.getElementById('searchInput')?.value || '';

        // валидация периода — как в sales-dashboard
        if (dateFrom && dateTo && dateTo < dateFrom) {
            alert('Дата "по" должна быть не раньше даты "с"');
            return;
        }

        DataModule.filterData({ dateFrom, dateTo, searchTerm });
        RenderModule.renderReportsTable(DataModule.filteredData);
    },
    handleExport() {
        console.log('Export to Excel triggered');
        alert('Функция экспорта в Excel пока не реализована');
    },
    handleShowAllAnalytics() {
        console.log('Handling show all analytics');
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        let dateFrom = dateFromInput?.value || '';
        let dateTo = dateToInput?.value || '';

        // Если даты не выбраны, устанавливаем период за последнюю неделю (от текущей даты)
        if (!dateFrom && !dateTo) {
            dateFrom = '2025-06-13';
            dateTo = '2025-06-20';
            if (dateFromInput && dateToInput) {
                dateFromInput.value = dateFrom;
                dateToInput.value = dateTo;
                console.log('Set default date range:', dateFrom, 'to', dateTo);
                DataModule.filterData({ dateFrom, dateTo });
            }
        }

        DataModule.filterData({ dateFrom, dateTo, searchTerm: document.getElementById('searchInput')?.value || '' });
        window.reportsShowDashboard(null);
    }
};

// Глобальные функции
window.reportsShowDashboard = function (objectName) {
    // безопасные операции с DOM внутри функции
    console.log('Showing dashboard for:', objectName || 'all objects');
    AppModule.currentObject = objectName;
    const isSingleObject = !!objectName;
    const data = isSingleObject ?
        DataModule.filteredData.filter(p => p.object === objectName) :
        DataModule.filteredData;

    const mainPageEl = el('mainPage');
    const dashboardPageEl = el('dashboardPage');
    if (mainPageEl) mainPageEl.style.display = 'none';
    if (dashboardPageEl) dashboardPageEl.style.display = 'block';

    let dateFrom = '', dateTo = '';
    if (isSingleObject) {
        if (data.length > 0) {
            const firstPayment = data[0];
            if (firstPayment.date && !isNaN(new Date(firstPayment.date).getTime())) {
                dateFrom = firstPayment.date;
            }
        }
    } else {
        dateFrom = el('dateFrom')?.value || '';
        dateTo = el('dateTo')?.value || '';
    }

    RenderModule.updateDashboardSubtitle(objectName, dateFrom, dateTo);
    RenderModule.updateStatsCards(data, isSingleObject);
    RenderModule.renderDetailedStatsTable(data, isSingleObject);
    ChartModule.destroyCharts();
    ChartModule.createPaymentTypesChart(data);
    ChartModule.createObjectRevenueChart(data, isSingleObject);
    ChartModule.createDailyRevenueChart(data);
    ChartModule.createObjectTransactionsChart(data, isSingleObject);
    ChartModule.createHourlyActivityChart(data);
    ChartModule.createTopTerminalsChart(data);
};

window.reportsBackToMain = function () {
    console.log('Returning to main page');
    AppModule.currentObject = null;
    el('dashboardPage') && (el('dashboardPage').style.display = 'none');
    el('mainPage') && (el('mainPage').style.display = 'block');
    ChartModule.destroyCharts();
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing reports page if relevant');
    // всегда пытаемся инициализировать, но внутри initialize есть проверки
    AppModule.initialize().catch(err => console.error('Error initializing reports page:', err));
});

