const express = require("express");
const mysql = require("mysql2/promise");
const path = require('path');

const app = express();
const port = 3000; // Set your desired port number

// Middleware to parse incoming JSON data
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "clustering_web_app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Serve the static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define a route to handle requests at the root ("/") and serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Define a route to serve the signup.html page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Route to handle signup POST request
app.post("/signup", async (req, res) => {
  console.log(req.body);
  const { username, email, password } = req.body;

  try {
    // Check if the username or email already exists in the database (you need to implement this logic)
    // If exists, handle accordingly

    // If not exists, insert the user data into the database
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, password]
    );

    res.status(200).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Signup failed" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
