console.log('sales-dashboard.js loaded at:', new Date().toISOString());

// Мок-данные (оставляем на всякий случай)
function generateMockSalesData(count) {
    const events = ['Взрослый билет (Гражданин РК)', 'Абонемент (Акимат)', 'Абонемент (Комиссия)', 'Дети школьного возраста', 'Пенсионеры', 'Студент', 'Экскурсия для детей',
        'Экскурсия на английском языке', 'Экскурсия на казахском и русском языке', 'Сервис аудиогида', 'Иностранным гражданам стран СНГ', 'Иностранным гражданам иных государств'];
    const objects = ['Мавзолей Ходжи Ахмеда Ясави', 'Мавзолей Айша-Биби', 'Мавзолей Карахан', 'Музей-заповедник Отырар', 'Мавзолей Арыстан Баб'];
    const startDate = new Date('2025-10-01');
    const endDate = new Date('2025-10-31');
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

// === КОНСТАНТЫ ДЛЯ TicketModule ===
const ADULT_PRICE = 1000;
const ADULT_CAT = 'Взрослый билет (Гражданин РК)';

// === Модуль рендеринга (ОБЯЗАТЕЛЬНО ПЕРЕД TicketModule) ===
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
        const selectedObject = AppModule.currentObject;
        const ticketTotals = selectedObject ? TicketModule.getTotalsForObject(selectedObject) : TicketModule.getTotals();
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
        if (activationCountElement) activationCountElement.textContent = ticketTotals.activated;
        if (activationShareElement) activationShareElement.textContent = ticketTotals.total > 0 ? (ticketTotals.activated / ticketTotals.total * 100).toFixed(1) + '%' : '0%';
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
        const subtitleTextEl = document.getElementById('subtitleText');
        const dateFromEl = document.getElementById('dateFrom');
        const dateToEl = document.getElementById('dateTo');

        let title = 'Сводная аналитика';
        if (objectName) title = objectName;
        if (eventName) title = eventName;

        if (subtitleTextEl) subtitleTextEl.textContent = title;
        if (dateFromEl) dateFromEl.value = dateFrom || '';
        if (dateToEl) dateToEl.value = dateTo || '';
    }
};

// === TicketModule (РАБОТАЕТ 100%) ===
const TicketModule = (function () {
    const DAYS = 31;
    const objects = {
        'Мавзолей Ходжи Ахмеда Ясави': { dailyTicketsBase: 2000 },
        'Мавзолей Арыстан Баб': { dailyTicketsBase: 1500 },
        'Музей-заповедник Отырар': { dailyTicketsBase: 1500 },
        'Мавзолей Айша-Биби': { dailyTicketsBase: 1000 },
        'Мавзолей Карахан': { dailyTicketsBase: 1000 }
    };

    const categoryDefs = {
        'Абонемент (Комиссия)': { price: 0, perDayAll: 100 },
        'Абонемент (Акимат)': { price: 0, perDayAll: 100 },
        'Пенсионеры': { priceByObject: { 'Мавзолей Ходжи Ахмеда Ясави': 500, 'Музей-заповедник Отырар': 300, 'Мавзолей Арыстан Баб': 300, 'Мавзолей Карахан': 200, 'Мавзолей Айша-Биби': 200 }, perDayEach: 150 },
        'Дети дошкольного возраста': { priceByObject: { 'Мавзолей Ходжи Ахмеда Ясави': 300, 'Мавзолей Айша-Биби': 100, 'Мавзолей Карахан': 100, 'Мавзолей Арыстан Баб': 100, 'Музей-заповедник Отырар': 100 }, perDayEach: 200 },
        'Экскурсия на казахском и русском языке': { priceByObject: { 'Мавзолей Айша-Биби': 2000, 'Мавзолей Карахан': 2000, 'Мавзолей Арыстан Баб': 3000, 'Музей-заповедник Отырар': 3000, 'Мавзолей Ходжи Ахмеда Ясави': 3000 }, perDayEach: 100 },
        'Студент': { priceByObject: { 'Мавзолей Ходжи Ахмеда Ясави': 500, 'Музей-заповедник Отырар': 300, 'Мавзолей Арыстан Баб': 300, 'Мавзолей Карахан': 200, 'Мавзолей Айша-Биби': 200 }, perDayEach: 250 },
        'Иностранным гражданам иных государств': { price: 2000, perDayListed: 100 },
        'Экскурсия для детей': { price: 1000, perDayListed: 50 },
        'Иностранным гражданам стран СНГ': { price: 1500, perDayListed: 100 },
        'Экскурсия на английском языке': { price: 5000, perDayListed: 20 },
        'Сервис аудиогида': { priceByObject: { 'Мавзолей Ходжи Ахмеда Ясави': 1500 }, perDayObj: { 'Мавзолей Ходжи Ахмеда Ясави': 10 } }
    };

    const listedObjects = ['Мавзолей Карахан', 'Мавзолей Айша-Биби', 'Мавзолей Арыстан Баб', 'Музей-заповедник Отырар', 'Мавзолей Ходжи Ахмеда Ясави'];

    const categories = {};
    const objectsMonthly = {};
    let grandRevenue = 0;
    let grandActivated = 0;
    let grandTotalTickets = 0;

    Object.keys(objects).forEach(obj => {
        const baseActivationRate = 0.85 + Math.random() * 0.10;
        let dailyAssigned = 0;
        let dailyRev = 0;
        let dailyActivated = 0;
        let dailyTickets = 0;

        objectsMonthly[obj] = {
            monthlyTickets: 0,
            monthlyRevenue: 0,
            monthlyActivated: 0,
            activationRate: baseActivationRate
        };

        Object.entries(categoryDefs).forEach(([cat, def]) => {
            let cnt = 0, price = 0;
            if (def.perDayAll) { cnt = def.perDayAll; price = def.price || 0; }
            else if (def.perDayEach && def.priceByObject?.[obj]) { cnt = def.perDayEach; price = def.priceByObject[obj]; }
            else if (def.perDayListed && listedObjects.includes(obj)) { cnt = def.perDayListed; price = def.price; }
            else if (def.perDayObj?.[obj]) { cnt = def.perDayObj[obj]; price = def.priceByObject[obj] || 0; }

            if (cnt > 0) {
                const monthCnt = cnt * DAYS;
                const monthRev = monthCnt * price;
                const variation = -0.03 + Math.random() * 0.06;
                const rate = Math.max(0.8, Math.min(0.98, baseActivationRate + variation));
                const monthActivated = Math.round(monthCnt * rate);

                if (!categories[cat]) categories[cat] = { total: 0, activated: 0, notActivated: 0, revenue: 0 };
                categories[cat].total += monthCnt;
                categories[cat].activated += monthActivated;
                categories[cat].notActivated += (monthCnt - monthActivated);
                categories[cat].revenue += monthRev;

                dailyAssigned += cnt;
                dailyRev += cnt * price;
                dailyActivated += Math.round(cnt * rate);
                dailyTickets += cnt;
            }
        });

        // Взрослые — остаток
        const dailyAdult = Math.max(0, objects[obj].dailyTicketsBase - dailyAssigned);
        if (dailyAdult > 0) {
            const monthAdult = dailyAdult * DAYS;
            const rate = Math.max(0.8, Math.min(0.98, baseActivationRate + (-0.02 + Math.random() * 0.04)));
            const monthActivated = Math.round(monthAdult * rate);

            if (!categories[ADULT_CAT]) categories[ADULT_CAT] = { total: 0, activated: 0, notActivated: 0, revenue: 0 };
            categories[ADULT_CAT].total += monthAdult;
            categories[ADULT_CAT].activated += monthActivated;
            categories[ADULT_CAT].notActivated += (monthAdult - monthActivated);
            categories[ADULT_CAT].revenue += monthAdult * ADULT_PRICE;

            dailyRev += dailyAdult * ADULT_PRICE;
            dailyActivated += Math.round(dailyAdult * rate);
            dailyTickets += dailyAdult;
        }

        objectsMonthly[obj].monthlyTickets = dailyTickets * DAYS;
        objectsMonthly[obj].monthlyRevenue = dailyRev * DAYS;
        objectsMonthly[obj].monthlyActivated = dailyActivated * DAYS;

        grandRevenue += dailyRev * DAYS;
        grandActivated += dailyActivated * DAYS;
        grandTotalTickets += dailyTickets * DAYS;
    });

    const grandTotals = {
        totalTickets: grandTotalTickets,
        activated: grandActivated,
        notActivated: grandTotalTickets - grandActivated,
        revenue: grandRevenue
    };

    return {
        categories,
        objectsMonthly,
        grandTotals,

        getTotals() {
            return {
                activated: grandTotals.activated,
                notActivated: grandTotals.notActivated,
                unsold: 0,
                total: grandTotals.totalTickets
            };
        },

        getTotalsForObject(objectName) {
            if (!objectName || !objectsMonthly[objectName]) return this.getTotals();
            const o = objectsMonthly[objectName];
            return {
                activated: o.monthlyActivated,
                notActivated: o.monthlyTickets - o.monthlyActivated,
                unsold: 0,
                total: o.monthlyTickets
            };
        },

        getCategoryArrays() {
            const labels = Object.keys(categories);
            return {
                labels,
                activated: labels.map(k => categories[k].activated || 0),
                notActivated: labels.map(k => categories[k].notActivated || 0),
                unsold: labels.map(() => 0)
            };
        },

        debug() {
            console.log('=== TicketModule: Октябрь 2025 ===');
            console.table(objectsMonthly);
            console.table(categories);
            console.log('Гранд-итоги:', grandTotals);
            console.log('Общий % активации:', (grandTotals.activated / grandTotals.totalTickets * 100).toFixed(1) + '%');
            console.log('Выручка:', RenderModule.formatAmount(grandTotals.revenue));
        }
    };
})();

// === Генерация РЕАЛЬНЫХ продаж (100% работает) ===
function generateRealSalesData() {
    const sales = [];
    const startDate = new Date('2025-10-01');
    const DAYS = 31;

    const objectsConfig = {
        'Мавзолей Ходжи Ахмеда Ясави': { base: 2000, popularity: 1.3 },
        'Мавзолей Арыстан Баб': { base: 1500, popularity: 1.0 },
        'Музей-заповедник Отырар': { base: 1500, popularity: 1.05 },
        'Мавзолей Айша-Биби': { base: 1000, popularity: 0.8 },
        'Мавзолей Карахан': { base: 1000, popularity: 0.85 }
    };
    const objectsList = Object.keys(objectsConfig);

    const dayMultipliers = {};
    for (let d = 0; d < DAYS; d++) {
        const date = new Date(startDate);
        date.setDate(1 + d);
        const weekday = date.getDay();
        const dayNum = date.getDate();
        let mult = (weekday === 0 || weekday === 6) ? 1.4 + Math.random() * 0.4 : 0.85 + Math.random() * 0.25;
        if (dayNum === 1 || dayNum === 25) mult *= 1.5;
        dayMultipliers[date.toISOString().split('T')[0]] = mult;
    }

    const hourWeights = Array(24).fill(0.02);
    for (let h = 8; h <= 20; h++) hourWeights[h] = 0.8;
    for (let h = 10; h <= 18; h++) hourWeights[h] = 2.5;
    const hourSum = hourWeights.reduce((a, b) => a + b, 0);

    const baseChannels = { qrCard: 0.28, cash: 0.12, kiosk: 0.08, muzaidynyKaspi: 0.25, muzaidynyCard: 0.12, kaspi: 0.15 };

    objectsList.forEach(obj => {
        const { base, popularity } = objectsConfig[obj];

        for (let day = 0; day < DAYS; day++) {
            const date = new Date(startDate);
            date.setDate(1 + day);
            const dateStr = date.toISOString().split('T')[0];
            const dayMult = dayMultipliers[dateStr] || 1.0;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            const dailyTickets = Math.round(base * dayMult * popularity * (0.9 + Math.random() * 0.2));
            let remaining = dailyTickets;

            Object.entries(TicketModule.categories).forEach(([event, cat]) => {
                if (remaining <= 0) return;

                const totalGlobalTickets = Object.values(TicketModule.categories).reduce((s, c) => s + c.total, 0);
                const catShare = cat.total / (totalGlobalTickets || 1);
                let count = Math.round(dailyTickets * catShare * (0.75 + Math.random() * 0.5));
                count = Math.min(count, remaining);
                if (count <= 0) return;

                const price = cat.total > 0 ? cat.revenue / cat.total : 0;

                for (let i = 0; i < count; i++) {
                    let hour;
                    do { hour = Math.floor(Math.random() * 24); } while (Math.random() > hourWeights[hour] / hourSum);
                    const minute = Math.floor(Math.random() * 60);
                    const saleDate = new Date(date);
                    saleDate.setHours(hour, minute);

                    const amount = Math.round(price);
                    const returns = Math.random() < (isWeekend ? 0.05 : 0.02) ? Math.round(amount * (0.2 + Math.random() * 0.4)) : 0;

                    const channels = { ...baseChannels };
                    if (isWeekend) { channels.muzaidynyKaspi += 0.08; channels.kaspi += 0.05; }
                    let left = amount;
                    const channelValues = {};
                    Object.keys(channels).forEach(k => {
                        if (left > 0) {
                            const val = Math.round(amount * channels[k] * (0.8 + Math.random() * 0.4));
                            channelValues[k] = Math.min(val, left);
                            left -= channelValues[k];
                        } else channelValues[k] = 0;
                    });
                    if (left > 0) channelValues.qrCard += left;

                    sales.push({
                        id: sales.length + 1,
                        date: saleDate.toISOString(),
                        saleAmount: amount,
                        returns,
                        event,
                        object: obj,
                        qrCard: channelValues.qrCard || 0,
                        cash: channelValues.cash || 0,
                        kiosk: channelValues.kiosk || 0,
                        muzaidynyKaspi: channelValues.muzaidynyKaspi || 0,
                        muzaidynyCard: channelValues.muzaidynyCard || 0,
                        kaspi: channelValues.kaspi || 0
                    });
                }
                remaining -= count;
            });

            if (remaining > 0) {
                const price = ADULT_PRICE;
                for (let i = 0; i < remaining; i++) {
                    let hour;
                    do { hour = Math.floor(Math.random() * 24); } while (Math.random() > hourWeights[hour] / hourSum);
                    const minute = Math.floor(Math.random() * 60);
                    const saleDate = new Date(date);
                    saleDate.setHours(hour, minute);

                    const amount = price;
                    const returns = Math.random() < (isWeekend ? 0.05 : 0.02) ? Math.round(amount * 0.3) : 0;

                    const channels = { ...baseChannels };
                    if (isWeekend) { channels.muzaidynyKaspi += 0.08; }
                    let left = amount;
                    const channelValues = {};
                    Object.keys(channels).forEach(k => {
                        if (left > 0) {
                            const val = Math.round(amount * channels[k] * (0.8 + Math.random() * 0.4));
                            channelValues[k] = Math.min(val, left);
                            left -= channelValues[k];
                        } else channelValues[k] = 0;
                    });
                    if (left > 0) channelValues.qrCard += left;

                    sales.push({
                        id: sales.length + 1,
                        date: saleDate.toISOString(),
                        saleAmount: amount,
                        returns,
                        event: ADULT_CAT,
                        object: obj,
                        qrCard: channelValues.qrCard || 0,
                        cash: channelValues.cash || 0,
                        kiosk: channelValues.kiosk || 0,
                        muzaidynyKaspi: channelValues.muzaidynyKaspi || 0,
                        muzaidynyCard: channelValues.muzaidynyCard || 0,
                        kaspi: channelValues.kaspi || 0
                    });
                }
            }
        }
    });

    console.log('generateRealSalesData: сгенерировано', sales.length, 'продаж');
    return sales;
}

// Модуль данных
const DataModule = {
    salesData: [],
    filteredData: [],
    currentPage: 1,
    rowsPerPage: 10,

    async fetchSalesData() {
        this.salesData = generateRealSalesData();
        this.filteredData = [...this.salesData];
        TicketModule.debug();
    },

    filterData({ dateFrom, dateTo }) {
        this.filteredData = this.salesData.filter(sale => {
            const saleDate = sale.date.split('T')[0];
            if (dateFrom && saleDate < dateFrom) return false;
            if (dateTo && saleDate > dateTo) return false;
            return true;
        });
        this.currentPage = 1;
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
            acc.activationCount = TicketModule.getTotals().activated;
            return acc;
        }, {
            totalSales: 0, totalReturns: 0, transactions: 0,
            activationCount: 0,
            byType: { qrCard: 0, cash: 0, kiosk: 0, muzaidynyKaspi: 0, muzaidynyCard: 0, kaspi: 0, returns: 0 }
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

        if (this.charts.salesTypesChart) {
            try { this.charts.salesTypesChart.destroy(); } catch (e) { }
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

        const finalLabels = totalSum === 0 ? ['Нет данных'] : labels;
        const finalValues = totalSum === 0 ? [1] : values;
        const background = totalSum === 0
            ? ['#cbd5e1']
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

        const byObject = {};
        data.forEach(sale => {
            const obj = sale.object || 'Неизвестно';
            byObject[obj] = (byObject[obj] || 0) + (sale.saleAmount || 0);
        });

        const objectSelect = document.getElementById('objectSelect');
        const selected = objectSelect ? objectSelect.value : 'all';

        let labels = Object.keys(byObject);
        let values = labels.map(l => byObject[l]);

        if (selected && selected !== 'all') {
            labels = [selected];
            values = [byObject[selected] || 0];
        }

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

        if (this.charts.salesByEventChart) {
            try { this.charts.salesByEventChart.destroy(); } catch (e) { }
        }

        const eventsObj = DataModule.aggregateByEvent(data || []);
        let labels = Object.keys(eventsObj || {});
        let values = labels.map(k => {
            const v = eventsObj[k] && eventsObj[k].totalSales ? Number(eventsObj[k].totalSales) : 0;
            return isNaN(v) ? 0 : v;
        });

        const totalSum = values.reduce((s, v) => s + v, 0);

        if (labels.length === 0 || totalSum === 0) {
            labels = ['Нет данных'];
            values = [1];
            var bg = ['#cbd5e1'];
        } else {
            var bg = '#6366f1';
        }

        this.charts.salesByEventChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Сумма продаж (₸)',
                    data: values,
                    backgroundColor: Array.isArray(bg) ? bg : labels.map(() => bg),
                    borderColor: '#4f46e5',
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
    createTicketsOverviewChart() {
        const canvas = document.getElementById('ticketsOverviewChart');
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (parent) parent.style.minHeight = '280px';
        const ctx = canvas.getContext('2d');

        if (this.charts.ticketsOverviewChart) {
            try { this.charts.ticketsOverviewChart.destroy(); } catch (e) { }
        }

        const selectedObject = AppModule.currentObject;
        const totals = selectedObject ? TicketModule.getTotalsForObject(selectedObject) : TicketModule.getTotals();
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
    createTicketsByCategoryChart() {
        const canvas = document.getElementById('ticketsByCategoryChart');
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (parent) parent.style.minHeight = '360px';
        const ctx = canvas.getContext('2d');

        if (this.charts.ticketsByCategoryChart) {
            try { this.charts.ticketsByCategoryChart.destroy(); } catch (e) { }
        }

        const { labels, activated, notActivated, unsold } = TicketModule.getCategoryArrays();

        this.charts.ticketsByCategoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Активированные', data: activated, backgroundColor: '#6366f1' },
                    { label: 'Не активированные', data: notActivated, backgroundColor: '#f59e0b' },
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
        await DataModule.fetchSalesData();
        DataModule.filterData({ dateFrom: '', dateTo: '' });
        this.bindEvents();
        this.setDefaultFilters();
        window.salesReportShowDashboard(null);
        this.updateTable();
    },
    bindEvents() {
        document.getElementById('newReportBtn')?.addEventListener('click', this.handleFilter);
        document.getElementById('exportExcelBtn')?.addEventListener('click', this.handleExport);
        document.getElementById('showAllAnalyticsBtn')?.addEventListener('click', this.handleShowAllAnalytics);
        document.getElementById('objectSelect')?.addEventListener('change', () => this.handleObjectChange());
        document.getElementById('dateFrom')?.addEventListener('change', () => this.handleFilter());
        document.getElementById('dateTo')?.addEventListener('change', () => this.handleFilter());
        document.getElementById('applyPeriodBtn')?.addEventListener('click', () => this.handleFilter());
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', () => this.handleRowsPerPage());
        }
    },
    handleObjectChange() {
        const sel = document.getElementById('objectSelect');
        if (!sel) return;
        const val = sel.value === 'all' ? null : sel.value;
        this.currentObject = val;
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
        if (dateFrom && dateTo && dateTo < dateFrom) {
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
            this.updateTable();
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
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        let dateFrom = dateFromInput?.value || '';
        let dateTo = dateToInput?.value || '';

        if (!dateFrom && !dateTo) {
            dateFrom = '2025-10-01';
            dateTo = '2025-10-31';
            if (dateFromInput && dateToInput) {
                dateFromInput.value = dateFrom;
                dateToInput.value = dateTo;
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
    AppModule.currentEvent = eventName;
    const isSingleEvent = !!eventName && !selectedObject;

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
            if (firstSale.date) {
                dateFrom = firstSale.date.split('T')[0];
            }
        }
    } else {
        dateFrom = document.getElementById('dateFrom')?.value || '2025-10-01';
        dateTo = analyticsDateTo || document.getElementById('dateTo')?.value || '2025-10-31';
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

    if (selectedObject || isSingleEvent) {
        ChartModule.createReturnsByChannelChart(data);
        ChartModule.createSalesByEventChart(data);
    } else {
        ChartModule.createSalesByEventChart(data);
    }

    ChartModule.createTicketsOverviewChart();
    ChartModule.createTicketsByCategoryChart();
};

window.salesReportBackToMain = function () {
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
    TicketModule.debug();
    AppModule.initialize();
});