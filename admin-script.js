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
            });
        } else {
            // No users
            const row = usersTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.textContent = 'No users found';
            cell.style.textAlign = 'center';
        }
    });
}

// Load live sessions data
function loadSessionsData() {
    const sessionsTable = document.getElementById('sessions-table').getElementsByTagName('tbody')[0];
    sessionsTable.innerHTML = '';
    
    // Add a loading indicator
    const loadingRow = sessionsTable.insertRow();
    const loadingCell = loadingRow.insertCell();
    loadingCell.colSpan = 6;
    loadingCell.textContent = 'Loading sessions...';
    loadingCell.style.textAlign = 'center';
    
    // Query for both active and completed sessions
    getFirebaseDatabase().ref('liveSessions').once('value', snapshot => {
        // Remove loading indicator
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
                participantsCell.textContent = participantCount;
                
                // Started
                const startedCell = row.insertCell();
                startedCell.textContent = session.startTime ? formatTimestamp(session.startTime) : 'Unknown';
                
                // Status
                const statusCell = row.insertCell();
                const statusClass = session.status === 'active' ? 'status-active' : 'status-inactive';
                statusCell.innerHTML = `<span class="status-badge ${statusClass}">${session.status || 'Unknown'}</span>`;
            });
        } else {
            // No sessions
            const row = sessionsTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6;
            cell.textContent = 'No live sessions found';
            cell.style.textAlign = 'center';
        }
    }).catch(error => {
        console.error("Error loading sessions:", error);
        sessionsTable.innerHTML = '';
        const row = sessionsTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6;
        cell.textContent = 'Error loading sessions data';
        cell.style.textAlign = 'center';
    });
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
            });
        } else {
            // No projects
            const row = projectsTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.textContent = 'No projects found';
            cell.style.textAlign = 'center';
        }
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