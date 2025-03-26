// Constants
const DEFAULT_GRID_SIZE = 10;
const CELL_SIZE = 40; // Size of each grid cell in pixels
const HALF_CELL_OFFSET = CELL_SIZE / 2; // Offset for staggered grid

// Cup states
const CUP_ORIENTATIONS = {
    UP: 'up',
    DOWN: 'down'
};

// Highlight colors
const HIGHLIGHT_COLORS = {
    VALID: 'rgba(46, 204, 113, 0.4)',    // Green with transparency
    INVALID: 'rgba(231, 76, 60, 0.4)'    // Red with transparency
};

// Main app class
class CupArrangementApp {
    constructor() {
        this.canvas = document.getElementById('cup-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = DEFAULT_GRID_SIZE;
        this.cups = []; // Array to store placed cups
        this.selectedCup = null;
        this.currentOrientation = CUP_ORIENTATIONS.UP;
        this.hoverPosition = null; // Store current hover position
        
        // Create placeholder cup images
        this.cupImages = {
            [CUP_ORIENTATIONS.UP]: this.createPlaceholderCupImage(CUP_ORIENTATIONS.UP),
            [CUP_ORIENTATIONS.DOWN]: this.createPlaceholderCupImage(CUP_ORIENTATIONS.DOWN)
        };
        
        this.initializeCanvas();
        this.setupEventListeners();
        this.render();
    }
    
    // Create placeholder cup images until real ones are provided
    createPlaceholderCupImage(orientation) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = CELL_SIZE * 0.9; // Slightly smaller than cell
        
        canvas.width = size;
        canvas.height = size;
        
        ctx.fillStyle = '#e74c3c';
        
        if (orientation === CUP_ORIENTATIONS.UP) {
            // Cup facing up - trapezoid wider at top
            ctx.beginPath();
            ctx.moveTo(size * 0.2, size);
            ctx.lineTo(size * 0.8, size);
            ctx.lineTo(size * 0.95, 0);
            ctx.lineTo(size * 0.05, 0);
            ctx.closePath();
        } else {
            // Cup facing down - trapezoid wider at bottom
            ctx.beginPath();
            ctx.moveTo(size * 0.05, size);
            ctx.lineTo(size * 0.95, size);
            ctx.lineTo(size * 0.8, 0);
            ctx.lineTo(size * 0.2, 0);
            ctx.closePath();
        }
        
        ctx.fill();
        
        return canvas;
    }
    
    initializeCanvas() {
        // Calculate canvas dimensions based on grid size
        const canvasSize = this.gridSize * CELL_SIZE;
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
    }
    
    setupEventListeners() {
        // Grid size change
        const gridSizeSelect = document.getElementById('grid-size');
        gridSizeSelect.addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            this.initializeCanvas();
            this.clearBoard(); // Clear the board when changing grid size
            this.render();
        });
        
        // Cup placement
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Cup selection
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleCupSelection(e);
        });
        
        // Mouse movement for position highlighting
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Mouse leave to clear highlights
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverPosition = null;
            this.render();
        });
        
        // Toggle cup orientation
        document.getElementById('toggle-orientation').addEventListener('click', () => {
            this.toggleCupOrientation();
        });
        
        // Delete selected cup
        document.getElementById('delete-cup').addEventListener('click', () => {
            this.deleteSelectedCup();
        });
        
        // Clear board
        document.getElementById('clear-board').addEventListener('click', () => {
            this.clearBoard();
        });
        
        // Export to PDF (placeholder)
        document.getElementById('export-pdf').addEventListener('click', () => {
            alert('Funkcja eksportu do PDF będzie dostępna wkrótce.');
        });
    }
    
    // Handle mouse movement for position highlighting
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Get grid coordinates from mouse position
        const gridCoords = this.getGridCoordinates(x, y);
        
        // Check if already a cup at this position
        const existingCup = this.getCupAt(gridCoords.x, gridCoords.y);
        
        // Only highlight if there's no cup at this position
        if (!existingCup) {
            this.hoverPosition = {
                ...gridCoords,
                isValid: this.isValidPlacement(gridCoords)
            };
        } else {
            this.hoverPosition = null;
        }
        
        this.render();
    }
    
    // Handle canvas click for cup placement
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert click coordinates to grid coordinates
        const gridCoords = this.getGridCoordinates(x, y);
        
        // Check if placement is valid based on physics constraints
        if (this.isValidPlacement(gridCoords)) {
            this.placeCup(gridCoords);
            this.render();
        } else {
            alert('Nieprawidłowe umieszczenie kubka. Sprawdź zasady fizyki.');
        }
    }
    
    // Get grid coordinates including half positions
    getGridCoordinates(x, y) {
        // Calculate grid coordinates from the center of the click
        const gridX = Math.floor(x / CELL_SIZE);
        let gridY = Math.floor(y / CELL_SIZE);
        
        // Check if we're in the top or bottom half of the cell
        const cellY = y % CELL_SIZE;
        const isHalfPosition = cellY < CELL_SIZE / 2;
        
        // If in top half, we're in a half position
        const offset = isHalfPosition ? 0.5 : 0;
        
        return { x: gridX, y: gridY - offset };
    }
    
    // Check if placement follows physics constraints
    isValidPlacement({ x, y }) {
        // Check if there's already a cup at this position
        const existingCup = this.getCupAt(x, y);
        if (existingCup) return false;
        
        // If this is the first layer (y = this.gridSize - 1 or this.gridSize - 0.5), always allow
        if (y >= this.gridSize - 1) return true;
        
        // Check if there are supporting cups below
        const isHalfPosition = y % 1 !== 0;
        
        if (isHalfPosition) {
            // For half positions, need cups on both sides below
            const supportLeft = this.getCupAt(x - 0.5, y + 0.5);
            const supportRight = this.getCupAt(x + 0.5, y + 0.5);
            
            // Both supports must exist
            if (!supportLeft || !supportRight) return false;
            
            // Allow pyramid structures - no additional checks needed for half positions
            // as long as there are cups on both sides below
            return true;
        } else {
            // For whole positions, need cup directly below
            const supportBelow = this.getCupAt(x, y + 1);
            
            // If no support below, invalid placement
            if (!supportBelow) return false;
            
            // Check if the orientation of the cup we're placing is opposite to the support below
            if (supportBelow.orientation === this.currentOrientation) {
                return false; // Require opposite orientation
            }
            
            // Allow pyramid structures - if there's a cup directly below, that's sufficient
            // No need to check for additional supports in the lower layer
            return true;
        }
    }
    
    // Get cup at specific grid coordinates
    getCupAt(x, y) {
        return this.cups.find(cup => cup.x === x && cup.y === y);
    }
    
    // Place a cup at the specified grid coordinates
    placeCup({ x, y }) {
        // Check if there's already a cup at this position
        const existingCup = this.getCupAt(x, y);
        if (existingCup) {
            // If a cup exists, update its orientation
            existingCup.orientation = this.currentOrientation;
        } else {
            // Otherwise add a new cup
            this.cups.push({
                x,
                y,
                orientation: this.currentOrientation
            });
        }
    }
    
    // Handle right-click to select a cup
    handleCupSelection(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert click coordinates to grid coordinates
        const gridCoords = this.getGridCoordinates(x, y);
        
        // Find if there's a cup at this position
        const cup = this.getCupAt(gridCoords.x, gridCoords.y);
        
        if (cup) {
            // If clicking the already selected cup, deselect it
            if (this.selectedCup === cup) {
                this.selectedCup = null;
            } else {
                // Otherwise select the new cup
                this.selectedCup = cup;
            }
        } else {
            this.selectedCup = null;
        }
        
        this.render();
    }
    
    // Toggle the current cup orientation
    toggleCupOrientation() {
        this.currentOrientation = 
            this.currentOrientation === CUP_ORIENTATIONS.UP 
                ? CUP_ORIENTATIONS.DOWN 
                : CUP_ORIENTATIONS.UP;
                
        // If a cup is selected, toggle its orientation too
        if (this.selectedCup) {
            this.selectedCup.orientation = this.currentOrientation;
            this.render();
        }
    }
    
    // Delete the currently selected cup
    deleteSelectedCup() {
        if (this.selectedCup) {
            const index = this.cups.indexOf(this.selectedCup);
            if (index !== -1) {
                this.cups.splice(index, 1);
                this.selectedCup = null;
                this.render();
            }
        }
    }
    
    // Render the current state to the canvas
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (invisible but useful for debugging)
        this.drawGrid();
        
        // Draw position highlight if hovering
        if (this.hoverPosition) {
            this.highlightHoverPosition();
        }
        
        // Draw all cups
        this.cups.forEach(cup => {
            this.drawCup(cup);
        });
        
        // Highlight selected cup
        if (this.selectedCup) {
            this.highlightSelectedCup();
        }
    }
    
    // Draw the grid (invisible but can be shown for debugging)
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
        this.ctx.lineWidth =.5;
        
        // Draw vertical lines
        for (let x = 0; x <= this.gridSize; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CELL_SIZE, 0);
            this.ctx.lineTo(x * CELL_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.gridSize; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CELL_SIZE);
            this.ctx.lineTo(this.canvas.width, y * CELL_SIZE);
            this.ctx.stroke();
        }
        
        // Draw half-position lines (for debugging)
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.1)';
        for (let y = 0; y <= this.gridSize; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CELL_SIZE - HALF_CELL_OFFSET);
            this.ctx.lineTo(this.canvas.width, y * CELL_SIZE - HALF_CELL_OFFSET);
            this.ctx.stroke();
        }
    }
    
    // Highlight the position being hovered over
    highlightHoverPosition() {
        const pixelX = this.hoverPosition.x * CELL_SIZE;
        const pixelY = this.hoverPosition.y * CELL_SIZE;
        
        // Set color based on validity
        this.ctx.fillStyle = this.hoverPosition.isValid 
            ? HIGHLIGHT_COLORS.VALID 
            : HIGHLIGHT_COLORS.INVALID;
        
        // Draw highlight circle
        this.ctx.beginPath();
        this.ctx.arc(
            pixelX + CELL_SIZE / 2,
            pixelY + CELL_SIZE / 2,
            CELL_SIZE / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    // Draw a cup at its grid position
    drawCup(cup) {
        const pixelX = cup.x * CELL_SIZE;
        const pixelY = cup.y * CELL_SIZE;
        
        // Draw the cup image
        const image = this.cupImages[cup.orientation];
        this.ctx.drawImage(
            image,
            pixelX - image.width / 2 + CELL_SIZE / 2,
            pixelY - image.height / 2 + CELL_SIZE / 2
        );
    }
    
    // Highlight the selected cup
    highlightSelectedCup() {
        const pixelX = this.selectedCup.x * CELL_SIZE;
        const pixelY = this.selectedCup.y * CELL_SIZE;
        
        this.ctx.strokeStyle = '#2ecc71';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
            pixelX + CELL_SIZE / 2,
            pixelY + CELL_SIZE / 2,
            CELL_SIZE / 2 + 5,
            0,
            Math.PI * 2
        );
        this.ctx.stroke();
    }
    
    // Clear the entire board
    clearBoard() {
        this.cups = []; // Empty the cups array
        this.selectedCup = null; // Clear selected cup
        this.render(); // Re-render the board
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CupArrangementApp();
}); 