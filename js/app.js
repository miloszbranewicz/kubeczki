document.addEventListener('DOMContentLoaded', function() {
    // Cup colors based on filenames in images folder
    const cupColors = [
        'czerwony', 'zolty', 'turkusowy', 'pomaranczowy', 'zielony',
        'rozowy', 'szary', 'fioletowy', 'niebieski', 'czarny', 'bialy'
    ];
    
    // Device detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Configuration
    const config = {
        cupWidth: 60,
        cupHeight: 60,
        gridSize: 10,
        stageWidth: 600,
        stageHeight: 600,
        selectedCupColor: null,
        cups: [],
        buildingMode: 'auto',
        ROW_SPACING: 45, // Odstęp między rzędami dla trybu piramidy
        STACK_SPACING: 60, // Odstęp dla kubeczków ułożonych jeden na drugim
        showGrid: true, // Czy pokazywać siatkę pomocniczą
        gridSpacing: 30,  // Odległość między punktami siatki
        snapToGridOnDragEnd: true, // Czy przyciągać do siatki
        isMobile: isMobile, // Czy urządzenie jest mobilne
        isTouchDevice: isTouchDevice, // Czy urządzenie ma ekran dotykowy
        longPressThreshold: 500, // Czas w ms po którym długie przytrzymanie jest uznawane za kliknięcie prawym
        doubleTapThreshold: 300, // Czas w ms pomiędzy dwoma tapnięciami aby zostały uznane za double-tap
        lastTapTime: 0 // Czas ostatniego tapnięcia (do wykrywania double-tap)
    };
    
    // DOM elements
    const gridSizeSelector = document.getElementById('grid-size');
    const clearBtn = document.getElementById('clear-btn');
    const exportBtn = document.getElementById('export-btn');
    const cupsSelection = document.getElementById('cups-selection');
    const canvasContainer = document.getElementById('canvas-container');
    
    // Check container width and adjust stage size if needed
    const containerWidth = canvasContainer.clientWidth;
    if (containerWidth < config.stageWidth) {
        config.stageWidth = containerWidth - 20; // Subtract padding
        config.stageHeight = config.stageWidth;
    }
    
    // For mobile devices, use smaller cup sizes and adjust spacing
    if (config.isMobile) {
        const scaleFactor = containerWidth < 400 ? 0.8 : 0.9;
        config.cupWidth *= scaleFactor;
        config.cupHeight *= scaleFactor;
        config.ROW_SPACING = Math.round(config.ROW_SPACING * scaleFactor);
        config.STACK_SPACING = Math.round(config.STACK_SPACING * scaleFactor);
    }
    
    // Initialize Konva stage
    const stage = new Konva.Stage({
        container: 'canvas',
        width: config.stageWidth,
        height: config.stageHeight
    });
    
    // Touch optimization for mobile devices
    if (config.isTouchDevice) {
        // Prevent default touch behaviors
        const canvasEl = document.getElementById('canvas');
        canvasEl.addEventListener('touchstart', function(e) {
            if (e.target === canvasEl || e.target.tagName === 'CANVAS') {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Set Konva drag settings for better touch handling
        Konva.dragButtons = [0, 1]; // Allow both left and right mouse buttons for drag
        Konva.hitOnDragEnabled = true; // Improve drag-and-drop performance
    }
    
    // Create layers
    const gridLayer = new Konva.Layer();
    const cupsLayer = new Konva.Layer();
    
    stage.add(gridLayer);
    stage.add(cupsLayer);
    
    // Initialize the application
    initCupsToolbar();
    updateGridSize();
    bindEvents();
    
    // If we're in development mode, create debug info
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.pyramidUtils.createDebugInfo(config, config.cups);
    }
    
    // Globals for message throttling
    let lastMessageTimestamp = 0;
    const MESSAGE_THROTTLE_MS = 1000; // Show message at most once per second
    
    /**
     * Initialize the cups selection toolbar
     */
    function initCupsToolbar() {
        cupColors.forEach(color => {
            const cupOption = document.createElement('div');
            cupOption.className = 'cup-option';
            cupOption.dataset.color = color;
            
            const cupImage = document.createElement('img');
            cupImage.src = `images/${color}_down.svg`;
            cupImage.alt = `${color} cup`;
            
            cupOption.appendChild(cupImage);
            cupsSelection.appendChild(cupOption);
            
            cupOption.addEventListener('click', function() {
                // Remove active class from all cup options
                document.querySelectorAll('.cup-option').forEach(el => {
                    el.classList.remove('active');
                });
                
                // Add active class to selected cup
                this.classList.add('active');
                
                // Set selected cup color
                config.selectedCupColor = color;
            });
        });
        
        // Select first cup by default
        if (cupColors.length > 0) {
            const firstCupOption = document.querySelector('.cup-option');
            firstCupOption.classList.add('active');
            config.selectedCupColor = cupColors[0];
        }
    }
    
    /**
     * Update the grid size based on the selected option
     */
    function updateGridSize() {
        config.gridSize = parseInt(gridSizeSelector.value);
        
        // Dostosuj rozmiar canvas do rozmiaru siatki
        const maxWidth = canvasContainer.clientWidth - 20; // Odejmujemy padding
        const desiredCellSize = 60; // Optymalny rozmiar komórki
        const desiredCanvasSize = config.gridSize * desiredCellSize;
        
        // Oblicz najlepszy rozmiar canvas, nie przekraczając dostępnej szerokości
        let newCanvasSize = Math.min(desiredCanvasSize, maxWidth);
        
        // Oblicz rozmiar komórki na podstawie nowego rozmiaru canvas
        let cellSize = window.pyramidUtils.calculateCellSize(newCanvasSize, config.gridSize);
        
        // Oblicz odstęp siatki na podstawie szerokości kubeczka
        config.gridSpacing = cellSize / 2;
        
        // Upewnij się, że canvas ma rozmiar, który jest wielokrotnością odstępu siatki
        // dzięki temu grid będzie zawsze kończył się dokładnie na krawędzi canvas
        const gridCellCount = Math.floor(newCanvasSize / config.gridSpacing);
        newCanvasSize = gridCellCount * config.gridSpacing;
        
        // Zaktualizuj rozmiary
        config.stageWidth = newCanvasSize;
        config.stageHeight = newCanvasSize;
        config.cupWidth = cellSize;
        config.cupHeight = cellSize;
        
        // Aktualizuj rozmiar stage
        stage.width(config.stageWidth);
        stage.height(config.stageHeight);
        
        // Redraw grid
        drawGrid();
        
        // Clear cups
        clearCups();
    }
    
    /**
     * Draw the grid with visual grid points for better alignment
     */
    function drawGrid() {
        gridLayer.destroyChildren();
        
        // Create a rounded rectangle as the background
        const background = new Konva.Rect({
            x: 0,
            y: 0,
            width: config.stageWidth,
            height: config.stageHeight,
            fill: '#ffffff',
            cornerRadius: 5
        });
        
        gridLayer.add(background);
        
        // Draw grid lines and points for better alignment
        if (config.showGrid) {
            const gridSpacing = config.gridSpacing;
            
            // Oblicz dokładną liczbę linii na podstawie rozmiaru canvas
            // Zapewni to, że ostatnia linia będzie dokładnie na krawędzi canvas
            const numLinesH = Math.round(config.stageHeight / gridSpacing);
            const numLinesV = Math.round(config.stageWidth / gridSpacing);
            
            // Draw horizontal lines
            for (let i = 0; i <= numLinesH; i++) {
                const line = new Konva.Line({
                    points: [0, i * gridSpacing, config.stageWidth, i * gridSpacing],
                    stroke: '#eeeeee',
                    strokeWidth: 0.5
                });
                gridLayer.add(line);
            }
            
            // Draw vertical lines
            for (let i = 0; i <= numLinesV; i++) {
                const line = new Konva.Line({
                    points: [i * gridSpacing, 0, i * gridSpacing, config.stageHeight],
                    stroke: '#eeeeee',
                    strokeWidth: 0.5
                });
                gridLayer.add(line);
            }
            
            // Draw grid intersection points - skip some points on mobile to improve performance
            const skipFactor = config.isMobile ? 2 : 1;
            for (let i = 0; i <= numLinesH; i += skipFactor) {
                for (let j = 0; j <= numLinesV; j += skipFactor) {
                    const circle = new Konva.Circle({
                        x: j * gridSpacing,
                        y: i * gridSpacing,
                        radius: config.isMobile ? 0.8 : 1,
                        fill: '#dddddd',
                    });
                    gridLayer.add(circle);
                }
            }
        }
        
        // Add click handler to the background
        background.on('click', function(e) {
            if (!config.selectedCupColor) return;
            
            // Get click position
            const pos = stage.getPointerPosition();
            
            // Sprawdź, czy kliknięcie nie zostało wykonane na istniejącym kubeczku
            const clickedOnExistingCup = e.target !== background;
            
            // Dodajemy kubeczek tylko jeśli nie kliknięto na istniejący kubeczek
            if (!clickedOnExistingCup) {
                // Zamiast używać algorytmu automatycznego umieszczania,
                // po prostu umieść kubeczek w miejscu kliknięcia
                const x = pos.x;
                const y = pos.y;
                
                // Przyciągnij do siatki, jeśli jest to włączone
                let finalX = x;
                let finalY = y;
                
                if (config.snapToGridOnDragEnd) {
                    const snapped = snapToGrid(x, y);
                    finalX = snapped.x;
                    finalY = snapped.y;
                }
                
                // Ensure position is inside canvas boundaries, accounting for cup dimensions
                const halfWidth = config.cupWidth / 2;
                const halfHeight = config.cupHeight / 2;
                
                // Check if the cup would be partially outside the canvas
                if (finalX - halfWidth < 0) {
                    finalX = halfWidth;
                } else if (finalX + halfWidth > config.stageWidth) {
                    finalX = config.stageWidth - halfWidth;
                }
                
                if (finalY - halfHeight < 0) {
                    finalY = halfHeight;
                } else if (finalY + halfHeight > config.stageHeight) {
                    finalY = config.stageHeight - halfHeight;
                }
                
                // Dodaj kubeczek, uwzględniając środek kubeczka
                const centerX = finalX;
                const centerY = finalY;
                
                // Check if the position is clear of other cups
                if (isPositionClear(centerX, centerY)) {
                    // Określ odpowiedni kierunek kubeczka na podstawie wsparcia
                    const support = findSupportForCup(centerX, centerY);
                    let direction = 'down'; // Domyślny kierunek kubeczka
                    
                    // Jeśli kubeczek stoi na jednym innym kubeczku, odwróć go względem tego pod spodem
                    if (support.type === 'single') {
                        direction = support.cups[0].direction === 'up' ? 'down' : 'up';
                    }
                    
                    // Sprawdź, czy umieszczenie kubeczka z określonym kierunkiem jest zgodne z prawami fizyki
                    const physicalCheck = isPhysicallyValid(centerX, centerY, direction);
                    
                    if (physicalCheck.isValid) {
                        addCup(
                            finalX - config.cupWidth / 2, 
                            finalY - config.cupHeight / 2, 
                            direction
                        );
                    } else {
                        console.log("Nie można umieścić kubeczka - niezgodne z prawami fizyki: " + physicalCheck.message);
                        showTemporaryMessage(physicalCheck.message, finalX, finalY - 30);
                    }
                } else {
                    console.log("Nie można umieścić kubeczka - pozycja zajęta przez inny kubeczek");
                    showTemporaryMessage('Nie można umieścić kubeczka na innym kubeczku', finalX, finalY - 30);
                }
            }
        });
        
        // Add touch handler for mobile devices
        if (config.isTouchDevice) {
            background.on('touchstart', function(e) {
                // Prevent scrolling when touching the canvas
                if (e.target === background) {
                    e.evt.preventDefault();
                }
            });
            
            background.on('tap', function(e) {
                // Forward tap event to click event
                if (e.target === background) {
                    background.fire('click', { 
                        target: background, 
                        evt: e.evt 
                    }, true);
                }
            });
        }
        
        gridLayer.draw();
    }
    
    /**
     * Przyciąga pozycję do najbliższego punktu siatki
     * @param {number} x - Pozycja X
     * @param {number} y - Pozycja Y
     * @returns {{x: number, y: number}} - Pozycja przyciągnięta do siatki
     */
    function snapToGrid(x, y) {
        // Oblicz najbliższy punkt siatki
        const gridX = Math.round(x / config.gridSpacing) * config.gridSpacing;
        const gridY = Math.round(y / config.gridSpacing) * config.gridSpacing;
        
        return { x: gridX, y: gridY };
    }
    
    /**
     * Sprawdza, czy nowy kubeczek nie nachodziłby na istniejące kubeczki
     * @param {number} x - Pozycja X środka kubeczka
     * @param {number} y - Pozycja Y środka kubeczka
     * @returns {boolean} - true jeśli pozycja jest wolna, false jeśli kubeczki by się nakładały
     */
    function isPositionClear(x, y) {
        // Minimalna dopuszczalna odległość między środkami kubeczków
        // Ustawione na 85% szerokości kubeczka dla odpowiedniego rozdzielenia
        const minDistanceSquared = Math.pow(config.cupWidth * 0.85, 2);
        
        // Sprawdź odległość od wszystkich istniejących kubeczków
        return !config.cups.some(cup => {
            const cupX = cup.cupImage.x() + config.cupWidth / 2;
            const cupY = cup.cupImage.y() + config.cupHeight / 2;
            
            // Oblicz kwadrat odległości (szybsze niż z pierwiastkiem)
            const distanceSquared = Math.pow(cupX - x, 2) + Math.pow(cupY - y, 2);
            
            // Jeśli kwadrat odległości jest mniejszy niż minimalny, kubeczki nachodziłyby na siebie
            return distanceSquared < minDistanceSquared;
        });
    }
    
    /**
     * Sprawdza, czy umieszczenie kubeczka jest zgodne z prawami fizyki
     * @param {number} x - Pozycja X środka kubeczka
     * @param {number} y - Pozycja Y środka kubeczka
     * @param {string} direction - Kierunek kubeczka ('up' lub 'down')
     * @returns {{isValid: boolean, message: string}} - Obiekt określający czy umieszczenie jest prawidłowe oraz komunikat
     */
    function isPhysicallyValid(x, y, direction) {
        // Kubeczki na samym dole (najniższa warstwa) zawsze są prawidłowe
        const lowestCupY = findLowestCupY();
        
        // Tolerancja dla porównań pozycji Y (aby uwzględnić drobne różnice w pozycjonowaniu)
        const yTolerance = 10;
        
        // Jeśli jest to pierwsza warstwa lub kubeczek jest na najniższej warstwie
        if (config.cups.length === 0 || Math.abs(y - lowestCupY) <= yTolerance) {
            return { isValid: true, message: "" };
        }
        
        // Sprawdź, czy kubeczek ma odpowiednie wsparcie
        const support = findSupportForCup(x, y);
        
        // Przypadek 1: Kubeczek stoi na jednym kubeczku
        if (support.type === 'single') {
            // Kubeczek musi być odwrócony w stosunku do kubeczka pod nim
            const shouldBeDirection = support.cups[0].direction === 'up' ? 'down' : 'up';
            
            if (direction !== shouldBeDirection) {
                return { 
                    isValid: false, 
                    message: `Kubeczek stojący na innym musi być odwrócony (${shouldBeDirection === 'up' ? 'do góry' : 'do dołu'})` 
                };
            }
            return { isValid: true, message: "" };
        }
        
        // Przypadek 2: Kubeczek jest wspierany przez dwa kubeczki
        else if (support.type === 'double') {
            // Sprawdź, czy kubeczek nie jest umieszczony szerzej niż warstwa pod nim
            if (!isWithinSupportWidth(x, support.cups)) {
                return { 
                    isValid: false, 
                    message: "Kubeczek nie może wystawać poza kubeczki, na których stoi" 
                };
            }
            
            // Dla podwójnego wsparcia, kierunek nie jest ograniczony
            return { isValid: true, message: "" };
        }
        
        // Przypadek 3: Brak wsparcia - kubeczek jest w powietrzu
        return { 
            isValid: false, 
            message: "Kubeczek musi stać na innym kubeczku lub mieć dwa kubeczki jako wsparcie" 
        };
    }
    
    /**
     * Znajduje najniższą wartość Y dla istniejących kubeczków (najniższa warstwa)
     * @returns {number} - Najniższa wartość Y kubeczków lub -1 jeśli nie ma kubeczków
     */
    function findLowestCupY() {
        if (config.cups.length === 0) return -1;
        
        return Math.max(...config.cups.map(cup => cup.cupImage.y() + config.cupHeight / 2));
    }
    
    /**
     * Znajduje kubeczki wspierające pod wskazaną pozycją
     * @param {number} x - Pozycja X środka kubeczka
     * @param {number} y - Pozycja Y środka kubeczka
     * @returns {{type: string, cups: Array}} - Typ wsparcia ('none', 'single', 'double') i kubeczki wspierające
     */
    function findSupportForCup(x, y) {
        // Tolerancja dla porównań pozycji
        const yTolerance = 15;  // Tolerancja odległości w pionie
        const xTolerance = config.cupWidth;  // Tolerancja odległości w poziomie dla podwójnego wsparcia
        
        // Znajdź kubeczki pod umieszczanym kubeczkiem (w odległości około jednego kubeczka w pionie)
        const potentialSupports = config.cups.filter(cup => {
            const cupX = cup.cupImage.x() + config.cupWidth / 2;
            const cupY = cup.cupImage.y() + config.cupHeight / 2;
            
            // Sprawdź, czy kubeczek jest bezpośrednio pod umieszczanym kubeczkiem
            const isBelow = cupY > y && Math.abs(cupY - y) <= config.ROW_SPACING + yTolerance;
            
            // Sprawdź, czy kubeczek jest w odpowiedniej odległości w poziomie
            const isWithinRange = Math.abs(cupX - x) <= xTolerance;
            
            return isBelow && isWithinRange;
        });
        
        if (potentialSupports.length === 0) {
            return { type: 'none', cups: [] };
        }
        
        // Sprawdź czy to wsparcie pojedyncze (jeden kubeczek bezpośrednio pod)
        const directlyBelow = potentialSupports.find(cup => {
            const cupX = cup.cupImage.x() + config.cupWidth / 2;
            return Math.abs(cupX - x) <= config.cupWidth / 3;
        });
        
        if (directlyBelow) {
            return { type: 'single', cups: [directlyBelow] };
        }
        
        // Sprawdź czy można znaleźć dwa kubeczki jako wsparcie
        if (potentialSupports.length >= 2) {
            // Posortuj kubeczki od lewej do prawej
            const sortedSupports = [...potentialSupports].sort((a, b) => {
                const aX = a.cupImage.x() + config.cupWidth / 2;
                const bX = b.cupImage.x() + config.cupWidth / 2;
                return aX - bX;
            });
            
            // Znajdź dwa kubeczki, które mogą stanowić wsparcie (po lewej i prawej stronie od punktu x)
            let leftSupport = null;
            let rightSupport = null;
            
            for (const cup of sortedSupports) {
                const cupX = cup.cupImage.x() + config.cupWidth / 2;
                
                if (cupX < x && (!leftSupport || cupX > leftSupport.cupImage.x() + config.cupWidth / 2)) {
                    leftSupport = cup;
                } else if (cupX > x && (!rightSupport || cupX < rightSupport.cupImage.x() + config.cupWidth / 2)) {
                    rightSupport = cup;
                }
            }
            
            // Jeśli znaleziono kubeczki po obu stronach i są odpowiednio blisko siebie
            if (leftSupport && rightSupport) {
                const leftX = leftSupport.cupImage.x() + config.cupWidth / 2;
                const rightX = rightSupport.cupImage.x() + config.cupWidth / 2;
                
                // Sprawdź czy kubeczki są odpowiednio blisko siebie (nie więcej niż 2x szerokość kubeczka)
                if (rightX - leftX <= config.cupWidth * 2) {
                    return { type: 'double', cups: [leftSupport, rightSupport] };
                }
            }
        }
        
        return { type: 'none', cups: [] };
    }
    
    /**
     * Sprawdza, czy kubeczek jest umieszczony w obrębie szerokości kubeczków wspierających
     * @param {number} x - Pozycja X środka kubeczka
     * @param {Array} supportCups - Kubeczki wspierające
     * @returns {boolean} - true jeśli kubeczek jest w obrębie wsparcia
     */
    function isWithinSupportWidth(x, supportCups) {
        if (supportCups.length < 2) return false;
        
        // Znajdź lewy i prawy brzeg obszaru wsparcia
        const supportX = supportCups.map(cup => cup.cupImage.x() + config.cupWidth / 2);
        const leftEdge = Math.min(...supportX) - config.cupWidth / 4;
        const rightEdge = Math.max(...supportX) + config.cupWidth / 4;
        
        // Kubeczek nie powinien wystawać poza obszar wsparcia
        return x >= leftEdge && x <= rightEdge;
    }
    
    /**
     * Znajduje kubeczki wspierające pod wskazaną pozycją (tryb piramidy)
     */
    function findSupportingCups(x, y) {
        // Szukamy dokładnie dwóch kubeczków, które mogą tworzyć podporę dla piramidy
        const potentialSupportCups = config.cups.filter(cup => {
            const cupX = cup.cupImage.x() + config.cupWidth / 2;
            const cupY = cup.cupImage.y() + config.cupHeight / 2;
            
            // Sprawdź, czy kubeczek jest w odpowiedniej odległości pionowej
            const isCorrectVerticalDistance = Math.abs(cupY - (y + config.ROW_SPACING)) < 15;
            
            // Kubeczki powinny być po lewej i prawej stronie od punktu kliknięcia
            // ale nie dalej niż szerokość kubeczka od punktu kliknięcia
            const isWithinHorizontalRange = Math.abs(cupX - x) < config.cupWidth * 1.2;
            
            return isCorrectVerticalDistance && isWithinHorizontalRange;
        });
        
        // Jeśli mamy więcej niż dwa potencjalne kubeczki, wybierz dwa najbliższe
        let finalSupportCups = potentialSupportCups;
        if (potentialSupportCups.length > 2) {
            // Sortuj według odległości od punktu kliknięcia w poziomie
            finalSupportCups = potentialSupportCups.sort((a, b) => {
                const aX = a.cupImage.x() + config.cupWidth / 2;
                const bX = b.cupImage.x() + config.cupWidth / 2;
                
                const aDist = Math.abs(aX - x);
                const bDist = Math.abs(bX - x);
                
                return aDist - bDist;
            }).slice(0, 2);
        }
        
        // Jeśli mamy dokładnie dwa kubeczki potencjalnego wsparcia
        if (finalSupportCups.length === 2) {
            // Sprawdź, czy kubeczki są odpowiednio rozmieszczone (jeden po lewej, drugi po prawej)
            const cup1X = finalSupportCups[0].cupImage.x() + config.cupWidth / 2;
            const cup2X = finalSupportCups[1].cupImage.x() + config.cupWidth / 2;
            
            // Oblicz odległość między kubeczkami w poziomie
            const horizontalDistance = Math.abs(cup1X - cup2X);
            
            // Sprawdź, czy kubeczki są po przeciwnych stronach punktu kliknięcia
            const isOnOppositeSides = (cup1X < x && cup2X > x) || (cup1X > x && cup2X < x);
            
            // Sprawdź, czy odległość między kubeczkami jest odpowiednia dla piramidy
            // Typowa odległość to około szerokość kubeczka plus ewentualny odstęp
            const isProperDistance = horizontalDistance >= config.cupWidth * 0.9 && 
                                     horizontalDistance <= config.cupWidth * 2.2;
            
            if (isOnOppositeSides && isProperDistance) {
                // Dodatkowe sprawdzenie - oblicz dokładną pozycję kubeczka na środku
                const centerX = (cup1X + cup2X) / 2;
                const centerY = finalSupportCups[0].cupImage.y() + config.cupHeight / 2 - config.ROW_SPACING;
                
                // Sprawdź, czy w tej pozycji kubeczek nie nachodzi na inne
                if (isPositionClear(centerX, centerY)) {
                    return finalSupportCups;
                }
            }
        }
        
        // Znajdź kubeczki, które są już ułożone w piramidę (mają wspólną podporę)
        // Pomaga to w rozpoznawaniu wzorca układania piramidy
        const existingPyramidPatterns = findExistingPyramidPatterns();
        if (existingPyramidPatterns.length > 0) {
            // Sprawdź, czy któryś z wzorców pasuje do naszej pozycji kliknięcia
            const matchingPattern = existingPyramidPatterns.find(pattern => {
                const patternCenter = pattern.center;
                // Sprawdź, czy kliknięcie jest w pobliżu istniejącego wzorca piramidy
                return Math.abs(patternCenter.x - x) < config.cupWidth * 1.5 &&
                       Math.abs(patternCenter.y - y) < config.ROW_SPACING * 1.5;
            });
            
            if (matchingPattern) {
                // Sprawdź, czy w tej pozycji kubeczek nie nachodzi na inne
                if (isPositionClear(matchingPattern.center.x, matchingPattern.center.y - config.ROW_SPACING)) {
                    return matchingPattern.supportCups;
                }
            }
        }
        
        return finalSupportCups.length === 2 ? finalSupportCups : [];
    }
    
    /**
     * Znajduje istniejące wzorce piramid w konstrukcji
     * Pomaga w rozpoznawaniu zamierzonego sposobu układania
     */
    function findExistingPyramidPatterns() {
        const patterns = [];
        
        // Przeanalizuj każdą trójkę kubeczków, która może tworzyć wzorzec piramidy
        for (let i = 0; i < config.cups.length; i++) {
            const topCup = config.cups[i];
            const topX = topCup.cupImage.x() + config.cupWidth / 2;
            const topY = topCup.cupImage.y() + config.cupHeight / 2;
            
            // Znajdź potencjalne kubeczki podpierające
            const supportCups = config.cups.filter((cup, index) => {
                if (index === i) return false; // Pomijam ten sam kubeczek
                
                const cupX = cup.cupImage.x() + config.cupWidth / 2;
                const cupY = cup.cupImage.y() + config.cupHeight / 2;
                
                // Sprawdź, czy kubeczek jest poniżej topCup w odpowiedniej odległości
                return Math.abs(cupY - (topY + config.ROW_SPACING)) < 15;
            });
            
            // Jeśli mamy dokładnie dwa kubeczki podpierające
            if (supportCups.length === 2) {
                const cup1X = supportCups[0].cupImage.x() + config.cupWidth / 2;
                const cup2X = supportCups[1].cupImage.x() + config.cupWidth / 2;
                
                // Sprawdź, czy topCup jest w środku między dwoma kubeczkami wspierającymi
                if (Math.abs(topX - (cup1X + cup2X) / 2) < 15) {
                    // To jest wzorzec piramidy
                    patterns.push({
                        topCup: topCup,
                        supportCups: supportCups,
                        center: { x: topX, y: topY }
                    });
                }
            }
        }
        
        return patterns;
    }
    
    /**
     * Znajduje kubeczek bezpośrednio pod wskazaną pozycją (tryb stosu)
     */
    function findStackedCup(x, y) {
        // Szukaj kubeczka, który może być podstawą dla stosu
        const stackedCup = config.cups.find(cup => {
            const cupX = cup.cupImage.x() + config.cupWidth / 2;
            const cupY = cup.cupImage.y() + config.cupHeight / 2;
            
            // Sprawdź, czy kubeczek jest bezpośrednio pod punktem kliknięcia
            const isDirectlyBelow = Math.abs(cupX - x) < config.cupWidth / 3;
            const isAtStackingDistance = Math.abs(cupY - (y + config.STACK_SPACING)) < 15;
            
            return isDirectlyBelow && isAtStackingDistance;
        });
        
        if (stackedCup) {
            // Oblicz dokładną pozycję kubeczka na stosie
            const stackX = stackedCup.cupImage.x() + config.cupWidth / 2;
            const stackY = stackedCup.cupImage.y() + config.cupHeight / 2 - config.STACK_SPACING;
            
            // Sprawdź, czy w tej pozycji kubeczek nie nachodzi na inne
            if (isPositionClear(stackX, stackY)) {
                return stackedCup;
            }
        }
        
        return null;
    }
    
    /**
     * Analizuje otoczenie punktu kliknięcia, aby lepiej określić intencję
     * budowy (piramida, stos lub podstawowa konstrukcja)
     */
    function analyzeClickPosition(x, y) {
        // Sprawdź obecność kubeczków w pobliżu punktu kliknięcia
        const nearbyCups = config.cups.filter(cup => {
            const cupX = cup.cupImage.x() + config.cupWidth / 2;
            const cupY = cup.cupImage.y() + config.cupHeight / 2;
            
            return Math.sqrt(Math.pow(cupX - x, 2) + Math.pow(cupY - y, 2)) < config.cupWidth * 1.5;
        });
        
        // Sprawdź, czy mamy wzorce piramidy w okolicy
        const pyramidPatterns = findExistingPyramidPatterns().filter(pattern => {
            const patternCenter = pattern.center;
            return Math.abs(patternCenter.x - x) < config.cupWidth * 2 &&
                   Math.abs(patternCenter.y - y) < config.ROW_SPACING * 2;
        });
        
        // Sprawdź, czy mamy stosy w okolicy
        const stackPatterns = findStackPatterns().filter(pattern => {
            const patternCenter = pattern.center;
            return Math.abs(patternCenter.x - x) < config.cupWidth &&
                   Math.abs(patternCenter.y - y) < config.STACK_SPACING * 1.5;
        });
        
        return {
            nearbyCups: nearbyCups,
            pyramidPatterns: pyramidPatterns,
            stackPatterns: stackPatterns,
            // Wskaźnik prawdopodobieństwa dla każdego typu konstrukcji
            probabilities: {
                pyramid: pyramidPatterns.length > 0 ? 0.8 : (nearbyCups.length >= 2 ? 0.5 : 0.1),
                stack: stackPatterns.length > 0 ? 0.8 : (nearbyCups.length === 1 ? 0.6 : 0.1),
                basic: nearbyCups.length === 0 ? 0.9 : 0.2
            }
        };
    }
    
    /**
     * Znajduje wzorce stosów w istniejącej konstrukcji
     */
    function findStackPatterns() {
        const patterns = [];
        
        // Przeanalizuj każdą parę kubeczków, która może tworzyć wzorzec stosu
        for (let i = 0; i < config.cups.length; i++) {
            const bottomCup = config.cups[i];
            const bottomX = bottomCup.cupImage.x() + config.cupWidth / 2;
            const bottomY = bottomCup.cupImage.y() + config.cupHeight / 2;
            
            // Znajdź kubeczki nad tym kubeczkiem
            const topCups = config.cups.filter((cup, index) => {
                if (index === i) return false; // Pomijam ten sam kubeczek
                
                const cupX = cup.cupImage.x() + config.cupWidth / 2;
                const cupY = cup.cupImage.y() + config.cupHeight / 2;
                
                // Sprawdź, czy kubeczek jest nad bottomCup w odpowiedniej odległości
                return Math.abs(cupX - bottomX) < 10 &&
                       Math.abs(cupY - (bottomY - config.STACK_SPACING)) < 15;
            });
            
            if (topCups.length > 0) {
                // To jest wzorzec stosu
                patterns.push({
                    bottomCup: bottomCup,
                    topCups: topCups,
                    center: { x: bottomX, y: bottomY }
                });
            }
        }
        
        return patterns;
    }
    
    /**
     * Umieszcza kubeczek na podstawie pozycji kliknięcia
     */
    function placeCupBasedOnClickPosition(x, y) {
        let finalX = x;
        let finalY = y;
        let cupDirection = 'down'; // Domyślnie kubeczek skierowany wierzchołkiem w dół
        let placementType = 'basic'; // Typ umieszczenia: 'pyramid', 'stack', 'basic'
        
        // Analizuj otoczenie punktu kliknięcia, aby lepiej określić intencję
        const analysisResult = analyzeClickPosition(x, y);
        
        // Sprawdź, czy kubeczek ma być ułożony na dwóch innych (tryb piramidy)
        const supportingCups = findSupportingCups(x, y);
        if (supportingCups.length === 2) {
            // Umieść kubeczek dokładnie na środku między dwoma kubeczkami wspierającymi
            const cup1X = supportingCups[0].cupImage.x() + config.cupWidth / 2;
            const cup2X = supportingCups[1].cupImage.x() + config.cupWidth / 2;
            const cup1Y = supportingCups[0].cupImage.y() + config.cupHeight / 2;
            
            finalX = (cup1X + cup2X) / 2;
            finalY = cup1Y - config.ROW_SPACING;
            placementType = 'pyramid';
            
            // Określ kierunek kubeczka na podstawie istniejących wzorców piramid
            if (analysisResult.pyramidPatterns.length > 0) {
                // Znajdź wzorzec piramidy najbliżej punktu kliknięcia
                const closestPattern = analysisResult.pyramidPatterns.reduce((closest, pattern) => {
                    const distance = Math.sqrt(
                        Math.pow(pattern.center.x - x, 2) + 
                        Math.pow(pattern.center.y - y, 2)
                    );
                    return !closest || distance < closest.distance ? { pattern, distance } : closest;
                }, null);
                
                if (closestPattern) {
                    // Użyj przeciwnego kierunku niż kubeczek w najbliższym wzorcu
                    cupDirection = closestPattern.pattern.topCup.direction === 'up' ? 'down' : 'up';
                } else {
                    cupDirection = 'up'; // Domyślnie w piramidzie co druga warstwa ma kubeczki w górę
                }
            } else {
                cupDirection = 'up'; // W piramidzie co druga warstwa ma kubeczki w górę
            }
        } 
        // Sprawdź, czy kubeczek ma być ułożony na innym kubeczku (tryb stosu)
        else {
            const stackedCup = findStackedCup(x, y);
            if (stackedCup) {
                finalX = stackedCup.cupImage.x() + config.cupWidth / 2;
                finalY = stackedCup.cupImage.y() + config.cupHeight / 2 - config.STACK_SPACING;
                placementType = 'stack';
                
                // Kierunek kubeczka przeciwny do niższego kubeczka
                cupDirection = stackedCup.direction === 'up' ? 'down' : 'up';
            } else {
                // Jeśli nie jest ani piramida ani stos, to przyciągnij do siatki
                // Sprawdź, czy w pobliżu są jakieś kubeczki, które mogą sugerować preferencję typu konstrukcji
                if (analysisResult.probabilities.pyramid > analysisResult.probabilities.stack && 
                    analysisResult.probabilities.pyramid > analysisResult.probabilities.basic) {
                    // Jeśli w pobliżu jest więcej wzorców piramidy, dostosuj położenie do siatki piramidy
                    if (analysisResult.pyramidPatterns.length > 0) {
                        const closestPattern = analysisResult.pyramidPatterns[0];
                        const patternY = closestPattern.center.y;
                        // Dostosuj wysokość do istniejącego wzorca piramidy
                        finalY = patternY - Math.round((patternY - y) / config.ROW_SPACING) * config.ROW_SPACING;
                    }
                } else if (analysisResult.probabilities.stack > analysisResult.probabilities.pyramid && 
                           analysisResult.probabilities.stack > analysisResult.probabilities.basic) {
                    // Jeśli w pobliżu jest więcej wzorców stosu, dostosuj położenie do siatki stosu
                    if (analysisResult.stackPatterns.length > 0) {
                        const closestPattern = analysisResult.stackPatterns[0];
                        finalX = closestPattern.center.x;
                    }
                }
                
                // Ostatecznie przyciągnij do najbliższego punktu siatki
                const snapped = snapToGrid(finalX, finalY);
                finalX = snapped.x;
                finalY = snapped.y;
                
                // Sprawdź, czy w docelowej pozycji kubeczek nie nachodzi na inne
                if (!isPositionClear(finalX, finalY)) {
                    // Jeśli pozycja nie jest wolna, spróbuj znaleźć najbliższą wolną pozycję na siatce
                    const freePosition = findNearestFreePosition(finalX, finalY);
                    if (freePosition) {
                        finalX = freePosition.x;
                        finalY = freePosition.y;
                    } else {
                        // Jeśli nie ma wolnej pozycji w pobliżu, przerwij
                        console.log("Nie można umieścić kubeczka - brak miejsca");
                        return;
                    }
                }
            }
        }
        
        // Sprawdź, czy kubeczek nie wyszedłby poza granice canvas
        if (finalX - config.cupWidth / 2 < 0 || 
            finalX + config.cupWidth / 2 > config.stageWidth || 
            finalY - config.cupHeight / 2 < 0 || 
            finalY + config.cupHeight / 2 > config.stageHeight) {
            
            // Zamiast tylko wyświetlać komunikat, dostosuj pozycję tak, aby kubeczek był wewnątrz canvas
            if (finalX - config.cupWidth / 2 < 0) {
                finalX = config.cupWidth / 2;
            }
            if (finalX + config.cupWidth / 2 > config.stageWidth) {
                finalX = config.stageWidth - config.cupWidth / 2;
            }
            if (finalY - config.cupHeight / 2 < 0) {
                finalY = config.cupHeight / 2;
            }
            if (finalY + config.cupHeight / 2 > config.stageHeight) {
                finalY = config.stageHeight - config.cupHeight / 2;
            }
        }
        
        // Ostateczne sprawdzenie, czy pozycja jest wolna
        if (!isPositionClear(finalX, finalY)) {
            console.log("Nie można umieścić kubeczka - pozycja zajęta");
            return;
        }
        
        // Dodaj kubeczek w określonej pozycji, z przesunięciem, by centrum kubeczka było w punkcie siatki
        addCup(finalX - config.cupWidth / 2, finalY - config.cupHeight / 2, cupDirection);
        
        // Opcjonalnie: Wyświetl informację o typie umieszczenia (pomocne w debugowaniu)
        // console.log(`Umieszczono kubeczek w trybie: ${placementType}`);
    }
    
    /**
     * Znajduje najbliższą wolną pozycję na siatce
     * @param {number} startX - Początkowa pozycja X
     * @param {number} startY - Początkowa pozycja Y
     * @returns {Object|null} - Współrzędne znalezionej pozycji lub null jeśli nie znaleziono
     */
    function findNearestFreePosition(startX, startY) {
        // Maksymalna odległość poszukiwań (w punktach siatki)
        const maxSearchDistance = 3;
        
        // Sprawdź oryginalną pozycję jeszcze raz (może być już wolna)
        if (isPositionClear(startX, startY) && isWithinCanvasBounds(startX, startY)) {
            return { x: startX, y: startY };
        }
        
        // Sprawdź pozycje wokół wskazanej lokalizacji w kręgach o rosnącym promieniu
        for (let distance = 1; distance <= maxSearchDistance; distance++) {
            // Sprawdź punkty siatki w kwadracie o boku 2*distance wokół startowego punktu
            for (let dy = -distance; dy <= distance; dy++) {
                for (let dx = -distance; dx <= distance; dx++) {
                    // Pomijamy punkty, które nie leżą na obwodzie kwadratu
                    if (Math.abs(dx) < distance && Math.abs(dy) < distance) continue;
                    
                    // Oblicz potencjalną pozycję
                    const testX = startX + dx * config.gridSpacing;
                    const testY = startY + dy * config.gridSpacing;
                    
                    // Sprawdź, czy pozycja jest w granicach canvas uwzględniając rozmiar kubeczka
                    if (!isWithinCanvasBounds(testX, testY)) {
                        continue;
                    }
                    
                    // Sprawdź, czy pozycja jest wolna
                    if (isPositionClear(testX, testY)) {
                        return { x: testX, y: testY };
                    }
                }
            }
        }
        
        // Nie znaleziono wolnej pozycji
        return null;
    }
    
    /**
     * Sprawdza, czy pozycja kubeczka mieści się w granicach canvas
     * @param {number} x - Pozycja X środka kubeczka
     * @param {number} y - Pozycja Y środka kubeczka
     * @returns {boolean} - true jeśli kubeczek mieści się w canvas, false jeśli nie
     */
    function isWithinCanvasBounds(x, y) {
        // Sprawdź czy kubeczek umieszczony na podanych koordynatach
        // będzie całkowicie wewnątrz canvas
        const halfWidth = config.cupWidth / 2;
        const halfHeight = config.cupHeight / 2;
        
        return (x - halfWidth >= 0) && 
               (x + halfWidth <= config.stageWidth) && 
               (y - halfHeight >= 0) && 
               (y + halfHeight <= config.stageHeight);
    }
    
    /**
     * Add a cup to the grid
     */
    function addCup(x, y, direction) {
        // Sprawdź, czy kubeczek nie wychodzi poza granice canvas
        if (x < 0 || x + config.cupWidth > config.stageWidth || 
            y < 0 || y + config.cupHeight > config.stageHeight) {
            console.log("Nie można umieścić kubeczka - wyszedłby poza granice płótna");
            
            // Adjust the position to be within the canvas boundaries
            if (x < 0) x = 0;
            if (x + config.cupWidth > config.stageWidth) x = config.stageWidth - config.cupWidth;
            if (y < 0) y = 0;
            if (y + config.cupHeight > config.stageHeight) y = config.stageHeight - config.cupHeight;
        }
        
        // Stwórz obraz kubeczka
        const cupImage = new Konva.Image({
            x: x,
            y: y,
            width: config.cupWidth,
            height: config.cupHeight,
            draggable: true, // Uczyń kubeczek przesuwalnym
        });
        
        // Załaduj obraz
        const imageObj = new Image();
        imageObj.onload = function() {
            cupImage.image(imageObj);
            cupsLayer.draw();
        };
        imageObj.src = `images/${config.selectedCupColor}_${direction}.svg`;
        
        // Dodaj właściwości niestandardowe do obrazu kubeczka
        cupImage.direction = direction;
        cupImage.color = config.selectedCupColor;
        
        // Zmienne do śledzenia długiego przytrzymania na urządzeniach mobilnych
        let longPressTimer;
        let hasMoved = false;
        let lastTapTime = 0;
        
        // Dodaj event dla usuwania kubeczków prawym przyciskiem myszy
        cupImage.on('contextmenu', function(e) {
            e.evt.preventDefault();
            removeCup(this);
        });
        
        // Specjalne obsługiwanie dotknięć na urządzeniach mobilnych
        if (config.isTouchDevice) {
            // Rozpoczęcie dotyku - potencjalnie długie przytrzymanie
            cupImage.on('touchstart', function(e) {
                // Anuluj bieżące odliczanie (jeśli istnieje)
                if (longPressTimer) clearTimeout(longPressTimer);
                
                hasMoved = false;
                
                // Rozpocznij nowe odliczanie
                longPressTimer = setTimeout(() => {
                    if (!hasMoved) {
                        removeCup(this); // Usuń kubeczek przy długim przytrzymaniu
                        
                        // Wibracja jako potwierdzenie (jeśli dostępne)
                        if (navigator.vibrate) {
                            navigator.vibrate(100);
                        }
                    }
                }, config.longPressThreshold);
            });
            
            // Ruch podczas dotyku
            cupImage.on('touchmove', function() {
                hasMoved = true;
                if (longPressTimer) clearTimeout(longPressTimer);
            });
            
            // Zakończenie dotyku
            cupImage.on('touchend', function(e) {
                if (longPressTimer) clearTimeout(longPressTimer);
                
                // Sprawdź czy to double-tap (do obracania kubeczka)
                const now = Date.now();
                if (now - config.lastTapTime < config.doubleTapThreshold && !hasMoved) {
                    e.cancelBubble = true;
                    
                    // Znajdź obiekt kubeczka w tablicy config.cups
                    const cupIndex = config.cups.findIndex(cup => cup.cupImage === this);
                    if (cupIndex !== -1) {
                        rotateCup(config.cups[cupIndex]);
                    }
                }
                config.lastTapTime = now;
            });
        }
        
        // Dodaj event dla obracania kubeczków przy kliknięciu
        // Tylko dla urządzeń niemobilnych (na mobilnych używamy double-tap)
        if (!config.isTouchDevice) {
            cupImage.on('click', function(e) {
                e.cancelBubble = true; // Zapobiega propagacji zdarzenia do stage
                
                // Znajdź obiekt kubeczka w tablicy config.cups
                const cupIndex = config.cups.findIndex(cup => cup.cupImage === this);
                if (cupIndex !== -1) {
                    rotateCup(config.cups[cupIndex]);
                }
            });
        }
        
        // Obsługa przeciągania kubeczków
        cupImage.on('dragstart', function() {
            // Przenieś ten kubeczek na wierzch warstwy
            this.moveToTop();
            cupsLayer.draw();
        });
        
        cupImage.on('dragmove', function(e) {
            // Store original position
            const originalPos = {
                x: this.x(),
                y: this.y()
            };
            
            // Check canvas boundaries first
            const pos = this.position();
            
            // Prevent cups from being dragged outside canvas boundaries
            if (pos.x < 0) {
                this.x(0);
            } else if (pos.x + config.cupWidth > config.stageWidth) {
                this.x(config.stageWidth - config.cupWidth);
            }
            
            if (pos.y < 0) {
                this.y(0);
            } else if (pos.y + config.cupHeight > config.stageHeight) {
                this.y(config.stageHeight - config.cupHeight);
            }
            
            // After boundary adjustment, check for collisions with other cups
            const centerX = this.x() + config.cupWidth / 2;
            const centerY = this.y() + config.cupHeight / 2;
            
            // Temporarily remove this cup from the cups array to avoid self-collision
            const cupIndex = config.cups.findIndex(cup => cup.cupImage === this);
            let currentCup = null;
            
            if (cupIndex !== -1) {
                currentCup = config.cups.splice(cupIndex, 1)[0];
            }
            
            // Check if the position is clear
            const positionClear = isPositionClear(centerX, centerY);
            
            // Add the cup back to the array
            if (currentCup) {
                config.cups.push(currentCup);
            }
            
            // If there's a collision, revert to the original position and show visual feedback
            if (!positionClear) {
                this.position(originalPos);
                e.cancelBubble = true; // Stops the drag event
                
                // Visual feedback - add a red tint to indicate collision
                this.cache();
                this.filters([Konva.Filters.RGBA]);
                this.red(255);
                this.green(180);
                this.blue(180);
                
                // Show a message about collision (now with throttling)
                const stagePos = stage.getPointerPosition();
                if (stagePos) {
                    showTemporaryMessage('Nie można umieścić kubeczka na innym kubeczku', stagePos.x, stagePos.y - 30);
                    // No need to check the return value as the visual cue will still show
                }
                
                // Reset the filter after a brief moment
                setTimeout(() => {
                    this.filters([]);
                    this.clearCache();
                    cupsLayer.batchDraw();
                }, 200);
            } else {
                // Reset any filters that might be active
                this.filters([]);
                this.clearCache();
            }
            
            cupsLayer.batchDraw();
        });
        
        // Handle drag end
        cupImage.on('dragend', function() {
            const pos = this.position();
            const originalPos = {
                x: pos.x,
                y: pos.y
            };
            
            let finalX = pos.x;
            let finalY = pos.y;
            
            // Only snap to grid if the option is enabled
            let snappedPosition = null;
            if (config.snapToGridOnDragEnd) {
                snappedPosition = snapToGrid(pos.x, pos.y);
                finalX = snappedPosition.x;
                finalY = snappedPosition.y;
            }
            
            // Ensure the cup stays within canvas boundaries
            if (finalX < 0) {
                finalX = 0;
            } else if (finalX + config.cupWidth > config.stageWidth) {
                finalX = config.stageWidth - config.cupWidth;
            }
            
            if (finalY < 0) {
                finalY = 0;
            } else if (finalY + config.cupHeight > config.stageHeight) {
                finalY = config.stageHeight - config.cupHeight;
            }
            
            // Check for collision with other cups
            const centerX = finalX + config.cupWidth / 2;
            const centerY = finalY + config.cupHeight / 2;
            
            // Temporarily remove this cup from the cups array to avoid self-collision
            const cupIndex = config.cups.findIndex(cup => cup.cupImage === this);
            let currentCup = null;
            
            if (cupIndex !== -1) {
                currentCup = config.cups.splice(cupIndex, 1)[0];
            }
            
            // Check if position is clear of other cups
            let positionClear = isPositionClear(centerX, centerY);
            
            // Jeśli pozycja jest wolna, określ odpowiedni kierunek kubeczka na podstawie wsparcia
            if (positionClear && currentCup) {
                // Sprawdź wsparcie pod kubeczkiem
                const support = findSupportForCup(centerX, centerY);
                
                // Jeśli kubeczek stoi na jednym innym kubeczku, odwróć go względem tego pod spodem
                if (support.type === 'single') {
                    const newDirection = support.cups[0].direction === 'up' ? 'down' : 'up';
                    
                    // Jeśli kierunek się zmienił, załaduj odpowiedni obraz
                    if (newDirection !== currentCup.direction) {
                        currentCup.direction = newDirection;
                        
                        // Załaduj nowy obraz dla kubeczka
                        const imageObj = new Image();
                        imageObj.onload = function() {
                            currentCup.cupImage.image(imageObj);
                            cupsLayer.draw();
                        };
                        imageObj.src = `images/${currentCup.color}_${newDirection}.svg`;
                    }
                }
                
                // Sprawdź, czy przesunięcie jest zgodne z prawami fizyki
                const physicalCheck = isPhysicallyValid(centerX, centerY, currentCup.direction);
                positionClear = positionClear && physicalCheck.isValid;
                
                // Jeśli nie jest zgodne z fizyką, ale być może przy innym kierunku byłoby OK
                if (!physicalCheck.isValid && support.type === 'single') {
                    // Spróbuj z przeciwnym kierunkiem
                    const alternateDirection = currentCup.direction === 'up' ? 'down' : 'up';
                    const alternateCheck = isPhysicallyValid(centerX, centerY, alternateDirection);
                    
                    if (alternateCheck.isValid) {
                        // Użyj alternatywnego kierunku
                        currentCup.direction = alternateDirection;
                        positionClear = true;
                        
                        // Załaduj nowy obraz dla kubeczka
                        const imageObj = new Image();
                        imageObj.onload = function() {
                            currentCup.cupImage.image(imageObj);
                            cupsLayer.draw();
                        };
                        imageObj.src = `images/${currentCup.color}_${alternateDirection}.svg`;
                    } else {
                        // Zachowaj oryginalny komunikat
                        physicalCheck.message = physicalCheck.message;
                    }
                }
            }
            
            // If the snapped position has a collision, try to find a nearby free position
            if (!positionClear && snappedPosition) {
                const freePosition = findNearestFreePosition(centerX, centerY);
                
                if (freePosition) {
                    finalX = freePosition.x - config.cupWidth / 2;
                    finalY = freePosition.y - config.cupHeight / 2;
                    
                    // Sprawdź ponownie, czy nowa pozycja jest zgodna z prawami fizyki
                    if (currentCup) {
                        const support = findSupportForCup(freePosition.x, freePosition.y);
                        
                        // Jeśli kubeczek stoi na jednym innym kubeczku, odwróć go względem tego pod spodem
                        if (support.type === 'single') {
                            const newDirection = support.cups[0].direction === 'up' ? 'down' : 'up';
                            
                            // Jeśli kierunek się zmienił, załaduj odpowiedni obraz
                            if (newDirection !== currentCup.direction) {
                                currentCup.direction = newDirection;
                                
                                // Załaduj nowy obraz dla kubeczka
                                const imageObj = new Image();
                                imageObj.onload = function() {
                                    currentCup.cupImage.image(imageObj);
                                    cupsLayer.draw();
                                };
                                imageObj.src = `images/${currentCup.color}_${newDirection}.svg`;
                            }
                        }
                        
                        const physicalCheck = isPhysicallyValid(freePosition.x, freePosition.y, currentCup.direction);
                        positionClear = isPositionClear(freePosition.x, freePosition.y) && physicalCheck.isValid;
                        
                        // Jeśli nie jest zgodne z fizyką, ale być może przy innym kierunku byłoby OK
                        if (!physicalCheck.isValid && support.type === 'single') {
                            // Spróbuj z przeciwnym kierunkiem
                            const alternateDirection = currentCup.direction === 'up' ? 'down' : 'up';
                            const alternateCheck = isPhysicallyValid(freePosition.x, freePosition.y, alternateDirection);
                            
                            if (alternateCheck.isValid) {
                                // Użyj alternatywnego kierunku
                                currentCup.direction = alternateDirection;
                                positionClear = true;
                                
                                // Załaduj nowy obraz dla kubeczka
                                const imageObj = new Image();
                                imageObj.onload = function() {
                                    currentCup.cupImage.image(imageObj);
                                    cupsLayer.draw();
                                };
                                imageObj.src = `images/${currentCup.color}_${alternateDirection}.svg`;
                            }
                        }
                    } else {
                        positionClear = isPositionClear(freePosition.x, freePosition.y);
                    }
                }
            }
            
            // Add cup back to the array
            if (currentCup) {
                config.cups.push(currentCup);
            }
            
            // If there is still a collision or it's physically invalid, revert to previous position
            if (!positionClear) {
                finalX = originalPos.x;
                finalY = originalPos.y;
                
                // Pokaż komunikat o błędzie
                if (currentCup && !isPhysicallyValid(centerX, centerY, currentCup.direction).isValid) {
                    showTemporaryMessage(isPhysicallyValid(centerX, centerY, currentCup.direction).message, centerX, centerY - 30);
                } else {
                    showTemporaryMessage('Nie można umieścić kubeczka na innym kubeczku', centerX, centerY - 30);
                }
            }
            
            this.position({
                x: finalX,
                y: finalY
            });
            
            this.attrs.x = finalX;
            this.attrs.y = finalY;
            
            // Make sure any visual effects from dragmove are cleared
            this.filters([]);
            this.clearCache();
            
            cupsLayer.batchDraw();
        });
        
        // Dodaj kubeczek do warstwy i tablicy kubeczków
        cupsLayer.add(cupImage);
        config.cups.push({
            cupImage: cupImage,
            direction: direction,
            color: config.selectedCupColor
        });
        
        cupsLayer.draw();
    }
    
    /**
     * Obraca kubeczek, zmieniając jego kierunek (up/down)
     */
    function rotateCup(cup) {
        // Pobierz aktualną pozycję kubeczka
        const centerX = cup.cupImage.x() + config.cupWidth / 2;
        const centerY = cup.cupImage.y() + config.cupHeight / 2;
        
        // Nowy kierunek kubeczka
        const newDirection = cup.direction === 'up' ? 'down' : 'up';
        
        // Sprawdź, czy obrót jest zgodny z prawami fizyki
        const physicalCheck = isPhysicallyValid(centerX, centerY, newDirection);
        
        if (!physicalCheck.isValid) {
            console.log("Nie można obrócić kubeczka - niezgodne z prawami fizyki: " + physicalCheck.message);
            showTemporaryMessage(physicalCheck.message, centerX, centerY - 30);
            return;
        }
        
        // Zmień kierunek kubeczka
        cup.direction = newDirection;
        cup.cupImage.direction = newDirection;
        
        // Załaduj nowy obraz dla kubeczka
        const imageObj = new Image();
        imageObj.onload = function() {
            cup.cupImage.image(imageObj);
            cupsLayer.draw();
        };
        imageObj.src = `images/${cup.color}_${newDirection}.svg`;
    }
    
    /**
     * Aktualizuj kolor istniejącego kubeczka
     */
    function updateCupColor(cup, newColor) {
        // Załaduj nowy obraz dla kubeczka
        const imageObj = new Image();
        imageObj.onload = function() {
            cup.cupImage.image(imageObj);
            cup.color = newColor;
            cupsLayer.draw();
        };
        imageObj.src = `images/${newColor}_${cup.direction}.svg`;
    }
    
    /**
     * Sprawdź, czy kubeczek może być usunięty bez naruszenia stabilności konstrukcji
     */
    function canRemoveCup(cupToRemove) {
        // Znajdź wszystkie kubeczki, które mogą być wspierane przez ten kubeczek
        const cupX = cupToRemove.x() + config.cupWidth / 2;
        const cupY = cupToRemove.y() + config.cupHeight / 2;
        
        // Sprawdź kubeczki w trybie piramidy (powyżej w środku)
        const pyramidCupAbove = config.cups.find(cup => {
            if (cup.cupImage === cupToRemove) return false;
            
            const aboveCupX = cup.cupImage.x() + config.cupWidth / 2;
            const aboveCupY = cup.cupImage.y() + config.cupHeight / 2;
            
            return Math.abs(aboveCupY - (cupY - config.ROW_SPACING)) < 10 &&
                  Math.abs(aboveCupX - cupX) < 10;
        });
        
        if (pyramidCupAbove) {
            // Sprawdź, czy ten kubeczek ma inne wsparcie (dwa kubeczki poniżej)
            const otherSupports = findSupportingCups(
                pyramidCupAbove.cupImage.x() + config.cupWidth / 2, 
                pyramidCupAbove.cupImage.y() + config.cupHeight / 2
            ).filter(cup => cup.cupImage !== cupToRemove);
            
            if (otherSupports.length < 2) {
                return false; // Nie można usunąć, gdyż kubeczek wyżej nie będzie miał wystarczającego wsparcia
            }
        }
        
        // Sprawdź kubeczki w trybie stosu (bezpośrednio nad)
        const stackedCupAbove = config.cups.find(cup => {
            if (cup.cupImage === cupToRemove) return false;
            
            const aboveCupX = cup.cupImage.x() + config.cupWidth / 2;
            const aboveCupY = cup.cupImage.y() + config.cupHeight / 2;
            
            return Math.abs(aboveCupY - (cupY - config.STACK_SPACING)) < 10 &&
                  Math.abs(aboveCupX - cupX) < 5;
        });
        
        if (stackedCupAbove) {
            return false; // Nie można usunąć, gdyż kubeczek wyżej straci podstawę
        }
        
        return true; // Można bezpiecznie usunąć kubeczek
    }
    
    /**
     * Remove a cup from the grid
     */
    function removeCup(cupImage) {
        // Sprawdź, czy można bezpiecznie usunąć kubeczek
        if (!canRemoveCup(cupImage)) {
            alert('Nie można usunąć tego kubeczka, ponieważ podtrzymuje inne kubeczki!');
            return;
        }
        
        // Znajdź i usuń kubeczek z tablicy kubeczków
        const cupIndex = config.cups.findIndex(cup => cup.cupImage === cupImage);
        
        if (cupIndex !== -1) {
            config.cups.splice(cupIndex, 1);
        }
        
        // Usuń obraz kubeczka z warstwy
        cupImage.destroy();
        cupsLayer.draw();
    }
    
    /**
     * Clear all cups from the grid
     */
    function clearCups() {
        config.cups = [];
        cupsLayer.destroyChildren();
        cupsLayer.draw();
    }
    
    /**
     * Export the design to PDF
     */
    function exportToPDF() {
        if (config.cups.length === 0) {
            alert('Twoja konstrukcja jest pusta! Dodaj kubeczki przed eksportem.');
            return;
        }
        
        // Temporary hide grid for PDF export
        const showGridBackup = config.showGrid;
        config.showGrid = false;
        drawGrid();
        
        // Get a data URL of the stage with higher resolution for better quality
        const dataURL = stage.toDataURL({ 
            pixelRatio: 3, // Higher resolution for better print quality
            mimeType: 'image/png',
            quality: 1
        });
        
        // Restore grid visibility
        config.showGrid = showGridBackup;
        drawGrid();
        
        // Create a PDF using jsPDF
        const { jsPDF } = window.jspdf;
        
        // Create PDF in portrait orientation
        const doc = new jsPDF('portrait', 'mm', 'a4');
        
        // Get page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Load and add the logo in the top right corner
        const logoImg = new Image();
        logoImg.src = 'images/logo.png';
        
        logoImg.onload = function() {
            // Original logo dimensions
            const originalWidth = 200;
            const originalHeight = 110;
            
            // Calculate logo dimensions to maintain aspect ratio
            // Use a reasonable size for the logo - adjust as needed
            const logoWidth = 40; // mm
            const logoHeight = (originalHeight * logoWidth) / originalWidth;
            
            // Position in the top right corner with a margin
            const logoX = pageWidth - logoWidth - 15; // 15mm from right edge
            const logoY = 15; // 15mm from top
            
            // Add the logo to the PDF
            doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
            
            // Add design image - ensure it fits properly on the page
            const imgProps = doc.getImageProperties(dataURL);
            const margin = 15; // margin on all sides
            
            // Calculate maximum dimensions that would fit on the page
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - 40; // Allow space for logo
            
            // Calculate dimensions while preserving aspect ratio
            let width, height;
            
            if (imgProps.width / imgProps.height > maxWidth / maxHeight) {
                // Image is wider than it is tall relative to available space
                width = maxWidth;
                height = (imgProps.height * width) / imgProps.width;
            } else {
                // Image is taller than it is wide relative to available space
                height = maxHeight;
                width = (imgProps.width * height) / imgProps.height;
            }
            
            // Center the image horizontally
            const x = (pageWidth - width) / 2;
            
            // Add the image to the PDF (position it below the logo)
            doc.addImage(dataURL, 'PNG', x, 60, width, height);
            
            // Save the PDF
            doc.save('konstrukcja-kubeczkow.pdf');
        };
    }
    
    /**
     * Serializuje stan kubeczków do formatu URL-friendly
     * @returns {string} Zakodowany stan kubeczków
     */
    function serializeCupsToUrl() {
        // Przygotuj dane do serializacji w bardziej kompaktowej formie
        const compactData = {
            g: config.gridSize, // Skracamy nazwy kluczy dla mniejszego rozmiaru danych
            c: config.cups.map(cup => [
                Math.round(cup.cupImage.x()),
                Math.round(cup.cupImage.y()),
                cupColors.indexOf(cup.color), // Używamy indeksu koloru zamiast pełnej nazwy
                cup.direction === 'up' ? 1 : 0 // Używamy 1 dla 'up', 0 dla 'down'
            ])
        };
        
        // Konwertuj dane na JSON
        const jsonData = JSON.stringify(compactData);
        
        try {
            // Kompresja danych za pomocą LZString
            if (typeof LZString !== 'undefined') {
                return 'lz_' + LZString.compressToEncodedURIComponent(jsonData);
            } else {
                // Fallback do Base64 jeśli LZString nie jest dostępne
                return 'b64_' + encodeURIComponent(btoa(jsonData));
            }
        } catch (e) {
            console.error('Błąd podczas kompresji danych:', e);
            
            // Jako fallback, używamy standardowej metody Base64
            try {
                return 'b64_' + encodeURIComponent(btoa(jsonData));
            } catch (err) {
                throw new Error('Układ jest zbyt duży do udostępnienia przez URL. Spróbuj zmniejszyć liczbę kubeczków.');
            }
        }
    }
    
    /**
     * Deserializuje stan kubeczków z zakodowanego stringa
     * @param {string} encodedData - Zakodowany stan kubeczków
     * @returns {boolean} - Czy operacja zakończyła się sukcesem
     */
    function deserializeCupsFromUrl(encodedData) {
        try {
            let jsonData;
            
            // Sprawdź, jaki format danych mamy
            if (encodedData.startsWith('lz_')) {
                // Dane skompresowane za pomocą LZString
                const compressedData = encodedData.substring(3);
                if (typeof LZString !== 'undefined') {
                    jsonData = LZString.decompressFromEncodedURIComponent(compressedData);
                } else {
                    alert('Nie można odczytać udostępnionego układu. Brakuje biblioteki do dekompresji.');
                    return false;
                }
            } else if (encodedData.startsWith('b64_')) {
                // Dane zakodowane w Base64
                const base64Data = encodedData.substring(4);
                jsonData = atob(decodeURIComponent(base64Data));
            } else if (encodedData.startsWith('layout_')) {
                // Stary format z localStorage - podjęcie próby odczytu lokalnego
                jsonData = localStorage.getItem(`cups_layout_${encodedData}`);
                
                if (!jsonData) {
                    alert('Ten układ został udostępniony w starym formacie, który wymaga dostępu do danych zapisanych w przeglądarce osoby udostępniającej. Poproś o nowe udostępnienie układu.');
                    return false;
                }
            } else {
                // Stary format bezpośrednio w URL
                jsonData = atob(decodeURIComponent(encodedData));
            }
            
            // Parsuj dane JSON
            const data = JSON.parse(jsonData);
            
            // Obsługa zarówno starego jak i nowego formatu danych
            const gridSize = data.gridSize || data.g;
            const cupsData = data.cups || data.c;
            
            // Ustaw rozmiar siatki
            if (gridSize && gridSize !== config.gridSize) {
                gridSizeSelector.value = gridSize;
                updateGridSize();
            }
            
            // Wyczyść istniejące kubeczki
            clearCups();
            
            // Dodaj kubeczki na podstawie danych
            if (cupsData && Array.isArray(cupsData)) {
                cupsData.forEach(cupData => {
                    // Obsługa zarówno starego jak i nowego formatu danych kubeczka
                    let x, y, color, direction;
                    
                    if (Array.isArray(cupData)) {
                        // Nowy format [x, y, colorIndex, directionBool]
                        x = cupData[0];
                        y = cupData[1];
                        color = cupColors[cupData[2]] || cupColors[0];
                        direction = cupData[3] === 1 ? 'up' : 'down';
                    } else {
                        // Stary format {x, y, color, direction}
                        x = cupData.x;
                        y = cupData.y;
                        color = cupData.color;
                        direction = cupData.direction;
                    }
                    
                    // Ustaw aktualny kolor
                    config.selectedCupColor = color;
                    
                    // Dodaj kubeczek
                    addCup(x, y, direction);
                });
                
                // Przywróć domyślny kolor
                if (cupColors.length > 0) {
                    config.selectedCupColor = cupColors[0];
                    // Aktualizuj interfejs, zaznaczając pierwszy kolor
                    document.querySelectorAll('.cup-option').forEach((el, index) => {
                        el.classList.toggle('active', index === 0);
                    });
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Błąd podczas deserializacji danych:', error);
            alert('Nie udało się załadować układu. Format danych może być nieprawidłowy.');
            return false;
        }
    }
    
    /**
     * Generuje link do udostępnienia aktualnego układu kubeczków
     * @returns {string} - URL z zakodowanym stanem
     */
    function generateShareUrl() {
        const baseUrl = window.location.href.split('?')[0];
        
        try {
            const encodedData = serializeCupsToUrl();
            return `${baseUrl}?cups=${encodedData}`;
        } catch (error) {
            alert(error.message);
            return null;
        }
    }
    
    /**
     * Kopiuje link do schowka i pokazuje powiadomienie
     */
    function shareCurrentLayout() {
        if (config.cups.length === 0) {
            alert('Twoja konstrukcja jest pusta! Dodaj kubeczki przed udostępnieniem.');
            return;
        }
        
        const shareUrl = generateShareUrl();
        if (!shareUrl) return; // Błąd już obsłużony w generateShareUrl
        
        // Kopiuj do schowka
        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert('Link został skopiowany do schowka!\nMożesz go teraz udostępnić.');
            })
            .catch(err => {
                console.error('Nie udało się skopiować linku:', err);
                alert('Nie udało się skopiować linku do schowka. Link to: ' + shareUrl);
            });
    }
    
    /**
     * Sprawdza, czy URL zawiera zakodowany stan kubeczków i ładuje go
     */
    function loadFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('cups');
        
        if (encodedData) {
            const success = deserializeCupsFromUrl(encodedData);
            if (!success) {
                console.error('Nie udało się załadować układu z URL.');
            }
        }
    }
    
    /**
     * Bind event listeners to DOM elements
     */
    function bindEvents() {
        // Grid size change
        gridSizeSelector.addEventListener('change', updateGridSize);
        
        // Snap to grid toggle
        const snapToGridCheckbox = document.getElementById('snap-to-grid');
        if (snapToGridCheckbox) {
            snapToGridCheckbox.addEventListener('change', function() {
                config.snapToGridOnDragEnd = this.checked;
            });
        }
        
        // Grid visibility toggle
        const showGridCheckbox = document.getElementById('show-grid');
        if (showGridCheckbox) {
            showGridCheckbox.addEventListener('change', function() {
                config.showGrid = this.checked;
                drawGrid();
            });
        }
        
        // Clear button
        clearBtn.addEventListener('click', clearCups);
        
        // Export button
        exportBtn.addEventListener('click', exportToPDF);
        
        // Share button
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', shareCurrentLayout);
        }
        
        // Załaduj dane z URL przy inicjalizacji
        loadFromUrl();
        
        // Window resize
        window.addEventListener('resize', function() {
            // Użyj debouncing aby uniknąć zbyt częstych wywołań podczas zmiany rozmiaru
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
            
            this.resizeTimeout = setTimeout(() => {
                // Dostosuj rozmiar canvas do rozmiaru siatki i dostępnej przestrzeni
                const maxWidth = canvasContainer.clientWidth - 20;
                const desiredCellSize = config.isMobile ? 50 : 60; // Mniejszy rozmiar komórki dla urządzeń mobilnych
                const desiredCanvasSize = config.gridSize * desiredCellSize;
                
                // Oblicz najlepszy rozmiar canvas, nie przekraczając dostępnej szerokości
                let newCanvasSize = Math.min(desiredCanvasSize, maxWidth);
                
                // Oblicz rozmiar komórki na podstawie nowego rozmiaru canvas
                let cellSize = window.pyramidUtils.calculateCellSize(newCanvasSize, config.gridSize);
                
                // Dostosuj rozmiar komórki dla urządzeń mobilnych w orientacji pionowej
                if (config.isMobile && window.innerHeight > window.innerWidth) {
                    // W orientacji pionowej na urządzeniach mobilnych zmniejsz rozmiar komórki
                    cellSize = Math.max(cellSize * 0.9, 20);
                }
                
                // Oblicz odstęp siatki na podstawie szerokości kubeczka
                config.gridSpacing = cellSize / 2;
                
                // Upewnij się, że canvas ma rozmiar, który jest wielokrotnością odstępu siatki
                const gridCellCount = Math.floor(newCanvasSize / config.gridSpacing);
                newCanvasSize = gridCellCount * config.gridSpacing;
                
                // Zaktualizuj rozmiary
                config.stageWidth = newCanvasSize;
                config.stageHeight = newCanvasSize;
                
                // Zachowaj proporcje kubeczków przy zmianie rozmiaru
                const oldCupWidth = config.cupWidth;
                config.cupWidth = cellSize;
                config.cupHeight = cellSize;
                
                // Ustaw nową szerokość i wysokość wszystkich kubeczków
                if (oldCupWidth !== config.cupWidth) {
                    const scaleFactor = config.cupWidth / oldCupWidth;
                    
                    config.cups.forEach(cup => {
                        // Skaluj pozycję kubeczka
                        const centerX = cup.cupImage.x() + oldCupWidth / 2;
                        const centerY = cup.cupImage.y() + oldCupWidth / 2;
                        
                        const newX = centerX * scaleFactor - config.cupWidth / 2;
                        const newY = centerY * scaleFactor - config.cupHeight / 2;
                        
                        cup.cupImage.width(config.cupWidth);
                        cup.cupImage.height(config.cupHeight);
                        cup.cupImage.x(newX);
                        cup.cupImage.y(newY);
                    });
                }
                
                // Aktualizuj rozmiar stage
                stage.width(config.stageWidth);
                stage.height(config.stageHeight);
                
                // Odrysuj siatkę i kubeczki
                drawGrid();
                cupsLayer.draw();
            }, 250); // Odczekaj 250ms po ostatniej zmianie rozmiaru
        });
        
        // Specjalne zdarzenie dla orientacji urządzeń mobilnych
        if (config.isMobile) {
            window.addEventListener('orientationchange', function() {
                // Wywołaj resize po krótkiej chwili, aby przeglądarka miała czas na dostosowanie wymiarów
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 300);
            });
        }
    }
    
    /**
     * Display a temporary message on the canvas
     * @param {string} message - The message to display
     * @param {number} x - X position for the message
     * @param {number} y - Y position for the message
     * @returns {boolean} - Whether the message was displayed (false if throttled)
     */
    function showTemporaryMessage(message, x, y) {
        // Check if we should throttle the message
        const now = Date.now();
        if (now - lastMessageTimestamp < MESSAGE_THROTTLE_MS) {
            return false; // Skip this message due to throttling
        }
        
        // Update the timestamp
        lastMessageTimestamp = now;
        
        // Adjust position for mobile - make sure message is visible
        if (config.isMobile) {
            // Ensure message stays within the visible canvas
            const textWidth = message.length * 7; // Przybliżona szerokość tekstu
            
            if (x < textWidth/2) {
                x = textWidth/2 + 5;
            } else if (x > config.stageWidth - textWidth/2) {
                x = config.stageWidth - textWidth/2 - 5;
            }
            
            // Make sure message is not too close to the top
            if (y < 40) {
                y = 40;
            }
        }
        
        // Create text node with better visibility for mobile
        const text = new Konva.Text({
            x: x,
            y: y,
            text: message,
            fontSize: config.isMobile ? 16 : 14,
            fontFamily: 'Arial',
            fill: '#d22',
            padding: config.isMobile ? 12 : 10,
            opacity: 1,
            align: 'center',
            verticalAlign: 'middle'
        });
        
        // Center the text at the provided position
        text.offsetX(text.width() / 2);
        
        // Add background for better readability
        const textBg = new Konva.Rect({
            x: text.x() - text.width() / 2,
            y: text.y(),
            width: text.width(),
            height: text.height(),
            fill: 'rgba(255, 255, 255, 0.9)',
            cornerRadius: 5,
            stroke: '#d22',
            strokeWidth: 1,
            opacity: 1
        });
        
        // Add to grid layer so it's on top
        gridLayer.add(textBg);
        gridLayer.add(text);
        gridLayer.batchDraw();
        
        // Fade out and remove
        const tween = new Konva.Tween({
            node: text,
            duration: config.isMobile ? 1.5 : 0.75,
            opacity: 0,
            onFinish: () => {
                text.destroy();
                textBg.destroy();
                gridLayer.batchDraw();
            }
        });
        
        const tweenBg = new Konva.Tween({
            node: textBg,
            duration: config.isMobile ? 1.5 : 0.75,
            opacity: 0,
        });
        
        // Start the animation
        tween.play();
        tweenBg.play();
        
        // Vibrate for mobile as additional feedback
        if (config.isMobile && navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        return true; // Message was displayed
    }
}); 