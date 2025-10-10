import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Navbar, Nav, Badge, ListGroup, Spinner } from 'react-bootstrap';
import { FaSave, FaPlus, FaTrash, FaTimes, FaHome, FaCalendarAlt, FaUsers, FaBook, FaBalanceScale, FaBell, FaSignOutAlt, FaBullhorn } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
// ملاحظة: سنفترض وجود ملف api للـ notifications لاحقًا
// import { notificationAPI } from '../services/api'; 
import '../App.css'; 

const COMMITTEE_PASSWORD = "loadcommittee2025"; 

// بيانات وهمية للإشعارات
const MOCK_NOTIFICATIONS = [
    { id: 101, title: 'Voting Period Extended', content: 'The elective course voting period has been extended until Thursday, 17th of October.', date: '2025-10-09', type: 'System Update' },
    { id: 102, title: 'New Schedule Drafts', content: 'The first draft of Level 7 schedules is now available for review by faculty members.', date: '2025-10-05', type: 'Review Alert' },
    { id: 103, title: 'Server Maintenance', content: 'Scheduled maintenance will occur on the Smart Schedule system tonight from 1 AM to 4 AM.', date: '2025-10-01', type: 'System Maintenance' },
];


const ManageNotifications = () => {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [newNotification, setNewNotification] = useState({ title: '', content: '', type: 'General' });
    const [accessPass, setAccessPass] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    // Mock user info for Navbar consistency
    const [userInfo, setUserInfo] = useState({ name: 'Guest', role: 'Load Committee' });
    const fetchUserInfo = () => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        } else {
            setUserInfo({ name: 'Committee Member', role: 'Load Committee' });
        }
    };

    // ------------------------------------------------------------------
    // Handlers & Functions
    // ------------------------------------------------------------------

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewNotification(prev => ({ ...prev, [name]: value }));
    };

    const handleDeleteNotification = async (idToRemove) => {
        if (!window.confirm("Are you sure you want to permanently delete this notification?")) {
            return;
        }

        setLoading(true);

        // هنا سيكون استدعاء API الفعلي:
        // try {
        //     await notificationAPI.delete(idToRemove); 
        //     setNotifications(notifications.filter(notif => notif.id !== idToRemove));
        //     showMessage("Notification deleted successfully.", 'success');
        // } catch(err) {
        //     showMessage("Failed to delete notification.", 'danger');
        // }

        // Mock Delete:
        await new Promise(resolve => setTimeout(resolve, 500)); 
        setNotifications(notifications.filter(notif => notif.id !== idToRemove));
        showMessage("Notification deleted successfully. (Mock Delete)", 'success');
        setLoading(false);
    };

    const handlePublish = async (e) => {
        e.preventDefault();

        if (accessPass !== COMMITTEE_PASSWORD) {
            showMessage("Incorrect password. Access denied.", 'danger');
            return;
        }

        const { title, content } = newNotification;
        if (!title || !content) {
            showMessage("Please fill in both the Title and Content fields.", 'warning');
            return;
        }

        setLoading(true);

        const notificationData = {
            ...newNotification,
            date: new Date().toISOString().split('T')[0],
        };

        // هنا سيكون استدعاء API الفعلي:
        // try {
        //     const response = await notificationAPI.publish(notificationData);
        //     setNotifications([response.data, ...notifications]);
        //     showMessage("Notification published successfully!", 'success');
        // } catch (error) {
        //     showMessage("Publish Error: " + (error.response?.data?.error || 'Failed to publish notification.'), 'danger');
        // }

        // Mock Publish:
        await new Promise(resolve => setTimeout(resolve, 1500));
        const newId = Date.now();
        const publishedNotification = { ...notificationData, id: newId };
        setNotifications([publishedNotification, ...notifications]);
        setNewNotification({ title: '', content: '', type: 'General' });
        showMessage("Notification published successfully! (Mock Publish)", 'success');
        setLoading(false);
    };

    useEffect(() => {
        fetchUserInfo();
        // LTR Design Enforcement
        document.body.style.direction = 'ltr'; 
    }, []);

    // ------------------------------------------------------------------
    // Main Render
    // ------------------------------------------------------------------

    return (
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            
            {/* عنوان الصفحة الموحد */}
            <h1 className="text-center text-white fw-bolder py-3" style={{ background: '#764ba2', margin: 0 }}>
                SMART SCHEDULE
            </h1>

            <Container fluid="lg" className="container-custom shadow-lg">
                 {/* شريط التنقل الموحد */}
                 <Navbar expand="lg" variant="dark" className="navbar-custom p-3 navbar-modified">
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className="w-100">
                        <Nav className="me-auto my-2 my-lg-0 nav-menu nav-menu-expanded" style={{ fontSize: '0.9rem' }}>
                            <Nav.Link onClick={() => navigate('/dashboard')} className="nav-link-custom rounded-2 p-2 mx-1"><FaHome className="me-2" /> HOME</Nav.Link>
                            <Nav.Link onClick={() => navigate('/manageSchedules')} className="nav-link-custom rounded-2 p-2 mx-1"><FaCalendarAlt className="me-2" /> Manage Schedules & Levels</Nav.Link>
                            <Nav.Link onClick={() => navigate('/managestudents')} className="nav-link-custom rounded-2 p-2 mx-1"><FaUsers className="me-2" /> Manage Students</Nav.Link>
                            <Nav.Link onClick={() => navigate('/addElective')} className="nav-link-custom rounded-2 p-2 mx-1"><FaBook className="me-2" /> Course Information</Nav.Link>
                            <Nav.Link onClick={() => navigate('/managerules')} className="nav-link-custom rounded-2 p-2 mx-1"><FaBalanceScale className="me-2" /> Manage Rules</Nav.Link>
                            {/* الرابط النشط للصفحة الحالية */}
                            <Nav.Link onClick={() => navigate('/managenotifications')} className="nav-link-custom active rounded-2 p-2 mx-1"><FaBell className="me-2" /> Manage Notifications</Nav.Link>
                        </Nav>
                        <div className="user-section d-flex flex-column align-items-end ms-lg-4 mt-3 mt-lg-0">
                            <div className="d-flex align-items-center mb-2">
                                <div className="user-info text-white text-start me-3">
                                    <div className="user-name fw-bold">{userInfo.name}</div>
                                    <div className="user-role" style={{ opacity: 0.8, fontSize: '0.8rem' }}>{userInfo.role}</div>
                                </div>
                                <Button variant="danger" className="logout-btn fw-bold py-2 px-3" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}>
                                    <FaSignOutAlt className="me-1" /> Logout
                                </Button>
                            </div>
                            <Badge bg="light" text="dark" className="committee-badge p-2 mt-1" style={{ width: 'fit-content' }}>
                                Admin Dashboard
                            </Badge>
                        </div>
                    </Navbar.Collapse>
                </Navbar>


                <Card className="shadow-lg border-0 mt-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <Card.Header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                        <h1 className="mb-2" style={{ fontSize: '2rem' }}>Manage Notifications</h1>
                        <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                            Create and manage system-wide notifications for students and staff.
                        </p>
                    </Card.Header>

                    <Card.Body className="p-4">
                        
                        {message.text && (
                            <Alert variant={message.type} className="text-start fw-bold">
                                {message.text}
                            </Alert>
                        )}
                        
                        {/* 1. قسم إنشاء إشعار جديد */}
                        <Card className="mb-5 shadow-sm border-primary border-2">
                            <Card.Header className="bg-primary text-white fw-bold">
                                <FaBullhorn className="me-2" /> Publish New Notification
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={handlePublish}>
                                    <Row className="g-3 mb-3">
                                        <Col md={7}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Title</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    name="title" 
                                                    value={newNotification.title}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., Voting Deadline Extended"
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Type/Category</Form.Label>
                                                <Form.Select 
                                                    name="type" 
                                                    value={newNotification.type}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="General">General</option>
                                                    <option value="System Update">System Update</option>
                                                    <option value="Deadline">Deadline</option>
                                                    <option value="Review Alert">Review Alert</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold">Content</Form.Label>
                                        <Form.Control 
                                            as="textarea"
                                            rows={3}
                                            name="content" 
                                            value={newNotification.content}
                                            onChange={handleInputChange}
                                            placeholder="Write the full notification message here..."
                                            required
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold">Committee Password (Required to Publish)</Form.Label>
                                        <Form.Control 
                                            type="password" 
                                            value={accessPass}
                                            onChange={(e) => setAccessPass(e.target.value)}
                                            required 
                                        />
                                    </Form.Group>
                                    
                                    <Button 
                                        type="submit" 
                                        className="w-100 fw-bold"
                                        variant="primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Publishing...' : <><FaSave className="me-2" /> Publish Notification</>}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>

                        {/* 2. قسم عرض الإشعارات الحالية */}
                        <Card className="shadow-sm">
                            <Card.Header className="bg-light fw-bold">
                                <FaBell className="me-2 text-primary" /> Active Notifications ({notifications.length})
                            </Card.Header>
                            <Card.Body>
                                {notifications.length === 0 ? (
                                    <Alert variant="info" className="text-center">No active notifications currently.</Alert>
                                ) : (
                                    <ListGroup variant="flush">
                                        {notifications.map((notif) => (
                                            <ListGroup.Item key={notif.id} className="d-flex justify-content-between align-items-start py-3">
                                                <div>
                                                    <div className="fw-bold text-dark">{notif.title} <Badge bg="secondary" className="ms-2">{notif.type}</Badge></div>
                                                    <div className="text-muted" style={{ fontSize: '0.9rem' }}>{notif.content}</div>
                                                    <div className="text-sm text-info mt-1" style={{ fontSize: '0.8rem' }}>Published on: {notif.date}</div>
                                                </div>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    onClick={() => handleDeleteNotification(notif.id)}
                                                    disabled={loading}
                                                >
                                                    <FaTrash className="me-1" /> Delete
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </Card.Body>
                        </Card>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default ManageNotifications;