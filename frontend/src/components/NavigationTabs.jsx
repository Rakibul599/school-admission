import React from 'react';

export default function NavigationTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'classes', label: 'Class List' },
    { id: 'my-applications', label: 'My Applications' },
    { id: 'create-class', label: 'Create Class (Admin)' },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '10px 18px',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              fontWeight: 'bold',
              fontSize: '15px',
              color: isActive ? '#2563eb' : '#6b7280',
              borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
              marginBottom: '-2px'
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}