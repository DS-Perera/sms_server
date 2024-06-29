const express = require("express");
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, onValue } = require("firebase/database");
const cors = require("cors");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwAMrMTk96PffuW7a4yEKifshfGoCQBZ4",
  authDomain: "sms-server-adef0.firebaseapp.com",
  databaseURL: "https://sms-server-adef0-default-rtdb.firebaseio.com",
  projectId: "sms-server-adef0",
  storageBucket: "sms-server-adef0.appspot.com",
  messagingSenderId: "155027503725",
  appId: "1:155027503725:web:0c46d7f10aef2e2fdfdd64",
};
let t = 1;
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase();

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json()); // Enable JSON parsing for request bodies

// Set up Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Array to store all uploaded CSV data
let msjQueue = [];

// API to write data to msjQueue
app.post("/write-data", async (req, res) => {
  try {
    const { designation, message } = req.body;

    if (!designation || !message) {
      return res
        .status(400)
        .json({ error: "Designation and message are required" });
    }

    // Define the data to be written
    const data = {
      designation,
      message,
    };

    // Push the data to msjQueue
    msjQueue.push(data);

    // Send the response
    res.json({ message: "Data written successfully", data });
  } catch (error) {
    console.error("Error writing data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API to read and console print a CSV file
app.post("/upload-csv", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = path.join(__dirname, req.file.path);
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      console.log(results);
      // Add the results to the msjQueue array
      msjQueue.push(...results);
      // Remove the file after processing
      fs.unlinkSync(filePath);
      res.json({ message: "File processed successfully", data: results });
    })
    .on("error", (error) => {
      console.error("Error reading file:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

// API to get the msjQueue array
app.get("/msjqueue", (req, res) => {
  res.json(msjQueue);
});

// New function to be called every second
async function processQueue() {
  try {
    const dbRef = ref(database);
    const snapshot = await new Promise((resolve, reject) => {
      onValue(dbRef, resolve, reject); // Listen for changes and resolve the promise
    });
    const data = snapshot.val(); // Get the value from the snapshot
    console.log(data.state);
    const state = data.state;
    if (state === "send2" && msjQueue.length > 0) {
      console.log(msjQueue[0]);
      writeData("/data", { key: "value" });
    } else {
      console.log("No Messaging");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
async function writeData(path, data) {
  try {
    await set(ref(database, path), data);
    console.log("Data written successfully");
  } catch (error) {
    console.error("Error writing data:", error);
  }
}
// Start calling processQueue every second
setInterval(processQueue, 1000);

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
