import React, { useState, useEffect } from 'react';
import { getClasses, createHold } from './services/api';
import StudentHeader from './components/StudentHeader';
import NavigationTabs from './components/NavigationTabs';
import ClassListTab from './components/ClassListTab';
import MyApplicationsTab from './components/MyApplicationsTab';
import CreateClassTab from './components/CreateClassTab';

export default function App() {
  const [studentId, setStudentId] = useState(
    localStorage.getItem('studentId') || ''
  );
  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [applyingClassId, setApplyingClassId] = useState(null);

  const handleStudentIdChange = (id) => {
    setStudentId(id);
    localStorage.setItem('studentId', id);
  };

  const loadClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Cannot connect to backend service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
    const interval = setInterval(loadClasses, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleApply = async (classId) => {
    if (!studentId || studentId.length !== 17 || !/^\d+$/.test(studentId)) {
      setError('Please provide a valid 17-digit Student Birth Registration Number above before applying.');
      setSuccess('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setError('');
    setSuccess('');
    setApplyingClassId(classId);

    try {
      const holdResponse = await createHold(classId, studentId);
      setSuccess(`Seat successfully held! Hold ID: ${holdResponse.holdId}`);
      loadClasses();
      setActiveTab('my-applications');
    } catch (err) {
      setError(err.message);
    } finally {
      setApplyingClassId(null);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', fontFamily: 'sans-serif', padding: '0 15px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>School Admission System</h2>

      {/* Top Header Component */}
      <StudentHeader studentId={studentId} onChange={handleStudentIdChange} />

      {/* Navigation Tabs Component */}
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Status Alerts */}
      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          {success}
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'classes' && (
        <ClassListTab
          classes={classes}
          loading={loading}
          onApply={handleApply}
          applyingClassId={applyingClassId}
        />
      )}

      {activeTab === 'my-applications' && <MyApplicationsTab />}

      {activeTab === 'create-class' && <CreateClassTab />}
    </div>
  );
}