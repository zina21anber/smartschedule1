import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Badge, Spinner, Navbar, Nav } from 'react-bootstrap';
import { FaArrowRight, FaUserGraduate, FaSave, FaUndo, FaTrash, FaHome, FaCalendarAlt, FaUsers, FaBook, FaBalanceScale, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api'; 
import '../App.css'; 

const MOCK_STUDENTS = [
    { student_id: '4390011', name: 'Mohammed Ali', level: 5, is_ir: true },
];

const NewCommitteeNavbar = ({ userInfo, navigate, activePath }) => (
    <Container fluid="lg" className="container-custom shadow-lg">
        <Navbar expand="lg" variant="dark" className="navbar-custom p-3">
            <Navbar.Brand className="fw-bold fs-5">ADMIN DASHBOARD</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto my-2 my-lg-0 nav-menu">
                    <Nav.Link onClick={() => navigate('/dashboard')} className={`nav-link-custom ${activePath === '/dashboard' ? 'active' : ''}`}><FaHome className="me-2" /> HOME</Nav.Link>
                    <Nav.Link onClick={() => navigate('/manageSchedules')} className={`nav-link-custom ${activePath === '/manageSchedules' ? 'active' : ''}`}><FaCalendarAlt className="me-2" /> Schedules</Nav.Link>
                    <Nav.Link onClick={() => navigate('/managestudents')} className={`nav-link-custom ${activePath === '/managestudents' ? 'active' : ''}`}><FaUsers className="me-2" /> Students</Nav.Link>
                    {/* 👇 تم ربط "Course Information" بـ /addElective 👇 */}
                    <Nav.Link onClick={() => navigate('/addElective')} className={`nav-link-custom ${activePath === '/addElective' ? 'active' : ''}`}><FaBook className="me-2" /> Course Information</Nav.Link>
                    {/* 👆 تم ربط "Course Information" بـ /addElective 👆 */}
                    <Nav.Link onClick={() => navigate('/managerules')} className={`nav-link-custom ${activePath === '/managerules' ? 'active' : ''}`}><FaBalanceScale className="me-2" /> Rules</Nav.Link>
                    <Nav.Link onClick={() => navigate('/managenotifications')} className={`nav-link-custom ${activePath === '/managenotifications' ? 'active' : ''}`}><FaBell className="me-2" />Notification</Nav.Link>
                </Nav>
                
                <div className="d-flex align-items-center ms-lg-4 mt-3 mt-lg-0">
                    <div className="text-white text-start me-3">
                        <div className="fw-bold">{userInfo.name}</div>
                        <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>{userInfo.role}</div>
                    </div>
                    <Button variant="danger" className="fw-bold" onClick={() => { localStorage.clear(); navigate('/login'); }}>
                        <FaSignOutAlt className="me-1" /> Logout
                    </Button>
                </div>
            </Navbar.Collapse>
        </Navbar>
    </Container>
);

const ManageStudents = () => {
    const [students, setStudents] = useState(MOCK_STUDENTS); 
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        studentId: '',
        studentName: '',
        currentLevel: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const levels = [3, 4, 5, 6, 7, 8];
    const [userInfo, setUserInfo] = useState({ name: 'Committee Member', role: 'Load Committee' });

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

    const fetchUserInfo = useCallback(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        }
    }, []);
    const fetchAllStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await studentAPI.getAll(); 
            setStudents(response.data || MOCK_STUDENTS); 
        } catch (err) {
            console.error('Error fetching students:', err.response || err);
            setStudents(MOCK_STUDENTS); 
            setError('Failed to load student data. Displaying mock data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();
        fetchAllStudents();
        document.body.style.direction = 'ltr';
    }, [fetchAllStudents, fetchUserInfo]);
    const handleSubmit = async (e) => {
        e.preventDefault();

        const { studentId, studentName, currentLevel } = formData;

        if (!studentId || !studentName || !currentLevel) {
            showMessage('Please fill in all fields.', 'danger');
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

            await studentAPI.create(newStudentData);
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
    const deleteStudent = async (studentId) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await studentAPI.delete(studentId);
                fetchAllStudents();
                showMessage('Student deleted successfully.', 'info');
            } catch (err) {
                console.error('Delete error:', err);
                const errMsg = err.response?.data?.error || err.message || 'Failed to delete student.';
                showMessage(errMsg, 'danger');
            }
        }
    };
    const saveStudentChanges = async (studentId, newLevel) => {
        const studentToUpdate = students.find(s => s.student_id === studentId);
        if (!studentToUpdate) return;

        try {
            const updateData = { level: parseInt(newLevel) };
            await studentAPI.update(studentId, updateData);
            fetchAllStudents();
            showMessage(`Changes saved for student ${studentToUpdate.name}!`, 'success');
        } catch (err) {
            console.error('Save changes error:', err);
            const errMsg = err.response?.data?.error || err.message || 'Failed to save changes.';
            showMessage(errMsg, 'danger');
        }
    };

    const resetStudent = (studentId) => {
        showMessage('Student data reset (mock action)', 'info');
    };

    return (
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            {/* ✅ استخدام الـ Navbar الموحد الجديد */}
            <NewCommitteeNavbar userInfo={userInfo} navigate={navigate} activePath='/managestudents' />
            
            <Container fluid="lg" className="py-4">
                <Card className="shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    
                    {/* ✅ استبدال الـ Card.Header القديم بعنوان الصفحة الجديد (بدون زر Back) */}
                    <Card.Header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                        <h1 className="mb-2" style={{ fontSize: '2rem' }}>Student Account Management</h1>
                        <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                            Add new students, update their academic levels, and manage accounts.
                        </p>
                    </Card.Header>

                    <Card.Body className="p-4">
                        <Card className="mb-4 shadow-sm" style={{ borderRadius: '12px' }}>
                            <Card.Body className="p-4">
                                <h3 className="mb-4 d-flex align-items-center">
                                    <FaUserGraduate className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                                    Add New Student
                                </h3>

                                {(error || message.text) && (
                                    <Alert variant={error ? 'danger' : message.type} className="text-center fw-bold">
                                        {error || message.text}
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit}>
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
                                                    <option value="" disabled>Select current level</option>
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
                                        Add Student
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>

                        {loading ? (
                            <div className="text-center p-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2">Loading students list...</p>
                            </div>
                        ) : students.length > 0 ? (
                            <Card className="shadow-sm" style={{ borderRadius: '12px' }}>
                                <Card.Body className="p-4">
                                    <h3 className="mb-4 d-flex align-items-center">
                                        <span className="me-2">📋</span>
                                        Added Students
                                    </h3>

                                    <Row xs={1} md={2} className="g-4">
                                        {students.map(student => (
                                            <Col key={student.student_id}>
                                                <Card
                                                    className="h-100 shadow-sm border-2"
                                                    style={{ borderRadius: '12px', transition: 'all 0.3s ease', minHeight: '250px' }}
                                                >
                                                    <Card.Body className="p-4">
                                                        <div className="mb-3 pb-3 border-bottom">
                                                            <div className="mb-2">
                                                                <Badge bg="primary" className="fs-6">
                                                                    Student ID: {student.student_id}
                                                                </Badge>
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
                                                                borderRight: '4px solid #667eea'
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