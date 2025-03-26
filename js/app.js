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
        cups: []
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
        
        // Use utility function to calculate cell size
        const cellSize = window.pyramidUtils.calculateCellSize(config.stageWidth, config.gridSize);
        config.cupWidth = cellSize;
        config.cupHeight = cellSize;
        
        // Redraw grid
        drawGrid();
        
        // Clear cups
        clearCups();
    }
    
    /**
     * Draw the grid with half-cell offsets for alternating rows
     */
    function drawGrid() {
        gridLayer.destroyChildren();
        
        const cellSize = config.cupWidth;
        
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
        
        // Create grid cells (invisible)
        for (let row = 0; row < config.gridSize; row++) {
            // Calculate y position from bottom to top
            // For row 0, y = height - cellSize
            // For row 1, y = height - 2*cellSize, etc.
            const actualRow = config.gridSize - 1 - row;
            const y = actualRow * cellSize;
            
            // For alternating rows, offset by half cell (based on actual row which is inverted)
            const offsetX = actualRow % 2 === 1 ? cellSize / 2 : 0;
            
            for (let col = 0; col < config.gridSize; col++) {
                const x = col * cellSize + offsetX;
                
                // Only create cells that fit within the stage
                if (x + cellSize <= config.stageWidth) {
                    const cell = new Konva.Rect({
                        x: x,
                        y: y,
                        width: cellSize,
                        height: cellSize,
                        stroke: '#e0e0e0',
                        strokeWidth: 0.5,
                        fill: 'transparent'
                    });
                    
                    cell.on('click', function() {
                        if (config.selectedCupColor) {
                            // Pass the inverted row number to maintain the original logic
                            // The row in data should still be 0 for the bottom row
                            addCup(config.gridSize - 1 - actualRow, col, offsetX, y);
                        }
                    });
                    
                    gridLayer.add(cell);
                }
            }
        }
        
        gridLayer.draw();
    }
    
    /**
     * Add a cup to the grid
     */
    function addCup(row, col, x, y) {
        // Check if placement is valid (based on physics rules)
        if (!isValidPlacement(row, col)) {
            alert('Nieprawidłowe umieszczenie kubeczka! Kubeczek musi być podparty przez dwa kubeczki niższej warstwy.');
            return;
        }
        
        const cellSize = config.cupWidth;
        // Calculate the actual row (inverted for display)
        const actualRow = config.gridSize - 1 - row;
        // Determine cup direction based on the actual row (visual position)
        const cupDirection = actualRow % 2 === 0 ? 'down' : 'up';
        
        // Check if a cup already exists at this position
        const existingCupIndex = config.cups.findIndex(cup => cup.row === row && cup.col === col);
        
        if (existingCupIndex !== -1) {
            // Remove the existing cup
            config.cups[existingCupIndex].cupImage.destroy();
            config.cups.splice(existingCupIndex, 1);
        }
        
        // Create a cup image
        const cupImage = new Konva.Image({
            x: col * cellSize + (actualRow % 2 === 1 ? cellSize / 2 : 0),
            y: actualRow * cellSize,
            width: cellSize,
            height: cellSize,
        });
        
        // Load the image
        const imageObj = new Image();
        imageObj.onload = function() {
            cupImage.image(imageObj);
            cupsLayer.draw();
        };
        imageObj.src = `images/${config.selectedCupColor}_${cupDirection}.svg`;
        
        // Add custom properties to the cup image
        cupImage.row = row;
        cupImage.col = col;
        cupImage.color = config.selectedCupColor;
        cupImage.direction = cupDirection;
        
        // Add event for removing cups with right-click
        cupImage.on('contextmenu', function(e) {
            e.evt.preventDefault();
            removeCup(this);
        });
        
        // Add cup to layer and cups array
        cupsLayer.add(cupImage);
        config.cups.push({
            row: row,
            col: col,
            color: config.selectedCupColor,
            direction: cupDirection,
            cupImage: cupImage
        });
        
        cupsLayer.draw();
    }
    
    /**
     * Check if a cup placement follows physical rules
     */
    function isValidPlacement(row, col) {
        // If it's the first row (bottom row), always valid
        if (row === 0) {
            return true;
        }
        
        const isEvenRow = row % 2 === 0;
        const prevRowIsEven = (row - 1) % 2 === 0;
        
        // Check if there are cups below to support this cup
        // A cup needs two cups below it to be valid
        let supportFound = 0;
        
        config.cups.forEach(cup => {
            if (cup.row === row - 1) {
                if (prevRowIsEven) {
                    // If previous row is even, this cup needs to be supported by cups at (col-1) and col
                    if ((cup.col === col - 1 || cup.col === col)) {
                        supportFound++;
                    }
                } else {
                    // If previous row is odd, this cup needs to be supported by cups at col and (col+1)
                    if ((cup.col === col || cup.col === col + 1)) {
                        supportFound++;
                    }
                }
            }
        });
        
        return supportFound >= 2;
    }
    
    /**
     * Remove a cup from the grid
     */
    function removeCup(cupImage) {
        // Check if removing this cup would make other cups fall
        const cupsAbove = config.cups.filter(cup => {
            return cup.row === cupImage.row + 1 && 
                   ((cupImage.row % 2 === 0 && (cup.col === cupImage.col || cup.col === cupImage.col - 1)) || 
                    (cupImage.row % 2 === 1 && (cup.col === cupImage.col || cup.col === cupImage.col + 1)));
        });
        
        if (cupsAbove.length > 0) {
            alert('Nie można usunąć tego kubeczka, ponieważ podtrzymuje inne kubeczki!');
            return;
        }
        
        // Find and remove the cup from the cups array
        const cupIndex = config.cups.findIndex(cup => cup.cupImage === cupImage);
        
        if (cupIndex !== -1) {
            config.cups.splice(cupIndex, 1);
        }
        
        // Remove the cup image from the layer
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
     * Export the pyramid design to PDF
     */
    function exportToPDF() {
        if (config.cups.length === 0) {
            alert('Twoja piramida jest pusta! Dodaj kubeczki przed eksportem.');
            return;
        }
        
        // Get a data URL of the stage
        const dataURL = stage.toDataURL({ pixelRatio: 2 });
        
        // Create a PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        // Add title
        doc.setFontSize(20);
        doc.text('Piramida z Kubeczków', 15, 15);
        
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
        doc.text('3. Kubeczki w sąsiednich rzędach muszą być ustawiane na przemian.', 15, instructionY);
        instructionY += 5;
        doc.text('4. Każdy kubeczek z wyższej warstwy musi być odwrócony w stosunku do kubeczka poniżej.', 15, instructionY);
        
        // Save the PDF
        doc.save('piramida-kubeczkow.pdf');
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
            // Adjust stage size if needed
            const maxWidth = document.getElementById('canvas-container').clientWidth - 20;
            if (maxWidth < config.stageWidth) {
                stage.width(maxWidth);
                stage.height(maxWidth);
            } else if (maxWidth >= 600 && stage.width() < 600) {
                stage.width(600);
                stage.height(600);
            }
            
            // Use utility function to recalculate cell size
            const cellSize = window.pyramidUtils.calculateCellSize(stage.width(), config.gridSize);
            config.cupWidth = cellSize;
            config.cupHeight = cellSize;
            
            drawGrid();
        });
    }
}); 