// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOEl_rNQXqn9T_lM7LM-bGtVHm2M1ynHE",
  authDomain: "playground-f2d18.firebaseapp.com",
  databaseURL: "https://playground-f2d18-default-rtdb.firebaseio.com",
  projectId: "playground-f2d18",
  storageBucket: "playground-f2d18.appspot.com",
  messagingSenderId: "549060916225",
  appId: "1:549060916225:web:c34080d58e0747c09afc00"
};

// Initialize Firebase if not already initialized
if (typeof firebase !== 'undefined') {
  // Check if Firebase is already initialized
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    console.log("Firebase SDK loaded and initialized");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.error("Firebase SDK not available");
}

// Export a function to get the database reference
function getDatabase() {
  if (typeof firebase !== 'undefined' && firebase.database) {
    return firebase.database();
  }
  console.error("Firebase database not available");
  return null;
}