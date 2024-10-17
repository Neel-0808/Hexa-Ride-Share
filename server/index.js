const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const { Expo } = require("expo-server-sdk");
const expo = new Expo(); // To send notifications
const multer = require('multer');
const path = require('path');

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
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to the MySQL database");
  }
});



// Configure storage settings for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file to avoid conflicts
  }
});

const upload = multer({ storage });
app.use('/uploads', express.static('uploads'));



// Utility function to convert MySQL query to promises
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};


app.put('/api/users/:id', upload.single('profilePicture'), async (req, res) => {
  const userId = req.params.id;
  const { email, mobile, gender, upi_id } = req.body;
  const profilePicturePath = req.file ? req.file.path : null; // Get the path of the uploaded file

  try {
    const sql = `
      UPDATE users 
      SET email = ?, phonenumber = ?, gender = ?, upi_id = ?, profile_picture = ?
      WHERE id = ?
    `;
    const values = [email, mobile, gender, upi_id, profilePicturePath, userId];

    await db.query(sql, values, (error, results) => {
      if (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ error: "Failed to update user" });
      }
      res.status(200).json({ message: "User updated successfully" });
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Endpoint to update UPI ID
app.put('/api/users/:id/upi', async (req, res) => {
  const userId = req.params.id;
  const { upi_id } = req.body; // Extract UPI ID from request body

  try {
    const sql = `
      UPDATE users 
      SET upi_id = ?
      WHERE id = ?
    `;
    const values = [upi_id, userId];

    await db.query(sql, values, (error, results) => {
      if (error) {
        console.error("Error updating UPI ID:", error);
        return res.status(500).json({ error: "Failed to update UPI ID" });
      }
      res.status(200).json({ message: "UPI ID updated successfully" });
    });
  } catch (error) {
    console.error("Error updating UPI ID:", error);
    res.status(500).json({ error: "Failed to update UPI ID" });
  }
});

// GET request to login
app.get("/api/login", async (req, res) => {
  const { email, password } = req.query; // Make sure you're using req.query for GET requests

  try {
    const rows = await dbQuery("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];

    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ user }); // Send back the user data
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });
});




// POST request to insert a new ride
app.post("/api/rides", async (req, res) => {
  const {
    driver_name,
    vehicle_info,
    origin,
    destination,
    available_seats,
    ride_time,
    ride_date,
  } = req.body;

  try {
    const result = await dbQuery(
      "INSERT INTO rides (driver_name, vehicle_info, origin, destination, available_seats,ride_time,ride_date) VALUES (?,?,?, ?, ?, ?, ?)",
      [
        driver_name,
        vehicle_info,
        origin,
        destination,
        available_seats,
        ride_time,
        ride_date,
      ]
    );
    res
      .status(201)
      .json({ message: "Ride added successfully", rideId: result.insertId });
  } catch (error) {
    console.error("Error inserting new ride:", error);
    res.status(500).json({ error: "Failed to insert new ride" });
  }
});

// GET request to fetch all available rides
app.get("/api/rides", async (req, res) => {
  try {
    const currentDateTime = new Date();

    // Delete past rides before fetching the remaining ones
    await db.query(
      `DELETE FROM rides WHERE ride_date < CURDATE() OR (ride_date = CURDATE() AND ride_time < CURTIME())`
    );

    const results = await dbQuery("SELECT * FROM rides");
    res.json(results);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

// POST request to create a new ride request
app.post("/api/ride-requests", async (req, res) => {
  const {
    rider_name,
    gender,
    pickup_location,
    destination_location,
    contact,
    push_token,
  } = req.body;

  if (
    !rider_name ||
    !gender ||
    !pickup_location ||
    !destination_location ||
    !contact ||
    !push_token
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await dbQuery(
      "INSERT INTO ride_requests (rider_name, gender, pickup_location, destination_location, contact, push_token) VALUES (?, ?, ?, ?, ?, ?)",
      [
        rider_name,
        gender,
        pickup_location,
        destination_location,
        contact,
        push_token,
      ]
    );
    res.status(201).json({
      message: "Ride request created successfully",
      requestId: result.insertId,
    });
  } catch (error) {
    console.error("Error inserting ride request:", error);
    res.status(500).json({ error: "Failed to submit ride request" });
  }
});

// GET request for the driver to view ride requests
app.get("/api/ride-requests", async (req, res) => {
  try {
    const results = await dbQuery(
      "SELECT id, rider_name, gender, pickup_location, destination_location, contact FROM ride_requests"
    );
    res.json(results);
  } catch (error) {
    console.error("Error fetching ride requests:", error);
    res.status(500).json({ error: "Failed to fetch ride requests" });
  }
});





// POST request to accept a ride and send a notification to the rider
app.post("/api/ride-requests/:id/accept/:driver_name", async (req, res) => {
  const requestId = req.params.id; // Retrieve the ride request ID from URL parameters
  const driverName = req.params.driver_name; // Retrieve driver name from URL parameters

  try {
    // Find the rider's request and necessary details from the DB
    const result = await dbQuery(
      "SELECT rider_name, pickup_location, destination_location, push_token FROM ride_requests WHERE id = ?",
      [requestId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Ride request not found" }); // Handle case where ride request is not found
    }

    const riderName = result[0].rider_name; // Get rider's name from the result
    const pickupLocation = result[0].pickup_location; // Get pickup location
    const destinationLocation = result[0].destination_location; // Get destination location
    const riderExpoPushToken = result[0].push_token; // Get rider's Expo push token

    // Update ride status to "Accepted"
    await dbQuery('UPDATE ride_requests SET status = "Accepted" WHERE id = ?', [
      requestId,
    ]);

    // Insert into the progress table, including driver name
    const progressInsertResult = await dbQuery(
      'INSERT INTO progress (rider_name, pickup_location, destination_location, driver_name, progress) VALUES (?, ?, ?, ?, ?)',
      [riderName, pickupLocation, destinationLocation, driverName, 'on progress']
    );

    // Capture the ID of the newly created progress entry
    const progressId = progressInsertResult.insertId; // Get the inserted ID

    // Send the push notification using Expo SDK
    if (Expo.isExpoPushToken(riderExpoPushToken)) {
      const messages = [
        {
          to: riderExpoPushToken,
          sound: "default",
          body: "Your ride has been accepted!",
          data: { requestId },
        },
      ];

      // Attempt to send the notification
      try {
        let tickets = await expo.sendPushNotificationsAsync(messages);
        console.log("Notification tickets:", tickets);
        
        // Respond with success message and the progress ID
        res.json({ 
          message: "Ride accepted, progress recorded, and notification sent", 
          progressId // Send the ID of the new progress entry
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        res.status(500).json({ error: "Failed to send notification" }); // Handle notification send failure
      }
    } else {
      console.error("Invalid Expo Push Token:", riderExpoPushToken);
      res.status(400).json({ error: "Invalid Expo Push Token" }); // Handle invalid push token
    }
  } catch (error) {
    console.error("Error accepting ride:", error);
    res.status(500).json({ error: "Internal server error" }); // Handle internal errors
  }
});




// GET request to check the status of a ride request by requestId
app.get("/api/ride-requests/status", async (req, res) => {
  const { requestId } = req.query;

  if (!requestId) {
    return res.status(400).json({ error: "Missing requestId parameter" });
  }

  try {
    const result = await dbQuery(
      "SELECT status FROM ride_requests WHERE id = ?",
      [requestId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Ride request not found" });
    }

    res.json({ status: result[0].status });
  } catch (error) {
    console.error("Error retrieving ride status:", error);
    res.status(500).json({ error: "Failed to retrieve ride status" });
  }
});
app.post('/api/submit-feedback', (req, res) => {
  const { name, email, role, feedback_text, rating, issue } = req.body;

  // Validate that all necessary fields are provided
  if (!name || !email || !role || !feedback_text || !rating || !issue) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Insert feedback into the database
  const query = `INSERT INTO feedback (name, email, role, feedback_text, rating, issue) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(query, [name, email, role, feedback_text, rating, issue], (err, results) => {
    if (err) {
      console.error('Error inserting feedback into database: ', err);
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }

    return res.status(200).json({ message: 'Feedback submitted successfully' });
  });
});


// PUT request to update progress status
app.put('/api/ride-requests/progress/:driverName/:progressId', async (req, res) => {
  const driverName = req.params.driverName; // Get the driver name from URL parameters
  const progressId = req.params.progressId; // Get the progress ID from URL parameters

  try {
    // Step 1: Check if the progress entry exists for the given driver name and progress ID
    const progressQuery = `SELECT driver_name FROM progress WHERE id = ? AND driver_name = ?`;
    const progressResult = await dbQuery(progressQuery, [progressId, driverName]);

    if (progressResult.length === 0) {
      return res.status(404).json({ message: "No progress found for the given driver name and progress ID." });
    }

    // Step 2: Update the progress status to 'complete'
    const updateProgressQuery = `UPDATE progress SET progress = 'completed' WHERE id = ?`;
    const updateValues = [progressId]; // Use progressId for the update

    // Execute the query
    const result = await dbQuery(updateProgressQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No progress found for the given progress ID or it may already be complete." });
    }

    res.status(200).json({ message: "Progress status updated to complete." });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ error: "Failed to update progress status" });
  }
});





// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});