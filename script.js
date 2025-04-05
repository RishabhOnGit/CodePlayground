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

function typeEffect() {
    if (charIndex < textArray[textIndex].length && isTyping) {
        typingText.textContent = textArray[textIndex].substring(0, charIndex + 1);
        charIndex++;
        setTimeout(typeEffect, typingSpeed);
    } else {
        isTyping = false;
        setTimeout(eraseEffect, 2000);
    }
}

function eraseEffect() {
    if (charIndex > 0 && !isTyping) {
        typingText.textContent = textArray[textIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(eraseEffect, erasingSpeed);
    } else {
        isTyping = true;
        textIndex = (textIndex + 1) % textArray.length;
        setTimeout(typeEffect, 500);
    }
}

// Blinking Cursor Effect
setInterval(() => {
    if (!isTyping) {
        typingText.style.borderRight = "3px solid white";
    } else {
        typingText.style.borderRight = "3px solid transparent";
    }
}, 500);

// Start the typing effect
typeEffect();

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
