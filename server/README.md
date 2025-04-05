# Code Playground GitHub Server

This is a simple Express server that handles GitHub OAuth authentication and repository creation for the Code Playground application.

## Setup

1. Install dependencies:
```
npm install
```

2. Create a `.env` file with your GitHub OAuth credentials:
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://127.0.0.1:5500/github-callback.html
SERVER_PORT=3000
```

3. Start the server:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

## API Endpoints

### Exchange GitHub code for token
`POST /api/github/token`

Request body:
```json
{
  "code": "github_oauth_code"
}
```

### Create GitHub repository with folders
`POST /api/github/create-repo`

Request body:
```json
{
  "access_token": "github_access_token"
}
```

## Security Note

This server should be run over HTTPS in production to secure the GitHub tokens and user data. 