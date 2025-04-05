// This file redirects to the actual server code in the server directory
// Load environment variables first
require('dotenv').config();
// Now load the server
require('./server/server.js'); 