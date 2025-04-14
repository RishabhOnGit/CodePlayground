// Admin Panel Script for Code Playground
// Uses Firebase Config from firebase-config.js

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    console.log("Admin panel loaded");
    
    // Check if user is logged in as admin
    checkAdminAuth();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize responsive sidebar
    initResponsiveSidebar();
    
    // Load dashboard data
    loadDashboardData();
    
    // Initialize charts
    initCharts();
});

// Get database reference
function getFirebaseDatabase() {
    if (typeof getDatabase === 'function') {
        const db = getDatabase();
        if (db) return db;
    }
    
    // Fallback to firebase.database() if getDatabase function is not available
    if (typeof firebase !== 'undefined' && firebase.database) {
        return firebase.database();
    }
    
    console.error("Firebase database not available in admin-script.js");
    return null;
}

// Admin Authentication
function checkAdminAuth() {
    console.log("Checking admin authentication");
    console.log("GitHub utils available:", !!window.githubUtils);
    
    // Check if GitHub utils is loaded and user is authenticated
    if (localStorage.getItem('github_access_token')) {
        const username = localStorage.getItem('github_user_name');
        const avatarUrl = localStorage.getItem('github_user_avatar');
        
        console.log("User authenticated:", username);
        
        // Update header info
        document.getElementById('user-name').textContent = username || 'Admin';
        
        if (avatarUrl) {
            document.getElementById('user-avatar').src = avatarUrl;
        }
        
        // Check if user has admin privileges
        checkAdminStatus(username);
        
        // Add logout handler
        document.getElementById('logout-button').addEventListener('click', logoutAdmin);
    } else {
        console.log("User not authenticated, redirecting to login");
        // Show notification
        showNotification('Please log in to access admin panel');
        
        // Redirect to login after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// Check if user has admin privileges
function checkAdminStatus(username) {
    console.log("Checking admin status for:", username);
    
    // Manual override for specific users
    if (username === "Rishabh") {
        console.log("Admin access granted to:", username);
        localStorage.setItem('isAdmin', 'true');
        showNotification('Admin access granted');
        return;
    }
    
    getFirebaseDatabase().ref('admins').child(username).once('value', snapshot => {
        if (!snapshot.exists()) {
            // Save this first admin if there are no admins yet
            getFirebaseDatabase().ref('admins').once('value', allAdmins => {
                if (!allAdmins.exists()) {
                    getFirebaseDatabase().ref('admins').child(username).set({
                        role: 'admin',
                        createdAt: new Date().toISOString()
                    });
                    localStorage.setItem('isAdmin', 'true');
                    showNotification('You have been assigned as the first admin');
                } else {
                    // Not an admin, redirect
                    showNotification('You do not have admin privileges');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                }
            });
        } else {
            // User is an admin
            localStorage.setItem('isAdmin', 'true');
            showNotification('Admin access verified');
        }
    });
}

// Logout admin
function logoutAdmin() {
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

// Initialize navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(link => link.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show corresponding section
            const sectionId = this.getAttribute('data-section');
            if (sectionId === 'dashboard') {
                document.getElementById('dashboard-section').style.display = 'block';
                // Refresh dashboard data
                loadDashboardData();
            } else if (sectionId === 'users') {
                document.getElementById('users-section').style.display = 'block';
                // Load users data
                loadUsersData();
            } else if (sectionId === 'sessions') {
                document.getElementById('sessions-section').style.display = 'block';
                // Load sessions data
                loadSessionsData();
            } else if (sectionId === 'projects') {
                document.getElementById('projects-section').style.display = 'block';
                // Load projects data
                loadProjectsData();
            } else if (sectionId === 'settings') {
                document.getElementById('settings-section').style.display = 'block';
                // Load settings
                loadSettings();
            }
        });
    });
}

// Initialize responsive sidebar
function initResponsiveSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    // Show toggle button on mobile
    if (window.innerWidth <= 768) {
        sidebarToggle.style.display = 'flex';
    }
    
    // Toggle sidebar on button click
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
    
    // Hide sidebar when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target) && 
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            sidebarToggle.style.display = 'flex';
        } else {
            sidebarToggle.style.display = 'none';
            sidebar.classList.remove('active');
        }
    });
}

// Load dashboard data
function loadDashboardData() {
    // Load user stats
    getFirebaseDatabase().ref('users').once('value', snapshot => {
        const totalUsers = snapshot.exists() ? snapshot.numChildren() : 0;
        document.getElementById('total-users').textContent = totalUsers;
    });
    
    // Load active sessions - check for sessions with 'active' status
    getFirebaseDatabase().ref('liveSessions').orderByChild('status').equalTo('active').once('value', snapshot => {
        const activeSessions = snapshot.exists() ? snapshot.numChildren() : 0;
        document.getElementById('active-sessions').textContent = activeSessions;
        
        // Update the counter box style based on sessions count
        const sessionCountBox = document.getElementById('active-sessions').closest('.counter-box');
        if (activeSessions > 0) {
            sessionCountBox.classList.add('has-active-sessions');
        } else {
            sessionCountBox.classList.remove('has-active-sessions');
        }
    }).catch(error => {
        console.error("Error loading active sessions count:", error);
        document.getElementById('active-sessions').textContent = "Error";
    });
    
    // Load projects count
    getFirebaseDatabase().ref('projects').once('value', snapshot => {
        const totalProjects = snapshot.exists() ? snapshot.numChildren() : 0;
        document.getElementById('total-projects').textContent = totalProjects;
    });
    
    // Load code executions in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    getFirebaseDatabase().ref('codeExecutions')
        .orderByChild('timestamp')
        .startAt(oneDayAgo.getTime())
        .once('value', snapshot => {
            const executions = snapshot.exists() ? snapshot.numChildren() : 0;
            document.getElementById('code-executions').textContent = executions;
        });
    
    // Load recent activity
    loadRecentActivity();
}

// Load recent activity for dashboard
function loadRecentActivity() {
    const activityTable = document.getElementById('recent-activity-table').getElementsByTagName('tbody')[0];
    activityTable.innerHTML = '';
    
    getFirebaseDatabase().ref('activity')
        .orderByChild('timestamp')
        .limitToLast(10)
        .once('value', snapshot => {
            if (snapshot.exists()) {
                const activities = [];
                snapshot.forEach(childSnapshot => {
                    activities.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                // Reverse to show newest first
                activities.reverse();
                
                // Add to table
                activities.forEach(activity => {
                    const row = activityTable.insertRow();
                    
                    // User
                    const userCell = row.insertCell();
                    userCell.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="${activity.userAvatar || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}" 
                                alt="${activity.userName}" style="width: 24px; height: 24px; border-radius: 50%;">
                            ${activity.userName}
                        </div>
                    `;
                    
                    // Activity
                    const actionCell = row.insertCell();
                    actionCell.textContent = activity.action || 'Unknown action';
                    
                    // Project
                    const projectCell = row.insertCell();
                    projectCell.textContent = activity.projectName || '-';
                    
                    // Time
                    const timeCell = row.insertCell();
                    timeCell.textContent = formatTimestamp(activity.timestamp);
                    
                    // Status
                    const statusCell = row.insertCell();
                    const statusClass = activity.status === 'completed' ? 'status-active' : 'status-inactive';
                    statusCell.innerHTML = `<span class="status-badge ${statusClass}">${activity.status || 'Unknown'}</span>`;
                });
            } else {
                // No activities
                const row = activityTable.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 5;
                cell.textContent = 'No recent activity found';
                cell.style.textAlign = 'center';
            }
        });
}

// Load users data
function loadUsersData() {
    const usersTable = document.getElementById('users-table').getElementsByTagName('tbody')[0];
    usersTable.innerHTML = '';
    
    getFirebaseDatabase().ref('users').once('value', snapshot => {
        if (snapshot.exists()) {
            const users = [];
            snapshot.forEach(childSnapshot => {
                users.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            // Add to table
            users.forEach(user => {
                const row = usersTable.insertRow();
                
                // User
                const userCell = row.insertCell();
                userCell.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${user.avatarUrl || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}" 
                            alt="${user.name}" style="width: 24px; height: 24px; border-radius: 50%;">
                        ${user.name}
                    </div>
                `;
                
                // Email (if available, otherwise show GitHub username)
                const emailCell = row.insertCell();
                emailCell.textContent = user.email || user.github || '-';
                
                // Projects count
                const projectsCell = row.insertCell();
                projectsCell.textContent = user.projectCount || '0';
                
                // Last active
                const lastActiveCell = row.insertCell();
                lastActiveCell.textContent = formatTimestamp(user.lastActive) || 'Never';
                
                // Status
                const statusCell = row.insertCell();
                const isActive = user.lastActive && (Date.now() - user.lastActive < 24 * 60 * 60 * 1000);
                const statusClass = isActive ? 'status-active' : 'status-inactive';
                statusCell.innerHTML = `<span class="status-badge ${statusClass}">${isActive ? 'Active' : 'Inactive'}</span>`;
                
                // Tour Status - NEW COLUMN
                const tourCell = row.insertCell();
                const tourStatus = user.tourEnabled ? 'Enabled' : 'Disabled';
                const tourBtnClass = user.tourEnabled ? 'danger' : 'primary';
                const tourBtnText = user.tourEnabled ? 'Disable' : 'Enable';
                
                // Create toggle button for tour
                const toggleTourBtn = document.createElement('button');
                toggleTourBtn.className = `action-button ${tourBtnClass}`;
                toggleTourBtn.style.padding = '4px 8px';
                toggleTourBtn.style.fontSize = '0.8rem';
                toggleTourBtn.innerHTML = `<i class="fas fa-info-circle"></i> ${tourBtnText}`;
                toggleTourBtn.title = `${tourBtnText} tour for this user`;
                toggleTourBtn.setAttribute('data-user-id', user.id);
                toggleTourBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent row click event
                    toggleUserTour(user.id, user.name, !user.tourEnabled);
                });
                
                tourCell.appendChild(toggleTourBtn);
                
                // Actions
                const actionsCell = row.insertCell();
                actionsCell.style.textAlign = 'right';
                
                // Create delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-button danger';
                deleteBtn.style.padding = '4px 8px';
                deleteBtn.style.fontSize = '0.8rem';
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.title = 'Delete User';
                deleteBtn.setAttribute('data-user-id', user.id);
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent row click event
                    deleteUser(user.id, user.name);
                });
                
                actionsCell.appendChild(deleteBtn);
            });
        } else {
            // No users
            const row = usersTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7; // Updated to account for the new tour column
            cell.textContent = 'No users found';
            cell.style.textAlign = 'center';
        }
    });
}

// Toggle tour for a user
function toggleUserTour(userId, userName, enableTour) {
    if (!userId) return;
    
    // Get confirmation
    const action = enableTour ? 'enable' : 'disable';
    const confirmToggle = confirm(`Are you sure you want to ${action} the tour for user "${userName || userId}"?`);
    if (!confirmToggle) return;
    
    // Update user record in Firebase
    getFirebaseDatabase().ref(`users/${userId}`).update({
        tourEnabled: enableTour
    }).then(() => {
        // Also update tour flags in Firebase to enforce this setting
        getFirebaseDatabase().ref(`userTours/${userId}`).set({
            tourEnabled: enableTour,
            mainTourShown: !enableTour,
            playgroundTourShown: !enableTour,
            languageTourShown: !enableTour,
            updatedAt: Date.now()
        }).then(() => {
            console.log(`Tour ${action}d for user ${userId}`);
            showNotification(`Tour ${action}d for user successfully`);
            
            // If current admin user is also the target user, immediately show the tour
            const currentUser = localStorage.getItem('github_user_name');
            if (currentUser === userId && enableTour) {
                // Create a flag in localStorage to force immediate tour display
                localStorage.setItem('show_tour_immediately', 'true');
                showNotification(`Tour will be shown on your next page view`);
            }
            
            // Reload users data to update the table
            loadUsersData();
        }).catch(error => {
            console.error(`Error updating user tour flags:`, error);
            showNotification(`Error: ${error.message}`);
        });
    }).catch(error => {
        console.error(`Error ${action}ing tour for user:`, error);
        showNotification(`Error: ${error.message}`);
    });
}

// Delete a user
function deleteUser(userId, userName) {
    if (!userId) return;
    
    const confirmDelete = confirm(`Are you sure you want to permanently DELETE the user "${userName || userId}" and all their data? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    // Start deletion process
    let deleteOperations = [];
    
    // 1. Delete user from users collection
    deleteOperations.push(getFirebaseDatabase().ref(`users/${userId}`).remove());
    
    // 2. Find and delete user's projects
    getFirebaseDatabase().ref('projects').orderByChild('ownerId').equalTo(userId).once('value', snapshot => {
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const projectId = childSnapshot.key;
                deleteOperations.push(getFirebaseDatabase().ref(`projects/${projectId}`).remove());
                deleteOperations.push(getFirebaseDatabase().ref(`projectFiles/${projectId}`).remove());
            });
        }
    }).then(() => {
        // 3. Execute all delete operations
        Promise.all(deleteOperations)
            .then(() => {
                console.log(`User ${userId} and their data successfully deleted`);
                showNotification('User deleted successfully');
                // Reload users data to update the table
                loadUsersData();
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                showNotification('Error deleting user: ' + error.message);
            });
    }).catch(error => {
        console.error('Error finding user projects:', error);
        showNotification('Error finding user projects: ' + error.message);
    });
}

// Load live sessions data
function loadSessionsData() {
    const sessionsTable = document.getElementById('sessions-table').getElementsByTagName('tbody')[0];
    sessionsTable.innerHTML = '<tr><td colspan="7" class="loading">Loading sessions data...</td></tr>';
    
    getFirebaseDatabase().ref('liveSessions').once('value', snapshot => {
        // Clear the table
        sessionsTable.innerHTML = '';
        
        if (snapshot.exists()) {
            const sessions = [];
            snapshot.forEach(childSnapshot => {
                sessions.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            // Sort by most recent first (using startTime)
            sessions.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
            
            // Add to table
            sessions.forEach(session => {
                const row = sessionsTable.insertRow();
                row.className = 'session-row';
                row.setAttribute('data-session-id', session.id);
                
                // Make the row clickable to show details
                row.addEventListener('click', () => {
                    showSessionDetails(session.id);
                });
                
                // Session ID
                const idCell = row.insertCell();
                // Show full ID with tooltip on hover
                idCell.innerHTML = `<span title="${session.id}">${session.id ? session.id.substring(0, 10) + '...' : 'Unknown'}</span>`;
                
                // Created By
                const creatorCell = row.insertCell();
                creatorCell.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${session.creatorAvatar || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}" 
                            alt="${session.creatorName || 'Unknown'}" style="width: 24px; height: 24px; border-radius: 50%;">
                        ${session.creatorName || 'Unknown'}
                    </div>
                `;
                
                // Type
                const typeCell = row.insertCell();
                typeCell.textContent = session.type || 'Unknown';
                
                // Participants
                const participantsCell = row.insertCell();
                const participantCount = session.participants ? Object.keys(session.participants).length : 0;
                const activeParticipants = session.participants ? Object.values(session.participants).filter(p => p.status !== 'left').length : 0;
                
                // Show total participants and active participants
                participantsCell.innerHTML = `
                    <div title="${activeParticipants} active of ${participantCount} total">
                        <span style="color: #17c964;">${activeParticipants}</span>/${participantCount}
                    </div>
                `;
                
                // Started
                const startedCell = row.insertCell();
                startedCell.textContent = session.startTime ? formatTimestamp(session.startTime) : 'Unknown';
                
                // Status
                const statusCell = row.insertCell();
                const statusClass = session.status === 'active' ? 'status-active' : 'status-inactive';
                statusCell.innerHTML = `<span class="status-badge ${statusClass}">${session.status || 'Unknown'}</span>`;
                
                // Actions
                const actionsCell = row.insertCell();
                actionsCell.style.textAlign = 'right';
                
                // Create delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-button danger';
                deleteBtn.style.padding = '4px 8px';
                deleteBtn.style.fontSize = '0.8rem';
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.title = 'Delete Session';
                deleteBtn.setAttribute('data-session-id', session.id);
                deleteBtn.setAttribute('data-session-type', session.type);
                
                // Add event listener for delete button
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent row click event
                    
                    // Directly delete the session without opening modal
                    const sessionId = this.getAttribute('data-session-id');
                    const sessionType = this.getAttribute('data-session-type');
                    
                    const confirmDelete = confirm('Are you sure you want to permanently DELETE this session? This action cannot be undone.');
                    if (!confirmDelete) return;
                    
                    // Path to delete based on session type
                    let sessionPath = '';
                    if (sessionType === 'Web Playground') {
                        sessionPath = `sessions/${sessionId}`;
                    } else if (sessionType === 'Language Playground') {
                        sessionPath = `languageSessions/${sessionId}`;
                    }
                    
                    // Start deletion operations
                    let deleteOperations = [];
                    
                    // 1. Delete from liveSessions collection
                    const liveSessionRef = getFirebaseDatabase().ref(`liveSessions/${sessionId}`);
                    deleteOperations.push(liveSessionRef.remove());
                    
                    // 2. Delete from type-specific collection if applicable
                    if (sessionPath) {
                        const typeSessionRef = getFirebaseDatabase().ref(sessionPath);
                        deleteOperations.push(typeSessionRef.remove());
                    }
                    
                    // Execute all delete operations
                    Promise.all(deleteOperations)
                        .then(() => {
                            console.log(`Session ${sessionId} successfully deleted`);
                            showNotification('Session deleted successfully');
                            // Reload sessions data to update the table
                            loadSessionsData();
                        })
                        .catch(error => {
                            console.error('Error deleting session:', error);
                            showNotification('Error deleting session: ' + error.message);
                        });
                });
                
                actionsCell.appendChild(deleteBtn);
                
                // Add hover style
                row.style.cursor = 'pointer';
                row.addEventListener('mouseover', () => {
                    row.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                });
                row.addEventListener('mouseout', () => {
                    row.style.backgroundColor = '';
                });
            });
        } else {
            // No sessions
            const row = sessionsTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7; // Updated to account for the new actions column
            cell.textContent = 'No live sessions found';
            cell.style.textAlign = 'center';
        }
    }).catch(error => {
        console.error("Error loading sessions:", error);
        sessionsTable.innerHTML = '';
        const row = sessionsTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 7; // Updated to account for the new actions column
        cell.textContent = 'Error loading sessions data';
        cell.style.textAlign = 'center';
    });
    
    // Set up modal close handler
    document.querySelector('.modal-close').addEventListener('click', hideSessionDetailsModal);
    
    // Set up terminate and monitor button handlers
    document.getElementById('terminate-session').addEventListener('click', terminateSession);
    document.getElementById('join-session').addEventListener('click', monitorSession);
    document.getElementById('delete-session').addEventListener('click', deleteSession);
}

// Show session details modal
function showSessionDetails(sessionId) {
    // Get session data
    getFirebaseDatabase().ref(`liveSessions/${sessionId}`).once('value', snapshot => {
        const session = snapshot.val();
        if (!session) {
            showNotification('Session not found');
            return;
        }
        
        // Update modal with session data
        document.getElementById('modal-session-id').textContent = sessionId;
        
        // Creator info
        document.getElementById('modal-creator').innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${session.creatorAvatar || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}" 
                    alt="${session.creatorName || 'Unknown'}" style="width: 24px; height: 24px; border-radius: 50%;">
                ${session.creatorName || 'Unknown'}
            </div>
        `;
        
        // Type with language if available
        let typeDisplay = session.type || 'Unknown';
        if (session.language) {
            typeDisplay += ` (${session.language})`;
        }
        document.getElementById('modal-type').textContent = typeDisplay;
        
        // Start time
        document.getElementById('modal-started').textContent = session.startTime ? formatTimestamp(session.startTime) : 'Unknown';
        
        // Status with color
        const statusClass = session.status === 'active' ? 'status-active' : 'status-inactive';
        document.getElementById('modal-status').innerHTML = `<span class="status-badge ${statusClass}">${session.status || 'Unknown'}</span>`;
        
        // Duration
        const startTime = session.startTime || Date.now();
        const endTime = session.endTime || (session.status === 'active' ? Date.now() : startTime);
        const durationMs = endTime - startTime;
        const durationText = formatDuration(durationMs);
        document.getElementById('modal-duration').textContent = durationText;
        
        // Participants list
        const participantsContainer = document.getElementById('modal-participants');
        participantsContainer.innerHTML = '';
        
        if (session.participants && Object.keys(session.participants).length > 0) {
            Object.entries(session.participants).forEach(([userId, userData]) => {
                const participantCard = document.createElement('div');
                participantCard.className = 'participant-card';
                
                const statusClass = userData.status === 'active' ? 'active' : 'left';
                const joinTime = userData.joinedAt ? formatTimestamp(userData.joinedAt) : 'Unknown';
                const leftTime = userData.leftAt ? formatTimestamp(userData.leftAt) : '';
                
                participantCard.innerHTML = `
                    <img class="participant-avatar" src="${userData.avatar || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}" alt="${userData.name}">
                    <div class="participant-info">
                        <div class="participant-name">${userData.name}</div>
                        <div class="participant-status">
                            <span class="status-dot ${statusClass}"></span>
                            ${userData.role === 'host' ? 'Host' : 'Guest'} • ${userData.status}
                        </div>
                        <div class="participant-join-time" style="font-size: 0.8rem; color: #999; margin-top: 3px;">
                            Joined: ${joinTime}
                            ${userData.leftAt ? `<br>Left: ${leftTime}` : ''}
                        </div>
                    </div>
                `;
                
                participantsContainer.appendChild(participantCard);
            });
        } else {
            participantsContainer.innerHTML = '<div class="loading">No participants found</div>';
        }
        
        // Content preview - get from the appropriate path based on type
        const contentContainer = document.getElementById('modal-content');
        contentContainer.innerHTML = '<div class="loading">Loading content preview...</div>';
        
        let contentPath = '';
        if (session.type === 'Web Playground') {
            contentPath = `sessions/${sessionId}`;
        } else if (session.type === 'Language Playground') {
            contentPath = `languageSessions/${sessionId}`;
        }
        
        if (contentPath) {
            getFirebaseDatabase().ref(contentPath).once('value', contentSnapshot => {
                if (contentSnapshot.exists()) {
                    const content = contentSnapshot.val();
                    let previewHtml = '';
                    
                    if (session.type === 'Web Playground') {
                        // For web playground, show HTML, CSS, JS
                        previewHtml = `
                            <div style="margin-bottom: 10px;">
                                <strong>HTML:</strong>
                                <pre style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; max-height: 100px; overflow-y: auto;">${content.html ? truncateText(content.html, 200) : 'Empty'}</pre>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong>CSS:</strong>
                                <pre style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; max-height: 100px; overflow-y: auto;">${content.css ? truncateText(content.css, 200) : 'Empty'}</pre>
                            </div>
                            <div>
                                <strong>JavaScript:</strong>
                                <pre style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; max-height: 100px; overflow-y: auto;">${content.js ? truncateText(content.js, 200) : 'Empty'}</pre>
                            </div>
                        `;
                    } else if (session.type === 'Language Playground') {
                        // For language playground, show code and language
                        previewHtml = `
                            <div style="margin-bottom: 10px;">
                                <strong>${content.language || 'Code'}:</strong>
                                <pre style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; max-height: 150px; overflow-y: auto;">${content.code ? truncateText(content.code, 500) : 'Empty'}</pre>
                            </div>
                        `;
                    } else {
                        previewHtml = '<div>Content preview not available for this session type</div>';
                    }
                    
                    contentContainer.innerHTML = previewHtml;
                } else {
                    contentContainer.innerHTML = '<div class="loading">No content available</div>';
                }
            }).catch(error => {
                console.error('Error loading session content:', error);
                contentContainer.innerHTML = '<div class="loading">Error loading content</div>';
            });
        } else {
            contentContainer.innerHTML = '<div class="loading">Content preview not available</div>';
        }
        
        // Update button states based on session status
        const terminateButton = document.getElementById('terminate-session');
        const monitorButton = document.getElementById('join-session');
        const deleteButton = document.getElementById('delete-session');
        
        if (session.status === 'active') {
            terminateButton.style.display = 'flex';
            monitorButton.style.display = 'flex';
            deleteButton.style.display = 'flex';
        } else {
            terminateButton.style.display = 'none';
            monitorButton.style.display = 'none';
            deleteButton.style.display = 'flex';
        }
        
        // Set attributes for button handlers
        terminateButton.setAttribute('data-session-id', sessionId);
        monitorButton.setAttribute('data-session-id', sessionId);
        monitorButton.setAttribute('data-session-type', session.type);
        deleteButton.setAttribute('data-session-id', sessionId);
        deleteButton.setAttribute('data-session-type', session.type);
        
        // Show the modal
        document.getElementById('session-details-modal').style.display = 'flex';
    });
}

// Hide session details modal
function hideSessionDetailsModal() {
    document.getElementById('session-details-modal').style.display = 'none';
}

// Terminate session
function terminateSession() {
    const sessionId = this.getAttribute('data-session-id');
    if (!sessionId) return;
    
    const confirmTerminate = confirm('Are you sure you want to terminate this session? All participants will be disconnected.');
    if (!confirmTerminate) return;
    
    // Get session type to determine which path to update
    getFirebaseDatabase().ref(`liveSessions/${sessionId}`).once('value', snapshot => {
        const session = snapshot.val();
        if (!session) {
            showNotification('Session not found');
            return;
        }
        
        // Path to update based on session type
        let sessionPath = '';
        if (session.type === 'Web Playground') {
            sessionPath = `sessions/${sessionId}`;
        } else if (session.type === 'Language Playground') {
            sessionPath = `languageSessions/${sessionId}`;
        }
        
        if (sessionPath) {
            // Mark the session as inactive in the session-specific location
            getFirebaseDatabase().ref(sessionPath).update({
                active: false,
                endedAt: Date.now(),
                terminatedBy: 'admin'
            }).then(() => {
                console.log(`Session ${sessionId} marked as inactive in ${sessionPath}`);
            }).catch(error => {
                console.error(`Error updating session status in ${sessionPath}:`, error);
            });
        }
        
        // Update the session in liveSessions collection
        getFirebaseDatabase().ref(`liveSessions/${sessionId}`).update({
            status: 'completed',
            endTime: Date.now(),
            terminatedBy: 'admin'
        }).then(() => {
            showNotification('Session terminated successfully');
            hideSessionDetailsModal();
            // Reload sessions data to update the table
            loadSessionsData();
        }).catch(error => {
            console.error('Error terminating session:', error);
            showNotification('Error terminating session: ' + error.message);
        });
    });
}

// Delete session permanently
function deleteSession() {
    const sessionId = this.getAttribute('data-session-id');
    const sessionType = this.getAttribute('data-session-type');
    if (!sessionId) return;
    
    const confirmDelete = confirm('Are you sure you want to permanently DELETE this session? This action cannot be undone.');
    if (!confirmDelete) return;
    
    // Path to delete based on session type
    let sessionPath = '';
    if (sessionType === 'Web Playground') {
        sessionPath = `sessions/${sessionId}`;
    } else if (sessionType === 'Language Playground') {
        sessionPath = `languageSessions/${sessionId}`;
    }
    
    // Start deletion operations
    let deleteOperations = [];
    
    // 1. Delete from liveSessions collection
    const liveSessionRef = getFirebaseDatabase().ref(`liveSessions/${sessionId}`);
    deleteOperations.push(liveSessionRef.remove());
    
    // 2. Delete from type-specific collection if applicable
    if (sessionPath) {
        const typeSessionRef = getFirebaseDatabase().ref(sessionPath);
        deleteOperations.push(typeSessionRef.remove());
    }
    
    // Execute all delete operations
    Promise.all(deleteOperations)
        .then(() => {
            console.log(`Session ${sessionId} successfully deleted`);
            showNotification('Session deleted successfully');
            hideSessionDetailsModal();
            // Reload sessions data to update the table
            loadSessionsData();
        })
        .catch(error => {
            console.error('Error deleting session:', error);
            showNotification('Error deleting session: ' + error.message);
        });
}

// Monitor session
function monitorSession() {
    const sessionId = this.getAttribute('data-session-id');
    const sessionType = this.getAttribute('data-session-type');
    if (!sessionId || !sessionType) return;
    
    let url = '';
    if (sessionType === 'Web Playground') {
        url = `playground.html?live=${sessionId}&admin=true`;
    } else if (sessionType === 'Language Playground') {
        url = `language.html?live=${sessionId}&admin=true`;
    } else {
        showNotification('Cannot monitor this session type');
        return;
    }
    
    // Open in a new tab
    window.open(url, '_blank');
}

// Format duration from milliseconds
function formatDuration(ms) {
    if (!ms) return 'Unknown';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

// Truncate text for preview
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Load projects data
function loadProjectsData() {
    const projectsTable = document.getElementById('projects-table').getElementsByTagName('tbody')[0];
    projectsTable.innerHTML = '';
    
    getFirebaseDatabase().ref('projects').once('value', snapshot => {
        if (snapshot.exists()) {
            const projects = [];
            snapshot.forEach(childSnapshot => {
                projects.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            // Reverse to show newest first
            projects.reverse();
            
            // Add to table
            projects.forEach(project => {
                const row = projectsTable.insertRow();
                
                // Project Name
                const nameCell = row.insertCell();
                nameCell.textContent = project.name || 'Unnamed Project';
                
                // Owner
                const ownerCell = row.insertCell();
                ownerCell.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${project.ownerAvatar || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}" 
                            alt="${project.ownerName}" style="width: 24px; height: 24px; border-radius: 50%;">
                        ${project.ownerName}
                    </div>
                `;
                
                // Type
                const typeCell = row.insertCell();
                typeCell.textContent = project.type || 'Unknown';
                
                // Last Modified
                const modifiedCell = row.insertCell();
                modifiedCell.textContent = formatTimestamp(project.lastModified);
                
                // Status
                const statusCell = row.insertCell();
                const statusClass = project.status === 'public' ? 'status-active' : 'status-inactive';
                statusCell.innerHTML = `<span class="status-badge ${statusClass}">${project.status || 'private'}</span>`;
                
                // Actions
                const actionsCell = row.insertCell();
                actionsCell.style.textAlign = 'right';
                
                // Create delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-button danger';
                deleteBtn.style.padding = '4px 8px';
                deleteBtn.style.fontSize = '0.8rem';
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.title = 'Delete Project';
                deleteBtn.setAttribute('data-project-id', project.id);
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent row click event
                    deleteProject(project.id, project.name);
                });
                
                actionsCell.appendChild(deleteBtn);
            });
        } else {
            // No projects
            const row = projectsTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6; // Updated to account for the new actions column
            cell.textContent = 'No projects found';
            cell.style.textAlign = 'center';
        }
    });
}

// Delete a project
function deleteProject(projectId, projectName) {
    if (!projectId) return;
    
    const confirmDelete = confirm(`Are you sure you want to permanently DELETE the project "${projectName || projectId}"? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    getFirebaseDatabase().ref(`projects/${projectId}`).remove()
        .then(() => {
            console.log(`Project ${projectId} successfully deleted`);
            showNotification('Project deleted successfully');
            
            // Also delete associated files if applicable
            getFirebaseDatabase().ref(`projectFiles/${projectId}`).remove()
                .then(() => {
                    console.log(`Project files for ${projectId} also deleted`);
                })
                .catch(error => {
                    console.error('Error deleting project files:', error);
                });
                
            // Reload projects data to update the table
            loadProjectsData();
        })
        .catch(error => {
            console.error('Error deleting project:', error);
            showNotification('Error deleting project: ' + error.message);
        });
}

// Load settings
function loadSettings() {
    // Load settings from Firebase
    getFirebaseDatabase().ref('settings').once('value', snapshot => {
        if (snapshot.exists()) {
            const settings = snapshot.val();
            document.getElementById('github-client-id').value = settings.githubClientId || '';
            document.getElementById('github-client-secret').value = settings.githubClientSecret || '';
            document.getElementById('firebase-api-key').value = settings.firebaseApiKey || '';
        }
    });
    
    // Setup form submission
    document.getElementById('settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const settings = {
            githubClientId: document.getElementById('github-client-id').value,
            githubClientSecret: document.getElementById('github-client-secret').value,
            firebaseApiKey: document.getElementById('firebase-api-key').value,
            lastUpdated: Date.now(),
            updatedBy: localStorage.getItem('github_user_name') || 'Admin'
        };
        
        getFirebaseDatabase().ref('settings').set(settings, error => {
            if (error) {
                showNotification('Error saving settings: ' + error.message);
            } else {
                showNotification('Settings saved successfully');
            }
        });
    });
}

// Initialize charts
function initCharts() {
    initUserActivityChart();
    initLanguageUsageChart();
}

// Initialize user activity chart
function initUserActivityChart() {
    // Get last 7 days
    const days = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(formatDate(date));
        counts.push(0); // Initialize with zeros
    }
    
    // Get activity data for the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    getFirebaseDatabase().ref('activity')
        .orderByChild('timestamp')
        .startAt(oneWeekAgo.getTime())
        .once('value', snapshot => {
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const activity = childSnapshot.val();
                    if (activity.timestamp) {
                        const date = new Date(activity.timestamp);
                        const dateString = formatDate(date);
                        const index = days.indexOf(dateString);
                        if (index !== -1) {
                            counts[index]++;
                        }
                    }
                });
            }
            
            // Create chart
            const ctx = document.getElementById('user-activity-chart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'User Activity',
                        data: counts,
                        backgroundColor: 'rgba(3, 102, 214, 0.2)',
                        borderColor: 'rgba(3, 102, 214, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(3, 102, 214, 1)',
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        });
}

// Initialize language usage chart
function initLanguageUsageChart() {
    // Default data
    const data = {
        labels: ['Python', 'C', 'HTML/CSS/JS', 'Other'],
        datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: [
                'rgba(52, 152, 219, 0.8)',
                'rgba(46, 204, 113, 0.8)',
                'rgba(155, 89, 182, 0.8)',
                'rgba(230, 126, 34, 0.8)'
            ],
            borderColor: [
                'rgba(52, 152, 219, 1)',
                'rgba(46, 204, 113, 1)',
                'rgba(155, 89, 182, 1)',
                'rgba(230, 126, 34, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    // Get language usage data
    getFirebaseDatabase().ref('languageUsage').once('value', snapshot => {
        if (snapshot.exists()) {
            const usage = snapshot.val();
            data.datasets[0].data[0] = usage.python || 0;
            data.datasets[0].data[1] = usage.c || 0;
            data.datasets[0].data[2] = usage.web || 0;
            data.datasets[0].data[3] = usage.other || 0;
        }
        
        // Create chart
        const ctx = document.getElementById('language-usage-chart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    });
}

// Helper function to format timestamps
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'Just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

// Helper function to format date as MM/DD
function formatDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification-popup');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
} 