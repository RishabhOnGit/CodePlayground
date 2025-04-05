// GitHub Repository Utilities

// Base URL for GitHub API
const GITHUB_API_BASE = 'https://api.github.com';
const REPO_NAME = 'code-playground-workspace';

// Function to check if user is authenticated with GitHub
function isGithubAuthenticated() {
    return localStorage.getItem('github_access_token') !== null;
}

// Function to get GitHub token
function getGithubToken() {
    return localStorage.getItem('github_access_token');
}

// Function to get GitHub username
function getGithubUsername() {
    return localStorage.getItem('github_user_name');
}

// Function to save a file to GitHub repository
async function saveFileToGithub(folderPath, fileName, content, commitMessage = 'Update from Code Playground') {
    try {
        if (!isGithubAuthenticated()) {
            throw new Error('Not authenticated with GitHub');
        }

        const token = getGithubToken();
        const username = await getGithubRepoOwner(token);
        const path = `${folderPath}/${fileName}`;
        
        // Check if file already exists
        let sha = null;
        try {
            const existingFile = await fetch(`${GITHUB_API_BASE}/repos/${username}/${REPO_NAME}/contents/${path}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (existingFile.ok) {
                const fileData = await existingFile.json();
                sha = fileData.sha;
            }
        } catch (error) {
            // File doesn't exist, that's okay
            console.log(`File ${path} doesn't exist yet, creating new`);
        }
        
        // Prepare request body
        const requestBody = {
            message: commitMessage,
            content: btoa(unescape(encodeURIComponent(content))), // Properly encode content to base64
            branch: 'main'
        };
        
        // If file exists, include sha to update it
        if (sha) {
            requestBody.sha = sha;
        }
        
        // Put the file content
        const response = await fetch(`${GITHUB_API_BASE}/repos/${username}/${REPO_NAME}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API error: ${errorData.message || 'Unknown error'}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving file to GitHub:', error);
        throw error;
    }
}

// Function to get contents of a file from GitHub repository
async function getFileFromGithub(folderPath, fileName) {
    try {
        if (!isGithubAuthenticated()) {
            throw new Error('Not authenticated with GitHub');
        }

        const token = getGithubToken();
        const username = await getGithubRepoOwner(token);
        const path = `${folderPath}/${fileName}`;
        
        const response = await fetch(`${GITHUB_API_BASE}/repos/${username}/${REPO_NAME}/contents/${path}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const fileData = await response.json();
        // Decode content from base64
        const content = decodeURIComponent(escape(atob(fileData.content)));
        
        return content;
    } catch (error) {
        console.error('Error getting file from GitHub:', error);
        throw error;
    }
}

// Function to list files in a GitHub repository folder
async function listFilesInFolder(folderPath) {
    try {
        if (!isGithubAuthenticated()) {
            throw new Error('Not authenticated with GitHub');
        }

        const token = getGithubToken();
        const username = await getGithubRepoOwner(token);
        
        const response = await fetch(`${GITHUB_API_BASE}/repos/${username}/${REPO_NAME}/contents/${folderPath}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                // Folder doesn't exist yet, return empty array
                return [];
            }
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const contents = await response.json();
        return Array.isArray(contents) ? contents : [];
    } catch (error) {
        console.error(`Error listing files in ${folderPath}:`, error);
        throw error;
    }
}

// Function to get GitHub repo owner (username) from token
async function getGithubRepoOwner(token) {
    try {
        // First try to get from localStorage for performance
        const savedUsername = localStorage.getItem('github_user_login');
        if (savedUsername) {
            return savedUsername;
        }
        
        // Otherwise fetch from GitHub API
        const response = await fetch(`${GITHUB_API_BASE}/user`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const userData = await response.json();
        // Save for future use
        localStorage.setItem('github_user_login', userData.login);
        
        return userData.login;
    } catch (error) {
        console.error('Error getting GitHub username:', error);
        throw error;
    }
}

// Export all functions for use in other files
window.githubUtils = {
    isGithubAuthenticated,
    getGithubToken,
    getGithubUsername,
    saveFileToGithub,
    getFileFromGithub,
    listFilesInFolder,
    getGithubRepoOwner
}; 