import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
// **توجيه هام:** يجب التأكد من تثبيت هذه المكتبة في مجلد client/ : npm install react-icons
import { FaArrowRight, FaFilter, FaChartBar, FaCalendarAlt, FaSyncAlt } from 'react-icons/fa';


// دالة وهمية لبيانات الجدول (لغرض العرض الأولي)
const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const timeSlots = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
    '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00',
    '14:00 - 15:00'
];

// دالة مساعدة لجلب البيانات من الخادم
const fetchData = async (url) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    });
    if (!response.ok) {
        // إذا كان الخطأ 401/403، يفترض أن المستخدم غير مسجل دخوله
        throw new Error("فشل المصادقة أو فشل تحميل البيانات");
    }
    return response.json();
};

const ScheduleTable = ({ scheduleNumber, level, sections, loading }) => {
    // تنسيق الأقسام حسب اليوم والوقت
    const scheduleMap = {};

    sections.forEach(sec => {
        const day = sec.day_code;
        // هنا يجب أن تتأكد من أن الخادم يرسل course_name.
        // إذا لم يرسل الخادم course_name، سيظهر خطأ هنا.
        const courseName = sec.course_name || `Course ${sec.course_id}`;

        // تحويل أوقات TIME إلى صيغة العرض (09:00)
        const timeStart = sec.start_time ? sec.start_time.substring(0, 5) : 'N/A';
        const timeEnd = sec.end_time ? sec.end_time.substring(0, 5) : 'N/A';

        // هنا يجب أن نحول الأوقات إلى فترات زمنية دقيقة لملء الجدول
        // لتبسيط العرض، سنستخدم الأوقات كـ keys
        if (!scheduleMap[day]) scheduleMap[day] = {};

        // استخدام رمز المقرر ونوع الشعبة في الخلية
        const displayTime = `${timeStart}-${timeEnd}`;
        const content = `${courseName} (${sec.section_type})`;

        // التعديل: يجب ربط day_code الصحيح بالأيام في daysOfWeek
        let dayKey;
        switch (sec.day_code) {
            case 'S': dayKey = 'الأحد'; break;
            case 'M': dayKey = 'الاثنين'; break;
            case 'T': dayKey = 'الثلاثاء'; break;
            case 'W': dayKey = 'الأربعاء'; break;
            case 'H': dayKey = 'الخميس'; break;
            default: dayKey = sec.day_code;
        }

        // استخدام الفترة الزمنية لربط المحتوى بـ timeSlots
        // ملاحظة: هذا يعرض المحتوى فقط إذا تطابقت الفترة بالضبط مع timeSlots المحددة.
        scheduleMap[dayKey] = scheduleMap[dayKey] || {};
        scheduleMap[dayKey][displayTime] = content;
    });

    // دالة لتوليد الهيكل الزمني للجدول
    const generateTimeTable = () => {
        const rows = daysOfWeek.map(day => {

            const cells = timeSlots.map(timeSlot => {
                // البحث في الخريطة باستخدام اسم اليوم والفترة الزمنية (مثال: "الأحد" و "08:00 - 09:00")
                const content = scheduleMap[day] && scheduleMap[day][timeSlot];

                return (
                    <td key={timeSlot} className={`border p-2 text-center text-sm ${content ? 'bg-indigo-100 font-semibold text-indigo-800' : 'bg-gray-50 text-gray-400'}`}>
                        {content || '-'}
                    </td>
                );
            });

            return (
                <tr key={day} className="hover:bg-gray-100 transition duration-150">
                    <th className="border p-2 bg-gray-200 text-right w-1/12">{day}</th>
                    {cells}
                </tr>
            );
        });

        return (
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden border-collapse">
                <thead>
                    <tr className="bg-blue-900 text-white">
                        <th className="border p-2">اليوم</th>
                        {timeSlots.map(slot => (
                            <th key={slot} className="border p-2 text-sm">{slot}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    };


    const regenerateTable = () => {
        alert(`سيتم إرسال طلب إعادة إنشاء الجدول ${scheduleNumber} للمستوى ${level} إلى خوارزمية الذكاء الاصطناعي (AI Solver) الآن! 🚀`);
        // ***********************************************
        // هنا يتم إرسال طلب POST إلى الخادم لتشغيل الخوارزمية
        // ***********************************************
    };

    if (loading) {
        return (
            <div className="text-center p-4">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2">جاري تحميل بيانات الشعب...</p>
            </div>
        );
    }

    return (
        <Card className="shadow-lg mb-4 schedule-table border-indigo-400 border-2">
            <Card.Header className="bg-indigo-500 text-white text-center py-3">
                <h4 className="mb-0">جدول {scheduleNumber} - المستوى {level} (المقررات: {sections.length})</h4>
            </Card.Header>
            <Card.Body className="overflow-x-auto p-4">
                {sections.length === 0 ? (
                    <div className="table-placeholder">
                        لا توجد شعب لهذا الجدول بعد.
                    </div>
                ) : (
                    generateTimeTable()
                )}

                <div className="text-center mt-4">
                    <Button onClick={regenerateTable} className="regenerate-btn bg-indigo-600 hover:bg-indigo-700 border-0">
                        <FaSyncAlt className="ml-2" /> إعادة الإنشاء (AI Solver)
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};


// ----------------------------------------------------
// المكون الرئيسي: ManageSchedules
// ----------------------------------------------------
const ManageSchedules = () => {
    const [currentLevel, setCurrentLevel] = useState(3);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // الأزرار الافتراضية للمستويات
    const levels = [3, 4, 5, 6, 7, 8];

    // جلب الشعب من الخادم وتصفيتها حسب المستوى
    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // المسار المطلوب في الخادم: app.get('/api/sections')
            const allSections = await fetchData('http://localhost:5000/api/sections');

            // بما أن الخادم يرجع جميع الشعب، سنقوم بتصفيتها محليًا حسب المستوى
            const filteredSections = allSections
                // التعديل: يجب أن يرسل الخادم 'level' مع الشعب أو يجب جلب المقررات لربطها
                // سنفترض أن الخادم يرسل حقل 'level' لكل شعبة لغرض العرض
                .filter(sec => sec.level === currentLevel);

            // تقسيم الشعب إلى جداول (Group 1 / Group 2)
            const group1 = filteredSections.slice(0, Math.floor(filteredSections.length / 2));
            const group2 = filteredSections.slice(Math.floor(filteredSections.length / 2));

            setSchedules([
                { id: 1, name: 'جدول 1', sections: group1 },
                { id: 2, name: 'جدول 2', sections: group2 },
            ].filter(sch => sch.sections.length > 0));

        } catch (err) {
            console.error("Error fetching sections:", err);
            setError(err.message || "فشل تحميل الجداول. يرجى التأكد من تشغيل الخادم والمصادقة.");
        } finally {
            setLoading(false);
        }
    }, [currentLevel]);


    useEffect(() => {
        fetchSchedules();
    }, [currentLevel, fetchSchedules]);


    const handleLevelFilter = (level) => {
        setCurrentLevel(level);
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Container fluid="lg" className="container bg-white">
                <div className="navbar bg-blue-900 mb-6 rounded-t-lg">
                    <a href="index-final.html" className="back-button bg-opacity-20 hover:bg-opacity-30">
                        <FaArrowRight className="mr-2" /> العودة للرئيسية
                    </a>
                    <h1 className="text-white text-2xl font-bold mb-0">إدارة المستويات والجداول الذكية</h1>
                    <div></div>
                </div>

                <h1 className="text-3xl text-center text-blue-900 font-extrabold mb-4">إدارة المستويات والجداول الذكية - لجنة التحميل</h1>

                <p className="message text-center text-red-600" id="message">
                    {error && <Alert variant="danger" className="text-sm">{error}</Alert>}
                </p>

                {/* قسم فلترة المستويات */}
                <Card className="level-filter-section border-0 shadow-lg mb-6">
                    <Card.Body>
                        <h3 className="text-xl font-bold mb-3 text-blue-800">
                            <FaFilter className="ml-2" /> فلترة المستويات
                        </h3>
                        <div className="level-buttons grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-3 mb-4">
                            {levels.map(level => (
                                <Button
                                    key={level}
                                    className={`level-btn transition duration-300 font-semibold ${currentLevel === level ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 text-indigo-600 border-indigo-400'}`}
                                    onClick={() => handleLevelFilter(level)}
                                    style={{ padding: '1rem 0.5rem' }}
                                >
                                    المستوى {level}
                                </Button>
                            ))}
                        </div>
                    </Card.Body>
                </Card>

                {/* منطقة عرض الجداول */}
                <Card className="tables-display-area border-0 shadow-lg">
                    <Card.Body>
                        <h3 className="text-xl font-bold mb-3 text-blue-800">
                            <FaCalendarAlt className="ml-2" /> الجداول المقترحة
                        </h3>
                        <div className="level-info bg-indigo-50 border-r-4 border-indigo-500 p-3 mb-4 flex items-center">
                            <span className="text-indigo-600 mr-2">📊</span>
                            <span id="current-level-info" className="font-semibold text-gray-700">المستوى {currentLevel}</span>
                        </div>

                        <div className="tables-container grid md:grid-cols-2 gap-6" id="tables-container">
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
                                <div className="md:col-span-2 text-center text-gray-600 p-6 bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg">
                                    {loading ? (
                                        <div className="p-4">
                                            <Spinner animation="border" variant="primary" />
                                            <p className="mt-2">جاري البحث عن جداول للمستوى {currentLevel}...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="font-semibold">لا توجد جداول مقترحة حالياً لهذا المستوى.</p>
                                            <p className="text-sm">اضغط على زر إعادة الإنشاء لتوليد جداول جديدة.</p>
                                            <Button
                                                onClick={() => alert(`سيتم تشغيل الخوارزمية لتوليد جداول للمستوى ${currentLevel}`)}
                                                className="regenerate-btn mt-3 bg-green-600 hover:bg-green-700 border-0"
                                            >
                                                <FaSyncAlt className="ml-2" /> توليد جداول جديدة (AI)
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card.Body>
                </Card>

            </Container>
        </div>
    );
};

export default ManageSchedules;
