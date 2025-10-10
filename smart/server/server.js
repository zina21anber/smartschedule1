// smart3/smart/server/server.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key'; 

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL database:', err.stack);
  } else {
    console.log('✅ Successfully connected to PostgreSQL database');
    release();
  }
});

// ===================================================================
// ✅ NEW: IN-MEMORY STORES FOR RULES & NOTIFICATIONS (MOCK)
// ===================================================================

let rulesStore = {
    course: [
        { rule_id: 1, type: 'min_gpa', value: '2.5', description: 'Min GPA for Course', tab: 'course' },
        { rule_id: 2, type: 'max_credits_per_level', value: '18', description: 'Max Credits per Level', tab: 'course' },
    ],
    faculty: [
        { rule_id: 3, type: 'max_load', value: '12', description: 'Max Teaching Load', tab: 'faculty' },
        { rule_id: 4, type: 'max_prep', value: '4', description: 'Max Preparations', tab: 'faculty' },
    ],
    schedule: [
        { rule_id: 5, type: 'course_time_limit', value: '1.5', description: 'Max Duration per Class (Hours)', tab: 'schedule' },
        { rule_id: 6, type: 'no_friday_classes', value: 'True', description: 'Constraint: No classes on Friday', tab: 'schedule' },
    ],
};

let notificationsStore = [
    { id: 1, message: 'New voting system deployed. Please check your dashboard.', date: '2025-10-01T10:00:00Z' },
    { id: 2, message: 'Schedule generation process started for Level 3.', date: '2025-10-02T11:30:00Z' },
];


// ===================================================================
// Middleware
// ===================================================================

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Token is invalid or expired
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // user payload contains { id, email, role }
    req.user = user; 
    next();
  });
};

// ✅ NEW Middleware: Check if the user is authorized for committee tasks
const verifyAdminAccess = (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(403).json({ error: 'Access Forbidden: Role not defined.' });
    }
    
    // Roles with access to management pages
    const allowedRoles = ['Load Committee Head', 'Load Committee', 'Admin'];

    if (allowedRoles.includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Access Forbidden: Insufficient permissions for management tasks.' });
    }
};


// ===================================================================
// Routes
// ===================================================================

// Auth Routes (Login/Signup - Mock/Simplified)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT user_id, email, password_hash, role, full_name FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && bcrypt.compareSync(password, user.password_hash)) {
            const token = jwt.sign({ id: user.user_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            return res.json({ token, role: user.role, full_name: user.full_name });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    } finally {
        client.release();
    }
});

// Simplified Signup (for student/user creation)
app.post('/api/auth/register-user', async (req, res) => {
    const { email, password, full_name, role } = req.body;
    const password_hash = bcrypt.hashSync(password, 10);
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, $3, $4) RETURNING user_id',
            [email, password_hash, role || 'Student', full_name]
        );
        res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].user_id });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Email might already be in use.' });
    } finally {
        client.release();
    }
});

// Student Routes
app.get('/api/students', authenticateToken, verifyAdminAccess, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT student_id, name, level, is_ir FROM students ORDER BY student_id');
        res.json({ data: result.rows });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch student data' });
    } finally {
        client.release();
    }
});

app.post('/api/students', authenticateToken, verifyAdminAccess, async (req, res) => {
    const { studentId, studentName, level, email, password, is_ir } = req.body;
    const password_hash = bcrypt.hashSync(password, 10);
    const client = await pool.connect();
    try {
        // First, check if the student_id or email already exists to prevent duplicate
        const checkResult = await client.query('SELECT 1 FROM students WHERE student_id = $1 OR email = $2', [studentId, email]);
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ error: 'Student ID or Email already exists.' });
        }

        await client.query('BEGIN'); // Start Transaction

        // 1. Insert into users table
        const userResult = await client.query(
            'INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, $3, $4) RETURNING user_id',
            [email, password_hash, 'Student', studentName]
        );
        const userId = userResult.rows[0].user_id;

        // 2. Insert into students table
        const studentResult = await client.query(
            'INSERT INTO students (student_id, user_id, name, level, email, is_ir) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [studentId, userId, studentName, level, email, is_ir]
        );

        await client.query('COMMIT'); // Commit Transaction

        res.status(201).json({ message: 'Student created successfully', data: studentResult.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback on error
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Failed to create student.' });
    } finally {
        client.release();
    }
});

app.put('/api/students/:studentId', authenticateToken, verifyAdminAccess, async (req, res) => {
    const { studentId } = req.params;
    const { level } = req.body; 
    const client = await pool.connect();
    try {
        const result = await client.query(
            'UPDATE students SET level = $1 WHERE student_id = $2 RETURNING *',
            [level, studentId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ message: 'Student level updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating student level:', error);
        res.status(500).json({ error: 'Failed to update student level' });
    } finally {
        client.release();
    }
});

app.delete('/api/students/:studentId', authenticateToken, verifyAdminAccess, async (req, res) => {
    const { studentId } = req.params;
    const client = await pool.connect();
    try {
        const studentResult = await client.query('SELECT user_id FROM students WHERE student_id = $1', [studentId]);
        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const userId = studentResult.rows[0].user_id;

        await client.query('BEGIN'); // Start Transaction

        await client.query('DELETE FROM students WHERE student_id = $1', [studentId]);
        await client.query('DELETE FROM users WHERE user_id = $1', [userId]);

        await client.query('COMMIT'); // Commit Transaction

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback on error
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    } finally {
        client.release();
    }
});


// Course Routes
app.get('/api/courses', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT course_id, code, name, level, dept_code FROM courses ORDER BY level, code');
        res.json({ data: result.rows });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'خطأ في جلب المقررات' });
    } finally {
        client.release();
    }
});

// ✅ NEW: Get Single Course Details (for AddExternalCourses page)
app.get('/api/courses/:courseId', authenticateToken, verifyAdminAccess, async (req, res) => {
    const { courseId } = req.params;
    const client = await pool.connect();
    try {
        // Assuming time_slots are stored in a column 'time_slots' as JSONB
        const result = await client.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ error: 'Failed to fetch course details' });
    } finally {
        client.release();
    }
});

// ✅ NEW: Update Course Time Slots
app.patch('/api/courses/:courseId/timeslots', authenticateToken, verifyAdminAccess, async (req, res) => {
    const { courseId } = req.params;
    const { time_slots } = req.body;
    const client = await pool.connect();
    try {
        // time_slots is expected to be an array of objects: [{day: '...', type: '...', start_time: '...', end_time: '...'}]
        const result = await client.query(
            'UPDATE courses SET time_slots = $1 WHERE course_id = $2 RETURNING *',
            [JSON.stringify(time_slots), courseId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found or no changes made' });
        }
        res.json({ message: 'Time slots updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating time slots:', error);
        res.status(500).json({ error: 'Failed to update time slots' });
    } finally {
        client.release();
    }
});

// Schedule and Section Routes (from previous code)
app.get('/api/schedules', authenticateToken, verifyAdminAccess, async (req, res) => {
  // Mock/Simplified Schedule Route
  res.json([]); // Return empty array or mock data if implemented
});

app.get('/api/sections', authenticateToken, verifyAdminAccess, async (req, res) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        s.*, 
        c.name AS course_name, 
        c.level AS level,         
        c.dept_code AS dept_code
      FROM sections s
      JOIN courses c ON s.course_id = c.course_id
      ORDER BY c.level, s.day_code, s.start_time
    `;
    const result = await client.query(query);

    const sectionsWithCastedLevel = result.rows.map(row => ({
      ...row,
      level: parseInt(row.level, 10)
    }));

    res.json(sectionsWithCastedLevel);

  } catch (error) {
    console.error('Error fetching sections with course info:', error);
    res.status(500).json({ error: 'خطأ في جلب الشعب مع معلومات المقرر' });
  } finally {
    client.release();
  }
});


// ===================================================================
// ✅ NEW: Rules Routes (using In-Memory Mock)
// ===================================================================

app.get('/api/rules', authenticateToken, verifyAdminAccess, (req, res) => {
    // Return all rules aggregated
    const allRules = [...rulesStore.course, ...rulesStore.faculty, ...rulesStore.schedule];
    res.json({ data: allRules });
});

app.post('/api/rules', authenticateToken, verifyAdminAccess, (req, res) => {
    // Expects the full rules object: { course: [], faculty: [], schedule: [] }
    const { rules } = req.body; 
    if (!rules || typeof rules !== 'object' || !rules.course || !rules.faculty || !rules.schedule) {
        return res.status(400).json({ error: 'Invalid rules format. Must contain course, faculty, and schedule lists.' });
    }

    // Simple in-memory save/replace
    rulesStore = rules;
    res.json({ message: 'Rules updated successfully (In-Memory Mock)', data: rulesStore });
});

app.delete('/api/rules/:id', authenticateToken, verifyAdminAccess, (req, res) => {
    const { id } = req.params;
    const ruleId = parseInt(id, 10);
    let found = false;
    
    // Remove from all tabs
    Object.keys(rulesStore).forEach(tab => {
        const initialLength = rulesStore[tab].length;
        rulesStore[tab] = rulesStore[tab].filter(rule => rule.rule_id !== ruleId);
        if (rulesStore[tab].length < initialLength) {
            found = true;
        }
    });

    if (found) {
        res.json({ message: `Rule ${ruleId} deleted successfully (In-Memory Mock)` });
    } else {
        res.status(404).json({ error: 'Rule not found' });
    }
});


// ===================================================================
// ✅ NEW: Notifications Routes (using In-Memory Mock)
// ===================================================================

app.get('/api/notifications', authenticateToken, verifyAdminAccess, (req, res) => {
    // Sort by date descending
    const sortedNotifications = notificationsStore.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ data: sortedNotifications });
});

app.post('/api/notifications', authenticateToken, verifyAdminAccess, (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Notification message is required' });
    }

    const newId = notificationsStore.length > 0 ? Math.max(...notificationsStore.map(n => n.id)) + 1 : 1;
    const newNotification = { 
        id: newId, 
        message, 
        date: new Date().toISOString()
    };

    notificationsStore.push(newNotification);
    res.status(201).json({ message: 'Notification published successfully (In-Memory Mock)', data: newNotification });
});

app.delete('/api/notifications/:id', authenticateToken, verifyAdminAccess, (req, res) => {
    const { id } = req.params;
    const notificationId = parseInt(id, 10);
    const initialLength = notificationsStore.length;
    notificationsStore = notificationsStore.filter(n => n.id !== notificationId);

    if (notificationsStore.length < initialLength) {
        res.json({ message: `Notification ${notificationId} deleted successfully (In-Memory Mock)` });
    } else {
        res.status(404).json({ error: 'Notification not found' });
    }
});


// ===================================================================
// Final Middleware and Server Start
// ===================================================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});