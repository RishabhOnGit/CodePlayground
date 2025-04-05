// Live Sharing Module for Code Playground

// Store the current session information
let currentSession = {
    id: null,
    type: null,
    creatorName: null,
    creatorAvatar: null,
    startTime: null,
    participants: {},
    status: null
};

// Initialize the Live Sharing functionality
function initializeLiveSharing() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not available for live sharing');
        return;
    }
    
    // Check if user is authenticated
    if (!window.githubUtils || !window.githubUtils.isGithubAuthenticated()) {
        console.warn('User not authenticated for live sharing');
        return;
    }
    
    // Get user information
    const userName = localStorage.getItem('github_user_name') || 'Anonymous User';
    const userAvatar = localStorage.getItem('github_user_avatar') || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
    
    // Setup live indicator
    setupLiveIndicator();
    
    // Check URL for session ID
    const sessionId = getSessionIdFromUrl();
    if (sessionId) {
        // Join existing session
        joinSession(sessionId, userName, userAvatar);
    } else {
        // Show create/join session options
        showSessionOptions(userName, userAvatar);
    }
    
    // Setup window unload handler to leave session
    window.addEventListener('beforeunload', function() {
        if (currentSession.id) {
            leaveSession(currentSession.id, userName);
        }
    });
}

// Set up live indicator UI
function setupLiveIndicator() {
    const liveIndicator = document.getElementById('live-indicator');
    if (!liveIndicator) return;
    
    // Initially hide the indicator
    liveIndicator.style.display = 'none';
}

// Show session options UI
function showSessionOptions(userName, userAvatar) {
    // Create session options container if it doesn't exist
    let optionsContainer = document.getElementById('session-options');
    if (!optionsContainer) {
        optionsContainer = document.createElement('div');
        optionsContainer.id = 'session-options';
        optionsContainer.className = 'session-options';
        optionsContainer.innerHTML = `
            <div class="session-options-header">
                <h3>Live Coding Session</h3>
                <button class="close-button">&times;</button>
            </div>
            <div class="session-options-content">
                <button id="create-session" class="session-button">
                    <i class="fas fa-plus-circle"></i> Create New Session
                </button>
                <div class="session-divider">or</div>
                <div class="join-form">
                    <input type="text" id="session-id-input" placeholder="Enter Session ID">
                    <button id="join-session" class="session-button">
                        <i class="fas fa-sign-in-alt"></i> Join Session
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(optionsContainer);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .session-options {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #252526;
                border-radius: 8px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
                z-index: 1000;
                width: 320px;
                display: flex;
                flex-direction: column;
                padding: 0;
                color: white;
                overflow: hidden;
            }
            .session-options-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: #1e1e1e;
                border-bottom: 1px solid #333;
            }
            .session-options-header h3 {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 500;
            }
            .close-button {
                background: none;
                border: none;
                color: #ccc;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
            }
            .session-options-content {
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            .session-button {
                padding: 10px;
                background-color: #0366d6;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-size: 0.9rem;
                transition: background-color 0.2s;
            }
            .session-button:hover {
                background-color: #0459c4;
            }
            .session-divider {
                text-align: center;
                position: relative;
                font-size: 0.9rem;
                color: #888;
            }
            .session-divider::before, .session-divider::after {
                content: '';
                position: absolute;
                top: 50%;
                width: 40%;
                height: 1px;
                background-color: #444;
            }
            .session-divider::before {
                left: 0;
            }
            .session-divider::after {
                right: 0;
            }
            .join-form {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            #session-id-input {
                padding: 8px 12px;
                background-color: #333;
                border: 1px solid #555;
                color: white;
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners
        document.querySelector('#create-session').addEventListener('click', function() {
            createSession(userName, userAvatar);
            optionsContainer.remove();
        });
        
        document.querySelector('#join-session').addEventListener('click', function() {
            const sessionId = document.getElementById('session-id-input').value.trim();
            if (sessionId) {
                joinSession(sessionId, userName, userAvatar);
                optionsContainer.remove();
            } else {
                alert('Please enter a valid Session ID');
            }
        });
        
        document.querySelector('.close-button').addEventListener('click', function() {
            optionsContainer.remove();
        });
    }
}

// Create a new live coding session
function createSession(userName, userAvatar) {
    // Determine the session type based on the current page
    const isLanguagePage = window.location.href.includes('language.html');
    const isPlaygroundPage = window.location.href.includes('playground.html');
    let sessionType = 'unknown';
    
    if (isLanguagePage) {
        sessionType = 'language';
    } else if (isPlaygroundPage) {
        sessionType = 'webdev';
    }
    
    // Generate a unique session ID
    const sessionId = generateSessionId();
    
    // Create the session in Firebase
    const database = firebase.database();
    const sessionRef = database.ref('liveSessions').child(sessionId);
    
    const session = {
        id: sessionId,
        type: sessionType,
        creatorName: userName,
        creatorAvatar: userAvatar,
        startTime: Date.now(),
        status: 'active',
        participants: {
            [userName]: {
                name: userName,
                avatar: userAvatar,
                joinTime: Date.now(),
                status: 'active',
                role: 'host'
            }
        }
    };
    
    sessionRef.set(session)
        .then(() => {
            console.log('Session created:', sessionId);
            currentSession = session;
            
            // Log activity
            logActivity(userName, userAvatar, 'Created live session', sessionType, 'active');
            
            // Update UI to show that we're in a session
            updateSessionUI(sessionId, true);
            
            // Update URL with session ID
            updateUrlWithSessionId(sessionId);
            
            // Setup data synchronization
            setupDataSync(sessionId, sessionType, userName);
        })
        .catch(error => {
            console.error('Error creating session:', error);
            alert('Failed to create session: ' + error.message);
        });
}

// Join an existing live coding session
function joinSession(sessionId, userName, userAvatar) {
    const database = firebase.database();
    const sessionRef = database.ref('liveSessions').child(sessionId);
    
    // Check if session exists
    sessionRef.once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                const session = snapshot.val();
                
                // Check if session is active
                if (session.status !== 'active') {
                    alert('This session is no longer active');
                    return;
                }
                
                // Add user to participants
                session.participants[userName] = {
                    name: userName,
                    avatar: userAvatar,
                    joinTime: Date.now(),
                    status: 'active',
                    role: 'participant'
                };
                
                // Update session in Firebase
                sessionRef.update({
                    participants: session.participants
                })
                .then(() => {
                    console.log('Joined session:', sessionId);
                    currentSession = session;
                    
                    // Log activity
                    logActivity(userName, userAvatar, 'Joined live session', session.type, 'active');
                    
                    // Update UI to show that we're in a session
                    updateSessionUI(sessionId, false);
                    
                    // Setup data synchronization
                    setupDataSync(sessionId, session.type, userName);
                })
                .catch(error => {
                    console.error('Error joining session:', error);
                    alert('Failed to join session: ' + error.message);
                });
            } else {
                alert('Session not found: ' + sessionId);
            }
        })
        .catch(error => {
            console.error('Error checking session:', error);
            alert('Error checking session: ' + error.message);
        });
}

// Leave the current live coding session
function leaveSession(sessionId, userName) {
    if (!sessionId) return;
    
    const database = firebase.database();
    const sessionRef = database.ref('liveSessions').child(sessionId);
    
    // Update participant status to inactive
    sessionRef.child('participants').child(userName).update({
        status: 'inactive',
        leaveTime: Date.now()
    });
    
    // Check if this is the host leaving
    if (currentSession.creatorName === userName) {
        // If host is leaving, mark session as inactive
        sessionRef.update({
            status: 'inactive',
            endTime: Date.now()
        });
    }
    
    // Log activity
    logActivity(userName, currentSession.participants[userName]?.avatar, 'Left live session', currentSession.type, 'completed');
    
    // Reset current session
    currentSession = {
        id: null,
        type: null,
        creatorName: null,
        startTime: null,
        participants: {},
        status: null
    };
}

// Setup data synchronization between participants
function setupDataSync(sessionId, sessionType, userName) {
    const database = firebase.database();
    const dataRef = database.ref('sessionData').child(sessionId);
    
    // Different sync behavior based on session type
    if (sessionType === 'language') {
        setupLanguageSync(dataRef, userName);
    } else if (sessionType === 'webdev') {
        setupWebDevSync(dataRef, userName);
    }
}

// Setup sync for language playground
function setupLanguageSync(dataRef, userName) {
    if (!window.codeEditor) {
        console.error('Code editor not found for sync');
        return;
    }
    
    // Initialize data if we're the host
    if (currentSession.creatorName === userName) {
        dataRef.set({
            code: codeEditor.getValue(),
            language: currentLanguage,
            lastUpdate: Date.now(),
            lastUpdateBy: userName
        });
    }
    
    // Listen for changes from other users
    dataRef.on('value', snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Only update if change is from someone else
            if (data.lastUpdateBy !== userName) {
                // Update editor content
                if (data.code !== undefined) {
                    codeEditor.setValue(data.code);
                }
                
                // Update language if needed
                if (data.language !== undefined && data.language !== currentLanguage) {
                    document.getElementById('language-select').value = data.language;
                    handleLanguageChange({target: {value: data.language}});
                }
            }
        }
    });
    
    // Share our changes
    let debounceTimer;
    codeEditor.on('change', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            dataRef.update({
                code: codeEditor.getValue(),
                lastUpdate: Date.now(),
                lastUpdateBy: userName
            });
        }, 500); // Debounce for 500ms
    });
    
    // Handle language changes
    const origHandleLanguageChange = handleLanguageChange;
    window.handleLanguageChange = function(event) {
        origHandleLanguageChange(event);
        
        dataRef.update({
            language: event.target.value,
            lastUpdate: Date.now(),
            lastUpdateBy: userName
        });
    };
}

// Setup sync for web development playground
function setupWebDevSync(dataRef, userName) {
    if (!window.htmlEditor || !window.cssEditor || !window.jsEditor) {
        console.error('Web editors not found for sync');
        return;
    }
    
    // Initialize data if we're the host
    if (currentSession.creatorName === userName) {
        dataRef.set({
            html: htmlEditor.getValue(),
            css: cssEditor.getValue(),
            js: jsEditor.getValue(),
            lastUpdate: Date.now(),
            lastUpdateBy: userName
        });
    }
    
    // Listen for changes from other users
    dataRef.on('value', snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Only update if change is from someone else
            if (data.lastUpdateBy !== userName) {
                // Update editors content
                if (data.html !== undefined) {
                    htmlEditor.setValue(data.html);
                }
                if (data.css !== undefined) {
                    cssEditor.setValue(data.css);
                }
                if (data.js !== undefined) {
                    jsEditor.setValue(data.js);
                }
                
                // Update preview
                updatePreview();
            }
        }
    });
    
    // Share our changes
    let debounceTimer;
    
    function updateSharedData() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            dataRef.update({
                html: htmlEditor.getValue(),
                css: cssEditor.getValue(),
                js: jsEditor.getValue(),
                lastUpdate: Date.now(),
                lastUpdateBy: userName
            });
        }, 500); // Debounce for 500ms
    }
    
    htmlEditor.on('change', updateSharedData);
    cssEditor.on('change', updateSharedData);
    jsEditor.on('change', updateSharedData);
}

// Update the UI to show that we're in a session
function updateSessionUI(sessionId, isHost) {
    // Show live indicator
    const liveIndicator = document.getElementById('live-indicator');
    if (liveIndicator) {
        liveIndicator.style.display = 'flex';
        liveIndicator.innerHTML = `
            <i class="fas fa-broadcast-tower"></i>
            <span>${isHost ? 'Hosting' : 'Joined'} Live Session</span>
            <div class="session-id">ID: ${sessionId}</div>
            <button id="leave-session" title="Leave Session">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
        
        // Add leave session handler
        document.getElementById('leave-session').addEventListener('click', function() {
            // Confirm before leaving
            if (confirm('Are you sure you want to leave this session?')) {
                leaveSession(sessionId, localStorage.getItem('github_user_name') || 'Anonymous User');
                
                // Reload page without session ID
                window.location.href = window.location.pathname;
            }
        });
    }
}

// Update the URL with the session ID
function updateUrlWithSessionId(sessionId) {
    // Only update if sessionId is provided
    if (!sessionId) return;
    
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.replaceState({}, '', url.toString());
}

// Get session ID from URL
function getSessionIdFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get('session');
}

// Generate a unique session ID
function generateSessionId() {
    return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

// Log activity to Firebase
function logActivity(userName, userAvatar, action, projectName, status) {
    const database = firebase.database();
    
    const activity = {
        userName: userName,
        userAvatar: userAvatar,
        action: action,
        projectName: projectName,
        timestamp: Date.now(),
        status: status
    };
    
    database.ref('activity').push(activity);
    
    // Also update user's last active timestamp
    database.ref('users').child(userName).update({
        lastActive: Date.now()
    });
}

// Initialize the module
document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a live indicator element
    if (document.getElementById('live-indicator')) {
        // Wait a bit for other scripts to load
        setTimeout(initializeLiveSharing, 1000);
    }
}); 