// Story collection state
let storyCollection = [];
let currentFilter = 'all';

// Story descriptions mapping
const storyDescriptions = {
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

// Realm mapping
const realmMapping = {
    'whispering-woods': 'The Whispering Woods',
    'crypts': 'The Flooded Crypts',
    'ember': 'The Ember Peaks',
    'frost': 'The Frosted Vale',
    'abyss': 'The Abyss of Shadows'
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
    const realmName = realmMapping[story.realm] || 'Unknown Realm';
    const description = storyDescriptions[story.challengeId] || story.content;
    
    card.innerHTML = `
        <div class="story-number">${number}</div>
        <div class="story-realm">${realmName}</div>
        <h3 class="story-title">${story.title}</h3>
        <div class="story-content">${description}</div>
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