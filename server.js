const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const bcrypt = require("bcrypt");

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
app.use(express.static(path.join(__dirname, "public")));

// Define a route to handle requests at the root ("/") and serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Define a route to serve the signup.html page
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

// Define a route to serve the dashboard.html page
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Route to handle signup POST request
app.post("/signup", async (req, res) => {
  console.log(req.body);
  const { username, email, password } = req.body;

  try {
    // Check if the username or email already exists in the database
    // If exists, handle accordingly
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (rows.length > 0) {
      // If username exists
      if (rows[0].username === username) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // If email exists
      if (rows[0].email === email) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    // Salt and hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log(`Hashed Password: ${hashedPassword}`);

    // If not exists, insert the user data into the database
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    res.status(200).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Signup failed" });
  }
});

// Route to handle login POST request
app.post("/login", async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;

  try {
    // Check if the username exists in the database
    // If not exists, handle accordingly
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // If exists, compare the password
    const hashedPassword = rows[0].password;
    const passwordMatch = await bcrypt.compare(password, hashedPassword);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
