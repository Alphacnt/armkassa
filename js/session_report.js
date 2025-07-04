console.log('session_report.js loaded at:', new Date().toISOString());

// Мок-данные
function generateMockSessionData(count) {
    const events = ['Массовое катание', 'Детское катание', 'Ночное катание'];
    const sessions = ['10:00', '14:00', '18:00'];
    const startDate = new Date('2025-05-01');
    const endDate = new Date('2025-06-20');
    const data = [];

    for (let i = 0; i < count; i++) {
        const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        const totalTickets = Math.floor(Math.random() * 100) + 50;
        const soldTickets = Math.floor(Math.random() * totalTickets * 0.8);
        const freeTickets = Math.floor(Math.random() * totalTickets * 0.1);
        const remainingTickets = totalTickets - soldTickets - freeTickets;
        const totalSales = soldTickets * 1000; // Цена билета 1000 ₸
        const returns = Math.floor(Math.random() * totalSales * 0.1);
        const session = {
            id: i + 1,
            date: date.toISOString(),
            sessionTime: sessions[Math.floor(Math.random() * sessions.length)],
            totalTickets,
            remainingTickets,
            freeTickets,
            soldTickets,
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
        data.push(session);
    }
    return data;
}

// Модуль данных
const DataModule = {
    sessionData: [],
    filteredData: [],
    currentPage: 1,
    rowsPerPage: 10,
    async fetchSessionData() {
        try {
            this.sessionData = generateMockSessionData(100);
            this.filteredData = [...this.sessionData];
            console.log('Session data loaded:', this.sessionData.length);
        } catch (error) {
            console.error('Error fetching session data:', error);
        }
    },
    filterData({ dateFrom, dateTo }) {
        this.filteredData = this.sessionData.filter(session => {
            const sessionDate = session.date.split('T')[0];
            if (dateFrom && sessionDate < dateFrom) return false;
            if (dateTo && sessionDate > dateTo) return false;
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
        return data.reduce((acc, session) => {
            acc.totalSoldTickets += session.soldTickets;
            acc.totalRemainingTickets += session.remainingTickets;
            acc.totalSalesValue += session.saleAmount;
            acc.totalReturns += session.returns;
            acc.transactions += 1;
            acc.byType.qrCard += session.qrCard;
            acc.byType.cash += session.cash;
            acc.byType.kiosk += session.kiosk;
            acc.byType.muzaidynyKaspi += session.muzaidynyKaspi;
            acc.byType.muzaidynyCard += session.muzaidynyCard;
            acc.byType.kaspi += session.kaspi;
            acc.byType.returns += session.returns;
            return acc;
        }, {
            totalSoldTickets: 0,
            totalRemainingTickets: 0,
            totalSalesValue: 0,
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
        data.forEach(session => {
            if (!byEvent[session.event]) {
                byEvent[session.event] = { totalSales: 0, totalSoldTickets: 0, transactions: 0 };
            }
            byEvent[session.event].totalSales += session.saleAmount;
            byEvent[session.event].totalSoldTickets += session.soldTickets;
            byEvent[session.event].transactions += 1;
        });
        return byEvent;
    },
    getTopChannel(data = this.filteredData) {
        const totals = this.aggregateTotals(data).byType;
        const channels = {
            'Касса (QR/карта)': totals.qrCard,
            'Касса (наличные)': totals.cash,
            'Киоск': totals.kiosk,
            'Muzaidyny.kz (KaspiQR)': totals.muzaidynyKaspi,
            'Muzaidyny.kz (Карта)': totals.muzaidynyCard,
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
    getAverageCheck(data = this.filteredData) {
        const totals = this.aggregateTotals(data);
        return totals.transactions > 0 ? Math.round(totals.totalSalesValue / totals.transactions) : 0;
    },
    aggregateByDay(data = this.filteredData) {
        const byDay = {};
        data.forEach(session => {
            const sessionDate = session.date.split('T')[0];
            if (!byDay[sessionDate]) {
                byDay[sessionDate] = { sales: 0, transactions: 0, soldTickets: 0 };
            }
            byDay[sessionDate].sales += session.saleAmount;
            byDay[sessionDate].transactions += 1;
            byDay[sessionDate].soldTickets += session.soldTickets;
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
        const byHour = Array(24).fill(0).map(() => ({ sales: 0, transactions: 0, soldTickets: 0 }));
        data.forEach(session => {
            const hour = new Date(session.date).getHours();
            byHour[hour].sales += session.saleAmount;
            byHour[hour].transactions += 1;
            byHour[hour].soldTickets += session.soldTickets;
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
        const totalSoldTicketsElement = document.getElementById('totalSoldTickets');
        const totalRemainingTicketsElement = document.getElementById('totalRemainingTickets');
        const totalSalesValueElement = document.getElementById('totalSalesValue');
        const salesCountElement = document.getElementById('salesCount');
        const averageCheckElement = document.getElementById('averageCheck');
        const topChannelElement = document.getElementById('topChannel');
        const topEventElement = document.getElementById('topEvent');
        const topChannelCard = document.getElementById('topChannelCard');
        const topEventCard = document.getElementById('topEventCard');

        if (totalSoldTicketsElement) totalSoldTicketsElement.textContent = totals.totalSoldTickets;
        if (totalRemainingTicketsElement) totalRemainingTicketsElement.textContent = totals.totalRemainingTickets;
        if (totalSalesValueElement) totalSalesValueElement.textContent = this.formatAmount(totals.totalSalesValue);
        if (salesCountElement) salesCountElement.textContent = totals.transactions;
        if (averageCheckElement) averageCheckElement.textContent = this.formatAmount(DataModule.getAverageCheck(data));
        if (topChannelElement) topChannelElement.textContent = DataModule.getTopChannel(data);
        if (topEventElement) topEventElement.textContent = DataModule.getTopEvent(data);
        if (topChannelCard) topChannelCard.style.display = isSingleEvent ? 'block' : 'none';
        if (topEventCard) topEventCard.style.display = isSingleEvent ? 'none' : 'block';
    },
    renderSalesTable(data) {
        const tbody = document.getElementById('salesTable');
        if (!tbody) return;
        tbody.innerHTML = data.length ? data.map((session, index) => `
            <tr class="event-row" data-event="${encodeURIComponent(session.event)}" data-date="${encodeURIComponent(session.date.split('T')[0])}">
                <td>${index + 1 + (DataModule.currentPage - 1) * DataModule.rowsPerPage}</td>
                <td>${this.formatDate(session.date)}</td>
                <td>${session.sessionTime}</td>
                <td>${session.totalTickets}</td>
                <td>${session.remainingTickets}</td>
                <td>${session.freeTickets}</td>
                <td>${session.soldTickets}</td>
                <td>${this.formatAmount(session.qrCard)}</td>
                <td>${this.formatAmount(session.cash)}</td>
                <td>${this.formatAmount(session.kiosk)}</td>
                <td>${this.formatAmount(session.muzaidynyKaspi)}</td>
                <td>${this.formatAmount(session.muzaidynyCard)}</td>
                <td>${this.formatAmount(session.kaspi)}</td>
                <td>${this.formatAmount(session.returns)}</td>
                <td>${session.event}</td>
            </tr>
        `).join('') : '<tr><td colspan="15" class="text-center py-2">Нет данных для отображения.</td></tr>';

        document.querySelectorAll('.event-row').forEach(row => {
            row.addEventListener('click', () => {
                const eventName = decodeURIComponent(row.dataset.event);
                const date = decodeURIComponent(row.dataset.date);
                window.sessionReportShowDashboard(eventName, date);
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
            'Muzaidyny.kz (KaspiQR)': totals.muzaidynyKaspi,
            'Muzaidyny.kz (Карта)': totals.muzaidynyCard,
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
            'Muzaidyny.kz (KaspiQR)': totals.muzaidynyKaspi,
            'Muzaidyny.kz (Карта)': totals.muzaidynyCard,
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
    createSalesByDayChart(data) {
        const canvas = document.getElementById('salesByDateChart');
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
            'Muzaidyny.kz (KaspiQR)': totalSales ? totals.returns * (totals.muzaidynyKaspi / totalSales) : 0,
            'Muzaidyny.kz (Карта)': totalSales ? totals.returns * (totals.muzaidynyCard / totalSales) : 0,
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
            console.log('Session report page already initialized');
            return;
        }
        this.isInitialized = true;
        console.log('Initializing session report page');
        await DataModule.fetchSessionData();
        this.bindEvents();
        this.setDefaultFilters();
        this.updateTable();
    },
    bindEvents() {
    document.getElementById('newReportBtn')?.addEventListener('click', this.handleFilter);
    document.getElementById('showAllAnalyticsBtn')?.addEventListener('click', () => {
        console.log('Show all analytics button clicked');
        window.sessionReportShowDashboard(null, null);
    });
    document.getElementById('exportExcelBtn')?.addEventListener('click', this.handleExport);
    document.getElementById('backToMainBtn')?.addEventListener('click', window.sessionReportBackToMain);
    document.getElementById('dateFrom')?.addEventListener('change', this.handleFilter);
    document.getElementById('dateTo')?.addEventListener('change', this.handleFilter);
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', () => {
            console.log('pageSizeSelect changed to:', pageSizeSelect.value);
            this.handleRowsPerPage();
        });
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
            const table = document.getElementById('salesTable').closest('table');
            const wb = XLSX.utils.table_to_book(table, { sheet: "Отчет по сеансам" });
            XLSX.writeFile(wb, `Отчет_сеансы_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Ошибка при экспорте в Excel');
        }
    },
    updateTable() {
        RenderModule.renderSalesTable(DataModule.getPagedData());
        RenderModule.renderPagination();
    }
};

// Глобальные функции
window.sessionReportShowDashboard = function(eventName, rowDate) {
    console.log('Showing dashboard for:', { eventName: eventName || 'all events', rowDate });
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
            const firstSession = data[0];
            if (firstSession.date && !isNaN(new Date(firstSession.date).getTime())) {
                dateFrom = firstSession.date.split('T')[0];
            }
        }
        console.log('Event date:', { eventName, dateFrom, dataLength: data.length });
    } else {
        dateFrom = document.getElementById('dateFrom')?.value || '2025-06-01';
        dateTo = document.getElementById('dateTo')?.value || '2025-06-20';
        console.log('Dashboard dates:', { dateFrom, dateTo });
    }

    RenderModule.updateDashboardSubtitle(eventName, dateFrom, dateTo);
    RenderModule.updateStatsCards(data, isSingleEvent);
    ChartModule.destroyCharts();
    ChartModule.createSalesTypesChart(data);
    ChartModule.createSalesByChannelChart(data);
    ChartModule.createSalesByDayChart(data);
    ChartModule.createSalesByHourChart(data);
    RenderModule.renderTopDays(data);

    if (isSingleEvent) {
        ChartModule.createReturnsByChannelChart(data);
    } else {
        ChartModule.createSalesByEventChart(data);
    }
};

window.sessionReportBackToMain = function() {
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
    console.log('DOM loaded, initializing session report page');
    AppModule.initialize();
});