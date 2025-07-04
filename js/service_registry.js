console.log('service_registry.js loaded successfully at:', new Date().toISOString());

let serviceData = [
    { id: 1, serviceName: "Катание", tickets: [{ count: 5, amount: 25000 }, { count: 3, amount: 15000 }], eventDate: "2024-01-15" },
    { id: 2, serviceName: "Выставка", tickets: [{ count: 2, amount: 6000 }, { count: 1, amount: 3000 }], eventDate: "2024-01-14" }
];
let serviceReports = [...serviceData];
let isInitialized = false;

// Инициализация страницы
window.initializeServiceRegistryPage = function() {
    if (isInitialized) return;
    isInitialized = true;
    console.log('initializeServiceRegistryPage called');

    const elements = {
        serviceTable: document.getElementById('serviceTable'),
        dateFrom: document.getElementById('dateFrom'),
        dateTo: document.getElementById('dateTo'),
        newReportBtn: document.getElementById('newReportBtn'),
        exportExcelBtn: document.getElementById('exportExcelBtn'),
        searchInput: document.getElementById('searchInput'),
        toggleFiltersBtn: document.getElementById('toggleFiltersBtn'),
        additionalFilters: document.getElementById('additionalFilters'),
        serviceKatanie: document.getElementById('serviceKatanie'),
        serviceVystavka: document.getElementById('serviceVystavka'),
        dashboardPage: document.getElementById('dashboardPage'),
        dashboardSubtitle: document.getElementById('dashboardSubtitle'),
        totalServices: document.getElementById('totalServices'),
        totalTicketsSold: document.getElementById('totalTicketsSold'),
        totalRevenue: document.getElementById('totalRevenue'),
        servicesChart: document.getElementById('servicesChart'),
        revenueByDateChart: document.getElementById('revenueByDateChart'),
        backToMainBtn: document.getElementById('backToMainBtn'),
        totalCount: document.getElementById('totalCount'),
        totalSum: document.getElementById('totalSum')
    };

    console.log('DOM elements status:', elements);

    const requiredElements = ['serviceTable', 'newReportBtn', 'exportExcelBtn', 'toggleFiltersBtn', 'dashboardPage'];
    for (const key of requiredElements) {
        if (!elements[key]) {
            console.error(`Critical element ${key} not found`);
            isInitialized = false;
            return;
        }
    }

    elements.newReportBtn.addEventListener('click', generateReport);
    elements.exportExcelBtn.addEventListener('click', exportToExcel);
    elements.toggleFiltersBtn.addEventListener('click', toggleFilters);
    elements.searchInput.addEventListener('input', filterData);
    elements.serviceKatanie.addEventListener('change', filterServices);
    elements.serviceVystavka.addEventListener('change', filterServices);
    elements.backToMainBtn.addEventListener('click', backToMain);

    generateReport();
};

function toggleFilters() {
    const additionalFilters = document.getElementById('additionalFilters');
    const isVisible = additionalFilters.style.display !== 'none';
    additionalFilters.style.display = isVisible ? 'none' : 'block';
    document.getElementById('toggleFiltersBtn').textContent = isVisible ? 'Дополнительные фильтры' : 'Скрыть фильтры';
}

function generateReport() {
    console.log('generateReport called');
    const startDate = document.getElementById('dateFrom').value;
    const endDate = document.getElementById('dateTo').value;

    serviceReports = serviceData.filter(report => {
        const pDate = report.eventDate;
        return (!startDate || pDate >= startDate) && (!endDate || pDate <= endDate);
    });

    console.log('Generated service reports:', serviceReports);
    filterServices();
}

function renderServiceReport(data = serviceReports) {
    const tableBody = document.getElementById('serviceTable');
    tableBody.innerHTML = data.length ? data.map((report, index) => {
        const totalCount = report.tickets.reduce((sum, t) => sum + t.count, 0);
        const totalAmount = report.tickets.reduce((sum, t) => sum + t.amount, 0);
        return `
            <tr class="service-row">
                <td class="service-col1">${index + 1}</td>
                <td class="service-col1">${report.serviceName}</td>
                <td class="service-col2">${totalCount}</td>
                <td class="service-col2">${totalAmount.toLocaleString('ru-RU')} ₸</td>
            </tr>
        `;
    }).join('') : '<tr><td colspan="4" class="text-center py-4">Нет данных для отображения.</td></tr>';

    const totalCount = data.reduce((sum, r) => sum + r.tickets.reduce((s, t) => s + t.count, 0), 0);
    const totalSum = data.reduce((sum, r) => sum + r.tickets.reduce((s, t) => s + t.amount, 0), 0);
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('totalSum').textContent = `${totalSum.toLocaleString('ru-RU')} ₸`;
}

function filterData() {
    console.log('Filtering data');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = serviceReports.filter(report => {
        const searchFields = [
            report.serviceName.toLowerCase(),
            report.tickets.map(t => t.count.toString()).join(' '),
            report.tickets.map(t => t.amount.toString()).join(' ')
        ].join(' ');
        return searchTerm === '' || searchFields.includes(searchTerm);
    });
    console.log('Filtered data length:', filtered.length);
    renderServiceReport(filtered);
}

function filterServices() {
    console.log('filterServices called');
    const selectedServices = [];
    if (document.getElementById('serviceKatanie').checked) selectedServices.push('Катание');
    if (document.getElementById('serviceVystavka').checked) selectedServices.push('Выставка');

    serviceReports = serviceData.filter(report => {
        const pDate = report.eventDate;
        const startDate = document.getElementById('dateFrom').value;
        const endDate = document.getElementById('dateTo').value;
        const dateFilter = (!startDate || pDate >= startDate) && (!endDate || pDate <= endDate);
        const serviceFilter = selectedServices.length === 0 || selectedServices.includes(report.serviceName);
        return dateFilter && serviceFilter;
    });

    console.log('Filtered service reports:', serviceReports);
    renderServiceReport();
    if (selectedServices.length > 0) {
        showDashboard(selectedServices.join(', '));
        loadDashboardData(selectedServices);
    } else {
        backToMain();
    }
}

function showDashboard(selectedServices) {
    console.log('Showing dashboard for:', selectedServices);
    const mainPage = document.getElementById('mainPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const subtitle = document.getElementById('dashboardSubtitle');

    if (!mainPage || !dashboardPage || !subtitle) {
        console.error('Dashboard elements not found');
        return;
    }

    mainPage.style.display = 'none';
    dashboardPage.style.display = 'block';
    subtitle.textContent = `Аналитика по услугам: ${selectedServices || 'Все'}`;
}

function backToMain() {
    console.log('backToMain called');
    const dashboardPage = document.getElementById('dashboardPage');
    const mainPage = document.getElementById('mainPage');

    if (!dashboardPage || !mainPage) {
        console.error('Dashboard elements not found');
        return;
    }

    dashboardPage.style.display = 'none';
    mainPage.style.display = 'block';
    document.getElementById('serviceKatanie').checked = false;
    document.getElementById('serviceVystavka').checked = false;
    serviceReports = [...serviceData];
    renderServiceReport();
}

function loadDashboardData(selectedServices) {
    console.log('Loading dashboard data for:', selectedServices);
    const filteredData = serviceReports.filter(report => !selectedServices || selectedServices.includes(report.serviceName));

    const totalServices = filteredData.length;
    const totalTicketsSold = filteredData.reduce((sum, r) => sum + r.tickets.reduce((s, t) => s + t.count, 0), 0);
    const totalRevenue = filteredData.reduce((sum, r) => sum + r.tickets.reduce((s, t) => s + t.amount, 0), 0);

    document.getElementById('totalServices').textContent = totalServices;
    document.getElementById('totalTicketsSold').textContent = totalTicketsSold;
    document.getElementById('totalRevenue').textContent = `${totalRevenue.toLocaleString('ru-RU')} ₸`;

    const servicesData = {};
    filteredData.forEach(r => { servicesData[r.serviceName] = (servicesData[r.serviceName] || 0) + r.tickets.reduce((s, t) => s + t.amount, 0); });
    new Chart(document.getElementById('servicesChart').getContext('2d'), {
        type: 'pie',
        data: {
            labels: Object.keys(servicesData),
            datasets: [{ data: Object.values(servicesData), backgroundColor: ['#ef4444', '#10b981'] }]
        },
        options: { responsive: true }
    });

    const revenueByDateData = {};
    filteredData.forEach(r => { revenueByDateData[r.eventDate] = (revenueByDateData[r.eventDate] || 0) + r.tickets.reduce((s, t) => s + t.amount, 0); });
    new Chart(document.getElementById('revenueByDateChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(revenueByDateData),
            datasets: [{ label: 'Сумма (₸)', data: Object.values(revenueByDateData), backgroundColor: '#6366f1' }]
        },
        options: { responsive: true }
    });
}

function exportToExcel() {
    console.log('Exporting to Excel');
    const table = document.getElementById('serviceTable');
    const wb = XLSX.utils.table_to_book(table, { sheet: "Реестр видов услуг" });
    XLSX.writeFile(wb, `Реестр_видов_услуг_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing service registry page');
    window.initializeServiceRegistryPage();
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => console.log('XLSX loaded');
    document.body.appendChild(script);
});