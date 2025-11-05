import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Button, Alert, Spinner, Form, ListGroup, Navbar, Nav, Badge } from 'react-bootstrap';

import { FaArrowRight, FaPlusCircle, FaListAlt, FaTrash, FaHome, FaCalendarAlt, FaUsers, FaBook, FaBalanceScale, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../App.css';


const fetchData = async (url, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: body ? JSON.stringify(body) : null,
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error("AUTHENTICATION_FAILED");
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown Error' }));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
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

const ManageRules = () => {
    const [rules, setRules] = useState([]);
    const [newRuleText, setNewRuleText] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState(null);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({ name: 'Admin User', role: 'Committee Head' });

    const fetchUserInfo = useCallback(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        // ✅ التصحيح: استخدام storedUser.name كأولوية
        if (storedUser.name && storedUser.role) {
            setUserInfo({ name: storedUser.name, role: storedUser.role });
        } else if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        }
    }, []);

    const fetchRules = useCallback(async () => {
        setLoading(true);
        setPageError(null);
        try {
            const rulesData = await fetchData('http://localhost:5000/api/rules');
            setRules(rulesData);
        } catch (err) {
            console.error("Error fetching rules:", err);
            if (err.message === "AUTHENTICATION_FAILED") {
                navigate('/login');
                return;
            }
            setPageError("Failed to load rules. Please make sure the server is running.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUserInfo();
        fetchRules();
    }, [fetchRules, fetchUserInfo]);

    const handleAddRule = async (e) => {
        e.preventDefault();
        if (!newRuleText.trim()) return;

        setLoading(true);
        setPageError(null);
        setMessage(null);
        try {
            await fetchData('http://localhost:5000/api/rules', 'POST', { text: newRuleText });
            setMessage(`Rule added successfully: ${newRuleText}`);
            setNewRuleText('');
            fetchRules();
        } catch (err) {
            setPageError(err.message || 'Failed to add rule.');
        } finally {
            setLoading(false);
        }
    };

    // Delete rule
    const handleDeleteRule = async (ruleId) => {
        if (!window.confirm("Are you sure you want to delete this rule? This will affect AI scheduling.")) return;

        setLoading(true);
        setPageError(null);
        setMessage(null);
        try {
            await fetchData(`http://localhost:5000/api/rules/${ruleId}`, 'DELETE');
            setMessage("Rule deleted successfully.");
            fetchRules();
        } catch (err) {
            setPageError(err.message || 'Failed to delete rule.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            {/* ✅ استخدام الـ Navbar الموحد الجديد */}
            <NewCommitteeNavbar userInfo={userInfo} navigate={navigate} activePath='/managerules' />

            <Container fluid="lg" className="py-4">
                {/* ✅ تطبيق تصميم البطاقة والحاوية الرئيسي لصفحة الطلاب */}
                <Card className="shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>

                    {/* ✅ تلوين الـ Card Header الرئيسي بنفس تدرج صفحة الطلاب */}
                    <Card.Header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                        <h1 className="mb-2" style={{ fontSize: '2rem' }}>AI Scheduling Constraints</h1>
                        <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                            Manage the rules and constraints the AI system uses when generating or updating schedules.
                        </p>
                    </Card.Header>
                    
                    <Card.Body className="p-4">
                        
                        {message && <Alert variant="success" className="mt-3 text-center">{message}</Alert>}
                        {pageError && <Alert variant="danger" className="mt-3 text-center">{pageError}</Alert>}

                        {/* 1. Add new rule section */}
                        <Card className="shadow-sm mb-4 border-primary border-2" style={{ borderRadius: '12px' }}>
                            <Card.Header className="bg-primary text-white py-3" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                                <h4 className="mb-0 d-flex align-items-center text-xl font-bold">
                                    <FaPlusCircle className="me-2" /> Add New Rule
                                </h4>
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={handleAddRule}>
                                    <Row className="align-items-end">
                                        <Col md={9}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className='fw-bold'>
                                                    Rule Text (Example: Core lectures must be scheduled before 12:00 PM)
                                                </Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    value={newRuleText}
                                                    onChange={(e) => setNewRuleText(e.target.value)}
                                                    disabled={loading}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            {/* ✅ تطبيق لون الزر الأخضر (Success) كما في زر إضافة طالب */}
                                            <Button variant="success" type="submit" className="w-100 py-2 fw-bold" disabled={loading}>
                                                {loading ? <Spinner size="sm" animation="border" className="me-2" /> : <FaPlusCircle className="me-2" />} Add & Save
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>

                        {/* 2. Display existing rules */}
                        <Card className="shadow-sm" style={{ borderRadius: '12px' }}>
                            <Card.Header className="bg-light py-3">
                                <h4 className="mb-0 d-flex align-items-center text-dark text-xl font-bold">
                                    <FaListAlt className="me-2 text-primary" /> Active Rules ({rules.length})
                                </h4>
                            </Card.Header>
                            <Card.Body>
                                {loading ? (
                                    <div className="text-center p-5">
                                        <Spinner animation="border" variant="primary" />
                                    </div>
                                ) : rules.length === 0 ? (
                                    <Alert variant="info" className="text-center">
                                        No rules have been added yet for AI scheduling.
                                    </Alert>
                                ) : (
                                    <ListGroup as="ol" numbered>
                                        {rules.map(rule => (
                                            <ListGroup.Item
                                                key={rule.rule_id}
                                                className="d-flex justify-content-between align-items-center"
                                            >
                                                <div className="ms-2 me-auto">
                                                    <div className="fw-semibold">{rule.text}</div>
                                                </div>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteRule(rule.rule_id)}
                                                    disabled={loading}
                                                >
                                                    <FaTrash className='me-1' /> Delete
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

export default ManageRules;