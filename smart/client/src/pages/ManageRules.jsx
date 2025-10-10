import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Navbar, Nav, Badge, Tab, Tabs, Spinner } from 'react-bootstrap';
import { FaSave, FaPlus, FaTimes, FaHome, FaCalendarAlt, FaUsers, FaBook, FaBalanceScale, FaBell, FaSignOutAlt, FaExclamationTriangle, FaGraduationCap, FaChalkboardTeacher, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
// import { ruleAPI } from '../services/api'; 
import '../App.css'; 

const COMMITTEE_PASSWORD = "loadcommittee2025"; 

// تعريف أنواع القواعد المتاحة في كل تبويب
const RULE_TYPES = {
    course: [
        { key: 'min_gpa', label: 'Min GPA for Course' },
        { key: 'prereq_override', label: 'Prerequisite Override' },
        { key: 'max_credits_per_level', label: 'Max Credits per Level' },
    ],
    faculty: [
        { key: 'max_load', label: 'Max Teaching Load' },
        { key: 'min_load', label: 'Min Teaching Load' },
        { key: 'max_prep', label: 'Max Preparations' },
    ],
    schedule: [
        { key: 'course_time_limit', label: 'Max Duration per Class' },
        { key: 'max_daily_gap', label: 'Max Daily Gap (Hours)' },
        { key: 'no_friday_classes', label: 'No Friday Classes' },
    ],
};

// البيانات الوهمية المحدثة (Mock Data)
const MOCK_RULES = {
    course: [
        { rule_id: 1, type: 'min_gpa', value: '2.5', description: 'Minimum GPA required for course selection.' },
        { rule_id: 2, type: 'max_credits_per_level', value: '18', description: 'Maximum credit hours allowed per level.' },
    ],
    faculty: [
        { rule_id: 3, type: 'max_load', value: '12', description: 'Maximum contact hours for any faculty member.' },
        { rule_id: 4, type: 'max_prep', value: '4', description: 'Maximum number of unique courses taught by a faculty member.' },
    ],
    schedule: [
        { rule_id: 5, type: 'course_time_limit', value: '1.5', description: 'Maximum duration for a single lecture session (hours).' },
        { rule_id: 6, type: 'no_friday_classes', value: 'True', description: 'Constraint: No classes should be scheduled on Friday.' },
    ],
};


const ManageRules = () => {
    const [rules, setRules] = useState(MOCK_RULES); // يتم استخدام MOCK_RULES للبدء
    const [newRule, setNewRule] = useState({ type: '', value: '', description: '' });
    const [activeTab, setActiveTab] = useState('course');
    const [accessPass, setAccessPass] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Mock user info for Navbar consistency
    const [userInfo, setUserInfo] = useState({ name: 'Guest', role: 'Loading Committee' });
    const fetchUserInfo = () => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        if (storedUser.full_name && storedUser.role) {
            setUserInfo({ name: storedUser.full_name, role: storedUser.role });
        } else {
            setUserInfo({ name: 'Committee Member', role: 'Load Committee' });
        }
    };

    // ------------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------------

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const fetchRules = async () => {
        setLoading(true);
        // Mock Fetch:
        await new Promise(resolve => setTimeout(resolve, 500)); 
        setRules(MOCK_RULES);
        setLoading(false);
    };

    const handleRuleChange = (tab, ruleId, e) => {
        const { name, value } = e.target;
        setRules(prevRules => ({
            ...prevRules,
            [tab]: prevRules[tab].map(rule => 
                rule.rule_id === ruleId ? { ...rule, [name]: value } : rule
            )
        }));
    };

    const handleNewRuleChange = (e) => {
        const { name, value } = e.target;
        setNewRule(prev => ({ ...prev, [name]: value }));
    };

    const handleAddRule = () => {
        // تحديد القسم بناءً على نوع القاعدة المختار
        const ruleTypeKey = newRule.type;
        const targetTab = Object.keys(RULE_TYPES).find(tab => 
            RULE_TYPES[tab].some(rule => rule.key === ruleTypeKey)
        );

        if (!targetTab || !newRule.type || !newRule.description) {
            showMessage("Please select a valid Rule Type and Description.", 'warning');
            return;
        }

        const ruleToAdd = {
            ...newRule,
            rule_id: Date.now(), // يفضل أن يتم تعيينه من الخادم
        };
        
        setRules(prevRules => ({
            ...prevRules,
            [targetTab]: [...prevRules[targetTab], ruleToAdd]
        }));
        
        setNewRule({ type: '', value: '', description: '' });
        setActiveTab(targetTab); // التبديل إلى التبويب الذي تمت فيه الإضافة
        showMessage(`New rule added to the '${targetTab}' list. Click 'Save All Changes' to apply.`, 'info');
    };

    const handleRemoveRule = (tab, idToRemove) => {
        setRules(prevRules => ({
            ...prevRules,
            [tab]: prevRules[tab].filter(rule => rule.rule_id !== idToRemove)
        }));
        showMessage("Rule removed from the list. Click 'Save All Changes' to apply.", 'info');
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (accessPass !== COMMITTEE_PASSWORD) {
            showMessage("Incorrect password. Access denied.", 'danger');
            return;
        }
        
        // التحقق من أن هناك قواعد للحفظ
        if (Object.values(rules).every(arr => arr.length === 0)) {
            showMessage("The rule list is empty. Add rules before saving.", 'warning');
            return;
        }


        setLoading(true);

        // Mock Save:
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log("Saving rules across all tabs:", rules);
        showMessage("All rules updated and saved successfully! (Mock Save)", 'success');
        setLoading(false);
    };


    useEffect(() => {
        fetchUserInfo();
        fetchRules();
        // LTR Design Enforcement
        document.body.style.direction = 'ltr'; 
    }, []);

    // ------------------------------------------------------------------
    // JSX Rendering Components
    // ------------------------------------------------------------------
    
    // مكون فرعي لعرض القواعد في كل تبويب
    const RuleDisplay = ({ rulesList, tabKey }) => (
        <>
            {rulesList.length === 0 ? (
                <Alert variant="info" className="text-center">
                    No active rules found for the {tabKey} section.
                </Alert>
            ) : (
                rulesList.map((rule, index) => (
                    <div key={rule.rule_id} className="p-3 border rounded mb-3 bg-light position-relative">
                        <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleRemoveRule(tabKey, rule.rule_id)}
                            className="position-absolute top-0 end-0 m-2"
                        >
                            <FaTimes />
                        </Button>
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Rule Type (Key)</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="type" 
                                        value={rule.type}
                                        readOnly
                                        className="bg-white fw-bold text-primary"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Value</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="value" 
                                        value={rule.value}
                                        onChange={(e) => handleRuleChange(tabKey, rule.rule_id, e)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Description</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="description" 
                                        value={rule.description}
                                        onChange={(e) => handleRuleChange(tabKey, rule.rule_id, e)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>
                ))
            )}
        </>
    );

    // دمج جميع أنواع القواعد المتاحة في قائمة واحدة للإضافة
    const allRuleTypes = Object.values(RULE_TYPES).flatMap(list => list);

    // ------------------------------------------------------------------
    // Main Render
    // ------------------------------------------------------------------

    return (
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            
            {/* عنوان الصفحة الموحد */}
            <h1 className="text-center text-white fw-bolder py-3" style={{ background: '#764ba2', margin: 0 }}>
                SMART SCHEDULE
            </h1>

            <Container fluid="lg" className="container-custom shadow-lg">
                 {/* شريط التنقل الموحد */}
                <Navbar expand="lg" variant="dark" className="navbar-custom p-3 navbar-modified">
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className="w-100">
                        {/* القائمة: من اليسار لليمين */}
                        <Nav className="me-auto my-2 my-lg-0 nav-menu nav-menu-expanded" style={{ fontSize: '0.9rem' }}>
                            <Nav.Link onClick={() => navigate('/dashboard')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaHome className="me-2" /> HOME
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/manageSchedules')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaCalendarAlt className="me-2" /> Manage Schedules & Levels
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/managestudents')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaUsers className="me-2" /> Manage Students
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/addElective')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaBook className="me-2" /> Course Information
                            </Nav.Link>
                            {/* الرابط النشط للصفحة الحالية */}
                            <Nav.Link onClick={() => navigate('/managerules')} className="nav-link-custom active rounded-2 p-2 mx-1">
                                <FaBalanceScale className="me-2" /> Manage Rules
                            </Nav.Link>
                            {/* 🚀 التعديل هنا: ربط Notifications */}
                            <Nav.Link onClick={() => navigate('/managenotifications')} className="nav-link-custom rounded-2 p-2 mx-1">
                                <FaBell className="me-2" /> Manage Notifications
                            </Nav.Link>
                        </Nav>

                        {/* قسم المستخدم وزر الخروج و Admin Dashboard (تحتها) */}
                        <div className="user-section d-flex flex-column align-items-end ms-lg-4 mt-3 mt-lg-0">
                            <div className="d-flex align-items-center mb-2">
                                <div className="user-info text-white text-start me-3">
                                    <div className="user-name fw-bold">{userInfo.name}</div>
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


                <Card className="shadow-lg border-0 mt-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <Card.Header className="text-white text-start py-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                        <h1 className="mb-2" style={{ fontSize: '2rem' }}>System Rule Management</h1>
                        <p className="mb-0" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                            Define and update the core constraints across Course, Faculty, and Schedule sections.
                        </p>
                    </Card.Header>

                    <Card.Body className="p-4">
                        
                        {message.text && (
                            <Alert variant={message.type} className="text-start fw-bold">
                                {message.text}
                            </Alert>
                        )}
                        
                        <Form onSubmit={handleSubmit}>
                            {/* قسم إضافة قاعدة جديدة (مع اختيار النوع) */}
                            <Card className="mb-4 shadow-sm border-success border-2">
                                <Card.Header className="bg-success text-white fw-bold">
                                    <FaPlus className="me-2" /> Add New Rule
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3 align-items-end">
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Rule Type</Form.Label>
                                                <Form.Select 
                                                    name="type" 
                                                    value={newRule.type}
                                                    onChange={handleNewRuleChange}
                                                    required
                                                >
                                                    <option value="" disabled>Select Rule Type</option>
                                                    {allRuleTypes.map(type => (
                                                        <option key={type.key} value={type.key}>{type.label} ({type.key})</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Value</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    name="value" 
                                                    value={newRule.value}
                                                    onChange={handleNewRuleChange}
                                                    placeholder="e.g., 18 or True"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Description</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    name="description" 
                                                    value={newRule.description}
                                                    onChange={handleNewRuleChange}
                                                    required
                                                    placeholder="Short explanation of the rule"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Button 
                                        type="button" 
                                        onClick={handleAddRule} 
                                        className="w-100 mt-3 fw-bold"
                                        variant="outline-success"
                                        disabled={!newRule.type || !newRule.description}
                                    >
                                        <FaPlus className="me-2" /> Add Rule to List
                                    </Button>
                                </Card.Body>
                            </Card>

                            {/* قسم عرض وتعديل القواعد الحالية (مقسمة بتبويبات) */}
                            <Card className="shadow-sm">
                                <Card.Header className="bg-light fw-bold">
                                    <FaBalanceScale className="me-2 text-primary" /> Current Active Rules
                                </Card.Header>
                                <Card.Body>
                                    {loading ? (
                                        <div className="text-center p-5"><Spinner animation="border" variant="primary" /> <p className="mt-2">Loading rules...</p></div>
                                    ) : (
                                        <Tabs
                                            id="rule-tabs"
                                            activeKey={activeTab}
                                            onSelect={(k) => setActiveTab(k)}
                                            className="mb-3"
                                        >
                                            <Tab eventKey="course" title={<><FaGraduationCap className="me-1" /> Course Rules</>}>
                                                <RuleDisplay rulesList={rules.course} tabKey="course" />
                                            </Tab>
                                            <Tab eventKey="faculty" title={<><FaChalkboardTeacher className="me-1" /> Faculty Rules</>}>
                                                <RuleDisplay rulesList={rules.faculty} tabKey="faculty" />
                                            </Tab>
                                            <Tab eventKey="schedule" title={<><FaClock className="me-1" /> Schedule Rules</>}>
                                                <RuleDisplay rulesList={rules.schedule} tabKey="schedule" />
                                            </Tab>
                                        </Tabs>
                                    )}
                                </Card.Body>
                            </Card>


                            <Form.Group className="mt-4 mb-3">
                                <Form.Label className="fw-bold">Committee Password (Required to Save)</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    value={accessPass}
                                    onChange={(e) => setAccessPass(e.target.value)}
                                    required 
                                />
                            </Form.Group>
                            
                            <Button 
                                type="submit" 
                                className="w-100 fw-bold mt-3"
                                variant="primary"
                                disabled={loading || Object.values(rules).every(arr => arr.length === 0)}
                            >
                                {loading ? 'Saving Changes...' : <><FaSave className="me-2" /> Save All Changes</>}
                            </Button>

                            <Alert variant="info" className="mt-3 d-flex align-items-center">
                                <FaExclamationTriangle className="me-2" />
                                Note: Changing system rules will affect future schedule generation.
                            </Alert>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default ManageRules;