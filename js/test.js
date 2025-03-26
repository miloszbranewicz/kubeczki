/**
 * Test script for the Cup Construction Generator
 * 
 * This script contains functions to test building pyramids and rectangles.
 * You can run these tests in the browser console.
 */

// Funkcja do testowania budowy piramidy
function testPyramid() {
    console.log('Starting pyramid test...');
    
    // Check if application is loaded
    if (!window.Konva || !document.getElementById('canvas')) {
        console.error('Application not loaded. Please run this test after the application is fully loaded.');
        return;
    }
    
    // Ustaw rozmiar siatki na 10x10 (optymalny dla piramidy)
    const gridSizeSelector = document.getElementById('grid-size');
    if (gridSizeSelector) {
        gridSizeSelector.value = '10';
        // Trigger the change event
        const event = new Event('change');
        gridSizeSelector.dispatchEvent(event);
        console.log('Set grid size to 10x10');
    } else {
        console.error('Grid size selector not found');
        return;
    }
    
    // Select the first cup
    const firstCupOption = document.querySelector('.cup-option');
    if (firstCupOption) {
        firstCupOption.click();
        console.log('Selected first cup color');
    } else {
        console.error('No cup options found');
        return;
    }
    
    // Get stage and layers
    const stage = Konva.stages[0];
    if (!stage) {
        console.error('Konva stage not found');
        return;
    }
    
    const gridLayer = stage.findOne('Layer');
    if (!gridLayer) {
        console.error('Grid layer not found');
        return;
    }
    
    // Get gridSize from app
    const gridSize = parseInt(document.getElementById('grid-size').value);
    
    // Oblicz środek siatki (od którego zaczniemy budowę)
    // Dla podwojonej siatki kolumn, środek będzie w innym miejscu
    // Ponieważ kubeczki mają szerokość 2, musimy dostosować pozycje kolumn
    const centerCol = Math.floor(gridSize);
    
    // Build a simple pyramid
    // First row (bottom row): 4 cups (teraz 4 kubeczki, każdy o szerokości 2)
    console.log('Building first row of pyramid (base)...');
    for (let i = 0; i < 4; i++) {
        const col = centerCol - 8 + (i * 2); // Każdy kubeczek ma szerokość 2, więc zwiększamy o 2
        const cell = findCellAtPosition(gridLayer, gridSize - 1, col);
        if (cell) {
            cell.fire('click');
        }
    }
    
    // Second row: 3 cups (one row up from bottom)
    console.log('Building second row of pyramid...');
    for (let i = 0; i < 3; i++) {
        const col = centerCol - 6 + (i * 2); // Każdy kubeczek ma szerokość 2, więc zwiększamy o 2
        const cell = findCellAtPosition(gridLayer, gridSize - 2, col);
        if (cell) {
            cell.fire('click');
        }
    }
    
    // Third row: 2 cups (two rows up from bottom)
    console.log('Building third row of pyramid...');
    for (let i = 0; i < 2; i++) {
        const col = centerCol - 4 + (i * 2); // Każdy kubeczek ma szerokość 2, więc zwiększamy o 2
        const cell = findCellAtPosition(gridLayer, gridSize - 3, col);
        if (cell) {
            cell.fire('click');
        }
    }
    
    // Fourth row: 1 cup (three rows up from bottom)
    console.log('Building fourth row of pyramid (top)...');
    const col = centerCol - 2; // Centralny kubeczek
    const cell = findCellAtPosition(gridLayer, gridSize - 4, col);
    if (cell) {
        cell.fire('click');
    }
    
    console.log('Pyramid test completed. You should see a 4-3-2-1 pyramid starting from the bottom of the canvas.');
}

// Funkcja do testowania budowy prostokąta
function testRectangle() {
    console.log('Starting rectangle test...');
    
    // Check if application is loaded
    if (!window.Konva || !document.getElementById('canvas')) {
        console.error('Application not loaded. Please run this test after the application is fully loaded.');
        return;
    }
    
    // Ustaw rozmiar siatki na 10x10 (optymalny dla prostokąta 3x3)
    const gridSizeSelector = document.getElementById('grid-size');
    if (gridSizeSelector) {
        gridSizeSelector.value = '10';
        // Trigger the change event
        const event = new Event('change');
        gridSizeSelector.dispatchEvent(event);
        console.log('Set grid size to 10x10');
    } else {
        console.error('Grid size selector not found');
        return;
    }
    
    // Select a cup (second cup for different color)
    const cupOptions = document.querySelectorAll('.cup-option');
    if (cupOptions && cupOptions.length > 1) {
        cupOptions[1].click();
        console.log('Selected cup color');
    } else {
        console.error('Not enough cup options found');
        return;
    }
    
    // Get stage and layers
    const stage = Konva.stages[0];
    if (!stage) {
        console.error('Konva stage not found');
        return;
    }
    
    const gridLayer = stage.findOne('Layer');
    if (!gridLayer) {
        console.error('Grid layer not found');
        return;
    }
    
    // Get gridSize from app
    const gridSize = parseInt(document.getElementById('grid-size').value);
    
    // Oblicz środek siatki (od którego zaczniemy budowę)
    const centerCol = Math.floor(gridSize);
    
    // Build a 3x3 rectangle (3 rzędy, 3 kubeczki w rzędzie, każdy o szerokości 2)
    console.log('Building bottom row of rectangle...');
    // Bottom row of the rectangle (3 cups)
    for (let i = 0; i < 3; i++) {
        const col = centerCol - 6 + (i * 2); // Każdy kubeczek ma szerokość 2, więc zwiększamy o 2
        const cell = findCellAtPosition(gridLayer, gridSize - 1, col);
        if (cell) {
            cell.fire('click');
        }
    }
    
    // Middle row of the rectangle (3 cups)
    console.log('Building middle row of rectangle...');
    for (let i = 0; i < 3; i++) {
        const col = centerCol - 6 + (i * 2); // Każdy kubeczek ma szerokość 2, więc zwiększamy o 2
        const cell = findCellAtPosition(gridLayer, gridSize - 2, col);
        if (cell) {
            cell.fire('click');
        }
    }
    
    // Top row of the rectangle (3 cups)
    console.log('Building top row of rectangle...');
    for (let i = 0; i < 3; i++) {
        const col = centerCol - 6 + (i * 2); // Każdy kubeczek ma szerokość 2, więc zwiększamy o 2
        const cell = findCellAtPosition(gridLayer, gridSize - 3, col);
        if (cell) {
            cell.fire('click');
        }
    }
    
    console.log('Rectangle test completed. You should see a 3x3 rectangle of cups.');
}

// Funkcja do testowania budowy prostokąta z odstępami (1 kratka odstępu)
function testRectangleWithGap() {
    console.log('Starting rectangle with gap test...');
    
    // Check if application is loaded
    if (!window.Konva || !document.getElementById('canvas')) {
        console.error('Application not loaded. Please run this test after the application is fully loaded.');
        return;
    }
    
    // Ustaw rozmiar siatki na 10x10
    const gridSizeSelector = document.getElementById('grid-size');
    if (gridSizeSelector) {
        gridSizeSelector.value = '10';
        // Trigger the change event
        const event = new Event('change');
        gridSizeSelector.dispatchEvent(event);
        console.log('Set grid size to 10x10');
    } else {
        console.error('Grid size selector not found');
        return;
    }
    
    // Select a cup (third cup for different color)
    const cupOptions = document.querySelectorAll('.cup-option');
    if (cupOptions && cupOptions.length > 2) {
        cupOptions[2].click();
        console.log('Selected cup color');
    } else if (cupOptions && cupOptions.length > 0) {
        cupOptions[0].click();
        console.log('Selected first cup color');
    } else {
        console.error('No cup options found');
        return;
    }
    
    // Get stage and layers
    const stage = Konva.stages[0];
    if (!stage) {
        console.error('Konva stage not found');
        return;
    }
    
    const gridLayer = stage.findOne('Layer');
    if (!gridLayer) {
        console.error('Grid layer not found');
        return;
    }
    
    // Get gridSize from app
    const gridSize = parseInt(document.getElementById('grid-size').value);
    
    // Oblicz środek siatki (od którego zaczniemy budowę)
    const centerCol = Math.floor(gridSize);
    
    // Build a 3x2 rectangle z odstępami
    console.log('Building bottom row of rectangle with gaps...');
    // Bottom row of the rectangle
    for (let i = 0; i < 2; i++) {
        // POPRAWKA: Kubeczki mają szerokość 2 jednostki, a chcemy mieć odstęp 1 jednostkę
        // więc odległość między początkami kubeczków to 3 jednostki
        const col = centerCol - 6 + (i * 3); // Odstęp 1 kratki (kolumna, kolumna+1 zajęte przez kubeczek, kolumna+2 wolna)
        const cell = findCellAtPosition(gridLayer, gridSize - 1, col);
        if (cell) {
            cell.fire('click');
        } else {
            console.error('Cell not found at position', gridSize - 1, col);
            // Jeśli nie znaleziono komórki, próbujemy z lekko przesunięciem - może siatka jest nieco inaczej wyrównana
            const altCell = findCellAtPosition(gridLayer, gridSize - 1, col + 1);
            if (altCell) {
                console.log('Using alternative cell');
                altCell.fire('click');
            }
        }
    }
    
    // Middle row of the rectangle
    console.log('Building middle row of rectangle with gaps...');
    for (let i = 0; i < 2; i++) {
        const col = centerCol - 6 + (i * 3); // Odstęp 1 kratki
        const cell = findCellAtPosition(gridLayer, gridSize - 2, col);
        if (cell) {
            cell.fire('click');
        } else {
            // Alternatywne próby znalezienia komórki
            const altCell = findCellAtPosition(gridLayer, gridSize - 2, col + 1);
            if (altCell) {
                console.log('Using alternative cell');
                altCell.fire('click');
            }
        }
    }
    
    // Top row of the rectangle
    console.log('Building top row of rectangle with gaps...');
    for (let i = 0; i < 2; i++) {
        const col = centerCol - 6 + (i * 3); // Odstęp 1 kratki
        const cell = findCellAtPosition(gridLayer, gridSize - 3, col);
        if (cell) {
            cell.fire('click');
        } else {
            // Alternatywne próby znalezienia komórki
            const altCell = findCellAtPosition(gridLayer, gridSize - 3, col + 1);
            if (altCell) {
                console.log('Using alternative cell');
                altCell.fire('click');
            }
        }
    }
    
    console.log('Rectangle with gap test completed. You should see a 3x2 rectangle with 1-cell gaps between cups.');
}

/**
 * Funkcja pomocnicza do znajdowania komórki w siatce na podstawie pozycji
 * @param {Konva.Layer} gridLayer - warstwa siatki
 * @param {number} row - numer wiersza
 * @param {number} col - numer kolumny
 * @returns {Konva.Rect|null} znaleziona komórka lub null
 */
function findCellAtPosition(gridLayer, row, col) {
    // Oblicz rozmiar komórki na podstawie pierwszej komórki w warstwie
    const firstRect = gridLayer.find('Rect')[1]; // Pierwszy prostokąt to tło, drugi to już komórka
    if (!firstRect) return null;
    
    const horizontalCellSize = firstRect.width(); // Teraz to będzie połowa normalnej szerokości
    const cellHeight = firstRect.height();
    
    // Znajdź komórkę na podstawie jej pozycji
    return gridLayer.findOne(node => {
        // Sprawdź czy to prostokąt (komórka siatki)
        if (node.className !== 'Rect' || node === gridLayer.find('Rect')[0]) return false;
        
        // Sprawdź pozycję
        const nodeY = Math.round(node.y());
        const nodeX = Math.round(node.x());
        const expectedY = Math.round(row * cellHeight);
        const expectedX = Math.round(col * horizontalCellSize);
        
        // Dajemy pewien margines błędu dla obliczeń zmiennoprzecinkowych
        const isYMatching = Math.abs(nodeY - expectedY) <= 1;
        const isXMatching = Math.abs(nodeX - expectedX) <= 1;
        
        return isYMatching && isXMatching;
    });
}

// Zapewnienie, że funkcje są dostępne globalnie
window.testPyramid = testPyramid;
window.testRectangle = testRectangle;
window.testRectangleWithGap = testRectangleWithGap;

// Informacja w konsoli o dostępnych funkcjach testowych
console.log('Funkcje testowe dostępne w konsoli:');
console.log('- testPyramid() - buduje piramidę 4-3-2-1');
console.log('- testRectangle() - buduje prostokąt 3x3');
console.log('- testRectangleWithGap() - buduje prostokąt 3x2 z odstępami 1 kratki między kubeczkami');

// To run these tests, type one of these commands in the browser console:
// testPyramid();
// testRectangle();
// testRectangleWithGap();   