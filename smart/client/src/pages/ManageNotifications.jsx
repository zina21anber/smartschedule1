import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, ListGroup, Form, Badge, Navbar, Nav } from 'react-bootstrap';
import { FaBell, FaArrowLeft, FaHome, FaCalendarAlt, FaUsers, FaBook, FaBalanceScale, FaSignOutAlt, FaTimesCircle, FaPaperPlane, FaComments } from 'react-icons/fa';
import '../App.css';

const fetchData = async (url) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
    });
    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        throw new Error("Authentication failed. Please log in again.");
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

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
                    <Nav.Link onClick={() => navigate('/addElective')} className={`nav-link-custom ${activePath === '/addElective' ? 'active' : ''}`}><FaBook className="me-2" /> Course Information</Nav.Link>
                    <Nav.Link onClick={() => navigate('/managerules')} className={`nav-link-custom ${activePath === '/managerules' ? 'active' : ''}`}><FaBalanceScale className="me-2" /> Rules</Nav.Link>
                    <Nav.Link onClick={() => navigate('/managenotifications')} className={`nav-link-custom ${activePath === '/managenotifications' ? 'active' : ''}`}><FaBell className="me-2" /> Notification</Nav.Link>
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


const ManageNotifications = () => {
    const [allComments, setAllComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState('');
    const navigate = useNavigate();
    const academicLevels = [3, 4, 5, 6, 7, 8];
    const [userInfo, setUserInfo] = useState({ name: 'Admin User', role: 'Committee Head' });

    const fetchUserInfo = useCallback(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        }
    }, []);

    const fetchAllComments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchData('http://localhost:5000/api/comments/all');
            setAllComments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();
        fetchAllComments();
    }, [fetchAllComments, fetchUserInfo]);

    const filteredComments = selectedLevel
        ? allComments.filter(comment => comment.student_level == selectedLevel)
        : allComments;

    const groupedComments = filteredComments.reduce((acc, comment) => {
        const key = comment.schedule_version_id;
        if (!acc[key]) {
            acc[key] = {
                version_id: key,
                version_comment: comment.version_comment,
                level: comment.student_level, 
                comments: []
            };
        }
        acc[key].comments.push(comment);
        return acc;
    }, {});


    return (
        <div className="dashboard-page">
            {/* ✅ استخدام الـ Navbar الموحد الجديد */}
            <NewCommitteeNavbar userInfo={userInfo} navigate={navigate} activePath='/managenotifications' />
            
            <Container fluid="lg" className="container-custom shadow-lg">

                <main className="main-content p-4 p-md-5">
                    <Card className="shadow-sm">
                        <Card.Header className="d-flex align-items-center gap-2 bg-light border-bottom">
                            <FaComments className="text-primary" />
                            <h3 className="mb-0 fs-5">Student Feedback on Schedules</h3>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold">Filter Comments by Student Level</Form.Label>
                                <Form.Select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
                                    <option value="">Show All Levels</option>
                                    {academicLevels.map(level => (
                                        <option key={level} value={level}>Level {level}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            {loading ? (
                                <div className="text-center p-5"><Spinner /></div>
                            ) : error ? (
                                <Alert variant="danger">{error}</Alert>
                            ) : Object.keys(groupedComments).length === 0 ? (
                                <Alert variant="info" className="text-center">No comments found for the selected level.</Alert>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {Object.values(groupedComments).map(group => (
                                        <Card key={group.version_id} className="border">
                                            <Card.Header>
                                                <strong>Schedule Version:</strong> {group.version_comment || `Version ID ${group.version_id}`}
                                                <Badge bg="info" className="ms-2">Level {group.level}</Badge>
                                            </Card.Header>
                                            <ListGroup variant="flush">
                                                {group.comments.map(comment => (
                                                    <ListGroup.Item key={comment.comment_id}>
                                                        <div className="d-flex justify-content-between">
                                                            <span className="fw-bold">{comment.student_name} <Badge pill bg="secondary">Lvl {comment.student_level}</Badge></span>
                                                            <small className="text-muted">{new Date(comment.created_at).toLocaleString()}</small>
                                                        </div>
                                                        <p className="mb-0 mt-1">{comment.comment}</p>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </main>
            </Container>
        </div>
    );
};

export default ManageNotifications;