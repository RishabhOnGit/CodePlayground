// Game state
let gameData = null;
let currentRealm = null;
let currentChallenge = null;
let editor = null;
let progress = {
    completedRealms: [],
    completedChallenges: {}
};

// Story elements
const storySegments = [
    // Realm 1: The Stone Guardian (1-5)
    "In the digital realm of Elyndor, where code is magic and algorithms shape reality, a young programmer begins their journey...",
    "The Stone Guardian stands before you, its ancient circuits pulsing with binary wisdom. 'Prove your understanding of numbers,' it commands...",
    "As you solve the Guardian's puzzles, the first glimmer of hope appears in the darkened realm...",
    "The Guardian's stone heart softens, revealing the first fragment of the corrupted code...",
    "With the Stone Guardian's blessing, you gain the power to manipulate numbers at will...",

    // Realm 2: Judgment of the Twin Rivers (6-10)
    "The Twin Rivers of Logic flow before you, their waters muddied by corrupted code...",
    "Ancient terminals rise from the riverbanks, awaiting your judgment on their values...",
    "Your decisions bring clarity to the murky waters, revealing hidden patterns...",
    "The rivers begin to flow in harmony, their binary currents merging perfectly...",
    "A bridge of pure code forms across the rivers, leading to the next challenge...",

    // Realm 3: Age of Decision (11-15)
    "The Age of Decision looms, where every choice shapes the future of Elyndor...",
    "Corrupted citizens wander the realm, their code altered by the darkness...",
    "Your logical judgments restore order to the chaotic realm...",
    "The citizens' code is purified, their functions returning to normal...",
    "The Age of Decision passes, leaving behind a realm of clear choices...",

    // Realm 4: Scroll of Grades (16-20)
    "The Scroll of Grades unfurls before you, its ancient algorithms waiting to be deciphered...",
    "Each grade you assign brings light to another corner of the darkened realm...",
    "The scroll's logic begins to make sense, revealing the path forward...",
    "Your understanding of conditions and loops grows with each challenge...",
    "The Scroll of Grades is fully restored, its wisdom now clear...",

    // Realm 5: The Whispering Word (21-25)
    "The final realm awaits, where words hold the power to shape reality...",
    "The Whispering Word echoes through the corrupted code, testing your pattern recognition...",
    "Each word you decipher weakens the darkness's hold on the realm...",
    "The final pieces of the corrupted code begin to align...",
    "With the last word deciphered, the path to the final battle is revealed..."
];

const finalBattleStory = `
    The Dark Dragon of Complexity awakens! Its scales shimmer with unsolved algorithms,
    its breath spews infinite loops, and its eyes glow with corrupted code. All your
    training has led to this moment. With your coding skills honed through 25 challenges,
    you stand ready to face the ultimate test. The fate of the Code Realms rests in
    your hands. As you approach, the dragon's code begins to compile, revealing its
    vulnerabilities. Your fingers fly across the keyboard, writing the perfect algorithm
    to defeat the beast. With one final execution, the dragon's code crashes, its
    corruption purged from the realm. Light returns to Elyndor, and the people crown
    you not only as their savior but as the Master Programmer—a beacon of hope who
    conquered not just bugs, but the very heart of computational darkness itself.
`;

// DOM Elements
const realmSelector = document.getElementById('realmSelector');
const realmTitle = document.getElementById('realmTitle');
const realmTheme = document.getElementById('realmTheme');
const realmStory = document.getElementById('realmStory');
const challengeTitle = document.getElementById('challengeTitle');
const challengePrompt = document.getElementById('challengePrompt');
const visibleTestCases = document.getElementById('visibleTestCases');
const languageSelect = document.getElementById('languageSelect');
const codeEditor = document.getElementById('codeEditor');
const runBtn = document.getElementById('runBtn');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');
const outputPanel = document.getElementById('outputPanel');
const progressBar = document.getElementById('progress');
const challengeList = document.getElementById('challengeList'); // ADDED: Ensure this exists in HTML
const toggleSidebar = document.getElementById('toggleSidebar');
const storySidebar = document.getElementById('storySidebar');
const storyContent = document.getElementById('storyContent');
const heroCard = document.getElementById('heroCard');
const closeCard = document.getElementById('closeCard');
const heroImage = document.getElementById('heroImage');
const heroTitle = document.getElementById('heroTitle');
const heroDescription = document.getElementById('heroDescription');

// Add this at the top with other state variables
let storyCardsState = {};

// Initialize the game
async function initGame() {
    try {
        const response = await fetch('game-data.json');
        gameData = await response.json();

        const savedProgress = localStorage.getItem('codeOfTheRealmsProgress');
        if (savedProgress) {
            progress = JSON.parse(savedProgress);
            // Sync story sections on game load
            syncStorySections();
        }

        // Initialize CodeMirror editor
        editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
            mode: 'python',
            theme: 'monokai',
            lineNumbers: true,
            indentUnit: 4,
            smartIndent: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            extraKeys: {
                "Tab": "indentMore",
                "Shift-Tab": "indentLess"
            },
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            foldGutter: true,
            styleActiveLine: true
        });

        // Set initial content
        editor.setValue('// Write your code here\n');

        setupEventListeners();
        renderRealmSelector();
        updateProgressBar();
    } catch (error) {
        console.error('Error initializing game:', error);
        outputPanel.innerHTML = '<div class="error">Error loading game data. Please try refreshing the page.</div>';
    }
}

// Event listeners
function setupEventListeners() {
    languageSelect.addEventListener('change', () => {
        const language = languageSelect.value;
        editor.setOption('mode', language === 'python' ? 'python' : 'text/x-csrc');
        // Clear editor and set appropriate comment style
        editor.setValue(language === 'python' ? '# Write your code here\n' : '// Write your code here\n');
    });

    runBtn.addEventListener('click', runCode);
    submitBtn.addEventListener('click', submitCode);
    clearBtn.addEventListener('click', () => {
        outputPanel.innerHTML = '';
    });
}

function renderRealmSelector() {
    realmSelector.innerHTML = '';

    gameData.realms.forEach((realm, index) => {
        const card = document.createElement('div');
        card.className = 'realm-card';

        const isLocked = index > 0 && !progress.completedRealms.includes(gameData.realms[index - 1].id);
        if (isLocked) card.classList.add('locked');
        if (progress.completedRealms.includes(realm.id)) card.classList.add('completed');
        if (currentRealm && currentRealm.id === realm.id) card.classList.add('active');

        card.innerHTML = `
            <h3>${realm.name}</h3>
            <p>${realm.title}</p>
        `;

        card.addEventListener('click', () => {
            if (!isLocked) selectRealm(realm);
        });

        realmSelector.appendChild(card);
    });
}

function selectRealm(realm) {
    currentRealm = realm;
    currentChallenge = null;

    realmTitle.textContent = realm.name;
    realmTheme.textContent = realm.theme;
    realmStory.textContent = realm.story;

    challengeTitle.textContent = 'Select a Challenge';
    challengePrompt.textContent = '';
    visibleTestCases.innerHTML = '';
    editor.setValue(''); // Clear editor
    languageSelect.innerHTML = ''; // Clear languages
    challengeList.innerHTML = ''; // Clear previous challenges

    renderRealmSelector();
    renderChallengeList(realm.challenges);
    
    // Sync story sections when realm changes
    syncStorySections();
}

function renderChallengeList(challenges) {
    challengeList.innerHTML = '';
    challenges.forEach((challenge, index) => {
        const challengeItem = document.createElement('div');
        challengeItem.className = 'challenge-item';
        
        // Check if challenge is completed
        const isCompleted = progress.completedChallenges[currentRealm.id]?.includes(challenge.id);
        if (isCompleted) {
            challengeItem.classList.add('completed');
            // Unlock the corresponding story section
            unlockStorySection(challenge.id);
        }
        
        if (currentChallenge && currentChallenge.id === challenge.id) {
            challengeItem.classList.add('active');
        }

        const challengeNumber = document.createElement('span');
        challengeNumber.className = 'challenge-number';
        if (isCompleted) {
            challengeNumber.classList.add('completed');
        }
        challengeNumber.textContent = `Question ${index + 1}`;

        const challengeTitle = document.createElement('span');
        challengeTitle.textContent = challenge.title;

        challengeItem.appendChild(challengeNumber);
        challengeItem.appendChild(challengeTitle);

        challengeItem.addEventListener('click', () => {
            selectChallenge(challenge);
            document.querySelectorAll('.challenge-item').forEach(item => {
                item.classList.remove('active');
            });
            challengeItem.classList.add('active');
        });

        challengeList.appendChild(challengeItem);
    });
}

function selectChallenge(challenge) {
    currentChallenge = challenge;
    
    // Update UI
    const challengeNumber = currentRealm.challenges.findIndex(c => c.id === challenge.id) + 1;
    challengeTitle.innerHTML = `
        <span class="challenge-number">Question ${challengeNumber}</span>
        ${challenge.title}
    `;
    challengePrompt.textContent = challenge.prompt;
    
    // Render test cases
    visibleTestCases.innerHTML = '';
    challenge.visibleTests.forEach(test => {
        const testCase = document.createElement('div');
        testCase.className = 'test-case';
        testCase.innerHTML = `
            <p><strong>Input:</strong> ${test.input}</p>
            <p><strong>Expected Output:</strong> ${test.output}</p>
        `;
        visibleTestCases.appendChild(testCase);
    });
    
    // Update language selector
    updateLanguageSelector(challenge.allowedLanguages);
}

function updateLanguageSelector(allowedLanguages) {
    languageSelect.innerHTML = '';
    // Only add Python and C options
    const languages = ['python', 'c'];
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
        languageSelect.appendChild(option);
    });
    editor.setOption('mode', getCodeMirrorMode(languages[0]));
}

async function runCode() {
    if (!currentChallenge) return;
    
    const code = editor.getValue();
    const language = languageSelect.value;
    
    try {
        let preparedCode = code;
        let stdin = '';
        
        if (language === 'c') {
            preparedCode = `
#include <stdio.h>
#include <stdlib.h>

int main() {
    ${code}
    return 0;
}
            `;
            stdin = currentChallenge.visibleTests[0].input;
        } else if (language === 'python') {
            preparedCode = code;
            stdin = currentChallenge.visibleTests[0].input;
        }
        
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language,
                version: '*',
                files: [{ content: preparedCode }],
                stdin
            })
        });
        
        const result = await response.json();
        
        let outputHTML = '<div class="output">';
        outputHTML += '<h4>Running your code...</h4>';
        
        if (result.run.stdout) {
            outputHTML += `
                <h4>Output:</h4>
                <pre>${result.run.stdout}</pre>
            `;
        }
        
        if (result.run.stderr) {
            outputHTML += `
                <h4>Errors:</h4>
                <pre class="error">${result.run.stderr}</pre>
            `;
        }
        
        if (!result.run.stdout && !result.run.stderr) {
            outputHTML += '<p>No output generated</p>';
        }
        
        outputHTML += '</div>';
        outputPanel.innerHTML = outputHTML;
        
    } catch (error) {
        console.error('Error running code:', error);
        outputPanel.innerHTML = `
            <div class="output">
                <h4>Error:</h4>
                <pre class="error">Error running code. Please try again.</pre>
            </div>
        `;
    }
}

async function submitCode() {
    if (!currentChallenge) return;

    const code = editor.getValue();
    const language = languageSelect.value;

    try {
        const visibleResults = await runTests(code, language, currentChallenge.visibleTests);
        if (visibleResults.passed) {
            const hiddenResults = await runTests(code, language, currentChallenge.hiddenTests);
            if (hiddenResults.passed) {
                markChallengeCompleted();
                outputPanel.innerHTML = `
                    <div class="success">
                        <h4>Congratulations!</h4>
                        <p>You have completed this challenge!</p>
                    </div>
                `;
            } else {
                outputPanel.innerHTML = `
                    <div class="error">
                        <h4>Hidden Tests Failed</h4>
                        <p>Your code passed the visible tests but failed some hidden tests.</p>
                        <p>Try to handle more edge cases!</p>
                    </div>
                `;
            }
        } else {
            outputPanel.innerHTML = `
                <div class="error">
                    <h4>Visible Tests Failed</h4>
                    <p>Your code failed some visible tests. Please check your implementation.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error submitting code:', error);
        outputPanel.innerHTML = '<div class="error">Error submitting code. Please try again.</div>';
    }
}

async function runTests(code, language, tests) {
    const results = { passed: true, failedTests: [] };
    
    // First, display the test cases
    let testCasesHTML = '<div class="test-results">';
    testCasesHTML += '<h4>Test Cases:</h4>';
    
    for (const test of tests) {
        testCasesHTML += `
            <div class="test-case">
                <p><strong>Input:</strong> ${test.input}</p>
                <p><strong>Expected Output:</strong> ${test.output}</p>
            </div>
        `;
    }
    testCasesHTML += '</div>';
    outputPanel.innerHTML = testCasesHTML;
    
    // Then run the tests
    for (const test of tests) {
        try {
            let preparedCode = code;
            let stdin = '';
            
            if (language === 'c') {
                // For C, we need to wrap the code in a proper main function
                preparedCode = `
#include <stdio.h>
#include <stdlib.h>

int main() {
    ${code}
    return 0;
}
                `;
                stdin = test.input;
            } else if (language === 'python') {
                // For Python, we'll use stdin for input
                preparedCode = code;
                stdin = test.input;
            }
            
            const response = await fetch('https://emkc.org/api/v2/piston/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language,
                    version: '*',
                    files: [{ content: preparedCode }],
                    stdin
                })
            });
            
            const result = await response.json();
            const output = (result.run.stdout || '').trim();
            
            // Update the test case display with actual result
            const testCaseElement = outputPanel.querySelector(`.test-case:nth-child(${tests.indexOf(test) + 2})`);
            if (testCaseElement) {
                testCaseElement.innerHTML += `<p><strong>Actual Output:</strong> ${output}</p>`;
                if (output === test.output) {
                    testCaseElement.classList.add('passed');
                } else {
                    testCaseElement.classList.add('failed');
                    results.passed = false;
                    results.failedTests.push({
                        input: test.input,
                        expected: test.output,
                        actual: output,
                        error: result.run.stderr
                    });
                }
            }
            
            if (result.run.stderr) {
                testCaseElement.innerHTML += `<p class="error"><strong>Error:</strong> ${result.run.stderr}</p>`;
            }
            
        } catch (error) {
            results.passed = false;
            results.failedTests.push({
                input: test.input,
                error: error.message
            });
            
            const testCaseElement = outputPanel.querySelector(`.test-case:nth-child(${tests.indexOf(test) + 2})`);
            if (testCaseElement) {
                testCaseElement.classList.add('error');
                testCaseElement.innerHTML += `<p class="error"><strong>Error:</strong> ${error.message}</p>`;
            }
        }
    }
    
    // Add summary
    const summaryHTML = `
        <div class="test-summary">
            <h4>Summary:</h4>
            <p>${results.passed ? 'All tests passed!' : 'Some tests failed.'}</p>
        </div>
    `;
    outputPanel.innerHTML += summaryHTML;
    
    return results;
}

function showCompletedStorySections() {
    // Get all completed challenges from progress
    const completedChallenges = Object.values(progress.completedChallenges).flat();
    
    // Show story sections for completed challenges
    completedChallenges.forEach(challengeId => {
        const storySection = document.querySelector(`.story-section[data-challenge="${challengeId}"]`);
        if (storySection) {
            storySection.classList.remove('locked');
            storySection.classList.add('unlocked');
        }
    });
}

function unlockStorySection(challengeId) {
    const storySection = document.querySelector(`.story-section[data-challenge="${challengeId}"]`);
    if (storySection) {
        storySection.classList.remove('locked');
        storySection.classList.add('unlocked');
    }
}

function showStoryCard(challengeId) {
    const storySection = document.querySelector(`.story-section[data-challenge="${challengeId}"]`);
    if (storySection) {
        const title = storySection.querySelector('.story-content h3').textContent;
        const content = storySection.querySelector('.story-content p').textContent;
        
        // Create and show the story card
        const storyCard = document.createElement('div');
        storyCard.className = 'story-card';
        storyCard.innerHTML = `
            <div class="story-card-content">
                <h3>${title}</h3>
                <p>${content}</p>
                <button class="close-story-card">&times;</button>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(storyCard);
        
        // Show with animation
        setTimeout(() => {
            storyCard.classList.add('active');
        }, 100);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            storyCard.classList.remove('active');
            setTimeout(() => {
                storyCard.remove();
            }, 500);
        }, 5000);
        
        // Close button functionality
        const closeBtn = storyCard.querySelector('.close-story-card');
        closeBtn.addEventListener('click', () => {
            storyCard.classList.remove('active');
            setTimeout(() => {
                storyCard.remove();
            }, 500);
        });
    }
}

function markChallengeCompleted() {
    if (!currentRealm || !currentChallenge) return;

    if (!progress.completedChallenges[currentRealm.id]) {
        progress.completedChallenges[currentRealm.id] = [];
    }

    if (!progress.completedChallenges[currentRealm.id].includes(currentChallenge.id)) {
        progress.completedChallenges[currentRealm.id].push(currentChallenge.id);
        localStorage.setItem('codeOfTheRealmsProgress', JSON.stringify(progress));
        
        // Unlock the story section
        const storySection = document.querySelector(`.story-section[data-challenge="${currentChallenge.id}"]`);
        if (storySection) {
            storySection.classList.remove('locked');
            storySection.classList.add('unlocked');
            
            // Show the story card on screen
            showStoryCard(currentChallenge.id);
        }
    }

    updateProgressBar();
    renderRealmSelector();
}

function updateProgressBar() {
    const totalChallenges = gameData.realms.reduce((sum, realm) => sum + realm.challenges.length, 0);
    const completedChallenges = Object.values(progress.completedChallenges).reduce((sum, c) => sum + c.length, 0);

    const progressPercentage = (completedChallenges / totalChallenges) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.textContent = `${Math.round(progressPercentage)}%`; // ADDED: show percentage
}

// Initialize story
function initStory() {
    toggleSidebar.addEventListener('click', () => {
        storySidebar.classList.toggle('active');
        // When story sidebar is opened, ensure all completed challenges are unlocked
        if (storySidebar.classList.contains('active')) {
            syncStorySections();
        }
    });

    // Load story cards state from localStorage
    const savedStoryState = localStorage.getItem('storyCardsState');
    if (savedStoryState) {
        storyCardsState = JSON.parse(savedStoryState);
    }

    // Initialize story cards based on saved state
    initializeStoryCards();
}

function initializeStoryCards() {
    const storySections = document.querySelectorAll('.story-section');
    storySections.forEach(section => {
        const challengeId = section.dataset.challenge;
        if (storyCardsState[challengeId]) {
            section.classList.remove('locked');
            section.classList.add('unlocked');
        }
    });
}

function showStorySegment(challengeId) {
    // Map challenge IDs to story segments
    const challengeToStoryMap = {
        // Realm 1: The Stone Guardian
        'stone-guardian-1': 0,
        'stone-guardian-2': 1,
        'stone-guardian-3': 2,
        'stone-guardian-4': 3,
        'stone-guardian-5': 4,
        
        // Realm 2: Judgment of the Twin Rivers
        'twin-rivers-1': 5,
        'twin-rivers-2': 6,
        'twin-rivers-3': 7,
        'twin-rivers-4': 8,
        'twin-rivers-5': 9,
        
        // Realm 3: Age of Decision
        'age-decision-1': 10,
        'age-decision-2': 11,
        'age-decision-3': 12,
        'age-decision-4': 13,
        'age-decision-5': 14,
        
        // Realm 4: Scroll of Grades
        'grades-1': 15,
        'grades-2': 16,
        'grades-3': 17,
        'grades-4': 18,
        'grades-5': 19,
        
        // Realm 5: The Whispering Word
        'whispering-1': 20,
        'whispering-2': 21,
        'whispering-3': 22,
        'whispering-4': 23,
        'whispering-5': 24
    };

    const segmentIndex = challengeToStoryMap[challengeId];
    if (segmentIndex === undefined) return;

    // Clear previous segments
    storyContent.innerHTML = '';

    // Show all segments up to the current one
    for (let i = 0; i <= segmentIndex; i++) {
        const segment = document.createElement('div');
        segment.className = 'story-content';
        segment.textContent = storySegments[i];
        
        storyContent.appendChild(segment);
        
        // Trigger animation with delay for each segment
        setTimeout(() => {
            segment.classList.add('visible');
        }, 100 * i);
    }
}

function showHeroCard(challenge) {
    // Set card content based on the completed challenge
    heroImage.src = getHeroImage(challenge.id);
    heroTitle.textContent = `Heroic Deed: ${challenge.title}`;
    heroDescription.textContent = getHeroDescription(challenge.id);
    
    // Show card with animation
    heroCard.classList.add('active');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        heroCard.classList.remove('active');
    }, 5000);
}

function getHeroImage(challengeId) {
    // Map challenge IDs to hero images
    const imageMap = {
        // Realm 1: The Whispering Woods
        'whispering-woods-1': 'images/hero-awakening.png',
        'whispering-woods-2': 'images/hero-forest.png',
        'whispering-woods-3': 'images/hero-shadows.png',
        'whispering-woods-4': 'images/hero-grove.png',
        'whispering-woods-5': 'images/hero-glade.png',
        
        // Realm 2: The Flooded Crypts
        'crypts-1': 'images/hero-echoes.png',
        'crypts-2': 'images/hero-ghoul.png',
        'crypts-3': 'images/hero-lanterns.png',
        'crypts-4': 'images/hero-sirens.png',
        'crypts-5': 'images/hero-crypt-king.png',
        
        // Realm 3: The Ember Peaks
        'ember-1': 'images/hero-flame.png',
        'ember-2': 'images/hero-magma.png',
        'ember-3': 'images/hero-forging.png',
        'ember-4': 'images/hero-ashen.png',
        'ember-5': 'images/hero-mountain.png',
        
        // Realm 4: The Frosted Vale
        'frost-1': 'images/hero-silence.png',
        'frost-2': 'images/hero-mirror.png',
        'frost-3': 'images/hero-spirits.png',
        'frost-4': 'images/hero-frostfang.png',
        'frost-5': 'images/hero-wyrm.png',
        
        // Realm 5: The Abyss of Shadows
        'abyss-1': 'images/hero-veil.png',
        'abyss-2': 'images/hero-echoes-fear.png',
        'abyss-3': 'images/hero-throne.png',
        'abyss-4': 'images/hero-roar.png',
        'abyss-5': 'images/hero-realmkeeper.png'
    };
    
    return imageMap[challengeId] || 'images/hero-default.png';
}

function getHeroDescription(challengeId) {
    // Map challenge IDs to hero descriptions
    const descriptions = {
        // Realm 1: The Whispering Woods
        'whispering-woods-1': 'You have awakened to your destiny as the chosen hero of the Whispering Woods.',
        'whispering-woods-2': 'The ancient trees whisper their secrets to you, guiding your path forward.',
        'whispering-woods-3': 'Your blade of logic cuts through the shadows, revealing the truth within.',
        'whispering-woods-4': 'The Enchanted Grove recognizes your pure heart and sharp mind.',
        'whispering-woods-5': 'The Keeper of the Glade bestows its blessing upon you, marking your first victory.',
        
        // Realm 2: The Flooded Crypts
        'crypts-1': 'You descend into the depths, uncovering the secrets of the Flooded Crypts.',
        'crypts-2': 'Your wisdom calms the Ghoul Tide, allowing safe passage through the waters.',
        'crypts-3': 'The Lanterns of the Lost shine once more, their spirits finding peace.',
        'crypts-4': 'You resist the Sirens\' call, maintaining your focus through the maze.',
        'crypts-5': 'The Crypt King falls before your might, his reign of terror ended.',
        
        // Realm 3: The Ember Peaks
        'ember-1': 'The scorching winds of the Ember Peaks test your resolve.',
        'ember-2': 'You outsmart the Magma Maw, proving your tactical brilliance.',
        'ember-3': 'The blacksmith spirit forges a powerful bond with you.',
        'ember-4': 'Your fiery trap defeats the wyverns, clearing the ashen skies.',
        'ember-5': 'The Fire Warden yields to your power, granting you the Ember Sigil.',
        
        // Realm 4: The Frosted Vale
        'frost-1': 'You brave the frozen silence of the Frosted Vale.',
        'frost-2': 'The Mirror Lake reveals its secrets to your keen mind.',
        'frost-3': 'You decode the sorrow of the Snowbound Spirits, setting them free.',
        'frost-4': 'Your traps and tactics outwit the Frostfang pack.',
        'frost-5': 'The Ice Wyrm\'s curse is shattered by your skill and flame.',
        
        // Realm 5: The Abyss of Shadows
        'abyss-1': 'The Veil falls as you enter the Abyss of Shadows.',
        'abyss-2': 'You conquer your fears, defeating the dark doppelgängers.',
        'abyss-3': 'The Forgotten Throne\'s code is restored by your hand.',
        'abyss-4': 'The dragon\'s final roar echoes through the Abyss.',
        'abyss-5': 'You rise as the Realmkeeper, protector of logic, wisdom, and peace.'
    };
    
    return descriptions[challengeId] || 'You have completed another challenge in your quest.';
}

function showFinalBattle() {
    const finalSegment = document.createElement('div');
    finalSegment.className = 'story-content final-battle';
    finalSegment.textContent = finalBattleStory;
    
    storyContent.appendChild(finalSegment);
    
    // Trigger animation
    setTimeout(() => {
        finalSegment.classList.add('visible');
    }, 100);
}

// Initialize story when the game starts
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    initStory();
});

// Add this to your existing styles
const style = document.createElement('style');
style.textContent = `
    @keyframes unlockStory {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Add this function to clear story cards state if needed
function clearStoryCardsState() {
    storyCardsState = {};
    localStorage.removeItem('storyCardsState');
    const storySections = document.querySelectorAll('.story-section');
    storySections.forEach(section => {
        section.classList.add('locked');
        section.classList.remove('unlocked');
    });
}

function checkAndUnlockStorySections() {
    // Get all completed challenges from progress
    const completedChallenges = Object.values(progress.completedChallenges).flat();
    
    // Unlock story sections for completed challenges
    completedChallenges.forEach(challengeId => {
        const storySection = document.querySelector(`.story-section[data-challenge="${challengeId}"]`);
        if (storySection) {
            storySection.classList.remove('locked');
            storySection.classList.add('unlocked');
        }
    });
}

function syncStorySections() {
    // Get all story sections
    const storySections = document.querySelectorAll('.story-section');
    
    // For each story section, check if its challenge is completed
    storySections.forEach(section => {
        const challengeId = section.dataset.challenge;
        // Check if this challenge is completed in any realm
        const isCompleted = Object.values(progress.completedChallenges).some(
            challenges => challenges.includes(challengeId)
        );
        
        if (isCompleted) {
            section.classList.remove('locked');
            section.classList.add('unlocked');
        } else {
            section.classList.add('locked');
            section.classList.remove('unlocked');
        }
    });
}
