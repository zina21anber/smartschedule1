import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Table, Spinner, Alert, Navbar, Nav } from 'react-bootstrap';
import { FaHome, FaCalendarAlt, FaSignOutAlt, FaUserTie, FaEye } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css'; 
const LoadCommitteeNavbar = ({ userInfo, navigate, activePath }) => (
    <Container fluid="lg" className="container-custom shadow-lg">
        <Navbar expand="lg" variant="dark" className="navbar-custom p-3 navbar-modified">
            <Navbar.Brand className="fw-bold fs-5 d-flex align-items-center">
                <FaUserTie className="me-2 text-warning" /> LOAD COMMITTEE DASHBOARD
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto my-2 my-lg-0 nav-menu">
                    <Nav.Link onClick={() => navigate('/loadCommittee/home')} 
                              className={`nav-link-custom ${activePath === '/loadCommittee/home' ? 'active' : ''}`}>
                        <FaHome className="me-2" /> HOME
                    </Nav.Link>
                    <Nav.Link onClick={() => navigate('/loadCommittee/viewSchedule')} 
                              className={`nav-link-custom ${activePath === '/loadCommittee/viewSchedule' ? 'active' : ''}`}>
                        <FaCalendarAlt className="me-2" /> View Schedule
                    </Nav.Link>
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

const MOCK_SCHEDULE_DATA = [
    { code: 'CS 301', name: 'Algorithms', section: 'A', instructor: 'Dr. A. Ahmed', day: 'Mon, Wed', time: '10:00 - 11:50', room: '2A01' },
    { code: 'CS 301', name: 'Algorithms', section: 'B', instructor: 'Dr. F. Saleh', day: 'Tue, Thu', time: '12:00 - 01:50', room: '2B05' },
    { code: 'IT 310', name: 'Web Dev', section: 'C', instructor: 'Eng. K. Hassan', day: 'Sun, Tue', time: '08:00 - 09:50', room: '3A12' },
    { code: 'MATH 380', name: 'Discrete Math', section: 'D', instructor: 'Dr. M. Omar', day: 'Wed, Thu', time: '02:00 - 03:50', room: '1C03' },
];

const ViewLoadSchedule = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [schedule, setSchedule] = useState(MOCK_SCHEDULE_DATA);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState({ name: 'Load Member', role: 'Load Committee' });

    const fetchUserInfo = useCallback(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        } else {
            setUserInfo({ name: 'Committee Member', role: 'Load Committee' });
        }
    }, []);


    const fetchSchedule = useCallback(async () => {
        setLoading(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 1000)); 
        
        try {            
            setSchedule(MOCK_SCHEDULE_DATA); 
        } catch (err) {
            console.error("Error fetching schedule:", err);
            setError("Failed to load the schedule. Displaying mock data.");
            setSchedule(MOCK_SCHEDULE_DATA);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();
        fetchSchedule();
        document.body.style.direction = 'ltr';
    }, [fetchUserInfo, fetchSchedule]);

    return (
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            
            <h1 className="text-center text-white fw-bolder py-3" style={{ background: '#764ba2', margin: 0 }}>
                SMART SCHEDULE
            </h1>

            <LoadCommitteeNavbar userInfo={userInfo} navigate={navigate} activePath={location.pathname} />
            
            <Container fluid="lg" className="py-4">
                <Card className="shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <Card.Header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                        <h1 className="mb-2" style={{ fontSize: '2rem' }}>Final Course Schedule</h1>
                        <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                            Review the automatically generated and finalized schedule for all courses.
                        </p>
                    </Card.Header>

                    <Card.Body className="p-4">
                        {error && (
                            <Alert variant="danger" className="text-center fw-bold">
                                {error}
                            </Alert>
                        )}

                        {loading ? (
                            <div className="text-center p-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2">Loading schedule...</p>
                            </div>
                        ) : schedule.length > 0 ? (
                            <div className="table-responsive">
                                <Table striped bordered hover className="mt-4 shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                    <thead style={{ backgroundColor: '#2a5298', color: 'white' }}>
                                        <tr>
                                            <th>Course Code</th>
                                            <th>Course Name</th>
                                            <th>Section</th>
                                            <th>Instructor</th>
                                            <th>Day(s)</th>
                                            <th>Time</th>
                                            <th>Room</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedule.map((item, index) => (
                                            <tr key={index}>
                                                <td className="fw-bold">{item.code}</td>
                                                <td>{item.name}</td>
                                                <td>{item.section}</td>
                                                <td>{item.instructor}</td>
                                                <td>{item.day}</td>
                                                <td className="text-success fw-bold">{item.time}</td>
                                                <td>{item.room}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 p-6 bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg">
                                <p><FaEye className="me-2" /> No schedule data available yet.</p>
                            </div>
                        )}

                        <Button 
                            variant="success" 
                            className="mt-4 fw-bold"
                            onClick={() => alert("Simulating download of the final schedule...")}
                        >
                            Download Schedule (.xlsx)
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default ViewLoadSchedule;