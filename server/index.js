const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios'); 
const { Expo } = require('expo-server-sdk');
const expo = new Expo();// To send notifications

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MySQL database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the MySQL database');
  }
});

// GET request to fetch all available rides
app.get('/api/rides', (req, res) => {
  const sqlQuery = 'SELECT * FROM rides';
  db.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching rides:', err);
      res.status(500).json({ error: 'Failed to fetch rides' });
    } else {
      res.json(results);
    }
  });
});

// POST request for the driver to create a new ride
// POST request for the rider to request a ride
app.post('/api/ride-requests', (req, res) => {
  const { rider_name, gender, pickup_location, destination_location, contact, push_token } = req.body; // Ensure push_token is included

  if (!rider_name || !gender || !pickup_location || !destination_location || !contact || !push_token) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sqlInsert = 'INSERT INTO ride_requests (rider_name, gender, pickup_location, destination_location, contact, push_token) VALUES (?, ?, ?, ?, ?, ?)';
  
  db.query(sqlInsert, [rider_name, gender, pickup_location, destination_location, contact, push_token], (err, result) => {
    if (err) {
      console.error('Error inserting ride request:', err);
      return res.status(500).json({ error: 'Failed to submit ride request' });
    }
    
    res.status(201).json({ message: 'Ride request created successfully', requestId: result.insertId });
  });
});





// GET request for the driver to view ride requests
app.get('/api/ride-requests', (req, res) => {
  const sqlQuery = 'SELECT id ,rider_name, gender, pickup_location, destination_location, contact FROM ride_requests';
  db.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching ride requests:', err);
      res.status(500).json({ error: 'Failed to fetch ride requests' });
    } else {
      res.json(results);
    }
  });
});

// POST request to accept a ride and send a notification to the rider
// Required to send notifications


// Accept ride request
app.post('/api/ride-requests/:id/accept', async (req, res) => {
  const requestId = req.params.id;
  console.log("Searching for ride request with ID:", requestId); 

  try {
    // Find the rider's request and Expo push token from DB
    const sqlQuery = 'SELECT push_token FROM ride_requests WHERE id = ?';
    db.query(sqlQuery, [requestId], async (err, result) => {
      if (err || result.length === 0) {
        return res.status(404).json({ error: 'Ride request not found' });
      }

      const riderExpoPushToken = result[0].push_token;

      // Update ride status to "Accepted"
      const sqlUpdate = 'UPDATE ride_requests SET status = "Accepted" WHERE id = ?';
      db.query(sqlUpdate, [requestId], async (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to accept the ride' });
        }

        // Ride accepted successfully, now send the notification
        if (Expo.isExpoPushToken(riderExpoPushToken)) {
          const messages = [];
          messages.push({
            to: riderExpoPushToken,
            sound: 'default',
            body: 'Your ride has been accepted!',
            data: { requestId: requestId },
          });

          // Send the push notification using Expo SDK
          try {
            let tickets = await expo.sendPushNotificationsAsync(messages);
            console.log('Notification tickets:', tickets); 
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
            return res.status(500).json({ error: 'Failed to send notification' });
          }
        } else {
          console.error('Invalid Expo Push Token:', riderExpoPushToken);
          return res.status(400).json({ error: 'Invalid Expo Push Token' });
        }

        // Respond with success
        res.json({ message: 'Ride accepted and notification sent' });
      });
    });
  } catch (error) {
    console.error('Error accepting ride:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assuming you are using Express and MySQL

// Get ride status by requestId
// Endpoint to get the status of a ride request by requestId
app.get('/api/ride-requests/status', (req, res) => {
  const { requestId } = req.query;

  // Ensure the requestId is provided
  if (!requestId) {
    return res.status(400).json({ error: 'Missing requestId parameter' });
  }

  // SQL query to get the ride status based on the requestId
  const sqlQuery = 'SELECT status FROM ride_requests WHERE id = ?';

  db.query(sqlQuery, [requestId], (err, result) => {
    if (err) {
      console.error('Error retrieving ride status:', err);
      return res.status(500).json({ error: 'Failed to retrieve ride status' });
    }

    // Check if the ride request exists
    if (result.length === 0) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    // Send the ride status back to the client
    const rideStatus = result[0].status;
    res.json({ status: rideStatus });
  });
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
