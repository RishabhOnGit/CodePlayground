// Handle responsive layout
function handleResponsiveLayout() {
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    // Update UI elements for mobile view
    if (isMobile) {
        // Adjust terminal/output height for better visibility on mobile
        const outputContainer = document.querySelector('.output-container');
        if (outputContainer) {
            outputContainer.style.minHeight = isSmallMobile ? '120px' : '100px';
        }
        
        // Ensure panels are properly sized
        const editorPanels = document.querySelectorAll('.editor-panel');
        editorPanels.forEach(panel => {
            panel.style.minHeight = '200px';
        });
    }
}

// Initialize responsive behavior
document.addEventListener('DOMContentLoaded', function() {
    // Existing initialization code...
    
    // Add responsive layout handling
    handleResponsiveLayout();
    window.addEventListener('resize', handleResponsiveLayout);
});

// Fix footer button layout on small screens
function updateFooterButtons() {
    const footer = document.querySelector('.footer');
    if (!footer) return;
    
    if (window.innerWidth <= 480) {
        // Use icons only for small screens
        const textButtons = footer.querySelectorAll('.toolbar-button:not(.btn-icon)');
        textButtons.forEach(button => {
            const buttonText = button.textContent.trim();
            // Store original text as data attribute if not already stored
            if (!button.dataset.originalText) {
                button.dataset.originalText = buttonText;
                
                // Replace with icon if possible, otherwise keep short text
                if (buttonText === 'Save') {
                    button.innerHTML = '<i class="fas fa-save"></i>';
                } else if (buttonText === 'Load') {
                    button.innerHTML = '<i class="fas fa-folder-open"></i>';
                } else if (buttonText === 'Examples') {
                    button.innerHTML = '<i class="fas fa-list"></i>';
                } else if (buttonText === 'Run') {
                    button.innerHTML = '<i class="fas fa-play"></i>';
                } else if (buttonText.length > 5) {
                    button.textContent = buttonText.substring(0, 3) + '...';
                }
            }
        });
    } else {
        // Restore original text for larger screens
        const textButtons = footer.querySelectorAll('.toolbar-button');
        textButtons.forEach(button => {
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        });
    }
}

// Call on load and resize
window.addEventListener('load', updateFooterButtons);
window.addEventListener('resize', updateFooterButtons); 