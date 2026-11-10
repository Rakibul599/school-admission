import React, { useState, useEffect, useCallback } from 'react';
import {
  getClasses,
  createHold,
  confirmHold,
  cancelHold,
  getMyHolds,
  getHoldById
} from './services/api';

import StudentHeader from './components/StudentHeader';
import NavigationTabs from './components/NavigationTabs';
import ClassListTab from './components/ClassListTab';
import ApplicationDetailTab from './components/ApplicationDetailTab';
import MyApplicationsTab from './components/MyApplicationsTab';
import CreateClassTab from './components/CreateClassTab';

export default function App() {
  const [studentId, setStudentId] = useState(
    () => localStorage.getItem('school_admission_student_id') || ''
  );

  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [currentHold, setCurrentHold] = useState(() => {
    try {
      const saved = localStorage.getItem('school_admission_current_hold');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [applyingClassId, setApplyingClassId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleStudentIdChange = (id) => {
    setStudentId(id);
    localStorage.setItem('school_admission_student_id', id);
    setErrorMessage('');
  };

  const updateCurrentHold = (hold) => {
    setCurrentHold(hold);
    if (hold) {
      localStorage.setItem('school_admission_current_hold', JSON.stringify(hold));
    } else {
      localStorage.removeItem('school_admission_current_hold');
    }
  };

  // Poll classes every 3 seconds to update seat availability live without page reload
  const loadClasses = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setClassesLoading(true);
      const data = await getClasses();
      if (Array.isArray(data)) {
        setClasses(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!isBackground) {
        setErrorMessage(err.message || 'Failed to load class list.');
      }
    } finally {
      if (!isBackground) setClassesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses(false);
    const interval = setInterval(() => {
      loadClasses(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadClasses]);

  // Restore active student hold when studentId is entered or page reloads
  const restoreStudentHold = useCallback(async (sId) => {
    if (!sId || sId.length !== 17) return;

    try {
      const holds = await getMyHolds(sId);
      if (Array.isArray(holds) && holds.length > 0) {
        const activeHeld = holds.find(
          (h) => h.status === 'HELD' && new Date(h.expiresAt).getTime() > Date.now()
        );
        const latestHold = activeHeld || holds[0];
        updateCurrentHold(latestHold);
      }
    } catch {
      // Ignore background restore errors
    }
  }, []);

  useEffect(() => {
    if (studentId && studentId.length === 17) {
      restoreStudentHold(studentId);
    }
  }, [studentId, restoreStudentHold]);

  // Sync current hold status periodically
  useEffect(() => {
    if (!currentHold?.holdId && !currentHold?.id) return;
    const holdId = currentHold.holdId || currentHold.id;

    if (currentHold.status === 'CONFIRMED' || currentHold.status === 'CANCELLED') {
      return;
    }

    const syncHold = async () => {
      try {
        const updated = await getHoldById(holdId);
        if (updated) {
          updateCurrentHold(updated);
        }
      } catch {
        if (currentHold.expiresAt && new Date(currentHold.expiresAt).getTime() <= Date.now()) {
          updateCurrentHold({ ...currentHold, status: 'EXPIRED' });
        }
      }
    };

    const interval = setInterval(syncHold, 3000);
    return () => clearInterval(interval);
  }, [currentHold]);

  // Handle Apply Now
  const handleApply = async (classId, className) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!studentId || studentId.length !== 17) {
      setErrorMessage(
        'Please enter a valid 17-digit Student Birth Registration Number above before applying.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setApplyingClassId(classId);

    try {
      const holdResponse = await createHold(classId, studentId);
      const newHold = {
        ...holdResponse,
        className: className || `Class ID: ${classId}`
      };

      updateCurrentHold(newHold);
      setSuccessMessage(
        `Seat held successfully. Hold ID: ${holdResponse.holdId}. Please confirm payment within the time limit.`
      );

      loadClasses(true);
      setActiveTab('application');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit application.');
    } finally {
      setApplyingClassId(null);
    }
  };

  // Handle Confirm Hold (Pay Fee)
  const handleConfirmHold = async (holdId) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await confirmHold(holdId, studentId);
      const updated = {
        ...(currentHold || {}),
        status: 'CONFIRMED',
        holdId: res.holdId || holdId
      };
      updateCurrentHold(updated);
      setSuccessMessage('Admission confirmed successfully. Fee payment recorded.');
      loadClasses(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to confirm admission.');
      throw err;
    }
  };

  // Handle Cancel Hold
  const handleCancelHold = async (holdId) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await cancelHold(holdId, studentId);
      const updated = {
        ...(currentHold || {}),
        status: 'CANCELLED'
      };
      updateCurrentHold(updated);
      setSuccessMessage('Application cancelled successfully.');
      loadClasses(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel application.');
      throw err;
    }
  };

  const hasActiveHold =
    currentHold &&
    currentHold.status === 'HELD' &&
    new Date(currentHold.expiresAt).getTime() > Date.now();

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-3 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto">
        <StudentHeader
          studentId={studentId}
          onChange={handleStudentIdChange}
        />

        <NavigationTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasActiveHold={hasActiveHold}
          totalClasses={classes.length}
        />

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded bg-red-50 border border-red-200 text-red-800 text-sm flex items-start justify-between gap-3">
            <div>
              <span className="font-semibold">Error: </span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-red-500 hover:text-red-800 font-bold text-sm cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-start justify-between gap-3">
            <div>
              <span className="font-semibold">Success: </span>
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-emerald-600 hover:text-emerald-900 font-bold text-sm cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <main>
          {activeTab === 'classes' && (
            <ClassListTab
              classes={classes}
              loading={classesLoading}
              onApply={handleApply}
              applyingClassId={applyingClassId}
              studentId={studentId}
              lastUpdated={lastUpdated}
            />
          )}

          {activeTab === 'application' && (
            <ApplicationDetailTab
              hold={currentHold}
              studentId={studentId}
              classes={classes}
              onConfirm={handleConfirmHold}
              onCancel={handleCancelHold}
              onRefresh={() => {
                if (studentId) restoreStudentHold(studentId);
                loadClasses(true);
              }}
              onGoToClasses={() => setActiveTab('classes')}
            />
          )}

          {activeTab === 'my-applications' && (
            <MyApplicationsTab
              studentId={studentId}
              classes={classes}
              onDataChanged={() => {
                loadClasses(true);
                if (studentId) restoreStudentHold(studentId);
              }}
              onViewApplication={(selectedHold) => {
                updateCurrentHold(selectedHold);
                setActiveTab('application');
              }}
              onGoToClasses={() => setActiveTab('classes')}
            />
          )}

          {activeTab === 'create-class' && (
            <CreateClassTab
              classes={classes}
              onClassCreated={() => loadClasses(true)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
