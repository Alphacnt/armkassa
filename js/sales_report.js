console.log('sales_report.js loaded at:', new Date().toISOString());

// Мок-данные
function generateMockSalesData(count) {
    const events = ['Массовое катание', 'Детское катание', 'Ночное катание'];
    const startDate = new Date('2025-05-01');
    const endDate = new Date('2025-06-20');
    const data = [];

    for (let i = 0; i < count; i++) {
        const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        const totalSales = Math.floor(Math.random() * 50000) + 1000;
        const returns = Math.floor(Math.random() * totalSales * 0.1);
        const sale = {
            id: i + 1,
            date: date.toISOString(),
            saleAmount: totalSales,
            qrCard: Math.floor(Math.random() * totalSales * 0.3),
            cash: Math.floor(Math.random() * totalSales * 0.2),
            kiosk: Math.floor(Math.random() * totalSales * 0.15),
            muzaidynyKaspi: Math.floor(Math.random() * totalSales * 0.25),
            muzaidynyCard: Math.floor(Math.random() * totalSales * 0.15),
            kaspi: Math.floor(Math.random() * totalSales * 0.2),
            returns,
            event: events[Math.floor(Math.random() * events.length)]
        };
        data.push(sale);
    }
    return data;
}

// Модуль данных
const DataModule = {
    salesData: [],
    filteredData: [],
    currentPage: 1,
    rowsPerPage: 10,
    async fetchSalesData() {
        try {
            this.salesData = generateMockSalesData(100);
            this.filteredData = [...this.salesData];
            console.log('Sales data loaded:', this.salesData.length);
        } catch (error) {
            console.error('Error fetching sales data:', error);
        }
    },
    filterData({ dateFrom, dateTo }) {
        this.filteredData = this.salesData.filter(sale => {
            const saleDate = sale.date.split('T')[0];
            if (dateFrom && saleDate < dateFrom) return false;
            if (dateTo && saleDate > dateTo) return false;
            return true;
        });
        this.currentPage = 1;
        console.log('Filtered data:', this.filteredData.length);
    },
    getPagedData() {
        const start = (this.currentPage - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;
        return this.filteredData.slice(start, end);
    },
    aggregateTotals(data = this.filteredData) {
        return data.reduce((acc, sale) => {
            acc.totalSales += sale.saleAmount;
            acc.totalReturns += sale.returns;
            acc.transactions += 1;
            acc.byType.qrCard += sale.qrCard;
            acc.byType.cash += sale.cash;
            acc.byType.kiosk += sale.kiosk;
            acc.byType.muzaidynyKaspi += sale.muzaidynyKaspi;
            acc.byType.muzaidynyCard += sale.muzaidynyCard;
            acc.byType.kaspi += sale.kaspi;
            acc.byType.returns += sale.returns;
            acc.activationCount = 10;
            return acc;
        }, {
            totalSales: 0,
            totalReturns: 0,
            transactions: 0,
            byType: {
                qrCard: 0,
                cash: 0,
                kiosk: 0,
                muzaidynyKaspi: 0,
                muzaidynyCard: 0,
                kaspi: 0,
                returns: 0
            }
        });
    },
    aggregateByEvent(data = this.filteredData) {
        const byEvent = {};
        data.forEach(sale => {
            if (!byEvent[sale.event]) {
                byEvent[sale.event] = { totalSales: 0, totalReturns: 0, transactions: 0 };
            }
            byEvent[sale.event].totalSales += sale.saleAmount;
            byEvent[sale.event].totalReturns += sale.returns;
            byEvent[sale.event].transactions += 1;
        });
        return byEvent;
    },
    getTopChannel(data = this.filteredData) {
        const totals = this.aggregateTotals(data).byType;
        const channels = {
            'Касса (QR/карта)': totals.qrCard,
            'Касса (наличные)': totals.cash,
            'Киоск': totals.kiosk,
            'KassaPay.kz (KaspiQR)': totals.muzaidynyKaspi,
            'KassaPay.kz (Карта)': totals.muzaidynyCard,
            'Kaspi платежи': totals.kaspi
        };
        const topChannel = Object.entries(channels).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
        return topChannel[0] || '-';
    },
    getTopEvent(data = this.filteredData) {
        const events = this.aggregateByEvent(data);
        const topEvent = Object.entries(events).reduce((a, b) => a[1].totalSales > b[1].totalSales ? a : b, ['', { totalSales: 0 }]);
        return topEvent[0] || '-';
    },
    getReturnShare(data = this.filteredData) {
        const totals = this.aggregateTotals(data);
        return totals.totalSales > 0 ? (totals.totalReturns / totals.totalSales * 100).toFixed(1) : 0;
    },
    getActivationShare(data = this.filteredData) {
        const totals = this.aggregateTotals(data);
        return totals.transactions > 0 ? (totals.activationCount / totals.transactions * 100).toFixed(1) : 0;
    },
    aggregateByDay(data = this.filteredData) {
        const byDay = {};
        data.forEach(sale => {
            const saleDate = sale.date.split('T')[0];
            if (!byDay[saleDate]) {
                byDay[saleDate] = { sales: 0, transactions: 0 };
            }
            byDay[saleDate].sales += sale.saleAmount;
            byDay[saleDate].transactions += 1;
        });
        return byDay;
    },
    getTopDays(data = this.filteredData, limit = 5) {
        const byDay = this.aggregateByDay(data);
        return Object.entries(byDay)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, limit);
    },
    aggregateByHour(data = this.filteredData) {
        const byHour = Array(24).fill(0).map(() => ({ sales: 0, transactions: 0 }));
        data.forEach(sale => {
            const hour = new Date(sale.date).getHours();
            byHour[hour].sales += sale.saleAmount;
            byHour[hour].transactions += 1;
        });
        return byHour;
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
    updateStatsCards(data, isSingleEvent) {
        const totals = DataModule.aggregateTotals(data);
        const totalSalesElement = document.getElementById('totalSales');
        const totalReturnsElement = document.getElementById('totalReturns');
        const salesCountElement = document.getElementById('salesCount');
        const averageCheckElement = document.getElementById('averageCheck');
        const returnShareElement = document.getElementById('returnShare');
        const topChannelElement = document.getElementById('topChannel');
        const topEventElement = document.getElementById('topEvent');
        const topChannelCard = document.getElementById('topChannelCard');
        const topEventCard = document.getElementById('topEventCard');
        const activationCountElement = document.getElementById('activationCount');
        const activationShareElement = document.getElementById('activationShare');

        if (totalSalesElement) totalSalesElement.textContent = this.formatAmount(totals.totalSales);
        if (totalReturnsElement) totalReturnsElement.textContent = this.formatAmount(totals.totalReturns);
        if (salesCountElement) salesCountElement.textContent = totals.transactions;
        if (averageCheckElement) averageCheckElement.textContent = this.formatAmount(totals.transactions > 0 ? Math.round(totals.totalSales / totals.transactions) : 0);
        if (returnShareElement) returnShareElement.textContent = DataModule.getReturnShare(data) + '%';
        if (topChannelElement) topChannelElement.textContent = DataModule.getTopChannel(data);
        if (topEventElement) topEventElement.textContent = DataModule.getTopEvent(data);
        if (topChannelCard) topChannelCard.style.display = isSingleEvent ? 'block' : 'none';
        if (topEventCard) topEventCard.style.display = isSingleEvent ? 'none' : 'block';
        if (activationCountElement) activationCountElement.textContent = totals.activationCount;
        if (activationShareElement) activationShareElement.textContent = DataModule.getActivationShare(data) + '%';
    },
    renderSalesTable(data) {
        const tbody = document.getElementById('detailedTable');
        if (!tbody) return;
        tbody.innerHTML = data.length ? data.map((sale, index) => `
            <tr class="event-row" data-event="${encodeURIComponent(sale.event)}" data-date="${encodeURIComponent(sale.date.split('T')[0])}">
                <td>${index + 1 + (DataModule.currentPage - 1) * DataModule.rowsPerPage}</td>
                <td>${this.formatDate(sale.date)}</td>
                <td>${this.formatAmount(sale.saleAmount)}</td>
                <td>${this.formatAmount(sale.qrCard)}</td>
                <td>${this.formatAmount(sale.cash)}</td>
                <td>${this.formatAmount(sale.kiosk)}</td>
                <td>${this.formatAmount(sale.muzaidynyKaspi)}</td>
                <td>${this.formatAmount(sale.muzaidynyCard)}</td>
                <td>${this.formatAmount(sale.kaspi)}</td>
                <td>${this.formatAmount(sale.returns)}</td>
                <td>${sale.event}</td>
            </tr>
        `).join('') : '<tr><td colspan="11" class="text-center py-2">Нет данных для отображения.</td></tr>';

        document.querySelectorAll('.event-row').forEach(row => {
            row.addEventListener('click', () => {
                const eventName = decodeURIComponent(row.dataset.event);
                const date = decodeURIComponent(row.dataset.date);
                window.salesReportShowDashboard(eventName, date);
            });
        });
    },
    renderPagination() {
        const totalPages = Math.ceil(DataModule.filteredData.length / DataModule.rowsPerPage);
        const pagination = document.getElementById('paginationContainer');
        if (!pagination) {
            console.error('Pagination container not found');
            return;
        }

        pagination.innerHTML = '<nav><ul class="pagination mb-0"></ul></nav>';
        const ul = pagination.querySelector('ul');
        const createPageItem = (page, text = page, active = false, disabled = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
            if (!disabled) {
                li.addEventListener('click', e => {
                    e.preventDefault();
                    DataModule.currentPage = page;
                    AppModule.updateTable();
                });
            }
            ul.appendChild(li);
        };

        createPageItem(DataModule.currentPage - 1, '«', false, DataModule.currentPage === 1);
        for (let i = Math.max(1, DataModule.currentPage - 2); i <= Math.min(totalPages, DataModule.currentPage + 2); i++) {
            createPageItem(i, i, i === DataModule.currentPage);
        }
        createPageItem(DataModule.currentPage + 1, '»', false, DataModule.currentPage === totalPages);
    },
    renderTopDays(data) {
        const tbody = document.getElementById('topDaysTable');
        if (!tbody) return;
        const topDays = DataModule.getTopDays(data);
        tbody.innerHTML = topDays.length ? topDays.map(day => `
            <tr>
                <td>${this.formatDate(day.date)}</td>
                <td>${this.formatAmount(day.sales)}</td>
                <td>${day.transactions}</td>
            </tr>
        `).join('') : '<tr><td colspan="3">Нет данных</td></tr>';
    },
    updateDashboardSubtitle(eventName, dateFrom, dateTo) {
        const subtitle = document.getElementById('dashboardSubtitle');
        if (!subtitle) return;
        const dateRange = this.formatDateRange(dateFrom, dateTo);
        subtitle.textContent = eventName ? `${eventName}${dateRange ? ', ' + dateRange : ''}` : `Сводная аналитика${dateRange ? ', ' + dateRange : ''}`;
    }
};

// Модуль графиков
const ChartModule = {
    charts: {},
    destroyCharts() {
        Object.values(this.charts).forEach(chart => chart?.destroy());
        this.charts = {};
    },
    createSalesTypesChart(data) {
        const canvas = document.getElementById('salesTypesChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const totals = DataModule.aggregateTotals(data).byType;
        const channels = {
            'Касса (QR/карта)': totals.qrCard,
            'Касса (наличные)': totals.cash,
            'Киоск': totals.kiosk,
            'KassaPay.kz (KaspiQR)': totals.muzaidynyKaspi,
            'KassaPay.kz (Карта)': totals.muzaidynyCard,
            'Kaspi платежи': totals.kaspi
        };
        this.charts.salesTypesChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(channels),
                datasets: [{
                    data: Object.values(channels),
                    backgroundColor: ['#ef4444', '#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899'],
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
    createSalesByChannelChart(data) {
        const canvas = document.getElementById('salesByChannelChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const totals = DataModule.aggregateTotals(data).byType;
        const channels = {
            'Касса (QR/карта)': totals.qrCard,
            'Касса (наличные)': totals.cash,
            'Киоск': totals.kiosk,
            'KassaPay.kz (KaspiQR)': totals.muzaidynyKaspi,
            'KassaPay.kz (Карта)': totals.muzaidynyCard,
            'Kaspi платежи': totals.kaspi
        };
        this.charts.salesByChannelChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(channels),
                datasets: [{
                    label: 'Продажи (₸)',
                    data: Object.values(channels),
                    backgroundColor: '#6366f1',
                    borderColor: '#4f46e5',
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
    createSalesByObjectChart(data) {
        const canvas = document.getElementById('salesByObjectChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const totals = DataModule.aggregateTotals(data).byType;
        const channels = {
            'Мавзолей Ходжи Ахмеда Ясави': totals.qrCard,
            'Мавзолей Айша-Биби': totals.cash,
            'Мавзолей Карахан': totals.kiosk,
            'Музей-заповедник Отырар': totals.muzaidynyKaspi,
            'Мавзолей Арыстан Баб': totals.muzaidynyCard
        };
        this.charts.salesByChannelChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(channels),
                datasets: [{
                    label: 'Продажи (₸)',
                    data: Object.values(channels),
                    backgroundColor: '#6366f1',
                    borderColor: '#4f46e5',
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
    createSalesByDayChart(data) {
        const canvas = document.getElementById('salesByDayChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const byDay = DataModule.aggregateByDay(data);
        const sortedDays = Object.keys(byDay).sort();
        this.charts.salesByDayChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDays.map(day => RenderModule.formatDate(day)),
                datasets: [{
                    label: 'Продажи (₸)',
                    data: sortedDays.map(day => byDay[day].sales),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.3
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
    createReturnsByChannelChart(data) {
        const canvas = document.getElementById('returnsByChannelChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const totals = DataModule.aggregateTotals(data).byType;
        const totalSales = totals.qrCard + totals.cash + totals.kiosk + totals.muzaidynyKaspi + totals.muzaidynyCard + totals.kaspi;
        const channels = {
            'Касса (QR/карта)': totalSales ? totals.returns * (totals.qrCard / totalSales) : 0,
            'Касса (наличные)': totalSales ? totals.returns * (totals.cash / totalSales) : 0,
            'Киоск': totalSales ? totals.returns * (totals.kiosk / totalSales) : 0,
            'KassaPay.kz (KaspiQR)': totalSales ? totals.returns * (totals.muzaidynyKaspi / totalSales) : 0,
            'KassaPay.kz (Карта)': totalSales ? totals.returns * (totals.muzaidynyCard / totalSales) : 0,
            'Kaspi платежи': totalSales ? totals.returns * (totals.kaspi / totalSales) : 0
        };
        this.charts.returnsByChannelChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(channels),
                datasets: [{
                    data: Object.values(channels),
                    backgroundColor: ['#ef4444', '#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899'],
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
    createSalesByHourChart(data) {
        const canvas = document.getElementById('salesByHourChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const byHour = DataModule.aggregateByHour(data);
        this.charts.salesByHourChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Продажи (₸)',
                    data: byHour.map(h => h.sales),
                    backgroundColor: '#f59e0b',
                    borderColor: '#d97706',
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
    createSalesByEventChart(data) {
        const canvas = document.getElementById('salesByEventChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const events = DataModule.aggregateByEvent(data);
        this.charts.salesByEventChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(events),
                datasets: [{
                    label: 'Сумма продаж (₸)',
                    data: Object.values(events).map(evt => evt.totalSales),
                    backgroundColor: '#6366f1',
                    borderColor: '#4f46e5',
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
    }
};

// Модуль управления
const AppModule = {
    isInitialized: false,
    currentEvent: null,
    async initialize() {
        if (this.isInitialized) {
            console.log('Sales report page already initialized');
            return;
        }
        this.isInitialized = true;
        console.log('Initializing sales report page');
        await DataModule.fetchSalesData();
        this.bindEvents();
        this.setDefaultFilters();
        this.updateTable();
    },
    bindEvents() {
        document.getElementById('newReportBtn')?.addEventListener('click', this.handleFilter);
        document.getElementById('exportExcelBtn')?.addEventListener('click', this.handleExport);
        document.getElementById('showAllAnalyticsBtn')?.addEventListener('click', this.handleShowAllAnalytics);
        document.getElementById('backToMainBtn')?.addEventListener('click', window.salesReportBackToMain);
        document.getElementById('dateFrom')?.addEventListener('change', this.handleFilter);
        document.getElementById('dateTo')?.addEventListener('change', this.handleFilter);
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', () => this.handleRowsPerPage());
        } else {
            console.warn('pageSizeSelect not found, cannot bind event');
        }
    },
    setDefaultFilters() {
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (dateFrom && dateTo) {
            dateFrom.value = '';
            dateTo.value = '';
            this.handleFilter();
        }
        if (pageSizeSelect) {
            pageSizeSelect.value = DataModule.rowsPerPage;
        }
    },
    handleFilter() {
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';
        if (dateTo && dateFrom && dateTo < dateFrom) {
            alert('Дата "по" должна быть не раньше даты "с"');
            return;
        }
        DataModule.filterData({ dateFrom, dateTo });
        this.updateTable();
    },
    handleRowsPerPage() {
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) {
            DataModule.rowsPerPage = parseInt(pageSizeSelect.value, 10);
            DataModule.currentPage = 1;
            console.log('Rows per page changed to:', DataModule.rowsPerPage);
            this.updateTable();
        } else {
            console.error('pageSizeSelect element not found');
        }
    },
    handleExport() {
        console.log('Exporting to Excel');
        try {
            const table = document.getElementById('detailedTable').closest('table');
            const wb = XLSX.utils.table_to_book(table, { sheet: "Отчет продаж" });
            XLSX.writeFile(wb, `Отчет_продажи_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Ошибка при экспорте в Excel');
        }
    },
    handleShowAllAnalytics() {
        console.log('Handling show all analytics');
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        let dateFrom = dateFromInput?.value || '';
        let dateTo = dateToInput?.value || '';

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

        window.salesReportShowDashboard(null, dateFrom, dateTo);
    },
    updateTable() {
        RenderModule.renderSalesTable(DataModule.getPagedData());
        RenderModule.renderPagination();
    }
};

// Глобальные функции
window.salesReportShowDashboard = function (eventName, rowDate, analyticsDateTo) {
    console.log('Showing dashboard for:', { eventName: eventName || 'all events', rowDate, analyticsDateTo });
    AppModule.currentEvent = eventName;
    const isSingleEvent = !!eventName;
    const data = isSingleEvent ?
        DataModule.filteredData.filter(s => s.event === eventName) :
        DataModule.filteredData;

    const mainPage = document.getElementById('mainPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const generalAnalytics = document.getElementById('generalAnalytics');
    const returnsByChannelContainer = document.getElementById('returnsByChannelContainer');

    if (mainPage) mainPage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'block';
    if (generalAnalytics) generalAnalytics.style.display = isSingleEvent ? 'none' : 'block';
    if (returnsByChannelContainer) returnsByChannelContainer.style.display = isSingleEvent ? 'block' : 'none';

    let dateFrom = '', dateTo = '';
    if (isSingleEvent) {
        if (rowDate && !isNaN(new Date(rowDate).getTime())) {
            dateFrom = rowDate;
        } else if (data.length > 0) {
            const firstSale = data[0];
            if (firstSale.date && !isNaN(new Date(firstSale.date).getTime())) {
                dateFrom = firstSale.date.split('T')[0];
            }
        }
        console.log('Event date:', { eventName, dateFrom, dataLength: data.length });
    } else {
        dateFrom = document.getElementById('dateFrom')?.value || '2025-06-13';
        dateTo = analyticsDateTo || document.getElementById('dateTo')?.value || '2025-06-20';
        console.log('Dashboard dates:', { dateFrom, dateTo });
    }

    RenderModule.updateDashboardSubtitle(eventName, dateFrom, dateTo);
    RenderModule.updateStatsCards(data, isSingleEvent);
    ChartModule.destroyCharts();
    ChartModule.createSalesTypesChart(data);
    ChartModule.createSalesByChannelChart(data);
    ChartModule.createSalesByObjectChart(data);
    ChartModule.createSalesByDayChart(data);
    ChartModule.createSalesByHourChart(data);
    RenderModule.renderTopDays(data);

    if (isSingleEvent) {
        ChartModule.createReturnsByChannelChart(data);
    } else {
        ChartModule.createSalesByEventChart(data);
    }
};

window.salesReportBackToMain = function () {
    console.log('Returning to main page');
    AppModule.currentEvent = null;
    const mainPage = document.getElementById('mainPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const generalAnalytics = document.getElementById('generalAnalytics');
    const returnsByChannelContainer = document.getElementById('returnsByChannelContainer');

    if (dashboardPage) dashboardPage.style.display = 'none';
    if (mainPage) mainPage.style.display = 'block';
    if (generalAnalytics) generalAnalytics.style.display = 'none';
    if (returnsByChannelContainer) returnsByChannelContainer.style.display = 'none';
    ChartModule.destroyCharts();
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing sales report page');
    AppModule.initialize();
});