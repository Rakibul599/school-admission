import React from 'react';

export default function ClassListTab({ classes, loading, onApply, applyingClassId }) {
  return (
    <div>
      <h3 style={{ marginBottom: '12px' }}>Available Classes and Shifts</h3>
      {loading && classes.length === 0 ? (
        <p>Loading classes...</p>
      ) : classes.length === 0 ? (
        <p>No classes available yet.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th>Class & Shift</th>
              <th>Total Seats</th>
              <th>Held</th>
              <th>Confirmed</th>
              <th>Available</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls.id}>
                <td style={{ fontWeight: '500' }}>{cls.name}</td>
                <td>{cls.totalSeats}</td>
                <td>{cls.heldSeats}</td>
                <td>{cls.confirmedSeats}</td>
                <td style={{ fontWeight: 'bold', color: cls.availableSeats > 0 ? '#16a34a' : '#dc2626' }}>
                  {cls.availableSeats}
                </td>
                <td>
                  <button
                    disabled={cls.availableSeats <= 0 || applyingClassId === cls.id}
                    onClick={() => onApply(cls.id)}
                    style={{
                      padding: '6px 14px',
                      cursor: cls.availableSeats > 0 ? 'pointer' : 'not-allowed',
                      background: cls.availableSeats > 0 ? '#2563eb' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}
                  >
                    {applyingClassId === cls.id
                      ? 'Applying...'
                      : cls.availableSeats > 0
                      ? 'Apply Now'
                      : 'Seat Full'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}