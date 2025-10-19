import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Badge, Navbar, Nav } from 'react-bootstrap';
import { FaHome, FaCalendarAlt, FaSignOutAlt, FaUserTie } from 'react-icons/fa';
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
const LoadCommitteeHome = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userInfo, setUserInfo] = useState({ name: 'Load Member', role: 'Load Committee' });

    const fetchUserInfo = useCallback(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        } else {
            setUserInfo({ name: 'Committee Member', role: 'Load Committee' });
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();
        document.body.style.direction = 'ltr';
    }, [fetchUserInfo]);

    return (
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            
            <h1 className="text-center text-white fw-bolder py-3" style={{ background: '#764ba2', margin: 0 }}>
                SMART SCHEDULE
            </h1>

            <LoadCommitteeNavbar userInfo={userInfo} navigate={navigate} activePath={location.pathname} />
            
            <Container fluid="lg" className="py-4">
                <Card className="shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <Card.Header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                        <h1 className="mb-2" style={{ fontSize: '2rem' }}>Welcome, Load Committee</h1>
                        <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                            Access and review generated schedules.
                        </p>
                    </Card.Header>

                    <Card.Body className="p-5 text-center">
                        <FaCalendarAlt size={60} className="text-primary mb-4" />
                        <h2 className="mb-4 fw-bold">Schedule Viewing Portal</h2>
                        
                        <p className="lead mb-4">
                            Use the **View Schedule** link above to inspect the final course loads and time distributions.
                        </p>

                        <div className="d-flex justify-content-center gap-3">
                            <Button
                                variant="primary"
                                size="lg"
                                className="fw-bold px-5"
                                onClick={() => navigate('/loadCommittee/viewSchedule')}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                }}
                            >
                                <FaCalendarAlt className="me-2" /> Go to View Schedule
                            </Button>
                        </div>

                        <Badge bg="info" className="mt-5 p-2" style={{ fontSize: '0.9rem' }}>
                            Your access is restricted to viewing schedules and logging out only.
                        </Badge>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default LoadCommitteeHome;