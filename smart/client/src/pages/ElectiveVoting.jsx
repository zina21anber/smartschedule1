import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Navbar, Nav, Button, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { FaBook, FaCalendarAlt, FaVoteYea, FaHome, FaSignOutAlt, FaCheckCircle, FaUserGraduate } from 'react-icons/fa';
import '../App.css';
const fetchData = async (url, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');
    const options = {
        method,
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
    };
    if (body) { options.body = JSON.stringify(body); }
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        throw new Error("Authentication failed.");
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request Failed' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};


const NewStudentNavbar = ({ userInfo, navigate, activePath }) => (
    <Container fluid="lg" className="container-custom">
        <Navbar expand="lg" variant="dark" className="navbar-custom p-3" style={{ backgroundColor: '#2a5298' }}>
            <Navbar.Brand className="fw-bold fs-5">STUDENT DASHBOARD</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto my-2 my-lg-0 nav-menu">
                    <Nav.Link onClick={() => navigate('/student-dashboard')} className={`nav-link-custom ${activePath === '/student-dashboard' ? 'active' : ''}`}><FaHome className="me-2" /> DASHBOARD</Nav.Link>
                    <Nav.Link onClick={() => navigate('/elective-voting')} className={`nav-link-custom ${activePath === '/elective-voting' ? 'active' : ''}`}><FaVoteYea className="me-2" /> VOTING</Nav.Link>
                </Nav>
                <div className="d-flex align-items-center ms-lg-4 mt-3 mt-lg-0">
                    <div className="user-info text-white text-start me-3">
                        <div className="fw-bold">{userInfo.name}</div>
                        <div className="user-role" style={{ opacity: 0.8, fontSize: '0.8rem' }}>{userInfo.email}</div>
                    </div>
                    <Button variant="danger" className="logout-btn fw-bold" onClick={() => { localStorage.clear(); navigate('/login'); }}>
                        <FaSignOutAlt className="me-1" /> Logout
                    </Button>
                </div>
            </Navbar.Collapse>
        </Navbar>
    </Container>
);
function ElectiveVoting() {
    const [electives, setElectives] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState(null);
    const [userInfo, setUserInfo] = useState({ name: 'Student', email: '' });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // --- NEW: State to manage selections in real-time ---
    const [selections, setSelections] = useState({});

    const loadPageData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) { navigate('/login'); return; }
            const user = JSON.parse(userStr);
            setStudentId(user.id);
            setUserInfo({ name: user.name || 'Student', email: user.email || '' });

            const existingVotes = await fetchData(`http://localhost:5000/api/votes/student/${user.id}`);
            if (existingVotes.length > 0) {
                setSubmitted(true);
                return;
            }

            const electivesData = await fetchData("http://localhost:5000/api/courses/elective");
            setElectives(electivesData);
            const initialSelections = {};
            electivesData.forEach(course => {
                initialSelections[course.course_id] = "";
            });
            setSelections(initialSelections);

        } catch (err) {
            console.error("Error loading data:", err);
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadPageData();
    }, [loadPageData]);
    const handleSelectionChange = (courseId, priority) => {
        setSelections(prev => ({
            ...prev,
            [courseId]: priority
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!studentId) return alert("Student ID not found. Please refresh.");

        const selected = Object.entries(selections)
            .filter(([courseId, priority]) => priority)
            .map(([courseId, priority]) => ({
                course_id: parseInt(courseId),
                priority: parseInt(priority),
            }));

        if (selected.length === 0) return alert("Please assign at least one priority.");
        if (selected.length > 3) return alert("You can assign a maximum of three priorities only.");
        const priorities = selected.map(s => s.priority);
        if (new Set(priorities).size !== priorities.length)
            return alert("Each priority number (1, 2, 3) must be used only once.");

        try {
            for (const vote of selected) {
                await fetchData("http://localhost:5000/api/vote", "POST", {
                    student_id: studentId,
                    course_id: vote.course_id,
                    vote_value: vote.priority
                });
            }
            setSubmitted(true);
        } catch (err) {
            alert(`Error submitting votes: ${err.message}`);
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };
    const usedPriorities = Object.values(selections).filter(p => p);

    return (
        <div className="dashboard-page" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}> {/* ✅ تطبيق الخلفية هنا */}
            
            {/* ✅ استخدام الـ Navbar الموحد الجديد */}
            <NewStudentNavbar userInfo={userInfo} navigate={navigate} activePath='/elective-voting' />

            <Container fluid="lg" className="container-custom">
                <main className="main-content p-4 p-md-5">
                    
                    {/* ✅ البطاقة الخارجية المدمجة - تحمل الظل والـ border radius */}
                    <div className="shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}> 

                        {/* ترويسة الصفحة - بلون موحد */}
                        <header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
                            <Container fluid="lg">
                                <h1 className="mb-2" style={{ fontSize: '2rem' }}>Elective Course Voting</h1>
                                <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                                    Rank your preferred elective courses by priority (1 = Most Preferred).
                                </p>
                            </Container>
                        </header>
                        
                        {/* ✅ المحتوى الداخلي - هو الذي يجب أن يكون باللون الأبيض ليكون مقروءًا */}
                        <div className="p-4 p-md-5 bg-white" style={{ borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}> 

                            {error && <Alert variant="danger" className="mt-3"><strong>Error:</strong> {error}</Alert>}
                            
                            {loading ? (
                                <div className="text-center py-5"><Spinner /><p className="mt-3 text-muted">Loading voting session...</p></div>
                            ) : !submitted ? (
                                <>
                                    <Alert variant="info" className="mb-4">
                                        <strong>ℹ️ Instructions:</strong> Assign a unique <strong>priority number</strong> (1, 2, or 3) to up to <strong>3 courses</strong>.
                                    </Alert>
                                    <Form onSubmit={handleSubmit}>
                                        <Row as="ul" className="list-unstyled g-3">
                                            {electives.map(course => (
                                                <Col as="li" key={course.course_id} xs={12}>
                                                    <Card className="border-2 shadow-sm notification-item-custom">
                                                        <Card.Body className="p-4">
                                                            <Row className="align-items-center">
                                                                <Col md={8}>
                                                                    <h5 className="fw-bold text-dark mb-2">{course.name}</h5>
                                                                    <Badge bg="secondary">{course.credit} Credits</Badge>
                                                                </Col>
                                                                <Col md={4} className="mt-3 mt-md-0">
                                                                    <Form.Select
                                                                        className="form-select-lg"
                                                                        value={selections[course.course_id]}
                                                                        onChange={(e) => handleSelectionChange(course.course_id, e.target.value)}
                                                                    >
                                                                        <option value="">-- Select Priority --</option>
                                                                        {[1, 2, 3].map(p => (
                                                                            <option
                                                                                key={p}
                                                                                value={p}
                                                                                disabled={usedPriorities.includes(String(p)) && selections[course.course_id] !== String(p)}
                                                                            >
                                                                                Priority {p} {p === 1 ? '(Most Preferred)' : ''}
                                                                            </option>
                                                                        ))}
                                                                    </Form.Select>
                                                                </Col>
                                                            </Row>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                        <div className="d-grid mt-4">
                                            <Button type="submit" size="lg" className="vote-btn-custom fw-bold py-3" variant="primary">
                                                <FaCheckCircle className="me-2" /> Submit My Priorities
                                            </Button>
                                        </div>
                                    </Form>
                                </>
                            ) : (
                                <div className="text-center py-5">
                                    <div style={{ fontSize: '5rem', color: '#28a745' }}><FaCheckCircle /></div>
                                    <h3 className="text-success fw-bold mt-4 mb-3">Thank You for Voting!</h3>
                                    <p className="text-muted fs-5 mb-4">Your preferences have been submitted and can no longer be changed.</p>
                                    <Button size="lg" className="vote-btn-custom fw-bold" onClick={() => navigate('/student-dashboard')}>
                                        <FaHome className="me-2" /> Return to Dashboard
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </Container>
        </div>
    );
}

export default ElectiveVoting;