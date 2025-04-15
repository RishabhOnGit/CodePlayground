// Game state
let gameData = null;
let currentRealm = null;
let currentChallenge = null;
let editor = null;
let progress = {
    completedRealms: [],
    completedChallenges: {}
};

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

// Initialize the game
async function initGame() {
    try {
        const response = await fetch('game-data.json');
        gameData = await response.json();

        const savedProgress = localStorage.getItem('codeOfTheRealmsProgress');
        if (savedProgress) {
            progress = JSON.parse(savedProgress);
        }

        editor = CodeMirror.fromTextArea(codeEditor, {
            mode: 'python',
            theme: 'monokai',
            lineNumbers: true,
            indentUnit: 4,
            smartIndent: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            matchBrackets: true
        });

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
        editor.setOption('mode', getCodeMirrorMode(language));
    });

    runBtn.addEventListener('click', runCode);
    submitBtn.addEventListener('click', submitCode);
    clearBtn.addEventListener('click', () => {
        outputPanel.innerHTML = '';
    });
}

function getCodeMirrorMode(language) {
    switch (language) {
        case 'python':
            return 'python';
        case 'c':
            return 'text/x-csrc';
        default:
            return 'python'; // Default to Python if somehow an invalid language is selected
    }
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

    // Render challenge list
    renderChallengeList(realm.challenges);
}

function renderChallengeList(challenges) {
    challengeList.innerHTML = '';
    challenges.forEach((challenge, index) => {
        const challengeItem = document.createElement('div');
        challengeItem.className = 'challenge-item';
        if (progress.completedChallenges[currentRealm.id]?.includes(challenge.id)) {
            challengeItem.classList.add('completed');
        }
        if (currentChallenge && currentChallenge.id === challenge.id) {
            challengeItem.classList.add('active');
        }

        const challengeNumber = document.createElement('span');
        challengeNumber.className = 'challenge-number';
        if (progress.completedChallenges[currentRealm.id]?.includes(challenge.id)) {
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

function markChallengeCompleted() {
    if (!currentRealm || !currentChallenge) return;

    if (!progress.completedChallenges[currentRealm.id]) {
        progress.completedChallenges[currentRealm.id] = [];
    }

    if (!progress.completedChallenges[currentRealm.id].includes(currentChallenge.id)) {
        progress.completedChallenges[currentRealm.id].push(currentChallenge.id);
        localStorage.setItem('codeOfTheRealmsProgress', JSON.stringify(progress));
        
        // Update the UI to show the challenge as completed
        const challengeItems = document.querySelectorAll('.challenge-item');
        challengeItems.forEach(item => {
            const challengeTitle = item.querySelector('span:not(.challenge-number)');
            if (challengeTitle && challengeTitle.textContent === currentChallenge.title) {
                item.classList.add('completed');
                const numberBadge = item.querySelector('.challenge-number');
                if (numberBadge) {
                    numberBadge.classList.add('completed');
                }
            }
        });
    }

    // Check if all challenges in the realm are completed
    const allChallengesCompleted = currentRealm.challenges.every(challenge => 
        progress.completedChallenges[currentRealm.id]?.includes(challenge.id)
    );

    if (allChallengesCompleted && !progress.completedRealms.includes(currentRealm.id)) {
        progress.completedRealms.push(currentRealm.id);
        localStorage.setItem('codeOfTheRealmsProgress', JSON.stringify(progress));
        renderRealmSelector();
    }

    updateProgressBar();
}

function updateProgressBar() {
    const totalChallenges = gameData.realms.reduce((sum, realm) => sum + realm.challenges.length, 0);
    const completedChallenges = Object.values(progress.completedChallenges).reduce((sum, c) => sum + c.length, 0);

    const progressPercentage = (completedChallenges / totalChallenges) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.textContent = `${Math.round(progressPercentage)}%`; // ADDED: show percentage
}

document.addEventListener('DOMContentLoaded', initGame);
