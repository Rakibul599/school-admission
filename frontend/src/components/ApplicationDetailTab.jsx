import React, { useState, useEffect } from 'react';
import HoldTimer from './HoldTimer';

export default function ApplicationDetailTab({
  hold,
  studentId,
  classes,
  onConfirm,
  onCancel,
  onRefresh,
  onGoToClasses
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(hold?.status || 'HELD');

  useEffect(() => {
    if (hold?.status) {
      setLocalStatus(hold.status);
    }
  }, [hold?.status]);

  if (!hold) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-8 text-center shadow-xs">
        <h3 className="text-base font-bold text-gray-900 mb-2">
          No Active Application
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          You do not have any seat hold or active application in progress. Please choose a class from the Class List to apply.
        </p>
        <button
          type="button"
          onClick={onGoToClasses}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer"
        >
          View Class List
        </button>
      </div>
    );
  }

  const matchedClass = classes?.find((c) => c.id === hold.classId);
  const displayClassName = hold.className || matchedClass?.name || `Class ID: ${hold.classId}`;

  const isPastExpiry = hold.expiresAt && new Date(hold.expiresAt).getTime() <= Date.now();
  const effectiveStatus = localStatus === 'HELD' && isPastExpiry ? 'EXPIRED' : localStatus;
  const isHeld = effectiveStatus === 'HELD';
  const isConfirmed = effectiveStatus === 'CONFIRMED';
  const isExpired = effectiveStatus === 'EXPIRED';
  const isCancelled = effectiveStatus === 'CANCELLED';

  const handleTimerExpire = () => {
    setLocalStatus('EXPIRED');
    if (onRefresh) {
      onRefresh();
    }
  };

  const handlePayFee = async () => {
    if (!isHeld) return;
    setActionLoading(true);
    try {
      await onConfirm(hold.holdId || hold.id);
      setLocalStatus('CONFIRMED');
    } catch {
      // Handled by parent alert
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!isHeld) return;
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this application? The seat will be released immediately.'
    );
    if (!confirmCancel) return;

    setActionLoading(true);
    try {
      await onCancel(hold.holdId || hold.id);
      setLocalStatus('CANCELLED');
    } catch {
      // Handled by parent alert
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Application Details
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Hold ID: <span className="font-mono text-gray-700">{hold.holdId || hold.id}</span>
          </p>
        </div>

        <div>
          {isConfirmed && (
            <span className="px-3 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              CONFIRMED
            </span>
          )}
          {isHeld && (
            <span className="px-3 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              HELD
            </span>
          )}
          {isExpired && (
            <span className="px-3 py-1 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-300">
              EXPIRED
            </span>
          )}
          {isCancelled && (
            <span className="px-3 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
              CANCELLED
            </span>
          )}
        </div>
      </div>

      {/* Details Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
          <span className="text-xs font-semibold text-gray-500 uppercase block">Class & Shift</span>
          <span className="font-semibold text-gray-900">{displayClassName}</span>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
          <span className="text-xs font-semibold text-gray-500 uppercase block">Student ID</span>
          <span className="font-mono font-semibold text-gray-900">{studentId || hold.studentId}</span>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
          <span className="text-xs font-semibold text-gray-500 uppercase block">Expires At</span>
          <span className="text-gray-800">
            {hold.expiresAt ? new Date(hold.expiresAt).toLocaleString() : 'N/A'}
          </span>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
          <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Time Remaining</span>
          <div>
            <HoldTimer
              expiresAt={hold.expiresAt}
              status={effectiveStatus}
              onExpire={handleTimerExpire}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          {isHeld && 'Payment confirms admission. Expiration automatically releases the seat.'}
          {isConfirmed && 'Admission is confirmed.'}
          {isExpired && 'The application hold has expired. The seat was returned to the available pool.'}
          {isCancelled && 'The application was cancelled.'}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={!isHeld || actionLoading}
            onClick={handlePayFee}
            className={`px-4 py-2 rounded text-xs font-semibold transition cursor-pointer ${
              !isHeld
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : actionLoading
                ? 'bg-emerald-400 text-white cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {actionLoading ? 'Processing...' : 'Pay Admission Fee'}
          </button>

          <button
            type="button"
            disabled={!isHeld || actionLoading}
            onClick={handleCancel}
            className={`px-4 py-2 rounded text-xs font-semibold transition cursor-pointer ${
              !isHeld
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-white hover:bg-red-50 text-red-600 border border-red-300'
            }`}
          >
            Cancel Application
          </button>
        </div>
      </div>
    </div>
  );
}
