import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, ListGroup, Form, Badge, Navbar, Nav } from 'react-bootstrap';
import { FaBell, FaArrowLeft, FaHome, FaCalendarAlt, FaUsers, FaBook, FaBalanceScale, FaSignOutAlt, FaTimesCircle, FaPaperPlane, FaComments } from 'react-icons/fa';
import '../App.css';
import { commentsAPI } from '../services/api'; 


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
    const [selectedLevel, setSelectedLevel] = useState(''); // قيمة فارغة تعني "Show All Levels"
    const navigate = useNavigate();
    const academicLevels = [3, 4, 5, 6, 7, 8];
    const [userInfo, setUserInfo] = useState({ name: 'Admin User', role: 'Committee Head' });

    const fetchUserInfo = useCallback(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.name && storedUser.role) { 
            setUserInfo({ name: storedUser.name, role: storedUser.role });
        } else if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        }
    }, []);

    // ✅ دالة جلب التعليقات المُحسّنة مع Logging تفصيلي
    const fetchComments = useCallback(async (level) => {
        console.log('🔄 [fetchComments] Starting fetch for level:', level);
        setLoading(true);
        setError(null);
        
        try {
            let response;
            
            if (level && level !== '' && level !== 'undefined' && level !== 'null') {
                console.log('📡 [fetchComments] Calling API: getCommentsByLevel with level:', level);
                response = await commentsAPI.getCommentsByLevel(level); 
            } else {
                console.log('📡 [fetchComments] Calling API: getAllComments');
                response = await commentsAPI.getAllComments();
            }
            
            console.log('✅ [fetchComments] API Response received:', response.data);
            console.log('📊 [fetchComments] Number of comments:', response.data.length);
            
            setAllComments(response.data);
            
        } catch (err) {
            console.error('❌ [fetchComments] Error occurred:', err);
            console.error('❌ [fetchComments] Error response:', err.response);
            console.error('❌ [fetchComments] Error message:', err.message);
            
            const errMsg = err.response?.data?.error || err.message || 'فشل في جلب التعليقات حسب المستوى.';
            setError(errMsg);
            
            // إذا كان هناك مشكلة في المصادقة، إعادة التوجيه لصفحة تسجيل الدخول
            if (err.response?.status === 401 || err.response?.status === 403) {
                console.warn('⚠️ [fetchComments] Authentication failed, redirecting to login');
                navigate('/login');
            }
        } finally {
            setLoading(false);
            console.log('✅ [fetchComments] Fetch completed');
        }
    }, [navigate]);

    // ✅ تحديث التأثير الجانبي لجلب البيانات عند تغيير المستوى
    useEffect(() => {
        console.log('🔄 [useEffect] Component mounted or selectedLevel changed:', selectedLevel);
        fetchUserInfo();
        fetchComments(selectedLevel);
    }, [selectedLevel, fetchComments, fetchUserInfo]);

    // ✅ تجميع التعليقات حسب الإصدار
    const groupedComments = allComments.reduce((acc, comment) => {
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

    console.log('📊 [Render] Grouped comments:', groupedComments);
    console.log('📊 [Render] Number of groups:', Object.keys(groupedComments).length);

    return (
        <div className="dashboard-page">
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
                                <Form.Select 
                                    value={selectedLevel} 
                                    onChange={(e) => {
                                        const newLevel = e.target.value;
                                        console.log('🔄 [Level Select] Level changed to:', newLevel);
                                        setSelectedLevel(newLevel);
                                    }}
                                >
                                    <option value="">Show All Levels</option>
                                    {academicLevels.map(level => (
                                        <option key={level} value={level}>Level {level}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            {loading ? (
                                <div className="text-center p-5">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                    <p className="mt-3 text-muted">Loading comments...</p>
                                </div>
                            ) : error ? (
                                <Alert variant="danger">
                                    <Alert.Heading>Error!</Alert.Heading>
                                    <p>{error}</p>
                                    <hr />
                                    <div className="d-flex justify-content-end">
                                        <Button 
                                            onClick={() => fetchComments(selectedLevel)} 
                                            variant="outline-danger"
                                            size="sm"
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                </Alert>
                            ) : Object.keys(groupedComments).length === 0 ? (
                                <Alert variant="info" className="text-center">
                                    <FaComments size={48} className="mb-3 text-muted" />
                                    <p className="mb-0">
                                        {selectedLevel 
                                            ? `No comments found for Level ${selectedLevel}.` 
                                            : 'No comments found in the system.'}
                                    </p>
                                </Alert>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {Object.values(groupedComments).map(group => (
                                        <Card key={group.version_id} className="border shadow-sm">
                                            <Card.Header className="bg-primary bg-opacity-10">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>Schedule Version:</strong> {group.version_comment || `Version ID ${group.version_id}`}
                                                    </div>
                                                    <div>
                                                        <Badge bg="info" className="me-2">Level {group.level}</Badge>
                                                        <Badge bg="secondary">{group.comments.length} comment{group.comments.length !== 1 ? 's' : ''}</Badge>
                                                    </div>
                                                </div>
                                            </Card.Header>
                                            <ListGroup variant="flush">
                                                {group.comments.map(comment => (
                                                    <ListGroup.Item key={comment.comment_id}>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                <span className="fw-bold text-primary">{comment.student_name}</span>
                                                                {' '}
                                                                <Badge pill bg="secondary" className="ms-1">
                                                                    Level {comment.student_level}
                                                                </Badge>
                                                            </div>
                                                            <small className="text-muted">
                                                                {new Date(comment.created_at).toLocaleString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </small>
                                                        </div>
                                                        <p className="mb-0 ps-3 border-start border-3 border-primary">
                                                            {comment.comment}
                                                        </p>
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