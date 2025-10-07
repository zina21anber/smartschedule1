// frontend/src/pages/ManageSchedules.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaArrowRight, FaFilter, FaCalendarAlt, FaSyncAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// ====== دالة لجلب البيانات من السيرفر ======
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
        throw new Error('فشل تحميل البيانات');
    }

    return response.json();
};

// ====== مكون عرض الجدول الواحد ======
const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const timeSlots = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
];

const ScheduleTable = ({ scheduleNumber, level, sections, loading }) => {
    const scheduleMap = {};

    sections.forEach((sec) => {
        let dayKey;
        switch (sec.day_code) {
            case 'S':
                dayKey = 'الأحد';
                break;
            case 'M':
                dayKey = 'الاثنين';
                break;
            case 'T':
                dayKey = 'الثلاثاء';
                break;
            case 'W':
                dayKey = 'الأربعاء';
                break;
            case 'H':
                dayKey = 'الخميس';
                break;
            default:
                dayKey = sec.day_code;
        }

        const timeStart = sec.start_time ? sec.start_time.substring(0, 5) : 'N/A';
        const timeEnd = sec.end_time ? sec.end_time.substring(0, 5) : 'N/A';
        const displayTime = `${timeStart}-${timeEnd}`;
        const courseName = sec.course_name || `Course ${sec.course_id}`;

        scheduleMap[dayKey] = scheduleMap[dayKey] || {};
        scheduleMap[dayKey][displayTime] = `${courseName} (${sec.section_type.substring(0, 1)})`;
    });

    const generateTimeTable = () => {
        const rows = daysOfWeek.map((day) => {
            const cells = timeSlots.map((slot) => {
                const content = scheduleMap[day] && scheduleMap[day][slot];
                return (
                    <td
                        key={slot}
                        className={`border p-2 text-center text-sm ${content
                                ? 'bg-indigo-100 font-semibold text-indigo-800'
                                : 'bg-gray-50 text-gray-400'
                            }`}
                    >
                        {content || '-'}
                    </td>
                );
            });

            return (
                <tr key={day}>
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
                        {timeSlots.map((slot) => (
                            <th key={slot} className="border p-2 text-sm">
                                {slot}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        );
    };

    if (loading) {
        return (
            <div className="text-center p-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">جاري تحميل بيانات الشعب...</p>
            </div>
        );
    }

    return (
        <Card className="shadow-lg mb-4 border-indigo-400 border-2">
            <Card.Header className="bg-indigo-500 text-white text-center py-3">
                <h4 className="mb-0">
                    جدول {scheduleNumber} - المستوى {level} (المقررات: {sections.length})
                </h4>
            </Card.Header>
            <Card.Body className="overflow-x-auto p-4">
                {sections.length === 0 ? (
                    <div className="text-center text-gray-500">لا توجد شعب بعد.</div>
                ) : (
                    generateTimeTable()
                )}
            </Card.Body>
        </Card>
    );
};

// ====== المكون الرئيسي ======
const ManageSchedules = () => {
    const [currentLevel, setCurrentLevel] = useState(3);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const levels = [3, 4, 5, 6, 7, 8];

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const allSections = await fetchData('http://localhost:5000/api/sections');
            console.log('📦 sections from backend:', allSections);

            const filteredSections = allSections.filter(
                (sec) => parseInt(sec.level) === parseInt(currentLevel)
            );

            // نقسم الجدول إلى مجموعتين (كمثال فقط)
            const half = Math.ceil(filteredSections.length / 2);
            const group1 = filteredSections.slice(0, half);
            const group2 = filteredSections.slice(half);

            setSchedules([
                { id: 1, sections: group1 },
                { id: 2, sections: group2 },
            ]);
        } catch (err) {
            console.error('Error fetching sections:', err);
            if (err.message === 'AUTHENTICATION_FAILED' || err.message.includes('401')) {
                navigate('/login');
                return;
            }
            setError(err.message || 'فشل تحميل الجداول.');
        } finally {
            setLoading(false);
        }
    }, [currentLevel, navigate]);

    useEffect(() => {
        fetchSchedules();
    }, [currentLevel, fetchSchedules]);

    return (
        <div
            className="min-h-screen"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
            <Container fluid="lg" className="bg-white p-4 rounded-lg shadow-lg">
                <div className="navbar bg-blue-900 mb-6 rounded-t-lg p-3 flex justify-between items-center">
                    <a href="/dashboard" className="text-white flex items-center">
                        <FaArrowRight className="ml-2" /> العودة للرئيسية
                    </a>
                    <h1 className="text-white text-2xl font-bold mb-0">
                        إدارة المستويات والجداول الذكية
                    </h1>
                </div>

                {error && (
                    <Alert variant="danger" className="text-center">
                        {error}
                    </Alert>
                )}

                {/* الفلترة */}
                <Card className="mb-4 shadow">
                    <Card.Body>
                        <h3 className="text-xl font-bold mb-3 text-blue-800">
                            <FaFilter className="ml-2" /> فلترة المستويات
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {levels.map((level) => (
                                <Button
                                    key={level}
                                    onClick={() => setCurrentLevel(level)}
                                    className={`font-semibold ${currentLevel === level
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-indigo-600'
                                        }`}
                                >
                                    المستوى {level}
                                </Button>
                            ))}
                        </div>
                    </Card.Body>
                </Card>

                {/* عرض الجداول */}
                <Card className="shadow-lg">
                    <Card.Body>
                        <h3 className="text-xl font-bold mb-3 text-blue-800">
                            <FaCalendarAlt className="ml-2" /> الجداول المقترحة
                        </h3>

                        {loading ? (
                            <div className="text-center p-4">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2">جاري تحميل الجداول...</p>
                            </div>
                        ) : schedules.length === 0 ? (
                            <div className="text-center text-gray-500">
                                لا توجد جداول متاحة لهذا المستوى.
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {schedules.map((sch) => (
                                    <ScheduleTable
                                        key={sch.id}
                                        scheduleNumber={sch.id}
                                        level={currentLevel}
                                        sections={sch.sections}
                                        loading={loading}
                                    />
                                ))}
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default ManageSchedules;
