import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Table, Form, ListGroup, Badge, Navbar, Nav } from 'react-bootstrap';
import { FaArrowRight, FaFilter, FaCalendarAlt, FaSyncAlt, FaSave, FaCheckCircle, FaEdit, FaTrash, FaHome, FaUsers, FaBook, FaBalanceScale, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css';
import { scheduleAPI } from '../services/api'; 

const daysOfWeek = ['S', 'M', 'T', 'W', 'H']; // S=Sunday, M=Monday, T=Tuesday, W=Wednesday, H=Thursday
const timeSlots = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
];

const NewCommitteeNavbar = ({ userInfo, navigate, activePath }) => (
// ... (Navbar code remains the same) ...
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

const ScheduleTable = ({ sections, loading }) => {
    if (loading) {
        return <div className="text-center p-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading schedule...</p></div>;
    }

    const scheduleData = sections.reduce((acc, section) => {
        const cleanStartTime = section.start_time ? section.start_time.substring(0, 5) : '';
        const cleanEndTime = section.end_time ? section.end_time.substring(0, 5) : '';
        
        const timeSlotString = `${cleanStartTime} - ${cleanEndTime}`;
        
        const timeIndex = timeSlots.findIndex(slot => slot === timeSlotString);
        const dayIndex = daysOfWeek.findIndex(day => day === section.day_code);

        if (timeIndex !== -1 && dayIndex !== -1) {
            if (!acc[timeIndex]) acc[timeIndex] = {};
            acc[timeIndex][dayIndex] = `${section.course_name} (${section.code}) - Sec ${section.section_number} - Lvl ${section.level}`;
        }
        return acc;
    }, new Array(timeSlots.length).fill(0).map(() => ({})));

    return (
        <div className="table-responsive">
            <Table striped bordered hover className="schedule-table">
                <thead>
                    <tr>
                        <th className="time-col">Time Slot</th>
                        {/* عرض أسماء الأيام الكاملة للتنسيق فقط */}
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => <th key={day}>{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {timeSlots.map((time, timeIndex) => (
                        <tr key={time}>
                            <td className="time-col fw-bold">{time}</td>
                            {daysOfWeek.map((dayCode, dayIndex) => (
                                <td key={dayIndex} className={scheduleData[timeIndex][dayIndex] ? 'has-class' : ''}>
                                    {scheduleData[timeIndex][dayIndex] || '-'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

const ManageSchedules = () => {
    const [selectedLevel, setSelectedLevel] = useState(4); 
    const [scheduleVersions, setScheduleVersions] = useState({}); 
    const [currentSections, setCurrentSections] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const [userInfo, setUserInfo] = useState({ name: 'Committee Member', role: 'Load Committee' });
    const fetchUserInfo = useCallback(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.name && storedUser.role) {
            setUserInfo({ name: storedUser.name, role: storedUser.role });
        }
    }, []);

    const fetchLevelData = useCallback(async (level) => {
        setLoading(true);
        setError(null);
        setCurrentSections([]); 
        
        try {
            // 1. جلب الإصدارات
            const versionsResponse = await scheduleAPI.getVersionsByLevel(level);
            
            const versions = versionsResponse.data.map(v => ({
                id: v.id, 
                version: v.version || `V${v.id}`,
                is_active: v.is_active,
            }));

            setScheduleVersions(prev => ({ ...prev, [level]: versions || [] }));

            // 2. البحث عن الإصدار النشط 
            const activeVersion = versions.find(v => v.is_active);

            if (versions.length === 0) {
                setError(`No versions found for Level ${level}. Click "Generate New Schedule" to start.`);
                return;
            }

            if (!activeVersion) {
                // حالة: توجد إصدارات ولكن لا يوجد إصدار نشط
                setError(`Level ${level} has versions, but none are active. Please activate one from the list.`);
                return;
            }

            // 3. جلب الأقسام
            const sectionsResponse = await scheduleAPI.getSectionsByLevel(level);
            
            const activeSections = sectionsResponse.data;
            setCurrentSections(activeSections);

        } catch (e) {
            console.error('Fetch error:', e.response || e);
            setError(e.response?.data?.error || e.response?.data?.message || `Request failed for Level ${level}. Status: ${e.response?.status || 'network error'}.`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();
        document.body.style.direction = 'ltr'; 
        fetchLevelData(selectedLevel);
    }, [selectedLevel, fetchUserInfo, fetchLevelData]);


    const handleActivateVersion = async (versionId) => {
        try {
            await scheduleAPI.activateVersion(versionId); 
            setScheduleVersions(prev => ({
                ...prev,
                [selectedLevel]: prev[selectedLevel].map(v => ({
                    ...v,
                    is_active: v.id === versionId,
                }))
            }));
            await fetchLevelData(selectedLevel); 
            alert(`Version ${versionId} activated successfully. The schedule should now be updated.`);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to activate version.');
        }
    };

    const handleDeleteVersion = async (versionId) => {
        if (!window.confirm('Are you sure you want to delete this version?')) return;
        
        try {
            await scheduleAPI.deleteVersion(versionId); 
            setScheduleVersions(prev => ({
                ...prev,
                [selectedLevel]: prev[selectedLevel].filter(v => v.id !== versionId)
            }));
            await fetchLevelData(selectedLevel); 
            alert(`Version ${versionId} deleted successfully.`);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to delete version.');
        }
    };

    // ✅ تحديث: استدعاء الـ API الجديد لتوليد الجدول الزمني
    const handleGenerateSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await scheduleAPI.generateSchedule(selectedLevel);
            
            alert(`Success! ${response.data.message}`);

            // إعادة جلب البيانات لتحديث قائمة الإصدارات
            await fetchLevelData(selectedLevel);

        } catch (e) {
            console.error('Generation error:', e.response || e);
            setError(e.response?.data?.error || 'Failed to generate schedule.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <NewCommitteeNavbar userInfo={userInfo} navigate={navigate} activePath={location.pathname} />

            <Container fluid="lg" className="py-4">
                <div className="page-content-wrapper">
                    <Card className="shadow-lg border-0 mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                        <Card.Header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                            <h1 className="mb-2" style={{ fontSize: '2rem' }}>Schedule Management</h1>
                            <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                                View, compare, and activate scheduling versions across all academic levels.
                            </p>
                        </Card.Header>

                        <Card.Body className="p-4">
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            <Card className="mb-4 shadow-sm" style={{ borderRadius: '12px' }}>
                                <Card.Header className="bg-light"><h5 className="mb-0 d-flex align-items-center"><FaFilter className="me-2 text-primary" /> Filter Levels</h5></Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold">Filter by Level:</Form.Label>
                                        <div className="d-flex flex-wrap gap-2">
                                            {[3, 4, 5, 6, 7, 8].map(level => (
                                                <Button
                                                    key={level}
                                                    variant={selectedLevel === level ? 'primary' : 'outline-primary'}
                                                    onClick={() => setSelectedLevel(level)}
                                                    className="fw-bold"
                                                >
                                                    Level {level}
                                                </Button>
                                            ))}
                                        </div>
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            <Row className="g-4">
                                <Col lg={9}>
                                    <Card className="shadow-sm h-100">
                                        <Card.Header className="fw-bold d-flex justify-content-between align-items-center bg-light">
                                            <span className="fs-5"><FaCalendarAlt className="me-2 text-primary" /> Active Schedule - Level {selectedLevel}</span>
                                            <Button variant="success" onClick={handleGenerateSchedule} disabled={loading}>
                                                <FaSyncAlt className="me-2" /> Generate New Schedule
                                            </Button>
                                        </Card.Header>
                                        <Card.Body>
                                            <ScheduleTable sections={currentSections} loading={loading} />
                                            {currentSections.length === 0 && !loading && !error && (
                                                <Alert variant="info" className="text-center mt-3">No sections to display. Check the active version or generate a new one.</Alert>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={3}>
                                    <Card className="shadow-sm h-100">
                                        <Card.Header className="fw-bold bg-light"><FaEdit className="me-2 text-primary" /> Schedule Versions</Card.Header>
                                        <Card.Body>
                                            <ScheduleVersions 
                                                versions={scheduleVersions[selectedLevel] || []} 
                                                handleActivateVersion={handleActivateVersion}
                                                handleDeleteVersion={handleDeleteVersion}
                                            />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </div>
            </Container>
        </div>
    );
};

const ScheduleVersions = ({ versions, handleActivateVersion, handleDeleteVersion }) => (
    <div className="version-list">
        {versions.length > 0 ? (
            <ListGroup variant="flush">
                {versions.map(version => (
                    <ListGroup.Item 
                        key={version.id} 
                        className="d-flex justify-content-between align-items-center p-2"
                        style={{ backgroundColor: version.is_active ? '#e6ffe6' : 'transparent' }}
                    >
                        <span className="fw-semibold me-2">{version.version}</span>
                        <div className="d-flex gap-1 align-items-center">
                            <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={() => handleDeleteVersion(version.id)}
                                disabled={version.is_active}
                                title={version.is_active ? 'Deactivate this version before deleting.' : ''}
                            >
                                <FaTrash className="me-1" /> Delete
                            </Button>
                            {version.is_active ? (
                                <Badge bg="success" className="px-3 py-2"><FaCheckCircle className="me-1" /> Active</Badge>
                            ) : (
                                <Button variant="outline-success" size="sm" className="px-2 py-1" onClick={() => handleActivateVersion(version.id)}>
                                    Activate
                                </Button>
                            )}
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        ) : (
            <p className="text-muted text-center mb-0">No saved versions for this level.</p>
        )}
    </div>
);


export default ManageSchedules;