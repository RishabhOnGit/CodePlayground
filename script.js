// GitHub Authentication Logic
// Check if user is already authenticated with GitHub
document.addEventListener('DOMContentLoaded', function() {
    checkGitHubAuth();

    // Add event listener for GitHub login button
    document.getElementById("github-login").addEventListener("click", function() {
        initiateGithubLogin();
    });
    
    // Add event listener for logout button
    document.getElementById("logout-button").addEventListener("click", function() {
        logoutFromGithub();
    });
});

// Function to check GitHub authentication status
function checkGitHubAuth() {
    if (isGithubLoggedIn()) {
        // User is logged in - show the main buttons and user info
        document.getElementById("github-login").classList.add("hidden");
        document.getElementById("user-info").classList.remove("hidden");
        document.getElementById("main-buttons").classList.remove("hidden");
        
        // Try to fetch user info (in a real app)
        // This is simplified for demo purposes
        displayUserInfo();
        
        // Check if user is an admin
        checkIfAdmin();
    } else {
        // User is not logged in - show login button, hide main buttons
        document.getElementById("github-login").classList.remove("hidden");
        document.getElementById("user-info").classList.add("hidden");
        document.getElementById("main-buttons").classList.add("hidden");
        
        // Hide admin button
        const adminButton = document.getElementById("admin-button");
        if (adminButton) {
            adminButton.classList.add("hidden");
        }
    }
}

// Function to display user info
function displayUserInfo() {
    // Get username and avatar from localStorage if available
    const username = localStorage.getItem('github_user_name') || "GitHub User";
    const avatarUrl = localStorage.getItem('github_user_avatar') || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
    
    document.getElementById("user-name").textContent = username;
    document.getElementById("user-avatar").src = avatarUrl;
}

// Function to handle logout
function logoutFromGithub() {
    // Clear GitHub authentication data
    localStorage.removeItem('github_access_token');
    localStorage.removeItem('github_login_time');
    
    // Update UI
    checkGitHubAuth();
}

// Start Button Event Listeners (existing code)
document.getElementById("start-button").addEventListener("click", function() {
  // Show transition overlay
  const overlay = document.querySelector(".transition-overlay");
  overlay.classList.add("fade-out");
  
  // Animate content out
  const landingContainer = document.querySelector(".landing-container");
  landingContainer.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  landingContainer.style.opacity = "0";
  landingContainer.style.transform = "scale(0.95)";
  
  // Create animated code elements for transition
  setTimeout(() => {
    createAnimatedElements();
  }, 300);

  // Navigate after animation completes
  setTimeout(() => {
    // Use the playground.html?fromLanding=true parameter to trigger welcome animation
    window.location.href = "playground.html?fromLanding=true";
  }, 1500);
});

// Add event listener for the language button
document.getElementById("language-button").addEventListener("click", function() {
  // Show transition overlay
  const overlay = document.querySelector(".transition-overlay");
  overlay.classList.add("fade-out");
  
  // Animate content out
  const landingContainer = document.querySelector(".landing-container");
  landingContainer.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  landingContainer.style.opacity = "0";
  landingContainer.style.transform = "scale(0.95)";
  
  // Create animated code elements for transition
  setTimeout(() => {
    createAnimatedElements(['def main():', '#include <stdio.h>', 'print()', 'printf()', 'int main()', 'class', 'import']);
  }, 300);

  // Navigate after animation completes
  setTimeout(() => {
    // Use the language.html?fromLanding=true parameter to trigger welcome animation
    window.location.href = "language.html?fromLanding=true";
  }, 1500);
});

// Create animated code elements during transition
function createAnimatedElements(customSymbols) {
  const overlay = document.querySelector(".transition-overlay");
  
  // Create code-like symbols that float around during transition
  const symbols = customSymbols || ['<div>', '</div>', '{...}', '()', '[]', '/* */', '=>'];
  
  for (let i = 0; i < 15; i++) {
    const symbol = document.createElement('div');
    symbol.className = 'transition-symbol';
    symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    symbol.style.position = 'absolute';
    symbol.style.color = 'rgba(255, 255, 255, 0.15)';
    symbol.style.fontSize = `${Math.random() * 16 + 12}px`;
    symbol.style.left = `${Math.random() * 100}%`;
    symbol.style.top = `${Math.random() * 100}%`;
    symbol.style.transform = `rotate(${Math.random() * 40 - 20}deg)`;
    symbol.style.animation = `float ${Math.random() * 4 + 3}s infinite ease-in-out`;
    
    overlay.appendChild(symbol);
  }
}

// Typing Effect with Blinking Cursor
const typingText = document.getElementById("typing-text");
const textArray = ["Write, Edit, & Execute Code!", "A Code Editor for Web Developers.", "Your Playground for Creativity!"];
let textIndex = 0;
let charIndex = 0;
let typingSpeed = 100;
let erasingSpeed = 50;
let isTyping = true;

// Function to adjust text based on screen size
function adjustTextForScreenSize() {
    const windowWidth = window.innerWidth;
    
    // Simplify the text on smaller screens
    if (windowWidth <= 480) {
        textArray[1] = "Code Editor for Developers.";
    } else {
        textArray[1] = "A Code Editor for Web Developers.";
    }
    
    // Adjust typing speed on mobile for better experience
    if (windowWidth <= 768) {
        typingSpeed = 80;
        erasingSpeed = 40;
    } else {
        typingSpeed = 100;
        erasingSpeed = 50;
    }
}

// Run the adjustment initially and on resize
adjustTextForScreenSize();
window.addEventListener('resize', adjustTextForScreenSize);

// Implement a more stable blinking cursor
function setupCursor() {
    if (!typingText) return;
    
    // Find the wrapper element
    const wrapper = document.getElementById('typing-text-wrapper');
    if (!wrapper) return;
    
    // Remove the border-right style from the element itself
    typingText.style.borderRight = 'none';
    
    // Create a separate cursor element
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.innerHTML = '|';
    cursor.style.marginLeft = '2px';
    cursor.style.fontWeight = '300';
    cursor.style.animation = 'blink-caret 0.8s infinite';
    
    // Insert the cursor after the typing text element
    wrapper.appendChild(cursor);
    
    // Add this style to the head
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes blink-caret {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        #typing-text {
            display: inline;
            white-space: nowrap;
            overflow: hidden;
            min-height: 1.6em;
            vertical-align: bottom;
        }
        #typing-text-wrapper {
            display: inline-block;
            text-align: center;
            min-width: 280px;
        }
        .typing-cursor {
            display: inline-block;
            color: white;
            font-size: 1.2em;
            line-height: 1;
            animation: blink-caret 0.8s infinite;
        }
    `;
    document.head.appendChild(style);
}

// Calculate the widest text to set a fixed width
function setFixedWidth() {
    const wrapper = document.getElementById('typing-text-wrapper');
    if (!wrapper || !typingText) return;
    
    // Create a temporary span to measure text width
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'nowrap';
    tempSpan.style.font = window.getComputedStyle(typingText).font;
    tempSpan.style.fontSize = window.getComputedStyle(typingText).fontSize;
    document.body.appendChild(tempSpan);

    // Find the widest text
    let maxWidth = 0;
    textArray.forEach(text => {
        tempSpan.textContent = text;
        const width = tempSpan.offsetWidth;
        if (width > maxWidth) maxWidth = width;
    });

    // Add a small buffer for cursor
    maxWidth += 30;

    // Set fixed width on the wrapper, not the text itself
    wrapper.style.width = maxWidth + 'px';
    
    // Also set min-width to prevent shrinking
    wrapper.style.minWidth = maxWidth + 'px';
    
    // Clean up
    document.body.removeChild(tempSpan);
}

function typeEffect() {
    if (!typingText) return;
    
    if (charIndex < textArray[textIndex].length && isTyping) {
        typingText.textContent = textArray[textIndex].substring(0, charIndex + 1);
        charIndex++;
        setTimeout(typeEffect, typingSpeed);
    } else {
        isTyping = false;
        setTimeout(eraseEffect, 2000); // Pause before erasing
    }
}

function eraseEffect() {
    if (!typingText) return;
    
    if (charIndex > 0 && !isTyping) {
        typingText.textContent = textArray[textIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(eraseEffect, erasingSpeed);
    } else {
        isTyping = true;
        textIndex = (textIndex + 1) % textArray.length;
        setTimeout(typeEffect, 500); // Pause before typing new text
    }
}

// Initialize typing effect - replace with a simpler function to avoid conflicts
function initTypingEffect() {
    // Setup the cursor
    setupCursor();
    
    // Calculate and set fixed width after a short delay to ensure styles are applied
    setTimeout(() => {
        setFixedWidth();
        // Start typing after width is set
        setTimeout(typeEffect, 500);
    }, 100);
}

// Start the typing effect
document.addEventListener('DOMContentLoaded', initTypingEffect);

// Clear any existing typing intervals to avoid conflicts
function clearTypingEffects() {
    // Clear any potential existing intervals
    const highestId = window.setTimeout(() => {}, 0);
    for (let i = 0; i < highestId; i++) {
        window.clearTimeout(i);
    }
}

// Replace the old typing effect function with a no-op to avoid conflicts
function typingEffect() { 
    // This is the old typing effect function that is called elsewhere
    // Replace it with a no-op that delegates to our new implementation
    if (document.getElementById("typing-text")) {
        clearTypingEffects();
        initTypingEffect();
    }
}

// Add touch support for mobile devices
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card');
    
    // Add touch event listeners to all cards
    cards.forEach(card => {
        // Add active class on touch start to simulate hover effect
        card.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        
        // Remove active class on touch end
        card.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        });
        
        // Remove active class if touch is moved away
        card.addEventListener('touchmove', function() {
            this.classList.remove('touch-active');
        });
    });
});

// Also handle orientation change which is common on mobile
window.addEventListener('orientationchange', function() {
    setTimeout(adjustTextForScreenSize, 200);
});

// Function to check if user is an admin
function checkIfAdmin() {
    // Get username from localStorage
    const username = localStorage.getItem('github_user_name');
    if (!username) return;
    
    console.log("Checking admin status for:", username);
    
    // First check if admin flag is set in localStorage
    if (localStorage.getItem('isAdmin') === 'true') {
        console.log("Admin status found in localStorage");
        // Show admin button in user info
        const adminPanelBtn = document.getElementById("admin-panel-btn");
        if (adminPanelBtn) {
            adminPanelBtn.classList.remove("hidden");
        }
        return;
    }
    
    // Check in Firebase if user is an admin
    if (typeof firebase !== 'undefined' && firebase.database) {
        console.log("Checking admin status in Firebase...");
        const database = firebase.database();
        database.ref('admins').child(username).once('value', snapshot => {
            console.log("Firebase admin check result:", snapshot.exists());
            
            if (snapshot.exists()) {
                // User is an admin, show admin button in user info
                console.log("User is confirmed admin in Firebase");
                
                const adminPanelBtn = document.getElementById("admin-panel-btn");
                if (adminPanelBtn) {
                    adminPanelBtn.classList.remove("hidden");
                    console.log("Admin button displayed");
                }
                
                // Set admin flag in localStorage for future reference
                localStorage.setItem('isAdmin', 'true');
            } else {
                // Not an admin, keep button hidden
                console.log("User is not an admin in Firebase");
                
                const adminPanelBtn = document.getElementById("admin-panel-btn");
                if (adminPanelBtn) {
                    adminPanelBtn.classList.add("hidden");
                }
                
                // Clear admin flag if it was set
                localStorage.removeItem('isAdmin');
            }
        }).catch(error => {
            console.error("Error checking admin status:", error);
        });
    } else {
        console.warn("Firebase not available for admin check");
    }
}

// Typing effect for the slogan
function typingEffect() {
    const text = "Create, experiment, and share your code in real-time.";
    const typingElement = document.getElementById("typing-text");
    let i = 0;
    
    const typing = setInterval(function() {
        if (i < text.length) {
            typingElement.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(typing);
        }
    }, 50);
}

// Handle navigation
function handleNavigation() {
    document.getElementById("start-button").addEventListener("click", function() {
        // Fade out animation
        document.querySelector(".transition-overlay").classList.add("fade-in");
        
        // Navigate after animation completes
        setTimeout(function() {
            window.location.href = "playground.html";
        }, 500);
    });

    document.getElementById("language-button").addEventListener("click", function() {
        // Fade out animation
        document.querySelector(".transition-overlay").classList.add("fade-in");
        
        // Navigate after animation completes
        setTimeout(function() {
            window.location.href = "language.html";
        }, 500);
    });
}

// Handle GitHub login
function handleGitHubAuth() {
    // Login button click handler
    document.getElementById("github-login").addEventListener("click", function() {
        // Redirect to GitHub OAuth
        window.location.href = getGithubAuthUrl();
    });
    
    // Logout button click handler
    document.getElementById("logout-button").addEventListener("click", function() {
        // Clear localStorage
        localStorage.removeItem("github_access_token");
        localStorage.removeItem("github_user_name");
        localStorage.removeItem("github_user_avatar");
        localStorage.removeItem("github_login_time");
        localStorage.removeItem("github_user_login");
        
        // Refresh page
        window.location.reload();
    });
    
    // Check if we just got back from GitHub OAuth (check for code in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // Remove code from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        window.history.replaceState({}, document.title, url.toString());
        
        // Now check auth status which should be set by the callback page
        setTimeout(checkGitHubAuth, 100);
    } else {
        // Normal flow, just check auth status
        checkGitHubAuth();
    }
}

// Track page view
function trackPageView() {
    // Only track if Firebase is available and user is logged in
    if (typeof firebase === 'undefined' || !isGithubLoggedIn()) {
        return;
    }
    
    const userName = localStorage.getItem('github_user_name');
    const userAvatar = localStorage.getItem('github_user_avatar');
    
    // Only track if we have user info
    if (!userName) return;
    
    const database = firebase.database();
    
    // Log home page view
    database.ref('pageViews').push({
        userName: userName,
        userAvatar: userAvatar,
        pageType: 'home',
        timestamp: Date.now()
    });
    
    // Update user record or create if doesn't exist
    database.ref('users').child(userName).once('value', snapshot => {
        if (snapshot.exists()) {
            // Update existing user
            database.ref('users').child(userName).update({
                lastActive: Date.now(),
                lastPage: 'home'
            });
        } else {
            // Create new user
            database.ref('users').child(userName).set({
                name: userName,
                avatarUrl: userAvatar,
                github: localStorage.getItem('github_user_login'),
                firstSeen: Date.now(),
                lastActive: Date.now(),
                lastPage: 'home',
                projectCount: 0
            });
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    // Initialize typing effect
    typingEffect();
    
    // Initialize navigation
    handleNavigation();
    
    // Initialize GitHub auth
    handleGitHubAuth();
    
    // Track page view if applicable
    trackPageView();
});
