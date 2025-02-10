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
  notification.innerHTML = message;
  notification.style.display = 'block';
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
    notification.style.display = 'none';
  }, 2000);
}

// Save code to localStorage
document.getElementById('save-button').addEventListener('click', () => {
  const code = {
    html: htmlEditor.getValue(),
    css: cssEditor.getValue(),
    js: jsEditor.getValue(),
  };
  try {
    localStorage.setItem('savedCode', JSON.stringify(code));
    showNotification('Code saved!');
  } catch (error) {
    showNotification('Failed to save code!');
  }
});

// Load code from localStorage
document.getElementById('load-button').addEventListener('click', () => {
  const savedCode = localStorage.getItem('savedCode');
  if (savedCode) {
    try {
      const code = JSON.parse(savedCode);
      htmlEditor.setValue(code.html);
      cssEditor.setValue(code.css);
      jsEditor.setValue(code.js);
      updateOutput();
      showNotification('Code loaded!');
    } catch (error) {
      showNotification('Failed to load code!');
    }
  } else {
    showNotification('No saved code found.');
  }
});

// Share code by generating a URL and shortening it with TinyURL
document.getElementById('share-button').addEventListener('click', () => {
  const code = {
    html: htmlEditor.getValue(),
    css: cssEditor.getValue(),
    js: jsEditor.getValue(),
  };

  try {
    // Create the long URL with the shared code
    const encodedCode = encodeURIComponent(JSON.stringify(code));
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${encodedCode}`;

    // Now shorten the URL using TinyURL API
    shortenUrl(shareUrl);
  } catch (error) {
    showNotification('Failed to share code!');
  }
});

// Function to shorten the URL using TinyURL API
function shortenUrl(longUrl) {
  const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;

  // Call TinyURL API to shorten the URL
  fetch(apiUrl)
    .then(response => response.text())  // The response will be the shortened URL
    .then(shortUrl => {
      console.log('Shortened URL:', shortUrl);  // Log the shortened URL (optional)
      navigator.clipboard.writeText(shortUrl).then(() => showNotification('Shortened URL copied to clipboard!'));
    })
    .catch(error => {
      console.error('Error shortening URL:', error);
      showNotification('Failed to shorten URL.');
    });
}

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
});


// chat bot code
<script>
document.addEventListener("DOMContentLoaded", function () {
    const chatButton = document.getElementById("chat-toggle");
    const chatContainer = document.getElementById("chat-container");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input-field");
    const sendButton = document.getElementById("send-button");
    const closeButton = document.getElementById("close-chat");

    // API Key for Gemini AI (Replace with your valid key or use text-bison)
    const API_KEY = "AIzaSyAORqFn8vpS9Z655pneoWj3skFmFUEqlXI";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    // Toggle Chatbox Visibility with Animation
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

        if (sender === "user") {
            messageDiv.style.alignSelf = "flex-end";
        }

        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Send Message Function
    function sendMessage() {
        const userInput = chatInput.value.trim();
        if (userInput === "") return;

        // User's message
        appendMessage("user", userInput);
        chatInput.value = ""; // Clear input field

        // Show Bot "Thinking..." Message
        const thinkingMessage = document.createElement("div");
        thinkingMessage.className = "message bot";
        thinkingMessage.textContent = "🤔 Thinking...";
        chatBody.appendChild(thinkingMessage);
        chatBody.scrollTop = chatBody.scrollHeight;

        // Call Gemini API (take inspiration from your working snippet)
        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { 
                        parts: [
                            { text: userInput }
                        ]
                    }
                ]
            })
        })
        .then(response => response.json())
        .then(data => {
            // Remove the thinking message
            thinkingMessage.remove();

            // Check if the model returned any text
            if (
                data.candidates &&
                data.candidates[0].content &&
                data.candidates[0].content.parts &&
                data.candidates[0].content.parts[0].text
            ) {
                const botResponse = data.candidates[0].content.parts[0].text;
                appendMessage("bot", botResponse);
            } else {
                appendMessage("bot", "❌ Error: No response from AI.");
            }
        })
        .catch(error => {
            console.error("API Error:", error);
            thinkingMessage.remove();
            appendMessage("bot", "❌ Network Error: Failed to connect.");
        });
    }

    // Send Message on Button Click
    sendButton.addEventListener("click", sendMessage);

    // Send Message on Enter Key
    chatInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
});
</script>
