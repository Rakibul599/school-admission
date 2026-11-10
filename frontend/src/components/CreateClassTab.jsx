import React, { useState } from 'react';
import { createClass } from '../services/api';

export default function CreateClassTab({ classes, onClassCreated }) {
  const [name, setName] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedName = name.trim();
    const seatsNum = parseInt(totalSeats, 10);

    if (!trimmedName) {
      setError('Class name is required.');
      return;
    }

    if (isNaN(seatsNum) || seatsNum <= 0) {
      setError('Total seats must be a positive integer greater than zero.');
      return;
    }

    setLoading(true);
    try {
      const created = await createClass({ name: trimmedName, totalSeats: seatsNum });
      setSuccess(`Class "${created.name}" created successfully with ${created.totalSeats} seats (ID: ${created.id}).`);
      setName('');
      setTotalSeats('');
      if (onClassCreated) {
        await onClassCreated();
      }
    } catch (err) {
      setError(err.message || 'Failed to create class.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Class Form Card */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-xs">
        <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-200">
          Create New Class
        </h2>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="className" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Class & Shift Name <span className="text-red-500">*</span>
              </label>
              <input
                id="className"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Class 6 - Morning Shift"
                className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="totalSeats" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Total Seats <span className="text-red-500">*</span>
              </label>
              <input
                id="totalSeats"
                type="number"
                min="1"
                step="1"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded text-sm font-semibold text-white transition cursor-pointer ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Classes List */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">
            Existing Classes ({classes?.length || 0})
          </h3>
        </div>

        {!classes || classes.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No classes available.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-2.5 px-4 font-semibold">Class ID</th>
                  <th className="py-2.5 px-4 font-semibold">Class Name</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Total Seats</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Held Seats</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Confirmed Seats</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Available Seats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{cls.id}</td>
                    <td className="py-2.5 px-4 font-medium text-gray-900">{cls.name}</td>
                    <td className="py-2.5 px-4 text-center font-semibold text-gray-700">{cls.totalSeats}</td>
                    <td className="py-2.5 px-4 text-center text-amber-800 font-medium">{cls.heldSeats}</td>
                    <td className="py-2.5 px-4 text-center text-emerald-800 font-medium">{cls.confirmedSeats}</td>
                    <td className="py-2.5 px-4 text-center font-bold">
                      <span className={cls.availableSeats > 0 ? 'text-emerald-700' : 'text-red-700'}>
                        {cls.availableSeats}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
