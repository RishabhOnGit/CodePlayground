# Code Playground

A real-time interactive web-based code editor for HTML, CSS, and JavaScript development with live preview, sharing capabilities, and AI assistance.

## Overview

Code Playground provides an intuitive coding environment where developers can experiment with web technologies side-by-side with a live preview. The application features a responsive four-panel interface with adjustable panels for HTML, CSS, JavaScript, and output display, making it perfect for prototyping, learning, and sharing code examples.

## Key Features

- **Split-Panel Interface**: Four adjustable panels for HTML, CSS, JavaScript editing and live output preview
- **Real-time Code Execution**: Instant preview updates as you type with smart debouncing
- **Code Sharing**: Generate shareable links to your code snippets via TinyURL integration
- **Live Collaboration**: Real-time collaborative coding with Firebase backend
- **Cloud Storage**: Save your projects locally with browser storage
- **AI Chat Assistant**: Get coding help from an integrated AI bot powered by Gemini API
- **Responsive Design**: Works on desktop, tablet, and mobile devices with layout adaptations
- **Developer-Friendly Tools**: Syntax highlighting, code auto-completion, and bracket matching

## Demo

![Code Playground Interface](./images/playground-demo.png) <!-- Replace with an actual screenshot of your application -->

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection for loading dependencies and accessing collaborative features

### Running Locally
1. Clone the repository:
```bash
git clone https://github.com/yourusername/code-playground.git
```

2. Navigate to the project directory:
```bash
cd code-playground
```

3. Open the playground.html file in your browser:
```bash
# On Windows
start playground.html

# On macOS
open playground.html

# On Linux
xdg-open playground.html
```

4. Alternatively, you can use a local development server:
```bash
# Using Python
python -m http.server

# Using Node.js
npx serve
```

## Technical Implementation

- **Frontend**: Pure HTML, CSS, and JavaScript with CodeMirror editor integration
- **Responsive Design**: CSS Grid layout with adjustable panels via JavaScript resizers
- **Real-time Preview**: iFrame sandbox with automatic content updates
- **Live Collaboration**: Firebase Realtime Database for synchronizing code between users
- **AI Integration**: Gemini 2.0 API for the intelligent coding assistant

## Usage Guide

### Basic Usage
1. Write HTML code in the HTML panel
2. Add CSS styles in the CSS panel
3. Write JavaScript in the JS panel
4. See the live output in the Output panel

### Saving and Loading
- Click the "Save" button to store your code locally
- Click "Load" to retrieve your previously saved code

### Sharing Your Code
- Click the "Share" button and select "Copy Link" to generate a shareable URL
- Select "Go Live" to enable real-time collaboration with others

### Collaborating with Others
1. Click "Share" and select "Go Live" to start a collaborative session
2. Share the generated link with collaborators
3. All connected users will see changes in real-time
4. The active session status is indicated by the "Live Session" badge

### Using the AI Assistant
1. Click the "PlayGround AI" button to open the chat interface
2. Type your coding question or request in the chat input
3. Receive intelligent assistance and code suggestions

## Browser Compatibility

- Chrome (recommended): Full support for all features
- Firefox: Full support
- Safari: Full support
- Edge: Full support
- Mobile browsers: Responsive support with adapted layout

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [CodeMirror](https://codemirror.net/) for the powerful code editor implementation
- [FontAwesome](https://fontawesome.com/) for the intuitive icons
- [Firebase](https://firebase.google.com/) for the real-time collaboration backend
- [Gemini API](https://ai.google.dev/) for powering the AI assistant
