// Import required packages
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// CRITICAL: Load environment variables immediately
dotenv.config();

// Import our API routes AFTER dotenv has been configured
const apiRoutes = require('./api/routes');

// Initialize the Express application
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// Define the port the server will run on
const PORT = process.env.PORT || 5001;

// Define a basic root route for server health check
app.get('/', (req, res) => {
  res.status(200).send('Neurotype Communicator API is running.');
});

// Tell the app to use our API routes for any path that starts with /api
app.use('/api', apiRoutes);

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
