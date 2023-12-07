const express = require("express");
const multer = require("multer");
const mysql = require("mysql2/promise");
const path = require("path");
const bcrypt = require("bcrypt");
const { v4: uuidv4, validate } = require("uuid");
const { spawn, exec } = require("child_process");
const fs = require("fs");

const app = express();
const port = 3000; // Set your desired port number

// const TOKEN_EXPIRY = 30 * 1000; // 30 seconds
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

const sessions = {};

// Middleware to parse incoming JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "data/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Function to validate the file format
const validateFileFormat = (file) => {
  const fileFormat = file.originalname.split(".").pop();

  if (fileFormat != "txt") return false;

  // Read and split the file content by lines
  const fileContent = fs.readFileSync(file.path, "utf8");
  const lines = fileContent.split("\n");

  // Validate each line
  for (const line of lines) {
    if (line === "") continue; // Skip empty lines

    // Split each line by tab (\t) to get columns
    const columns = line.split("\t");

    // Check if there are exactly two columns
    if (columns.length !== 2) {
      console.log("Invalid number of columns");
      return false; // Invalid number of columns
    }

    // Check if both columns contain numeric data
    const column1IsNumeric = !isNaN(columns[0].trim());
    const column2IsNumeric = !isNaN(columns[1].trim());

    // If either column is not numeric, return false
    if (!column1IsNumeric || !column2IsNumeric) {
      console.log("Invalid data in columns");
      return false; // Invalid data in columns
    }
  }

  return true;
};

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

    // // If exists, compare the password
    const hashedPassword = rows[0].password;
    const passwordMatch = await bcrypt.compare(password, hashedPassword);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // create a new session
    const token = uuidv4();
    const expiry = Date.now() + TOKEN_EXPIRY;

    sessions[token] = { username, expiry };
    res.set("Authorization", token);
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Route to handle logout POST request
app.post("/logout", async (req, res) => {
  const { token } = req.body;

  try {
    delete sessions[token];
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});

app.get("/session/:id", async (req, res) => {
  const { id: token } = req.params;

  try {
    const session = sessions[token];
    if (!session) {
      return res.status(401).json({ message: "Session expired" });
    }

    const { username, expiry } = session;
    if (Date.now() > expiry) {
      delete sessions[token];
      return res.status(401).json({ message: "Session expired" });
    }
    sessions[token].expiry = Date.now() + TOKEN_EXPIRY;
    res.status(200).json({ username });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Session failed" });
  }
});

// Route to handle models GET request
app.get("/models/:username", async (req, res) => {
  const { username } = req.params;

  try {
    // Check if the username exists in the database
    // If not exists, handle accordingly
    const [rows] = await pool.query(
      "SELECT m.* FROM models m, users u WHERE u.username = ? AND u.user_id = m.user_id",
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No models found" });
    }

    const models = rows.map((row) => {
      return { modelName: row.model_name, modelPath: row.model_path };
    });

    res.status(200).json(models);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "No models found" });
  }
});

app.post("/train", upload.single("trainFile"), async (req, res) => {
  const { modelName, user, kvalue } = req.body;
  const trainFile = `data/${req.file.originalname}`;

  // validate the file format
  if (!validateFileFormat(req.file)) {
    return res.status(400).json({ message: "Invalid file format" });
  }

  // Get user_id from the database
  const [rows] = await pool.query(
    "SELECT user_id FROM users WHERE username = ?",
    [user]
  );
  const user_id = rows[0].user_id;

  try {
    // Check if the model name already exists in the database
    // If exists, handle accordingly
    const [rows] = await pool.query(
      "SELECT * FROM models WHERE model_name = ? AND user_id = ?",
      [modelName, user_id]
    );

    if (rows.length > 0) {
      return res.status(409).json({ message: "Model name already exists" });
    }

    exec(
      `python kmeans_clustering.py --data ${trainFile} --function train --k ${kvalue} --model data/${user_id}_${modelName}.joblib`,
      async (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          res.status(500).json({ message: "Model training failed" });
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          res.status(500).json({ message: "Model training failed" });
          return;
        }
        console.log(`stdout: ${stdout}`);
        const [result] = await pool.query(
          "INSERT INTO models (model_name, model_path, user_id) VALUES (?, ?, ?)",
          [modelName, `data/${user_id}_${modelName}`, user_id]
        );

        // read image from data folder and send it to client
        const image = fs.readFileSync(`data/plot.jpeg`);
        const encodedImage = image.toString("base64");
        const imageSrc = `data:image/png;base64,${encodedImage}`;
        res
          .status(200)
          .json({ message: "Model trained successfully", imageSrc });
        // res.status(200).json({ message: "Model trained successfully" });
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Model training failed" });
  }
});

app.post("/test", upload.single("testFile"), async (req, res) => {
  const { modelName, user } = req.body;
  const testFile = `data/${req.file.originalname}`;

  // validate the file format
  if (!validateFileFormat(req.file)) {
    return res.status(400).json({ message: "Invalid file format" });
  }

  // Get user_id from the database
  const [rows] = await pool.query(
    "SELECT user_id FROM users WHERE username = ?",
    [user]
  );
  const user_id = rows[0].user_id;

  try {
    // Check if the model name already exists in the database
    // If exists, handle accordingly
    const [rows] = await pool.query(
      "SELECT * FROM models WHERE model_name = ? AND user_id = ?",
      [modelName, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Model not found" });
    }

    exec(
      `python kmeans_clustering.py --data ${testFile} --function test --model data/${user_id}_${modelName}.joblib`,
      async (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          res.status(500).json({ message: "Model testing failed" });
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          res.status(500).json({ message: "Model test ran failed" });
          return;
        }
        console.log(`stdout: ${stdout}`);
        const image = fs.readFileSync(`data/plot.jpeg`);
        const encodedImage = image.toString("base64");
        const imageSrc = `data:image/png;base64,${encodedImage}`;
        res
          .status(200)
          .json({ message: "Model test ran successfully", imageSrc });
        // res.status(200).json({ message: "Model tested successfully" });
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Model testing failed" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
