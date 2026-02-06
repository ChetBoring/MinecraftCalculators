document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const overworldXInput = document.getElementById('overworldX');
    const overworldZInput = document.getElementById('overworldZ');
    const netherXInput = document.getElementById('netherX');
    const netherZInput = document.getElementById('netherZ');
    const overworldResult = document.getElementById('overworldResult');
    const netherResult = document.getElementById('netherResult');
    const directionText = document.getElementById('directionText');
    const quickButtons = document.querySelectorAll('.quick-btn');
    const shortenNumbersToggle = document.getElementById('shortenNumbers');
    
    // Состояние
    let lastUpdatedField = null;
    let shortenNumbers = false; // По умолчанию ВЫКЛ - показываем точные числа
    
    // Инициализация
    initDirectionDisplay();
    initInputs();
    calculateBothDirections();
    
    // Обработчик переключателя сокращения чисел
    shortenNumbersToggle.addEventListener('change', function() {
        shortenNumbers = this.checked;
        updateFormatDisplay();
        calculateBothDirections();
    });
    
    // Обработчики событий для полей ввода
    [overworldXInput, overworldZInput].forEach(input => {
        input.addEventListener('input', function() {
            lastUpdatedField = 'overworld';
            calculateBothDirections();
        });
    });
    
    [netherXInput, netherZInput].forEach(input => {
        input.addEventListener('input', function() {
            lastUpdatedField = 'nether';
            calculateBothDirections();
        });
    });
    
    // Обработчики для быстрых кнопок
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            const worldX = this.dataset.worldX;
            const worldZ = this.dataset.worldZ;
            const netherX = this.dataset.netherX;
            const netherZ = this.dataset.netherZ;
            
            if (worldX !== undefined && worldZ !== undefined) {
                overworldXInput.value = worldX;
                overworldZInput.value = worldZ;
                lastUpdatedField = 'overworld';
            } else if (netherX !== undefined && netherZ !== undefined) {
                netherXInput.value = netherX;
                netherZInput.value = netherZ;
                lastUpdatedField = 'nether';
            }
            
            calculateBothDirections();
        });
    });
    
    // Инициализация отображения направления
    function initDirectionDisplay() {
        directionText.innerHTML = `
            <i class="fas fa-globe-americas"></i>
            <div class="direction-arrows">
                <i class="fas fa-exchange-alt"></i>
            </div>
            <i class="fas fa-fire"></i>
        `;
    }
    
    // Инициализация полей ввода
    function initInputs() {
        // Устанавливаем значения по умолчанию
        overworldXInput.value = 100;
        overworldZInput.value = -200;
        lastUpdatedField = 'overworld';
        calculateBothDirections(); // Сразу рассчитаем начальные значения
    }
    
    // Обновление отображения формата
    function updateFormatDisplay() {
        const toggleLabel = document.querySelector('.toggle-label');
        const icon = document.querySelector('.toggle-wrapper i');
        
        if (shortenNumbers) {
            icon.className = 'fas fa-compress-alt';
            toggleLabel.textContent = 'Сокращать числа';
        } else {
            icon.className = 'fas fa-expand-alt';
            toggleLabel.textContent = 'Полные числа';
        }
    }
    
    // Функция расчета в обе стороны
    function calculateBothDirections() {
        // Получаем значения из полей
        const overworldX = parseFloat(overworldXInput.value) || 0;
        const overworldZ = parseFloat(overworldZInput.value) || 0;
        const netherX = parseFloat(netherXInput.value) || 0;
        const netherZ = parseFloat(netherZInput.value) || 0;
        
        let calculatedOverworldX = overworldX;
        let calculatedOverworldZ = overworldZ;
        let calculatedNetherX = netherX;
        let calculatedNetherZ = netherZ;
        
        // Определяем, какие поля были изменены последними
        if (lastUpdatedField === 'overworld') {
            // Если меняли обычный мир -> пересчитываем ад
            calculatedNetherX = Math.round(overworldX / 8);
            calculatedNetherZ = Math.round(overworldZ / 8);
            
            // Обновляем поля ада
            netherXInput.value = calculatedNetherX;
            netherZInput.value = calculatedNetherZ;
            
        } else if (lastUpdatedField === 'nether') {
            // Если меняли ад -> пересчитываем обычный мир
            calculatedOverworldX = Math.round(netherX * 8);
            calculatedOverworldZ = Math.round(netherZ * 8);
            
            // Обновляем поля обычного мира
            overworldXInput.value = calculatedOverworldX;
            overworldZInput.value = calculatedOverworldZ;
        }
        
        // Показываем результаты
        updateResultDisplay(
            overworldResult, 
            'В обычном мире', 
            calculatedOverworldX, 
            calculatedOverworldZ
        );
        
        updateResultDisplay(
            netherResult, 
            'В аду', 
            calculatedNetherX, 
            calculatedNetherZ
        );
    }
    
    // Функция обновления отображения результатов
    function updateResultDisplay(element, title, x, z) {
        const formattedX = formatCoordinate(x, shortenNumbers);
        const formattedZ = formatCoordinate(z, shortenNumbers);
        
        // Скрываем placeholder
        const placeholder = element.querySelector('.result-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        element.innerHTML = `
            <div class="coordinate-result">
                <h3>${title}</h3>
                <div class="coordinate-value">X: ${formattedX} | Z: ${formattedZ}</div>
                <div style="margin-top: 10px; font-size: 0.9rem; color: #888;">
                    <i class="fas fa-map-marker-alt"></i> (${x}, ${z})
                </div>
            </div>
        `;
        element.classList.add('has-result');
    }
    
    // Функция форматирования координат
    function formatCoordinate(num, shorten = false) {
        if (!shorten) {
            return num.toString();
        }
        
        const absNum = Math.abs(num);
        
        if (absNum >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (absNum >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        
        return num.toString();
    }
    
    // Автофокус на первом поле ввода
    overworldXInput.focus();
    overworldXInput.select();
    
    // Обновляем отображение формата при загрузке
    updateFormatDisplay();
    
    // Горячие клавиши
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Сброс к начальным значениям
            overworldXInput.value = 100;
            overworldZInput.value = -200;
            lastUpdatedField = 'overworld';
            calculateBothDirections();
            overworldXInput.select();
        }
        if (e.key === 'f') {
            shortenNumbersToggle.checked = !shortenNumbersToggle.checked;
            shortenNumbers = shortenNumbersToggle.checked;
            updateFormatDisplay();
            calculateBothDirections();
        }
    });
    
    console.log('Горячие клавиши:');
    console.log('Escape - сброс к начальным значениям');
    console.log('Ctrl+F - переключить формат чисел');
});