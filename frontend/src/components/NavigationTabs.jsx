import React from 'react';

export default function NavigationTabs({ activeTab, onTabChange, hasActiveHold = false, totalClasses = 0 }) {
  const tabs = [
    {
      id: 'classes',
      label: 'Class List',
      badge: totalClasses > 0 ? `(${totalClasses})` : null
    },
    {
      id: 'application',
      label: 'Application',
      badge: hasActiveHold ? '(Active)' : null
    },
    {
      id: 'my-applications',
      label: 'My Applications',
      badge: null
    },
    {
      id: 'create-class',
      label: 'Create Class (Admin)',
      badge: null
    }
  ];

  return (
    <nav className="flex border-b border-gray-300 bg-white rounded-t-lg mb-6 shadow-xs overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`py-3 px-5 text-sm font-medium border-b-2 whitespace-nowrap transition cursor-pointer select-none ${
              isActive
                ? 'border-blue-600 text-blue-700 bg-blue-50/40 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`ml-1.5 text-xs font-semibold ${tab.id === 'application' && hasActiveHold ? 'text-amber-700 font-bold' : 'text-gray-500'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
