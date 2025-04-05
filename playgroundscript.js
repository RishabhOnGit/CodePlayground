// Debug Firebase initialization when page loads
window.addEventListener('DOMContentLoaded', () => {
  console.log("Page loaded, checking Firebase initialization status...");
  
  if (typeof firebase === 'undefined') {
    console.error("Firebase is not defined! Check if Firebase scripts are loaded properly.");
  } else {
    console.log("Firebase is loaded correctly!");
    try {
      const dbTest = firebase.database();
      console.log("Firebase database initialized successfully:", dbTest);
    } catch (error) {
      console.error("Error initializing Firebase database:", error);
    }
  }
  
  // Initialize GitHub dialog listeners
  initializeGitHubDialogs();
});

// Check if coming from landing page for smooth transition
window.addEventListener('load', () => {
  // No animation, just remove the welcome overlay if it exists
  const welcomeOverlay = document.getElementById('welcome-overlay');
  if (welcomeOverlay) {
    welcomeOverlay.style.display = 'none';
  }
  
  // Show ready notification
  showNotification('Ready to code!');
  
  // Clean URL parameter without refreshing if it exists
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('fromLanding')) {
    const url = new URL(window.location.href);
    url.searchParams.delete('fromLanding');
    window.history.replaceState({}, document.title, url.pathname);
  }
});

// GitHub configuration
const GITHUB_WEBCODE_FOLDER = 'web-code';
let currentProjectName = null;

// Initialize GitHub dialog functionality
function initializeGitHubDialogs() {
  // Save dialog event listeners
  document.getElementById('confirm-save').addEventListener('click', confirmSaveProject);
  document.getElementById('cancel-save').addEventListener('click', closeAllDialogs);
  
  // Load dialog event listeners
  document.getElementById('confirm-load').addEventListener('click', confirmLoadProject);
  document.getElementById('cancel-load').addEventListener('click', closeAllDialogs);
  
  // Close buttons
  document.querySelectorAll('.github-dialog-close').forEach(button => {
    button.addEventListener('click', closeAllDialogs);
  });
  
  // Overlay click to close
  document.getElementById('overlay').addEventListener('click', closeAllDialogs);
}

// Initialize CodeMirror with autoCloseTags and autoCloseBrackets for HTML, CSS, and JS editors
const htmlEditor = CodeMirror.fromTextArea(document.getElementById('html-editor'), {
  mode: 'xml',
  theme: 'material',
  lineNumbers: true,
  autoCloseTags: true,
  extraKeys: {
    'Ctrl-/': 'toggleComment',  // Enable comment toggling with Ctrl + /
    'Cmd-/': 'toggleComment'    // For macOS users with Cmd + /
  }
});

// Pre-fill the HTML editor with the default boilerplate
htmlEditor.setValue(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>

</body>
</html>`);

const cssEditor = CodeMirror.fromTextArea(document.getElementById('css-editor'), {
  mode: 'css',
  theme: 'material',
  lineNumbers: true,
  autoCloseBrackets: true,
  extraKeys: {
    'Ctrl-/': 'toggleComment',
    'Cmd-/': 'toggleComment'
  }
});

const jsEditor = CodeMirror.fromTextArea(document.getElementById('js-editor'), {
  mode: 'javascript',
  theme: 'material',
  lineNumbers: true,
  autoCloseBrackets: true,
  extraKeys: {
    'Ctrl-/': 'toggleComment',
    'Cmd-/': 'toggleComment'
  }
});

// Debounce updateOutput for better performance
let debounceTimer;
function debounceUpdate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateOutput, 300);
}

// Apply debouncing for each editor
htmlEditor.on('change', debounceUpdate);
cssEditor.on('change', debounceUpdate);
jsEditor.on('change', debounceUpdate);

// Function to update the output preview
function updateOutput() {
  const htmlContent = htmlEditor.getValue();
  const cssContent = `<style>${cssEditor.getValue()}</style>`;
  const jsContent = `
    <script>
      try {
        ${jsEditor.getValue()}
      } catch (error) {
        document.body.innerHTML = '<pre style="color: red;">' + error + '</pre>';
      }
    </script>`;

  const outputContent = `
    <html>
      <head>
        ${cssContent}
      </head>
      <body>
        ${htmlContent}
        ${jsContent}
      </body>
    </html>
  `;

  const outputFrame = document.getElementById('output');
  outputFrame.srcdoc = outputContent;
}

// Function to show custom notification
function showNotification(message) {
    const notification = document.getElementById('notification-popup');
    if (!notification) {
        console.error('Notification element not found!');
        return;
    }

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
    if (message.toLowerCase().includes('ready to code')) {
        notification.classList.add('ready-notification');
    }
    
    notification.classList.add('show');

    // Hide after 3 seconds
    window.notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Save code to GitHub
document.getElementById('save-button').addEventListener('click', saveProject);

function saveProject() {
  // Check if authenticated with GitHub
  if (!window.githubUtils.isGithubAuthenticated()) {
    showNotification('Please log in with GitHub first');
    return;
  }
  
  // Set default project name
  const projectNameInput = document.getElementById('project-name-input');
  projectNameInput.value = currentProjectName || 'my-web-project';
  
  // Show save dialog
  document.getElementById('save-dialog').style.display = 'flex';
  document.getElementById('overlay').style.display = 'block';
  
  // Focus the input
  projectNameInput.focus();
  projectNameInput.select();
}

// Confirm saving project to GitHub
async function confirmSaveProject() {
  try {
    let projectName = document.getElementById('project-name-input').value.trim();
    
    if (!projectName) {
      showNotification('Please enter a project name');
      return;
    }
    
    // Sanitize project name - only allow letters, numbers, hyphens
    projectName = projectName.replace(/[^a-zA-Z0-9-]/g, '-');
    
    // Get code from editors
    const htmlCode = htmlEditor.getValue();
    const cssCode = cssEditor.getValue();
    const jsCode = jsEditor.getValue();
    
    // Create folder structure for project
    const folderPath = `${GITHUB_WEBCODE_FOLDER}/${projectName}`;
    
    // Save HTML file
    await window.githubUtils.saveFileToGithub(
      folderPath,
      'index.html',
      htmlCode
    );
    
    // Save CSS file
    await window.githubUtils.saveFileToGithub(
      folderPath,
      'styles.css',
      cssCode
    );
    
    // Save JS file
    await window.githubUtils.saveFileToGithub(
      folderPath,
      'script.js',
      jsCode
    );
    
    // Update current project name
    currentProjectName = projectName;
    
    showNotification(`Saved project "${projectName}" successfully!`);
    closeAllDialogs();
  } catch (error) {
    console.error('Error saving project:', error);
    showNotification('Error saving project: ' + error.message);
  }
}

// Load code from GitHub
document.getElementById('load-button').addEventListener('click', loadProject);

async function loadProject() {
  // Check if authenticated with GitHub
  if (!window.githubUtils.isGithubAuthenticated()) {
    showNotification('Please log in with GitHub first');
    return;
  }
  
  try {
    // Get folders from GitHub
    const contents = await window.githubUtils.listFilesInFolder(GITHUB_WEBCODE_FOLDER);
    
    // Filter for folders (directories)
    const folders = contents.filter(item => item.type === 'dir');
    
    // Populate folder list
    const folderList = document.getElementById('folder-list');
    folderList.innerHTML = '';
    
    if (folders.length === 0) {
      folderList.innerHTML = `<div class="auth-notice">No web projects found in your GitHub repository.</div>`;
    } else {
      folders.forEach(folder => {
        const li = document.createElement('li');
        li.dataset.path = folder.path;
        li.dataset.name = folder.name;
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-folder';
        li.appendChild(icon);
        
        const span = document.createElement('span');
        span.textContent = folder.name;
        li.appendChild(span);
        
        // Add click handler to select folder
        li.addEventListener('click', function() {
          // Remove selected class from all items
          document.querySelectorAll('#folder-list li').forEach(item => {
            item.classList.remove('selected');
          });
          // Add selected class to clicked item
          this.classList.add('selected');
        });
        
        folderList.appendChild(li);
      });
    }
    
    // Show load dialog
    document.getElementById('load-dialog').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
  } catch (error) {
    console.error('Error loading projects:', error);
    showNotification('Error loading projects: ' + error.message);
  }
}

// Confirm loading project from GitHub
async function confirmLoadProject() {
  try {
    // Get selected folder
    const selectedFolder = document.querySelector('#folder-list li.selected');
    
    if (!selectedFolder) {
      showNotification('Please select a project to load');
      return;
    }
    
    const folderPath = selectedFolder.dataset.path;
    const projectName = selectedFolder.dataset.name;
    
    // Load HTML file
    let htmlContent = '';
    try {
      htmlContent = await window.githubUtils.getFileFromGithub(folderPath, 'index.html');
    } catch (error) {
      console.error('Error loading HTML file:', error);
      htmlContent = '<!-- HTML file not found -->';
    }
    
    // Load CSS file
    let cssContent = '';
    try {
      cssContent = await window.githubUtils.getFileFromGithub(folderPath, 'styles.css');
    } catch (error) {
      console.error('Error loading CSS file:', error);
      cssContent = '/* CSS file not found */';
    }
    
    // Load JS file
    let jsContent = '';
    try {
      jsContent = await window.githubUtils.getFileFromGithub(folderPath, 'script.js');
    } catch (error) {
      console.error('Error loading JS file:', error);
      jsContent = '// JavaScript file not found';
    }
    
    // Update editors with file content
    htmlEditor.setValue(htmlContent);
    cssEditor.setValue(cssContent);
    jsEditor.setValue(jsContent);
    
    // Update current project name
    currentProjectName = projectName;
    
    // Update output preview
    updateOutput();
    
    showNotification(`Loaded project "${projectName}" successfully!`);
    closeAllDialogs();
  } catch (error) {
    console.error('Error loading project:', error);
    showNotification('Error loading project: ' + error.message);
  }
}

// Close all dialogs
function closeAllDialogs() {
  document.querySelectorAll('.github-dialog').forEach(dialog => {
    dialog.style.display = 'none';
  });
  document.getElementById('overlay').style.display = 'none';
}

// Load code from localStorage (legacy method kept for backward compatibility)
document.getElementById('load-button').addEventListener('dblclick', () => {
  const savedCode = localStorage.getItem('savedCode');
  if (savedCode) {
    try {
      const code = JSON.parse(savedCode);
      htmlEditor.setValue(code.html);
      cssEditor.setValue(code.css);
      jsEditor.setValue(code.js);
      updateOutput();
      showNotification('Code loaded from local storage!');
    } catch (error) {
      showNotification('Failed to load code!');
    }
  } else {
    showNotification('No saved code found in local storage.');
  }
});

// Share functionality with dropdown menu
document.getElementById('share-button').addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent click from bubbling to document
    const dropdown = document.getElementById('share-dropdown');
    
    // Simple toggle - if display is none, show it, otherwise hide it
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
});

// Close dropdown when clicking elsewhere on the page
document.addEventListener('click', () => {
    const dropdown = document.getElementById('share-dropdown');
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    }
});

// Function to toggle fullscreen for a specific element
function toggleFullScreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) { /* Firefox */
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) { /* Chrome, Safari, Opera */
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) { /* IE/Edge */
    element.msRequestFullscreen();
  }
}

// Event listener for fullscreen buttons
document.querySelectorAll('.fullscreen-btn').forEach(button => {
  button.addEventListener('click', (e) => {
    const targetId = e.target.getAttribute('data-target');
    const section = document.getElementById(targetId);
    toggleFullScreen(section);
  });
});

// Font Size Adjustment with Slider
let currentFontSize = 14;

document.getElementById('font-size-button').addEventListener('click', () => {
  const slider = document.getElementById('font-size-slider');
  slider.style.display = slider.style.display === 'none' ? 'inline-block' : 'none';
});

document.getElementById('font-size-slider').addEventListener('input', (event) => {
  const fontSize = event.target.value;
  setEditorFontSize(fontSize);
});

function setEditorFontSize(fontSize) {
  const editors = [htmlEditor, cssEditor, jsEditor];
  editors.forEach(editor => {
    editor.getWrapperElement().style.fontSize = `${fontSize}px`;
  });
}

// Load shared code from URL if present
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedCode = urlParams.get('code');
  if (sharedCode) {
    try {
      const code = JSON.parse(decodeURIComponent(sharedCode));
      htmlEditor.setValue(code.html);
      cssEditor.setValue(code.css);
      jsEditor.setValue(code.js);
      updateOutput();
    } catch (error) {
      showNotification('Invalid shared code.');
    }
  }

  // Trigger initial output update
  updateOutput();

  // Remove the welcome overlay after a few seconds
  setTimeout(() => {
    const welcomeOverlay = document.getElementById('welcome-overlay');
    if (welcomeOverlay) {
      welcomeOverlay.style.display = 'none';
    }
  }, 3000); // Matches the fadeOut animation time

  // Initialize resizers and call only after DOM is fully loaded
  initializeResizers();
});

// chat bot code
document.addEventListener("DOMContentLoaded", function () {
    const chatButton = document.getElementById("chat-toggle");
    const chatContainer = document.getElementById("chat-container");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input-field");
    const sendButton = document.getElementById("send-button");
    const closeButton = document.getElementById("close-chat");

    // API Key for Gemini AI
    const API_KEY = "AIzaSyBgxcpxrwjVu-u8MRaceyNdlUKq-QQ3WQA";
    // Updated API endpoint with correct model name
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    // Toggle Chatbox Visibility
    chatButton.addEventListener("click", function () {
        chatContainer.classList.toggle("show");
    });

    // Close Chat
    closeButton.addEventListener("click", function () {
        chatContainer.classList.remove("show");
    });

    // Append Messages Function
    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Send Message Function
    async function sendMessage() {
        const userInput = chatInput.value.trim();
        if (userInput === "") return;

        // Clear input field
        chatInput.value = "";

        // Show user message
        appendMessage("user", userInput);

        // Show thinking message
        const thinkingMessage = document.createElement("div");
        thinkingMessage.className = "message bot";
        thinkingMessage.textContent = "🤔 Thinking...";
        chatBody.appendChild(thinkingMessage);
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            // Log the API request for debugging
            console.log("Making API request to:", API_URL);
            
            // Prepare request payload - simplified to match curl example
            const payload = {
                contents: [{
                    parts: [{ text: userInput }]
                }]
            };
            
            console.log("Request payload:", payload);

            // Using XMLHttpRequest for better compatibility
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_URL}?key=${API_KEY}`, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    // Remove thinking message
                    if (thinkingMessage.parentNode) {
                        thinkingMessage.remove();
                    }
                    
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            console.log("API Response:", data);
                            
                            if (data.candidates && 
                                data.candidates[0] && 
                                data.candidates[0].content &&
                                data.candidates[0].content.parts && 
                                data.candidates[0].content.parts[0] &&
                                data.candidates[0].content.parts[0].text) {
                                
                                const botResponse = data.candidates[0].content.parts[0].text;
                                appendMessage("bot", botResponse);
                            } else {
                                console.error("Unexpected API response structure:", data);
                                appendMessage("bot", "I apologize, but I couldn't generate a response at the moment.");
                            }
                        } catch (parseError) {
                            console.error("Error parsing response:", parseError, "Raw response:", xhr.responseText);
                            appendMessage("bot", "Sorry, I had trouble processing the response.");
                        }
                    } else {
                        console.error("API request failed:", xhr.status, xhr.statusText, "Response:", xhr.responseText);
                        appendMessage("bot", `Sorry, I encountered an error (${xhr.status}). Please try again later.`);
                    }
                }
            };
            
            xhr.onerror = function() {
                console.error("Network error occurred");
                // Remove thinking message
                if (thinkingMessage.parentNode) {
                    thinkingMessage.remove();
                }
                appendMessage("bot", "Network error occurred. Please check your connection.");
            };
            
            // Send the request with the simplified payload
            xhr.send(JSON.stringify(payload));
        } catch (error) {
            console.error("Error in send function:", error);
            // Remove thinking message
            if (thinkingMessage.parentNode) {
                thinkingMessage.remove();
            }
            appendMessage("bot", "Sorry, something went wrong. Please try again.");
        }
    }

    // Send Message on Button Click
    sendButton.addEventListener("click", sendMessage);

    // Send Message on Enter Key
    chatInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    // Initial greeting
    setTimeout(() => {
        appendMessage("bot", "Hello! How can I help you with coding today? 👋");
    }, 1000);
});

// ======= Panel Resizing Functionality =======
// Initialize variables for resizing
let isResizing = false;
let currentResizer = null;
let startX = 0;
let startWidths = [];
let gridContainer = document.querySelector('.grid-container');
let gridItems = document.querySelectorAll('.grid-item');
let totalWidth = gridContainer.clientWidth;

// Get initial column sizes from CSS
function getColumnSizes() {
  const style = window.getComputedStyle(gridContainer);
  const gridTemplateColumns = style.getPropertyValue('grid-template-columns');
  
  // Parse the column widths
  const columns = gridTemplateColumns.split(' ').map(size => {
    // Convert fr units to pixels based on container width
    if (size.includes('fr')) {
      const frValue = parseFloat(size);
      // This is approximate since we don't know the total fr units
      return (frValue / 4) * totalWidth; // Assuming 4 equal columns as default
    }
    return parseFloat(size.replace('px', ''));
  });
  
  return columns;
}

// Set initial column widths
function setInitialWidths() {
  totalWidth = gridContainer.clientWidth;
  let columns = getColumnSizes();
  
  // If columns are using fr units, convert to pixel values
  if (columns.length === 0 || columns.some(isNaN)) {
    // Default to equal widths if we can't parse the columns
    const equalWidth = totalWidth / gridItems.length;
    columns = Array(gridItems.length).fill(equalWidth);
  }
  
  // Set the initial grid template columns in pixels
  gridContainer.style.gridTemplateColumns = columns.map(width => `${width}px`).join(' ');
}

// Event handler function for mousedown on resizers
function resizerMouseDown(e) {
  // Prevent text selection during resize
  e.preventDefault();
  
  isResizing = true;
  currentResizer = this;
  startX = e.pageX;
  
  // Add active class to resizer
  this.classList.add('active');
  
  // Add resize-active class to container to help with iframe pointer events
  gridContainer.classList.add('resize-active');
  
  // Get current item and next item
  const currentItem = this.parentNode;
  const nextItem = currentItem.nextElementSibling;
  
  if (!nextItem) return; // Can't resize if there's no next item
  
  // Store starting widths
  startWidths = [
    currentItem.getBoundingClientRect().width,
    nextItem.getBoundingClientRect().width
  ];
  
  // Add resize event listeners
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// Handle mouse movement during resize
function handleMouseMove(e) {
  if (!isResizing) return;
  
  const currentItem = currentResizer.parentNode;
  const nextItem = currentItem.nextElementSibling;
  
  if (!nextItem) return; // Can't resize if there's no next item
  
  // Calculate delta
  const deltaX = e.pageX - startX;
  
  // Calculate new widths with min size constraints
  const minWidth = 100; // Minimum width in pixels
  let newCurrentWidth = Math.max(startWidths[0] + deltaX, minWidth);
  let newNextWidth = Math.max(startWidths[1] - deltaX, minWidth);
  
  // Get total width available for these two panels
  const totalPanelWidth = startWidths[0] + startWidths[1];
  
  // Ensure combined width stays the same
  if (newCurrentWidth + newNextWidth !== totalPanelWidth) {
    // Adjust the next panel to maintain total width
    newNextWidth = totalPanelWidth - newCurrentWidth;
    
    // Check minimum constraints again
    if (newNextWidth < minWidth) {
      newNextWidth = minWidth;
      newCurrentWidth = totalPanelWidth - newNextWidth;
    }
  }
  
  // Get current template columns
  const columns = getColumnSizes();
  
  // Find indices of the panels we're adjusting
  const currentIndex = Array.from(gridItems).indexOf(currentItem);
  const nextIndex = Array.from(gridItems).indexOf(nextItem);
  
  // Create a new template columns array
  const newColumns = [...columns];
  newColumns[currentIndex] = newCurrentWidth;
  newColumns[nextIndex] = newNextWidth;
  
  // Update the grid template columns
  gridContainer.style.gridTemplateColumns = newColumns.map(width => `${width}px`).join(' ');
  
  // Refresh CodeMirror editors to adjust to new size
  htmlEditor.refresh();
  cssEditor.refresh();
  jsEditor.refresh();
  
  // Force a redraw of the output
  updateOutput();
}

// Handle mouseup during resize
function handleMouseUp() {
  if (!isResizing) return;
  
  isResizing = false;
  
  // Remove active class from resizer
  if (currentResizer) {
    currentResizer.classList.remove('active');
  }
  
  // Remove resize-active class from container
  gridContainer.classList.remove('resize-active');
  
  // Remove resize event listeners
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  
  // Refresh editors after resize is complete
  refreshAllEditors();
}

// Function to refresh all editors
function refreshAllEditors() {
  // Delay the refresh slightly to allow layout changes to complete
  setTimeout(() => {
    htmlEditor.refresh();
    cssEditor.refresh();
    jsEditor.refresh();
    
    // Force a redraw of the output
    updateOutput();
  }, 200);
}

// Initialize resizers
function initializeResizers() {
  // Re-get references to ensure we have latest DOM elements
  gridContainer = document.querySelector('.grid-container');
  gridItems = document.querySelectorAll('.grid-item');
  totalWidth = gridContainer.clientWidth;
  
  // Check if we're on mobile/tablet
  const isMobile = window.innerWidth <= 1024;
  
  // Get all the resizers
  const resizers = document.querySelectorAll('.resizer');
  
  // Add mousedown event listeners to all resizers
  resizers.forEach(resizer => {
    // Remove existing listener to prevent duplicates
    resizer.removeEventListener('mousedown', resizerMouseDown);
    
    if (!isMobile) {
      // Only add listeners on desktop
      resizer.addEventListener('mousedown', resizerMouseDown);
    }
  });
  
  // Set initial widths
  setInitialWidths();
  
  // Ensure the output section has a resizer
  const outputSection = document.getElementById('output-section');
  if (outputSection && !isMobile) {
    // Check if the output section already has a resizer
    if (!outputSection.querySelector('.resizer')) {
      const resizer = document.createElement('div');
      resizer.className = 'resizer';
      resizer.setAttribute('data-section', 'output');
      outputSection.appendChild(resizer);
      
      // Add event listener to the new resizer
      resizer.addEventListener('mousedown', resizerMouseDown);
    }
  }
  
  // Make sure all resizers are properly positioned and functional
  document.querySelectorAll('.grid-item').forEach((item, index) => {
    const isLastItem = index === gridItems.length - 1;
    const resizer = item.querySelector('.resizer');
    
    if (resizer) {
      // We'll keep the resizer visible but make it non-functional if it's truly the last section
      if (isLastItem && !item.nextElementSibling) {
        resizer.style.display = 'none'; // Hide the last resizer as it's not needed
      } else {
        resizer.style.display = 'block';
      }
    }
  });
  
  // Refresh all editors
  refreshAllEditors();
}

// Set up initialization on load and resize
window.addEventListener('load', initializeResizers);
window.addEventListener('resize', function() {
  // Debounce the resize event
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(() => {
    initializeResizers();
    refreshAllEditors();
  }, 200);
});

// Live Collaboration Variables
let isLiveSession = false;
let sessionId = null;
let firebaseRef = null;
let lastUpdatedBy = null;
let isProcessingRemoteChange = false;

// Start a live collaboration session
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
    
    // Create Firebase reference
    console.log("Creating Firebase reference to:", `sessions/${sessionId}`);
    firebaseRef = firebase.database().ref(`sessions/${sessionId}`);
    
    // Initialize the session data
    firebaseRef.set({
      html: htmlEditor.getValue(),
      css: cssEditor.getValue(),
      js: jsEditor.getValue(),
      lastUpdate: Date.now(),
      updatedBy: 'host'
    });
    
    // Set up listeners for remote changes
    setupLiveListeners();
    
    // Set up local change listeners
    setupLocalChangeListeners();
    
    // Generate and copy share link
    const shareUrl = `${window.location.origin}${window.location.pathname}?live=${sessionId}`;
    navigator.clipboard.writeText(shareUrl);
    
    // Update UI - now we use the share button's appearance to indicate live status
    const shareButton = document.getElementById('share-button');
    shareButton.classList.add('active');
    shareButton.style.backgroundColor = '#ff5722';
    
    // Show the live indicator
    document.getElementById('live-indicator').classList.add('active');
    isLiveSession = true;
    
    showNotification('Live session started! Link copied to clipboard 🎉');
  } catch (error) {
    console.error("Error starting live session:", error);
    showNotification("Error starting live session! Check console for details.");
  }
}

// End a live collaboration session
function endLiveSession() {
  if (!firebaseRef) return;
  
  // Remove all listeners
  firebaseRef.off();
  
  // Remove change listeners from editors
  htmlEditor.off('changes', handleHtmlChanges);
  cssEditor.off('changes', handleCssChanges);
  jsEditor.off('changes', handleJsChanges);
  
  // Update UI
  const shareButton = document.getElementById('share-button');
  shareButton.classList.remove('active');
  shareButton.style.backgroundColor = '';
  
  document.getElementById('live-indicator').classList.remove('active');
  isLiveSession = false;
  sessionId = null;
  firebaseRef = null;
  
  showNotification('Live session ended');
}

// Generate a random session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Set up listeners for remote changes
function setupLiveListeners() {
  firebaseRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    
    // Skip if this is our own update
    if (data.updatedBy === 'host' && lastUpdatedBy === 'host') return;
    if (data.updatedBy === 'guest' && lastUpdatedBy === 'guest') return;
    
    // Mark that we're processing a remote change to avoid loops
    isProcessingRemoteChange = true;
    
    // Update editors with remote data
    htmlEditor.setValue(data.html);
    cssEditor.setValue(data.css);
    jsEditor.setValue(data.js);
    
    // Update output
    updateOutput();
    
    isProcessingRemoteChange = false;
  });
}

// Set up local change listeners
function setupLocalChangeListeners() {
  htmlEditor.on('changes', handleHtmlChanges);
  cssEditor.on('changes', handleCssChanges);
  jsEditor.on('changes', handleJsChanges);
}

// Handle HTML editor changes
function handleHtmlChanges(instance, changes) {
  if (!isLiveSession || isProcessingRemoteChange) return;
  
  // Set who made this update
  lastUpdatedBy = sessionId ? 'host' : 'guest';
  
  // Update Firebase with the new HTML content
  firebaseRef.update({
    html: htmlEditor.getValue(),
    lastUpdate: Date.now(),
    updatedBy: lastUpdatedBy
  });
}

// Handle CSS editor changes
function handleCssChanges(instance, changes) {
  if (!isLiveSession || isProcessingRemoteChange) return;
  
  // Set who made this update
  lastUpdatedBy = sessionId ? 'host' : 'guest';
  
  // Update Firebase with the new CSS content
  firebaseRef.update({
    css: cssEditor.getValue(),
    lastUpdate: Date.now(),
    updatedBy: lastUpdatedBy
  });
}

// Handle JS editor changes
function handleJsChanges(instance, changes) {
  if (!isLiveSession || isProcessingRemoteChange) return;
  
  // Set who made this update
  lastUpdatedBy = sessionId ? 'host' : 'guest';
  
  // Update Firebase with the new JS content
  firebaseRef.update({
    js: jsEditor.getValue(),
    lastUpdate: Date.now(),
    updatedBy: lastUpdatedBy
  });
}

// Add an End Live Session option to the Share dropdown when live session is active
function updateShareDropdown() {
  const dropdown = document.getElementById('share-dropdown');
  
  // Remove any existing end-live option
  const existingEndLive = document.getElementById('share-end-live');
  if (existingEndLive) {
    existingEndLive.remove();
  }
  
  // If live session is active, add the End Live option
  if (isLiveSession) {
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
      document.getElementById('share-dropdown').style.display = 'none';
    });
    
    dropdown.appendChild(endLiveOption);
  }
}

// Check for live session in URL when loading the page
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const liveSessionId = urlParams.get('live');
  
  if (liveSessionId) {
    // Join existing live session
    sessionId = liveSessionId;
    lastUpdatedBy = 'guest';
    firebaseRef = firebase.database().ref(`sessions/${sessionId}`);
    
    // Set up listeners
    setupLiveListeners();
    setupLocalChangeListeners();
    
    // Update UI
    const shareButton = document.getElementById('share-button');
    shareButton.classList.add('active');
    shareButton.style.backgroundColor = '#ff5722';
    
    document.getElementById('live-indicator').classList.add('active');
    isLiveSession = true;
    
    // Update share dropdown with End Live option
    updateShareDropdown();
    
    showNotification('Joined live collaboration session!');
  }
});

// Add home button functionality
document.getElementById('home-button').addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Function to adjust UI based on screen size - like languagescript.js
function adjustForScreenSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const isMobile = width <= 768;
    const isSmallMobile = width <= 480;
    
    // Refresh CodeMirror editors to ensure proper rendering
    if (htmlEditor && cssEditor && jsEditor) {
        setTimeout(() => {
            htmlEditor.refresh();
            cssEditor.refresh();
            jsEditor.refresh();
        }, 100);
    }
    
    // Adjust font size for small screens
    if (isSmallMobile) {
        document.documentElement.style.setProperty('--editor-font-size', '13px');
    } else if (isMobile) {
        document.documentElement.style.setProperty('--editor-font-size', '13px');
    } else {
        document.documentElement.style.setProperty('--editor-font-size', '14px');
    }
    
    // Handle landscape mode on mobile
    if (isLandscape && height <= 500) {
        // Add alternative controls to output header
        const outputHeader = document.querySelector('#output-section .editor-header');
        
        // Remove existing alternative controls if they exist
        const existingControls = document.querySelector('.alternative-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        // Create alternative controls container
        const alternativeControls = document.createElement('div');
        alternativeControls.className = 'alternative-controls';
        
        // Create Save button
        const saveButton = document.createElement('button');
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.addEventListener('click', () => {
            const saveBtn = document.getElementById('save-button');
            if (saveBtn) saveBtn.click();
        });
        alternativeControls.appendChild(saveButton);
        
        // Create Load button
        const loadButton = document.createElement('button');
        loadButton.innerHTML = '<i class="fas fa-folder-open"></i>';
        loadButton.addEventListener('click', () => {
            const loadBtn = document.getElementById('load-button');
            if (loadBtn) loadBtn.click();
        });
        alternativeControls.appendChild(loadButton);
        
        // Add controls to header
        outputHeader.appendChild(alternativeControls);
        
        // Hide regular footer
        const footer = document.querySelector('footer');
        if (footer) {
            footer.style.display = 'none';
        }
    } else {
        // Remove alternative controls if they exist
        const alternativeControls = document.querySelector('.alternative-controls');
        if (alternativeControls) {
            alternativeControls.remove();
        }
        
        // Show regular footer
        const footer = document.querySelector('footer');
        if (footer) {
            footer.style.display = 'flex';
        }
    }
}

// Initialize event listeners for responsive design
window.addEventListener('load', function() {
    adjustForScreenSize();
    
    // Add resize and orientation change event listeners
    window.addEventListener('resize', adjustForScreenSize);
    window.addEventListener('orientationchange', function() {
        setTimeout(adjustForScreenSize, 100);
    });
});

// After DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // For debugging Firebase initialization
    if (typeof firebase !== 'undefined') {
        console.log('Firebase SDK loaded');
        
        // Track this page view
        trackPageView('web-playground');
        
        // Track language usage
        incrementLanguageUsage('web');
    } else {
        console.log('Firebase SDK not available');
    }
    
    // Initialize user account display
    initializeUserAccount();
    
    // Initialize GitHub dialog listeners
    initializeGitHubDialogs();
    
    // ... existing initialization code ...
});

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
        type: 'webdev',
        timestamp: Date.now()
    });
    
    // Update language usage stats
    incrementLanguageUsage('web');
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

// Track project save
function trackProjectSave(projectName) {
    // Check if user is authenticated
    if (!window.githubUtils || !window.githubUtils.isGithubAuthenticated()) {
        return;
    }
    
    const userName = localStorage.getItem('github_user_name');
    const userAvatar = localStorage.getItem('github_user_avatar');
    if (!userName) return;
    
    const database = firebase.database();
    
    // Log project save activity
    database.ref('activity').push({
        userName: userName,
        userAvatar: userAvatar,
        action: 'Saved web project',
        projectName: projectName,
        timestamp: Date.now(),
        status: 'completed'
    });
    
    // Update project in projects collection
    const projectRef = database.ref('projects').child(projectName.replace(/[.#$/\\]/g, '_'));
    projectRef.update({
        name: projectName,
        ownerName: userName,
        ownerAvatar: userAvatar,
        type: 'web',
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

// Modify the updatePreview function to track executions
const originalUpdatePreview = updateOutput;
window.updatePreview = function() {
    // Call the original function
    originalUpdatePreview();
    
    // Track this execution
    trackCodeExecution();
};

// Modify the saveProject function to track saves
const originalSaveProject = confirmSaveProject;
window.confirmSaveProject = function() {
    // Call the original function
    const result = originalSaveProject();
    
    // Track this save if successful
    if (result && currentProjectName) {
        trackProjectSave(currentProjectName);
    }
    
    return result;
};

// Admin override function - add this near the end of the file
function makeAdmin() {
  localStorage.setItem('isAdmin', 'true');
  alert('Admin status granted! Refresh the page to see admin options.');
}
