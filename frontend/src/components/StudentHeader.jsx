import React from 'react';

export default function StudentHeader({ studentId, onChange }) {
  const isInvalid = studentId && (studentId.length !== 17 || !/^\d+$/.test(studentId));

  return (
    <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
        Student Birth Registration Number (17 digits):
      </label>
      <input
        type="text"
        maxLength={17}
        value={studentId}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="e.g. 20152691234567890"
        style={{ width: '100%', padding: '10px', fontSize: '15px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
      />
      {isInvalid && (
        <small style={{ color: '#dc2626', marginTop: '5px', display: 'block' }}>
          * Birth registration number must be exactly 17 numeric digits (currently {studentId.length}).
        </small>
      )}
    </div>
  );
}