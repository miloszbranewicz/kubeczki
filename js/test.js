/**
 * Test script for the Cup Pyramid Generator
 * 
 * This script will create a simple pyramid to verify that the application works correctly.
 * You can run this in the browser console to test the application.
 */

function testPyramid() {
    console.log('Starting pyramid test...');
    
    // Check if application is loaded
    if (!window.Konva || !document.getElementById('canvas')) {
        console.error('Application not loaded. Please run this test after the application is fully loaded.');
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
    
    // Set grid size to 10x10
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
    
    // Build a simple pyramid
    // First row (bottom row): 4 cups
    console.log('Building first row of pyramid (base)...');
    for (let col = 3; col < 7; col++) {
        // For bottom row, find cells at the bottom of the canvas
        const cell = gridLayer.findOne(node => {
            const rowPosition = gridSize - 1; // Bottom row
            return node.className === 'Rect' && 
                   Math.round(node.y() / node.height()) === rowPosition && 
                   Math.round(node.x() / node.width()) === col;
        });
        
        if (cell) {
            cell.fire('click');
        }
    }
    
    // Second row: 3 cups (one row up from bottom)
    console.log('Building second row of pyramid...');
    for (let col = 3; col < 6; col++) {
        const cell = gridLayer.findOne(node => {
            const rowPosition = gridSize - 2; // Second row from bottom
            const isOddRow = rowPosition % 2 === 1;
            return node.className === 'Rect' && 
                   Math.round(node.y() / node.height()) === rowPosition && 
                   Math.round((node.x() - (isOddRow ? node.width()/2 : 0)) / node.width()) === col;
        });
        
        if (cell) {
            cell.fire('click');
        }
    }
    
    // Third row: 2 cups (two rows up from bottom)
    console.log('Building third row of pyramid...');
    for (let col = 3; col < 5; col++) {
        const cell = gridLayer.findOne(node => {
            const rowPosition = gridSize - 3; // Third row from bottom
            const isOddRow = rowPosition % 2 === 1;
            return node.className === 'Rect' && 
                   Math.round(node.y() / node.height()) === rowPosition && 
                   Math.round((node.x() - (isOddRow ? node.width()/2 : 0)) / node.width()) === col;
        });
        
        if (cell) {
            cell.fire('click');
        }
    }
    
    // Fourth row: 1 cup (three rows up from bottom)
    console.log('Building fourth row of pyramid (top)...');
    const topCell = gridLayer.findOne(node => {
        const rowPosition = gridSize - 4; // Fourth row from bottom
        const isOddRow = rowPosition % 2 === 1;
        return node.className === 'Rect' && 
               Math.round(node.y() / node.height()) === rowPosition && 
               Math.round((node.x() - (isOddRow ? node.width()/2 : 0)) / node.width()) === 3;
    });
    
    if (topCell) {
        topCell.fire('click');
    }
    
    console.log('Pyramid test completed. You should see a 4-3-2-1 pyramid starting from the bottom of the canvas.');
}

// To run this test, uncomment the line below or run it in the browser console
// testPyramid(); 