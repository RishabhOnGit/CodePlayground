require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - Update to accept multiple origins
app.use(cors({
    origin: ['https://playgroundcode.vercel.app', 'https://code-playground-workspace.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// GitHub OAuth exchange endpoint
app.post('/api/github/token', async (req, res) => {
    try {
        const { code, redirect_uri } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }
        
        // Use the provided redirect_uri or fall back to the environment variable
        const actualRedirectUri = redirect_uri || process.env.REDIRECT_URI;
        
        // Log for debugging
        console.log(`GitHub code exchange request:`);
        console.log(`- Code: ${code.substring(0, 5)}...`);
        console.log(`- Redirect URI: ${actualRedirectUri}`);
        console.log(`- ENV Redirect URI: ${process.env.REDIRECT_URI}`);
        
        // Exchange code for access token
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: actualRedirectUri
        }, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const { access_token, error } = response.data;
        
        if (error) {
            console.error('GitHub token error:', error);
            return res.status(400).json({ error });
        }
        
        // Get user info
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${access_token}`
            }
        });
        
        return res.json({ 
            access_token, 
            user: {
                login: userResponse.data.login,
                avatar_url: userResponse.data.avatar_url,
                name: userResponse.data.name || userResponse.data.login
            }
        });
    } catch (error) {
        console.error('Error exchanging GitHub code:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to exchange GitHub code for token' });
    }
});

// Create GitHub repository with folders
app.post('/api/github/create-repo', async (req, res) => {
    try {
        const { access_token } = req.body;
        
        if (!access_token) {
            return res.status(400).json({ error: 'Access token is required' });
        }
        
        // Create repository
        let repoResponse;
        try {
            repoResponse = await axios.post('https://api.github.com/user/repos', {
                name: 'code-playground-workspace',
                private: true,
                description: 'My Code Playground Workspace',
                auto_init: true
            }, {
                headers: {
                    'Authorization': `token ${access_token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
        } catch (error) {
            // If repo already exists (422 error), get the repo info instead
            if (error.response && error.response.status === 422) {
                console.log('Repository likely already exists, getting repo info...');
                
                // Get user info first to get username
                const userResponse = await axios.get('https://api.github.com/user', {
                    headers: {
                        'Authorization': `token ${access_token}`
                    }
                });
                
                const username = userResponse.data.login;
                
                // Get repo info
                repoResponse = await axios.get(`https://api.github.com/repos/${username}/code-playground-workspace`, {
                    headers: {
                        'Authorization': `token ${access_token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
            } else {
                throw error;
            }
        }
        
        const repo = repoResponse.data;
        
        // Create language-playground folder with README
        await createFileInRepo(
            access_token,
            repo.full_name,
            'language-playground/README.md',
            'Language Playground folder for saving code snippets'
        );
        
        // Create web-code folder with README
        await createFileInRepo(
            access_token,
            repo.full_name,
            'web-code/README.md',
            'Web Development folder for saving HTML, CSS, JS projects'
        );
        
        return res.json({ 
            success: true, 
            repo: {
                name: repo.name,
                full_name: repo.full_name,
                html_url: repo.html_url
            }
        });
    } catch (error) {
        console.error('Error creating GitHub repo:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to create GitHub repository' });
    }
});

// Helper function to create a file in the repository
async function createFileInRepo(accessToken, repoFullName, path, content) {
    try {
        // Check if file already exists to avoid errors
        try {
            await axios.get(`https://api.github.com/repos/${repoFullName}/contents/${path}`, {
                headers: {
                    'Authorization': `token ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            // If we get here, file exists, so we don't need to create it
            console.log(`File ${path} already exists in ${repoFullName}`);
            return;
        } catch (error) {
            // File doesn't exist, we'll create it below
            if (error.response && error.response.status !== 404) {
                throw error; // Some other error occurred
            }
        }
        
        // Create the file
        await axios.put(`https://api.github.com/repos/${repoFullName}/contents/${path}`, {
            message: 'Initialize folder structure',
            content: Buffer.from(content).toString('base64')
        }, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        console.log(`Created ${path} in ${repoFullName}`);
    } catch (error) {
        console.error(`Error creating file ${path}:`, error.response?.data || error.message);
        throw error;
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GitHub OAuth Exchange: http://localhost:${PORT}/api/github/token`);
    console.log(`GitHub Repo Creation: http://localhost:${PORT}/api/github/create-repo`);
}); 