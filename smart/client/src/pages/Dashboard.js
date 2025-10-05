import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Navbar, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { statisticsAPI } from '../services/api';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
    fetchStatistics();
  }, [navigate]);

  const fetchStatistics = async () => {
    try {
      const response = await statisticsAPI.get();
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-vh-100 bg-light">
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>SmartSchedule</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto">
              <Nav.Link>Dashboard</Nav.Link>
              <Nav.Link>Courses</Nav.Link>
              <Nav.Link>Schedule</Nav.Link>
              <Nav.Link>Voting</Nav.Link>
            </Nav>
            <Nav>
              <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row className="mb-4">
          <Col>
            <Card bg="primary" text="white">
              <Card.Body className="p-4">
                <h2>Welcome, {user.full_name}!</h2>
                <p className="mb-0">{user.email}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6}>
            <Card className="shadow-sm mb-3">
              <Card.Header><h5 className="mb-0">User Information</h5></Card.Header>
              <Card.Body>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.full_name}</p>
                {user.level && <p><strong>Level:</strong> {user.level}</p>}
                {user.role && <p><strong>Role:</strong> {user.role}</p>}
                <p className="mb-0"><strong>Type:</strong> {user.type}</p>
              </Card.Body>
            </Card>
          </Col>

          {statistics && (
            <Col md={6}>
              <Card className="shadow-sm mb-3">
                <Card.Header><h5 className="mb-0">Statistics</h5></Card.Header>
                <Card.Body>
                  <p><strong>Total Students:</strong> {statistics.totalStudents}</p>
                  <p><strong>Total Courses:</strong> {statistics.totalCourses}</p>
                  <p><strong>Total Votes:</strong> {statistics.totalVotes}</p>
                  <p className="mb-0"><strong>Participation:</strong> {statistics.participationRate}%</p>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header><h5 className="mb-0">Quick Actions</h5></Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button variant="outline-primary" size="lg">View Courses</Button>
                  <Button variant="outline-primary" size="lg">View Schedule</Button>
                  {user.type === 'student' && (
                    <Button variant="outline-success" size="lg">Vote for Electives</Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Dashboard;