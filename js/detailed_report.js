console.log('detailed_report.js loaded at:', new Date().toISOString());

// Модуль данных
const DataModule = {
    paymentsData: [],
    filteredData: [],
    async fetchPaymentsData() {
        try {
            this.paymentsData = window.generateMockPaymentsData(1000);
            this.paymentsData = this.paymentsData.map(payment => ({
                ...payment,
                paymentType: payment.type === 'Kaspi.kz' ? 'Kaspi' : payment.type
            }));
            this.filteredData = [...this.paymentsData];
            console.log('Payments data loaded:', this.paymentsData.length);
        } catch (error) {
            console.error('Error fetching payments data:', error);
        }
    },
    filterData({ dateFrom, dateTo, searchTerm }) {
        this.filteredData = this.paymentsData.filter(payment => {
            const paymentDate = payment.date;
            if (dateFrom && paymentDate < dateFrom) return false;
            if (dateTo && paymentDate > dateTo) return false;
            if (searchTerm) {
                const searchString = [
                    payment.object,
                    payment.terminal,
                    payment.amount.toString(),
                    payment.paymentType,
                    payment.date,
                    payment.time || '',
                    payment.bin || ''
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
                    byType: { 'Купюрами': 0, 'Монеты': 0, 'Kaspi': 0 },
                    byDate: {},
                    terminals: new Set(),
                    byHour: Array(24).fill(0)
                };
            }
            byObject[payment.object].totalAmount += payment.amount;
            byObject[payment.object].transactions += 1;
            byObject[payment.object].byType[payment.paymentType] += payment.amount;
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
                byTerminal[payment.terminal] = {
                    totalAmount: 0,
                    transactions: 0
                };
            }
            byTerminal[payment.terminal].totalAmount += payment.amount;
            byTerminal[payment.terminal].transactions += 1;
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
        return dateString ? new Date(dateString).toLocaleDateString('ru-RU') : '';
    },
    formatDateTime(date, time) {
        if (!date || !time) return '–';
        return `${new Date(date).toLocaleDateString('ru-RU')} ${time}`;
    },
    formatDateRange(dateFrom, dateTo) {
        if (!dateFrom && !dateTo) return '';
        if (dateFrom && dateTo) return `${this.formatDate(dateFrom)} – ${this.formatDate(dateTo)}`;
        return this.formatDate(dateFrom || dateTo);
    },
    updateStatsCards(data, isSingleObject = false) {
        const objects = DataModule.aggregateByObject(data);
        const totalObjects = Object.keys(objects).length;
        const totalAmount = Object.values(objects).reduce((sum, obj) => sum + obj.totalAmount, 0);
        const totalTransactions = Object.values(objects).reduce((sum, obj) => sum + obj.transactions, 0);
        const totalTerminals = isSingleObject ? 
            [...Object.values(objects)[0].terminals].length : 
            new Set(data.map(p => p.terminal)).size;
        const kaspiShare = totalAmount ? 
            ((Object.values(objects).reduce((sum, obj) => sum + obj.byType['Kaspi'], 0) / totalAmount) * 100).toFixed(1) : 0;
        
        let topTerminal = { name: '–', totalAmount: 0 };
        if (isSingleObject) {
            const terminals = DataModule.aggregateByTerminal(data);
            topTerminal = Object.entries(terminals).reduce((top, [name, stats]) => 
                stats.totalAmount > top.totalAmount ? { name, totalAmount: stats.totalAmount } : top, 
                { name: '–', totalAmount: 0 }
            );
        } else {
            topTerminal = Object.entries(objects).reduce((top, [name, obj]) => 
                obj.totalAmount > top.totalAmount ? { name, totalAmount: obj.totalAmount } : top, 
                { name: '–', totalAmount: 0 }
            );
        }

        document.getElementById('totalAmount').textContent = this.formatAmount(totalAmount);
        document.getElementById('totalTerminals').textContent = isSingleObject ? totalTerminals : totalObjects;
        document.getElementById('totalTerminalsLabel').textContent = isSingleObject ? 'Всего терминалов' : 'Всего объектов';
        document.getElementById('totalTransactions').textContent = totalTransactions;
        document.getElementById('avgAmount').textContent = this.formatAmount(totalTransactions ? totalAmount / totalTransactions : 0);
        document.getElementById('topTerminal').textContent = topTerminal.name;
        document.getElementById('topTerminalLabel').textContent = isSingleObject ? 'Самый активный терминал' : 'Самый активный объект';
        document.getElementById('kaspiShare').textContent = `${kaspiShare}%`;
    },
    renderDetailedTable(data, page = 1, pageSize = 50) {
        const tbody = document.getElementById('detailedTable');
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedData = data.slice(start, end);

        tbody.innerHTML = paginatedData.length ? paginatedData.map((payment, index) => `
            <tr>
                <td>${start + index + 1}</td>
                <td><a href="#" class="object-link" data-object="${encodeURIComponent(payment.object)}">${payment.object}</a></td>
                <td>${payment.terminal}</td>
                <td>${this.formatAmount(payment.amount)}</td>
                <td>${payment.paymentType}</td>
                <td>${this.formatDateTime(payment.date, payment.time)}</td>
                <td>${payment.bin || '–'}</td>
            </tr>
        `).join('') : '<tr><td colspan="7" class="text-center py-4">Нет данных для отображения.</td></tr>';

        document.querySelectorAll('.object-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.detailedReportShowDashboard(decodeURIComponent(e.target.dataset.object));
            });
        });

        this.renderPagination(data.length, page, pageSize);
    },
    renderPagination(totalItems, currentPage, pageSize) {
        const container = document.getElementById('paginationContainer');
        const totalPages = Math.ceil(totalItems / pageSize);

        let paginationHTML = `
            <nav>
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${currentPage - 1}">«</a>
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
                        <a class="page-link" href="#" data-page="${currentPage + 1}">»</a>
                    </li>
                </ul>
            </nav>
        `;

        container.innerHTML = paginationHTML;

        container.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page) {
                    AppModule.currentPage = page;
                    this.renderDetailedTable(DataModule.filteredData, page, AppModule.pageSize);
                }
            });
        });

        const pageSizeSelect = document.getElementById('pageSizeSelect');
        pageSizeSelect.addEventListener('change', (e) => {
            AppModule.pageSize = parseInt(e.target.value);
            AppModule.currentPage = 1;
            this.renderDetailedTable(DataModule.filteredData, 1, AppModule.pageSize);
        });
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
        const typeTotals = { 'Купюрами': 0, 'Монеты': 0, 'Kaspi': 0 };
        data.forEach(payment => {
            typeTotals[payment.paymentType] += payment.amount;
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
    createPaymentByDateChart(data) {
        const canvas = document.getElementById('paymentByDateChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const byDate = {};
        data.forEach(payment => {
            byDate[payment.date] = (byDate[payment.date] || 0) + payment.amount;
        });
        this.charts.paymentByDateChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(byDate).sort(),
                datasets: [{
                    label: 'Сумма (₸)',
                    data: Object.values(byDate),
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
    createTerminalRevenueChart(data, isSingleObject = false) {
        const canvas = document.getElementById('terminalRevenueChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const terminals = DataModule.aggregateByTerminal(data);
        const objects = DataModule.aggregateByObject(data);
        const labels = isSingleObject ? Object.keys(terminals) : Object.keys(objects);
        const amounts = isSingleObject ? 
            Object.values(terminals).map(t => t.totalAmount) : 
            Object.values(objects).map(o => o.totalAmount);
        this.charts.terminalRevenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Сумма (₸)',
                    data: amounts,
                    backgroundColor: 'rgba(255, 193, 7, 0.6)',
                    borderColor: '#ffc107',
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
    createHourlyChart(data) {
        const canvas = document.getElementById('hourlyChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const hourly = Array(24).fill(0);
        data.forEach(payment => {
            if (payment.time) {
                const hour = parseInt(payment.time.split(':')[0]);
                hourly[hour] += 1;
            }
        });
        this.charts.hourlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Транзакции',
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
            .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
            .slice(0, 5);
        this.charts.topTerminalsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedTerminals.map(([terminal]) => terminal),
                datasets: [{
                    label: 'Сумма (₸)',
                    data: sortedTerminals.map(([_, stats]) => stats.totalAmount),
                    backgroundColor: 'rgba(40, 167, 69, 0.6)',
                    borderColor: '#28a745',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { callback: value => RenderModule.formatAmount(value) }
                    }
                }
            }
        });
    },
    createTerminalTransactionsChart(data, isSingleObject = false) {
        const canvas = document.getElementById('terminalTransactionsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const terminals = DataModule.aggregateByTerminal(data);
        const objects = DataModule.aggregateByObject(data);
        const labels = isSingleObject ? Object.keys(terminals) : Object.keys(objects);
        const transactions = isSingleObject ? 
            Object.values(terminals).map(t => t.transactions) : 
            Object.values(objects).map(o => o.transactions);
        this.charts.terminalTransactionsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Транзакции',
                    data: transactions,
                    backgroundColor: 'rgba(0, 123, 255, 0.6)',
                    borderColor: '#007bff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }
};

// Модуль управления
const AppModule = {
    isInitialized: false,
    currentObject: null,
    currentPage: 1,
    pageSize: 50,
    async initialize() {
        if (this.isInitialized) {
            console.log('Detailed report page already initialized, skipping');
            return;
        }
        this.isInitialized = true;
        console.log('Initializing detailed report page');

        // Загрузка XLSX
        if (!window.XLSX) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => {
                console.log('XLSX loaded');
                this.loadDataAndRender();
            };
            script.onerror = () => console.error('Failed to load XLSX');
            document.body.appendChild(script);
        } else {
            this.loadDataAndRender();
        }
    },
    async loadDataAndRender() {
        await DataModule.fetchPaymentsData();
        RenderModule.renderDetailedTable(DataModule.filteredData, this.currentPage, this.pageSize);
        this.bindEvents();
        this.setDefaultFilters();
    },
    cleanup() {
        this.isInitialized = false;
        this.currentObject = null;
        this.currentPage = 1;
        ChartModule.destroyCharts();
        document.getElementById('newReportBtn')?.removeEventListener('click', this.handleFilter);
        document.getElementById('searchInput')?.removeEventListener('input', this.handleFilter);
        document.getElementById('exportExcelBtn')?.removeEventListener('click', this.handleExport);
        document.getElementById('showAllAnalyticsBtn')?.removeEventListener('click', this.handleShowAllAnalytics);
        document.getElementById('pageSizeSelect')?.removeEventListener('change', this.handlePageSizeChange);
    },
    bindEvents() {
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
        this.currentPage = 1;
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';
        const searchTerm = document.getElementById('searchInput')?.value || '';
        DataModule.filterData({ dateFrom, dateTo, searchTerm });
        RenderModule.renderDetailedTable(DataModule.filteredData, this.currentPage, this.pageSize);
    },
    handleExport() {
        console.log('Exporting to Excel');
        if (!window.XLSX) {
            console.error('XLSX not loaded');
            alert('Ошибка: библиотека XLSX не загружена');
            return;
        }
        const table = document.getElementById('detailedTable');
        const wb = XLSX.utils.table_to_book(table, { sheet: "Детальный отчет" });
        XLSX.writeFile(wb, `Детальный_отчет_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`);
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
                // Применяем фильтр для обновления данных
                DataModule.filterData({ dateFrom, dateTo, searchTerm: document.getElementById('searchInput')?.value || '' });
            }
        }

        window.detailedReportShowDashboard(null);
    }
};

// Глобальные функции
window.detailedReportShowDashboard = function(objectName) {
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
        // Для конкретного объекта берем дату из первой записи
        if (data.length > 0) {
            const firstPayment = data[0];
            if (firstPayment.date && !isNaN(new Date(firstPayment.date).getTime())) {
                dateFrom = firstPayment.date; // Оставляем в формате YYYY-MM-DD для formatDate
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
    ChartModule.destroyCharts();
    ChartModule.createPaymentTypesChart(data);
    ChartModule.createPaymentByDateChart(data);
    ChartModule.createTerminalRevenueChart(data, isSingleObject);
    ChartModule.createHourlyChart(data);
    ChartModule.createTopTerminalsChart(data);
    ChartModule.createTerminalTransactionsChart(data, isSingleObject);
};

window.detailedReportBackToMain = function() {
    console.log('Returning to main page');
    AppModule.currentObject = null;
    document.getElementById('dashboardPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
    ChartModule.destroyCharts();
};

// Инициализация
if (!window.detailedReportInitialized) {
    window.detailedReportInitialized = true;
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing detailed report page');
        AppModule.initialize();
    });
} else {
    console.log('detailed_report.js already initialized, skipping DOMContentLoaded');
}