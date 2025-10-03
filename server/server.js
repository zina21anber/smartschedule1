const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Baserow API Configuration
const BASEROW_BASE_URL = process.env.BASEROW_BASE_URL;
const DATABASE_ID = process.env.BASEROW_DATABASE_ID;
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const COMMITTEE_PASSWORD = process.env.COMMITTEE_PASSWORD;

// Axios instance for Baserow API
const baserowAPI = axios.create({
  baseURL: `${BASEROW_BASE_URL}/database/rows/table/`,
  headers: {
    'Authorization': `Token ${BASEROW_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Helper function to get table URL
const getTableUrl = (tableName) => {
  const tableIds = {
    'users': 1,
    'courses': 2,
    'elective_courses': 3,
    'course_schedules': 4,
    'student_courses': 5,
    'votes': 6,
    'notifications': 7,
    'schedule_versions': 8,
    'schedule_details': 9
  };
  return `${tableIds[tableName]}/?database_id=${DATABASE_ID}`;
};

// Middleware to verify committee access
const verifyCommittee = (req, res, next) => {
  const { password } = req.body;
  if (password !== COMMITTEE_PASSWORD) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة، غير مسموح بالدخول.' });
  }
  next();
};

// Routes

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from Baserow (simplified - in real implementation, you'd hash/compare passwords)
    const response = await baserowAPI.get(getTableUrl('users'));
    const users = response.data.results;
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.user_role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.user_role,
        level: user.level,
        faculty: user.faculty
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// Elective Courses Routes
app.get('/api/elective-courses', async (req, res) => {
  try {
    const response = await baserowAPI.get(getTableUrl('elective_courses'));
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching elective courses:', error);
    res.status(500).json({ error: 'خطأ في جلب المقررات الاختيارية' });
  }
});

app.post('/api/elective-courses', verifyCommittee, async (req, res) => {
  try {
    const { course_name, course_code, credits, has_lab, has_exercise, faculty, time_slots } = req.body;

    // Create elective course
    const courseData = {
      course_name,
      course_code,
      credits,
      has_lab,
      has_exercise,
      faculty
    };

    const courseResponse = await baserowAPI.post(getTableUrl('elective_courses'), courseData);
    const courseId = courseResponse.data.id;

    // Create time slots for the course
    if (time_slots && time_slots.length > 0) {
      const schedulePromises = time_slots.map(slot =>
        baserowAPI.post(getTableUrl('course_schedules'), {
          elective_course_id: courseId,
          day_of_week: slot.day,
          start_time: slot.start_time,
          end_time: slot.end_time
        })
      );

      await Promise.all(schedulePromises);
    }

    res.json({ success: true, message: 'تمت إضافة المساق بنجاح!', courseId });
  } catch (error) {
    console.error('Error creating elective course:', error);
    res.status(500).json({ error: 'خطأ في إضافة المساق' });
  }
});

// Students Routes
app.get('/api/students', async (req, res) => {
  try {
    const response = await baserowAPI.get(getTableUrl('users'));
    const students = response.data.results.filter(user => user.user_role === 'student');
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'خطأ في جلب الطلاب' });
  }
});

app.post('/api/students', verifyCommittee, async (req, res) => {
  try {
    const { email, password, full_name, student_id, level, faculty } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const studentData = {
      email,
      password_hash: hashedPassword,
      full_name,
      student_id,
      user_role: 'student',
      level,
      faculty
    };

    const response = await baserowAPI.post(getTableUrl('users'), studentData);
    res.json({ success: true, message: 'تمت إضافة الطالب بنجاح!', studentId: response.data.id });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'خطأ في إضافة الطالب' });
  }
});

// Voting Routes
app.post('/api/vote', async (req, res) => {
  try {
    const { student_id, elective_course_id, vote_value } = req.body;

    // Check if student already voted for this course
    const existingVoteResponse = await baserowAPI.get(
      `${getTableUrl('votes')}?student_id=${student_id}&elective_course_id=${elective_course_id}`
    );

    if (existingVoteResponse.data.results.length > 0) {
      // Update existing vote
      const existingVote = existingVoteResponse.data.results[0];
      await baserowAPI.patch(`${getTableUrl('votes')}${existingVote.id}/`, {
        vote_value,
        voted_at: new Date().toISOString()
      });
    } else {
      // Create new vote
      await baserowAPI.post(getTableUrl('votes'), {
        student_id,
        elective_course_id,
        vote_value
      });
    }

    res.json({ success: true, message: 'تم تسجيل الصوت بنجاح!' });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ error: 'خطأ في تسجيل الصوت' });
  }
});

app.get('/api/votes/:elective_course_id', async (req, res) => {
  try {
    const { elective_course_id } = req.params;
    const response = await baserowAPI.get(`${getTableUrl('votes')}?elective_course_id=${elective_course_id}`);
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'خطأ في جلب الأصوات' });
  }
});

// Notifications Routes
app.get('/api/notifications', async (req, res) => {
  try {
    const response = await baserowAPI.get(getTableUrl('notifications'));
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'خطأ في جلب الإشعارات' });
  }
});

app.post('/api/notifications', verifyCommittee, async (req, res) => {
  try {
    const { title, content, notification_type, priority = 'normal' } = req.body;

    const notificationData = {
      title,
      content,
      notification_type,
      priority,
      created_at: new Date().toISOString()
    };

    const response = await baserowAPI.post(getTableUrl('notifications'), notificationData);
    res.json({ success: true, message: 'تمت إضافة الإشعار بنجاح!', notificationId: response.data.id });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'خطأ في إضافة الإشعار' });
  }
});

// Statistics Routes
app.get('/api/statistics', async (req, res) => {
  try {
    // Get all data for statistics
    const [studentsRes, coursesRes, votesRes, notificationsRes] = await Promise.all([
      baserowAPI.get(getTableUrl('users')),
      baserowAPI.get(getTableUrl('elective_courses')),
      baserowAPI.get(getTableUrl('votes')),
      baserowAPI.get(getTableUrl('notifications'))
    ]);

    const students = studentsRes.data.results.filter(u => u.user_role === 'student');
    const courses = coursesRes.data.results;
    const votes = votesRes.data.results;
    const notifications = notificationsRes.data.results;

    // Calculate statistics
    const totalStudents = students.length;
    const totalVotes = votes.length;
    const votingStudents = new Set(votes.map(v => v.student_id)).size;
    const participationRate = totalStudents > 0 ? (votingStudents / totalStudents * 100).toFixed(1) : 0;

    res.json({
      totalStudents,
      totalVotes,
      votingStudents,
      participationRate,
      totalCourses: courses.length,
      recentNotifications: notifications.slice(0, 5)
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'خطأ في جلب الإحصائيات' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 خادم SMART Schedule يعمل على المنفذ ${PORT}`);
  console.log(`📊 متصل بقاعدة بيانات Baserow رقم ${DATABASE_ID}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 إغلاق الخادم...');
  process.exit(0);
});
