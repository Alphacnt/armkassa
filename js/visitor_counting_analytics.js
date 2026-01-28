/**
 * VISITOR COUNTING ANALYTICS - Дашборд анализа проходов посетителей
 * 
 * АРХИТЕКТУРА:
 * ============
 * 1. API слой: fetchFromBackend(), API_CONFIG
 * 2. Генератор данных: generatePassesData(), generateStatisticsData()
 * 3. DataModule: управление данными и фильтрацией
 * 4. RenderModule: рендеринг UI элементов
 * 5. ChartModule: создание и управление графиками
 * 6. AppModule: главное управление приложением
 * 
 * БЫСТРЫЙ СТАРТ С DJANGO БЭКЕНДОМ:
 * =================================
 * 
 * 1. Переключить режим:
 *    const API_CONFIG = { USE_MOCK_DATA: false, ... }
 * 
 * 2. Создать Django моделе (models.py):
 *    class VisitorPass(models.Model):
 *        object = ForeignKey(Object, ...)
 *        date = DateField()
 *        hour = IntegerField(0-23)
 *        entrance = IntegerField()
 *        exit = IntegerField()
 *        type = CharField('entrance'|'exit')
 * 
 * 3. Создать Django serializer (serializers.py):
 *    class VisitorPassSerializer(serializers.ModelSerializer):
 *        object_name = CharField(source='object.name')
 *        class Meta:
 *            model = VisitorPass
 *            fields = ['id', 'object_name', 'date', 'hour', 'entrance', 'exit']
 * 
 * 4. Создать Django ViewSet (views.py):
 *    class VisitorPassViewSet(viewsets.ReadOnlyModelViewSet):
 *        queryset = VisitorPass.objects.all()
 *        serializer_class = VisitorPassSerializer
 *        filter_backends = [DjangoFilterBackend]
 *        filterset_fields = ['date', 'object__id']
 * 
 * 5. Зарегистрировать URL (urls.py):
 *    router = DefaultRouter()
 *    router.register('visitor-passes', VisitorPassViewSet)
 *    urlpatterns = [..., path('api/', include(router.urls))]
 * 
 * СТРУКТУРА ОТВЕТОВ API:
 * =====================
 * 
 * GET /api/visitor-passes/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
 * Возвращает список проходов:
 * [
 *   {
 *     "id": 1,
 *     "object_name": "Мавзолей Ходжи Ахмеда Ясави",
 *     "date": "2026-01-01",
 *     "hour": 9,
 *     "entrance": 120,
 *     "exit": 115
 *   }
 * ]
 * 
 * ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ:
 * ====================
 * - API_CONFIG.BASE_URL - адрес Django API
 * - API_CONFIG.USE_MOCK_DATA - использовать мок данные (true/false)
 */

console.log('visitor_counting_analytics.js loaded at:', new Date().toISOString());

// === КОНФИГУРАЦИЯ API ===
// TODO: Обновить на реальный URL вашего Django бэкенда
const API_CONFIG = {
    USE_MOCK_DATA: true, // Переключите на false для использования реальных данных с бэкенда
    BASE_URL: 'http://localhost:8000/api', // Django API базовый URL
    ENDPOINTS: {
        PASSES: '/visitor-passes/', // GET запрос для получения всех проходов
        STATISTICS: '/visitor-statistics/', // GET запрос для статистики по объектам
        OBJECTS: '/objects/' // GET запрос для списка объектов
    }
};

// === ФУНКЦИИ ДЛЯ РАБОТЫ С БЭКЕНДОМ ===
/**
 * Получает данные с Django бэкенда
 * Ожидаемый формат ответа:
 * {
 *   "passes": [
 *     {
 *       "id": 1,
 *       "object": "Мавзолей Ходжи Ахмеда Ясави",
 *       "date": "2026-01-01",
 *       "hour": 9,
 *       "entrance": 120,
 *       "exit": 115,
 *       "type": "entrance"
 *     },
 *     ...
 *   ],
 *   "statistics": {
 *     "Мавзолей Ходжи Ахмеда Ясави": {
 *       "totalPasses": 8920,
 *       "entrance": 4520,
 *       "exit": 4400,
 *       "tickets": 4763,
 *       "peakHour": "9:00-10:00"
 *     },
 *     ...
 *   }
 * }
 */
async function fetchFromBackend(dateFrom, dateTo) {
    try {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);

        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PASSES}?${params}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // TODO: Добавить токен авторизации, если требуется
                    // 'Authorization': `Bearer ${authToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Ошибка при получении данных с бэкенда:', err);
        if (API_CONFIG.USE_MOCK_DATA) {
            console.warn('Используются мок данные вместо реальных');
            return null;
        }
        throw err;
    }
}

// === ДЕТЕРМИНИРОВАННЫЙ РАНДОМ (для мок данных) ===
const DeterministicRandom = (function () {
    let seed = 12345;
    function xorshift() {
        seed ^= seed << 13;
        seed ^= seed >> 17;
        seed ^= seed << 5;
        return (seed >>> 0) / 4294967295;
    }
    return {
        random() { return xorshift(); },
        int(min, max) { return Math.floor(xorshift() * (max - min + 1)) + min; },
        choice(arr) { return arr[Math.floor(xorshift() * arr.length)]; },
        reset() { seed = 12345; }
    };
})();

function el(id) {
    return document.getElementById(id) || null;
}

// === ФИКСИРОВАННЫЕ ДАННЫЕ (МОК) ===
/**
 * TODO: Заменить эту функцию на реальные данные с бэкенда
 * 
 * Структура данных из Django:
 * - Pass модель должна содержать: object_id, date, hour, entrance_count, exit_count
 * - Объект должен иметь: id, name, peak_hour
 * 
 * Пример Django сериализатора:
 * class VisitorPassSerializer(serializers.ModelSerializer):
 *     object = ObjectSerializer()
 *     class Meta:
 *         model = VisitorPass
 *         fields = ['id', 'object', 'date', 'hour', 'entrance', 'exit', 'type']
 * 
 * Пример Django view:
 * class VisitorPassListView(generics.ListAPIView):
 *     queryset = VisitorPass.objects.all()
 *     serializer_class = VisitorPassSerializer
 *     filter_backends = [DjangoFilterBackend]
 *     filterset_fields = ['date', 'object__id']
 */
function generateMockData() {
    // TODO: Когда будет готов бэкенд, замените эту функцию на:
    // return fetchFromBackend();
    
    return {
        passes: generatePassesData(),
        statistics: generateStatisticsData()
    };
}

/**
 * Генерирует мок данные проходов
 * TODO: Заменить на реальные данные с бэкенда
 * Ожидаемая структура с бэкенда:
 * [
 *   {
 *     "id": 1,
 *     "object": "Мавзолей Ходжи Ахмеда Ясави",
 *     "date": "2026-01-01",
 *     "hour": 9,
 *     "entrance": 120,
 *     "exit": 115,
 *     "type": "entrance"
 *   },
 *   ...
 * ]
 */
function generatePassesData() {
    DeterministicRandom.reset();

    // TODO: Генерируем данные за достаточно большой период 
    // (6 месяцев назад - 6 месяцев вперед)
    // чтобы пользователь мог выбрать любой период
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // 6 месяцев назад
    const endDate = new Date();
    
    // Вычисляем количество дней между датами
    const DAYS = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const objects = [
        'Мавзолей Ходжи Ахмеда Ясави',
        'Мавзолей Арыстан Баб',
        'Мавзолей Карахан',
        'Мавзолей Айша-Биби',
        'Музей-заповедник Отырар'
    ];

    const baseDailyPasses = {
        'Мавзолей Ходжи Ахмеда Ясави': 405,
        'Мавзолей Арыстан Баб': 280,
        'Мавзолей Карахан': 243,
        'Мавзолей Айша-Биби': 293,
        'Музей-заповедник Отырар': 250,
    };

    const peakHours = {
        'Мавзолей Ходжи Ахмеда Ясави': '9:00-10:00',
        'Мавзолей Арыстан Баб': '11:00-12:00',
        'Мавзолей Карахан': '10:00-11:00',
        'Мавзолей Айша-Биби': '14:00-15:00',
        'Музей-заповедник Отырар': '10:00-11:00'
    };

    const data = { byObject: {}, allPasses: [] };

    objects.forEach(obj => {
        data.byObject[obj] = {
            totalPasses: 0,
            entrance: 0,
            exit: 0,
            tickets: 0,
            byDate: {},
            byHour: Array(24).fill(0),
            peakHour: peakHours[obj],
            currentInside: 0
        };

        for (let day = 0; day < DAYS; day++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + day);
            const dateStr = date.toISOString().split('T')[0];

            const dailyPasses = Math.round(baseDailyPasses[obj] * (0.9 + DeterministicRandom.random() * 0.2));

            // Генерируем проходы по часам
            for (let hour = 6; hour <= 20; hour++) {
                let hourlyPasses;
                if (hour >= 8 && hour <= 11) {
                    hourlyPasses = Math.round(dailyPasses * 0.4 * DeterministicRandom.random());
                } else if (hour >= 12 && hour <= 16) {
                    hourlyPasses = Math.round(dailyPasses * 0.35 * DeterministicRandom.random());
                } else if (hour >= 17 && hour <= 20) {
                    hourlyPasses = Math.round(dailyPasses * 0.25 * DeterministicRandom.random());
                } else {
                    hourlyPasses = Math.round(dailyPasses * 0.05 * DeterministicRandom.random());
                }

                const entrance = Math.round(hourlyPasses * 0.52);
                const exit = hourlyPasses - entrance;

                data.byObject[obj].totalPasses += hourlyPasses;
                data.byObject[obj].entrance += entrance;
                data.byObject[obj].exit += exit;
                data.byObject[obj].byHour[hour] += entrance;

                if (!data.byObject[obj].byDate[dateStr]) {
                    data.byObject[obj].byDate[dateStr] = 0;
                }
                data.byObject[obj].byDate[dateStr] += hourlyPasses;

                data.allPasses.push({
                    object: obj,
                    date: dateStr,
                    hour: hour,
                    entrance: entrance,
                    exit: exit,
                    type: entrance > 0 ? 'entrance' : 'exit'
                });
            }
        }

        // Вычисляем билеты и текущее количество внутри
        // Билетов продано больше, чем активировано (entrance)
        // tickets = entrance / 0.95, то есть активировано ~95% от проданных
        data.byObject[obj].tickets = Math.round(data.byObject[obj].entrance / 0.95);
        data.byObject[obj].currentInside = data.byObject[obj].entrance - data.byObject[obj].exit;
    });

    console.log('Мок данные проходов готовы! Записей:', data.allPasses.length);
    return data.allPasses;
}

/**
 * Генерирует мок данные статистики по объектам
 * TODO: Заменить на реальные данные с бэкенда
 */
function generateStatisticsData() {
    const passes = generatePassesData();
    const statistics = {};
    
    const peakHours = {
        'Мавзолей Ходжи Ахмеда Ясави': '9:00-10:00',
        'Мавзолей Арыстан Баб': '11:00-12:00',
        'Мавзолей Карахан': '10:00-11:00',
        'Мавзолей Айша-Биби': '14:00-15:00',
        'Музей-заповедник Отырар': '10:00-11:00'
    };
    
    passes.forEach(p => {
        if (!statistics[p.object]) {
            statistics[p.object] = {
                totalPasses: 0,
                entrance: 0,
                exit: 0,
                tickets: 0,
                byDate: {},
                byHour: Array(24).fill(0),
                peakHour: peakHours[p.object] || '--:--',
                currentInside: 0
            };
        }
        
        statistics[p.object].totalPasses += p.entrance + p.exit;
        statistics[p.object].entrance += p.entrance;
        statistics[p.object].exit += p.exit;
        statistics[p.object].byHour[p.hour] += p.entrance;
    });
    
    Object.keys(statistics).forEach(obj => {
        statistics[obj].tickets = Math.round(statistics[obj].entrance / 0.95);
        statistics[obj].currentInside = statistics[obj].entrance - statistics[obj].exit;
    });
    
    return statistics;
}

// === ИНИЦИАЛИЗАЦИЯ ДАННЫХ ===
/**
 * Загружает данные либо с бэкенда, либо использует мок данные
 * TODO: Обновить эту функцию после готовности бэкенда
 */
const PrecomputedData = (function () {
    let data;
    
    if (API_CONFIG.USE_MOCK_DATA) {
        console.log('Используются мок данные');
        data = generateMockData();
    } else {
        console.log('Попытка загрузить данные с бэкенда...');
        // TODO: Данные будут загружены из бэкенда
        // data = fetchFromBackend(); // Асинхронный вызов
    }
    
    return {
        allPasses: data.passes,
        byObject: data.statistics
    };
})();

// === МОДУЛЬ ДАННЫХ ===
/**
 * DataModule управляет данными и фильтрацией
 * 
 * TODO: При подключении бэкенда обновить:
 * - fetchPassesData() должна загружать данные с API
 * - filterData() должна отправлять запрос на сервер с параметрами фильтрации
 * - Добавить кэширование данных на клиенте для оптимизации
 */
const DataModule = {
    passesData: PrecomputedData.allPasses,
    filteredData: [],
    byObjectCache: PrecomputedData.byObject,

    /**
     * Загружает данные с бэкенда или использует кэшированные данные
     * TODO: Заменить на реальный запрос к API:
     * async fetchPassesData() {
     *     try {
     *         const data = await fetchFromBackend();
     *         this.passesData = data.passes;
     *         this.byObjectCache = data.statistics;
     *         this.filteredData = [...this.passesData];
     *     } catch (err) {
     *         console.error('Ошибка загрузки данных:', err);
     *     }
     * }
     */
    async fetchPassesData() {
        this.filteredData = [...this.passesData];
    },

    /**
     * Фильтрует данные по датам и объекту
     * TODO: Перенести фильтрацию на бэкенд для больших объемов данных:
     * filterData({ dateFrom, dateTo, objectName }) {
     *     const params = { date_from: dateFrom, date_to: dateTo, object: objectName };
     *     fetchFromBackend(params).then(data => {
     *         this.filteredData = data.passes;
     *     });
     * }
     */

    filterData({ dateFrom, dateTo, objectName }) {
        this.filteredData = this.passesData.filter(p => {
            const matchDate = (!dateFrom || p.date >= dateFrom) && (!dateTo || p.date <= dateTo);
            const matchObject = !objectName || objectName === 'all' || p.object === objectName;
            return matchDate && matchObject;
        });
    },

    aggregateByObject(data = this.filteredData) {
        if (!data.length || (data.length === this.passesData.length && Object.keys(this.byObjectCache).length > 0)) {
            return this.byObjectCache;
        }

        const result = {};
        data.forEach(p => {
            if (!result[p.object]) {
                result[p.object] = {
                    totalPasses: 0,
                    entrance: 0,
                    exit: 0,
                    tickets: 0,
                    byDate: {},
                    byHour: Array(24).fill(0),
                    peakHour: this.byObjectCache[p.object]?.peakHour || '–',
                    currentInside: 0
                };
            }

            const passes = p.entrance + p.exit;
            result[p.object].totalPasses += passes;
            result[p.object].entrance += p.entrance;
            result[p.object].exit += p.exit;
            result[p.object].byHour[p.hour] += p.entrance;

            if (!result[p.object].byDate[p.date]) {
                result[p.object].byDate[p.date] = 0;
            }
            result[p.object].byDate[p.date] += passes;
        });

        Object.keys(result).forEach(obj => {
            result[obj].tickets = Math.round(result[obj].entrance / 0.95);
            result[obj].currentInside = result[obj].entrance - result[obj].exit;
        });

        return result;
    }
};

// === МОДУЛЬ РЕНДЕРИНГА ===
const RenderModule = {
    formatNumber(num) {
        return new Intl.NumberFormat('ru-RU').format(num);
    },

    formatDate(dateString) {
        return dateString ? new Date(dateString).toLocaleDateString('ru-RU') : '–';
    },

    updateStatsCards(data, isSingleObject = false) {
        const objects = DataModule.aggregateByObject(data);
        const totalPasses = Object.values(objects).reduce((s, o) => s + o.totalPasses, 0);
        const totalTickets = Object.values(objects).reduce((s, o) => s + o.tickets, 0);
        
        // Вычисляем количество дней в данных
        const uniqueDates = new Set(data.map(p => p.date));
        const days = uniqueDates.size || 1;
        const avgDailyFlow = Math.round(totalPasses / days);

        if (el('totalObjects')) el('totalObjects').textContent = isSingleObject ? '1' : Object.keys(objects).length;
        if (el('totalObjectsLabel')) el('totalObjectsLabel').textContent = isSingleObject ? 'Выбранный объект' : 'Всего объектов';
        if (el('totalPasses')) el('totalPasses').textContent = this.formatNumber(totalPasses);
        if (el('totalTickets')) el('totalTickets').textContent = this.formatNumber(totalTickets);
        if (el('avgDailyFlow')) el('avgDailyFlow').textContent = this.formatNumber(avgDailyFlow);
    },

    renderDetailedStatsTable(data) {
        const tbody = el('detailedStatsTable');
        if (!tbody) return;
        tbody.innerHTML = '';

        const objects = DataModule.aggregateByObject(data);
        const uniqueDates = new Set(data.map(p => p.date));
        const days = uniqueDates.size || 1;

        let totalPasses = 0, totalEntrance = 0, totalExit = 0, totalTickets = 0;

        Object.entries(objects).forEach(([obj, stats]) => {
            const avgDailyFlow = Math.round(stats.totalPasses / days);
            // Процент активированных билетов: (Вход / Билеты) * 100
            const utilizationRate = ((stats.entrance / stats.tickets) * 100).toFixed(1);

            totalPasses += stats.totalPasses;
            totalEntrance += stats.entrance;
            totalExit += stats.exit;
            totalTickets += stats.tickets;

            let badgeClass = 'bg-success text-white';
            if (parseFloat(utilizationRate) < 95) badgeClass = 'bg-warning text-dark';
            if (parseFloat(utilizationRate) < 90) badgeClass = 'bg-danger text-white';

            const row = `
                <tr class="border-t border-gray-200 hover-bg-gray-50">
                    <td class="px-3 py-2 text-sm font-medium">${obj}</td>
                    <td class="px-3 py-2 text-sm text-center fw-bold">${this.formatNumber(stats.totalPasses)}</td>
                    <td class="px-3 py-2 text-sm text-center">${this.formatNumber(stats.entrance)}</td>
                    <td class="px-3 py-2 text-sm text-center">${this.formatNumber(stats.exit)}</td>
                    <td class="px-3 py-2 text-sm text-center">${this.formatNumber(stats.tickets)}</td>
                    <td class="px-3 py-2 text-sm text-center">${avgDailyFlow}</td>
                    <td class="px-3 py-2 text-sm text-center">${stats.peakHour}</td>
                    <td class="px-3 py-2 text-sm text-center">
                        <span class="badge ${badgeClass}">${utilizationRate}%</span>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

        // Итоговая строка с общим процентом активации
        const totalUtilizationRate = ((totalEntrance / totalTickets) * 100).toFixed(1);
        const totalRow = `
            <tr class="border-t-2 bg-light fw-bold">
                <td class="px-3 py-2 text-sm">ИТОГО</td>
                <td class="px-3 py-2 text-sm text-center">${this.formatNumber(totalPasses)}</td>
                <td class="px-3 py-2 text-sm text-center">${this.formatNumber(totalEntrance)}</td>
                <td class="px-3 py-2 text-sm text-center">${this.formatNumber(totalExit)}</td>
                <td class="px-3 py-2 text-sm text-center">${this.formatNumber(totalTickets)}</td>
                <td class="px-3 py-2 text-sm text-center">${Math.round(totalPasses / days)}</td>
                <td class="px-3 py-2 text-sm text-center">—</td>
                <td class="px-3 py-2 text-sm text-center"><span class="badge bg-primary">${totalUtilizationRate}%</span></td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', totalRow);
    },

    renderCurrentInsideCards(data) {
        const container = el('currentInsideContainer');
        if (!container) return;
        container.innerHTML = '';

        const objects = DataModule.aggregateByObject(data);
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];
        const isSingleObject = Object.keys(objects).length === 1;

        Object.entries(objects).forEach(([obj, stats], idx) => {
            const color = colors[idx % colors.length];
            const colClass = isSingleObject ? 'col-md-6 mx-auto' : 'col-md-6';
            const fontSize = isSingleObject ? 'fs-1' : 'fs-2';
            const card = `
                <div class="${colClass}">
                    <div class="border rounded p-4 text-center" style="transition: box-shadow 0.3s;">
                        <div class="fw-medium text-muted mb-2" style="${isSingleObject ? 'font-size: 1.1rem;' : ''}">${obj}</div>
                        <div class="${fontSize} fw-bold mb-2" style="color: ${color};">
                            ${this.formatNumber(stats.currentInside)}
                        </div>
                        <div class="text-muted" style="${isSingleObject ? 'font-size: 1rem;' : ''}">внутри</div>
                        <div class="mt-3 pt-3 border-top d-flex justify-content-between" style="${isSingleObject ? 'font-size: 1rem;' : ''}">
                            <span class="text-success">↑ ${this.formatNumber(stats.entrance)}</span>
                            <span class="text-danger">↓ ${this.formatNumber(stats.exit)}</span>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        });
    },

    updateDashboardSubtitle(objectName, dateFrom, dateTo) {
        const title = objectName || 'Сводная аналитика по проходам';
        if (el('subtitleText')) el('subtitleText').textContent = title;
        if (el('dateFrom')) el('dateFrom').value = dateFrom || '';
        if (el('dateTo')) el('dateTo').value = dateTo || '';
    }
};

// === МОДУЛЬ ГРАФИКОВ ===
const ChartModule = {
    charts: {},

    destroyCharts() {
        Object.values(this.charts).forEach(c => c?.destroy());
        this.charts = {};
    },

    createObjectPassesChart(data) {
        const canvas = el('objectPassesChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const objects = DataModule.aggregateByObject(data);
        const labels = Object.keys(objects);
        const entranceData = Object.values(objects).map(o => o.entrance);
        const exitData = Object.values(objects).map(o => o.exit);

        this.charts.objectPassesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Вход',
                        data: entranceData,
                        backgroundColor: '#10B981',
                        borderColor: '#059669'
                    },
                    {
                        label: 'Выход',
                        data: exitData,
                        backgroundColor: '#EF4444',
                        borderColor: '#DC2626'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },

    createHourlyPassesChart(data) {
        const canvas = el('hourlyPassesChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const hourly = Array(24).fill(0);
        data.forEach(p => {
            hourly[p.hour] += p.entrance;
        });

        const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const values = hourly.map((v, i) => i >= 6 && i <= 20 ? v : 0);

        this.charts.hourlyPassesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Проходы',
                    data: values,
                    backgroundColor: '#F59E0B',
                    borderColor: '#D97706'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            }
        });
    },

    createDayPartChart(data) {
        const canvas = el('dayPartChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const morning = data.filter(p => p.hour >= 8 && p.hour <= 11).reduce((s, p) => s + p.entrance, 0);
        const afternoon = data.filter(p => p.hour >= 12 && p.hour <= 16).reduce((s, p) => s + p.entrance, 0);
        const evening = data.filter(p => p.hour >= 17 && p.hour <= 20).reduce((s, p) => s + p.entrance, 0);

        this.charts.dayPartChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Утро (8-11)', 'День (12-16)', 'Вечер (17-20)'],
                datasets: [{
                    data: [morning, afternoon, evening],
                    backgroundColor: ['#4F46E5', '#10B981', '#F59E0B'],
                    borderColor: ['#4338CA', '#059669', '#D97706']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: ctx => {
                                const total = morning + afternoon + evening;
                                const percent = ((ctx.parsed / total) * 100).toFixed(0);
                                return `${ctx.label}: ${percent}%`;
                            }
                        }
                    }
                }
            }
        });
    },

    createDailyPassesChart(data) {
        const canvas = el('dailyPassesChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const byDate = {};
        data.forEach(p => {
            byDate[p.date] = (byDate[p.date] || 0) + p.entrance + p.exit;
        });

        const sorted = Object.keys(byDate).sort();
        const values = sorted.map(d => byDate[d]);

        this.charts.dailyPassesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sorted.map(d => RenderModule.formatDate(d)),
                datasets: [{
                    label: 'Проходы',
                    data: values,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#059669',
                    pointRadius: 3,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { ticks: { maxRotation: 45, minRotation: 45 } }
                }
            }
        });
    }
};

// === МОДУЛЬ УПРАВЛЕНИЯ (AppModule) ===
/**
 * AppModule управляет инициализацией и жизненным циклом приложения
 * 
 * TODO: При интеграции с Django бэкендом:
 * 1. Обновить initialize() для асинхронной загрузки данных
 * 2. Добавить обработку ошибок при загрузке
 * 3. Показывать индикатор загрузки (loader)
 * 4. Реализовать retry логику в случае сбоя
 */
const AppModule = {
    isInitialized: false,
    currentObject: null,

    async initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        await DataModule.fetchPassesData();
        this.bindEventListeners();
        this.setDefaultFilters();
        this.showDashboard();
    },

    bindEventListeners() {
        el('dateFrom')?.addEventListener('change', () => this.handleFilter());
        el('dateTo')?.addEventListener('change', () => this.handleFilter());
        el('objectSelect')?.addEventListener('change', () => this.handleFilter());
        el('exportTableBtn')?.addEventListener('click', () => this.handleExportToExcel());
    },

    setDefaultFilters() {
        const endDate = new Date(); // Сегодня
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1); // Месяц назад
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        if (el('dateFrom')) el('dateFrom').value = startDateStr;
        if (el('dateTo')) el('dateTo').value = endDateStr;
    },

    handleFilter() {
        const dateFrom = el('dateFrom')?.value || '';
        const dateTo = el('dateTo')?.value || '';
        const objectName = el('objectSelect')?.value || 'all';

        DataModule.filterData({ dateFrom, dateTo, objectName });
        this.showDashboard(objectName === 'all' ? null : objectName);
    },

    showDashboard(objectName = null) {
        this.currentObject = objectName;
        const isSingle = !!objectName;
        const data = isSingle ? DataModule.filteredData.filter(p => p.object === objectName) : DataModule.filteredData;

        if (el('dashboardPage')) el('dashboardPage').style.display = 'block';

        let dateFrom = '', dateTo = '';
        if (data.length) {
            const dates = data.map(p => p.date).sort();
            dateFrom = dates[0];
            dateTo = dates[dates.length - 1];
        }

        RenderModule.updateDashboardSubtitle(objectName, dateFrom, dateTo);
        RenderModule.updateStatsCards(data, isSingle);
        RenderModule.renderDetailedStatsTable(data);
        RenderModule.renderCurrentInsideCards(data);

        ChartModule.destroyCharts();
        ChartModule.createObjectPassesChart(data);
        ChartModule.createHourlyPassesChart(data);
        ChartModule.createDayPartChart(data);
        ChartModule.createDailyPassesChart(data);
    },

    handleExportToExcel() {
        const table = document.querySelector('table');
        if (!table) {
            console.error('Table not found');
            alert('Таблица не найдена');
            return;
        }

        if (typeof XLSX === 'undefined') {
            console.error('XLSX library is not loaded');
            alert('Библиотека для экспорта еще загружается. Попробуйте через секунду');
            return;
        }

        try {
            const ws = XLSX.utils.table_to_sheet(table);
            
            // Получаем диапазон данных
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            // Добавляем жирный шрифт к заголовкам (первая строка)
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                if (ws[cellAddress]) {
                    if (!ws[cellAddress].s) ws[cellAddress].s = {};
                    ws[cellAddress].s.font = { bold: true };
                }
            }
            
            // Добавляем жирный шрифт к строке ИТОГО (последняя строка)
            const lastRow = range.e.r;
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: lastRow, c: col });
                if (ws[cellAddress]) {
                    if (!ws[cellAddress].s) ws[cellAddress].s = {};
                    ws[cellAddress].s.font = { bold: true };
                }
            }
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Статистика');

            const fileName = `Статистика_подсчета_посетителей_${new Date().toLocaleDateString('ru-RU')}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (err) {
            console.error('Export error:', err);
            alert('Ошибка при экспорте: ' + err.message);
        }
    }
};

// === ИНИЦИАЛИЗАЦИЯ ===
/**
 * ТОЧКА ВХОДА В ПРИЛОЖЕНИЕ
 * 
 * TODO: Интеграция с Django бэкендом:
 * 
 * 1. Переключить API_CONFIG.USE_MOCK_DATA на false
 * 2. Обновить API_CONFIG.BASE_URL на адрес вашего Django сервера
 * 3. Создать Django REST API endpoints:
 *    - GET /api/visitor-passes/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&object=<id>
 *    - GET /api/visitor-statistics/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
 *    - GET /api/objects/ (для получения списка объектов)
 * 
 * 4. Обновить функции:
 *    - fetchFromBackend() - реализовать полностью
 *    - DataModule.fetchPassesData() - вызывать API
 *    - DataModule.filterData() - отправлять параметры на сервер
 * 
 * 5. Добавить обработку ошибок и индикаторы загрузки
 */
document.addEventListener('DOMContentLoaded', () => {
    AppModule.initialize().catch(err => console.error('Init error:', err));
});