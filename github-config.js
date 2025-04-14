// GitHub OAuth configuration
const githubConfig = {
    // Your GitHub OAuth app credentials
    clientId: "Ov23liin8FnTxVvd7aQb",
    // Updated to match GitHub OAuth App configuration
    redirectUri: "https://playgroundcode.vercel.app/github-callback.html",
    scope: "repo" // This scope gives access to create repositories
};

// Function to initiate GitHub OAuth flow
function initiateGithubLogin() {
    console.log("Initiating GitHub login with redirect URI:", githubConfig.redirectUri);
    
    // Show notification about potential delays
    if (typeof showNotification === 'function') {
        showNotification('Redirecting to GitHub for login. This may take a moment.', 5000);
    } else {
        // Create a temporary notification if showNotification function is not available
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '80px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        notification.textContent = 'Redirecting to GitHub for login. This may take a moment.';
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
    
    // Construct the GitHub authorization URL
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${githubConfig.clientId}&redirect_uri=${encodeURIComponent(githubConfig.redirectUri)}&scope=${githubConfig.scope}`;
    
    // Store auth state in session storage
    sessionStorage.setItem('github_auth_state', 'pending');
    
    // Redirect to GitHub for authentication
    window.location.href = authUrl;
}

// Function to check if user is logged in with GitHub
function isGithubLoggedIn() {
    return localStorage.getItem('github_access_token') !== null;
}

// Function to handle GitHub repository initialization
async function initializeGithubRepo(accessToken) {
    try {
        // Create repository
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'code-playground-workspace',
                private: true,
                description: 'My Code Playground Workspace',
                auto_init: true
            })
        });
        
        if (!response.ok) {
            // If repo already exists, this is fine
            if (response.status === 422) {
                console.log('Repository already exists');
                return true;
            }
            throw new Error('Failed to create repository');
        }
        
        const repoData = await response.json();
        
        // Create folders structure via README files (since GitHub API doesn't have direct folder creation)
        await Promise.all([
            createFileInRepo(accessToken, repoData.full_name, 'language-playground/README.md', 'Language Playground folder for saving code snippets'),
            createFileInRepo(accessToken, repoData.full_name, 'web-code/README.md', 'Web Development folder for saving HTML, CSS, JS projects')
        ]);
        
        return true;
    } catch (error) {
        console.error('Error initializing GitHub repo:', error);
        return false;
    }
}

// Helper function to create a file in the repository
async function createFileInRepo(accessToken, repoFullName, path, content) {
    try {
        const response = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Initialize folder structure',
                content: btoa(content)
            })
        });
        
        if (!response.ok && response.status !== 422) { // 422 means file already exists
            throw new Error('Failed to create file in repository');
        }
        
        return true;
    } catch (error) {
        console.error('Error creating file in repo:', error);
        return false;
    }
}