// Story collection state
let storyCollection = [];
let currentFilter = 'all';

// Realm mapping with proper names and themes
const realmMapping = {
    'whispering-woods': {
        name: 'The Whispering Woods',
        theme: 'Nature and Logic',
        description: 'A mystical forest where ancient trees whisper the secrets of programming.'
    },
    'crypts': {
        name: 'The Flooded Crypts',
        theme: 'Depth and Mystery',
        description: 'Submerged ruins where forgotten algorithms lie waiting to be rediscovered.'
    },
    'ember': {
        name: 'The Ember Peaks',
        theme: 'Fire and Passion',
        description: 'Volcanic mountains where code burns with the intensity of molten rock.'
    },
    'frost': {
        name: 'The Frosted Vale',
        theme: 'Ice and Precision',
        description: 'A frozen valley where every line of code must be perfect and precise.'
    },
    'abyss': {
        name: 'The Abyss of Shadows',
        theme: 'Darkness and Mastery',
        description: 'The final challenge where only the most skilled programmers dare to venture.'
    }
};

// Story descriptions mapping
const storyDescriptions = {
    // Realm 1: The Whispering Woods
    'whispering-woods-1': 'You have awakened to your destiny as the chosen hero of the Whispering Woods. The ancient trees whisper their secrets to you, guiding your path forward.',
    'whispering-woods-2': 'The Stone Guardian stands before you, its ancient circuits pulsing with binary wisdom. "Prove your understanding of numbers," it commands.',
    'whispering-woods-3': 'As you solve the Guardian\'s puzzles, the first glimmer of hope appears in the darkened realm. The trees begin to glow with renewed energy.',
    'whispering-woods-4': 'The Guardian\'s stone heart softens, revealing the first fragment of the corrupted code. The forest creatures gather to witness your triumph.',
    'whispering-woods-5': 'With the Stone Guardian\'s blessing, you gain the power to manipulate numbers at will. The Whispering Woods celebrates your victory.',
    
    // Realm 2: The Flooded Crypts
    'crypts-1': 'You descend into the depths of the Flooded Crypts, where ancient algorithms lie submerged in the murky waters.',
    'crypts-2': 'The Twin Rivers of Logic flow before you, their waters muddied by corrupted code. Your decisions bring clarity to the murky waters.',
    'crypts-3': 'Ancient terminals rise from the riverbanks, awaiting your judgment on their values. The rivers begin to flow in harmony.',
    'crypts-4': 'Your wisdom calms the Ghoul Tide, allowing safe passage through the waters. The Lanterns of the Lost shine once more.',
    'crypts-5': 'The Crypt King falls before your might, his reign of terror ended. A bridge of pure code forms across the rivers.',
    
    // Realm 3: The Ember Peaks
    'ember-1': 'The scorching winds of the Ember Peaks test your resolve. The Magma Maw awaits your challenge.',
    'ember-2': 'You outsmart the Magma Maw, proving your tactical brilliance. The blacksmith spirit forges a powerful bond with you.',
    'ember-3': 'The blacksmith spirit teaches you the art of crafting perfect algorithms. Your code burns with the intensity of molten rock.',
    'ember-4': 'Your fiery trap defeats the wyverns, clearing the ashen skies. The Fire Warden watches with approval.',
    'ember-5': 'The Fire Warden yields to your power, granting you the Ember Sigil. The peaks glow with the light of your success.',
    
    // Realm 4: The Frosted Vale
    'frost-1': 'You brave the frozen silence of the Frosted Vale. The Mirror Lake reflects your determination.',
    'frost-2': 'The Mirror Lake reveals its secrets to your keen mind. The Snowbound Spirits begin to stir.',
    'frost-3': 'You decode the sorrow of the Snowbound Spirits, setting them free. The Frostfang pack watches from the shadows.',
    'frost-4': 'Your traps and tactics outwit the Frostfang pack. The Ice Wyrm awakens from its slumber.',
    'frost-5': 'The Ice Wyrm\'s curse is shattered by your skill and flame. The vale thaws, revealing its true beauty.',
    
    // Realm 5: The Abyss of Shadows
    'abyss-1': 'The Veil falls as you enter the Abyss of Shadows. Dark doppelgängers await your challenge.',
    'abyss-2': 'You conquer your fears, defeating the dark doppelgängers. The Forgotten Throne beckons.',
    'abyss-3': 'The Forgotten Throne\'s code is restored by your hand. The dragon stirs in the depths.',
    'abyss-4': 'The dragon\'s final roar echoes through the Abyss. The final battle approaches.',
    'abyss-5': 'You rise as the Realmkeeper, protector of logic, wisdom, and peace. The realms are saved.'
};

// DOM Elements
const storyGrid = document.getElementById('storyGrid');
const emptyState = document.getElementById('emptyState');
const syncStatus = document.getElementById('syncStatus');
const filterButtons = document.querySelectorAll('.filter-btn');

// Initialize the story collection
async function initStoryCollection() {
    try {
        // Load saved stories from localStorage
        const savedStories = localStorage.getItem('storyCollection');
        if (savedStories) {
            storyCollection = JSON.parse(savedStories);
        }

        // Set up event listeners
        setupEventListeners();

        // Initial render
        renderStoryCollection();

        // Set up sync with main game
        setupSync();
    } catch (error) {
        console.error('Error initializing story collection:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.realm;
            renderStoryCollection();
        });
    });
}

// Set up sync with main game
function setupSync() {
    // Listen for storage events from main game
    window.addEventListener('storage', async (event) => {
        if (event.key === 'storyCollection') {
            showSyncStatus();
            await updateStoryCollection();
            hideSyncStatus();
        }
    });

    // Check for updates every 5 seconds
    setInterval(async () => {
        const savedStories = localStorage.getItem('storyCollection');
        if (savedStories && JSON.stringify(storyCollection) !== savedStories) {
            showSyncStatus();
            await updateStoryCollection();
            hideSyncStatus();
        }
    }, 5000);
}

// Update story collection
async function updateStoryCollection() {
    try {
        const savedStories = localStorage.getItem('storyCollection');
        if (savedStories) {
            storyCollection = JSON.parse(savedStories);
            renderStoryCollection();
        }
    } catch (error) {
        console.error('Error updating story collection:', error);
    }
}

// Render story collection
function renderStoryCollection() {
    // Clear current grid
    storyGrid.innerHTML = '';

    // Filter stories based on current filter
    const filteredStories = currentFilter === 'all' 
        ? storyCollection 
        : storyCollection.filter(story => story.realm === currentFilter);

    // Show empty state if no stories
    if (filteredStories.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    // Hide empty state
    emptyState.style.display = 'none';

    // Sort stories by completion date
    filteredStories.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render each story
    filteredStories.forEach((story, index) => {
        const card = createStoryCard(story, index + 1);
        storyGrid.appendChild(card);
    });
}

// Create story card element
function createStoryCard(story, number) {
    const card = document.createElement('div');
    card.className = 'story-card';
    
    // Get realm information
    const realmInfo = realmMapping[story.realm] || { name: 'Unknown Realm', theme: '', description: '' };
    
    card.innerHTML = `
        <div class="story-number">${number}</div>
        <div class="story-realm">${realmInfo.name}</div>
        <div class="realm-theme">${realmInfo.theme}</div>
        <h3 class="story-title">${story.title}</h3>
        <div class="story-content">${storyDescriptions[story.challengeId] || story.content}</div>
        <div class="story-date">Completed: ${new Date(story.date).toLocaleDateString()}</div>
    `;
    return card;
}

// Show sync status
function showSyncStatus() {
    syncStatus.classList.add('active', 'syncing');
    syncStatus.querySelector('span').textContent = 'Syncing...';
}

// Hide sync status
function hideSyncStatus() {
    syncStatus.classList.remove('syncing');
    syncStatus.querySelector('span').textContent = 'Synced';
    setTimeout(() => {
        syncStatus.classList.remove('active');
    }, 2000);
}

// Add a new story to the collection
async function addStory(story) {
    try {
        // Add timestamp
        story.date = new Date().toISOString();

        // Add to collection
        storyCollection.push(story);

        // Save to localStorage
        localStorage.setItem('storyCollection', JSON.stringify(storyCollection));

        // Update UI
        renderStoryCollection();

        // Show sync status
        showSyncStatus();
        setTimeout(hideSyncStatus, 2000);
    } catch (error) {
        console.error('Error adding story:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initStoryCollection); 