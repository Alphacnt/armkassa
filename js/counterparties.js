document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Bootstrap модальных окон
    const newCounterpartyModal = new bootstrap.Modal(document.getElementById('newCounterpartyModal'));
    const editCounterpartyModal = new bootstrap.Modal(document.getElementById('editCounterpartyModal'));
    const deleteCounterpartyModal = new bootstrap.Modal(document.getElementById('deleteCounterpartyModal'));

    let counterparties = JSON.parse(localStorage.getItem('counterparties')) || []; // Загружаем контрагентов из localStorage

    // Сохраняем контрагентов в localStorage
    function saveCounterparties() {
        localStorage.setItem('counterparties', JSON.stringify(counterparties));
    }

    // Рендерим контрагентов при загрузке страницы
    renderCounterparties();

    // Показать модальное окно создания контрагента
    window.showNewCounterpartyModal = () => {
        resetNewCounterpartyModal();
        newCounterpartyModal.show();
    };

    // Сброс модального окна создания контрагента
    function resetNewCounterpartyModal() {
        document.getElementById('newName').value = '';
        document.getElementById('newBin').value = '';
        document.getElementById('newBank').value = '';
        document.getElementById('newAccount').value = '';
        document.getElementById('newBik').value = '';
        document.getElementById('newLegalAddress').value = '';
    }

    // Создание контрагента
    window.createCounterparty = () => {
        const name = document.getElementById('newName').value.trim();
        const bin = document.getElementById('newBin').value.trim();
        const bank = document.getElementById('newBank').value.trim();
        const account = document.getElementById('newAccount').value.trim();
        const bik = document.getElementById('newBik').value.trim();
        const legalAddress = document.getElementById('newLegalAddress').value.trim();

        if (!name) {
            showToast('Наименование обязательно для заполнения!', 'danger');
            return;
        }

        if (bin && !/^\d{12}$/.test(bin)) {
            showToast('БИН должен содержать ровно 12 цифр!', 'danger');
            return;
        }

        if (account && !/^\d{20}$/.test(account)) {
            showToast('Лицевой счёт должен содержать ровно 20 цифр!', 'danger');
            return;
        }

        if (bik && !/^\d{8}$/.test(bik)) {
            showToast('БИК должен содержать ровно 8 цифр!', 'danger');
            return;
        }

        const counterparty = {
            id: counterparties.length + 1,
            name,
            bin,
            bank,
            account,
            bik,
            legalAddress
        };

        counterparties.push(counterparty);
        saveCounterparties();
        newCounterpartyModal.hide();
        renderCounterparties();
        showToast('Контрагент создан успешно!', 'success');
    };

    // Рендеринг таблицы контрагентов
    function renderCounterparties() {
        const tableBody = document.getElementById('counterpartiesTable');
        tableBody.innerHTML = '';
        counterparties.forEach(counterparty => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="counterparty-checkbox" data-id="${counterparty.id}"></td>
                <td>${counterparty.id}</td>
                <td>${counterparty.name}</td>
                <td>${counterparty.bin || '-'}</td>
                <td>${counterparty.bank || '-'}</td>
                <td>${counterparty.account || '-'}</td>
                <td>${counterparty.bik || '-'}</td>
                <td>${counterparty.legalAddress || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editCounterparty(${counterparty.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="showDeleteModal(${counterparty.id})"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        updateDeleteButtonState();
    }

    // Обновление состояния кнопки удаления
    function updateDeleteButtonState() {
        const checkboxes = document.querySelectorAll('.counterparty-checkbox:checked');
        document.getElementById('deleteSelectedBtn').disabled = checkboxes.length === 0;
    }

    // Удаление выбранных контрагентов
    window.deleteSelected = () => {
        const selectedIds = Array.from(document.querySelectorAll('.counterparty-checkbox:checked')).map(cb => parseInt(cb.dataset.id));
        if (selectedIds.length > 0) {
            counterparties = counterparties.filter(counterparty => !selectedIds.includes(counterparty.id));
            saveCounterparties();
            renderCounterparties();
            showToast('Выбранные контрагенты удалены!', 'success');
        }
    };

    // Показать модальное окно удаления
    window.showDeleteModal = (id) => {
        document.getElementById('deleteCounterpartyId').textContent = id;
        document.getElementById('confirmDeleteBtn').dataset.id = id;
        deleteCounterpartyModal.show();
    };

    // Подтверждение удаления
    window.confirmDelete = () => {
        const id = parseInt(document.getElementById('confirmDeleteBtn').dataset.id);
        counterparties = counterparties.filter(counterparty => counterparty.id !== id);
        saveCounterparties();
        deleteCounterpartyModal.hide();
        renderCounterparties();
        showToast('Контрагент удалён!', 'success');
    };

    // Редактирование контрагента
    window.editCounterparty = (id) => {
        const counterparty = counterparties.find(c => c.id === id);
        if (counterparty) {
            document.getElementById('editName').value = counterparty.name;
            document.getElementById('editBin').value = counterparty.bin || '';
            document.getElementById('editBank').value = counterparty.bank || '';
            document.getElementById('editAccount').value = counterparty.account || '';
            document.getElementById('editBik').value = counterparty.bik || '';
            document.getElementById('editLegalAddress').value = counterparty.legalAddress || '';
            document.getElementById('saveEditBtn').dataset.id = id;
            editCounterpartyModal.show();
        }
    };

    // Сохранение изменений контрагента
    window.saveEdit = () => {
        const id = parseInt(document.getElementById('saveEditBtn').dataset.id);
        const counterparty = counterparties.find(c => c.id === id);
        if (counterparty) {
            const name = document.getElementById('editName').value.trim();
            const bin = document.getElementById('editBin').value.trim();
            const bank = document.getElementById('editBank').value.trim();
            const account = document.getElementById('editAccount').value.trim();
            const bik = document.getElementById('editBik').value.trim();
            const legalAddress = document.getElementById('editLegalAddress').value.trim();

            if (!name) {
                showToast('Наименование обязательно для заполнения!', 'danger');
                return;
            }

            if (bin && !/^\d{12}$/.test(bin)) {
                showToast('БИН должен содержать ровно 12 цифр!', 'danger');
                return;
            }

            if (account && !/^\d{20}$/.test(account)) {
                showToast('Лицевой счёт должен содержать ровно 20 цифр!', 'danger');
                return;
            }

            if (bik && !/^\d{8}$/.test(bik)) {
                showToast('БИК должен содержать ровно 8 цифр!', 'danger');
                return;
            }

            counterparty.name = name;
            counterparty.bin = bin;
            counterparty.bank = bank;
            counterparty.account = account;
            counterparty.bik = bik;
            counterparty.legalAddress = legalAddress;

            saveCounterparties();
            editCounterpartyModal.hide();
            renderCounterparties();
            showToast('Контрагент обновлён!', 'success');
        }
    };

    // Показ уведомления
    function showToast(message, type) {
        const toastContainer = document.querySelector('.toast-container');
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
        if (e.target.classList.contains('counterparty-checkbox')) {
            updateDeleteButtonState();
        }
    });
});