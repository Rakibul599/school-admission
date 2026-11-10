import React, { useState } from 'react';

export default function ClassListTab({
  classes,
  loading,
  onApply,
  applyingClassId,
  studentId,
  lastUpdated
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClasses = (classes || []).filter((cls) =>
    (cls.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isValidStudentId = studentId && studentId.length === 17;

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Available Classes and Shifts
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              First-come, first-served admission list
            </p>
          </div>

          <div className="text-xs text-gray-500">
            Auto-refresh active {lastUpdated && `(Updated: ${lastUpdated.toLocaleTimeString()})`}
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by class name..."
            className="w-full sm:w-72 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Validation notice if student ID missing */}
      {!isValidStudentId && (
        <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          Notice: Enter a valid 17-digit Student Birth Registration Number above before applying.
        </div>
      )}

      {/* Class Table */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-xs overflow-hidden">
        {loading && (!classes || classes.length === 0) ? (
          <div className="py-10 text-center text-gray-500 text-sm">
            Loading class list...
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">
            No classes found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4 font-semibold">Class Name</th>
                  <th className="py-3 px-4 font-semibold text-center">Total Seats</th>
                  <th className="py-3 px-4 font-semibold text-center">Held Seats</th>
                  <th className="py-3 px-4 font-semibold text-center">Confirmed Seats</th>
                  <th className="py-3 px-4 font-semibold text-center">Available Seats</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClasses.map((cls) => {
                  const isAvailable = cls.availableSeats > 0;
                  const isApplying = applyingClassId === cls.id;

                  return (
                    <tr key={cls.id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        <div>{cls.name}</div>
                        <span className="text-xs font-mono text-gray-400">ID: {cls.id}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-gray-700">
                        {cls.totalSeats}
                      </td>

                      <td className="py-3.5 px-4 text-center font-medium text-amber-800">
                        {cls.heldSeats}
                      </td>

                      <td className="py-3.5 px-4 text-center font-medium text-emerald-800">
                        {cls.confirmedSeats}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={isAvailable ? 'text-emerald-700' : 'text-red-700'}>
                          {cls.availableSeats}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={!isAvailable || isApplying}
                          onClick={() => onApply(cls.id, cls.name)}
                          className={`px-4 py-1.5 rounded text-xs font-semibold transition cursor-pointer select-none ${
                            !isAvailable
                              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                              : isApplying
                              ? 'bg-blue-400 text-white cursor-wait'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isApplying ? 'Applying...' : !isAvailable ? 'Full' : 'Apply'}
                        </button>
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
