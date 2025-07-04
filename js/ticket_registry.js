
console.log('ticket_registry.js loaded at:', new Date().toISOString());

// Мок-данные
function generateMockTicketData(count) {
    const events = ['Массовое катание', 'Массовое катание в выходные дни', 'Выставка'];
    const services = ['Катание', 'Выставка'];
    const inventories = ['Коньки', '–'];
    const saleTypes = ['Касса (QR/карта)', 'Касса (наличные)', 'Киоск'];
    const statuses = ['Активен', 'Использован'];
    const endDate = new Date('2025-06-20');
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 13 июня
    const data = [];

    for (let i = 0; i < count; i++) {
        const sessionDateTime = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        const ticketCost = Math.floor(Math.random() * 4000) + 1000;
        const bookingDateTime = new Date(sessionDateTime.getTime() - Math.random() * 24 * 60 * 60 * 1000);
        const paymentDateTime = new Date(bookingDateTime.getTime() + Math.random() * 2 * 60 * 60 * 1000);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const activationDateTime = status === 'Активен' && Math.random() > 0.5 ? null : new Date(sessionDateTime.getTime());
        const ticket = {
            id: i + 1,
            ticketNumber: `B${String(i + 1).padStart(3, '0')}`,
            orderNumber: `ORD${String(i + 100).padStart(3, '0')}`,
            sessionDateTime: sessionDateTime.toISOString(),
            ticketCost,
            saleType: saleTypes[Math.floor(Math.random() * saleTypes.length)],
            serviceName: services[Math.floor(Math.random() * services.length)],
            inventoryName: inventories[Math.floor(Math.random() * inventories.length)],
            bookingDateTime: bookingDateTime.toISOString(),
            paymentReceipt: `RC${String(i + 1).padStart(3, '0')}`,
            phoneNumber: `8777${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
            paymentDateTime: paymentDateTime.toISOString(),
            status,
            activationDateTime: activationDateTime ? activationDateTime.toISOString() : null,
            event: events[Math.floor(Math.random() * events.length)]
        };
        data.push(ticket);
    }
    return data;
}

// Модуль данных
const DataModule = {
    ticketData: [],
    filteredData: [],
    currentPage: 1,
    rowsPerPage: 10,
    async fetchTicketData() {
        try {
            this.ticketData = generateMockTicketData(100);
            this.filteredData = [...this.ticketData];
            console.log('Ticket data loaded:', this.ticketData.length);
            this.populateEventFilter();
        } catch (error) {
            console.error('Error fetching ticket data:', error);
            alert('Ошибка загрузки данных');
        }
    },
    populateEventFilter() {
        const eventFilter = document.getElementById('eventFilter');
        if (!eventFilter) {
            console.warn('Event filter element not found');
            return;
        }
        const events = [...new Set(this.ticketData.map(t => t.event))];
        eventFilter.innerHTML = '<option value="">Все мероприятия</option>' + 
            events.map(event => `<option value="${event}">${event}</option>`).join('');
    },
    filterData({ dateFrom, dateTo, searchTerm, event }) {
        try {
            this.filteredData = this.ticketData.filter(ticket => {
                const sessionDate = new Date(ticket.sessionDateTime.split('T')[0]);
                if (dateFrom && sessionDate < new Date(dateFrom)) return false;
                if (dateTo && sessionDate > new Date(dateTo)) return false;
                if (event && ticket.event !== event) return false;
                if (searchTerm) {
                    const searchFields = [
                        ticket.ticketNumber.toLowerCase(),
                        ticket.orderNumber.toLowerCase(),
                        ticket.sessionDateTime.toLowerCase(),
                        ticket.ticketCost.toString(),
                        ticket.serviceName.toLowerCase(),
                        ticket.inventoryName.toLowerCase(),
                        ticket.saleType.toLowerCase(),
                        ticket.bookingDateTime.toLowerCase(),
                        ticket.paymentReceipt.toLowerCase(),
                        ticket.phoneNumber.toLowerCase(),
                        ticket.paymentDateTime.toLowerCase(),
                        ticket.status.toLowerCase(),
                        ticket.activationDateTime ? ticket.activationDateTime.toLowerCase() : '',
                        ticket.event.toLowerCase()
                    ].join(' ');
                    return searchFields.includes(searchTerm.toLowerCase());
                }
                return true;
            });
            this.currentPage = 1;
            console.log('Filtered data:', this.filteredData.length);
        } catch (error) {
            console.error('Error filtering data:', error);
            this.filteredData = [];
        }
    },
    getPagedData() {
        const start = (this.currentPage - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;
        return this.filteredData.slice(start, end);
    },
    aggregateTotals(data = this.filteredData) {
        return data.reduce((acc, ticket) => {
            acc.totalTickets += 1;
            acc.activeTickets += ticket.status === 'Активен' ? 1 : 0;
            acc.totalSalesValue += ticket.ticketCost;
            acc.transactions += 1;
            acc.byType[ticket.saleType] = (acc.byType[ticket.saleType] || 0) + ticket.ticketCost;
            acc.byService[ticket.serviceName] = (acc.byService[ticket.serviceName] || 0) + ticket.ticketCost;
            acc.byInventory[ticket.inventoryName] = (acc.byInventory[ticket.inventoryName] || 0) + ticket.ticketCost;
            return acc;
        }, {
            totalTickets: 0,
            activeTickets: 0,
            totalSalesValue: 0,
            transactions: 0,
            byType: {},
            byService: {},
            byInventory: {}
        });
    },
    aggregateByEvent(data = this.filteredData) {
        const byEvent = {};
        data.forEach(ticket => {
            if (!byEvent[ticket.event]) {
                byEvent[ticket.event] = { totalSales: 0, totalTickets: 0, transactions: 0 };
            }
            byEvent[ticket.event].totalSales += ticket.ticketCost;
            byEvent[ticket.event].totalTickets += 1;
            byEvent[ticket.event].transactions += 1;
        });
        return byEvent;
    },
    getTopChannel(data = this.filteredData) {
        const totals = this.aggregateTotals(data).byType;
        const topChannel = Object.entries(totals).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
        return topChannel[0] || '–';
    },
    getTopEvent(data = this.filteredData) {
        const events = this.aggregateByEvent(data);
        const topEvent = Object.entries(events).reduce((a, b) => a[1].totalSales > b[1].totalSales ? a : b, ['', { totalSales: 0 }]);
        return topEvent[0] || '–';
    },
    getTopService(data = this.filteredData) {
        const totals = this.aggregateTotals(data).byService;
        const topService = Object.entries(totals).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
        return topService[0] || '–';
    },
    getTopInventory(data = this.filteredData) {
        const totals = this.aggregateTotals(data).byInventory;
        const topInventory = Object.entries(totals).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
        return topInventory[0] || '–';
    },
    getAverageCheck(data = this.filteredData) {
        const totals = this.aggregateTotals(data);
        return totals.transactions > 0 ? Math.round(totals.totalSalesValue / totals.transactions) : 0;
    },
    aggregateByDay(data = this.filteredData) {
        const byDay = {};
        const start = new Date('2025-06-13');
        const end = new Date('2025-06-20');
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            byDay[dateStr] = { sales: 0, transactions: 0, totalTickets: 0 };
        }
        data.forEach(ticket => {
            const sessionDate = ticket.sessionDateTime.split('T')[0];
            if (!byDay[sessionDate]) {
                byDay[sessionDate] = { sales: 0, transactions: 0, totalTickets: 0 };
            }
            byDay[sessionDate].sales += ticket.ticketCost;
            byDay[sessionDate].transactions += 1;
            byDay[sessionDate].totalTickets += 1;
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
        const byHour = Array(24).fill(0).map(() => ({ sales: 0, transactions: 0, totalTickets: 0 }));
        data.forEach(ticket => {
            const hour = new Date(ticket.sessionDateTime).getHours();
            byHour[hour].sales += ticket.ticketCost;
            byHour[hour].transactions += 1;
            byHour[hour].totalTickets += 1;
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
        if (dateFrom && dateTo && dateFrom === dateTo) return this.formatDate(dateFrom);
        if (dateFrom && dateTo) return `${this.formatDate(dateFrom)} – ${this.formatDate(dateTo)}`;
        return this.formatDate(dateFrom || dateTo);
    },
    updateStatsCards(data, isSingleEvent) {
        const totals = DataModule.aggregateTotals(data);
        const elements = {
            totalTickets: document.getElementById('totalTickets'),
            activeTickets: document.getElementById('activeTickets'),
            totalSalesValue: document.getElementById('totalSalesValue'),
            salesCount: document.getElementById('salesCount'),
            averageCheck: document.getElementById('averageCheck'),
            topChannel: document.getElementById('topChannel'),
            topEvent: document.getElementById('topEvent'),
            topService: document.getElementById('topService'),
            topInventory: document.getElementById('topInventory'),
            topChannelCard: document.getElementById('topChannelCard'),
            topEventCard: document.getElementById('topEventCard')
        };

        if (elements.totalTickets) elements.totalTickets.textContent = totals.totalTickets || 0;
        if (elements.activeTickets) elements.activeTickets.textContent = totals.activeTickets || 0;
        if (elements.totalSalesValue) elements.totalSalesValue.textContent = this.formatAmount(totals.totalSalesValue);
        if (elements.salesCount) elements.salesCount.textContent = totals.transactions || 0;
        if (elements.averageCheck) elements.averageCheck.textContent = this.formatAmount(DataModule.getAverageCheck(data));
        if (elements.topChannel) elements.topChannel.textContent = DataModule.getTopChannel(data);
        if (elements.topEvent) elements.topEvent.textContent = DataModule.getTopEvent(data);
        if (elements.topService) elements.topService.textContent = DataModule.getTopService(data);
        if (elements.topInventory) elements.topInventory.textContent = DataModule.getTopInventory(data);
        if (elements.topChannelCard) elements.topChannelCard.style.display = isSingleEvent ? 'block' : 'none';
        if (elements.topEventCard) elements.topEventCard.style.display = isSingleEvent ? 'none' : 'block';

        Object.entries(elements).forEach(([key, el]) => {
            if (!el) console.warn(`Stats card element ${key} not found`);
        });
    },
    renderTicketTable(data) {
        const tbody = document.getElementById('ticketTable');
        if (!tbody) {
            console.error('Ticket table body not found');
            return;
        }
        tbody.innerHTML = data.length ? data.map((ticket, index) => `
            <tr class="event-row" data-event="${encodeURIComponent(ticket.event)}" data-date="${encodeURIComponent(ticket.sessionDateTime.split('T')[0])}">
                <td>${index + 1 + (DataModule.currentPage - 1) * DataModule.rowsPerPage}</td>
                <td>${ticket.ticketNumber}</td>
                <td>${ticket.orderNumber}</td>
                <td>${this.formatDate(ticket.sessionDateTime)}</td>
                <td>${this.formatAmount(ticket.ticketCost)}</td>
                <td>${ticket.serviceName}</td>
                <td>${ticket.inventoryName}</td>
                <td>${ticket.saleType}</td>
                <td>${this.formatDate(ticket.bookingDateTime)}</td>
                <td>${ticket.paymentReceipt}</td>
                <td>${ticket.phoneNumber}</td>
                <td>${this.formatDate(ticket.paymentDateTime)}</td>
                <td>${ticket.status}</td>
                <td>${ticket.activationDateTime ? this.formatDate(ticket.activationDateTime) : '–'}</td>
                <td><a href="#" class="btn btn-sm btn-outline-primary download-ticket clickable" data-ticket-id="${ticket.id}">Скачать</a></td>
            </tr>
        `).join('') : '<tr><td colspan="15" class="text-center py-4">Нет данных для отображения.</td></tr>';

        document.querySelectorAll('.event-row').forEach(row => {
            row.addEventListener('click', () => {
                const eventName = decodeURIComponent(row.dataset.event);
                const date = decodeURIComponent(row.dataset.date);
                console.log('Row clicked:', { eventName, date });
                window.ticketRegistryShowDashboard(eventName, date);
            });
        });

        document.querySelectorAll('.download-ticket').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const ticketId = btn.dataset.ticketId;
                console.log('Download ticket clicked for ID:', ticketId);
                this.downloadTicket(ticketId);
            });
        });
    },
    downloadTicket(ticketId) {
        console.log('Downloading ticket for ID:', ticketId);
        const btn = document.querySelector(`.download-ticket[data-ticket-id="${ticketId}"]`);
        if (!btn) {
            console.error('Download button not found for ticket ID:', ticketId);
            return;
        }
        const originalText = btn.textContent;
        btn.textContent = 'Загрузка...';
        btn.classList.add('disabled');

        try {
            if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF библиотека не загружена');
            const ticket = DataModule.ticketData.find(t => t.id == ticketId);
            if (!ticket) throw new Error('Билет не найден');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text('Билет', 10, 10);
            doc.setFontSize(12);
            doc.text(`№ билета: ${ticket.ticketNumber}`, 10, 20);
            doc.text(`Мероприятие: ${ticket.event}`, 10, 30);
            doc.text(`Дата сеанса: ${this.formatDate(ticket.sessionDateTime)}`, 10, 40);
            doc.text(`Стоимость: ${this.formatAmount(ticket.ticketCost)}`, 10, 50);
            doc.text(`Услуга: ${ticket.serviceName}`, 10, 60);
            doc.text(`Инвентарь: ${ticket.inventoryName}`, 10, 70);
            doc.text(`Статус: ${ticket.status}`, 10, 80);
            doc.save(`Ticket_${ticket.ticketNumber}.pdf`);
            console.log('Ticket downloaded:', ticket.ticketNumber);
        } catch (error) {
            console.error('Error downloading ticket:', error);
            alert(`Ошибка при скачивании билета: ${error.message}`);
        } finally {
            btn.textContent = originalText;
            btn.classList.remove('disabled');
        }
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
        if (!tbody) {
            console.error('Top days table body not found');
            return;
        }
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
        if (!subtitle) {
            console.error('Dashboard subtitle not found');
            return;
        }
        const dateRange = this.formatDateRange(dateFrom, dateTo);
        subtitle.textContent = eventName ? `${eventName}${dateRange ? ', ' + dateRange : ''}` : `Сводная аналитика${dateRange ? ', ' + dateRange : ''}`;
    }
};

// Модуль графиков
const ChartModule = {
    charts: {},
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') chart.destroy();
        });
        this.charts = {};
    },
    createSalesTypesChart(data) {
        const canvas = document.getElementById('salesTypesChart');
        if (!canvas) {
            console.error('Sales types chart canvas not found');
            return;
        }
        if (!window.Chart) {
            console.error('Chart.js library is not loaded');
            return;
        }
        try {
            const ctx = canvas.getContext('2d');
            const totals = DataModule.aggregateTotals(data).byType;
            this.charts.salesTypesChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: Object.keys(totals),
                    datasets: [{
                        data: Object.values(totals),
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
        } catch (error) {
            console.error('Error creating sales types chart:', error);
        }
    },
    createSalesByChannelChart(data) {
        const canvas = document.getElementById('salesByChannelChart');
        if (!canvas) {
            console.error('Sales by channel chart canvas not found');
            return;
        }
        if (!window.Chart) {
            console.error('Chart.js library is not loaded');
            return;
        }
        try {
            const ctx = canvas.getContext('2d');
            const totals = DataModule.aggregateTotals(data).byType;
            this.charts.salesByChannelChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(totals),
                    datasets: [{
                        label: 'Продажи (₸)',
                        data: Object.values(totals),
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
        } catch (error) {
            console.error('Error creating sales by channel chart:', error);
        }
    },
    createSalesByDayChart(data) {
        const canvas = document.getElementById('salesByDateChart');
        if (!canvas) {
            console.error('Sales by date chart canvas not found');
            return;
        }
        if (!window.Chart) {
            console.error('Chart.js library is not loaded');
            return;
        }
        try {
            // Примечание: Убедитесь, что этот график и salesByHourChart расположены рядом в HTML с помощью CSS (например, Flexbox)
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
        } catch (error) {
            console.error('Error creating sales by day chart:', error);
        }
    },
    createSalesByEventChart(data) {
        const canvas = document.getElementById('salesByEventChart');
        if (!canvas) {
            console.error('Sales by event chart canvas not found');
            return;
        }
        if (!window.Chart) {
            console.error('Chart.js library is not loaded');
            return;
        }
        try {
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
        } catch (error) {
            console.error('Error creating sales by event chart:', error);
        }
    },
    createSalesByHourChart(data) {
        const canvas = document.getElementById('salesByHourChart');
        if (!canvas) {
            console.error('Sales by hour chart canvas not found');
            return;
        }
        if (!window.Chart) {
            console.error('Chart.js library is not loaded');
            return;
        }
        try {
            // Примечание: Убедитесь, что этот график и salesByDateChart расположены рядом в HTML с помощью CSS (например, Flexbox)
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
        } catch (error) {
            console.error('Error creating sales by hour chart:', error);
        }
    }
};

// Модуль управления
const AppModule = {
    isInitialized: false,
    currentEvent: null,
    async initialize() {
        if (this.isInitialized) {
            console.log('Ticket registry page already initialized');
            return;
        }
        this.isInitialized = true;
        console.log('Initializing ticket registry page');

        // Проверка зависимостей
        if (!window.Chart) console.warn('Chart.js is not loaded');
        if (!window.XLSX) console.warn('XLSX is not loaded');
        if (!window.jspdf || !window.jspdf.jsPDF) console.warn('jsPDF is not loaded');

        try {
            await DataModule.fetchTicketData();
            this.bindEvents();
            this.setDefaultFilters();
            this.updateTable();
            // Устанавливаем видимость основной страницы
            const mainPage = document.getElementById('mainPage');
            const dashboardPage = document.getElementById('dashboardPage');
            if (mainPage) {
                mainPage.style.display = 'block';
                console.log('mainPage style.display set to block');
            }
            if (dashboardPage) dashboardPage.style.display = 'none';
        } catch (error) {
            console.error('Initialization error:', error);
            alert('Ошибка инициализации страницы');
        }
    },
    bindEvents() {
        const elements = {
            newReportBtn: document.getElementById('newReportBtn'),
            showAllAnalyticsBtn: document.getElementById('showAllAnalyticsBtn'),
            exportExcelBtn: document.getElementById('exportExcelBtn'),
            toggleFiltersBtn: document.getElementById('toggleFiltersBtn'),
            searchInput: document.getElementById('searchInput'),
            eventFilter: document.getElementById('eventFilter'),
            dateFrom: document.getElementById('dateFrom'),
            dateTo: document.getElementById('dateTo'),
            pageSizeSelect: document.getElementById('pageSizeSelect'),
            backToMainBtn: document.getElementById('backToMainBtn')
        };

        if (elements.newReportBtn) elements.newReportBtn.addEventListener('click', () => this.handleFilter());
        if (elements.showAllAnalyticsBtn) elements.showAllAnalyticsBtn.addEventListener('click', () => {
            console.log('Show all analytics button clicked');
            let dateFrom = elements.dateFrom?.value;
            let dateTo = elements.dateTo?.value;
            if (!dateFrom || !dateTo) {
                const today = new Date('2025-06-20');
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFrom = weekAgo.toISOString().split('T')[0]; // 2025-06-13
                dateTo = today.toISOString().split('T')[0]; // 2025-06-20
                if (elements.dateFrom) elements.dateFrom.value = dateFrom;
                if (elements.dateTo) elements.dateTo.value = dateTo;
            }
            window.ticketRegistryShowDashboard(null, dateFrom, dateTo);
        });
        if (elements.exportExcelBtn) elements.exportExcelBtn.addEventListener('click', () => this.handleExport());
        if (elements.toggleFiltersBtn) elements.toggleFiltersBtn.addEventListener('click', () => this.toggleFilters());
        if (elements.searchInput) elements.searchInput.addEventListener('input', () => this.handleFilter());
        if (elements.eventFilter) elements.eventFilter.addEventListener('change', () => this.handleEventSelection());
        if (elements.dateFrom) elements.dateFrom.addEventListener('change', () => this.handleFilter());
        if (elements.dateTo) elements.dateTo.addEventListener('change', () => this.handleFilter());
        if (elements.pageSizeSelect) {
            elements.pageSizeSelect.addEventListener('change', () => {
                console.log('pageSizeSelect changed to:', elements.pageSizeSelect.value);
                this.handleRowsPerPage();
            });
        }
        if (elements.backToMainBtn) elements.backToMainBtn.addEventListener('click', () => window.ticketRegistryBackToMain());

        Object.entries(elements).forEach(([key, el]) => {
            if (!el) console.warn(`Element ${key} not found`);
        });
    },
    setDefaultFilters() {
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (dateFrom && dateTo) {
            const today = new Date('2025-06-20');
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFrom.value = weekAgo.toISOString().split('T')[0]; // 2025-06-13
            dateTo.value = today.toISOString().split('T')[0]; // 2025-06-20
            this.handleFilter();
        }
        if (pageSizeSelect) {
            pageSizeSelect.value = DataModule.rowsPerPage.toString();
            console.log('Default rows per page set to:', DataModule.rowsPerPage);
        } else {
            console.warn('pageSizeSelect not found, cannot set default value');
        }
    },
    handleFilter() {
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';
        const searchTerm = document.getElementById('searchInput')?.value || '';
        const event = document.getElementById('eventFilter')?.value || '';
        if (dateTo && dateFrom && dateTo < dateFrom) {
            alert('Дата "по" должна быть не раньше даты "с"');
            return;
        }
        DataModule.filterData({ dateFrom, dateTo, searchTerm, event });
        this.updateTable();
    },
    toggleFilters() {
        const additionalFilters = document.getElementById('additionalFilters');
        const toggleButton = document.getElementById('toggleFiltersBtn');
        if (!additionalFilters || !toggleButton) {
            console.warn('Filter toggle elements not found');
            return;
        }
        const isVisible = additionalFilters.style.display !== 'none';
        additionalFilters.style.display = isVisible ? 'none' : 'block';
        toggleButton.textContent = isVisible ? 'Дополнительные фильтры' : 'Скрыть фильтры';
    },
    handleEventSelection() {
        console.log('handleEventSelection called');
        const selectedEvent = document.getElementById('eventFilter')?.value;
        this.handleFilter();
        if (selectedEvent) {
            const dateFrom = document.getElementById('dateFrom')?.value || '';
            window.ticketRegistryShowDashboard(selectedEvent, dateFrom);
        }
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
        const exportBtn = document.getElementById('exportExcelBtn');
        if (!exportBtn) {
            console.error('Export button not found');
            return;
        }
        const originalText = exportBtn.textContent;
        exportBtn.textContent = 'Экспортируется...';
        exportBtn.disabled = true;

        try {
            if (!window.XLSX) throw new Error('XLSX библиотека не загружена');
            if (!DataModule.filteredData.length) throw new Error('Нет данных для экспорта');
            const table = document.getElementById('ticketTable').closest('table');
            if (!table) throw new Error('Таблица не найдена');
            const wb = XLSX.utils.table_to_book(table, { sheet: "Реестр билетов" });
            XLSX.writeFile(wb, `Реестр_билетов_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`);
            console.log('Excel export completed');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert(`Ошибка при экспорте в Excel: ${error.message}`);
        } finally {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }
    },
    updateTable() {
        RenderModule.renderTicketTable(DataModule.getPagedData());
        RenderModule.renderPagination();
    }
};

// Глобальные функции
window.ticketRegistryShowDashboard = function(eventName, rowDate) {
    console.log('Showing dashboard for:', { eventName: eventName || 'all events', rowDate });
    AppModule.currentEvent = eventName;
    const isSingleEvent = !!eventName;

    const eventFilter = document.getElementById('eventFilter');
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');

    if (eventFilter) eventFilter.value = eventName || '';
    let dateFrom = dateFromInput ? dateFromInput.value : '';
    let dateTo = dateToInput ? dateToInput.value : '';

    if (isSingleEvent && rowDate) {
        dateFrom = rowDate;
        dateTo = rowDate;
        if (dateFromInput) dateFromInput.value = rowDate;
        if (dateToInput) dateToInput.value = rowDate;
    }

    try {
        DataModule.filterData({ dateFrom, dateTo, event: eventName });
        const data = DataModule.filteredData;

        if (!data.length) {
            console.warn('No data available for dashboard');
            alert('Нет данных для отображения на дашборде');
            return;
        }

        const mainPage = document.getElementById('mainPage');
        const dashboardPage = document.getElementById('dashboardPage');
        const generalAnalytics = document.getElementById('generalAnalytics');

        if (mainPage) mainPage.style.display = 'none';
        if (dashboardPage) dashboardPage.style.display = 'block';
        if (generalAnalytics) generalAnalytics.style.display = isSingleEvent ? 'none' : 'block';

        RenderModule.updateDashboardSubtitle(eventName, dateFrom, dateTo);
        RenderModule.updateStatsCards(data, isSingleEvent);
        ChartModule.destroyCharts();
        ChartModule.createSalesTypesChart(data);
        ChartModule.createSalesByChannelChart(data);
        ChartModule.createSalesByDayChart(data);
        ChartModule.createSalesByHourChart(data);
        RenderModule.renderTopDays(data);

        if (!isSingleEvent) {
            ChartModule.createSalesByEventChart(data);
        }
        console.log('Dashboard rendered successfully');
    } catch (error) {
        console.error('Error showing dashboard:', error);
        alert('Ошибка при отображении дашборда');
    }
};

window.ticketRegistryBackToMain = function() {
    console.log('Returning to main page');
    AppModule.currentEvent = null;
    const mainPage = document.getElementById('mainPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const generalAnalytics = document.getElementById('generalAnalytics');

    if (dashboardPage) dashboardPage.style.display = 'none';
    if (mainPage) mainPage.style.display = 'block';
    if (generalAnalytics) generalAnalytics.style.display = 'none';
    const eventFilter = document.getElementById('eventFilter');
    if (eventFilter) eventFilter.value = '';
    AppModule.handleFilter();
    ChartModule.destroyCharts();
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ticket registry page');
    AppModule.initialize();
});
