console.log('sessions.js loaded successfully at:', new Date().toISOString());

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, checking for initializeSessionsPage');

    if (typeof window.initializeSessionsPage === 'function') {
        console.log('Calling initializeSessionsPage from DOMContentLoaded');
        window.initializeSessionsPage();
    } else {
        console.error('initializeSessionsPage not found, retrying in 500ms');
        setTimeout(() => {
            if (typeof window.initializeSessionsPage === 'function') {
                console.log('Retry successful, calling initializeSessionsPage');
                window.initializeSessionsPage();
            } else {
                console.error('initializeSessionsPage still not found');
            }
        }, 500);
    }
});

window.initializeSessionsPage = function() {
    try {
        console.log('initializeSessionsPage called at:', new Date().toISOString());
        console.log('Checking if Bootstrap is available:', !!window.bootstrap);

        if (!window.bootstrap || !window.bootstrap.Modal) {
            console.error('Bootstrap or Modal not loaded, retrying in 500ms');
            setTimeout(window.initializeSessionsPage, 500);
            return;
        }

        // Собираем все DOM-элементы
        const elements = {
            sessionsTable: document.getElementById('sessionsTable'),
            selectAll: document.getElementById('selectAll'),
            newSessionBtn: document.getElementById('newSessionBtn'),
            deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
            newSessionForm: document.getElementById('newSessionForm'),
            editSessionForm: document.getElementById('editSessionForm'),
            createSessionBtn: document.getElementById('createSessionBtn'),
            saveEditBtn: document.getElementById('saveEditBtn'),
            confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
            newSessionModal: document.getElementById('newSessionModal'),
            editSessionModal: document.getElementById('editSessionModal'),
            deleteSessionModal: document.getElementById('deleteSessionModal'),
            toastContainer: document.querySelector('.toast-container'),
            newName: document.getElementById('newName'),
            newEventTemplate: document.getElementById('newEventTemplate'),
            newStartDate: document.getElementById('newStartDate'),
            newEndDate: document.getElementById('newEndDate'),
            newTicketCount: document.getElementById('newTicketCount'),
            editName: document.getElementById('editName'),
            editEventTemplate: document.getElementById('editEventTemplate'),
            editStartDate: document.getElementById('editStartDate'),
            editEndDate: document.getElementById('editEndDate'),
            editTicketCount: document.getElementById('editTicketCount'),
            deleteSessionId: document.getElementById('deleteSessionId')
        };

        // Логируем наличие элементов
        console.log('DOM elements status:', Object.entries(elements).map(([key, el]) => `${key}: ${!!el}`));

        // Проверяем критические элементы
        const requiredElements = ['sessionsTable', 'newSessionBtn', 'newSessionForm', 'createSessionBtn', 'newSessionModal', 'editSessionModal', 'deleteSessionModal', 'toastContainer'];
        for (const key of requiredElements) {
            if (!elements[key]) {
                console.error(`Critical element ${key} not found`);
                return;
            }
        }

        // Инициализируем модальные окна
        const newSessionModal = new bootstrap.Modal(elements.newSessionModal, { backdrop: 'static' });
        const editSessionModal = new bootstrap.Modal(elements.editSessionModal, { backdrop: 'static' });
        const deleteSessionModal = new bootstrap.Modal(elements.deleteSessionModal, { backdrop: 'static' });
        let currentSessionId = null;
        let tempTimes = []; // Временное состояние для времени

        // Загрузка событий для выпадающего списка
        const loadEvents = (selectElementId) => {
            const eventTemplate = document.getElementById(selectElementId);
            if (!eventTemplate) {
                console.error(`${selectElementId} not found`);
                return;
            }
            const events = JSON.parse(localStorage.getItem('events')) || [];
            console.log('Events from localStorage:', events);
            eventTemplate.innerHTML = '<option value="">Выберите мероприятие</option>';
            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = event.name;
                eventTemplate.appendChild(option);
            });
        };

        // Загрузка и рендеринг сеансов
        const loadSessions = () => {
            const sessions = JSON.parse(localStorage.getItem('sessions')) || [];
            console.log('Sessions from localStorage:', sessions);
            renderSessions(sessions);
        };

        // Рендеринг таблицы
        const renderSessions = (sessions) => {
            elements.sessionsTable.innerHTML = '';
            sessions.forEach(session => {
                const timesDisplay = session.times && session.times.length > 0
                    ? session.times.map(t => `${t.startTime}-${t.endTime}`).join(', ')
                    : '-';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="session-checkbox" data-id="${session.id}"></td>
                    <td>${session.id}</td>
                    <td>${session.name}</td>
                    <td>${new Date(session.startDate).toLocaleDateString('ru-RU')}</td>
                    <td>${new Date(session.endDate).toLocaleDateString('ru-RU')}</td>
                    <td>${timesDisplay}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${session.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${session.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                elements.sessionsTable.appendChild(row);
            });
            console.log(`Rendered ${sessions.length} sessions`);
            updateDeleteButtonState();
            bindCheckboxEvents();
            bindActionButtons();
        };

        // Обновление состояния кнопки удаления
        const updateDeleteButtonState = () => {
            if (elements.deleteSelectedBtn) {
                const checkedBoxes = document.querySelectorAll('.session-checkbox:checked');
                elements.deleteSelectedBtn.disabled = checkedBoxes.length === 0;
                console.log(`Delete button state: disabled=${elements.deleteSelectedBtn.disabled}`);
            }
        };

        // Привязка событий для чекбоксов
        const bindCheckboxEvents = () => {
            document.querySelectorAll('.session-checkbox').forEach(cb => {
                cb.addEventListener('change', updateDeleteButtonState);
            });
            if (elements.selectAll) {
                elements.selectAll.addEventListener('change', () => {
                    document.querySelectorAll('.session-checkbox').forEach(cb => {
                        cb.checked = elements.selectAll.checked;
                    });
                    updateDeleteButtonState();
                });
            }
        };

        // Привязка событий для кнопок действий
        const bindActionButtons = () => {
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(btn.dataset.id);
                    console.log(`Edit button clicked for session ID: ${id}`);
                    editSession(id);
                });
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    currentSessionId = parseInt(btn.dataset.id);
                    console.log(`Delete button clicked for session ID: ${currentSessionId}`);
                    showDeleteModal();
                });
            });
        };

        // Загрузка временных интервалов
        const loadTimes = (containerId, times = []) => {
            const container = document.getElementById(containerId);
            container.innerHTML = `
                <div class="mb-3">
                    <label class="form-label">Время сеанса <span class="text-danger">*</span></label>
                    <div class="row g-2">
                        <div class="col-auto">
                            <input type="time" class="form-control" id="${containerId}StartTime">
                        </div>
                        <div class="col-auto">
                            <input type="time" class="form-control" id="${containerId}EndTime">
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-primary" onclick="addTime('${containerId}')">Добавить время</button>
                        </div>
                    </div>
                    <div id="${containerId}SelectedTimes" class="mt-3"></div>
                </div>
            `;
            renderSelectedTimes(containerId, times);
        };

        // Рендеринг выбранных временных интервалов
        const renderSelectedTimes = (containerId, times) => {
            const selectedTimesDiv = document.getElementById(`${containerId}SelectedTimes`);
            selectedTimesDiv.innerHTML = '';
            if (times.length === 0) {
                selectedTimesDiv.innerHTML = '<p class="text-muted">Нет добавленных временных интервалов.</p>';
                return;
            }
            times.forEach((time, index) => {
                const div = document.createElement('div');
                div.className = 'd-flex justify-content-between align-items-center mb-2 p-2 border rounded';
                div.innerHTML = `
                    <span>${time.startTime} - ${time.endTime}</span>
                    <button class="btn btn-sm btn-danger" onclick="removeTime('${containerId}', ${index})"><i class="bi bi-trash"></i></button>
                `;
                selectedTimesDiv.appendChild(div);
            });
        };

        // Добавление времени
        window.addTime = (containerId) => {
            const startTime = document.getElementById(`${containerId}StartTime`).value;
            const endTime = document.getElementById(`${containerId}EndTime`).value;
            if (!startTime || !endTime) {
                showToast('Выберите время начала и окончания!', 'danger');
                return;
            }
            if (startTime >= endTime) {
                showToast('Время окончания должно быть позже времени начала!', 'danger');
                return;
            }
            tempTimes.push({ startTime, endTime });
            renderSelectedTimes(containerId, tempTimes);
            document.getElementById(`${containerId}StartTime`).value = '';
            document.getElementById(`${containerId}EndTime`).value = '';
        };

        // Удаление времени
        window.removeTime = (containerId, index) => {
            tempTimes.splice(index, 1);
            renderSelectedTimes(containerId, tempTimes);
        };

        // Показать модальное окно создания
        elements.newSessionBtn.addEventListener('click', () => {
            console.log('New session button clicked');
            elements.newSessionForm.reset();
            document.querySelectorAll('input[name="days"]').forEach(cb => cb.checked = false);
            document.getElementById('newSessionModalLabel').textContent = 'Создать сеанс';
            loadEvents('newEventTemplate');
            tempTimes = [];
            loadTimes('newTimesContainer', tempTimes);
            newSessionModal.show();
        });

        // Создание сеанса
        elements.createSessionBtn.addEventListener('click', () => {
            console.log('Create session button clicked');
            if (!elements.newSessionForm.checkValidity()) {
                console.log('Form validation failed');
                elements.newSessionForm.reportValidity();
                return;
            }
            const name = elements.newName.value;
            const eventId = parseInt(elements.newEventTemplate.value);
            const startDate = elements.newStartDate.value;
            const endDate = elements.newEndDate.value;
            const ticketCount = parseInt(elements.newTicketCount.value);
            const days = Array.from(document.querySelectorAll('input[name="days"]:checked')).map(cb => cb.value);

            console.log('New session data:', { name, eventId, startDate, endDate, ticketCount, days, times: tempTimes });

            if (isNaN(eventId)) {
                showToast('Выберите мероприятие', 'danger');
                return;
            }
            if (!startDate || !endDate) {
                showToast('Выберите даты начала и окончания!', 'danger');
                return;
            }
            if (new Date(startDate) > new Date(endDate)) {
                showToast('Дата окончания должна быть не раньше даты начала', 'danger');
                return;
            }
            if (ticketCount < 1) {
                showToast('Количество билетов должно быть больше 0', 'danger');
                return;
            }
            if (tempTimes.length === 0) {
                showToast('Добавьте хотя бы один временной интервал!', 'danger');
                return;
            }

            let sessions = JSON.parse(localStorage.getItem('sessions')) || [];
            const id = sessions.length ? Math.max(...sessions.map(s => s.id)) + 1 : 1;
            sessions.push({ id, name, eventId, startDate, endDate, ticketCount, days, times: [...tempTimes] });
            localStorage.setItem('sessions', JSON.stringify(sessions));
            newSessionModal.hide();
            tempTimes = [];
            loadSessions();
            showToast('Сеанс создан успешно!', 'success');
        });

        // Редактирование сеанса
        const editSession = (id) => {
            console.log(`Editing session ID: ${id}`);
            const sessions = JSON.parse(localStorage.getItem('sessions')) || [];
            const session = sessions.find(s => s.id === id);
            if (session) {
                currentSessionId = id;
                elements.editName.value = session.name;
                elements.editEventTemplate.value = session.eventId;
                elements.editStartDate.value = session.startDate;
                elements.editEndDate.value = session.endDate;
                elements.editTicketCount.value = session.ticketCount;
                document.querySelectorAll('input[name="editDays"]').forEach(cb => {
                    cb.checked = session.days.includes(cb.value);
                });
                tempTimes = [...(session.times || [])];
                loadEvents('editEventTemplate');
                loadTimes('editTimesContainer', tempTimes);
                editSessionModal.show();
            }
        };

        // Сохранение изменений
        elements.saveEditBtn.addEventListener('click', () => {
            console.log('Save edit button clicked');
            if (!elements.editSessionForm.checkValidity()) {
                console.log('Edit form validation failed');
                elements.editSessionForm.reportValidity();
                return;
            }
            const name = elements.editName.value;
            const eventId = parseInt(elements.editEventTemplate.value);
            const startDate = elements.editStartDate.value;
            const endDate = elements.editEndDate.value;
            const ticketCount = parseInt(elements.editTicketCount.value);
            const days = Array.from(document.querySelectorAll('input[name="editDays"]:checked')).map(cb => cb.value);

            console.log('Edited session data:', { name, eventId, startDate, endDate, ticketCount, days, times: tempTimes });

            if (isNaN(eventId)) {
                showToast('Выберите мероприятие', 'danger');
                return;
            }
            if (!startDate || !endDate) {
                showToast('Выберите даты начала и окончания!', 'danger');
                return;
            }
            if (new Date(startDate) > new Date(endDate)) {
                showToast('Дата окончания должна быть не раньше даты начала', 'danger');
                return;
            }
            if (ticketCount < 1) {
                showToast('Количество билетов должно быть больше 0', 'danger');
                return;
            }
            if (tempTimes.length === 0) {
                showToast('Добавьте хотя бы один временной интервал!', 'danger');
                return;
            }

            let sessions = JSON.parse(localStorage.getItem('sessions')) || [];
            sessions = sessions.map(session =>
                session.id === currentSessionId ? { id: currentSessionId, name, eventId, startDate, endDate, ticketCount, days, times: [...tempTimes] } : session
            );
            localStorage.setItem('sessions', JSON.stringify(sessions));
            editSessionModal.hide();
            currentSessionId = null;
            tempTimes = [];
            loadSessions();
            showToast('Сеанс обновлён успешно!', 'success');
        });

        // Показать модальное окно удаления
        const showDeleteModal = () => {
            console.log('Showing delete modal for session ID:', currentSessionId);
            elements.deleteSessionId.textContent = currentSessionId;
            deleteSessionModal.show();
        };

        // Подтверждение удаления одного сеанса
        elements.confirmDeleteBtn.addEventListener('click', () => {
            console.log('Confirm delete button clicked for session ID:', currentSessionId);
            let sessions = JSON.parse(localStorage.getItem('sessions')) || [];
            sessions = sessions.filter(s => s.id !== currentSessionId);
            localStorage.setItem('sessions', JSON.stringify(sessions));
            deleteSessionModal.hide();
            currentSessionId = null;
            loadSessions();
            showToast('Сеанс удалён успешно!', 'success');
        });

        // Удаление выбранных сеансов
        if (elements.deleteSelectedBtn) {
            elements.deleteSelectedBtn.addEventListener('click', () => {
                const selectedIds = Array.from(document.querySelectorAll('.session-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
                console.log('Deleting selected sessions:', selectedIds);
                if (selectedIds.length > 0) {
                    let sessions = JSON.parse(localStorage.getItem('sessions')) || [];
                    sessions = sessions.filter(s => !selectedIds.includes(s.id));
                    localStorage.setItem('sessions', JSON.stringify(sessions));
                    loadSessions();
                    showToast('Выбранные сеансы удалены!', 'success');
                }
            });
        }

        // Показ уведомления
        const showToast = (message, type) => {
            console.log(`Showing toast: ${message} (${type})`);
            if (!elements.toastContainer) {
                console.error('Toast container not found');
                return;
            }
            const toast = document.createElement('div');
            toast.className = `toast align-items-center text-white bg-${type} border-0`;
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;
            elements.toastContainer.appendChild(toast);
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            setTimeout(() => toast.remove(), 3000);
        };

        // Инициализация
        console.log('Initializing sessions page');
        loadEvents('newEventTemplate');
        loadEvents('editEventTemplate');
        loadSessions();
    } catch (error) {
        console.error('Error in initializeSessionsPage:', error);
    }
};