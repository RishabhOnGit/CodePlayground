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
    
    // Clear any existing auth state
    sessionStorage.removeItem('github_auth_state');
    localStorage.removeItem('github_access_token');
    
    // Generate a random state value for security
    const state = Math.random().toString(36).substring(2);
    sessionStorage.setItem('github_auth_state', state);
    
    // Construct the GitHub authorization URL with state parameter
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${githubConfig.clientId}&redirect_uri=${encodeURIComponent(githubConfig.redirectUri)}&scope=${githubConfig.scope}&state=${state}`;
    
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