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

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to verify committee access (for registration passwords)
const verifyCommittee = (req, res, next) => {
  const { password, committeePassword } = req.body;
  const pwd = committeePassword || password; 
  if (pwd !== process.env.COMMITTEE_PASSWORD) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة، غير مسموح بالدخول.' });
  }
  next();
};

// Middleware to verify admin/committee access (for data fetching and management)
const verifyAdminAccess = (req, res, next) => {
  const allowedRoles = ['load committee', 'register', 'schedule', 'faculty member'];
  
  if (req.user && req.user.type === 'user' && req.user.role && allowedRoles.includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({ error: 'غير مصرح لك بالوصول إلى هذه الموارد.' });
  }
};


// ============================================
// AUTHENTICATION ROUTES (Login/Register remain unchanged)
// ============================================

app.post('/api/auth/login', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check users (faculty/staff)
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await client.query(userQuery, [email]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
      }

      const token = jwt.sign(
        { id: user.user_id, email: user.email, role: user.role, type: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: { id: user.user_id, email: user.email, full_name: user.name, role: user.role, type: 'user' }
      });
    }

    // Check students
    const studentQuery = `
      SELECT s.student_id, s.is_ir, s.level, u.user_id, u.email, u.name, u.password
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      WHERE u.email = $1
    `;
    const studentResult = await client.query(studentQuery, [email]);

    if (studentResult.rows.length > 0) {
      const student = studentResult.rows[0];
      const isValidPassword = await bcrypt.compare(password, student.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
      }

      const token = jwt.sign(
        { id: student.student_id, user_id: student.user_id, email: student.email, type: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: { id: student.student_id, user_id: student.user_id, email: student.email, full_name: student.name, level: student.level, is_ir: student.is_ir, type: 'student' }
      });
    }

    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
});


// ============================================
// STUDENT ROUTES (CRUD Management)
// ============================================

// GET: Fetch all students (Read)
app.get('/api/students', authenticateToken, verifyAdminAccess, async (req, res) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT s.student_id, s.is_ir, s.level, u.email, u.name
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      ORDER BY s.student_id
    `;
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'خطأ في جلب الطلاب' });
  } finally {
    client.release();
  }
});

// POST: Add new student (Create) - A simplified version for management interface
app.post('/api/students', authenticateToken, verifyAdminAccess, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ✅ استقبال الحقل is_ir من الواجهة الأمامية
    const { studentId, studentName, level, password, email, is_ir } = req.body;
    
    if (!email || !password || !studentId || !studentName || !level) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'الرجاء توفير جميع بيانات الطالب (الرقم، الاسم، الإيميل، المستوى).' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); 

    // 1. Insert into users
    const userQuery = `
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, 'student')
      RETURNING user_id
    `;
    const userResult = await client.query(userQuery, [email, hashedPassword, studentName]);
    const userId = userResult.rows[0].user_id;

    // 2. Insert into students
    const studentQuery = `
      INSERT INTO students (user_id, level, student_id, is_ir)
      VALUES ($1, $2, $3, $4)
      RETURNING student_id
    `;
    // ✅ إرسال قيمة is_ir المستلمة (والتي قيمتها TRUE من الواجهة الأمامية) إلى قاعدة البيانات
    const studentResult = await client.query(studentQuery, [userId, level, studentId, is_ir || false]); 

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'تمت إضافة الطالب بنجاح!',
      studentId: studentResult.rows[0].student_id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating student:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'البريد الإلكتروني أو الرقم الجامعي مستخدم بالفعل' });
    } else {
      res.status(500).json({ error: 'خطأ في إضافة الطالب' });
    }
  } finally {
    client.release();
  }
});


// PUT: Update student level (Update)
app.put('/api/students/:studentId', authenticateToken, verifyAdminAccess, async (req, res) => {
  const client = await pool.connect();
  try {
    const { studentId } = req.params;
    const { level } = req.body;

    const query = `
      UPDATE students 
      SET level = $1 
      WHERE student_id = $2
      RETURNING student_id
    `;
    const result = await client.query(query, [level, studentId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'الطالب غير موجود.' });
    }

    res.json({ success: true, message: 'تم تحديث مستوى الطالب بنجاح.' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'خطأ في تحديث الطالب' });
  } finally {
    client.release();
  }
});


// DELETE: Delete student (Delete)
app.delete('/api/students/:studentId', authenticateToken, verifyAdminAccess, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { studentId } = req.params;
    
    // 1. Get user_id from students table
    const userQuery = 'SELECT user_id FROM students WHERE student_id = $1';
    const userResult = await client.query(userQuery, [studentId]);
    
    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'الطالب غير موجود.' });
    }
    const userId = userResult.rows[0].user_id;

    // 2. Delete from students table
    await client.query('DELETE FROM students WHERE student_id = $1', [studentId]);

    // 3. Delete from users table (cascading delete should handle votes/etc.)
    await client.query('DELETE FROM users WHERE user_id = $1', [userId]);

    await client.query('COMMIT');
    
    res.status(204).send(); // No Content
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'خطأ في حذف الطالب' });
  } finally {
    client.release();
  }
});


// ============================================
// SCHEDULE & SECTION ROUTES (Protected with verifyAdminAccess)
// ============================================
app.get('/api/schedules', authenticateToken, verifyAdminAccess, async (req, res) => {
  const client = await pool.connect();
  try {
    const query = 'SELECT * FROM schedules ORDER BY level, group_number';
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'خطأ في جلب الجداول' });
  } finally {
    client.release();
  }
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

// ... (بقية المسارات: Statistics, Health, Error Handling) ...

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SmartSchedule Server running on port ${PORT}`);
  console.log(`📊 Connected to PostgreSQL database: ${process.env.DB_NAME}`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});