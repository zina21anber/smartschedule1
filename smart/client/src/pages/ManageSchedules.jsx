import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Alert, Spinner, Table, Modal, Form, Navbar, Nav, Badge } from 'react-bootstrap';
// تم استخدام FaArrowLeft بدلاً من FaArrowRight في الأيقونات للتناسق مع LTR
import { FaArrowLeft, FaFilter, FaCalendarAlt, FaSyncAlt, FaHome, FaUsers, FaBook, FaBalanceScale, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../App.css';

// ... (fetchData and ScheduleTable components remain the same) ...
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const timeSlots = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
];

const fetchData = async (url) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('AUTHENTICATION_FAILED');
    }

    if (!response.ok) {
        throw new Error('Failed to load data');
    }
    return response.json();
};

// ... (ScheduleTable component - adjustments made for LTR) ...
const ScheduleTable = ({ scheduleNumber, level, sections, loading }) => {
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [comment, setComment] = useState('');

    const scheduleMap = {};

    sections.forEach((sec) => {
        let dayKey;
        switch (sec.day_code) {
            case 'S': dayKey = 'Sunday'; break;
            case 'M': dayKey = 'Monday'; break;
            case 'T': dayKey = 'Tuesday'; break;
            case 'W': dayKey = 'Wednesday'; break;
            case 'H': dayKey = 'Thursday'; break;
            default: dayKey = sec.day_code;
        }

        const start = sec.start_time ? sec.start_time.substring(0, 5) : null;
        const end = sec.end_time ? sec.end_time.substring(0, 5) : null;
        const courseName = sec.course_name || `Course ${sec.course_id}`;

        if (start && end) {
            scheduleMap[dayKey] = scheduleMap[dayKey] || [];
            scheduleMap[dayKey].push({
                timeStart: start,
                timeEnd: end,
                content: `${sec.dept_code || 'N/A'} ${courseName.split(' ')[0]} (${sec.section_type.substring(0, 1)})`,
            });
        }
    });

    const generateTimeTable = () => {
        const rows = daysOfWeek.map((day) => {
            const daySections = scheduleMap[day] || [];
            const cells = [];
            let i = 0;

            while (i < timeSlots.length) {
                const slot = timeSlots[i];
                const [slotStart] = slot.split(' - ');
                const section = daySections.find((sec) => sec.timeStart === slotStart);

                if (section) {
                    const startHour = parseInt(section.timeStart.split(':')[0]);
                    const endHour = parseInt(section.timeEnd.split(':')[0]);
                    const duration = endHour - startHour;

                    cells.push(
                        <td
                            key={slot}
                            colSpan={duration}
                            className="border p-2 text-center bg-indigo-100 font-semibold text-indigo-800"
                        >
                            {section.content}
                        </td>
                    );
                    i += duration;
                } else {
                    const overlap = daySections.some((sec) => {
                        const startH = parseInt(sec.timeStart.split(':')[0]);
                        const endH = parseInt(sec.timeEnd.split(':')[0]);
                        const slotH = parseInt(slotStart.split(':')[0]);
                        return slotH > startH && slotH < endH;
                    });

                    if (!overlap) {
                        cells.push(
                            <td key={slot} className="border p-2 text-center text-gray-400 bg-gray-50">
                                -
                            </td>
                        );
                    }
                    i++;
                }
            }

            return (
                <tr key={day} className="hover:bg-gray-100 transition duration-150">
                    <th className="border p-2 bg-gray-200 text-center w-1/12">{day}</th>
                    {cells}
                </tr>
            );
        });

        return (
            <Table responsive className="min-w-full bg-white shadow-md rounded-lg overflow-hidden border-collapse">
                <thead>
                    <tr className="bg-blue-900 text-white">
                        <th className="border p-2">Day</th>
                        {timeSlots.map((slot) => (
                            <th key={slot} className="border p-2 text-sm">
                                {slot}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </Table>
        );
    };

    if (loading) {
        return (
            <div className="text-center p-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading schedule data...</p>
            </div>
        );
    }

    return (
        <Card className="shadow-lg mb-4 border-indigo-400 border-2">
            <Card.Header className="bg-indigo-500 text-white text-center py-3">
                <h4 className="mb-0">
                    Schedule {scheduleNumber} - Level {level} (Courses: {sections.length})
                </h4>
            </Card.Header>
            <Card.Body className="overflow-x-auto p-4">
                {sections.length === 0 ? (
                    <div className="text-center text-gray-600 p-4 bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg">
                        No sections available for this schedule yet.
                    </div>
                ) : (
                    generateTimeTable()
                )}
                <div className="text-center mt-4">
                    <Button
                        onClick={() => alert('AI will generate the schedule')}
                        className="bg-green-600 border-0"
                    >
                        <FaSyncAlt className="mr-2" /> Generate Schedule (AI) 
                    </Button>
                    <Button
                        onClick={() => setShowCommentModal(true)}
                        className="ms-2 bg-warning border-0"
                    >
                        Add Comment
                    </Button>
                    <Modal show={showCommentModal} onHide={() => setShowCommentModal(false)} dir="ltr">
                        <Modal.Header closeButton>
                            <Modal.Title>Add Comment</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group>
                                <Form.Label>Your Comment</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Write your comment here..."
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowCommentModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={() => { setShowCommentModal(false); }}>
                                Save Comment
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            </Card.Body>
        </Card>
    );
};


const ManageSchedules = () => {
    const [currentLevel, setCurrentLevel] = useState(3);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({ name: 'Joud (Mock)', role: 'Load Committee' });

    const levels = [3, 4, 5, 6, 7, 8];

    const fetchUserInfo = () => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        } else {
            setUserInfo({ name: 'Joud (Mock)', role: 'Load Committee Head' });
        }
    };


    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const allSections = await fetchData('http://localhost:5000/api/sections');
            const byLevel = allSections.filter((sec) => parseInt(sec.level) === currentLevel);
            const finalSections = byLevel.filter((sec) => sec.dept_code !== 'SE');
            const group1 = finalSections.filter((sec) => sec.student_group === 1);
            const group2 = finalSections.filter((sec) => sec.student_group === 2);

            setSchedules(
                [
                    { id: 1, sections: group1 },
                    { id: 2, sections: group2 },
                ].filter((sch) => sch.sections.length > 0)
            );
        } catch (err) {
            console.error(err);
            if (err.message === 'AUTHENTICATION_FAILED') navigate('/login');
            else setError('Failed to load schedules. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [currentLevel, navigate]);

    useEffect(() => {
        fetchUserInfo();
        fetchSchedules();
        // ضمان أن يكون اتجاه الجسم LTR بشكل صريح
        document.body.style.direction = 'ltr'; 
    }, [currentLevel, fetchSchedules]);

    return (
        <div
            className="min-h-screen"
            style={{ background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' }}
        >
            {/* عنوان الصفحة الموحد */}
            <h1 className="text-center text-white fw-bolder py-3" style={{ background: '#764ba2', margin: 0 }}>
                SMART SCHEDULE
            </h1>

            <Container fluid="lg" className="container-custom shadow-lg">
                {/* شريط التنقل الموحد (Admin Dashboard under Logout) */}
                <Navbar expand="lg" variant="dark" className="navbar-custom p-3 navbar-modified">
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className="w-100">
                        {/* القائمة: من اليسار لليمين */}
                        <Nav className="me-auto my-2 my-lg-0 nav-menu nav-menu-expanded" style={{ fontSize: '0.9rem' }}>
                            <Nav.Link onClick={() => navigate('/dashboard')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaHome className="me-2" /> HOME
                            </Nav.Link>
                            {/* تم تمييز رابط هذه الصفحة */}
                            <Nav.Link onClick={() => navigate('/manageSchedules')} className="nav-link-custom active rounded-2 p-2 mx-1">
                                <FaCalendarAlt className="me-2" /> Manage Schedules & Levels
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/managestudents')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaUsers className="me-2" /> Manage Students
                            </Nav.Link>
                            {/* ✅ التعديل هنا: استخدام navigate للمسار الجديد Course Information */}
                            <Nav.Link onClick={() => navigate('/addElective')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaBook className="me-2" /> Course Information
                            </Nav.Link>
                            {/* 🚀 التعديل المطلوب: استخدام navigate للمسار الجديد Manage Rules */}
                            <Nav.Link onClick={() => navigate('/managerules')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaBalanceScale className="me-2" /> Manage Rules
                            </Nav.Link>
                            {/* 🚀 التعديل الإضافي: استخدام navigate للمسار الجديد Manage Notifications */}
                            <Nav.Link onClick={() => navigate('/managenotifications')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaBell className="me-2" /> Manage Notifications
                            </Nav.Link>
                        </Nav>

                        {/* قسم المستخدم وزر الخروج و Admin Dashboard (تحتها) */}
                        <div className="user-section d-flex flex-column align-items-end ms-lg-4 mt-3 mt-lg-0">
                            <div className="d-flex align-items-center mb-2">
                                <div className="user-info text-white text-start me-3">
                                    <div className="user-name fw-bold">{loading ? 'Loading...' : userInfo.name}</div>
                                    <div className="user-role" style={{ opacity: 0.8, fontSize: '0.8rem' }}>{userInfo.role}</div>
                                </div>
                                <Button variant="danger" className="logout-btn fw-bold py-2 px-3" onClick={() => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    navigate('/login');
                                }}>
                                    <FaSignOutAlt className="me-1" /> Logout
                                </Button>
                            </div>
                            {/* Admin Dashboard تحت زر Logout */}
                            <Badge bg="light" text="dark" className="committee-badge p-2 mt-1" style={{ width: 'fit-content' }}>
                                Admin Dashboard
                            </Badge>
                        </div>
                    </Navbar.Collapse>
                </Navbar>
                {/* نهاية شريط التنقل الموحد */}

                {/* تم تعديل هذا الـ div لضمان عدم تداخل المحتوى مع الـ Navbar */}
                <div className="bg-white rounded-lg shadow-lg p-4 mt-4"> 
                    
                    {/* رأس الصفحة الترحيبي (للتنظيم) */}
                    <header className="welcome-section mb-5 text-start">
                        <h2 className="text-dark fw-bolder mb-1">Smart Schedule Management</h2>
                        <p className="text-secondary fs-6">View, filter, and approve suggested schedules generated by the system.</p>
                    </header>
                    
                    {/* رسالة الخطأ في بداية المحتوى */}
                    {error && <Alert variant="danger" className="text-start">{error}</Alert>}

                    <Card className="mb-6 shadow">
                        <Card.Body>
                            {/* توحيد الترتيب: جعل العنوان والفلاتر تبدأ من اليسار */}
                            <h3 className="text-xl font-bold mb-3 text-blue-800 text-start">
                                <FaFilter className="mr-2" /> Filter Levels
                            </h3>
                            <div className="d-flex flex-wrap gap-2"> {/* استخدم flexbox لتنظيم الأزرار من اليسار لليمين */}
                                {/* يتم عكس الترتيب هنا يدويًا ليتوافق مع الصورة التي أرسلتها (8 -> 3) لكن يظل التوزيع LTR */}
                                {levels.slice().reverse().map((level) => (
                                    <Button
                                        key={level}
                                        className={`font-semibold ${currentLevel === level
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-indigo-600'
                                            }`}
                                        onClick={() => setCurrentLevel(level)}
                                    >
                                        Level {level}
                                    </Button>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Body>
                            {/* توحيد الترتيب: جعل العنوان يبدأ من اليسار */}
                            <h3 className="text-xl font-bold mb-3 text-blue-800 text-start">
                                <FaCalendarAlt className="mr-2" /> Suggested Schedules
                            </h3>
                            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 mb-4 text-start"> 
                                <span>📊 Level {currentLevel}</span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                {schedules.length > 0 ? (
                                    schedules.map((schedule, index) => (
                                        <ScheduleTable
                                            key={index}
                                            scheduleNumber={schedule.id}
                                            level={currentLevel}
                                            sections={schedule.sections}
                                            loading={loading}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center text-gray-600 p-6 bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg">
                                        {loading ? (
                                            <div>
                                                <Spinner animation="border" variant="primary" />
                                                <p>Loading...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <p>No schedules currently available for this level.</p>
                                                <Button className="mt-3 bg-green-600 border-0">
                                                    <FaSyncAlt className="mr-2" /> Generate New Schedules (AI)
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </Container>
        </div>
    );
};

export default ManageSchedules;