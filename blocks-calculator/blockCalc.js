document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const quantityInput = document.getElementById('quantity');
    const itemNameInput = document.getElementById('itemName');
    const addItemBtn = document.getElementById('addItemBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const addListBtn = document.getElementById('addListBtn');
    const deleteSelectedListsBtn = document.getElementById('deleteSelectedListsBtn');
    const listsContainer = document.getElementById('listsContainer');
    const emptyListsMessage = document.getElementById('emptyListsMessage');
    const selectedListsInfo = document.getElementById('selectedListsInfo');
    
    // Элементы статистики
    const statTotalItems = document.getElementById('statTotalItems');
    const statUniqueItems = document.getElementById('statUniqueItems');
    const statTotalStacks = document.getElementById('statTotalStacks');
    const statListsCount = document.getElementById('statListsCount');
    
    // История для undo/redo
    let history = [];
    let historyIndex = -1;
    
    // Состояние приложения
    let lists = [];
    
    // Сохраняем исходное значение для поля количества
    const originalQuantityValue = quantityInput.value;
    
    // Загрузка из localStorage
    loadFromStorage();
    updateUI();
    updateStats();
    updateHistoryButtons();
    
    // Функция для вычисления математического выражения
    function evaluateExpression(expression) {
        try {
            let expr = expression.replace(/\s+/g, '');
            
            if (!/^[\d+\-*/().]+$/.test(expr)) {
                return null;
            }
            
            const result = Function('"use strict"; return (' + expr + ')')();
            
            if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
                return null;
            }
            
            return Math.round(result);
        } catch (error) {
            return null;
        }
    }
    
    // Функция для сохранения состояния в историю
    function saveToHistory() {
        // Удаляем все состояния после текущего индекса
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        
        // Сохраняем текущее состояние
        const stateToSave = {
            lists: JSON.parse(JSON.stringify(lists)),
            timestamp: Date.now()
        };
        
        history.push(stateToSave);
        historyIndex = history.length - 1;
        
        // Ограничиваем размер истории
        const maxHistorySize = 50;
        if (history.length > maxHistorySize) {
            history = history.slice(history.length - maxHistorySize);
            historyIndex = history.length - 1;
        }
        
        updateHistoryButtons();
    }
    
    // Функция для обновления состояния кнопок истории
    function updateHistoryButtons() {
        undoBtn.disabled = historyIndex <= 0;
        redoBtn.disabled = historyIndex >= history.length - 1;
    }
    
    // Функция для отмены действия
    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            const previousState = history[historyIndex];
            lists = JSON.parse(JSON.stringify(previousState.lists));
            updateUI();
            updateStats();
            saveToStorage();
            updateHistoryButtons();
            showNotification('Действие отменено');
        }
    }
    
    // Функция для повтора действия
    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            const nextState = history[historyIndex];
            lists = JSON.parse(JSON.stringify(nextState.lists));
            updateUI();
            updateStats();
            saveToStorage();
            updateHistoryButtons();
            showNotification('Действие повторено');
        }
    }
    
    // Функция для создания нового списка
    function createList(name = '') {
        if (!name.trim()) {
            const listNumber = lists.length + 1;
            name = `Список ${listNumber}`;
        }
        
        const newList = {
            id: Date.now() + Math.random(),
            name: name,
            items: [],
            expanded: true,
            selected: true,
            editing: false
        };
        
        lists.push(newList);
        saveToHistory();
        saveToStorage();
        updateUI();
        updateStats();
        
        return newList;
    }
    
    // Функция для получения выбранных списков
    function getSelectedLists() {
        return lists.filter(list => list.selected);
    }
    
    // Функция для добавления предмета
    function addItem() {
        const expression = quantityInput.value.trim();
        const itemName = itemNameInput.value.trim() || 'предмет';
        
        // Проверка ввода
        if (!itemName) {
            showNotification('Введите название предмета');
            itemNameInput.focus();
            return;
        }
        
        if (!expression) {
            showNotification('Введите количество или выражение');
            quantityInput.focus();
            return;
        }
        
        // Вычисление количества
        let quantity = evaluateExpression(expression);
        if (quantity === null) {
            quantity = parseInt(expression);
            if (isNaN(quantity)) {
                showNotification('Некорректное выражение или количество');
                quantityInput.focus();
                return;
            }
        }
        
        if (quantity <= 0) {
            showNotification('Количество должно быть больше 0');
            quantityInput.focus();
            return;
        }
        
        // Получаем выбранные списки
        let targetLists = getSelectedLists();
        
        // Если нет выбранных списков, создаем новый
        if (targetLists.length === 0) {
            const newList = createList();
            targetLists = [newList];
        }
        
        // Сохраняем состояние перед изменением
        const stateBeforeChange = JSON.parse(JSON.stringify(lists));
        
        // Добавляем предмет в каждый выбранный список
        targetLists.forEach(list => {
            // Проверяем, есть ли уже такой предмет в списке
            const existingItemIndex = list.items.findIndex(item => 
                item.name.toLowerCase() === itemName.toLowerCase()
            );
            
            if (existingItemIndex !== -1) {
                // Объединяем с существующим предметом
                list.items[existingItemIndex].quantity += quantity;
                list.items[existingItemIndex].calculated = false;
            } else {
                // Добавляем новый предмет
                const newItem = {
                    id: Date.now() + Math.random(),
                    quantity: quantity,
                    name: itemName,
                    calculated: false
                };
                
                list.items.push(newItem);
            }
            
            // Автоматически рассчитываем предметы в списке
            calculateListItems(list.id);
        });
        
        // Сохраняем в историю только если было изменение
        const stateAfterChange = JSON.parse(JSON.stringify(lists));
        if (JSON.stringify(stateBeforeChange) !== JSON.stringify(stateAfterChange)) {
            saveToHistory();
            saveToStorage();
            updateUI();
            updateStats();
            
            showNotification(`Добавлено: ${quantity} ${itemName}`);
        }
        
        // Фокус на поле количества, не очищаем значение
        quantityInput.focus();
        quantityInput.select();
    }
    
    // Функция для расчета предметов в списке
    function calculateListItems(listId) {
        const list = lists.find(l => l.id === listId);
        if (!list) return;
        
        list.items.forEach(item => {
            if (!item.calculated) {
                item.stacks = Math.floor(item.quantity / 64);
                item.remainder = item.quantity % 64;
                item.calculated = true;
            }
        });
    }
    
        // Функция для удаления предмета из списка
    function deleteItem(listId, itemId) {
        const list = lists.find(l => l.id === listId);
        if (!list) return;
        
        const itemIndex = list.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        // Удаляем предмет
        list.items.splice(itemIndex, 1);
        
        // Сохраняем новое состояние в историю
        saveToHistory();
        saveToStorage();
        updateUI();
        updateStats();
        
        showNotification('Предмет удален из списка');
    }
    
        // Функция для удаления выбранных списков
    function deleteSelectedLists() {
        const selectedLists = getSelectedLists();
        
        if (selectedLists.length === 0) {
            showNotification('Не выбрано ни одного списка для удаления');
            return;
        }
        
        // Подтверждение удаления
        if (!confirm(`Удалить ${selectedLists.length} список(ов)?`)) {
            return;
        }
        
        // Удаляем выбранные списки
        lists = lists.filter(list => !list.selected);
        
        // Сохраняем новое состояние в историю
        saveToHistory();
        saveToStorage();
        updateUI();
        updateStats();
        
        showNotification(`Удалено ${selectedLists.length} список(ов)`);
    }
    
    // Функция для обновления интерфейса списков
    function updateUI() {
        listsContainer.querySelectorAll('.list-item').forEach(el => el.remove());
        
        if (lists.length === 0) {
            emptyListsMessage.style.display = 'block';
            selectedListsInfo.textContent = 'Не выбрано ни одного списка. Предметы будут добавлены в новый автоматический список.';
            return;
        }
        
        emptyListsMessage.style.display = 'none';
        
        // Обновляем информацию о выбранных списках
        const selectedLists = getSelectedLists();
        if (selectedLists.length === 0) {
            selectedListsInfo.textContent = 'Не выбрано ни одного списка. Предметы будут добавлены в новый автоматический список.';
        } else if (selectedLists.length === 1) {
            selectedListsInfo.textContent = `Выбран список: "${selectedLists[0].name}"`;
        } else {
            selectedListsInfo.textContent = `Выбрано списков: ${selectedLists.length}`;
        }
        
        // Отображаем списки
        lists.forEach(list => {
            const listElement = createListElement(list);
            listsContainer.appendChild(listElement);
        });
    }
    
    // Функция для создания элемента списка
    function createListElement(list) {
        const listElement = document.createElement('div');
        listElement.className = `list-item ${list.selected ? 'selected' : ''}`;
        listElement.dataset.id = list.id;
        
        // Рассчитываем статистику списка
        let totalItems = 0;
        let calculatedItems = 0;
        let totalStacks = 0;
        let totalRemainder = 0;
        
        list.items.forEach(item => {
            totalItems += item.quantity;
            if (item.calculated) {
                calculatedItems++;
                totalStacks += item.stacks;
                totalRemainder += item.remainder;
            }
        });
        
        // Преобразуем остаток в стаки
        let finalStacks = totalStacks + Math.floor(totalRemainder / 64);
        
        listElement.innerHTML = `
            <div class="list-header">
                <div class="list-title-container">
                    <input type="checkbox" class="list-checkbox" ${list.selected ? 'checked' : ''}>
                    <div class="list-title ${list.editing ? 'editing' : ''}" data-list-id="${list.id}">
                        ${escapeHtml(list.name)}
                    </div>
                    <input type="text" class="list-title-input ${list.editing ? 'editing' : ''}" 
                           value="${escapeHtml(list.name)}" maxlength="50" data-list-id="${list.id}">
                </div>
                <div class="list-stats">
                    <span>${list.items.length} предметов</span>
                    <span>${finalStacks} стаков</span>
                </div>
                <div class="list-actions">
                    <button class="list-action-btn expand-btn" title="${list.expanded ? 'Свернуть' : 'Развернуть'}">
                        <i class="fas fa-chevron-${list.expanded ? 'up' : 'down'}"></i>
                    </button>
                    <button class="list-action-btn delete-list-btn" title="Удалить список">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${list.expanded ? `
                <div class="list-content">
                    ${list.items.length > 0 ? `
                        <div class="list-items">
                            ${list.items.map(item => createItemElement(list.id, item)).join('')}
                        </div>
                    ` : `
                        <div class="no-items">В списке нет предметов</div>
                    `}
                </div>
            ` : ''}
        `;
        
        // Добавляем обработчики событий
        const checkbox = listElement.querySelector('.list-checkbox');
        checkbox.addEventListener('change', function() {
            list.selected = this.checked;
            saveToStorage();
            updateUI();
        });
        
        const expandBtn = listElement.querySelector('.expand-btn');
        expandBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            list.expanded = !list.expanded;
            saveToStorage();
            updateUI();
        });
        
        const deleteBtn = listElement.querySelector('.delete-list-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm(`Удалить список "${list.name}"?`)) {
                lists = lists.filter(l => l.id !== list.id);
                saveToHistory();
                saveToStorage();
                updateUI();
                updateStats();
                showNotification(`Список "${list.name}" удален`);
            }
        });
        
        // Редактирование названия списка при клике
        const listTitle = listElement.querySelector('.list-title');
        const listTitleInput = listElement.querySelector('.list-title-input');
        
        listTitle.addEventListener('click', function(e) {
            e.stopPropagation();
            startEditingListName(list.id);
        });
        
        listTitleInput.addEventListener('focus', function() {
            this.select();
        });
        
        listTitleInput.addEventListener('blur', function() {
            finishEditingListName(list.id, this.value.trim());
        });
        
        listTitleInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                finishEditingListName(list.id, this.value.trim());
            }
        });
        
        // Обработчики для предметов в списке
        if (list.expanded && list.items.length > 0) {
            listElement.querySelectorAll('.delete-item-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const listId = parseFloat(this.closest('.list-item').dataset.id);
                    const itemId = parseFloat(this.closest('.item-row').dataset.id);
                    deleteItem(listId, itemId);
                });
            });
        }
        
        return listElement;
    }
    
    // Функция для начала редактирования названия списка
    function startEditingListName(listId) {
        const list = lists.find(l => l.id === listId);
        if (!list) return;
        
        list.editing = true;
        updateUI();
        
        // Фокус на поле ввода
        setTimeout(() => {
            const input = document.querySelector(`.list-title-input[data-list-id="${listId}"]`);
            if (input) {
                input.focus();
                input.select();
            }
        }, 10);
    }
    
    // Функция для завершения редактирования названия списка
    function finishEditingListName(listId, newName) {
        const list = lists.find(l => l.id === listId);
        if (!list) return;
        
        list.editing = false;
        
        if (newName && newName !== list.name) {
            list.name = newName;
            saveToHistory(); // Сохраняем ПОСЛЕ изменения
            saveToStorage();
            showNotification(`Список переименован в "${newName}"`);
        }
        
        updateUI();
    }
    
    // Функция для создания элемента предмета
    function createItemElement(listId, item) {
        let resultText = '';
        if (item.calculated) {
            if (item.stacks > 0 && item.remainder > 0) {
                resultText = `${item.stacks} ст. и ${item.remainder} ${item.name}`;
            } else if (item.stacks > 0) {
                resultText = `${item.stacks} стак${getPluralForm(item.stacks, '', 'а', 'ов')}`;
            } else {
                resultText = `${item.remainder} ${item.name}`;
            }
        } else {
            resultText = '<span style="color: #7a7a9a;">Не рассчитано</span>';
        }
        
        return `
            <div class="item-row" data-id="${item.id}">
                <div class="item-info">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-quantity">Количество: ${item.quantity}</div>
                </div>
                <div class="item-result">${resultText}</div>
                <div class="item-actions">
                    <button class="item-action-btn delete-item-btn" title="Удалить предмет">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Функция для обновления статистики
    function updateStats() {
        // Общее количество предметов
        let totalItems = 0;
        let uniqueItems = new Set();
        let totalStacks = 0;
        let totalRemainder = 0;
        
        lists.forEach(list => {
            list.items.forEach(item => {
                totalItems += item.quantity;
                uniqueItems.add(item.name.toLowerCase());
                
                if (item.calculated) {
                    totalStacks += item.stacks;
                    totalRemainder += item.remainder;
                }
            });
        });
        
        // Преобразуем остаток в стаки
        let finalStacks = totalStacks + Math.floor(totalRemainder / 64);
        
        statTotalItems.textContent = totalItems;
        statUniqueItems.textContent = uniqueItems.size;
        statTotalStacks.textContent = finalStacks;
        statListsCount.textContent = lists.length;
    }
    
    // Функция для показа уведомлений
    // ===== Notification system =====

let notificationsContainer = null;

function getNotificationsContainer() {
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.className = 'notifications-container';
        document.body.appendChild(notificationsContainer);
    }
    return notificationsContainer;
}

function showNotification(message) {
    const container = getNotificationsContainer();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // Добавляем СВЕРХУ
    container.prepend(notification);

    // Обновляем состояние всех уведомлений
    updateNotificationsState();

    // Авто-удаление
    setTimeout(() => {
        notification.classList.add('hide');

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                updateNotificationsState();
            }
        }, 350);
    }, 2600);
}

function updateNotificationsState() {
    const items = [...notificationsContainer.children];

    items.forEach((notif, index) => {
        notif.classList.remove('dimmed');

        // Всё что ниже второго — полупрозрачное
        if (index >= 1) {
            notif.classList.add('dimmed');
        }
    });

    // Жёсткий лимит — максимум 3 (2.5 визуально)
    while (items.length > 2) {
        const last = items.pop();
        last.remove();
    }
}

    
    // Функция для сохранения в localStorage
    function saveToStorage() {
        const data = {
            lists: lists,
            history: history,
            historyIndex: historyIndex
        };
        localStorage.setItem('minecraftCalculator', JSON.stringify(data));
    }
    
    // Функция для загрузки из localStorage
    function loadFromStorage() {
        const data = JSON.parse(localStorage.getItem('minecraftCalculator'));
        
        if (data) {
            lists = data.lists || [];
            history = data.history || [];
            historyIndex = data.historyIndex !== undefined ? data.historyIndex : history.length - 1;
            
            // Если есть списки, автоматически рассчитываем предметы
            lists.forEach(list => {
                calculateListItems(list.id);
            });
        }
        
        // Если нет истории, создаем начальное состояние
        if (history.length === 0) {
            saveToHistory();
        }
    }
    
    // Функция для экранирования HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Функция для получения правильной формы слова
    function getPluralForm(number, form1, form2, form5) {
        number = Math.abs(number) % 100;
        if (number >= 5 && number <= 20) return form5;
        number = number % 10;
        if (number === 1) return form1;
        if (number >= 2 && number <= 4) return form2;
        return form5;
    }
    
    // Обработчики событий
    addItemBtn.addEventListener('click', addItem);
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    addListBtn.addEventListener('click', () => {
        const newList = createList();
        showNotification(`Создан список "${newList.name}"`);
    });
    deleteSelectedListsBtn.addEventListener('click', deleteSelectedLists);
    
    // Добавление предмета по Enter
    quantityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addItem();
    });
    
    itemNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addItem();
    });
    
    // Горячие клавиши
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            addItem();
        }
    });
    
    // Автоматический фокус на поле количества
    quantityInput.focus();
    quantityInput.select();
    
    // Восстанавливаем исходное значение, если поле пустое
    if (!quantityInput.value.trim()) {
        quantityInput.value = originalQuantityValue;
    }

    // ==================== ЗВЕЗДНЫЙ ФОН PURPLE DREAMS (БЕЗ КОМЕТ) ====================

function createStarfield() {
    // Проверяем, не создали ли мы уже звездный фон
    if (document.querySelector('.purple-stars')) {
        return;
    }
    
    const starsContainer = document.createElement('div');
    starsContainer.className = 'purple-stars';
    starsContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
    `;
    
    // Создаем туманности
    const nebula1 = document.createElement('div');
    nebula1.style.cssText = `
        position: absolute;
        width: 500px;
        height: 500px;
        background: radial-gradient(circle at center, 
            rgba(157, 78, 221, 0.2) 0%, 
            rgba(157, 78, 221, 0.1) 30%, 
            transparent 70%);
        filter: blur(60px);
        top: -250px;
        left: -250px;
        opacity: 0.6;
    `;
    
    const nebula2 = document.createElement('div');
    nebula2.style.cssText = `
        position: absolute;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle at center, 
            rgba(199, 125, 255, 0.15) 0%, 
            rgba(199, 125, 255, 0.05) 40%, 
            transparent 80%);
        filter: blur(50px);
        bottom: -200px;
        right: -200px;
        opacity: 0.4;
    `;
    
    const nebula3 = document.createElement('div');
    nebula3.style.cssText = `
        position: absolute;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle at center, 
            rgba(123, 44, 191, 0.1) 0%, 
            rgba(123, 44, 191, 0.05) 30%, 
            transparent 70%);
        filter: blur(40px);
        top: 50%;
        left: 10%;
        opacity: 0.3;
    `;
    
    starsContainer.appendChild(nebula1);
    starsContainer.appendChild(nebula2);
    starsContainer.appendChild(nebula3);
    
    // Добавляем CSS анимации для туманностей и звезд
    const style = document.createElement('style');
    style.textContent = `
        @keyframes nebulaFloat {
            0%, 100% { 
                transform: translate(0, 0) scale(1); 
                opacity: 0.3;
            }
            33% { 
                transform: translate(30px, 20px) scale(1.05); 
                opacity: 0.4;
            }
            66% { 
                transform: translate(-20px, 30px) scale(0.95); 
                opacity: 0.35;
            }
        }
        
        @keyframes starTwinkle {
            0%, 100% { 
                opacity: 0.2; 
                transform: scale(1);
            }
            50% { 
                opacity: 0.8; 
                transform: scale(1.1);
            }
        }
        
        @keyframes slowPulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.4; }
        }
        
        .purple-nebula-1 {
            animation: nebulaFloat 25s infinite ease-in-out;
        }
        
        .purple-nebula-2 {
            animation: nebulaFloat 30s infinite ease-in-out reverse;
            animation-delay: 5s;
        }
        
        .purple-nebula-3 {
            animation: nebulaFloat 35s infinite ease-in-out;
            animation-delay: 10s;
        }
    `;
    document.head.appendChild(style);
    
    // Добавляем классы анимации к туманностям
    nebula1.classList.add('purple-nebula-1');
    nebula2.classList.add('purple-nebula-2');
    nebula3.classList.add('purple-nebula-3');
    
    // Создаем звезды (только мерцающие, без комет)
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 2.5 + 0.5;
        const isBigStar = Math.random() > 0.9; // 10% больших звезд
        
        star.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${isBigStar ? '#ffffff' : '#e2d9ff'};
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: starTwinkle ${Math.random() * 4 + 3}s infinite ${Math.random() * 5}s;
            box-shadow: 0 0 ${isBigStar ? size * 3 : size * 1.5}px ${isBigStar ? '#ffffff' : '#c77dff'};
        `;
        starsContainer.appendChild(star);
    }
    
    // Добавляем несколько очень далеких звезд (едва заметных)
    for (let i = 0; i < 50; i++) {
        const distantStar = document.createElement('div');
        distantStar.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            background: rgba(226, 217, 255, 0.1);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: slowPulse ${Math.random() * 10 + 10}s infinite ${Math.random() * 10}s;
            box-shadow: 0 0 2px rgba(199, 125, 255, 0.1);
        `;
        starsContainer.appendChild(distantStar);
    }
    
    document.body.appendChild(starsContainer);
}

// Функция для удаления старого звездного фона (если есть)
function removeOldStarfield() {
    const oldStars = document.querySelector('.stars');
    const oldPurpleStars = document.querySelector('.purple-stars');
    
    if (oldStars) oldStars.remove();
    if (oldPurpleStars) oldPurpleStars.remove();
}

// Создаем звездный фон
function initPurpleDreamsTheme() {
    removeOldStarfield();
    createStarfield();
}

// Инициализируем при полной загрузке страницы
window.addEventListener('load', function() {
    setTimeout(initPurpleDreamsTheme, 500);
});

// Также инициализируем если DOM уже загружен
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initPurpleDreamsTheme, 500);
    });
} else {
    setTimeout(initPurpleDreamsTheme, 500);
}

// Пересоздаем звездный фон при изменении размера окна (для адаптивности)
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initPurpleDreamsTheme, 1000);
});
});