console.log('sales-dashboard.js loaded at:', new Date().toISOString());
// Мок-данные
function generateMockSalesData(count) {
    const events = ['Взрослый билет (Гражданин РК)', 'Абонемент (Акимат)', 'Абонемент (Комиссия)', 'Дети школьного возраста', 'Пенсионеры', 'Студент', 'Экскурсия для детей',
        'Экскурсия на английском языке', 'Экскурсия на казахском и русском языке', 'Сервис аудиогида', 'Иностранным гражданам стран СНГ', 'Иностранным гражданам иных государств'];
    const objects = ['Мавзолей Ходжи Ахмеда Ясави', 'Мавзолей Айша-Биби', 'Мавзолей Карахан', 'Музей-заповедник Отырар', 'Мавзолей Арыстан Баб'];
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
            event: events[Math.floor(Math.random() * events.length)],
            object: objects[Math.floor(Math.random() * objects.length)]
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
        if (!topDays || topDays.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-2">Нет данных</td></tr>';
            return;
        }
        // Защита: убедимся, что даты и суммы валидны, отсортируем по сумме
        const sorted = topDays
            .map(d => ({ date: d.date, sales: Number(d.sales) || 0, transactions: Number(d.transactions) || 0 }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
        tbody.innerHTML = sorted.map(day => `
            <tr>
                <td>${this.formatDate(day.date)}</td>
                <td>${this.formatAmount(day.sales)}</td>
                <td>${day.transactions}</td>
            </tr>
        `).join('');
    },
    updateDashboardSubtitle(eventName, objectName, dateFrom, dateTo) {
        // if subtitle inputs exist — update them and the visible text
        const subtitleTextEl = document.getElementById('subtitleText');
        const dateFromEl = document.getElementById('dateFrom');
        const dateToEl = document.getElementById('dateTo');

        // подпись: если выбран объект — указываем его, иначе "Сводная аналитика" или событие
        let title = 'Сводная аналитика';
        if (objectName) title = objectName;
        if (eventName) title = eventName;

        if (subtitleTextEl) subtitleTextEl.textContent = title;

        // установить значения полей даты (если переданы)
        if (dateFromEl) dateFromEl.value = dateFrom || '';
        if (dateToEl) dateToEl.value = dateTo || '';
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

        // уничтожаем предыдущую инстанцию, если есть
        if (this.charts.salesTypesChart) {
            try { this.charts.salesTypesChart.destroy(); } catch (e) { /* ignore */ }
            this.charts.salesTypesChart = null;
        }

        const totals = DataModule.aggregateTotals(data).byType;
        const channels = {
            'Касса (QR/карта)': totals.qrCard,
            'Касса (наличные)': totals.cash,
            'Киоск': totals.kiosk,
            'KassaPay.kz (KaspiQR)': totals.muzaidynyKaspi,
            'KassaPay.kz (Карта)': totals.muzaidynyCard,
            'Kaspi платежи': totals.kaspi
        };

        const labels = Object.keys(channels);
        const values = Object.values(channels).map(v => Number(v) || 0);
        const totalSum = values.reduce((s, v) => s + v, 0);

        // если все значения нулевые — показываем fallback "Нет данных"
        const finalLabels = totalSum === 0 ? ['Нет данных'] : labels;
        const finalValues = totalSum === 0 ? [1] : values;
        const background = totalSum === 0
            ? ['#cbd5e1'] // серый для "Нет данных"
            : ['#ef4444', '#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899'];

        this.charts.salesTypesChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: finalLabels,
                datasets: [{
                    data: finalValues,
                    backgroundColor: background,
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

        // агрегируем суммы по объектам из переданных данных
        const byObject = {};
        data.forEach(sale => {
            const obj = sale.object || 'Неизвестно';
            byObject[obj] = (byObject[obj] || 0) + (sale.saleAmount || 0);
        });

        // получить выбранный объект из дропдауна; если 'all' — показываем все объекты
        const objectSelect = document.getElementById('objectSelect');
        const selected = objectSelect ? objectSelect.value : 'all';

        let labels = Object.keys(byObject);
        let values = labels.map(l => byObject[l]);

        if (selected && selected !== 'all') {
            // показываем только выбранный объект (если данных нет — 0)
            labels = [selected];
            values = [byObject[selected] || 0];
        }

        // уничтожаем предыдущий график в этом слоте, если есть
        this.charts.salesByObjectChart?.destroy();

        this.charts.salesByObjectChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Продажи (₸)',
                    data: values,
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
                },
                plugins: { legend: { display: false } }
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
        if (!canvas) {
            console.warn('salesByEventChart canvas not found');
            return;
        }
        const ctx = canvas.getContext('2d');

        // уничтожаем предыдущую инстанцию, если есть
        if (this.charts.salesByEventChart) {
            try { this.charts.salesByEventChart.destroy(); } catch (e) { /* ignore */ }
            this.charts.salesByEventChart = null;
        }

        // агрегируем по видам услуг
        const eventsObj = DataModule.aggregateByEvent(data || []);
        let labels = Object.keys(eventsObj || {});
        let values = labels.map(k => {
            const v = eventsObj[k] && eventsObj[k].totalSales ? Number(eventsObj[k].totalSales) : 0;
            return isNaN(v) ? 0 : v;
        });

        // общий суммарный показатель
        const totalSum = values.reduce((s, v) => s + v, 0);

        // безопасный fallback — если нет данных или сумма = 0, показываем "Нет данных" с ненулевым значением
        if (labels.length === 0 || totalSum === 0) {
            labels = ['Нет данных'];
            values = [1];
            var bg = ['#cbd5e1'];
            var border = '#fff';
        } else {
            var bg = '#6366f1';
            var border = '#4f46e5';
        }

        this.charts.salesByEventChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Сумма продаж (₸)',
                    data: values,
                    backgroundColor: Array.isArray(bg) ? bg : labels.map(() => bg),
                    borderColor: Array.isArray(border) ? border : labels.map(() => border),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: value => RenderModule.formatAmount(value) }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    },

    // Новый: обзор по билетам (pie) — с maintainAspectRatio=false и защита высоты контейнера
    createTicketsOverviewChart() {
        const canvas = document.getElementById('ticketsOverviewChart');
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (parent) parent.style.minHeight = '280px';
        const ctx = canvas.getContext('2d');

        if (this.charts.ticketsOverviewChart) {
            try { this.charts.ticketsOverviewChart.destroy(); } catch (e) { /* ignore */ }
            this.charts.ticketsOverviewChart = null;
        }

        const totals = TicketModule.getTotals();
        const data = [totals.activated, totals.notActivated];
        const labels = ['Активированные', 'Не активированные'];
        const colors = ['#6366f1', '#f59e0b'];

        this.charts.ticketsOverviewChart = new Chart(ctx, {
            type: 'pie',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#fff', borderWidth: 2 }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                const val = context.parsed || 0;
                                const total = data.reduce((s, v) => s + v, 0) || 1;
                                const perc = ((val / total) * 100).toFixed(1);
                                return `${context.label}: ${val} (${perc}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Новый: распределение по категориям (stacked bar) — защита высоты контейнера
    createTicketsByCategoryChart() {
        const canvas = document.getElementById('ticketsByCategoryChart');
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (parent) parent.style.minHeight = '360px';
        const ctx = canvas.getContext('2d');

        if (this.charts.ticketsByCategoryChart) {
            try { this.charts.ticketsByCategoryChart.destroy(); } catch (e) { /* ignore */ }
            this.charts.ticketsByCategoryChart = null;
        }

        const { labels, activated, notActivated, unsold } = TicketModule.getCategoryArrays();

        this.charts.ticketsByCategoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Активированные', data: activated, backgroundColor: '#6366f1' },
                    { label: 'Не активированные', data: notActivated, backgroundColor: '#f59e0b' },
                    // { label: 'Не проданные', data: unsold, backgroundColor: '#ef4444' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
};

// Модуль управления
const AppModule = {
    isInitialized: false,
    currentEvent: null,
    currentObject: null,
    async initialize() {
        if (this.isInitialized) {
            console.log('Sales report page already initialized');
            return;
        }
        this.isInitialized = true;
        console.log('Initializing sales report page');
        // сначала загрузим данные
        await DataModule.fetchSalesData();
        // убедимся, что фильтр по умолчанию применён ко всем данным
        DataModule.filterData({ dateFrom: '', dateTo: '' });
        this.bindEvents();
        this.setDefaultFilters();
        // показать дашборд и таблицу уже с загруженными данными (все объекты по умолчанию)
        window.salesReportShowDashboard(null);
        this.updateTable();
    },
    bindEvents() {
        document.getElementById('newReportBtn')?.addEventListener('click', this.handleFilter);
        document.getElementById('exportExcelBtn')?.addEventListener('click', this.handleExport);
        document.getElementById('showAllAnalyticsBtn')?.addEventListener('click', this.handleShowAllAnalytics);
        document.getElementById('objectSelect')?.addEventListener('change', () => this.handleObjectChange());
        // слушатели для выбора периода в subtitle
        document.getElementById('dateFrom')?.addEventListener('change', () => this.handleFilter());
        document.getElementById('dateTo')?.addEventListener('change', () => this.handleFilter());
        document.getElementById('applyPeriodBtn')?.addEventListener('click', () => this.handleFilter());
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', () => this.handleRowsPerPage());
        } else {
            console.warn('pageSizeSelect not found, cannot bind event');
        }
    },
    handleObjectChange() {
        const sel = document.getElementById('objectSelect');
        if (!sel) return;
        const val = sel.value === 'all' ? null : sel.value;
        this.currentObject = val;
        console.log('Selected object:', val || 'all');
        // show dashboard for selected object (overrides event filter)
        window.salesReportShowDashboard();
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
    const selectedObject = AppModule.currentObject;
    console.log('Showing dashboard for:', { eventName: eventName || 'all events', selectedObject, rowDate, analyticsDateTo });
    AppModule.currentEvent = eventName;
    const isSingleEvent = !!eventName && !selectedObject;
    // if object is selected, show data for that object, otherwise if eventName passed use event filter, else show all filtered data
    let data;
    if (selectedObject) {
        data = DataModule.filteredData.filter(s => s.object === selectedObject);
    } else if (isSingleEvent) {
        data = DataModule.filteredData.filter(s => s.event === eventName);
    } else {
        data = DataModule.filteredData;
    }

    const mainPage = document.getElementById('mainPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const generalAnalytics = document.getElementById('generalAnalytics');
    const returnsByChannelContainer = document.getElementById('returnsByChannelContainer');

    if (mainPage) mainPage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'block';
    if (generalAnalytics) generalAnalytics.style.display = isSingleEvent ? 'none' : 'block';
    if (returnsByChannelContainer) returnsByChannelContainer.style.display = (selectedObject || isSingleEvent) ? 'block' : 'none';

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

    RenderModule.updateDashboardSubtitle(eventName, selectedObject, dateFrom, dateTo);
    RenderModule.updateStatsCards(data, isSingleEvent);
    ChartModule.destroyCharts();
    ChartModule.createSalesTypesChart(data);
    ChartModule.createSalesByChannelChart(data);
    ChartModule.createSalesByObjectChart(data);
    ChartModule.createSalesByDayChart(data);
    ChartModule.createSalesByHourChart(data);
    RenderModule.renderTopDays(data);

    // показываем разбивку возвратов для выбранного объекта или для одиночного события
    if (selectedObject || isSingleEvent) {
        ChartModule.createReturnsByChannelChart(data);
        // также отображаем "Продажи по видам услуг" внутри выбранного объекта (если есть несколько событий)
        ChartModule.createSalesByEventChart(data);
    } else {
        // если показаны все объекты — отображаем сводную диаграмму по видам услуг
        ChartModule.createSalesByEventChart(data);
    }

    // Новые чарты по билетам
    ChartModule.createTicketsOverviewChart();
    ChartModule.createTicketsByCategoryChart();
};

const TicketModule = {
    totalTickets: 2000,
    categories: {
        'Взрослый билет (Гражданин РК)': { total: 600, activated: 450, notActivated: 120, unsold: 30 },
        'Абонемент (Акимат)': { total: 150, activated: 100, notActivated: 40, unsold: 10 },
        'Абонемент (Комиссия)': { total: 100, activated: 70, notActivated: 25, unsold: 5 },
        'Дети школьного возраста': { total: 250, activated: 180, notActivated: 60, unsold: 10 },
        'Пенсионеры': { total: 100, activated: 70, notActivated: 25, unsold: 5 },
        'Студент': { total: 200, activated: 150, notActivated: 40, unsold: 10 },
        'Экскурсия для детей': { total: 80, activated: 60, notActivated: 18, unsold: 2 },
        'Экскурсия на английском языке': { total: 70, activated: 50, notActivated: 18, unsold: 2 },
        'Экскурсия на казахском и русском языке': { total: 120, activated: 90, notActivated: 25, unsold: 5 },
        'Сервис аудиогида': { total: 50, activated: 30, notActivated: 18, unsold: 2 },
        'Иностранным гражданам стран СНГ': { total: 200, activated: 140, notActivated: 50, unsold: 10 },
        'Иностранным гражданам иных государств': { total: 80, activated: 60, notActivated: 18, unsold: 2 }
    },
    getTotals() {
        const totals = { activated: 0, notActivated: 0, unsold: 0, total: 0 };
        Object.values(this.categories).forEach(c => {
            totals.activated += c.activated || 0;
            totals.notActivated += c.notActivated || 0;
            totals.unsold += c.unsold || 0;
            totals.total += c.total || 0;
        });
        if (this.totalTickets && totals.total !== this.totalTickets) {
            totals.total = this.totalTickets;
        }
        return totals;
    },
    getCategoryArrays() {
        const labels = Object.keys(this.categories);
        const activated = [], notActivated = [], unsold = [];
        labels.forEach(lbl => {
            const c = this.categories[lbl] || {};
            activated.push(c.activated || 0);
            notActivated.push(c.notActivated || 0);
            unsold.push(c.unsold || 0);
        });
        return { labels, activated, notActivated, unsold };
    }
};

window.salesReportBackToMain = function () {
    console.log('Returning to main page');
    AppModule.currentEvent = null;
    AppModule.currentObject = null;
    const mainPage = document.getElementById('mainPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const generalAnalytics = document.getElementById('generalAnalytics');
    const returnsByChannelContainer = document.getElementById('returnsByChannelContainer');

    if (dashboardPage) dashboardPage.style.display = 'none';
    if (mainPage) mainPage.style.display = 'block';
    if (generalAnalytics) generalAnalytics.style.display = 'none';
    if (returnsByChannelContainer) returnsByChannelContainer.style.display = 'none';
    const sel = document.getElementById('objectSelect');
    if (sel) sel.value = 'all';
    ChartModule.destroyCharts();
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing sales report page');
    AppModule.initialize();
});