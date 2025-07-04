console.log('reports.js loaded at:', new Date().toISOString());

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
        if (!isSingleObject) {
            topObject = Object.entries(objects).reduce((top, [name, obj]) => 
                obj.totalAmount > top.totalAmount ? { name, totalAmount: obj.totalAmount } : top, 
                { name: '–', totalAmount: 0 }
            );
        }
        const totalTerminals = isSingleObject ? 
            [...Object.values(objects)[0].terminals].length : 
            new Set(data.map(p => p.terminal)).size;

        document.getElementById('totalObjects').textContent = isSingleObject ? totalTerminals : totalObjects;
        document.getElementById('totalObjectsLabel').textContent = isSingleObject ? 'Всего терминалов' : 'Всего объектов';
        document.getElementById('totalRevenue').textContent = this.formatAmount(totalRevenue);
        document.getElementById('totalTransactions').textContent = totalTransactions;
        document.getElementById('topObject').textContent = isSingleObject ? this.formatAmount(totalRevenue / totalTransactions || 0) : topObject.name;
        document.getElementById('topObjectLabel').textContent = isSingleObject ? 'Средний чек' : 'Лучший объект';
    },
    renderReportsTable(data) {
        const tbody = document.getElementById('reportsTable');
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
        document.querySelectorAll('.object-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.reportsShowDashboard(decodeURIComponent(e.target.dataset.object));
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
        const dateRange = this.formatDateRange(dateFrom, dateTo);
        const title = objectName ? 
            `${objectName}${dateRange ? ', ' + dateRange : ''}` : 
            `Сводная аналитика${dateRange ? ', ' + dateRange : ''}`;
        subtitle.textContent = title;
        console.log('Updated dashboard subtitle:', title);
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
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
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
        await DataModule.fetchPaymentsData();
        RenderModule.renderReportsTable(DataModule.filteredData);
        this.bindEventListeners();
        this.setDefaultFilters();
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
        document.getElementById('newReportBtn')?.addEventListener('click', this.handleFilter);
        document.getElementById('searchInput')?.addEventListener('input', this.handleFilter);
        document.getElementById('exportExcelBtn')?.addEventListener('click', this.handleExport);
        document.getElementById('showAllAnalyticsBtn')?.addEventListener('click', this.handleShowAllAnalytics);
    },
    setDefaultFilters() {
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        if (dateFrom && dateTo) {
            dateFrom.value = '';
            dateTo.value = '';
            this.handleFilter();
        }
    },
    handleFilter() {
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';
        const searchTerm = document.getElementById('searchInput')?.value || '';
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

        // Если даты не выбраны, устанавливаем период за последнюю неделю
        if (!dateFrom && !dateTo) {
            const today = new Date('2025-06-20'); // Текущая дата
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            dateFrom = lastWeek.toISOString().split('T')[0]; // Формат YYYY-MM-DD
            dateTo = today.toISOString().split('T')[0];
            if (dateFromInput && dateToInput) {
                dateFromInput.value = dateFrom;
                dateToInput.value = dateTo;
                console.log('Set default date range:', dateFrom, 'to', dateTo);
                DataModule.filterData({ dateFrom, dateTo, searchTerm: document.getElementById('searchInput')?.value || '' });
            }
        }

        window.reportsShowDashboard(null);
    }
};

// Глобальные функции
window.reportsShowDashboard = function(objectName) {
    console.log('Showing dashboard for:', objectName || 'all objects');
    AppModule.currentObject = objectName;
    const isSingleObject = !!objectName;
    const data = isSingleObject ? 
        DataModule.filteredData.filter(p => p.object === objectName) : 
        DataModule.filteredData;

    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';

    let dateFrom = '', dateTo = '';
    if (isSingleObject) {
        // Для объекта берем дату из первой записи
        if (data.length > 0) {
            const firstPayment = data[0];
            if (firstPayment.date && !isNaN(new Date(firstPayment.date).getTime())) {
                dateFrom = firstPayment.date; // Формат YYYY-MM-DD
            }
        }
        console.log('Object date:', { objectName, dateFrom, dataLength: data.length });
    } else {
        // Для общей аналитики используем даты из полей ввода
        dateFrom = document.getElementById('dateFrom')?.value || '';
        dateTo = document.getElementById('dateTo')?.value || '';
        console.log('Dashboard dates:', { dateFrom, dateTo });
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

window.reportsBackToMain = function() {
    console.log('Returning to main page');
    AppModule.currentObject = null;
    document.getElementById('dashboardPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
    ChartModule.destroyCharts();
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('reports.html')) {
        console.log('DOM loaded, initializing reports page');
        AppModule.initialize();
    }
});

