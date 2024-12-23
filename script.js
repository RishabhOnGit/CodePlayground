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

// Share code by generating a URL
document.getElementById('share-button').addEventListener('click', () => {
  const code = {
    html: htmlEditor.getValue(),
    css: cssEditor.getValue(),
    js: jsEditor.getValue(),
  };
  try {
    const encodedCode = encodeURIComponent(JSON.stringify(code));
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${encodedCode}`;
    navigator.clipboard.writeText(shareUrl).then(() => showNotification('Share URL copied to clipboard!'));
  } catch (error) {
    showNotification('Failed to share code!');
  }
});

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
