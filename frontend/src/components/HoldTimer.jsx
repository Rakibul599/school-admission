import React, { useState, useEffect, useRef } from 'react';

/**
 * Real-time countdown timer.
 * Automatically triggers onExpire and displays EXPIRED when timer reaches 0.
 */
export default function HoldTimer({ expiresAt, status, onExpire }) {
  const calculateSecondsLeft = () => {
    if (!expiresAt) return 0;
    const expiryTime = new Date(expiresAt).getTime();
    const diff = Math.floor((expiryTime - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateSecondsLeft);
  const expiredNotifiedRef = useRef(false);

  useEffect(() => {
    expiredNotifiedRef.current = false;
    const current = calculateSecondsLeft();
    setSecondsLeft(current);

    if (current <= 0) {
      if (status === 'HELD' && onExpire && !expiredNotifiedRef.current) {
        expiredNotifiedRef.current = true;
        onExpire();
      }
      return;
    }

    const intervalId = setInterval(() => {
      const remaining = calculateSecondsLeft();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        if (status === 'HELD' && onExpire && !expiredNotifiedRef.current) {
          expiredNotifiedRef.current = true;
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt, status]);

  if (status !== 'HELD') {
    return <span className="text-gray-400 font-normal">—</span>;
  }

  if (secondsLeft <= 0) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        00:00 (EXPIRED)
      </span>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 60;

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-semibold tracking-wide border ${
        isUrgent
          ? 'bg-amber-100 text-amber-900 border-amber-300'
          : 'bg-gray-100 text-gray-800 border-gray-200'
      }`}
    >
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')} remaining
    </span>
  );
}
