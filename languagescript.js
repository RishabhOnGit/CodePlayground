// Constants for Judge0 API
const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = "b0a088b6d8msh733baa51a484274p160c8djsnd292d46be2bf";
const JUDGE0_API_HOST = "judge0-ce.p.rapidapi.com";

// Language IDs for Judge0 API
const LANGUAGE_IDS = {
    "c": 50,      // C (GCC 9.2.0)
    "python": 71  // Python (3.8.1)
};

// Global variables for input handling
let userInputQueue = [];
let userInputValues = [];
let isWaitingForInput = false;
let currentInputCallback = null;

// Initialize CodeMirror Editor
let codeEditor;
let currentLanguage = 'python';

// Initialize CodeMirror with default Python settings
window.addEventListener('DOMContentLoaded', function() {
    codeEditor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        mode: 'python',
        theme: 'material',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        extraKeys: {
            'Ctrl-/': 'toggleComment',
            'Cmd-/': 'toggleComment',
            'Tab': function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection('add');
                } else {
                    cm.replaceSelection('    ', 'end', '+input');
                }
            }
        }
    });

    // Pre-fill with default Python code
    setPythonDefaultCode();
    
    // Remove welcome overlay if it exists
    const welcomeOverlay = document.getElementById('welcome-overlay');
    if (welcomeOverlay) {
        welcomeOverlay.style.display = 'none';
    }
    
    // Show ready notification
    showNotification('Ready to code!');

    // Initialize event listeners
    initializeEventListeners();
    
    // Initial adjustment for screen size
    adjustForScreenSize();
});

// Function to adjust UI based on screen size
function adjustForScreenSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const isMobile = width <= 768;
    const isSmallMobile = width <= 480;
    
    // Refresh CodeMirror to ensure proper rendering
    if (codeEditor) {
        // Multiple refreshes for better rendering on mobile
        setTimeout(() => codeEditor.refresh(), 10);
        setTimeout(() => codeEditor.refresh(), 100);
        setTimeout(() => codeEditor.refresh(), 300);
    }
    
    // Adjust font size for small screens
    if (isSmallMobile) {
        document.documentElement.style.setProperty('--editor-font-size', '13px');
        document.documentElement.style.setProperty('--terminal-font-size', '13px');
    } else if (isMobile) {
        document.documentElement.style.setProperty('--editor-font-size', '13px');
        document.documentElement.style.setProperty('--terminal-font-size', '13px');
    } else {
        document.documentElement.style.setProperty('--editor-font-size', '14px');
        document.documentElement.style.setProperty('--terminal-font-size', '14px');
    }
    
    // Handle landscape mode on mobile
    if (isLandscape && height <= 500) {
        // Add header buttons in landscape mode
        const outputHeader = document.querySelector('.output-section .editor-header');
        
        // Remove existing header buttons if they exist
        const existingButtonContainer = document.querySelector('.header-buttons');
        if (existingButtonContainer) {
            existingButtonContainer.remove();
        }
        
        // Create header buttons
        const headerButtons = document.createElement('div');
        headerButtons.className = 'header-buttons';
        
        // Create Save button
        const saveButton = document.createElement('button');
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.addEventListener('click', saveCode);
        headerButtons.appendChild(saveButton);
        
        // Create Load button
        const loadButton = document.createElement('button');
        loadButton.innerHTML = '<i class="fas fa-folder-open"></i>';
        loadButton.addEventListener('click', loadCode);
        headerButtons.appendChild(loadButton);
        
        // Create Examples button
        const examplesButton = document.createElement('button');
        examplesButton.innerHTML = '<i class="fas fa-book"></i>';
        examplesButton.addEventListener('click', showExamples);
        headerButtons.appendChild(examplesButton);
        
        // Add buttons to header
        outputHeader.appendChild(headerButtons);
        
        // Hide run button text
        const runButton = document.getElementById('run-button');
        if (runButton && runButton.querySelector('span')) {
            runButton.querySelector('span').style.display = 'none';
        }
        
        // Adjust editor indentation for small screens
        if (codeEditor) {
            codeEditor.setOption('tabSize', 2);
            codeEditor.setOption('indentUnit', 2);
        }
    } else {
        // Remove header buttons if they exist
        const headerButtons = document.querySelector('.header-buttons');
        if (headerButtons) {
            headerButtons.remove();
        }
        
        const runButton = document.getElementById('run-button');
        if (runButton && runButton.querySelector('span') && !isMobile) {
            runButton.querySelector('span').style.display = 'inline';
        }
        
        // Reset editor indentation for larger screens
        if (codeEditor && !isMobile) {
            codeEditor.setOption('tabSize', 4);
            codeEditor.setOption('indentUnit', 4);
        }
    }
    
    // For very small screens, adjust editor options
    if (isSmallMobile) {
        if (codeEditor) {
            codeEditor.setOption('lineNumbers', width > 320);
        }
    } else {
        if (codeEditor) {
            codeEditor.setOption('lineNumbers', true);
        }
    }
}

// Initialize all event listeners
function initializeEventListeners() {
    // Language selector
    document.getElementById('language-select').addEventListener('change', handleLanguageChange);
    
    // Run button
    document.getElementById('run-button').addEventListener('click', runCode);
    
    // Save button
    document.getElementById('save-button').addEventListener('click', saveCode);
    
    // Load button
    document.getElementById('load-button').addEventListener('click', loadCode);
    
    // Examples button
    document.getElementById('examples-button').addEventListener('click', showExamples);
    
    // Home button
    document.getElementById('home-button').addEventListener('click', goToHome);
    
    // Window resize and orientation change events for responsive design
    window.addEventListener('resize', adjustForScreenSize);
    window.addEventListener('orientationchange', function() {
        setTimeout(adjustForScreenSize, 100);
    });
}

// Handle language change
function handleLanguageChange(event) {
    const newLanguage = event.target.value;
    
    if (newLanguage === currentLanguage) return;
    
    currentLanguage = newLanguage;
    const languageIcon = document.getElementById('language-icon');
    const editorTitle = document.getElementById('editor-title');
    
    // Update editor mode and default code based on language
    switch(newLanguage) {
        case 'python':
            codeEditor.setOption('mode', 'python');
            languageIcon.innerHTML = '<i class="fab fa-python"></i>';
            editorTitle.textContent = 'Python';
            setPythonDefaultCode();
            break;
        case 'c':
            codeEditor.setOption('mode', 'text/x-csrc');
            languageIcon.innerHTML = '<i class="fas fa-code"></i>';
            editorTitle.textContent = 'C';
            setCDefaultCode();
            break;
    }
    
    // Show language change notification
    showNotification(`Switched to ${editorTitle.textContent}`);
}

// Set default code for Python
function setPythonDefaultCode() {
    const defaultCode = `# Python Example
def greet(name):
    return f"Hello, {name}!"

# Main function
if __name__ == "__main__":
    user_name = input("Enter your name: ")
    message = greet(user_name)
    print(message)
`;
    codeEditor.setValue(defaultCode);
}

// Set default code for C
function setCDefaultCode() {
    const defaultCode = `/* C Example */
#include <stdio.h>

// Function to greet a user
void greet(const char* name) {
    printf("Hello, %s!\\n", name);
}

// Main function
int main() {
    char user_name[50];
    printf("Enter your name: ");
    scanf("%s", user_name);
    
    greet(user_name);
    
    return 0;
}
`;
    codeEditor.setValue(defaultCode);
}

// Extract potential stdin from code
function getStdinFromCode(code) {
    let inputPrompts = [];
    
    // Look for input() calls in Python code
    if (currentLanguage === 'python' && code.includes('input(')) {
        // Find all input() calls with their prompts
        const inputRegex = /input\((?:["'](.*?)["'])?\)/g;
        let match;
        while ((match = inputRegex.exec(code)) !== null) {
            inputPrompts.push(match[1] || "Enter input:");
        }
    }
    // Look for scanf in C code
    else if (currentLanguage === 'c' && code.includes('scanf(')) {
        // Match scanf patterns
        const scanfRegex = /scanf\s*\(\s*["']([^"']*)["']/g;
        let match;
        while ((match = scanfRegex.exec(code)) !== null) {
            const formatString = match[1];
            // Count format specifiers like %d, %s, etc.
            const specifierCount = (formatString.match(/%[diufsc]/g) || []).length;
            for (let i = 0; i < specifierCount; i++) {
                inputPrompts.push(`Please provide 1 value(s) for scanf (one per line):`);
            }
        }
    }
    
    return inputPrompts;
}

// Run the code using Judge0 API
async function runCode() {
    const code = codeEditor.getValue();
    const terminalContent = document.getElementById('terminal-content');
    
    // Clear the terminal and reset input variables
    terminalContent.innerHTML = '';
    userInputQueue = [];
    userInputValues = [];
    isWaitingForInput = false;
    
    // Get input prompts
    const inputPrompts = getStdinFromCode(code);
    if (inputPrompts.length > 0) {
        userInputQueue = [...inputPrompts];
    }
    
    // Add spinner to show execution
    const spinnerLine = document.createElement('div');
    spinnerLine.className = 'terminal-line';
    spinnerLine.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compiling and running...';
    terminalContent.appendChild(spinnerLine);
    
    // Start input collection if needed
    if (userInputQueue.length > 0) {
        // Remove spinner since we'll ask for input first
        terminalContent.removeChild(spinnerLine);
        
        // Start collecting input
        collectUserInput(terminalContent)
            .then((inputs) => {
                // After all inputs are collected, run the code
                executeCodeWithInputs(code, inputs, terminalContent);
            });
    } else {
        // No input needed, run code directly
        executeCodeWithInputs(code, "", terminalContent);
    }
    
    showNotification('Running code...');
}

// Collect user input from terminal
function collectUserInput(terminalContent) {
    return new Promise((resolve) => {
        let collectedInputs = [];
        
        function processNextInput() {
            if (userInputQueue.length === 0) {
                // All inputs collected
                resolve(collectedInputs.join('\n'));
                return;
            }
            
            isWaitingForInput = true;
            const nextPrompt = userInputQueue.shift();
            
            // Create prompt
            const promptLine = document.createElement('div');
            promptLine.className = 'terminal-line input-prompt';
            promptLine.textContent = nextPrompt;
            terminalContent.appendChild(promptLine);
            
            // Create input container
            const inputContainer = document.createElement('div');
            inputContainer.className = 'input-container';
            terminalContent.appendChild(inputContainer);
            
            // Create input field
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.className = 'terminal-input';
            inputField.placeholder = 'Type here...';
            inputContainer.appendChild(inputField);
            
            // Focus on input field
            setTimeout(() => inputField.focus(), 100);
            
            // Handle input submission
            inputField.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    const value = inputField.value;
                    
                    // Replace input container with the submitted value
                    const inputLine = document.createElement('div');
                    inputLine.className = 'terminal-line user-input';
                    inputLine.textContent = value;
                    terminalContent.replaceChild(inputLine, inputContainer);
                    
                    // Save input
                    collectedInputs.push(value);
                    isWaitingForInput = false;
                    
                    // Scroll to bottom
                    terminalContent.scrollTop = terminalContent.scrollHeight;
                    
                    // Process next input
                    processNextInput();
                }
            });
        }
        
        // Start processing inputs
        processNextInput();
    });
}

// Execute code with collected inputs
async function executeCodeWithInputs(code, stdin, terminalContent) {
    // Add spinner to show execution
    const spinnerLine = document.createElement('div');
    spinnerLine.className = 'terminal-line';
    spinnerLine.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compiling and running...';
    terminalContent.appendChild(spinnerLine);
    
    try {
        // Create submission
        const submissionToken = await createSubmission(code, stdin);
        
        if (!submissionToken) {
            throw new Error("Failed to create submission");
        }
        
        // Check submission status every 1 second
        let result = null;
        const checkStatusInterval = setInterval(async () => {
            result = await getSubmissionResult(submissionToken);
            
            if (result.status.id > 2) { // Status > 2 means submission is done
                clearInterval(checkStatusInterval);
                displayResults(result, terminalContent);
                
                // Remove spinner
                if (terminalContent.contains(spinnerLine)) {
                    terminalContent.removeChild(spinnerLine);
                }
            }
        }, 1000);
    } catch (error) {
        // Remove spinner
        if (terminalContent.contains(spinnerLine)) {
            terminalContent.removeChild(spinnerLine);
        }
        
        // Show error message
        const errorLine = document.createElement('div');
        errorLine.className = 'terminal-line error-output';
        errorLine.textContent = `Error: ${error.message}`;
        terminalContent.appendChild(errorLine);
    }
}

// Create a submission to Judge0 API
async function createSubmission(code, stdin) {
    const url = `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`;
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': JUDGE0_API_KEY,
            'X-RapidAPI-Host': JUDGE0_API_HOST
        },
        body: JSON.stringify({
            language_id: LANGUAGE_IDS[currentLanguage],
            source_code: code,
            stdin: stdin
        })
    };
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (data.token) {
            return data.token;
        } else {
            throw new Error("Failed to create submission");
        }
    } catch (error) {
        console.error('Error creating submission:', error);
        throw error;
    }
}

// Get submission result from Judge0 API
async function getSubmissionResult(token) {
    const url = `${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`;
    
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': JUDGE0_API_KEY,
            'X-RapidAPI-Host': JUDGE0_API_HOST
        }
    };
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting submission result:', error);
        throw error;
    }
}

// Display execution results
function displayResults(result, terminalContent) {
    // Show compile output if there's an error
    if (result.compile_output && result.status.id !== 3) {
        const compileErrorLine = document.createElement('div');
        compileErrorLine.className = 'terminal-line error-output';
        compileErrorLine.textContent = `Compilation Error: ${result.compile_output}`;
        terminalContent.appendChild(compileErrorLine);
    }
    
    // Show stderr if any
    if (result.stderr) {
        const stderrLine = document.createElement('div');
        stderrLine.className = 'terminal-line error-output';
        stderrLine.textContent = result.stderr;
        terminalContent.appendChild(stderrLine);
    }
    
    // Show stdout if any
    if (result.stdout) {
        const lines = result.stdout.split("\n");
        lines.forEach(line => {
            if (line.trim() === "") return;
            const stdoutLine = document.createElement('div');
            stdoutLine.className = 'terminal-line';
            stdoutLine.textContent = line;
            terminalContent.appendChild(stdoutLine);
        });
    }
    
    // Show execution status
    const statusLine = document.createElement('div');
    statusLine.className = 'terminal-line';
    
    if (result.status.id === 3) { // Accepted/Success
        statusLine.innerHTML = '<span style="color: #4CAF50;">✓ Execution completed successfully</span>';
    } else {
        statusLine.innerHTML = `<span style="color: #f44336;">✗ ${result.status.description}</span>`;
    }
    terminalContent.appendChild(statusLine);
    
    // Show execution time and memory if available
    if (result.time && result.memory) {
        const performanceLine = document.createElement('div');
        performanceLine.className = 'terminal-line performance-info';
        performanceLine.textContent = `Time: ${result.time}s | Memory: ${Math.round(result.memory / 1024)}KB`;
        terminalContent.appendChild(performanceLine);
    }
}

// Save code to localStorage
function saveCode() {
    try {
        const codeData = {
            language: currentLanguage,
            code: codeEditor.getValue()
        };
        localStorage.setItem('savedLanguageCode', JSON.stringify(codeData));
        showNotification('Code saved successfully!');
    } catch (error) {
        showNotification('Failed to save code!');
        console.error('Save error:', error);
    }
}

// Load code from localStorage
function loadCode() {
    try {
        const savedData = localStorage.getItem('savedLanguageCode');
        if (savedData) {
            const codeData = JSON.parse(savedData);
            
            // Set the language selector to match saved language
            document.getElementById('language-select').value = codeData.language;
            
            // Trigger language change event
            const event = new Event('change');
            document.getElementById('language-select').dispatchEvent(event);
            
            // Set the code
            codeEditor.setValue(codeData.code);
            
            showNotification('Code loaded successfully!');
        } else {
            showNotification('No saved code found!');
        }
    } catch (error) {
        showNotification('Failed to load code!');
        console.error('Load error:', error);
    }
}

// Show example code menu (mock implementation)
function showExamples() {
    showNotification('Examples feature coming soon!');
}

// Go back to home page
function goToHome() {
    // Show transition
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = '#4a148c';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s ease-in-out';
    document.body.appendChild(overlay);
    
    // Fade in effect
    setTimeout(() => {
        overlay.style.opacity = '1';
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }, 10);
}

// Show notification with special styling for "Ready to code!"
function showNotification(message) {
    const notification = document.getElementById('notification-popup');
    if (!notification) return;
    
    // Clear any existing timeouts
    if (window.notificationTimeout) {
        clearTimeout(window.notificationTimeout);
    }
    
    // Reset the notification state and classes
    notification.classList.remove('show', 'ready-notification');
    void notification.offsetWidth; // Force reflow
    
    // Set the message and show the notification
    notification.textContent = message;
    
    // Add special class for "Ready to code!" message
    if (message && (message.toLowerCase().includes('ready to code') || 
        message.toLowerCase().includes('ready to run'))) {
        notification.classList.add('ready-notification');
    }
    
    notification.classList.add('show');
    
    // Hide after 3 seconds
    window.notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
} 