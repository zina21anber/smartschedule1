// smart3/smart/server/server.js
console.log("✅✅✅ RUNNING THE LATEST SERVER.JS FILE (Supabase Version) - FINAL FIX FOR COMMENTS APPLIED ✅✅✅");
console.log("👉 Running THIS server.js from smart3/smart/server");

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============================================
// 🎯 اتصال Supabase
// ============================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Successfully connected to Supabase client');


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

const verifyAdminRole = (req, res, next) => {
    const userRole = req.user.role; 

    if (userRole !== 'schedule' && userRole !== 'load committee') {
        return res.status(403).json({ error: 'غير مصرح لك: يجب أن تكون مسؤول جدول زمني أو عضو لجنة.' });
    }
    next();
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { return res.status(400).json({ error: 'Email and password are required' }); }
    const { data: userResult, error: userError } = await supabase.rpc('get_user_login_info', { user_email: email });
    if (userError) throw userError;
    if (!userResult || userResult.length === 0) { return res.status(401).json({ error: 'Incorrect credentials' }); }

    const user = userResult[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) { return res.status(401).json({ error: 'Incorrect credentials' }); }

    if (user.role === 'student') {
      let studentId = user.student_id;
      let level = user.level;
      let is_ir = user.is_ir;

      if (!studentId) {
        const { data: studentData, error: studentDataError } = await supabase
          .from('students')
          .select('student_id, level, is_ir')
          .eq('user_id', user.user_id);
        if (studentDataError) throw studentDataError;
        if (!studentData || studentData.length === 0) {
          return res.status(403).json({ error: 'User has student role but no student record exists.' });
        }
        const student = studentData[0];
        studentId = student.student_id; level = student.level; is_ir = student.is_ir;
      }
      const token = jwt.sign(
        { id: studentId, user_id: user.user_id, email: user.email, type: 'student', role: user.role }, 
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        token,
        user: { id: studentId, user_id: user.user_id, email: user.email, name: user.name, level: level, is_ir: is_ir, type: 'student', role: 'student' },
      });
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({
      token,
      user: { id: user.user_id, email: user.email, name: user.name, role: user.role, type: 'user' },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  } 
});

app.post('/api/auth/register-user', authenticateToken, verifyAdminRole, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ email: email, password: hashedPassword, name: name, role: role, })
      .select('user_id')
      .single(); 
    if (error) throw error;
    res.json({ success: true, message: 'تمت إضافة المستخدم بنجاح!', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505' || (error.message && error.message.includes('duplicate key value'))) {
      res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    } else {
      res.status(500).json({ error: 'خطأ في إضافة المستخدم' });
    }
  } 
});

app.post('/api/auth/register-student', authenticateToken, verifyAdminRole, async (req, res) => {
  try {
    const { email, password, name, level, is_ir } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({ email: email, password: hashedPassword, name: name, role: 'student', })
      .select('user_id')
      .single();

    if (userError) throw userError;
    const userId = newUser.user_id;

    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert({ user_id: userId, level: level, is_ir: is_ir || false, })
      .select('student_id')
      .single();
    
    if (studentError) throw studentError;

    res.json({ success: true, message: 'تمت إضافة الطالب بنجاح!', studentId: newStudent.student_id, userId, });
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.code === '23505' || (error.message && error.message.includes('duplicate key value'))) {
      res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    } else {
      res.status(500).json({ error: 'خطأ في إضافة الطالب' });
    }
  }
});

// ============================================
// STUDENT ROUTES
// ============================================

// ✅ مسار جلب الطلاب مع دعم الفلترة حسب المستوى والانتظام
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const { level, is_ir } = req.query; 
    
    let query = supabase
      .from('students')
      .select(`
        student_id,
        level,
        is_ir,
        users (
          user_id,
          name,
          email
        )
      `);

    if (level && level !== '') {
        query = query.eq('level', level); 
    }
    
    if (is_ir === 'true' || is_ir === 'false') {
        const irBoolean = is_ir === 'true';
        query = query.eq('is_ir', irBoolean);
    }

    const { data: studentsData, error } = await query; 

    if (error) throw error;
    
    const formattedStudents = studentsData.map(student => ({
      ...student,
      user_id: student.users.user_id,
      name: student.users.name,
      email: student.users.email,
      users: undefined 
    }));
    res.json(formattedStudents);
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ error: 'Failed to fetch student list.' });
  }
});

app.get('/api/schedules/level/:level', authenticateToken, async (req, res) => {
  console.log(`--- [ DIAGNOSTIC ] --- Hit route for level: ${req.params.level}`);
  try {
    const { level } = req.params;

    const { data: scheduleResult, error } = await supabase
      .from('schedule_versions')
      .select('*')
      .eq('level', level)
      .eq('is_active', true)
      .limit(1)
      .single(); 

    if (error && error.code === 'PGRST116') {
      console.log(`--- [ DIAGNOSTIC ] --- No active schedule found for level ${level}.`);
      return res.status(404).json({ message: `No active schedule found for level ${level}.` });
    }
    
    if (error) throw error;

    res.json({ schedule: scheduleResult, comments: [] });

  } catch (error) {
    console.error('--- [ DIAGNOSTIC ] --- CRASH DETECTED IN ROUTE:');
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch schedule data due to a server crash.' });
  } 
});

app.get('/api/statistics', authenticateToken, async (req, res) => {
  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'غير مصرح لك بالوصول للإحصائيات.' });
  }

  try {
    const { count: totalStudents, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact' });
    if (studentsError) throw studentsError;

    const { count: totalComments, error: commentsError } = await supabase
      .from('comments')
      .select('*', { count: 'exact' });
    if (commentsError) throw commentsError;
    
    const studentsVoted = totalStudents * 0.7; 

    res.json({
      totalStudents: totalStudents || 0,
      votingStudents: Math.round(studentsVoted) || 0,
      totalComments: totalComments || 0,
    });

  } catch (error) {
    console.error('Statistics fetch error:', error);
    res.status(500).json({ error: 'فشل داخلي في جلب الإحصائيات.' });
  }
});

app.put('/api/students/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { level, is_ir } = req.body; 

        const updateFields = {};
        if (level) updateFields.level = level;
        if (typeof is_ir === 'boolean') updateFields.is_ir = is_ir;

        const { data, error } = await supabase
            .from('students')
            .update(updateFields)
            .eq('student_id', studentId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'Student updated successfully', student: data });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ error: 'Failed to update student data.' });
    }
});

app.delete('/api/students/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { error: studentDeleteError } = await supabase
            .from('students')
            .delete()
            .eq('student_id', studentId);
        
        if (studentDeleteError) throw studentDeleteError;
        res.json({ success: true, message: 'Student deleted successfully.' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Failed to delete student.' });
    }
});

// ============================================
// COURSE ROUTES
// ============================================

// ✅ مسار جلب المواد حسب المستوى (لحل مشكلة AddElective.jsx)
app.get('/api/courses/level/:level', authenticateToken, async (req, res) => {
    try {
        const { level } = req.params; 
        
        const levelInt = parseInt(level, 10);
        if (isNaN(levelInt)) {
            return res.status(400).json({ error: 'Invalid level parameter.' });
        }
        
        const { data: coursesData, error } = await supabase
            .from('courses')
            .select('course_id, name, level, dept_code, is_elective')
            .eq('level', levelInt)
            .order('name', { ascending: true });

        if (error) throw error;

        const formattedCourses = coursesData.map(course => ({
            course_id: course.course_id,
            name: course.name,
            level: course.level,
            code: course.name.split(' ')[0] || course.dept_code, 
        }));
        
        res.json(formattedCourses || []);

    } catch (error) {
        console.error('Error fetching courses by level:', error);
        res.status(500).json({ error: 'فشل في جلب المواد حسب المستوى من الخادم.' });
    }
});


// ============================================
// SCHEDULE & SECTION ROUTES
// ============================================

// 1. جلب إصدارات الجدول الزمني (Versions) حسب المستوى
app.get('/api/schedules/versions', authenticateToken, async (req, res) => {
    try {
        const { level } = req.query; 
        if (!level) { return res.status(400).json({ error: 'Level parameter is required.' }); }

        const { data: versions, error } = await supabase
            .from('schedule_versions') 
            .select('id, version: version_comment, is_active, created_at, level') 
            .eq('level', level)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(versions || []);

    } catch (error) {
        console.error('--- Supabase Error - GET /schedules/versions ---');
        console.error(error);
        res.status(500).json({ error: 'فشل في جلب إصدارات الجدول الزمني. (تحقق من أسماء الأعمدة)' });
    }
});


// 2. جلب الأقسام (Sections) حسب المستوى
app.get('/api/sections', authenticateToken, async (req, res) => {
    try {
        const { level } = req.query; 
        if (!level) { return res.status(400).json({ error: 'Level parameter is required.' }); }

        const { data: sections, error } = await supabase
            .from('sections')
            .select(`
                id: section_id, 
                section_type,
                day_code, 
                start_time, 
                end_time, 
                student_group,
                courses!inner( 
                    course_id, 
                    code: name,
                    course_name: name,
                    level 
                )
            `)
            .eq('courses.level', level); 

        if (error) throw error;

        const formattedSections = sections.map(section => ({
            id: section.id,
            course_id: section.courses.course_id,
            code: section.courses.code.split(' ')[0] || section.courses.code, 
            course_name: section.courses.course_name, 
            section_number: section.section_type === 'LECTURE' ? 1 : (section.section_type === 'LAB' ? 2 : 3), 
            start_time: section.start_time,
            end_time: section.end_time,
            day_code: section.day_code,
            level: section.courses.level, 
        }));

        res.json(formattedSections);

    } catch (error) {
        console.error('--- Supabase Error - GET /sections ---');
        console.error(error);
        res.status(500).json({ error: 'فشل في جلب أقسام المواد. (تحقق من الـ JOIN مع جدول courses)' });
    }
});


// 3. تفعيل إصدار
app.put('/api/schedules/versions/activate/:versionId', authenticateToken, async (req, res) => {
    const { versionId } = req.params;
    try {
        const { data: currentVersion, error: selectError } = await supabase
            .from('schedule_versions')
            .select('level')
            .eq('id', versionId)
            .single();

        if (selectError) throw selectError;
        const level = currentVersion.level;

        await supabase
            .from('schedule_versions')
            .update({ is_active: false })
            .eq('level', level);

        const { data, error } = await supabase
            .from('schedule_versions')
            .update({ is_active: true })
            .eq('id', versionId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'Version activated successfully.', version: data });
    } catch (error) {
        console.error('Activation error:', error);
        res.status(500).json({ error: 'Failed to activate schedule version.' });
    }
});

// 4. حذف إصدار
app.delete('/api/schedules/versions/:versionId', authenticateToken, async (req, res) => {
    const { versionId } = req.params;
    try {
        const { error } = await supabase
            .from('schedule_versions')
            .delete()
            .eq('id', versionId);

        if (error) throw error;
        res.json({ success: true, message: 'Version deleted successfully.' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete version.' });
    }
});

// 5. مسار توليد جدول زمني جديد
app.post('/api/schedules/generate', authenticateToken, async (req, res) => {
    try {
        const { level } = req.body;
        if (!level) { return res.status(400).json({ error: 'Level is required for schedule generation.' }); }

        const mockSections = []; 
        
        const newVersionData = {
            level: level,
            sections: mockSections, 
            student_count: 25, 
            version_comment: `AI Generated V${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })} - ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            is_active: false, 
        };

        const { data: newVersion, error } = await supabase
            .from('schedule_versions')
            .insert(newVersionData)
            .select('id, version_comment, level')
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: `New schedule version generated for Level ${level}.`,
            version: { id: newVersion.id, version: newVersion.version_comment, level: newVersion.level }
        });

    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ error: 'فشل في توليد الجدول الزمني بواسطة AI.' });
    }
});


// ============================================
// COMMENTS ROUTES - ✅ FIXED VERSION
// ============================================

// ✅ دالة مشتركة لجلب وتنسيق التعليقات - النسخة المُصلحة
async function fetchAndFormatComments(level) {
    console.log('🔍 [fetchAndFormatComments] Requested level:', level);
    
    let query = supabase
        .from('comments')
        .select(`
            id,
            comment,
            created_at,
            schedule_version_id,
            students!inner( 
                student_id,
                level,
                users (
                    student_name: name
                )
            ),
            schedule_versions (
                version_comment
            )
        `)
        .order('created_at', { ascending: false });

    // ✅ تطبيق فلترة المستوى إذا تم تحديده
    if (level && level !== '' && level !== 'undefined' && level !== 'null') {
        const levelInt = parseInt(level, 10);
        if (!isNaN(levelInt)) {
            console.log('✅ [fetchAndFormatComments] Filtering by level:', levelInt);
            query = query.eq('students.level', levelInt);
        }
    } else {
        console.log('📋 [fetchAndFormatComments] No level filter applied - fetching all comments');
    }

    const { data: commentsData, error } = await query;
    
    if (error) {
        console.error('❌ [fetchAndFormatComments] Supabase Error:', error);
        throw error;
    }

    console.log('✅ [fetchAndFormatComments] Comments fetched:', commentsData.length);

    // تنسيق البيانات لتناسب ManageNotifications.jsx
    return commentsData.map(c => ({
        comment_id: c.id,
        comment: c.comment,
        created_at: c.created_at,
        schedule_version_id: c.schedule_version_id,
        version_comment: c.schedule_versions?.version_comment || 'No Version Info',
        student_level: c.students?.level,
        student_name: c.students?.users?.student_name || 'Unknown Student',
    }));
}

// 1. مسار جلب كل التعليقات (للتوافق)
app.get('/api/comments/all', authenticateToken, async (req, res) => {
    console.log('📡 [GET /api/comments/all] Request received');
    try {
        const data = await fetchAndFormatComments(null);
        console.log('✅ [GET /api/comments/all] Sending response with', data.length, 'comments');
        res.json(data);
    } catch (error) {
        console.error('❌ [GET /api/comments/all] Error:', error);
        res.status(500).json({ error: 'فشل في جلب كل التعليقات.' });
    }
});


// 2. مسار جلب التعليقات حسب المستوى - ✅ FIXED
app.get('/api/comments/level/:level', authenticateToken, async (req, res) => {
    const { level } = req.params;
    console.log('📡 [GET /api/comments/level/:level] Request received for level:', level);
    
    try {
        const data = await fetchAndFormatComments(level);
        console.log('✅ [GET /api/comments/level/:level] Sending response with', data.length, 'comments for level', level);
        res.json(data);
    } catch (error) {
        console.error('❌ [GET /api/comments/level/:level] Error:', error);
        res.status(500).json({ error: 'فشل في جلب التعليقات حسب المستوى.' });
    }
});


// ============================================
// HEALTH CHECK & FINAL MIDDLEWARE
// ============================================
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
  console.log(`🚀 SmartSchedule Server running on port ${PORT}`);
  console.log(`📊 Connected to Supabase client: ${process.env.SUPABASE_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  process.exit(0);
});