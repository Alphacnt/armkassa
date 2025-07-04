document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('events.js: DOMContentLoaded fired');

        // Проверяем наличие необходимых элементов
        const newEventModalEl = document.getElementById('newEventModal');
        const editEventModalEl = document.getElementById('editEventModal');
        const deleteEventModalEl = document.getElementById('deleteEventModal');
        const eventsTable = document.getElementById('eventsTable');
        const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

        if (!newEventModalEl || !editEventModalEl || !deleteEventModalEl || !eventsTable || !deleteSelectedBtn) {
            console.error('events.js: One or more critical elements are missing. Aborting initialization.');
            return;
        }

        // Инициализация Bootstrap модальных окон
        const newEventModal = new bootstrap.Modal(newEventModalEl, { backdrop: 'static' });
        const editEventModal = new bootstrap.Modal(editEventModalEl, { backdrop: 'static' });
        const deleteEventModal = new bootstrap.Modal(deleteEventModalEl, { backdrop: 'static' });

        let events = JSON.parse(localStorage.getItem('events')) || [];
        let services = JSON.parse(localStorage.getItem('services')) || [];
        let tempServiceIds = [];

        // Сохраняем мероприятия в localStorage
        function saveEvents() {
            localStorage.setItem('events', JSON.stringify(events));
        }

        // Рендерим мероприятия при загрузке страницы
        renderEvents();

        // Настройка drag-and-drop для нового логотипа
        const newLogoDropzone = document.getElementById('newLogoDropzone');
        const newLogoInput = document.getElementById('newLogoInput');
        if (newLogoDropzone && newLogoInput) {
            newLogoDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                newLogoDropzone.classList.add('border-primary');
            });
            newLogoDropzone.addEventListener('dragleave', () => {
                newLogoDropzone.classList.remove('border-primary');
            });
            newLogoDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                newLogoDropzone.classList.remove('border-primary');
                const file = e.dataTransfer.files[0];
                handleLogo(file, 'new');
            });
            newLogoInput.addEventListener('change', () => {
                const file = newLogoInput.files[0];
                handleLogo(file, 'new');
            });
        }

        // Настройка drag-and-drop для редактирования логотипа
        const editLogoDropzone = document.getElementById('editLogoDropzone');
        const editLogoInput = document.getElementById('editLogoInput');
        if (editLogoDropzone && editLogoInput) {
            editLogoDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                editLogoDropzone.classList.add('border-primary');
            });
            editLogoDropzone.addEventListener('dragleave', () => {
                editLogoDropzone.classList.remove('border-primary');
            });
            editLogoDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                editLogoDropzone.classList.remove('border-primary');
                const file = e.dataTransfer.files[0];
                handleLogo(file, 'edit');
            });
            editLogoInput.addEventListener('change', () => {
                const file = editLogoInput.files[0];
                handleLogo(file, 'edit');
            });
        }

        // Обработка загрузки логотипа
        function handleLogo(file, mode) {
            if (file && ['image/jpeg', 'image/png'].includes(file.type)) {
                const reader = new FileReader();
                reader.onload = () => {
                    const preview = document.getElementById(`${mode}LogoPreview`);
                    const image = document.getElementById(`${mode}LogoImage`);
                    if (preview && image) {
                        image.src = reader.result;
                        preview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            } else {
                showToast('Поддерживаются только файлы JPEG и PNG!', 'danger');
            }
        }

        // Очистка нового логотипа
        window.clearNewLogo = () => {
            const input = document.getElementById('newLogoInput');
            const preview = document.getElementById('newLogoPreview');
            const image = document.getElementById('newLogoImage');
            if (input && preview && image) {
                input.value = '';
                preview.style.display = 'none';
                image.src = '';
            }
        };

        // Очистка логотипа при редактировании
        window.clearEditLogo = () => {
            const input = document.getElementById('editLogoInput');
            const preview = document.getElementById('editLogoPreview');
            const image = document.getElementById('editLogoImage');
            if (input && preview && image) {
                input.value = '';
                preview.style.display = 'none';
                image.src = '';
            }
        };

        // Показать модальное окно создания мероприятия
        window.showNewEventModal = () => {
            resetNewEventModal();
            newEventModal.show();
        };

        // Сброс модального окна создания
        function resetNewEventModal() {
            const nameInput = document.getElementById('newName');
            const descriptionInput = document.getElementById('newDescription');
            if (nameInput && descriptionInput) {
                nameInput.value = '';
                descriptionInput.value = '';
                clearNewLogo();
            }
        }

        // Создание мероприятия
        window.createEvent = () => {
            const nameInput = document.getElementById('newName');
            const descriptionInput = document.getElementById('newDescription');
            const logoInput = document.getElementById('newLogoInput');
            if (!nameInput || !descriptionInput || !logoInput) return;

            const name = nameInput.value.trim();
            const description = descriptionInput.value.trim();

            if (!name) {
                showToast('Наименование обязательно для заполнения!', 'danger');
                return;
            }

            const createEventWithLogo = (logoData) => {
                const event = {
                    id: events.length + 1,
                    name,
                    logo: logoData,
                    description,
                    serviceIds: []
                };
                events.push(event);
                saveEvents();
                newEventModal.hide();
                renderEvents();
                showToast('Мероприятие создано успешно!', 'success');
            };

            if (logoInput.files && logoInput.files[0]) {
                const file = logoInput.files[0];
                if (!['image/jpeg', 'image/png'].includes(file.type)) {
                    showToast('Поддерживаются только файлы JPEG и PNG!', 'danger');
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                    createEventWithLogo(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                createEventWithLogo(null);
            }
        };

        // Привязка события к кнопке "Создать"
        const createEventBtn = document.getElementById('createEventBtn');
        if (createEventBtn) {
            createEventBtn.addEventListener('click', window.createEvent);
        }

        // Рендеринг таблицы мероприятий
        function renderEvents() {
            const tableBody = document.getElementById('eventsTable');
            if (!tableBody) return;

            tableBody.innerHTML = '';
            events.forEach(event => {
                const servicesList = event.serviceIds.map(id => {
                    const service = services.find(s => s.id === id);
                    return service ? service.name : 'Услуга удалена';
                }).join(', ') || '-';
                const description = event.description ? event.description.substring(0, 50) + (event.description.length > 50 ? '...' : '') : '-';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="event-checkbox" data-id="${event.id}"></td>
                    <td>${event.id}</td>
                    <td>${event.name}</td>
                    <td>${event.logo ? `<img src="${event.logo}" style="max-width: 50px; max-height: 50px;" class="img-thumbnail">` : '-'}</td>
                    <td>${description}</td>
                    <td>${servicesList}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editEvent(${event.id})"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="showDeleteModal(${event.id})"><i class="bi bi-trash"></i></button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            updateDeleteButtonState();
        }

        // Обновление состояния кнопки удаления
        function updateDeleteButtonState() {
            const checkboxes = document.querySelectorAll('.event-checkbox:checked');
            const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
            if (deleteSelectedBtn) {
                deleteSelectedBtn.disabled = checkboxes.length === 0;
            }
        }

        // Удаление выбранных мероприятий
        window.deleteSelected = () => {
            const selectedIds = Array.from(document.querySelectorAll('.event-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
            if (selectedIds.length > 0) {
                events = events.filter(event => !selectedIds.includes(event.id));
                saveEvents();
                renderEvents();
                showToast('Выбранные мероприятия удалены!', 'success');
            }
        };

        // Показать модальное окно удаления
        window.showDeleteModal = (id) => {
            const deleteEventId = document.getElementById('deleteEventId');
            const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
            if (deleteEventId && confirmDeleteBtn) {
                deleteEventId.textContent = id;
                confirmDeleteBtn.dataset.id = id;
                deleteEventModal.show();
            }
        };

        // Подтверждение удаления
        window.confirmDelete = () => {
            const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
            if (!confirmDeleteBtn) return;

            const id = parseInt(confirmDeleteBtn.dataset.id);
            events = events.filter(event => event.id !== id);
            saveEvents();
            deleteEventModal.hide();
            renderEvents();
            showToast('Мероприятие удалено!', 'success');
        };

        // Редактирование мероприятия
        window.editEvent = (id) => {
            const event = events.find(e => e.id === id);
            if (event) {
                const editName = document.getElementById('editName');
                const editDescription = document.getElementById('editDescription');
                const saveEditBtn = document.getElementById('saveEditBtn');
                if (editName && editDescription && saveEditBtn) {
                    editName.value = event.name;
                    editDescription.value = event.description || '';
                    if (event.logo) {
                        document.getElementById('editLogoImage').src = event.logo;
                        document.getElementById('editLogoPreview').style.display = 'block';
                    } else {
                        clearEditLogo();
                    }
                    tempServiceIds = [...event.serviceIds];
                    loadServices(tempServiceIds);
                    saveEditBtn.dataset.id = id;
                    editEventModal.show();
                }
            }
        };

        // Загрузка услуг в селектор
        function loadServices(selectedServiceIds) {
            const container = document.getElementById('editServicesContainer');
            if (!container) return;

            container.innerHTML = `
                <div class="mb-3">
                    <label for="serviceSelect" class="form-label">Выберите услугу</label>
                    <select id="serviceSelect" class="form-select">
                        <option value="">-- Выберите услугу --</option>
                        ${services.map(service => `<option value="${service.id}">${service.name}</option>`).join('')}
                    </select>
                    <button class="btn btn-primary mt-2" onclick="addService()">Добавить услугу</button>
                </div>
                <div id="selectedServices" class="mt-3"></div>
            `;
            renderSelectedServices(selectedServiceIds);
        }

        // Рендеринг выбранных услуг
        function renderSelectedServices(selectedServiceIds) {
            const selectedServicesDiv = document.getElementById('selectedServices');
            if (!selectedServicesDiv) return;

            selectedServicesDiv.innerHTML = '';
            if (selectedServiceIds.length === 0) {
                selectedServicesDiv.innerHTML = '<p class="text-muted">Нет выбранных услуг.</p>';
                return;
            }
            selectedServiceIds.forEach(id => {
                const service = services.find(s => s.id === id);
                if (service) {
                    const div = document.createElement('div');
                    div.className = 'd-flex justify-content-between align-items-center mb-2 p-2 border rounded';
                    div.innerHTML = `
                        <span>${service.name}</span>
                        <button class="btn btn-sm btn-danger" onclick="removeService(${id})"><i class="bi bi-trash"></i></button>
                    `;
                    selectedServicesDiv.appendChild(div);
                }
            });
        }

        // Добавление услуги
        window.addService = () => {
            const select = document.getElementById('serviceSelect');
            if (!select) return;

            const serviceId = parseInt(select.value);
            if (!serviceId) {
                showToast('Выберите услугу!', 'danger');
                return;
            }
            if (!tempServiceIds.includes(serviceId)) {
                tempServiceIds.push(serviceId);
                renderSelectedServices(tempServiceIds);
                select.value = '';
            } else {
                showToast('Эта услуга уже добавлена!', 'warning');
            }
        };

        // Удаление услуги
        window.removeService = (serviceId) => {
            tempServiceIds = tempServiceIds.filter(id => id !== serviceId);
            renderSelectedServices(tempServiceIds);
        };

        // Сохранение изменений мероприятия
        window.saveEdit = () => {
            const saveEditBtn = document.getElementById('saveEditBtn');
            if (!saveEditBtn) return;

            const id = parseInt(saveEditBtn.dataset.id);
            const event = events.find(e => e.id === id);
            if (event) {
                const nameInput = document.getElementById('editName');
                const descriptionInput = document.getElementById('editDescription');
                const logoInput = document.getElementById('editLogoInput');
                if (!nameInput || !descriptionInput || !logoInput) return;

                const name = nameInput.value.trim();
                const description = descriptionInput.value.trim();

                if (!name) {
                    showToast('Наименование обязательно для заполнения!', 'danger');
                    return;
                }

                const updateEventWithLogo = (logoData) => {
                    event.name = name;
                    event.logo = logoData;
                    event.description = description;
                    event.serviceIds = [...tempServiceIds];
                    saveEvents();
                    editEventModal.hide();
                    renderEvents();
                    showToast('Мероприятие обновлено!', 'success');
                    tempServiceIds = [];
                };

                if (logoInput.files && logoInput.files[0]) {
                    const file = logoInput.files[0];
                    if (!['image/jpeg', 'image/png'].includes(file.type)) {
                        showToast('Поддерживаются только файлы JPEG и PNG!', 'danger');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                        updateEventWithLogo(reader.result);
                    };
                    reader.readAsDataURL(logoInput.files[0]);
                } else {
                    updateEventWithLogo(document.getElementById('editLogoImage').src || null);
                }
            }
        };

        // Показ уведомления
        function showToast(message, type) {
            const toastContainer = document.querySelector('.toast-container');
            if (!toastContainer) {
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
            toastContainer.appendChild(toast);
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            setTimeout(() => toast.remove(), 3000);
        }

        // Обработчик для чекбоксов
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('event-checkbox')) {
                updateDeleteButtonState();
            }
        });

        console.log('events.js: Initialization complete');
    } catch (error) {
        console.error('events.js: Error during initialization:', error);
    }
});