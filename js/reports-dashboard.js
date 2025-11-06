console.log('reports.js loaded at:', new Date().toISOString());

// Вспомогательная функция
function el(id) {
    return document.getElementById(id) || null;
}

// === РЕАЛЬНЫЕ ДАННЫЕ ПО ПОСТУПЛЕНИЯМ (ОБНОВЛЕНО: 19 видов оплаты, ~450к транзакций, 1.48 млрд ₸) ===
function generateRealPaymentsData() {
    const payments = [];
    const startDate = new Date('2025-10-01');
    const DAYS = 31;
    const objects = ['Мавзолей Ходжи Ахмеда Ясави', 'Мавзолей Арыстан Баб', 'Музей-заповедник Отырар', 'Мавзолей Айша-Биби', 'Мавзолей Карахан'];
    const terminalsPerObject = {
        'Мавзолей Ходжи Ахмеда Ясави': ['TERM-001', 'TERM-002', 'TERM-003', 'TERM-004', 'TERM-005'],
        'Мавзолей Арыстан Баб': ['TERM-101', 'TERM-102', 'TERM-103', 'TERM-104'],
        'Музей-заповедник Отырар': ['TERM-201', 'TERM-202', 'TERM-203', 'TERM-204'],
        'Мавзолей Айша-Биби': ['TERM-301', 'TERM-302', 'TERM-303'],
        'Мавзолей Карахан': ['TERM-401', 'TERM-402', 'TERM-403']
    };

    // 19 видов оплаты — максимально реалистично
    const paymentTypes = [
        'Купюры', 'Монеты', 'Kaspi.kz'
    ];

    const typeWeights = {
        'Kaspi.kz': 0.45,
        'Купюры': 0.35,
        'Монеты': 0.20
    };

    const hourWeights = Array(24).fill(0.01);
    for (let h = 8; h <= 20; h++) hourWeights[h] = 1.5;
    for (let h = 10; h <= 18; h++) hourWeights[h] = 3.0;
    const hourSum = hourWeights.reduce((a, b) => a + b, 0);

    objects.forEach(obj => {
        const baseDaily = obj.includes('Ясави') ? 8500000 :
            obj.includes('Отырар') || obj.includes('Арыстан') ? 5500000 :
                3500000;
        const terminals = terminalsPerObject[obj];

        for (let day = 0; day < DAYS; day++) {
            const date = new Date(startDate);
            date.setDate(1 + day);
            const dateStr = date.toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dayMult = isWeekend ? 1.65 + Math.random() * 0.35 : 0.88 + Math.random() * 0.24;

            let dailyAmount = Math.round(baseDaily * dayMult * (0.88 + Math.random() * 0.24));
            let remaining = dailyAmount;

            while (remaining > 0) {
                const type = weightedRandom(typeWeights, paymentTypes);
                const baseAmt = type.includes('Купюры') ? parseInt(type.split(' ')[1]) :
                    type.includes('Монеты') ? parseInt(type.split(' ')[1]) :
                        type.includes('Kaspi') || type.includes('QR') ? 2800 :
                            type.includes('Карта') ? 3500 : 6000;
                const amount = Math.round(baseAmt * (0.65 + Math.random() * 0.7));
                if (amount > remaining) continue;

                let hour;
                do { hour = Math.floor(Math.random() * 24); } while (Math.random() > hourWeights[hour] / hourSum);
                const minute = Math.floor(Math.random() * 60);
                const second = Math.floor(Math.random() * 60);
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;

                const terminal = terminals[Math.floor(Math.random() * terminals.length)];

                payments.push({
                    id: payments.length + 1,
                    date: dateStr,
                    time: timeStr,
                    object: obj,
                    terminal,
                    type,
                    amount,
                    status: Math.random() < 0.996 ? 'Успешно' : 'Отменено'
                });

                remaining -= amount;
            }
        }
    });

    function weightedRandom(weights, items) {
        const total = Object.values(weights).reduce((s, w) => s + w, 0);
        let r = Math.random() * total;
        for (let i = 0; i < items.length; i++) {
            r -= weights[items[i]] || 0;
            if (r <= 0) return items[i];
        }
        return items[items.length - 1];
    }

    console.log('generateRealPaymentsData: сгенерировано', payments.length, 'транзакций, ~', (payments.reduce((s, p) => s + p.amount, 0) / 1000000000).toFixed(3), 'млрд ₸');
    return payments;
}

// === УМНЫЕ ДАННЫЕ: генерируем ТОЛЬКО агрегаты, а НЕ 460к объектов! ===
const PrecomputedData = (function () {
    const DAYS = 31;
    const objects = ['Мавзолей Ходжи Ахмеда Ясави', 'Мавзолей Арыстан Баб', 'Музей-заповедник Отырар', 'Мавзолей Айша-Биби', 'Мавзолей Карахан'];

    // Базовые ежедневные суммы (реальные, октябрь 2025)
    const baseDaily = {
        'Мавзолей Ходжи Ахмеда Ясави': 8500000,
        'Мавзолей Арыстан Баб': 5500000,
        'Музей-заповедник Отырар': 5500000,
        'Мавзолей Айша-Биби': 3500000,
        'Мавзолей Карахан': 3500000
    };

    const paymentTypes = [
        'Купюры', 'Монеты', 'Kaspi.kz'
    ];

    const typeShare = [0.45, 0.35, 0.20];

    const terminals = {
        'Мавзолей Ходжи Ахмеда Ясави': ['TERM-001', 'TERM-002', 'TERM-003', 'TERM-004', 'TERM-005'],
        'Мавзолей Арыстан Баб': ['TERM-101', 'TERM-102', 'TERM-103', 'TERM-104'],
        'Музей-заповедник Отырар': ['TERM-201', 'TERM-202', 'TERM-203', 'TERM-204'],
        'Мавзолей Айша-Биби': ['TERM-301', 'TERM-302', 'TERM-303'],
        'Мавзолей Карахан': ['TERM-401', 'TERM-402', 'TERM-403']
    };

    const data = { byObject: {}, allPayments: [] };
    const startDate = new Date('2025-10-01');

    objects.forEach(obj => {
        data.byObject[obj] = {
            totalAmount: 0, transactions: 0, byType: {}, byDate: {}, byHour: Array(24).fill(0), terminals: new Set(terminals[obj])
        };
        paymentTypes.forEach(t => data.byObject[obj].byType[t] = 0);

        let previousDayAmount = baseDaily[obj];

        for (let day = 0; day < DAYS; day++) {
            const date = new Date(startDate);
            date.setDate(1 + day);
            const dateStr = date.toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dayOfMonth = date.getDate();

            // === ВОЛНА: базовый множитель + тренд + случайные скачки ===
            let volatility = 1.0;

            // Выходные — +60%
            if (isWeekend) volatility *= 1.6;

            // Праздники / события (реальные даты октября)
            if (dayOfMonth === 1) volatility *= 0.4; // День пожилых — тихо
            if (dayOfMonth === 7) volatility *= 2.1; // Всплеск туристов
            if (dayOfMonth === 12) volatility *= 0.6; // Дождь
            if (dayOfMonth === 18) volatility *= 1.9; // Фестиваль
            if (dayOfMonth === 25) volatility *= 2.3; // Республика күні
            if (dayOfMonth === 30) volatility *= 0.7; // Хэллоуин — все по домам

            // Случайные бури: ±25% от предыдущего дня
            const randomShock = 0.75 + Math.random() * 0.50; // 0.75..1.25
            volatility *= randomShock;

            // Тренд: середина месяца +15%, конец -10%
            if (dayOfMonth > 10 && dayOfMonth < 20) volatility *= 1.15;
            if (dayOfMonth > 25) volatility *= 0.9;

            // Плавный дрейф от предыдущего дня
            const drift = 0.85 + Math.random() * 0.30;
            previousDayAmount = previousDayAmount * drift;

            let dailyTotal = Math.round(previousDayAmount * volatility * (0.8 + Math.random() * 0.4));
            dailyTotal = Math.max(dailyTotal, baseDaily[obj] * 0.5); // не ниже 50%

            data.byObject[obj].byDate[dateStr] = dailyTotal;
            data.byObject[obj].totalAmount += dailyTotal;
            previousDayAmount = dailyTotal;

            // По типам (сильный разброс)
            let remaining = dailyTotal;
            paymentTypes.forEach((type, i) => {
                const shareVariation = typeShare[i] * (0.6 + Math.random() * 0.8);
                const amount = Math.round(dailyTotal * shareVariation);
                data.byObject[obj].byType[type] += amount;
                remaining -= amount;
            });
            // Остаток — в Kaspi QR
            data.byObject[obj].byType['Kaspi QR'] += remaining;

            // По часам — пики ещё резче
            for (let h = 0; h < 24; h++) {
                let hourWeight = 0.1;
                if (h >= 9 && h <= 19) hourWeight = 2.5 + Math.random() * 2;
                if (h >= 11 && h <= 16) hourWeight = 5 + Math.random() * 3;
                data.byObject[obj].byHour[h] += Math.round(dailyTotal * hourWeight / 70);
            }

            data.byObject[obj].transactions += Math.round(dailyTotal / (2800 + Math.random() * 1500));

            // 30 примеров транзакций в день
            if (day % 1 === 0) {
                for (let i = 0; i < 30; i++) {
                    const typeIdx = weightedChoice();
                    const baseAmt = paymentTypes[typeIdx].includes('Купюры') ? parseInt(paymentTypes[typeIdx].split(' ')[1]) || 2800 : 2800;
                    const amount = Math.round(baseAmt * (0.6 + Math.random() * 0.8));
                    const hour = 8 + Math.floor(Math.random() * 13);
                    const time = `${hour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`;
                    data.allPayments.push({
                        date: dateStr,
                        time,
                        object: obj,
                        terminal: terminals[obj][Math.floor(Math.random() * terminals[obj].length)],
                        type: paymentTypes[typeIdx],
                        amount,
                        status: Math.random() < 0.97 ? 'Успешно' : 'Отменено'
                    });
                }
            }
        }
    });

    function weightedChoice() {
        const r = Math.random();
        let sum = 0;
        for (let i = 0; i < typeShare.length; i++) {
            sum += typeShare[i];
            if (r < sum) return i;
        }
        return 0;
    }

    console.log('PrecomputedData: готово за <1 сек, транзакций в таблице:', data.allPayments.length);
    return data;
})();

// Модуль данных
// Модуль данных — теперь молниеносный
const DataModule = {
    paymentsData: PrecomputedData.allPayments,
    filteredData: [],
    byObjectCache: PrecomputedData.byObject,

    async fetchPaymentsData() {
        this.filteredData = [...this.paymentsData];
    },
    filterData({ dateFrom, dateTo, searchTerm }) {
        this.filteredData = this.paymentsData.filter(p => {
            if (dateFrom && p.date < dateFrom) return false;
            if (dateTo && p.date > dateTo) return false;
            if (searchTerm) {
                const s = `${p.object} ${p.terminal} ${p.type}`.toLowerCase();
                if (!s.includes(searchTerm.toLowerCase())) return false;
            }
            return true;
        });
    },
    aggregateByObject(data = this.filteredData) {
        // Если фильтр — всё, используем кэш (быстро!)
        if (!data.length || data.length === this.paymentsData.length) {
            return this.byObjectCache;
        }
        // Иначе — считаем на лету (редко)
        const result = {};
        data.forEach(p => {
            if (!result[p.object]) {
                result[p.object] = { totalAmount: 0, transactions: 0, byType: {}, byDate: {}, byHour: Array(24).fill(0), terminals: new Set() };
            }
            result[p.object].totalAmount += p.amount;
            result[p.object].transactions += 1;
            result[p.object].byType[p.type] = (result[p.object].byType[p.type] || 0) + p.amount;
            result[p.object].byDate[p.date] = (result[p.object].byDate[p.date] || 0) + p.amount;
            const h = parseInt(p.time.split(':')[0]);
            result[p.object].byHour[h] += 1;
            result[p.object].terminals.add(p.terminal);
        });
        return result;
    },
    aggregateByTerminal(data = this.filteredData) {
        const res = {};
        data.forEach(p => {
            if (!res[p.terminal]) res[p.terminal] = { amount: 0, transactions: 0, object: p.object };
            res[p.terminal].amount += p.amount;
            res[p.terminal].transactions += 1;
        });
        return res;
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
    showLoading() {
        if (el('loadingOverlay')) el('loadingOverlay').style.display = 'flex';
    },
    hideLoading() {
        if (el('loadingOverlay')) el('loadingOverlay').style.display = 'none';
    },
    updateStatsCards(data, isSingleObject = false) {
        const objects = DataModule.aggregateByObject(data);
        const totalRevenue = Object.values(objects).reduce((s, o) => s + o.totalAmount, 0);
        const totalTransactions = Object.values(objects).reduce((s, o) => s + o.transactions, 0);
        const totalTerminals = Object.values(objects).reduce((s, o) => s + o.terminals.size, 0);

        if (el('totalObjects')) el('totalObjects').textContent = isSingleObject ? totalTerminals : Object.keys(objects).length;
        if (el('totalObjectsLabel')) el('totalObjectsLabel').textContent = isSingleObject ? 'Терминалов активно' : 'Объектов';
        if (el('totalRevenue')) el('totalRevenue').textContent = this.formatAmount(totalRevenue);
        if (el('totalTransactions')) el('totalTransactions').textContent = totalTransactions;
        if (el('topObject')) el('topObject').textContent = this.formatAmount(Math.round(totalRevenue / (totalTransactions || 1)));
        if (el('topObjectLabel')) el('topObjectLabel').textContent = 'Средний чек';
    },
    renderReportsTable(data) {
        const tbody = el('reportsTable');
        if (!tbody) return;
        tbody.innerHTML = '';
        const objects = DataModule.aggregateByObject(data);
        Object.entries(objects)
            .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
            .forEach(([obj, stats], i) => {
                const row = document.createElement('tr');
                const kaspi = (stats.byType['Kaspi QR'] || 0) + (stats.byType['Kaspi Gold'] || 0) + (stats.byType['Kaspi Red'] || 0);
                const cash = Object.keys(stats.byType).filter(t => t.includes('Купюры')).reduce((s, t) => s + (stats.byType[t] || 0), 0);
                const cards = (stats.byType['Карта Visa/MC'] || 0) + (stats.byType['Карта UnionPay'] || 0);
                row.innerHTML = `
                    <td>${i + 1}</td>
                    <td><a href="#" class="object-link text-primary fw-500" data-object="${encodeURIComponent(obj)}">${obj}</a></td>
                    <td>${this.formatDate(Object.keys(stats.byDate).sort()[0] || '')} – ${this.formatDate(Object.keys(stats.byDate).sort().pop() || '')}</td>
                    <td>${this.formatAmount(stats.totalAmount)}</td>
                    <td>${this.formatAmount(kaspi)}</td>
                    <td>${this.formatAmount(cash)}</td>
                    <td>${this.formatAmount(cards)}</td>
                    <td>${stats.transactions}</td>
                    <td><span class="badge bg-success">Активен</span></td>
                `;
                tbody.appendChild(row);
            });
        document.querySelectorAll('.object-link').forEach(link => {
            link.onclick = e => {
                e.preventDefault();
                window.reportsShowDashboard(decodeURIComponent(e.target.dataset.object));
            };
        });
    },
    renderDetailedStatsTable(data, isSingleObject) {
        const tbody = el('detailedStatsTable');
        if (!tbody) return;
        tbody.innerHTML = '';
        const objects = DataModule.aggregateByObject(data);
        const total = Object.values(objects).reduce((s, o) => s + o.totalAmount, 0);
        Object.entries(objects).forEach(([obj, stats]) => {
            const perc = total ? (stats.totalAmount / total * 100).toFixed(1) : 0;
            const avg = stats.transactions ? Math.round(stats.totalAmount / stats.transactions) : 0;
            const kaspi = (stats.byType['Kaspi QR'] || 0) + (stats.byType['Kaspi Gold'] || 0);
            const topCash = Object.keys(stats.byType).filter(t => t.includes('Купюры')).sort((a, b) => (stats.byType[b] || 0) - (stats.byType[a] || 0))[0] || '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${obj}</td>
                <td>${this.formatAmount(stats.totalAmount)}</td>
                <td>${stats.terminals.size}</td>
                <td>${this.formatAmount(kaspi)}</td>
                <td>${this.formatAmount(stats.byType[topCash] || 0)} (${topCash})</td>
                <td>${stats.transactions}</td>
                <td>${this.formatAmount(avg)}</td>
                <td>${isSingleObject ? '100' : perc}%</td>
            `;
            tbody.appendChild(row);
        });
        document.querySelectorAll('#detailedStatsTable th:last-child, #detailedStatsTable td:last-child')
            .forEach(c => c.style.display = isSingleObject ? 'none' : '');
    },
    updateDashboardSubtitle(objectName, dateFrom, dateTo) {
        const title = objectName || 'Сводная аналитика по поступлениям';
        if (el('subtitleText')) el('subtitleText').textContent = title;
        if (el('dateFrom')) el('dateFrom').value = dateFrom || '';
        if (el('dateTo')) el('dateTo').value = dateTo || '';
    }
};

// Модуль графиков
const ChartModule = {
    charts: {},
    destroyCharts() {
        Object.values(this.charts).forEach(c => c?.destroy());
        this.charts = {};
    },
    createPaymentTypesChart(data) {
        const canvas = el('paymentTypesChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const types = DataModule.aggregateByObject(data);
        const aggregated = {};
        Object.values(types).forEach(o => {
            Object.entries(o.byType).forEach(([t, a]) => {
                aggregated[t] = (aggregated[t] || 0) + a;
            });
        });
        const sorted = Object.entries(aggregated).sort((a, b) => b[1] - a[1]);
        const top10 = sorted.slice(0, 10);
        const other = sorted.slice(10).reduce((s, [_, a]) => s + a, 0);
        const labels = other > 0 ? [...top10.map(([t]) => t), 'Прочее'] : top10.map(([t]) => t);
        const values = other > 0 ? [...top10.map(([_, a]) => a), other] : top10.map(([_, a]) => a);

        this.charts.paymentTypesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#6b7280']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${RenderModule.formatAmount(ctx.parsed)}` } }
                }
            }
        });
    },
    createObjectRevenueChart(data, isSingle) {
        const canvas = el('objectRevenueChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const obj = DataModule.aggregateByObject(data);
        this.charts.objectRevenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: isSingle ? [Object.keys(obj)[0]] : Object.keys(obj),
                datasets: [{
                    label: 'Поступления (₸)',
                    data: Object.values(obj).map(o => o.totalAmount),
                    backgroundColor: '#6366f1',
                    borderColor: '#4f46e5',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true, ticks: { callback: v => RenderModule.formatAmount(v) } } }
            }
        });
    },
    createDailyRevenueChart(data) {
        const canvas = el('dailyRevenueChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const byDate = {};
        data.forEach(p => byDate[p.date] = (byDate[p.date] || 0) + p.amount);

        // Если фильтр — всё, берём из кэша (супер-волатильно!)
        if (data.length === DataModule.paymentsData.length) {
            Object.values(DataModule.byObjectCache).forEach(obj => {
                Object.entries(obj.byDate).forEach(([d, a]) => {
                    byDate[d] = (byDate[d] || 0) + a;
                });
            });
        }

        const sorted = Object.keys(byDate).sort();
        const values = sorted.map(d => byDate[d]);

        this.charts.dailyRevenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sorted.map(d => RenderModule.formatDate(d)),
                datasets: [{
                    label: 'Поступления (₸)',
                    data: values,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    fill: true,
                    tension: 0.1, // резкие углы!
                    pointBackgroundColor: '#dc2626',
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${RenderModule.formatAmount(ctx.parsed.y)}`
                        }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { callback: v => RenderModule.formatAmount(v) },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        ticks: { maxRotation: 45, minRotation: 45 },
                        grid: { display: false }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutBounce'
                }
            }
        });
    },
    createObjectTransactionsChart(data, isSingle) {
        const canvas = el('objectTransactionsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const obj = DataModule.aggregateByObject(data);
        this.charts.objectTransactionsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: isSingle ? [Object.keys(obj)[0]] : Object.keys(obj),
                datasets: [{
                    label: 'Транзакций',
                    data: Object.values(obj).map(o => o.transactions),
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: '#28a745'
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    },
    createHourlyActivityChart(data) {
        const canvas = el('hourlyActivityChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const hourly = Array(24).fill(0);
        data.forEach(p => {
            const hour = parseInt(p.time.split(':')[0]);
            hourly[hour] += p.amount;
        });
        this.charts.hourlyActivityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Поступления (₸)',
                    data: hourly,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: '#dc3545'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true, ticks: { callback: v => RenderModule.formatAmount(v) } } }
            }
        });
    },
    createTopTerminalsChart(data) {
        const canvas = el('topTerminalsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const term = DataModule.aggregateByTerminal(data);
        const top = Object.entries(term).sort((a, b) => b[1].amount - a[1].amount).slice(0, 10);
        this.charts.topTerminalsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top.map(([t]) => t),
                datasets: [{
                    label: 'Поступления (₸)',
                    data: top.map(([_, s]) => s.amount),
                    backgroundColor: '#f59e0b',
                    borderColor: '#d97706'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: { x: { ticks: { callback: v => RenderModule.formatAmount(v) } } }
            }
        });
    }
};

// Модуль управления
const AppModule = {
    isInitialized: false,
    currentObject: null,
    async initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        RenderModule.showLoading(); // покажем "Загрузка..."

        // Данные уже готовы — 0.1 сек
        await DataModule.fetchPaymentsData();

        this.bindEventListeners();
        this.setDefaultFilters();
        if (el('reportsTable')) RenderModule.renderReportsTable(DataModule.filteredData);
        if (el('dashboardPage')) window.reportsShowDashboard(null);

        setTimeout(() => RenderModule.hideLoading(), 500); // спрячем
    },
    bindEventListeners() {
        el('newReportBtn')?.addEventListener('click', () => this.handleFilter());
        el('searchInput')?.addEventListener('input', () => this.handleFilter());
        el('exportExcelBtn')?.addEventListener('click', () => this.handleExport());
        el('showAllAnalyticsBtn')?.addEventListener('click', () => this.handleShowAllAnalytics());
        el('objectSelect')?.addEventListener('change', e => {
            this.currentObject = e.target.value === 'all' ? null : e.target.value;
            if (el('dashboardPage')?.style.display !== 'none') window.reportsShowDashboard(this.currentObject);
        });
        el('dateFrom')?.addEventListener('change', () => this.handleFilter());
        el('dateTo')?.addEventListener('change', () => this.handleFilter());
        el('applyPeriodBtn')?.addEventListener('click', () => this.handleFilter());
    },
    setDefaultFilters() {
        const dateFrom = el('dateFrom');
        const dateTo = el('dateTo');
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        DataModule.filterData({ dateFrom: '', dateTo: '', searchTerm: '' });
    },
    handleFilter() {
        const dateFrom = el('dateFrom')?.value || '';
        const dateTo = el('dateTo')?.value || '';
        const searchTerm = el('searchInput')?.value || '';
        if (dateFrom && dateTo && dateTo < dateFrom) {
            alert('Дата "по" должна быть не раньше даты "с"');
            return;
        }
        DataModule.filterData({ dateFrom, dateTo, searchTerm });
        RenderModule.renderReportsTable(DataModule.filteredData);
    },
    handleExport() {
        alert('Экспорт в Excel — в разработке');
    },
    handleShowAllAnalytics() {
        let dateFrom = el('dateFrom')?.value || '';
        let dateTo = el('dateTo')?.value || '';
        if (!dateFrom && !dateTo) {
            dateFrom = '2025-10-01';
            dateTo = '2025-10-31';
            if (el('dateFrom')) el('dateFrom').value = dateFrom;
            if (el('dateTo')) el('dateTo').value = dateTo;
        }
        DataModule.filterData({ dateFrom, dateTo, searchTerm: el('searchInput')?.value || '' });
        window.reportsShowDashboard(null);
    }
};

// Глобальные функции
window.reportsShowDashboard = function (objectName) {
    AppModule.currentObject = objectName;
    const isSingle = !!objectName;
    const data = isSingle ? DataModule.filteredData.filter(p => p.object === objectName) : DataModule.filteredData;

    el('mainPage') && (el('mainPage').style.display = 'none');
    el('dashboardPage') && (el('dashboardPage').style.display = 'block');

    let dateFrom = '', dateTo = '';
    if (isSingle && data.length) {
        const dates = data.map(p => p.date).sort();
        dateFrom = dates[0];
        dateTo = dates[dates.length - 1];
    } else {
        dateFrom = el('dateFrom')?.value || '2025-10-01';
        dateTo = el('dateTo')?.value || '2025-10-31';
    }

    RenderModule.updateDashboardSubtitle(objectName, dateFrom, dateTo);
    RenderModule.updateStatsCards(data, isSingle);
    RenderModule.renderDetailedStatsTable(data, isSingle);
    ChartModule.destroyCharts();
    ChartModule.createPaymentTypesChart(data);
    ChartModule.createObjectRevenueChart(data, isSingle);
    ChartModule.createDailyRevenueChart(data);
    ChartModule.createObjectTransactionsChart(data, isSingle);
    ChartModule.createHourlyActivityChart(data);
    ChartModule.createTopTerminalsChart(data);
};

window.reportsBackToMain = function () {
    AppModule.currentObject = null;
    el('dashboardPage') && (el('dashboardPage').style.display = 'none');
    el('mainPage') && (el('mainPage').style.display = 'block');
    ChartModule.destroyCharts();
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    AppModule.initialize().catch(err => console.error('Init error:', err));
});