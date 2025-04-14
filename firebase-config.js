// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCxSjzHa0oqU-ktfnaN5sfmrD2fnEcvlE",
  authDomain: "playground-f2d18.firebaseapp.com",
  databaseURL: "https://playground-f2d18-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "playground-f2d18",
  storageBucket: "playground-f2d18.firebasestorage.app",
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