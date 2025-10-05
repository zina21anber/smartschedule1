import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button, Badge, ProgressBar } from 'react-bootstrap';
import { FaUsers, FaCheckCircle, FaComments, FaVoteYea, FaBell, FaCalendarAlt, FaBook, FaBalanceScale, FaHome, FaSignOutAlt, FaUserGraduate } from 'react-icons/fa';
import { IoStatsChart } from "react-icons/io5"; // Using a different icon for Stats/Elective
import '../App.css'; // Import custom CSS// Import custom CSS

// --- Mock Data Structure (Aligned with DB Schema) ---

// Mocking data retrieval from the database tables: Students, Courses, Votes, Comments
const MOCK_DATA = {
  totalStudents: 247,
  studentsWhoVoted: 189,
  totalComments: 34,

  // Data from Votes, Courses, and calculated stats
  votingStats: {
    totalVotes: 189,
    participationPercentage: 76,
    daysRemaining: 5,
  },

  electiveCourses: [
    { course_id: 101, code: 'CSI 451', title: 'Advanced Artificial Intelligence', votes: 68, totalVotesRequired: 80, voted: false, percentage: 85 },
    { course_id: 102, code: 'CSI 453', title: 'Information Security', votes: 58, totalVotesRequired: 80, voted: false, percentage: 72 },
    { course_id: 103, code: 'CSI 455', title: 'Machine Learning', votes: 50, totalVotesRequired: 80, voted: false, percentage: 63 },
  ],

  // Data from Notifications and linked tables (e.g., Schedules)
  notifications: [
    { title: 'New Student Registration', time: '2 minutes ago', content: 'Student sara.mohammed@student.ksu.edu.sa registered for courses.' },
    { title: 'Schedule Version Update', time: '15 minutes ago', content: 'Schedule Version 2 updated - AI course time changed.' },
    { title: 'New Student Comment', time: '1 hour ago', content: 'Received a student note regarding the Monday exam schedule.' },
    { title: 'Elective Preference Submission', time: '3 hours ago', content: '5 new students submitted their elective course preferences.' },
  ],

  // User Info (from Users table)
  userInfo: {
    name: 'Dr. Ahmed Al-Rashed',
    role: 'Load Committee Head',
  }
};

// --- Sub-Components ---

const StatCard = ({ icon, number, label, description }) => (
  <Card className="shadow-sm stat-card-custom h-100 border-0">
    <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3 p-md-4">
      {icon}
      <div className="stat-number-custom my-2">{number}</div>
      <div className="stat-label text-dark fw-bold mb-1">{label}</div>
      <p className="stat-description text-muted text-center" style={{ fontSize: '0.9rem' }}>{description}</p>
    </Card.Body>
  </Card>
);

const ElectiveCourseCard = ({ course, onVote }) => {
  const [isVoted, setIsVoted] = useState(course.voted);
  const votePercentage = course.percentage;

  const handleVote = (e) => {
    // Prevent parent card click effects
    e.stopPropagation();

    // Mock voting success message
    alert(`Your vote for ${course.code} has been successfully recorded! 👍`);

    // Update local state and run parent handler
    setIsVoted(true);
    onVote(course.course_id);
  };

  return (
    <Card className="shadow-sm p-3 border-2" style={{ transition: 'all 0.3s ease' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="course-title fw-bold text-dark">{course.title}</span>
        <Badge bg="primary" pill className="course-code">{course.code}</Badge>
      </div>

      <div className="voting-progress mb-3">
        <ProgressBar now={votePercentage} className="progress-bar rounded-pill" style={{ height: '8px', background: '#e9ecef' }}>
          <div
            className="progress-fill-custom"
            style={{ width: `${votePercentage}%`, height: '100%', borderRadius: '4px' }}
          ></div>
        </ProgressBar>
        <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: '0.9rem' }}>
          <span>{course.votes} Votes</span>
          <span>{votePercentage}%</span>
        </div>
      </div>

      <Button
        onClick={handleVote}
        className="vote-btn-custom fw-bold"
        disabled={isVoted}
      >
        {isVoted ? 'Voted ✅' : 'Vote for this Course'}
      </Button>
    </Card>
  );
};

const NotificationItem = ({ notification }) => (
  <div className="notification-item-custom bg-light rounded p-3 mb-3">
    <div className="d-flex justify-content-between align-items-center mb-1">
      <span className="notification-title fw-bold text-dark">{notification.title}</span>
      <span className="notification-time text-muted" style={{ fontSize: '0.8rem' }}>{notification.time}</span>
    </div>
    <div className="notification-content text-secondary" style={{ lineHeight: '1.5', fontSize: '0.9rem' }}>
      {notification.content}
    </div>
  </div>
);

// --- Main Dashboard Component ---

const Dashboard = () => {
  const [electiveCourses, setElectiveCourses] = useState(MOCK_DATA.electiveCourses);
  const { totalStudents, studentsWhoVoted, totalComments, votingStats, notifications, userInfo } = MOCK_DATA;

  // Statistics for the main grid
  const stats = [
    { icon: <FaUserGraduate className="stat-icon-custom" />, number: totalStudents, label: 'Total Students', description: 'Students enrolled this semester' },
    { icon: <FaCheckCircle className="stat-icon-custom" />, number: studentsWhoVoted, label: 'Elective Votes Cast', description: 'Students who submitted preferences' },
    { icon: <FaComments className="stat-icon-custom" />, number: totalComments, label: 'Student Comments', description: 'Notes received about schedules' },
  ];

  const handleCourseVote = (courseId) => {
    // In a real application, this would send an API request to insert a row in the 'votes' table
    // and then refetch data to update the counts.
    setElectiveCourses(prevCourses =>
      prevCourses.map(course =>
        course.course_id === courseId
          ? {
            ...course,
            voted: true,
            votes: course.votes + 1,
            percentage: Math.round(((course.votes + 1) / course.totalVotesRequired) * 100) // Recalculate percentage
          }
          : course
      )
    );
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      // Placeholder for actual logout logic (clearing tokens, etc.)
      console.log('Logging out...');
      // window.location.href = 'committee-login.html';
    }
  };

  // Effect to apply the initial animation class
  useEffect(() => {
    document.body.style.direction = 'ltr';
    return () => {
      document.body.style.direction = 'rtl'; // Cleanup if necessary
    };
  }, []);

  return (
    <div className="dashboard-page">
      <Container fluid="lg" className="container-custom shadow-lg">
        <Navbar expand="lg" variant="dark" className="navbar-custom p-3">
          <div className="logo-section d-flex align-items-center">
            <Navbar.Brand className="fw-bold fs-5">SMART SCHEDULE</Navbar.Brand>
            <Badge bg="light" text="dark" className="committee-badge me-3 p-2">Admin Dashboard</Badge>
          </div>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="ms-auto">
            <Nav className="me-auto my-2 my-lg-0 nav-menu" style={{ fontSize: '0.9rem' }}>
              <Nav.Link href="#" className="nav-link-custom active rounded-2 p-2 mx-1">
                <FaHome className="me-2" /> HOME
              </Nav.Link>
              <Nav.Link href="manageSchedules-final.html" className="nav-link-custom rounded-2 p-2 mx-1">
                <FaCalendarAlt className="me-2" /> Manage Schedules & Levels
              </Nav.Link>
              <Nav.Link href="manageStu-enhanced-display.html" className="nav-link-custom rounded-2 p-2 mx-1">
                <FaUsers className="me-2" /> Manage Students
              </Nav.Link>
              <Nav.Link href="addElective.html" className="nav-link-custom rounded-2 p-2 mx-1">
                <FaBook className="me-2" /> Course Information
              </Nav.Link>
              <Nav.Link href="rule.html" className="nav-link-custom rounded-2 p-2 mx-1">
                <FaBalanceScale className="me-2" /> Manage Rules
              </Nav.Link>
              <Nav.Link href="loadNotification.html" className="nav-link-custom rounded-2 p-2 mx-1">
                <FaBell className="me-2" /> Notifications
              </Nav.Link>
            </Nav>
            <div className="user-section d-flex align-items-center ms-lg-4 mt-3 mt-lg-0">
              <div className="user-info text-white text-start me-3">
                <div className="user-name fw-bold">{userInfo.name}</div>
                <div className="user-role" style={{ opacity: 0.8, fontSize: '0.8rem' }}>{userInfo.role}</div>
              </div>
              <Button variant="danger" className="logout-btn fw-bold" onClick={handleLogout}>
                <FaSignOutAlt className="me-1" /> Logout
              </Button>
            </div>
          </Navbar.Collapse>
        </Navbar>

        <main className="main-content p-4 p-md-5">
          <header className="welcome-section text-center mb-5">
            <h2 className="text-dark fw-bolder mb-3">Welcome to the Load Committee Dashboard</h2>
            <p className="text-secondary fs-6">Manage academic schedules, registration, and planning for King Saud University - College of Computer and Information Sciences students.</p>
          </header>

          {/* Statistics Section */}
          <section className="stats-grid">
            <Row xs={1} md={2} lg={3} className="g-4 mb-5">
              {stats.map((stat, index) => (
                <Col key={index}>
                  <StatCard {...stat} />
                </Col>
              ))}
            </Row>
          </section>

          {/* Elective Voting Section */}
          <section className="elective-voting-section bg-white rounded-4 p-4 p-md-5 shadow-sm">
            <h3 className="text-dark mb-4 d-flex align-items-center">
              <FaVoteYea className="me-2 text-primary" /> Elective Course Voting
            </h3>

            <Row xs={1} sm={2} md={3} className="g-3 voting-stats mb-4">
              <Col>
                <Card className="voting-stat-card-custom h-100 shadow-sm border-0">
                  <Card.Body className="p-3 text-center">
                    <div className="voting-stat-number-custom">{votingStats.totalVotes}</div>
                    <div className="voting-stat-label text-secondary fw-bold">Total Votes</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col>
                <Card className="voting-stat-card-custom h-100 shadow-sm border-0">
                  <Card.Body className="p-3 text-center">
                    <div className="voting-stat-number-custom">{votingStats.participationPercentage}%</div>
                    <div className="voting-stat-label text-secondary fw-bold">Participation Rate</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col>
                <Card className="voting-stat-card-custom h-100 shadow-sm border-0">
                  <Card.Body className="p-3 text-center">
                    <div className="voting-stat-number-custom">{votingStats.daysRemaining}</div>
                    <div className="voting-stat-label text-secondary fw-bold">Days Remaining</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="elective-courses">
              <Row xs={1} md={3} className="g-4">
                {electiveCourses.map(course => (
                  <Col key={course.course_id}>
                    <ElectiveCourseCard course={course} onVote={handleCourseVote} />
                  </Col>
                ))}
              </Row>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="notifications-section bg-white rounded-4 p-4 p-md-5 shadow-sm mt-5">
            <h3 className="text-dark mb-4 d-flex align-items-center">
              <FaBell className="me-2 text-primary" /> Recent Notifications
            </h3>

            <div>
              {notifications.map((notification, index) => (
                <NotificationItem key={index} notification={notification} />
              ))}
            </div>
          </section>
        </main>
      </Container>
    </div>
  );
};

export default Dashboard;