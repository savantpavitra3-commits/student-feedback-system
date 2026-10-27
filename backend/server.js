const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Test API
app.get("/", (req, res) => {
  res.json({ message: "Student Feedback API is running!" });
});

// Test database connection
app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS connected");
    res.json({ message: "MySQL connected successfully", data: rows });
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Get courses
app.get("/api/courses", async (req, res) => {
  try {
    const [courses] = await pool.query(
      "SELECT * FROM courses ORDER BY id"
    );
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch courses" });
  }
});

// Student registration
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({
        error: "Provide name, email and a password of at least 8 characters"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO students (name, email, password) VALUES (?, ?, ?)",
      [name, email, hash]
    );

    res.status(201).json({
      message: "Registration successful",
      studentId: result.insertId
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

// Student login (prototype)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      "SELECT id, name, email, password FROM students WHERE email = ?",
      [email]
    );

    if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      student: {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Submit feedback
app.post("/api/feedback", async (req, res) => {
  try {
    const { student_id, course_id, rating, comments } = req.body;

    if (
      !Number.isInteger(student_id) ||
      !Number.isInteger(course_id) ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        error: "Valid student ID, course ID and rating (1–5) are required"
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO feedback (student_id, course_id, rating, comments)
       VALUES (?, ?, ?, ?)`,
      [student_id, course_id, rating, comments || ""]
    );

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedbackId: result.insertId
    });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Student or course not found" });
    }
    res.status(500).json({ error: "Feedback submission failed" });
  }
});

// Faculty/admin feedback view
app.get("/api/feedback", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.id, s.name AS student_name, s.email,
             c.course_name, f.rating, f.comments, f.created_at
      FROM feedback f
      JOIN students s ON f.student_id = s.id
      JOIN courses c ON f.course_id = c.id
      ORDER BY f.created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch feedback" });
  }
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not connect to MySQL:", error.message);
  }
}

startServer();