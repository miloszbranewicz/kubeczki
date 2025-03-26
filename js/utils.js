/**
 * Utility functions for the Cup Pyramid Generator
 */

/**
 * Check if required dependencies are loaded
 */
function checkDependencies() {
    const dependencies = [
        { name: 'Konva', object: window.Konva },
        { name: 'jsPDF', object: window.jspdf }
    ];
    
    const missingDependencies = dependencies.filter(dep => !dep.object);
    
    if (missingDependencies.length > 0) {
        const missingNames = missingDependencies.map(dep => dep.name).join(', ');
        
        // Create an error message element
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <h2>Błąd ładowania bibliotek</h2>
            <p>Następujące biblioteki nie zostały poprawnie załadowane: <strong>${missingNames}</strong></p>
            <p>Sprawdź połączenie internetowe i odśwież stronę. Jeśli problem będzie się powtarzał, skontaktuj się z administratorem.</p>
        `;
        
        // Add styles to the error message
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '0';
        errorMessage.style.left = '0';
        errorMessage.style.width = '100%';
        errorMessage.style.backgroundColor = '#f8d7da';
        errorMessage.style.color = '#721c24';
        errorMessage.style.padding = '20px';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.zIndex = '9999';
        errorMessage.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        
        // Append to the body
        document.body.appendChild(errorMessage);
        
        return false;
    }
    
    return true;
}

/**
 * Calculate optimal grid size based on available space
 * 
 * @param {number} containerWidth - Width of the container
 * @param {number} gridSize - Number of cells in the grid
 * @returns {number} - Calculated cell size
 */
function calculateCellSize(containerWidth, gridSize) {
    // Calculate cell size based on container width and grid size
    // Add some padding
    const padding = 40;
    const availableWidth = containerWidth - padding;
    
    return Math.floor(availableWidth / gridSize);
}

/**
 * Create debug information for development purposes
 * 
 * @param {Object} config - Configuration object
 * @param {Array} cups - Array of cups
 */
function createDebugInfo(config, cups) {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }
    
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.right = '10px';
    debugPanel.style.padding = '10px';
    debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugPanel.style.color = '#fff';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.zIndex = '1000';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.maxWidth = '300px';
    debugPanel.style.maxHeight = '200px';
    debugPanel.style.overflow = 'auto';
    
    // Update debug info
    function updateDebugInfo() {
        debugPanel.innerHTML = `
            <h4>Debug Info</h4>
            <p>Grid Size: ${config.gridSize}x${config.gridSize}</p>
            <p>Cell Size: ${config.cupWidth}px</p>
            <p>Selected Cup: ${config.selectedCupColor || 'None'}</p>
            <p>Cups Count: ${cups.length}</p>
        `;
    }
    
    // Update every second
    updateDebugInfo();
    setInterval(updateDebugInfo, 1000);
    
    document.body.appendChild(debugPanel);
}

// Export utilities
window.pyramidUtils = {
    checkDependencies,
    calculateCellSize,
    createDebugInfo
}; 