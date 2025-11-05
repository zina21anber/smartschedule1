import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner, Navbar, Nav } from 'react-bootstrap';
import { FaSave, FaTrash, FaPlus, FaBook, FaHome, FaCalendarAlt, FaUsers, FaBalanceScale, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../services/api'; 
import '../App.css'; 

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

const TimeSlotInput = ({ slot, index, onSlotChange, onRemove }) => {
    const slotId = slot.id || index;

    return (
        <div className="time-slot" style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '1rem', marginTop: '10px', position: 'relative', backgroundColor: '#f8f9fa' }}>
            <button 
                className="btn btn-danger btn-sm" 
                type="button" 
                title="Remove Time Slot"
                onClick={() => onRemove(slotId)}
                style={{ position: 'absolute', top: '8px', right: '8px', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
            >
                <FaTrash />
            </button>
            
            <Row className="g-3">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-bold">Day</Form.Label>
                        <Form.Select 
                            name="day" 
                            value={slot.day} 
                            onChange={(e) => onSlotChange(slotId, e)} 
                            required
                        >
                            <option value="" disabled>Select Day</option>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-bold">Session Type</Form.Label>
                        <Form.Select 
                            name="type" 
                            value={slot.type} 
                            onChange={(e) => onSlotChange(slotId, e)} 
                            required
                        >
                            <option value="" disabled>Select Type</option>
                            <option value="Lecture">Lecture</option>
                            <option value="Tutorial">Tutorial</option>
                            <option value="Lab">Lab</option>
                        </Form.Select>
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-bold">Start Time</Form.Label>
                        <Form.Control 
                            type="time" 
                            name="start_time" 
                            value={slot.start_time} 
                            onChange={(e) => onSlotChange(slotId, e)} 
                            required 
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-bold">End Time</Form.Label>
                        <Form.Control 
                            type="time" 
                            name="end_time" 
                            value={slot.end_time} 
                            onChange={(e) => onSlotChange(slotId, e)} 
                            required 
                        />
                    </Form.Group>
                </Col>
            </Row>
        </div>
    );
};

const AddElective = () => {
    const [level, setLevel] = useState('');
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [timeSlots, setTimeSlots] = useState([{ id: Date.now(), day: '', type: '', start_time: '', end_time: '' }]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loadingForm, setLoadingForm] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();

    const levels = [3, 4, 5, 6, 7, 8];
    const [userInfo, setUserInfo] = useState({ name: 'Committee Member', role: 'Load Committee' });

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };
    
    const fetchUserInfo = useCallback(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.name && storedUser.role) {
            setUserInfo({ name: storedUser.name, role: storedUser.role });
        } else if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        }
    }, []);

    const handleAddSlot = () => {
        setTimeSlots(prev => [...prev, { id: Date.now(), day: '', type: '', start_time: '', end_time: '' }]);
    };

    const handleRemoveSlot = (idToRemove) => {
        if (timeSlots.length > 1) {
            setTimeSlots(prev => prev.filter(slot => slot.id !== idToRemove));
        } else {
            showMessage("There must be at least one time slot.", 'danger');
        }
    };

    const handleSlotChange = (id, e) => {
        const { name, value } = e.target;
        setTimeSlots(prev => prev.map(slot => 
            slot.id === id ? { ...slot, [name]: value } : slot
        ));
    };

    const fetchCoursesByLevel = useCallback(async (selectedLevel) => {
        setLoadingCourses(true);
        setCourses([]);
        setSelectedCourseId('');

        try {
            const response = await courseAPI.getByLevel(selectedLevel); 
            const filteredCourses = response.data || [];

            setCourses(filteredCourses);
            if (filteredCourses.length === 0) {
                showMessage(`No courses found for Level ${selectedLevel}.`, 'info');
            }

        } catch (err) {
            console.error('Error fetching courses:', err.response || err);
            showMessage('Error loading courses. Check your server connection or backend route.', 'danger');
        } finally {
            setLoadingCourses(false);
        }
    }, []);

    const fetchTimeSlots = useCallback(async (courseId) => {
        setLoadingSlots(true);
        setTimeSlots([{ id: Date.now(), day: '', type: '', start_time: '', end_time: '' }]);

        try {
            const response = await courseAPI.getCourseDetails(courseId); 
            const courseData = response.data;
            
            if (courseData.time_slots && courseData.time_slots.length > 0) {
                const initialSlots = courseData.time_slots.map((slot, index) => ({
                    id: Date.now() + index,
                    day: slot.day,
                    type: slot.type,
                    start_time: slot.start_time.slice(0, 5),
                    end_time: slot.end_time.slice(0, 5)
                }));
                setTimeSlots(initialSlots);
            } else {
                showMessage("No time slots defined for this course. Please add them.", 'info');
            }

        } catch (err) {
            console.error('Error fetching time slots:', err.response || err);
            showMessage('Error loading course details.', 'danger');
        } finally {
            setLoadingSlots(false);
        }
    }, []);

    useEffect(() => {
        if (level) {
            fetchCoursesByLevel(level);
        }
    }, [level, fetchCoursesByLevel]);

    useEffect(() => {
        if (selectedCourseId) {
            fetchTimeSlots(selectedCourseId);
        } else {
            setTimeSlots([{ id: Date.now(), day: '', type: '', start_time: '', end_time: '' }]);
        }
    }, [selectedCourseId, fetchTimeSlots]);
    
    useEffect(() => {
        fetchUserInfo();
        document.body.style.direction = 'ltr'; 
    }, [fetchUserInfo]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedCourseId) {
            showMessage("Please select a course to modify its time slots.", 'danger');
            return;
        }

        const validSlots = timeSlots.filter(slot => 
            slot.day && slot.type && slot.start_time && slot.end_time
        );
        
        if (validSlots.length !== timeSlots.length) {
            showMessage("Please fill in all time slot details.", 'danger');
            return;
        }
        
        const patchData = {
            time_slots: validSlots.map(slot => ({
                day: slot.day,
                type: slot.type,
                start_time: slot.start_time,
                end_time: slot.end_time
            }))
        };
        
        setLoadingForm(true);

        try {
            await courseAPI.updateTimeSlots(selectedCourseId, patchData); 
            showMessage("Course time slots updated successfully!", 'success');
        } catch (error) {
            console.error("Update error:", error.response?.data || error);
            showMessage("Update Error: " + (error.response?.data?.error || error.message), 'danger');
        } finally {
            setLoadingForm(false);
        }
    };

    return (
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <NewCommitteeNavbar userInfo={userInfo} navigate={navigate} activePath='/addElective' />
            
            <Container fluid="lg" className="py-4">
                <Card className="shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <Card.Header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                        <h1 className="mb-2" style={{ fontSize: '2rem' }}>Course Information Management</h1>
                        <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                            Modify time slots for non-CS elective courses.
                        </p>
                    </Card.Header>

                    <Card.Body className="p-4">
                        {message.text && (
                            <Alert variant={message.type} className="text-start fw-bold">
                                {message.text}
                            </Alert>
                        )}
                        
                        <Form onSubmit={handleSubmit}>
                            <Card className="mb-4 shadow-sm" style={{ borderRadius: '12px' }}>
                                <Card.Body className="p-4">
                                    <h3 className="mb-4 d-flex align-items-center">
                                        <FaBook className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                                        Course Selection
                                    </h3>
                                    
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Select Level:</Form.Label>
                                                <Form.Select 
                                                    value={level} 
                                                    onChange={(e) => setLevel(e.target.value)} 
                                                    required
                                                >
                                                    <option value="" disabled>Select Level</option>
                                                    {levels.map(lvl => (
                                                        <option key={lvl} value={lvl}>Level {lvl}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Select Course:</Form.Label>
                                                <Form.Select 
                                                    value={selectedCourseId} 
                                                    onChange={(e) => setSelectedCourseId(e.target.value)} 
                                                    required
                                                    disabled={!level || loadingCourses}
                                                >
                                                    <option value="" disabled>
                                                        {loadingCourses ? 'Loading Courses...' : 'Select Course'}
                                                    </option>
                                                    {courses.map(course => (
                                                        <option key={course.course_id} value={course.course_id}>
                                                            {course.name} ({course.course_id})
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                            
                            <Card className="mb-4 shadow-sm" style={{ borderRadius: '12px' }}>
                                <Card.Body className="p-4">
                                    <h3 className="mb-4 d-flex align-items-center">
                                        <FaCalendarAlt className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                                        Course Time Slots
                                    </h3>
                                    
                                    {loadingSlots ? (
                                        <div className="text-center p-4">
                                            <Spinner animation="border" variant="primary" />
                                            <p className="mt-2">Loading time slots...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {timeSlots.map((slot, index) => (
                                                <TimeSlotInput
                                                    key={slot.id}
                                                    slot={slot}
                                                    index={index}
                                                    onSlotChange={handleSlotChange}
                                                    onRemove={handleRemoveSlot}
                                                />
                                            ))}

                                            <Button 
                                                type="button" 
                                                onClick={handleAddSlot} 
                                                className="w-100 mt-3 fw-bold"
                                                variant="outline-primary"
                                                style={{ borderRadius: '8px', padding: '0.8rem' }}
                                            >
                                                <FaPlus className="me-2" /> Add Time Slot
                                            </Button>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                            
                            <Button 
                                type="submit" 
                                className="w-100 fw-bold"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    fontSize: '1rem'
                                }}
                                disabled={loadingForm || loadingSlots || !selectedCourseId}
                            >
                                {loadingForm ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="me-2" />
                                        Save Course Modifications
                                    </>
                                )}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default AddElective;