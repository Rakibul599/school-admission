import React from 'react';

export default function StudentHeader({ studentId, onChange }) {
  const digitsOnly = studentId.replace(/\D/g, '');
  const isValid = digitsOnly.length === 17;
  const hasInput = digitsOnly.length > 0;

  const handleInputChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 17);
    onChange(cleaned);
  };

  const handleUseDemo = () => {
    onChange('20152691234567890');
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <header className="bg-white border border-gray-300 rounded-lg p-5 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            School Admission System
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            First-Come, First-Served Online Admission Portal
          </p>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Academic Year Admission
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label htmlFor="student-id-input" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Student Birth Registration Number (17 digits) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUseDemo}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
            >
              Use Demo ID
            </button>
            {hasInput && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-red-600 font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <input
            id="student-id-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={17}
            value={studentId}
            onChange={handleInputChange}
            placeholder="Enter 17-digit birth registration number (e.g. 20152691234567890)"
            className={`w-full px-3.5 py-2 text-sm font-mono tracking-wider rounded border focus:outline-hidden ${
              isValid
                ? 'border-emerald-500 bg-white text-gray-900 focus:ring-1 focus:ring-emerald-500'
                : hasInput
                ? 'border-amber-400 bg-white text-gray-900 focus:ring-1 focus:ring-amber-400'
                : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium">
            {isValid ? (
              <span className="text-emerald-700 font-semibold">17 / 17 digits</span>
            ) : hasInput ? (
              <span className="text-amber-700">{digitsOnly.length} / 17 digits</span>
            ) : (
              <span className="text-gray-400">17 digits required</span>
            )}
          </div>
        </div>

        {hasInput && !isValid && (
          <p className="mt-1 text-xs text-amber-700">
            A valid birth registration number must contain exactly 17 digits.
          </p>
        )}
      </div>
    </header>
  );
}
