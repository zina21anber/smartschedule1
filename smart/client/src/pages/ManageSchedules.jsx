import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Table, Form, ListGroup, Badge, Navbar, Nav } from 'react-bootstrap';
import { FaArrowRight, FaFilter, FaCalendarAlt, FaSyncAlt, FaSave, FaCheckCircle, FaEdit, FaTrash, FaHome, FaUsers, FaBook, FaBalanceScale, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const timeSlots = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
];

const fetchData = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        ...options,
    });
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('AUTHENTICATION_FAILED');
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

const ScheduleTable = ({ sections, loading }) => {
    if (loading) {
        return <div className="text-center p-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading schedule...</p></div>;
    }

    const scheduleData = sections.reduce((acc, section) => {
        const timeIndex = timeSlots.findIndex(slot => slot.startsWith(section.start_time) && slot.endsWith(section.end_time));
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
                        {daysOfWeek.map(day => <th key={day}>{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {timeSlots.map((time, timeIndex) => (
                        <tr key={time}>
                            <td className="time-col fw-bold">{time}</td>
                            {daysOfWeek.map((day, dayIndex) => (
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

const MOCK_SCHEDULES = {
    3: [
        { id: 1, version: 'V1.0', is_active: true, sections: [{ course_id: 101, code: 'CS301', name: 'Intro', section_number: 1, start_time: '10:00', end_time: '11:00', day_code: 'Sunday', level: 3 }] },
    ],
};

const MOCK_SECTIONS = [{ course_id: 101, code: 'CS301', course_name: 'Intro', section_number: 1, start_time: '10:00', end_time: '11:00', day_code: 'Sunday', level: 3 }];


const ManageSchedules = () => {
    const [selectedLevel, setSelectedLevel] = useState(3);
    const [scheduleVersions, setScheduleVersions] = useState(MOCK_SCHEDULES);
    const [currentSections, setCurrentSections] = useState(MOCK_SECTIONS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState({ name: 'Committee Member', role: 'Load Committee' });
    const fetchUserInfo = useCallback(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        }
    }, []);

    const fetchLevelData = useCallback(async (level) => {
        setLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); 
            setCurrentSections(MOCK_SECTIONS.filter(s => s.level === level));
            
            setScheduleVersions(prev => ({ ...prev, [level]: MOCK_SCHEDULES[level] || [] }));
        } catch (e) {
            setError('Failed to fetch schedules or sections. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();
        document.body.style.direction = 'ltr'; 
        fetchLevelData(selectedLevel);
    }, [selectedLevel, fetchUserInfo, fetchLevelData]);


    const handleActivateVersion = (versionId) => {
        setScheduleVersions(prev => ({
            ...prev,
            [selectedLevel]: prev[selectedLevel].map(v => ({
                ...v,
                is_active: v.id === versionId,
            }))
        }));
        alert(`Version ${versionId} activated for Level ${selectedLevel}.`);
    };

    const handleDeleteVersion = (versionId) => {
        setScheduleVersions(prev => ({
            ...prev,
            [selectedLevel]: prev[selectedLevel].filter(v => v.id !== versionId)
        }));
        alert(`Version ${versionId} deleted for Level ${selectedLevel}.`);
    };

    const handleGenerateSchedule = () => {
        alert('Generating new schedule version (Mock AI Process)...');
    };

    return (
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            {/* ✅ استخدام الـ Navbar الموحد الجديد */}
            <NewCommitteeNavbar userInfo={userInfo} navigate={navigate} activePath='/manageSchedules' />

            <Container fluid="lg" className="py-4">
                <div className="page-content-wrapper">
                    {/* ✅ توحيد ترويسة الصفحة الرئيسية */}
                    <Card className="shadow-lg border-0 mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                        <Card.Header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                            <h1 className="mb-2" style={{ fontSize: '2rem' }}>Schedule Management</h1>
                            <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                                View, compare, and activate scheduling versions across all academic levels.
                            </p>
                        </Card.Header>
                        {/* ---------------------------------------------------- */}

                        <Card.Body className="p-4">
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            {/* ✅ Controls Card Styling */}
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
                                    {/* ... (Student Count Form Group) ... */}
                                </Card.Body>
                            </Card>

                            <Row className="g-4">
                                <Col lg={9}>
                                    <Card className="shadow-sm h-100">
                                        {/* ✅ Schedule Card Header Styling */}
                                        <Card.Header className="fw-bold d-flex justify-content-between align-items-center bg-light">
                                            <span className="fs-5"><FaCalendarAlt className="me-2 text-primary" /> Active Schedule - Level {selectedLevel}</span>
                                            <Button variant="success" onClick={handleGenerateSchedule} disabled={loading}>
                                                <FaSyncAlt className="me-2" /> Generate New Schedule
                                            </Button>
                                        </Card.Header>
                                        <Card.Body>
                                            <ScheduleTable sections={currentSections} loading={loading} />
                                            {currentSections.length === 0 && !loading && (
                                                <Alert variant="info" className="text-center mt-3">No active sections found for this level.</Alert>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={3}>
                                    <Card className="shadow-sm h-100">
                                        {/* ✅ Versions Card Header Styling */}
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