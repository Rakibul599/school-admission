import React, { useState, useEffect } from 'react';
import { getMyHolds, confirmHold, cancelHold } from '../services/api';
import HoldTimer from './HoldTimer';

export default function MyApplicationsTab({
  studentId,
  classes,
  onDataChanged,
  onViewApplication,
  onGoToClasses
}) {
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionHoldId, setActionHoldId] = useState(null);

  const isValidStudentId = studentId && studentId.length === 17;

  const loadHolds = async () => {
    if (!isValidStudentId) {
      setHolds([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getMyHolds(studentId);
      if (Array.isArray(data)) {
        setHolds(data);
      } else if (data && (data.holdId || data.id)) {
        setHolds([data]);
      } else {
        setHolds([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load applications.');
      setHolds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolds();
  }, [studentId]);

  const handleConfirm = async (holdId) => {
    setError('');
    setSuccess('');
    setActionHoldId(holdId);

    try {
      await confirmHold(holdId, studentId);
      setSuccess('Admission fee confirmed successfully.');
      await loadHolds();
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err) {
      setError(err.message || 'Failed to confirm admission.');
    } finally {
      setActionHoldId(null);
    }
  };

  const handleCancel = async (holdId) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this application? The seat will be released immediately.'
    );
    if (!confirmCancel) return;

    setError('');
    setSuccess('');
    setActionHoldId(holdId);

    try {
      await cancelHold(holdId, studentId);
      setSuccess('Application cancelled successfully.');
      await loadHolds();
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel application.');
    } finally {
      setActionHoldId(null);
    }
  };

  const getClassName = (classId, fallbackName) => {
    if (fallbackName) return fallbackName;
    const found = classes?.find((c) => c.id === classId);
    return found ? found.name : `Class ID: ${classId}`;
  };

  if (!isValidStudentId) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-8 text-center shadow-xs">
        <h3 className="text-base font-bold text-gray-900 mb-2">
          Student ID Required
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Please enter your 17-digit Student Birth Registration Number above to view your applications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            My Applications
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Student ID: <span className="font-mono text-gray-700">{studentId}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={loadHolds}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {success}
        </div>
      )}

      <div className="bg-white border border-gray-300 rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-gray-500 text-sm">
            Loading applications...
          </div>
        ) : holds.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm space-y-3">
            <p>No applications found for this student ID.</p>
            <button
              type="button"
              onClick={onGoToClasses}
              className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
            >
              View Class List
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4 font-semibold">Class Name</th>
                  <th className="py-3 px-4 font-semibold">Hold ID</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Remaining Time</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holds.map((h) => {
                  const holdId = h.holdId || h.id;
                  const isPastExpiry = h.expiresAt && new Date(h.expiresAt).getTime() <= Date.now();
                  const effectiveStatus = h.status === 'HELD' && isPastExpiry ? 'EXPIRED' : h.status;
                  const isHeld = effectiveStatus === 'HELD';
                  const isConfirmed = effectiveStatus === 'CONFIRMED';
                  const isExpired = effectiveStatus === 'EXPIRED';
                  const isCancelled = effectiveStatus === 'CANCELLED';
                  const isProcessing = actionHoldId === holdId;

                  return (
                    <tr key={holdId} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {getClassName(h.classId, h.className)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                        {holdId}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isConfirmed && (
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            CONFIRMED
                          </span>
                        )}
                        {isHeld && (
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                            HELD
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                            EXPIRED
                          </span>
                        )}
                        {isCancelled && (
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isHeld ? (
                          <HoldTimer
                            expiresAt={h.expiresAt}
                            status={effectiveStatus}
                            onExpire={loadHolds}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => onViewApplication(h)}
                            className="px-2.5 py-1 rounded text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 transition cursor-pointer"
                          >
                            Details
                          </button>

                          {isHeld && (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleConfirm(holdId)}
                                className={`px-2.5 py-1 rounded text-xs font-semibold text-white transition cursor-pointer ${
                                  isProcessing
                                    ? 'bg-emerald-400 cursor-wait'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                              >
                                {isProcessing ? 'Processing...' : 'Pay Fee'}
                              </button>

                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleCancel(holdId)}
                                className="px-2.5 py-1 rounded text-xs font-medium text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
