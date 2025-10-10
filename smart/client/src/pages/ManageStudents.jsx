import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Badge, Spinner, Navbar, Nav } from 'react-bootstrap';
// تم تغيير اتجاه الأيقونات (me-2 -> ms-2 أو mr-2) والأيقونات نفسها (ArrowRight -> ArrowLeft)
import { FaArrowLeft, FaUserGraduate, FaSave, FaUndo, FaTrash, FaHome, FaUsers, FaBook, FaBalanceScale, FaBell, FaSignOutAlt, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api'; // ✅ استيراد دوال إدارة الطلاب
import '../App.css'; // لضمان تطبيق تنسيقات الشريط الموحد

// ------------------------------------------------------------------
// المكون الرئيسي
// ------------------------------------------------------------------
const ManageStudents = () => {
    const [students, setStudents] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        studentId: '', 
        studentName: '',
        currentLevel: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    // ✅ Add mock user info for the navbar (required for consistency)
    const [userInfo, setUserInfo] = useState({ name: 'Joud (Mock)', role: 'Load Committee' });


    const levels = [3, 4, 5, 6, 7, 8];

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // ✅ Mock user info fetch function (required for consistency)
    const fetchUserInfo = () => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        } else {
            setUserInfo({ name: 'Joud (Mock)', role: 'Load Committee Head' });
        }
    };


    // ------------------------------------------------------------------
    // جلب الطلاب من الـ API (GET)
    // ------------------------------------------------------------------
    const fetchAllStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await studentAPI.getAll(); 
            setStudents(response.data || []); 
        } catch (err) {
            console.error('Error fetching students:', err.response || err);
            
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                setError('Authentication failed. Please log in again with admin privileges.');
                showMessage('Authentication failed. You may need to log in again.', 'danger');
            } else {
                setError('Failed to load student data. Please ensure the server is running.');
                showMessage(`Error: ${err.message}`, 'danger');
            }
            setStudents([]); 
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();
        fetchAllStudents();
        // ✅ تغيير الاتجاه إلى LTR
        document.body.style.direction = 'ltr';
        return () => {
            // (اختياري: لإعادة الضبط إذا كانت بقية التطبيق RTL)
            // document.body.style.direction = 'rtl';
        };
    }, [fetchAllStudents]);

    // ------------------------------------------------------------------
    // إضافة طالب جديد (POST)
    // ------------------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        const { studentId, studentName, currentLevel } = formData;

        if (!studentId || !studentName || !currentLevel) {
            showMessage('Please fill in all required fields.', 'danger');
            return;
        }

        try {
            const newStudentData = {
                studentId: studentId,
                studentName: studentName,
                level: parseInt(currentLevel),
                email: `${studentId}@student.ksu.edu.sa`, 
                password: 'ksu_default_pwd', 
                is_ir: true,
            };

            const response = await studentAPI.create(newStudentData);

            fetchAllStudents(); 

            setFormData({
                studentId: '',
                studentName: '',
                currentLevel: ''
            });

            showMessage(`Student ${studentName} added successfully!`, 'success');

        } catch (err) {
            console.error('Submit error:', err.response || err);
            const errMsg = err.response?.data?.error || err.message || 'Failed to add student.';
            showMessage(errMsg, 'danger');
        }
    };

    // ------------------------------------------------------------------
    // حذف طالب (DELETE)
    // ------------------------------------------------------------------
    const deleteStudent = async (studentId) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await studentAPI.delete(studentId); 
                fetchAllStudents();
                showMessage('Student deleted successfully', 'info');
            } catch (err) {
                console.error('Delete error:', err);
                const errMsg = err.response?.data?.error || err.message || 'Failed to delete student.';
                showMessage(errMsg, 'danger');
            }
        }
    };

    // ------------------------------------------------------------------
    // حفظ التغييرات (PUT)
    // ------------------------------------------------------------------
    const saveStudentChanges = async (studentId, newLevel) => {
        const studentToUpdate = students.find(s => s.student_id === studentId);
        if (!studentToUpdate) return;
        
        try {
            const updateData = { level: parseInt(newLevel) }; 
            await studentAPI.update(studentId, updateData); 
            fetchAllStudents();
            showMessage(`Student ${studentToUpdate.name}'s changes saved successfully!`, 'success');
        } catch (err) {
            console.error('Save changes error:', err);
            const errMsg = err.response?.data?.error || err.message || 'Failed to save changes.';
            showMessage(errMsg, 'danger');
        }
    };

    const resetStudent = (studentId) => {
        showMessage('Student data reset (mock)', 'info');
    };

    return (
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            
            {/* التعديل 1: عنوان الصفحة الموحد */}
            <h1 className="text-center text-white fw-bolder py-3" style={{ background: '#764ba2', margin: 0 }}>
                SMART SCHEDULE
            </h1>

            <Container fluid="lg" className="container-custom shadow-lg">
                {/* التعديل 2: شريط التنقل الموحد */}
                <Navbar expand="lg" variant="dark" className="navbar-custom p-3 navbar-modified">
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className="w-100">
                        {/* القائمة: من اليسار لليمين */}
                        <Nav className="me-auto my-2 my-lg-0 nav-menu nav-menu-expanded" style={{ fontSize: '0.9rem' }}>
                            <Nav.Link onClick={() => navigate('/dashboard')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaHome className="me-2" /> HOME
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/manageSchedules')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaCalendarAlt className="me-2" /> Manage Schedules & Levels
                            </Nav.Link>
                            {/* تم تمييز رابط هذه الصفحة */}
                            <Nav.Link onClick={() => navigate('/managestudents')} className="nav-link-custom active rounded-2 p-2 mx-1">
                                <FaUsers className="me-2" /> Manage Students
                            </Nav.Link>
                            {/* ✅ التعديل هنا: استخدام navigate للمسار الجديد Course Information */}
                            <Nav.Link onClick={() => navigate('/addElective')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaBook className="me-2" /> Course Information
                            </Nav.Link>
                            {/* 🚀 التعديل لربط Manage Rules */}
                            <Nav.Link onClick={() => navigate('/managerules')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaBalanceScale className="me-2" /> Manage Rules
                            </Nav.Link>
                            {/* 🚀 التعديل لربط Manage Notifications */}
                            <Nav.Link onClick={() => navigate('/managenotifications')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaBell className="me-2" /> Manage Notifications
                            </Nav.Link>
                        </Nav>

                        {/* قسم المستخدم وزر الخروج و Admin Dashboard (تحتها) */}
                        <div className="user-section d-flex flex-column align-items-end ms-lg-4 mt-3 mt-lg-0">
                            <div className="d-flex align-items-center mb-2">
                                <div className="user-info text-white text-start me-3">
                                    <div className="user-name fw-bold">{loading ? 'Loading...' : userInfo.name}</div>
                                    <div className="user-role" style={{ opacity: 0.8, fontSize: '0.8rem' }}>{userInfo.role}</div>
                                </div>
                                <Button variant="danger" className="logout-btn fw-bold py-2 px-3" onClick={() => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    navigate('/login');
                                }}>
                                    <FaSignOutAlt className="me-1" /> Logout
                                </Button>
                            </div>
                            {/* Admin Dashboard تحت زر Logout */}
                            <Badge bg="light" text="dark" className="committee-badge p-2 mt-1" style={{ width: 'fit-content' }}>
                                Admin Dashboard
                            </Badge>
                        </div>
                    </Navbar.Collapse>
                </Navbar>
                {/* نهاية شريط التنقل الموحد */}

                <Card className="shadow-lg border-0 mt-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <Card.Header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                        <h1 className="mb-2" style={{ fontSize: '2rem' }}>Student Level Management</h1>
                        <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                            Enter student data and assign their current level.
                        </p>
                    </Card.Header>

                    <Card.Body className="p-4">
                        <Card className="mb-4 shadow-sm" style={{ borderRadius: '12px' }}>
                            <Card.Body className="p-4">
                                {/* تم عكس الترتيب لـ LTR */}
                                <h3 className="mb-4 d-flex align-items-center text-start">
                                    <FaUserGraduate className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                                    Add New Student
                                </h3>

                                {(error || message.text) && (
                                    <Alert variant={error ? 'danger' : message.type} className="text-start fw-bold">
                                        {error || message.text}
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit} dir="ltr"> {/* dir="ltr" لتثبيت اتجاه النموذج */}
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Student ID</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="studentId"
                                                    placeholder="441000123"
                                                    value={formData.studentId}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Student Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="studentName"
                                                    placeholder="Enter full student name"
                                                    value={formData.studentName}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Current Level</Form.Label>
                                                <Form.Select
                                                    name="currentLevel"
                                                    value={formData.currentLevel}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="" disabled>Select Current Level</option>
                                                    {levels.map(level => (
                                                        <option key={level} value={level}>Level {level}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Button 
                                        type="submit" 
                                        className="w-100 fw-bold"
                                        style={{ 
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            padding: '1rem 2rem',
                                            borderRadius: '8px',
                                            fontSize: '1rem'
                                        }}
                                        disabled={loading}
                                    >
                                        Add Student & Assign Level
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>

                        {/* قسم عرض الطلاب المضافين */}
                        {loading ? (
                            <div className="text-center p-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2">Loading student list...</p>
                            </div>
                        ) : students.length > 0 ? (
                            <Card className="shadow-sm" style={{ borderRadius: '12px' }}>
                                <Card.Body className="p-4">
                                    <h3 className="mb-4 d-flex align-items-center text-start">
                                        <span className="me-2">📋</span>
                                        Enrolled Students
                                    </h3>

                                    <Row xs={1} md={2} className="g-4">
                                        {students.map(student => (
                                            <Col key={student.student_id}>
                                                <Card 
                                                    className="h-100 shadow-sm border-2"
                                                    style={{ borderRadius: '12px', transition: 'all 0.3s ease', minHeight: '250px' }}
                                                >
                                                    <Card.Body className="p-4">
                                                        <div className="mb-3 pb-3 border-bottom text-start">
                                                            <div className="mb-2">
                                                                <Badge bg="primary" className="fs-6 me-2">
                                                                    ID: {student.student_id}
                                                                </Badge>
                                                                {/* عرض حالة IR_ST */}
                                                                {student.is_ir && (
                                                                    <Badge bg="info" className="fs-6 me-2">
                                                                        IR_ST
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="fs-5 fw-bold text-dark">
                                                                Name: {student.name}
                                                            </div>
                                                        </div>

                                                        <div 
                                                            className="mb-3 p-3 rounded"
                                                            style={{ 
                                                                background: 'rgba(102, 126, 234, 0.05)',
                                                                borderLeft: '4px solid #667eea' // borderRight changed to borderLeft
                                                            }}
                                                        >
                                                            <div className="d-flex justify-content-between mb-2">
                                                                <span className="fw-bold text-secondary">Current Level:</span>
                                                                <span className="fw-bold text-dark">Level {student.level}</span>
                                                            </div>
                                                        </div>

                                                        <div className="d-flex gap-2 pt-3 border-top">
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                className="flex-fill fw-bold"
                                                                onClick={() => saveStudentChanges(student.student_id, student.level)}
                                                                style={{ borderRadius: '8px' }}
                                                            >
                                                                <FaSave className="me-1" /> Save
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="flex-fill fw-bold"
                                                                onClick={() => resetStudent(student.student_id)}
                                                                style={{ borderRadius: '8px' }}
                                                            >
                                                                <FaUndo className="me-1" /> Reset
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                className="flex-fill fw-bold"
                                                                onClick={() => deleteStudent(student.student_id)}
                                                                style={{ borderRadius: '8px' }}
                                                            >
                                                                <FaTrash className="me-1" /> Delete
                                                            </Button>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                        ) : (
                            <div className="text-center text-gray-600 p-6 bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg">
                                <p>No students currently in the list.</p>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default ManageStudents;