const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const { Expo } = require("expo-server-sdk");
const expo = new Expo(); // To send notifications

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

// GET request to fetch user details
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
      "INSERT INTO rides (driver_name, vehicle_info, origin, destination, available_seats, ride_time, ride_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
    res
      .status(201)
      .json({
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
app.post("/api/ride-requests/:id/accept", async (req, res) => {
  const requestId = req.params.id;

  try {
    // Find the rider's request and Expo push token from DB
    const result = await dbQuery(
      "SELECT push_token FROM ride_requests WHERE id = ?",
      [requestId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Ride request not found" });
    }

    const riderExpoPushToken = result[0].push_token;

    // Update ride status to "Accepted"
    await dbQuery('UPDATE ride_requests SET status = "Accepted" WHERE id = ?', [
      requestId,
    ]);

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

      try {
        let tickets = await expo.sendPushNotificationsAsync(messages);
        console.log("Notification tickets:", tickets);
        res.json({ message: "Ride accepted and notification sent" });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        res.status(500).json({ error: "Failed to send notification" });
      }
    } else {
      console.error("Invalid Expo Push Token:", riderExpoPushToken);
      res.status(400).json({ error: "Invalid Expo Push Token" });
    }
  } catch (error) {
    console.error("Error accepting ride:", error);
    res.status(500).json({ error: "Internal server error" });
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

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
