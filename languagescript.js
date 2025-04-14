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

// Global variables for live collaboration
let isLiveSession = false;
let sessionId = null;
let firebaseRef = null;
let isSessionHost = false;
let lastUpdatedBy = null;
let isProcessingRemoteChange = false;
let sessionParticipants = {};

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
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const liveSessionId = urlParams.get('live');
    const sharedCode = urlParams.get('code');
    const shortCode = urlParams.get('s');
    
    if (liveSessionId) {
        // Join existing live session
        joinLiveSession(liveSessionId);
    } else if (shortCode) {
        // If we have a short code, try to resolve it
        if (typeof firebase !== 'undefined') {
            const db = firebase.database();
            db.ref(`shortUrls/${shortCode}`).once('value')
                .then(snapshot => {
                    const data = snapshot.val();
                    if (data && data.original) {
                        // Extract the code parameter from the original URL
                        const originalUrl = new URL(data.original);
                        const originalParams = new URLSearchParams(originalUrl.search);
                        const originalCode = originalParams.get('code');
                        
                        if (originalCode) {
                            try {
                                const codeData = JSON.parse(decodeURIComponent(originalCode));
                                if (codeData.code) {
                                    codeEditor.setValue(codeData.code);
                                    
                                    // Switch language if needed
                                    if (codeData.language && codeData.language !== currentLanguage) {
                                        document.getElementById('language-select').value = codeData.language;
                                        handleLanguageChange({ target: { value: codeData.language } });
                                    }
                                }
                            } catch (error) {
                                console.error("Error parsing shortened code:", error);
                                showNotification('Invalid shared code in shortened URL.');
                            }
                        }
                    } else {
                        showNotification('Shortened URL not found or expired.');
                    }
                })
                .catch(error => {
                    console.error("Error resolving short URL:", error);
                    showNotification('Error loading shared code.');
                });
        }
    } else if (sharedCode) {
        try {
            const codeData = JSON.parse(decodeURIComponent(sharedCode));
            if (codeData.code) {
                codeEditor.setValue(codeData.code);
                
                // Switch language if needed
                if (codeData.language && codeData.language !== currentLanguage) {
                    document.getElementById('language-select').value = codeData.language;
                    handleLanguageChange({ target: { value: codeData.language } });
                }
            } else {
                // Legacy format - plain code string
                codeEditor.setValue(decodeURIComponent(sharedCode));
            }
        } catch (error) {
            // Try legacy format where code wasn't JSON
            try {
                codeEditor.setValue(decodeURIComponent(sharedCode));
            } catch (e) {
                showNotification('Invalid shared code.');
            }
        }
    }
    
    // Check if the user has seen the language compiler tour
    if (!localStorage.getItem('language_tour_shown')) {
        // Show tour popup after a short delay to ensure UI is fully loaded
        setTimeout(() => {
            showLanguageTourPopup();
        }, 1500);
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
    
    // Home button
    document.getElementById('home-button').addEventListener('click', goToHome);
    
    // Window resize and orientation change events for responsive design
    window.addEventListener('resize', adjustForScreenSize);
    window.addEventListener('orientationchange', function() {
        setTimeout(adjustForScreenSize, 100);
    });
    
    // Share button and dropdown options
    const shareButton = document.getElementById('share-button');
    const shareDropdown = document.getElementById('share-dropdown');
    
    shareButton.addEventListener('click', function() {
        shareDropdown.style.display = shareDropdown.style.display === 'none' ? 'flex' : 'none';
    });
    
    document.getElementById('share-copy').addEventListener('click', function() {
        shareDropdown.style.display = 'none';
        const code = codeEditor.getValue();
        const codeParam = encodeURIComponent(JSON.stringify({
            code: code,
            language: currentLanguage
        }));
        const shareUrl = `${window.location.origin}${window.location.pathname}?code=${codeParam}`;
        
        // Shorten the URL
        shortenUrl(shareUrl).then(shortUrl => {
            navigator.clipboard.writeText(shortUrl || shareUrl);
            showNotification('Link copied to clipboard!');
        }).catch(error => {
            console.error("Error shortening URL:", error);
            navigator.clipboard.writeText(shareUrl);
            showNotification('Link copied to clipboard!');
        });
    });
    
    document.getElementById('share-live').addEventListener('click', function() {
        shareDropdown.style.display = 'none';
        startLiveSession();
    });
    
    // Close share dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!shareButton.contains(event.target) && !shareDropdown.contains(event.target)) {
            shareDropdown.style.display = 'none';
        }
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
    const defaultCode = `# Welcome to Language Playground
print("Welcome to Language Playground!")
print("Start coding in Python here...")`;
    
    codeEditor.setValue(defaultCode);
}

// Set default C code
function setCDefaultCode() {
    const defaultCode = `// Welcome to Language Playground
#include <stdio.h>

int main() {
    printf("Welcome to Language Playground!\\n");
    printf("Start coding in C here...\\n");
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

// Function to update the participants UI
function updateParticipantsUI() {
    if (!isLiveSession) return;
    
    const participantCount = document.getElementById('participant-count');
    const participantsList = document.getElementById('participants-list');
    
    // Update the count
    const count = Object.keys(sessionParticipants).length;
    participantCount.textContent = count;
    
    // Clear the participants list
    participantsList.innerHTML = '';
    
    // Add each participant to the list
    Object.entries(sessionParticipants).forEach(([userId, userData]) => {
        // Skip participants who have left
        if (userData.status === 'left') return;
        
        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';
        
        const avatar = document.createElement('img');
        avatar.className = 'participant-avatar';
        avatar.src = userData.avatar || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
        avatar.alt = userData.name || 'Anonymous';
        
        const name = document.createElement('div');
        name.className = 'participant-name';
        name.textContent = userData.name || 'Anonymous';
        
        const role = document.createElement('div');
        role.className = `participant-role ${userData.role}`;
        role.textContent = userData.role === 'host' ? 'Host' : 'Guest';
        
        participantItem.appendChild(avatar);
        participantItem.appendChild(name);
        participantItem.appendChild(role);
        
        participantsList.appendChild(participantItem);
    });
}

// Function to start a live session
function startLiveSession() {
    // Debug Firebase initialization
    console.log("Starting live session...");
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not defined! Check if Firebase scripts are loaded properly.");
        showNotification("Error: Firebase not loaded. Check console for details.");
        return;
    }
    console.log("Firebase is loaded correctly!");
    
    try {
        // Generate unique session ID
        sessionId = generateSessionId();
        console.log("Generated session ID:", sessionId);
        
        // Create Firebase reference for the collaborative session
        console.log("Creating Firebase reference to:", `languageSessions/${sessionId}`);
        firebaseRef = firebase.database().ref(`languageSessions/${sessionId}`);
        
        // Get user info for the session
        const userName = localStorage.getItem('github_user_name') || 'Anonymous';
        const userAvatar = localStorage.getItem('github_user_avatar') || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
        
        // Mark as session host
        isSessionHost = true;
        
        // Initialize the session data
        firebaseRef.set({
            code: codeEditor.getValue(),
            language: currentLanguage,
            lastUpdate: Date.now(),
            updatedBy: 'host',
            active: true, // Add active status flag
            host: userName // Store host info
        });
        
        // Create the database variable if it doesn't exist
        const database = firebase.database();
        
        // Initialize the host as the first participant
        sessionParticipants = {
            [userName]: {
                name: userName,
                avatar: userAvatar,
                role: 'host',
                joinedAt: Date.now(),
                status: 'active'
            }
        };
        
        // Also create a record in the liveSessions collection for admin panel
        const liveSessionData = {
            id: sessionId,
            creatorName: userName,
            creatorAvatar: userAvatar,
            type: 'Language Playground',
            language: currentLanguage,
            startTime: Date.now(),
            status: 'active',
            participants: sessionParticipants
        };
        
        // Save to liveSessions for admin panel
        database.ref(`liveSessions/${sessionId}`).set(liveSessionData)
            .then(() => console.log("Live session recorded for admin panel"))
            .catch(err => console.error("Error recording live session for admin:", err));
        
        // Log this activity
        logActivity(userName, userAvatar, 'Started live session', 'Language Playground', 'active');
        
        // Set up listeners for remote changes
        setupLiveListeners();
        
        // Update participants UI
        updateParticipantsUI();
        
        // Generate and copy share link
        const shareUrl = `${window.location.origin}${window.location.pathname}?live=${sessionId}`;
        navigator.clipboard.writeText(shareUrl);
        
        // Update UI - now we use the share button's appearance to indicate live status
        const shareButton = document.getElementById('share-button');
        shareButton.classList.add('active');
        shareButton.style.backgroundColor = '#ff5722';
        
        // Show the live indicator
        const liveIndicator = document.getElementById('live-indicator');
        liveIndicator.style.display = 'flex';
        liveIndicator.classList.add('active');
        liveIndicator.classList.add('host');
        liveIndicator.classList.remove('guest');
        liveIndicator.querySelector('span').textContent = 'Hosting Live Session';
        isLiveSession = true;
        
        // Update the share dropdown to add the End Live Session option
        updateShareDropdown();
        
        // Setup session status monitoring
        setupSessionMonitoring();
        
        showNotification('Live session started! Link copied to clipboard 🎉');
    } catch (error) {
        console.error("Error starting live session:", error);
        showNotification("Error starting live session! Check console for details.");
    }
}

// Function to join an existing live session
function joinLiveSession(liveSessionId) {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('github_access_token') !== null;
    // Get URL parameters to check if this is an admin view
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';
    
    if (!isLoggedIn && !isAdmin) {
        // Redirect to login page
        showNotification('Please log in to join this live session');
        
        // Store the session URL to redirect back after login
        localStorage.setItem('redirect_after_login', window.location.href);
        
        // Redirect to home page after short delay
        setTimeout(() => {
            window.location.href = 'index.html?login=required';
        }, 2000);
        return;
    }
    
    // Join existing live session
    sessionId = liveSessionId;
    lastUpdatedBy = 'guest';
    
    // Make sure Firebase is available
    if (typeof firebase === 'undefined' || !firebase.database) {
        console.error("Firebase is not available when joining session");
        showNotification("Error: Firebase not loaded. Cannot join live session.");
        return;
    }
    
    // Create database reference for collaboration
    firebaseRef = firebase.database().ref(`languageSessions/${sessionId}`);
    
    // First check if the session is still active
    firebaseRef.once('value', (snapshot) => {
        const sessionData = snapshot.val();
        
        if (!sessionData || sessionData.active === false) {
            // Session doesn't exist or is not active
            showNotification('This live session has ended or does not exist');
            sessionId = null;
            firebaseRef = null;
            return;
        }
        
        // Get user info for participant tracking
        const userName = localStorage.getItem('github_user_name') || 'Anonymous Guest';
        const userAvatar = localStorage.getItem('github_user_avatar') || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
        
        // Switch language if needed
        if (sessionData.language && sessionData.language !== currentLanguage) {
            document.getElementById('language-select').value = sessionData.language;
            handleLanguageChange({ target: { value: sessionData.language } });
        }
        
        // Mark as guest (not host)
        isSessionHost = false;
        
        // Set up listeners
        setupLiveListeners();
        setupSessionMonitoring();
        
        // Create database reference for liveSessions
        const database = firebase.database();
        
        // Update participants list in liveSessions for admin panel
        const participantData = {
            name: userName,
            avatar: userAvatar,
            role: 'guest',
            joinedAt: Date.now(),
            status: 'active'
        };
        
        // Add this participant to the participants list
        database.ref(`liveSessions/${sessionId}/participants/${userName}`).update(participantData)
            .then(() => {
                console.log("Added to participants list in admin panel");
                // Log the join session activity
                logActivity(userName, userAvatar, 'Joined live session', 'Language Playground', 'active');
            })
            .catch(err => {
                console.error("Error updating participants list:", err);
            });
        
        // Update UI
        const shareButton = document.getElementById('share-button');
        shareButton.classList.add('active');
        shareButton.style.backgroundColor = '#ff5722';
        
        const liveIndicator = document.getElementById('live-indicator');
        liveIndicator.style.display = 'flex';
        liveIndicator.classList.add('active');
        liveIndicator.classList.add('guest');
        liveIndicator.classList.remove('host');
        liveIndicator.querySelector('span').textContent = 'Live Session (Guest)';
        isLiveSession = true;
        
        // Update share dropdown
        updateShareDropdown();
        
        showNotification('Joined live coding session!');
        
        // Clean URL parameter without refreshing
        const url = new URL(window.location.href);
        url.searchParams.delete('live');
        window.history.replaceState({}, document.title, url.pathname);
    });
}

// Function to end a live session
function endLiveSession() {
    if (!firebaseRef) return;
    
    // Only host can end the session by updating the active flag
    if (isSessionHost) {
        firebaseRef.update({
            active: false,
            endedAt: Date.now()
        }).then(() => {
            console.log("Session marked as inactive");
            
            // Update the liveSessions record for admin panel
            const userName = localStorage.getItem('github_user_name') || 'Anonymous';
            const userAvatar = localStorage.getItem('github_user_avatar') || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
            const database = firebase.database();
            
            // Update the session status in liveSessions
            database.ref(`liveSessions/${sessionId}`).update({
                status: 'completed',
                endTime: Date.now()
            }).then(() => {
                console.log("Live session status updated in admin panel");
                // Log the end session activity
                logActivity(userName, userAvatar, 'Ended live session', 'Language Playground', 'completed');
            }).catch(err => {
                console.error("Error updating live session status:", err);
            });
            
            // Delay before fully disconnecting to allow clients to receive the inactive status
            setTimeout(() => {
                disconnectFromSession();
            }, 1000);
        }).catch(error => {
            console.error("Error ending session:", error);
            disconnectFromSession();
        });
    } else {
        // For guests, just leave the session
        disconnectFromSession();
    }
}

// Function to disconnect from a session
function disconnectFromSession() {
    // Get user info
    const userName = localStorage.getItem('github_user_name') || 'Anonymous';
    const userAvatar = localStorage.getItem('github_user_avatar') || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
    
    // If we're in a session, update the participants list in the admin panel
    if (firebase && sessionId) {
        // Create database reference
        const database = firebase.database();
        
        // Mark the participant as left in liveSessions
        database.ref(`liveSessions/${sessionId}/participants/${userName}`).update({
            leftAt: Date.now(),
            status: 'left'
        }).then(() => {
            console.log("Updated participant status to left");
            // Log the activity
            logActivity(userName, userAvatar, 'Left live session', 'Language Playground', 'completed');
            
            // Update local participant data
            if (sessionParticipants[userName]) {
                sessionParticipants[userName].status = 'left';
                sessionParticipants[userName].leftAt = Date.now();
                updateParticipantsUI();
            }
        }).catch(err => {
            console.error("Error updating participant status:", err);
        });
    }
    
    // Remove all listeners
    if (firebaseRef) {
        firebaseRef.off();
    }
    
    // Remove Firebase participants listener
    if (sessionId) {
        firebase.database().ref(`liveSessions/${sessionId}/participants`).off();
    }
    
    // Update UI
    const shareButton = document.getElementById('share-button');
    shareButton.classList.remove('active');
    shareButton.style.backgroundColor = '';
    
    const liveIndicator = document.getElementById('live-indicator');
    liveIndicator.style.display = 'none';
    liveIndicator.classList.remove('active');
    liveIndicator.classList.remove('host');
    liveIndicator.classList.remove('guest');
    liveIndicator.querySelector('span').textContent = 'Live Session';
    
    // Reset participant display
    document.getElementById('participant-count').textContent = '0';
    document.getElementById('participants-list').innerHTML = '';
    
    isLiveSession = false;
    sessionId = null;
    firebaseRef = null;
    isSessionHost = false;
    sessionParticipants = {};
    
    // Update share dropdown to remove End Live Session option
    updateShareDropdown();
    
    showNotification('Live session ended');
}

// Set up live session monitoring
function setupSessionMonitoring() {
    if (!firebaseRef) return;
    
    // Listen for changes to the active status
    firebaseRef.child('active').on('value', (snapshot) => {
        const isActive = snapshot.val();
        
        // If session is marked as inactive and we're not the host, disconnect
        if (isActive === false && !isSessionHost) {
            showNotification('The host ended this live session');
            disconnectFromSession();
        }
    });
    
    // Listen for changes to participants
    firebase.database().ref(`liveSessions/${sessionId}/participants`).on('value', (snapshot) => {
        if (!snapshot.exists()) return;
        
        // Update the participants list
        sessionParticipants = snapshot.val() || {};
        
        // Update the UI
        updateParticipantsUI();
    });
}

// Set up listeners for remote code changes
function setupLiveListeners() {
    firebaseRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
        // Skip if this is our own update
        if (data.updatedBy === 'host' && lastUpdatedBy === 'host') return;
        if (data.updatedBy === 'guest' && lastUpdatedBy === 'guest') return;
        
        // Mark that we're processing a remote change to avoid loops
        isProcessingRemoteChange = true;
        
        // Update language if needed
        if (data.language && data.language !== currentLanguage) {
            document.getElementById('language-select').value = data.language;
            handleLanguageChange({ target: { value: data.language } });
        }
        
        // Update editor with remote data
        codeEditor.setValue(data.code);
        
        isProcessingRemoteChange = false;
    });
    
    // Set up listener for code changes to sync with Firebase
    codeEditor.on('changes', function(instance, changes) {
        if (!isLiveSession || isProcessingRemoteChange) return;
        
        // Set who made this update
        lastUpdatedBy = isSessionHost ? 'host' : 'guest';
        
        // Update Firebase with the new code content
        firebaseRef.update({
            code: codeEditor.getValue(),
            language: currentLanguage,
            lastUpdate: Date.now(),
            updatedBy: lastUpdatedBy
        });
    });
}

// Generate a random session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Update the share dropdown to include End Live Session option when applicable
function updateShareDropdown() {
    const dropdown = document.getElementById('share-dropdown');
    
    // Remove any existing end-live option
    const existingEndLive = document.getElementById('share-end-live');
    if (existingEndLive) {
        existingEndLive.remove();
    }
    
    // If live session is active and user is the host, add the End Live option
    if (isLiveSession && isSessionHost) {
        const endLiveOption = document.createElement('div');
        endLiveOption.id = 'share-end-live';
        endLiveOption.className = 'share-dropdown-option';
        endLiveOption.style.padding = '10px 15px';
        endLiveOption.style.color = 'white';
        endLiveOption.style.cursor = 'pointer';
        endLiveOption.style.display = 'flex';
        endLiveOption.style.alignItems = 'center';
        endLiveOption.style.gap = '8px';
        endLiveOption.style.backgroundColor = 'rgba(255, 87, 34, 0.5)';
        endLiveOption.innerHTML = '<i class="fas fa-times"></i> End Live Session';
        endLiveOption.addEventListener('click', () => {
            endLiveSession();
            dropdown.style.display = 'none';
        });
        
        dropdown.appendChild(endLiveOption);
    }
}

// Log user activity in Firebase
function logActivity(userName, userAvatar, action, target, status) {
    if (typeof firebase === 'undefined' || !firebase.database) {
        console.log('Firebase not available for activity logging');
        return;
    }
    
    const database = firebase.database();
    
    // Create a new activity record
    const activityData = {
        userName: userName,
        userAvatar: userAvatar,
        action: action,
        target: target,
        timestamp: Date.now(),
        status: status || 'completed'
    };
    
    // Push to the activity collection
    database.ref('activity').push(activityData)
        .then(() => console.log('Activity logged:', action))
        .catch(err => console.error('Error logging activity:', err));
}

// Function to shorten URLs without using external services
async function shortenUrl(longUrl) {
    try {
        // If Firebase is available, use it to store and retrieve shortened URLs
        if (typeof firebase !== 'undefined') {
            const db = firebase.database();
            const urlHash = await generateHash(longUrl);
            const shortCode = urlHash.substring(0, 8); // Use first 8 characters of hash as short code
            
            // Store the mapping in Firebase
            await db.ref(`shortUrls/${shortCode}`).set({
                original: longUrl,
                createdAt: Date.now()
            });
            
            return `${window.location.origin}${window.location.pathname}?s=${shortCode}`;
        } else {
            // If Firebase isn't available, return the original URL
            return longUrl;
        }
    } catch (error) {
        console.error("Error shortening URL:", error);
        return longUrl;
    }
}

// Generate a hash for the URL
async function generateHash(str) {
    try {
        // Use browser's crypto API to generate a hash
        const msgBuffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        // Fallback to simple hashing if crypto API is not available
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }
}

// Function to show the language compiler tour popup
function showLanguageTourPopup() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'tour-popup';
    
    // Add popup content
    popup.innerHTML = `
        <div class="tour-header">
            <h3>Welcome to the Language Compiler! 👋</h3>
        </div>
        <div class="tour-content">
            <p>Would you like a quick tour to learn how to use this coding environment?</p>
        </div>
        <div class="tour-buttons">
            <button id="decline-tour" class="tour-button secondary">No, Thanks</button>
            <button id="accept-tour" class="tour-button primary">Take the Tour</button>
        </div>
    `;
    
    // Append elements to the document
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    
    // Add event listeners to buttons
    document.getElementById('accept-tour').addEventListener('click', () => {
        // Remove popup and overlay
        document.body.removeChild(popup);
        document.body.removeChild(overlay);
        
        // Start the tour
        startLanguageTour();
        
        // Mark tour as shown in localStorage
        localStorage.setItem('language_tour_shown', 'true');
    });
    
    document.getElementById('decline-tour').addEventListener('click', () => {
        // Remove popup and overlay
        document.body.removeChild(popup);
        document.body.removeChild(overlay);
        
        // Mark tour as shown in localStorage
        localStorage.setItem('language_tour_shown', 'true');
    });
}

// Function to start the interactive language compiler tour
function startLanguageTour() {
    // Array of tour steps with element selectors and descriptions
    const tourSteps = [
        {
            element: '#language-select',
            title: 'Language Selector',
            description: 'Choose your programming language from this dropdown. Currently supported: Python and C.'
        },
        {
            element: '.CodeMirror',
            title: 'Code Editor',
            description: 'Write your code here. The editor provides syntax highlighting and auto-completion for the selected language.'
        },
        {
            element: '#run-button',
            title: 'Run Button',
            description: 'Click here to execute your code and see the output in the terminal below.'
        },
        {
            element: '#terminal',
            title: 'Terminal',
            description: 'View your program output here. You can also provide input to your program when prompted.'
        },
        {
            element: '#save-button',
            title: 'Save Button',
            description: 'Save your code to GitHub for future access.'
        },
        {
            element: '#load-button',
            title: 'Load Button',
            description: 'Load previously saved code from your GitHub repository.'
        },
        {
            element: '#share-button',
            title: 'Share Button',
            description: 'Share your code with others or start a live coding session.'
        },
        {
            element: '#new-button',
            title: 'New Button',
            description: 'Start a new file with the default code template for the selected language.'
        },
        {
            element: '.compiler-header',
            title: 'Header Controls',
            description: 'Access your account and additional options from here.'
        }
    ];
    
    // Initialize tour variables
    let currentStep = 0;
    
    // Create tour UI elements
    const tourHighlight = document.createElement('div');
    tourHighlight.className = 'tour-highlight';
    
    const tourTooltip = document.createElement('div');
    tourTooltip.className = 'tour-tooltip';
    
    // Add elements to the document
    document.body.appendChild(tourHighlight);
    document.body.appendChild(tourTooltip);
    
    // Function to show a specific tour step
    function showTourStep(stepIndex) {
        // Get the current step
        const step = tourSteps[stepIndex];
        
        // Get element position
        const element = document.querySelector(step.element);
        if (!element) {
            console.error(`Tour element not found: ${step.element}`);
            if (stepIndex < tourSteps.length - 1) {
                showTourStep(stepIndex + 1);
            } else {
                endTour();
            }
            return;
        }
        
        const rect = element.getBoundingClientRect();
        
        // Position highlight
        tourHighlight.style.top = `${rect.top + window.scrollY}px`;
        tourHighlight.style.left = `${rect.left + window.scrollX}px`;
        tourHighlight.style.width = `${rect.width}px`;
        tourHighlight.style.height = `${rect.height}px`;
        tourHighlight.style.display = 'block';
        
        // Position tooltip
        let tooltipTop = rect.bottom + window.scrollY + 10;
        let tooltipLeft = rect.left + window.scrollX;
        
        // Adjust tooltip if it would go off-screen
        if (tooltipTop + 150 > window.innerHeight + window.scrollY) {
            tooltipTop = rect.top + window.scrollY - 150 - 10;
        }
        
        if (tooltipLeft + 300 > window.innerWidth) {
            tooltipLeft = window.innerWidth - 300 - 10;
        }
        
        tourTooltip.style.top = `${tooltipTop}px`;
        tourTooltip.style.left = `${tooltipLeft}px`;
        
        // Update tooltip content
        tourTooltip.innerHTML = `
            <div class="tooltip-header">
                <h4>${step.title}</h4>
            </div>
            <div class="tooltip-content">
                <p>${step.description}</p>
            </div>
            <div class="tooltip-buttons">
                ${stepIndex > 0 ? '<button id="prev-step" class="tour-button secondary">Previous</button>' : ''}
                ${stepIndex < tourSteps.length - 1 ? 
                    '<button id="next-step" class="tour-button primary">Next</button>' : 
                    '<button id="end-tour" class="tour-button primary">Finish Tour</button>'}
            </div>
        `;
        
        tourTooltip.style.display = 'block';
        
        // Add event listeners to buttons
        if (stepIndex > 0) {
            document.getElementById('prev-step').addEventListener('click', () => {
                showTourStep(stepIndex - 1);
            });
        }
        
        if (stepIndex < tourSteps.length - 1) {
            document.getElementById('next-step').addEventListener('click', () => {
                showTourStep(stepIndex + 1);
            });
        } else {
            document.getElementById('end-tour').addEventListener('click', endTour);
        }
    }
    
    // Function to end the tour
    function endTour() {
        // Remove tour elements
        document.body.removeChild(tourHighlight);
        document.body.removeChild(tourTooltip);
    }
    
    // Start the tour with the first step
    showTourStep(currentStep);
} 