document.addEventListener('DOMContentLoaded', function() {
    // Cup colors based on filenames in images folder
    const cupColors = [
        'czerwony', 'zolty', 'turkusowy', 'pomaranczowy', 'zielony',
        'rozowy', 'szary', 'fioletowy', 'niebieski', 'czarny', 'bialy'
    ];
    
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
        showGrid: true, // Pokazuje siatkę dla lepszej orientacji
        gridSpacing: 30  // Odległość między punktami siatki
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
    
    // Initialize Konva stage
    const stage = new Konva.Stage({
        container: 'canvas',
        width: config.stageWidth,
        height: config.stageHeight
    });
    
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
            
            // Draw grid intersection points
            for (let i = 0; i <= numLinesH; i++) {
                for (let j = 0; j <= numLinesV; j++) {
                    const circle = new Konva.Circle({
                        x: j * gridSpacing,
                        y: i * gridSpacing,
                        radius: 1,
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
            
            // Dodajemy kubeczek na podstawie kliknięcia
            placeCupBasedOnClickPosition(pos.x, pos.y);
        });
        
        gridLayer.draw();
    }
    
    /**
     * Sprawdza, czy nowy kubeczek nie nachodziłby na istniejące kubeczki
     * @param {number} x - Pozycja X środka kubeczka
     * @param {number} y - Pozycja Y środka kubeczka
     * @returns {boolean} - true jeśli pozycja jest wolna, false jeśli kubeczki by się nakładały
     */
    function isPositionClear(x, y) {
        // Minimalna dopuszczalna odległość między środkami kubeczków
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
     * Przyciąga pozycję do najbliższego punktu siatki
     * z uwzględnieniem granic canvas
     */
    function snapToGrid(x, y) {
        const gridSpacing = config.gridSpacing;
        const halfWidth = config.cupWidth / 2;
        const halfHeight = config.cupHeight / 2;
        
        // Znajdź najbliższy punkt siatki
        let snappedX = Math.round(x / gridSpacing) * gridSpacing;
        let snappedY = Math.round(y / gridSpacing) * gridSpacing;
        
        // Upewnij się, że po przyciągnięciu do siatki kubeczek nie wyjdzie poza granice canvas
        if (snappedX - halfWidth < 0) {
            snappedX = halfWidth;
        } else if (snappedX + halfWidth > config.stageWidth) {
            snappedX = config.stageWidth - halfWidth;
        }
        
        if (snappedY - halfHeight < 0) {
            snappedY = halfHeight;
        } else if (snappedY + halfHeight > config.stageHeight) {
            snappedY = config.stageHeight - halfHeight;
        }
        
        // Przyciągnij ponownie do najbliższego punktu siatki z uwzględnieniem ograniczeń
        snappedX = Math.round(snappedX / gridSpacing) * gridSpacing;
        snappedY = Math.round(snappedY / gridSpacing) * gridSpacing;
        
        return { x: snappedX, y: snappedY };
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
            
            console.log("Nie można umieścić kubeczka - wyszedłby poza granice płótna");
            
            // Opcjonalnie - dodaj wizualną informację dla użytkownika
            const alertText = new Konva.Text({
                x: Math.min(Math.max(finalX, 50), config.stageWidth - 100),
                y: Math.min(Math.max(finalY, 50), config.stageHeight - 30),
                text: 'Kubeczek wychodzi poza płótno!',
                fontSize: 16,
                fontFamily: 'Arial',
                fill: 'red',
            });
            
            gridLayer.add(alertText);
            gridLayer.draw();
            
            // Usuń komunikat po 2 sekundach
            setTimeout(() => {
                alertText.destroy();
                gridLayer.draw();
            }, 2000);
            
            return;
        }
        
        // Ostateczne sprawdzenie, czy pozycja jest wolna
        if (!isPositionClear(finalX, finalY)) {
            console.log("Nie można umieścić kubeczka - pozycja zajęta");
            return;
        }
        
        // Sprawdź, czy nie ma już kubeczka dokładnie w tej pozycji
        const existingCup = config.cups.find(cup => {
            const cupX = cup.cupImage.x() + config.cupWidth / 2;
            const cupY = cup.cupImage.y() + config.cupHeight / 2;
            
            return Math.abs(cupX - finalX) < 5 && Math.abs(cupY - finalY) < 5;
        });
        
        if (existingCup) {
            // Zmień kolor istniejącego kubeczka
            updateCupColor(existingCup, config.selectedCupColor);
        } else {
            // Dodaj kubeczek w określonej pozycji, z przesunięciem, by centrum kubeczka było w punkcie siatki
            addCup(finalX - config.cupWidth / 2, finalY - config.cupHeight / 2, cupDirection);
            
            // Opcjonalnie: Wyświetl informację o typie umieszczenia (pomocne w debugowaniu)
            // console.log(`Umieszczono kubeczek w trybie: ${placementType}`);
        }
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
        const halfWidth = config.cupWidth / 2;
        const halfHeight = config.cupHeight / 2;
        
        return x - halfWidth >= 0 && 
               x + halfWidth <= config.stageWidth && 
               y - halfHeight >= 0 && 
               y + halfHeight <= config.stageHeight;
    }
    
    /**
     * Add a cup to the grid
     */
    function addCup(x, y, direction) {
        // Sprawdź, czy kubeczek nie wychodzi poza granice canvas
        if (x < 0 || x + config.cupWidth > config.stageWidth || 
            y < 0 || y + config.cupHeight > config.stageHeight) {
            console.log("Nie można umieścić kubeczka - wyszedłby poza granice płótna");
            return;
        }
        
        // Stwórz obraz kubeczka
        const cupImage = new Konva.Image({
            x: x,
            y: y,
            width: config.cupWidth,
            height: config.cupHeight,
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
        
        // Dodaj event dla usuwania kubeczków prawym przyciskiem myszy
        cupImage.on('contextmenu', function(e) {
            e.evt.preventDefault();
            removeCup(this);
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
        
        // Get a data URL of the stage
        const dataURL = stage.toDataURL({ pixelRatio: 2 });
        
        // Restore grid visibility
        config.showGrid = showGridBackup;
        drawGrid();
        
        // Create a PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        // Add title
        doc.setFontSize(20);
        doc.text('Konstrukcja z Kubeczków', 15, 15);
        
        // Add date
        const today = new Date();
        doc.setFontSize(10);
        doc.text(`Utworzono: ${today.toLocaleDateString()}`, 15, 22);
        
        // Add design image
        const imgProps = doc.getImageProperties(dataURL);
        const width = doc.internal.pageSize.getWidth() - 30;
        const height = (imgProps.height * width) / imgProps.width;
        
        doc.addImage(dataURL, 'PNG', 15, 30, width, height);
        
        // Add instructions
        doc.setFontSize(12);
        doc.text('Instrukcja budowy:', 15, height + 40);
        
        doc.setFontSize(10);
        let instructionY = height + 48;
        
        doc.text('1. Zacznij od najniższej warstwy i buduj do góry.', 15, instructionY);
        instructionY += 5;
        doc.text('2. Kubeczki ustawiaj zgodnie z układem na obrazku.', 15, instructionY);
        instructionY += 5;
        doc.text('3. Możesz budować piramidy (kubeczek na dwóch niższych) lub stosy (kubeczek na kubeczku).', 15, instructionY);
        instructionY += 5;
        doc.text('4. Zwróć uwagę na kierunek kubeczków zgodnie z obrazkiem.', 15, instructionY);
        
        // Save the PDF
        doc.save('konstrukcja-kubeczkow.pdf');
    }
    
    /**
     * Bind event listeners to DOM elements
     */
    function bindEvents() {
        // Grid size change
        gridSizeSelector.addEventListener('change', updateGridSize);
        
        // Clear button
        clearBtn.addEventListener('click', clearCups);
        
        // Export button
        exportBtn.addEventListener('click', exportToPDF);
        
        // Window resize
        window.addEventListener('resize', function() {
            // Dostosuj rozmiar canvas do rozmiaru siatki i dostępnej przestrzeni
            const maxWidth = canvasContainer.clientWidth - 20;
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
            
            drawGrid();
        });
    }
}); 