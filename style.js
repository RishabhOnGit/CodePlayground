document.getElementById("start-button").addEventListener("click", function () {
  document.querySelector(".transition-overlay").classList.add("fade-out");

  setTimeout(() => {
      window.location.href = "playground.html";
  }, 1000);
});

// Typing Effect with Blinking Cursor
const typingText = document.getElementById("typing-text");
const textArray = ["Write, Edit, & Execute Code!", "A Code Editor for Web Developers.", "Your Playground for Creativity!"];
let textIndex = 0;
let charIndex = 0;
let typingSpeed = 100;
let erasingSpeed = 50;
let isTyping = true;

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

typeEffect();
