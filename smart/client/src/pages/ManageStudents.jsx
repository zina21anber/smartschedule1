import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Badge, Spinner, Navbar, Nav } from 'react-bootstrap';
import { FaHome, FaCalendarAlt, FaUsers, FaBalanceScale, FaBell, FaSignOutAlt, FaUserGraduate, FaSave, FaUndo, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api'; // ✅ Import student management API functions
import '../App.css';

// ------------------------------------------------------------------
// MAIN COMPONENT
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

    const levels = [3, 4, 5, 6, 7, 8];

    // Added minimal state for Navbar user info
    const [userInfo] = useState({ name: 'Admin User', role: 'Committee Head' });
    const [navbarLoading] = useState(false);

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

    // Handle Logout function for Navbar
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };


    // ------------------------------------------------------------------
    // FETCH STUDENTS (GET)
    // ------------------------------------------------------------------
    const fetchAllStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Note: Assuming studentAPI is mocked or correctly configured to handle auth headers
            // and return { data: studentsArray } structure.
            const response = await studentAPI.getAll();
            // Map student data to a consistent structure if needed, or just use as is
            setStudents(response.data || []);
        } catch (err) {
            console.error('Error fetching students:', err.response || err);

            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                setError('Authentication failed. Please log in again with admin privileges.');
                showMessage('Authentication failed. Please log in again.', 'danger');
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
        fetchAllStudents();
        document.body.style.direction = 'ltr';
    }, [fetchAllStudents]);

    // ------------------------------------------------------------------
    // ADD NEW STUDENT (POST)
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // DELETE STUDENT (DELETE)
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // SAVE CHANGES (PUT)
    // ------------------------------------------------------------------
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
        <div className="dashboard-page">
            <Container fluid="lg" className="container-custom shadow-lg">
                {/* START: Inserted Admin Navbar from Dashboard.jsx */}
                <Navbar expand="lg" variant="dark" className="navbar-custom p-3">
                    <Navbar.Brand className="fw-bold fs-5">ADMIN DASHBOARD</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto my-2 my-lg-0 nav-menu">
                            <Nav.Link onClick={() => navigate('/dashboard')} className="nav-link-custom"><FaHome className="me-2" /> HOME</Nav.Link>
                            <Nav.Link onClick={() => navigate('/manageSchedules')} className="nav-link-custom"><FaCalendarAlt className="me-2" /> Schedules</Nav.Link>
                            {/* THIS LINK IS NOW ACTIVE */}
                            <Nav.Link onClick={() => navigate('/managestudents')} className="nav-link-custom active"><FaUsers className="me-2" /> Students</Nav.Link>
                            <Nav.Link onClick={() => navigate('/managerules')} className="nav-link-custom"><FaBalanceScale className="me-2" /> Rules</Nav.Link>
                            <Nav.Link onClick={() => navigate('/managenotifications')} className="nav-link-custom"><FaBell className="me-2" /> Comments</Nav.Link>
                        </Nav>
                        <div className="d-flex align-items-center ms-lg-4 mt-3 mt-lg-0">
                            <div className="text-white text-start me-3">
                                <div className="fw-bold">{navbarLoading ? '...' : userInfo.name}</div>
                                <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>{userInfo.role}</div>
                            </div>
                            <Button variant="danger" className="fw-bold" onClick={handleLogout}>
                                <FaSignOutAlt className="me-1" /> Logout
                            </Button>
                        </div>
                    </Navbar.Collapse>
                </Navbar>
                {/* END: Inserted Admin Navbar from Dashboard.jsx */}

                <main className="main-content p-4 p-md-5">
                    <header className="text-center mb-5">
                        <h2 className="text-dark fw-bolder mb-3">Manage Students by Levels</h2>
                        <p className="text-secondary fs-6">
                            View, add, and manage student records and academic levels.
                        </p>
                    </header>

                    <Card className="shadow-lg border-0 bg-white">
                        <Card.Body className="p-4">
                            <Card className="mb-4 shadow-sm border-0">
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
                                            variant="primary"
                                            className="w-100 fw-bold py-3"
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
                                <Card className="shadow-sm border-0">
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
                                                                        ID: {student.student_id}
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
                                <div className="text-center text-gray-600 p-5 bg-light border-dashed border-2 border-primary rounded-lg">
                                    <p className='fw-bold mb-0'>No students currently in the list.</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </main>
            </Container>
        </div>
    );
};

export default ManageStudents;