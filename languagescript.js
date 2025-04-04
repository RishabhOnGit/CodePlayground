// Constants for Judge0 API
const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = "b0a088b6d8msh733baa51a484274p160c8djsnd292d46be2bf";
const JUDGE0_API_HOST = "judge0-ce.p.rapidapi.com";

// Language IDs for Judge0 API
const LANGUAGE_IDS = {
    "c": 50,      // C (GCC 9.2.0)
    "python": 71  // Python (3.8.1)
};

// GitHub configuration
const GITHUB_LANGUAGE_FOLDER = 'language-playground';

// File extensions for each language
const FILE_EXTENSIONS = {
    "python": "py",
    "c": "c"
};

// Global variables for input handling
let userInputQueue = [];
let userInputValues = [];
let isWaitingForInput = false;
let currentInputCallback = null;

// Initialize CodeMirror Editor
let codeEditor;
let currentLanguage = 'python';
let selectedFileName = null;

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
    
    // Initialize GitHub dialog listeners
    initializeGitHubDialogs();
    
    // Initialize user account display
    initializeUserAccount();
    
    // Track this page view if Firebase is available
    if (typeof firebase !== 'undefined') {
        console.log('Firebase SDK loaded');
        trackPageView('language-playground');
        incrementLanguageUsage(currentLanguage);
    } else {
        console.log('Firebase SDK not available');
    }
});

// Track page view
function trackPageView(pageType) {
    // Check if user is authenticated
    if (!window.githubUtils || !window.githubUtils.isGithubAuthenticated()) {
        return;
    }
    
    const userName = localStorage.getItem('github_user_name');
    const userAvatar = localStorage.getItem('github_user_avatar');
    
    // Only track if we have user info
    if (!userName) return;
    
    const database = firebase.database();
    
    // Log page view
    database.ref('pageViews').push({
        userName: userName,
        userAvatar: userAvatar,
        pageType: pageType,
        timestamp: Date.now()
    });
    
    // Update user record or create if doesn't exist
    database.ref('users').child(userName).once('value', snapshot => {
        if (snapshot.exists()) {
            // Update existing user
            database.ref('users').child(userName).update({
                lastActive: Date.now(),
                lastPage: pageType
            });
        } else {
            // Create new user
            database.ref('users').child(userName).set({
                name: userName,
                avatarUrl: userAvatar,
                github: localStorage.getItem('github_user_login'),
                firstSeen: Date.now(),
                lastActive: Date.now(),
                lastPage: pageType,
                projectCount: 0
            });
        }
    });
}

// Track code execution
function trackCodeExecution() {
    // Check if user is authenticated
    if (!window.githubUtils || !window.githubUtils.isGithubAuthenticated()) {
        return;
    }
    
    const userName = localStorage.getItem('github_user_name');
    if (!userName) return;
    
    const database = firebase.database();
    
    // Log code execution
    database.ref('codeExecutions').push({
        userName: userName,
        language: currentLanguage,
        type: 'language',
        timestamp: Date.now()
    });
    
    // Update language usage stats
    incrementLanguageUsage(currentLanguage);
}

// Increment language usage counter
function incrementLanguageUsage(language) {
    const database = firebase.database();
    const langRef = database.ref('languageUsage').child(language);
    
    // Increment using transaction
    langRef.transaction(current => {
        return (current || 0) + 1;
    });
}

// Track file save
function trackFileSave(fileName) {
    // Check if user is authenticated
    if (!window.githubUtils || !window.githubUtils.isGithubAuthenticated()) {
        return;
    }
    
    const userName = localStorage.getItem('github_user_name');
    const userAvatar = localStorage.getItem('github_user_avatar');
    if (!userName) return;
    
    const database = firebase.database();
    
    // Log file save activity
    database.ref('activity').push({
        userName: userName,
        userAvatar: userAvatar,
        action: `Saved ${currentLanguage} file`,
        projectName: fileName,
        timestamp: Date.now(),
        status: 'completed'
    });
    
    // Update project in projects collection
    const projectRef = database.ref('projects').child(fileName.replace(/[.#$/\\]/g, '_'));
    projectRef.update({
        name: fileName,
        ownerName: userName,
        ownerAvatar: userAvatar,
        type: currentLanguage,
        lastModified: Date.now(),
        status: 'private'
    });
    
    // Update user's project count
    database.ref('users').child(userName).once('value', snapshot => {
        if (snapshot.exists() && snapshot.hasChild('projectCount')) {
            const count = snapshot.val().projectCount;
            database.ref('users').child(userName).update({
                projectCount: count + 1
            });
        } else {
            database.ref('users').child(userName).update({
                projectCount: 1
            });
        }
    });
}

// Modified version of runCode to track executions
const originalRunCode = runCode;
window.runCode = async function() {
    // Call original function
    await originalRunCode();
    
    // Track this execution
    trackCodeExecution();
};

// Modified version of confirmSaveFile to track saves
const originalConfirmSaveFile = confirmSaveFile;
window.confirmSaveFile = async function() {
    // Call original function
    await originalConfirmSaveFile();
    
    // Track this save if successful
    if (selectedFileName) {
        trackFileSave(selectedFileName);
    }
};

// Modified version of handleLanguageChange to track language changes
const originalHandleLanguageChange = handleLanguageChange;
window.handleLanguageChange = function(event) {
    const previousLanguage = currentLanguage;
    
    // Call original function
    originalHandleLanguageChange(event);
    
    // Track language change if it actually changed
    if (previousLanguage !== currentLanguage && typeof firebase !== 'undefined') {
        incrementLanguageUsage(currentLanguage);
    }
};

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
        const outputHeader = document.querySelector('.output-section .editor-controls');
        
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
        
        // Add buttons to header before run button
        const runButton = document.getElementById('run-button');
        outputHeader.insertBefore(headerButtons, runButton);
        
        // Hide run button text
        if (runButton && runButton.querySelector('span')) {
            runButton.querySelector('span').style.display = 'none';
        }
        
        // Hide language select label on small screens
        document.getElementById('language-select').style.width = '60px';
        
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
        
        // Reset language select width
        document.getElementById('language-select').style.width = '';
        
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

// Initialize GitHub dialog functionality
function initializeGitHubDialogs() {
    // Save dialog event listeners
    document.getElementById('confirm-save').addEventListener('click', confirmSaveFile);
    document.getElementById('cancel-save').addEventListener('click', closeAllDialogs);
    
    // Load dialog event listeners
    document.getElementById('confirm-load').addEventListener('click', confirmLoadFile);
    document.getElementById('cancel-load').addEventListener('click', closeAllDialogs);
    
    // Close buttons
    document.querySelectorAll('.github-dialog-close').forEach(button => {
        button.addEventListener('click', closeAllDialogs);
    });
    
    // Overlay click to close
    document.getElementById('overlay').addEventListener('click', closeAllDialogs);
    
    // File name input format based on language
    const fileNameInput = document.getElementById('file-name-input');
    if (fileNameInput) {
        fileNameInput.addEventListener('input', function() {
            updateFileExtension(this.value);
        });
    }
}

// Function to update file extension warning
function updateFileExtension(fileName) {
    const extensionNotice = document.getElementById('file-extension-notice');
    const extension = FILE_EXTENSIONS[currentLanguage];
    
    if (!fileName.endsWith('.' + extension)) {
        extensionNotice.textContent = `File will be saved with .${extension} extension in your language-playground folder.`;
    } else {
        extensionNotice.textContent = 'File will be saved in your language-playground folder.';
    }
}

// Handle language change
function handleLanguageChange(event) {
    const newLanguage = event.target.value;
    
    // If language actually changed
    if (newLanguage !== currentLanguage) {
        currentLanguage = newLanguage;
        
        // Update language icon
        const languageIcon = document.getElementById('language-icon');
        const editorTitle = document.getElementById('editor-title');
        
        if (newLanguage === 'python') {
            languageIcon.innerHTML = '<i class="fab fa-python"></i>';
            editorTitle.textContent = 'Python';
            codeEditor.setOption('mode', 'python');
            setPythonDefaultCode();
        } else if (newLanguage === 'c') {
            languageIcon.innerHTML = '<i class="fas fa-copyright"></i>';
            editorTitle.textContent = 'C';
            codeEditor.setOption('mode', 'text/x-csrc');
            setCDefaultCode();
        }
        
        // Reset selected file name when changing languages
        selectedFileName = null;
    }
}

// Set default Python code
function setPythonDefaultCode() {
    const defaultCode = `# Python Calculation Example
def calculate_fibonacci(n):
    """Calculate the first n Fibonacci numbers"""
    fibonacci = [0, 1]
    for i in range(2, n):
        fibonacci.append(fibonacci[i-1] + fibonacci[i-2])
    return fibonacci

def calculate_factorial(n):
    """Calculate the factorial of n"""
    if n == 0 or n == 1:
        return 1
    else:
        return n * calculate_factorial(n-1)

def main():
    # Calculate and display Fibonacci sequence
    fib_count = 10
    fibonacci_sequence = calculate_fibonacci(fib_count)
    print(f"First {fib_count} Fibonacci numbers: {fibonacci_sequence}")
    
    # Calculate and display factorial
    num = 5
    factorial_result = calculate_factorial(num)
    print(f"Factorial of {num} is: {factorial_result}")
    
    # Calculate and display square and cube of numbers 1 to 5
    print("\\nNumber\\tSquare\\tCube")
    print("------------------------")
    for i in range(1, 6):
        print(f"{i}\\t{i**2}\\t{i**3}")

if __name__ == "__main__":
    main()`;
    
    codeEditor.setValue(defaultCode);
}

// Set default C code
function setCDefaultCode() {
    const defaultCode = `// C Calculation Example
#include <stdio.h>

// Function to calculate factorial
int factorial(int n) {
    if (n == 0 || n == 1)
        return 1;
    else
        return n * factorial(n - 1);
}

// Function to display Fibonacci sequence
void fibonacci(int n) {
    int a = 0, b = 1, next;
    
    printf("First %d Fibonacci numbers: ", n);
    printf("%d, %d", a, b);
    
    for (int i = 2; i < n; i++) {
        next = a + b;
        printf(", %d", next);
        a = b;
        b = next;
    }
    printf("\\n");
}

int main() {
    // Calculate and display Fibonacci sequence
    fibonacci(10);
    
    // Calculate and display factorial
    int num = 5;
    printf("Factorial of %d is: %d\\n", num, factorial(num));
    
    // Calculate and display square and cube of numbers 1 to 5
    printf("\\nNumber\\tSquare\\tCube\\n");
    printf("------------------------\\n");
    for (int i = 1; i <= 5; i++) {
        printf("%d\\t%d\\t%d\\n", i, i*i, i*i*i);
    }
    
    return 0;
}`;
    
    codeEditor.setValue(defaultCode);
}

// Function to extract input values from code as default stdin
function getStdinFromCode(code) {
    // For both Python and C, we'll look for input() or scanf patterns
    // and provide some default values
    
    let defaultInputs = [];
    
    if (currentLanguage === 'python') {
        // Look for input() functions
        const inputPattern = /input\([^)]*\)/g;
        const matches = code.match(inputPattern);
        
        if (matches) {
            // Provide a default value for each input
            defaultInputs = Array(matches.length).fill('Test User');
        }
    } else if (currentLanguage === 'c') {
        // Look for scanf functions
        const scanfPattern = /scanf\([^)]*\)/g;
        const matches = code.match(scanfPattern);
        
        if (matches) {
            // Provide a default value for each scanf
            defaultInputs = Array(matches.length).fill('Test User');
        }
    }
    
    return defaultInputs.join('\n');
}

// Main function to run code
async function runCode() {
    // Get the code from the editor
    const code = codeEditor.getValue();
    
    // Clear previous output
    const terminalContent = document.getElementById('terminal-content');
    terminalContent.innerHTML = '<div class="terminal-line">Running...</div>';
    
    // Setup for user input handling
    userInputQueue = [];
    userInputValues = [];
    isWaitingForInput = false;
    
    // Extract any stdin from code for auto-inputs
    const stdin = getStdinFromCode(code);
    
    try {
        // Add loading animation
        terminalContent.classList.add('loading');
        
        // Run the code with inputs
        await executeCodeWithInputs(code, stdin, terminalContent);
    } catch (error) {
        // Display error in terminal
        terminalContent.innerHTML = `<div class="terminal-line error">${error.message}</div>`;
    } finally {
        // Remove loading animation
        terminalContent.classList.remove('loading');
    }
}

// Handle user input collection
function collectUserInput(terminalContent) {
    return new Promise((resolve) => {
        // Process inputs one by one
        function processNextInput() {
            if (userInputQueue.length === 0) {
                isWaitingForInput = false;
                currentInputCallback = null;
                resolve(userInputValues.join('\n'));
                return;
            }
            
            isWaitingForInput = true;
            
            // Display prompt
            const inputPrompt = userInputQueue.shift();
            const promptElement = document.createElement('div');
            promptElement.className = 'terminal-line input-prompt';
            promptElement.textContent = inputPrompt;
            terminalContent.appendChild(promptElement);
            
            // Create input element
            const inputContainer = document.createElement('div');
            inputContainer.className = 'input-container';
            
            const promptSymbol = document.createElement('span');
            promptSymbol.className = 'input-symbol';
            promptSymbol.textContent = '> ';
            inputContainer.appendChild(promptSymbol);
            
            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.className = 'user-input';
            inputContainer.appendChild(inputElement);
            
            terminalContent.appendChild(inputContainer);
            
            // Focus the input
            inputElement.focus();
            
            // Handle input submission
            currentInputCallback = (value) => {
                userInputValues.push(value);
                
                // Show the entered value
                const valueElement = document.createElement('div');
                valueElement.className = 'terminal-line user-value';
                valueElement.textContent = value;
                terminalContent.appendChild(valueElement);
                
                // Remove the input field
                inputContainer.remove();
                
                // Process next input
                processNextInput();
            };
            
            // Set up enter key handler
            inputElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentInputCallback) {
                        currentInputCallback(inputElement.value);
                    }
                }
            });
        }
        
        // Start processing
        processNextInput();
    });
}

// Execute code with inputs
async function executeCodeWithInputs(code, stdin, terminalContent) {
    try {
        // Clear previous results
        terminalContent.innerHTML = '<div class="terminal-line">Compiling and executing code...</div>';
        
        // Create a submission
        const submission = await createSubmission(code, stdin);
        
        if (!submission || !submission.token) {
            throw new Error("Failed to create submission. API may be unavailable.");
        }
        
        // Check submission status
        let result = await getSubmissionResult(submission.token);
        
        // Wait for compilation and execution
        let attempts = 0;
        while (result.status && result.status.id <= 2 && attempts < 10) { // In progress or queued (with timeout)
            // Show waiting message
            terminalContent.innerHTML = `<div class="terminal-line">Waiting for execution (${attempts + 1}/10)...</div>`;
            await new Promise(resolve => setTimeout(resolve, 1000));
            result = await getSubmissionResult(submission.token);
            attempts++;
        }
        
        // Display the results
        displayResults(result, terminalContent);
        
        // For debugging
        console.log("Execution result:", result);
        
        // Handle input collection if the program requires it
        if (userInputQueue.length > 0) {
            collectUserInput(terminalContent).then(async (inputs) => {
                if (inputs) {
                    // Re-run with collected inputs
                    await executeCodeWithInputs(code, inputs, terminalContent);
                }
            });
        }
    } catch (error) {
        console.error("Execution error:", error);
        terminalContent.innerHTML = `<div class="terminal-line error">Execution error: ${error.message}</div>`;
    }
}

// Create a code submission
async function createSubmission(code, stdin) {
    const languageId = LANGUAGE_IDS[currentLanguage];
    
    if (!languageId) {
        throw new Error(`Language ID not found for ${currentLanguage}`);
    }
    
    try {
        console.log(`Creating submission for language ID: ${languageId}`);
        console.log(`Code length: ${code.length} characters`);
        console.log(`Stdin: ${stdin || "None provided"}`);
        
        const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': JUDGE0_API_KEY,
                'X-RapidAPI-Host': JUDGE0_API_HOST
            },
            body: JSON.stringify({
                source_code: code,
                language_id: languageId,
                stdin: stdin || ""
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API error response:", errorText);
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("Submission created:", result);
        return result;
    } catch (error) {
        console.error('Submission error:', error);
        throw new Error(`Error submitting code: ${error.message}`);
    }
}

// Get submission result
async function getSubmissionResult(token) {
    try {
        console.log(`Getting result for token: ${token}`);
        const response = await fetch(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`, {
            headers: {
                'X-RapidAPI-Key': JUDGE0_API_KEY,
                'X-RapidAPI-Host': JUDGE0_API_HOST
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API error response:", errorText);
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("Result status:", result.status);
        return result;
    } catch (error) {
        console.error('Result error:', error);
        throw new Error(`Error getting results: ${error.message}`);
    }
}

// Display execution results
function displayResults(result, terminalContent) {
    terminalContent.innerHTML = '';
    
    if (!result) {
        const errorElement = document.createElement('div');
        errorElement.className = 'terminal-line error';
        errorElement.textContent = 'No result received from execution service.';
        terminalContent.appendChild(errorElement);
        return;
    }
    
    // Check for error in the response status
    if (result.status && result.status.id >= 6) { // Error states in Judge0
        const errorElement = document.createElement('div');
        errorElement.className = 'terminal-line error';
        errorElement.textContent = `Execution error: ${result.status.description}`;
        terminalContent.appendChild(errorElement);
    }
    
    // Check for compilation error
    if (result.compile_output) {
        const errorElement = document.createElement('div');
        errorElement.className = 'terminal-line error';
        errorElement.textContent = result.compile_output;
        terminalContent.appendChild(errorElement);
    }
    
    // Check for runtime error
    if (result.stderr) {
        const errorElement = document.createElement('div');
        errorElement.className = 'terminal-line error';
        errorElement.textContent = result.stderr;
        terminalContent.appendChild(errorElement);
    }
    
    // Show stdout
    if (result.stdout) {
        const outputLines = result.stdout.split('\n');
        for (const line of outputLines) {
            if (line.trim() || outputLines.length === 1) {
                const outputElement = document.createElement('div');
                outputElement.className = 'terminal-line';
                
                // Handle input prompts (simple detection)
                if (line.includes('?') || line.toLowerCase().includes('enter') || line.toLowerCase().includes('input')) {
                    outputElement.className += ' input-prompt';
                    
                    // Add to input queue for interactive input
                    userInputQueue.push(line);
                }
                
                outputElement.textContent = line;
                terminalContent.appendChild(outputElement);
            }
        }
    }
    
    // If no output at all, but execution was successful
    if (!result.stdout && !result.stderr && !result.compile_output && 
        result.status && result.status.id === 3) { // Success status
        const noOutputElement = document.createElement('div');
        noOutputElement.className = 'terminal-line';
        noOutputElement.textContent = 'Program executed successfully with no output.';
        terminalContent.appendChild(noOutputElement);
    }
}

// Save code to GitHub
function saveCode() {
    // Check if authenticated with GitHub
    if (!window.githubUtils.isGithubAuthenticated()) {
        showNotification('Please log in with GitHub first');
        return;
    }
    
    // Set default filename based on language
    const extension = FILE_EXTENSIONS[currentLanguage];
    let defaultFilename = selectedFileName || `code.${extension}`;
    
    // Set the input value
    const fileNameInput = document.getElementById('file-name-input');
    fileNameInput.value = defaultFilename;
    updateFileExtension(defaultFilename);
    
    // Show save dialog
    document.getElementById('save-dialog').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
    
    // Focus the input
    fileNameInput.focus();
    fileNameInput.select();
}

// Confirm saving file to GitHub
async function confirmSaveFile() {
    try {
        let fileName = document.getElementById('file-name-input').value.trim();
        
        if (!fileName) {
            showNotification('Please enter a file name');
            return;
        }
        
        // Ensure file has correct extension
        const extension = FILE_EXTENSIONS[currentLanguage];
        if (!fileName.endsWith('.' + extension)) {
            fileName += '.' + extension;
            console.log(`Added extension .${extension} to filename: ${fileName}`);
        }
        
        // Get code from editor
        const code = codeEditor.getValue();
        
        // Show feedback to user
        showNotification(`Saving ${fileName}...`);
        
        console.log(`Saving file to GitHub: ${GITHUB_LANGUAGE_FOLDER}/${fileName}`);
        
        // Save file to GitHub
        const result = await window.githubUtils.saveFileToGithub(
            GITHUB_LANGUAGE_FOLDER, 
            fileName,
            code
        );
        
        if (result) {
            console.log('File saved successfully:', result);
            showNotification(`Saved ${fileName} successfully!`);
            selectedFileName = fileName;
            closeAllDialogs();
        }
    } catch (error) {
        console.error('Error saving file:', error);
        showNotification('Error saving file: ' + error.message);
    }
}

// Load code from GitHub
async function loadCode() {
    // Check if authenticated with GitHub
    if (!window.githubUtils.isGithubAuthenticated()) {
        showNotification('Please log in with GitHub first');
        return;
    }
    
    try {
        // Show loading message
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '<div class="loading-notice">Loading files from GitHub...</div>';
        
        // Show dialog early to show loading state
        document.getElementById('load-dialog').style.display = 'flex';
        document.getElementById('overlay').style.display = 'block';
        
        // Get files from GitHub
        console.log(`Looking for files in ${GITHUB_LANGUAGE_FOLDER} folder with extension .${FILE_EXTENSIONS[currentLanguage]}`);
        const files = await window.githubUtils.listFilesInFolder(GITHUB_LANGUAGE_FOLDER);
        console.log("Files returned from GitHub:", files);
        
        // Filter files based on current language
        const extension = FILE_EXTENSIONS[currentLanguage];
        const languageFiles = files.filter(file => 
            file.type === 'file' && file.name.endsWith('.' + extension)
        );
        console.log(`Found ${languageFiles.length} ${currentLanguage} files`);
        
        // Populate file list
        fileList.innerHTML = '';
        
        if (languageFiles.length === 0) {
            fileList.innerHTML = `<div class="no-files-notice">No ${currentLanguage} files found in your GitHub repository.</div>`;
            console.log(`No ${currentLanguage} files found in the ${GITHUB_LANGUAGE_FOLDER} folder`);
        } else {
            languageFiles.forEach(file => {
                const li = document.createElement('li');
                li.dataset.path = file.path;
                li.dataset.name = file.name;
                
                const icon = document.createElement('i');
                icon.className = currentLanguage === 'python' ? 'fab fa-python' : 'fas fa-copyright';
                li.appendChild(icon);
                
                const span = document.createElement('span');
                span.textContent = file.name;
                li.appendChild(span);
                
                // Add click handler to select file
                li.addEventListener('click', function() {
                    // Remove selected class from all items
                    document.querySelectorAll('#file-list li').forEach(item => {
                        item.classList.remove('selected');
                    });
                    // Add selected class to clicked item
                    this.classList.add('selected');
                });
                
                fileList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error loading files:', error);
        showNotification('Error loading files: ' + error.message);
        
        // Show error in file list
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = `<div class="error-notice">Error loading files: ${error.message}</div>`;
    }
}

// Confirm loading file from GitHub
async function confirmLoadFile() {
    try {
        // Get selected file
        const selectedFile = document.querySelector('#file-list li.selected');
        
        if (!selectedFile) {
            showNotification('Please select a file to load');
            return;
        }
        
        const fileName = selectedFile.dataset.name;
        showNotification(`Loading ${fileName}...`);
        
        console.log(`Loading file from GitHub: ${GITHUB_LANGUAGE_FOLDER}/${fileName}`);
        
        // Load file from GitHub
        const content = await window.githubUtils.getFileFromGithub(
            GITHUB_LANGUAGE_FOLDER,
            fileName
        );
        
        if (content) {
            console.log(`File loaded successfully, content length: ${content.length} characters`);
            // Update editor with file content
            codeEditor.setValue(content);
            selectedFileName = fileName;
            showNotification(`Loaded ${fileName} successfully!`);
            closeAllDialogs();
            
            // Make sure the correct language is set based on file extension
            if (fileName.endsWith('.py') && currentLanguage !== 'python') {
                document.getElementById('language-select').value = 'python';
                handleLanguageChange({target: {value: 'python'}});
            } else if (fileName.endsWith('.c') && currentLanguage !== 'c') {
                document.getElementById('language-select').value = 'c';
                handleLanguageChange({target: {value: 'c'}});
            }
        }
    } catch (error) {
        console.error('Error loading file:', error);
        showNotification('Error loading file: ' + error.message);
    }
}

// Close all dialogs
function closeAllDialogs() {
    // Hide all dialogs
    document.querySelectorAll('.github-dialog').forEach(dialog => {
        dialog.style.display = 'none';
    });
    
    // Hide overlay
    document.getElementById('overlay').style.display = 'none';
    
    // Clear file list and selection
    const fileList = document.getElementById('file-list');
    if (fileList) {
        fileList.innerHTML = '';
    }
    
    // Reset input fields
    const fileNameInput = document.getElementById('file-name-input');
    if (fileNameInput) {
        fileNameInput.value = '';
    }
}

// Show example code
function showExamples() {
    if (currentLanguage === 'python') {
        setPythonDefaultCode();
    } else if (currentLanguage === 'c') {
        setCDefaultCode();
    }
    
    // Reset selected file name when loading examples
    selectedFileName = null;
    
    showNotification('Loaded example code');
}

// Navigate back to home
function goToHome() {
    // Show transition overlay
    const overlay = document.createElement('div');
    overlay.className = 'transition-overlay fade-out';
    document.body.appendChild(overlay);
    
    // Animate content out
    const mainContainer = document.querySelector('.main-container');
    mainContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    mainContainer.style.opacity = '0';
    mainContainer.style.transform = 'scale(0.95)';
    
    // Navigate after animation completes
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Notification display
function showNotification(message) {
    const notification = document.getElementById('notification-popup');
    notification.textContent = message;
    notification.classList.add('show');
    
    // Remove notification after a delay
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize user account display in header
function initializeUserAccount() {
    // Check if authenticated with GitHub
    if (window.githubUtils && window.githubUtils.isGithubAuthenticated()) {
        // Get user info from localStorage
        const username = localStorage.getItem('github_user_name') || "GitHub User";
        const avatarUrl = localStorage.getItem('github_user_avatar') || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
        
        // Update UI
        const userAccount = document.getElementById('user-account');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        userAvatar.src = avatarUrl;
        userName.textContent = username;
        userAccount.style.display = 'flex';
        
        // Setup logout button
        document.getElementById('logout-button').addEventListener('click', logoutGitHub);
    }
}

// Logout from GitHub
function logoutGitHub() {
    // Clear GitHub related data from localStorage
    localStorage.removeItem('github_access_token');
    localStorage.removeItem('github_user_name');
    localStorage.removeItem('github_user_avatar');
    localStorage.removeItem('github_user_login');
    
    // Show notification
    showNotification('Logged out successfully');
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
} 