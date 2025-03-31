/**
 * Utility functions for the Cup Pyramid Generator
 */

/**
 * Check if required dependencies are loaded
 */
function checkDependencies() {
    const dependencies = [
        { name: 'Konva', object: window.Konva, retry: () => loadScript('js/konva.min.js') },
        { name: 'jsPDF', object: window.jspdf, retry: () => loadScript('js/jspdf.min.js') },
        { name: 'LZString', object: window.LZString, retry: () => loadScript('js/lz-string.min.js') }
    ];
    
    let errorMessage;
    const missingDependencies = dependencies.filter(dep => !dep.object);
    
    if (missingDependencies.length > 0) {
        const missingNames = missingDependencies.map(dep => dep.name).join(', ');
        console.error(`Missing dependencies: ${missingNames}`);
        
        // Try to reload missing dependencies
        let reloadAttempted = false;
        missingDependencies.forEach(dep => {
            if (dep.retry) {
                reloadAttempted = true;
                console.log(`Attempting to reload ${dep.name}...`);
                dep.retry();
            }
        });
        
        // Create an error message element
        errorMessage = document.createElement('div');
        errorMessage.id = 'dependency-error';
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <h2>Błąd ładowania bibliotek</h2>
            <p>Następujące biblioteki nie zostały poprawnie załadowane: <strong>${missingNames}</strong></p>
            <p>Sprawdź połączenie internetowe i odśwież stronę. Jeśli problem będzie się powtarzał, skontaktuj się z administratorem.</p>
            ${reloadAttempted ? '<p>Próbuję ponownie załadować brakujące biblioteki...</p>' : ''}
            <button id="retry-dependencies" style="padding: 10px 20px; margin-top: 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Spróbuj ponownie</button>
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
        
        // Add click handler to the retry button
        setTimeout(() => {
            const retryButton = document.getElementById('retry-dependencies');
            if (retryButton) {
                retryButton.addEventListener('click', function() {
                    location.reload();
                });
            }
        }, 0);
        
        // If attempt to reload automatically, check again after a short delay
        if (reloadAttempted) {
            setTimeout(() => {
                // Check if we still have missing dependencies
                const stillMissing = dependencies.filter(dep => !dep.object);
                if (stillMissing.length === 0) {
                    // All dependencies loaded now
                    errorMessage.style.backgroundColor = '#d4edda';
                    errorMessage.style.color = '#155724';
                    errorMessage.innerHTML = `
                        <h2>Biblioteki załadowane</h2>
                        <p>Wszystkie wymagane biblioteki zostały załadowane pomyślnie. Strona będzie odświeżona za 3 sekundy.</p>
                    `;
                    
                    // Reload the page after showing success message
                    setTimeout(() => {
                        location.reload();
                    }, 3000);
                }
            }, 2000);
        }
        
        return false;
    }
    
    return true;
}

/**
 * Helper function to dynamically load a script
 * @param {string} src - Script URL
 * @returns {Promise} - Promise that resolves when script is loaded
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Calculate optimal grid size based on available space
 * 
 * @param {number} containerWidth - Width of the container
 * @param {number} gridSize - Number of cells in the grid
 * @returns {number} - Calculated cell size
 */
function calculateCellSize(containerWidth, gridSize) {
    // Oblicz maksymalny możliwy rozmiar komórki, aby cała siatka zmieściła się w kontenerze
    // Odejmujemy małe padding, aby zapewnić margines bezpieczeństwa
    const padding = 2; // Zmniejszony padding, aby maksymalnie wykorzystać dostępną przestrzeń
    const availableWidth = containerWidth - padding;
    
    // Podziel dostępną szerokość przez liczbę komórek w siatce
    let cellSize = Math.floor(availableWidth / gridSize);
    
    // Upewnij się, że komórki nie są zbyt małe (minimum 20px)
    cellSize = Math.max(cellSize, 20);
    
    return cellSize;
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
    createDebugInfo,
    loadScript
}; 