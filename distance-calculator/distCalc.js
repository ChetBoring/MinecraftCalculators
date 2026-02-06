document.addEventListener('DOMContentLoaded', function() {
    // Получаем все элементы ввода
    const startWorldXInput = document.getElementById('startWorldX');
    const startWorldZInput = document.getElementById('startWorldZ');
    const startNetherXInput = document.getElementById('startNetherX');
    const startNetherZInput = document.getElementById('startNetherZ');
    
    const endWorldXInput = document.getElementById('endWorldX');
    const endWorldZInput = document.getElementById('endWorldZ');
    const endNetherXInput = document.getElementById('endNetherX');
    const endNetherZInput = document.getElementById('endNetherZ');
    
    // Получаем элементы отображения
    const startWorldXDisplay = document.getElementById('startWorldXDisplay');
    const startWorldZDisplay = document.getElementById('startWorldZDisplay');
    const startNetherXDisplay = document.getElementById('startNetherXDisplay');
    const startNetherZDisplay = document.getElementById('startNetherZDisplay');
    
    const endWorldXDisplay = document.getElementById('endWorldXDisplay');
    const endWorldZDisplay = document.getElementById('endWorldZDisplay');
    const endNetherXDisplay = document.getElementById('endNetherXDisplay');
    const endNetherZDisplay = document.getElementById('endNetherZDisplay');
    
    // Элементы расстояний
    const worldDistance = document.getElementById('worldDistance');
    const netherDistance = document.getElementById('netherDistance');
    const worldDeltaX = document.getElementById('worldDeltaX');
    const worldDeltaZ = document.getElementById('worldDeltaZ');
    const netherDeltaX = document.getElementById('netherDeltaX');
    const netherDeltaZ = document.getElementById('netherDeltaZ');
    
    // Переключатель
    const shortenNumbersToggle = document.getElementById('shortenNumbers');
    const toggleLabel = document.querySelector('.toggle-label');
    const toggleIcon = document.querySelector('.toggle-wrapper i');
    
    // Состояние
    let shortenNumbers = false;
    let lastUpdatedField = null;
    
    // Инициализация
    initCalculator();
    
    // Обработчики для всех полей ввода
    const allInputs = [
        startWorldXInput, startWorldZInput, startNetherXInput, startNetherZInput,
        endWorldXInput, endWorldZInput, endNetherXInput, endNetherZInput
    ];
    
    allInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Определяем, какое поле было изменено
            if (this.id.includes('start')) {
                lastUpdatedField = this.id.includes('World') ? 'startWorld' : 'startNether';
            } else {
                lastUpdatedField = this.id.includes('World') ? 'endWorld' : 'endNether';
            }
            
            updateAllCalculations();
        });
    });
    
    // Обработчик переключателя
    shortenNumbersToggle.addEventListener('change', function() {
        shortenNumbers = this.checked;
        updateFormatDisplay();
        updateAllCalculations();
    });
    
    // Функция инициализации
    function initCalculator() {
        updateFormatDisplay();
        updateAllCalculations();
        
        // Автофокус на первом поле
        startWorldXInput.focus();
        startWorldXInput.select();
    }
    
    // Обновление отображения переключателя
    function updateFormatDisplay() {
        if (shortenNumbers) {
            toggleIcon.className = 'fas fa-compress-alt';
            toggleLabel.textContent = 'Сокращать числа';
        } else {
            toggleIcon.className = 'fas fa-expand-alt';
            toggleLabel.textContent = 'Полные числа';
        }
    }
    
    // Основная функция расчета
    function updateAllCalculations() {
        // Обновляем значения на основе последнего измененного поля
        updateCoordinatesBasedOnLastChange();
        
        // Рассчитываем и отображаем расстояния
        calculateAndDisplayDistances();
        
        // Обновляем отображение всех координат
        updateAllDisplays();
    }
    
    // Обновление координат на основе последнего изменения
    function updateCoordinatesBasedOnLastChange() {
        switch(lastUpdatedField) {
            case 'startWorld':
                // Обновляем адские координаты начальной точки
                updateNetherFromWorld('start');
                break;
                
            case 'startNether':
                // Обновляем мировые координаты начальной точки
                updateWorldFromNether('start');
                break;
                
            case 'endWorld':
                // Обновляем адские координаты конечной точки
                updateNetherFromWorld('end');
                break;
                
            case 'endNether':
                // Обновляем мировые координаты конечной точки
                updateWorldFromNether('end');
                break;
        }
    }
    
    // Конвертация из мира в ад
    function updateNetherFromWorld(type) {
        const worldXInput = type === 'start' ? startWorldXInput : endWorldXInput;
        const worldZInput = type === 'start' ? startWorldZInput : endWorldZInput;
        const netherXInput = type === 'start' ? startNetherXInput : endNetherXInput;
        const netherZInput = type === 'start' ? startNetherZInput : endNetherZInput;
        
        const worldX = parseFloat(worldXInput.value) || 0;
        const worldZ = parseFloat(worldZInput.value) || 0;
        
        const netherX = Math.round(worldX / 8);
        const netherZ = Math.round(worldZ / 8);
        
        netherXInput.value = netherX;
        netherZInput.value = netherZ;
    }
    
    // Конвертация из ада в мир
    function updateWorldFromNether(type) {
        const netherXInput = type === 'start' ? startNetherXInput : endNetherXInput;
        const netherZInput = type === 'start' ? startNetherZInput : endNetherZInput;
        const worldXInput = type === 'start' ? startWorldXInput : endWorldXInput;
        const worldZInput = type === 'start' ? startWorldZInput : endWorldZInput;
        
        const netherX = parseFloat(netherXInput.value) || 0;
        const netherZ = parseFloat(netherZInput.value) || 0;
        
        const worldX = Math.round(netherX * 8);
        const worldZ = Math.round(netherZ * 8);
        
        worldXInput.value = worldX;
        worldZInput.value = worldZ;
    }
    
    // Расчет и отображение расстояний
    function calculateAndDisplayDistances() {
        // Получаем мировые координаты
        const startWorldX = parseFloat(startWorldXInput.value) || 0;
        const startWorldZ = parseFloat(startWorldZInput.value) || 0;
        const endWorldX = parseFloat(endWorldXInput.value) || 0;
        const endWorldZ = parseFloat(endWorldZInput.value) || 0;
        
        // Получаем адские координаты
        const startNetherX = parseFloat(startNetherXInput.value) || 0;
        const startNetherZ = parseFloat(startNetherZInput.value) || 0;
        const endNetherX = parseFloat(endNetherXInput.value) || 0;
        const endNetherZ = parseFloat(endNetherZInput.value) || 0;
        
        // Рассчитываем дельты
        const worldDeltaXValue = Math.abs(endWorldX - startWorldX);
        const worldDeltaZValue = Math.abs(endWorldZ - startWorldZ);
        const netherDeltaXValue = Math.abs(endNetherX - startNetherX);
        const netherDeltaZValue = Math.abs(endNetherZ - startNetherZ);
        
        // Рассчитываем расстояния (евклидово расстояние)
        const worldDistanceValue = Math.sqrt(
            Math.pow(worldDeltaXValue, 2) + Math.pow(worldDeltaZValue, 2)
        );
        
        const netherDistanceValue = Math.sqrt(
            Math.pow(netherDeltaXValue, 2) + Math.pow(netherDeltaZValue, 2)
        );
        
        // Отображаем расстояния
        worldDistance.textContent = formatNumber(worldDistanceValue, 2);
        netherDistance.textContent = formatNumber(netherDistanceValue, 2);
        
        // Отображаем дельты
        worldDeltaX.textContent = formatNumber(worldDeltaXValue, 0);
        worldDeltaZ.textContent = formatNumber(worldDeltaZValue, 0);
        netherDeltaX.textContent = formatNumber(netherDeltaXValue, 0);
        netherDeltaZ.textContent = formatNumber(netherDeltaZValue, 0);
    }
    
    // Обновление всех отображений
    function updateAllDisplays() {
        // Начальная точка
        updateDisplay(startWorldXDisplay, startWorldXInput.value);
        updateDisplay(startWorldZDisplay, startWorldZInput.value);
        updateDisplay(startNetherXDisplay, startNetherXInput.value);
        updateDisplay(startNetherZDisplay, startNetherZInput.value);
        
        // Конечная точка
        updateDisplay(endWorldXDisplay, endWorldXInput.value);
        updateDisplay(endWorldZDisplay, endWorldZInput.value);
        updateDisplay(endNetherXDisplay, endNetherXInput.value);
        updateDisplay(endNetherZDisplay, endNetherZInput.value);
    }
    
    // Форматирование чисел для отображения
    function formatNumber(num, decimals = 0) {
        if (!shortenNumbers) {
            if (decimals > 0) {
                return num.toFixed(decimals);
            }
            return Math.round(num).toString();
        }
        
        const absNum = Math.abs(num);
        
        if (absNum >= 1000000) {
            return (num / 1000000).toFixed(decimals) + 'M';
        }
        if (absNum >= 1000) {
            return (num / 1000).toFixed(decimals) + 'k';
        }
        
        if (decimals > 0) {
            return num.toFixed(decimals);
        }
        return Math.round(num).toString();
    }
    
    // Обновление отображения значения
    function updateDisplay(element, value) {
        const num = parseFloat(value) || 0;
        element.textContent = formatNumber(num, 0);
    }
    
    // Горячие клавиши
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Сброс к значениям по умолчанию
            resetToDefault();
            startWorldXInput.focus();
            startWorldXInput.select();
        }
        if (e.key === 'f') {
            shortenNumbersToggle.checked = !shortenNumbersToggle.checked;
            shortenNumbers = shortenNumbersToggle.checked;
            updateFormatDisplay();
            updateAllCalculations();
        }
    });
    
    // Функция сброса к значениям по умолчанию
    function resetToDefault() {
        startWorldXInput.value = 100;
        startWorldZInput.value = 100;
        endWorldXInput.value = 500;
        endWorldZInput.value = 500;
        lastUpdatedField = 'startWorld';
        updateAllCalculations();
    }
});