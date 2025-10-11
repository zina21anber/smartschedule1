import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Navbar, Nav, Button, Spinner, Alert, ListGroup, Form, Badge } from 'react-bootstrap';
import { FaHome, FaCalendarAlt, FaUsers, FaBalanceScale, FaBell, FaSignOutAlt } from 'react-icons/fa';
import '../App.css';

// Generic fetchData function
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

const ManageNotifications = () => {
    const [allComments, setAllComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState('');
    const navigate = useNavigate();

    // Added minimal state for Navbar user info
    const [userInfo] = useState({ name: 'Admin User', role: 'Committee Head' });
    const [navbarLoading] = useState(false); // Use separate loading for Navbar info

    const academicLevels = [3, 4, 5, 6, 7, 8];

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
        fetchAllComments();
    }, [fetchAllComments]);

    // Handle Logout function for Navbar
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Filter comments based on the selected level
    const filteredComments = selectedLevel
        ? allComments.filter(comment => comment.student_level == selectedLevel)
        : allComments;

    // Group comments by schedule version for better display
    const groupedComments = filteredComments.reduce((acc, comment) => {
        const key = comment.schedule_version_id;
        if (!acc[key]) {
            acc[key] = {
                version_id: key,
                version_comment: comment.version_comment,
                level: comment.student_level, // Assuming comments for a version are from same level students
                comments: []
            };
        }
        acc[key].comments.push(comment);
        return acc;
    }, {});


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
                            <Nav.Link onClick={() => navigate('/managestudents')} className="nav-link-custom"><FaUsers className="me-2" /> Students</Nav.Link>
                            <Nav.Link onClick={() => navigate('/managerules')} className="nav-link-custom"><FaBalanceScale className="me-2" /> Rules</Nav.Link>
                            {/* THIS LINK IS NOW ACTIVE */}
                            <Nav.Link onClick={() => navigate('/managenotifications')} className="nav-link-custom active"><FaBell className="me-2" /> Comments</Nav.Link>
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
                        <h2 className="text-dark fw-bolder mb-3">Manage Student Comments</h2>
                        <p className="text-secondary fs-6">
                            Review and manage feedback on generated schedules.
                        </p>
                    </header>

                    <Card className="shadow-sm">
                        <Card.Header className="d-flex align-items-center gap-2 bg-light border-bottom">
                            <FaBell className="text-primary" />
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