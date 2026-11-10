const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';

/**
 * Extract error message from API response
 */
const parseError = async (res, defaultMsg) => {
  try {
    const data = await res.json();
    const serverMsg = data.error || data.message;
    if (serverMsg) {
      if (serverMsg.includes('No seats available')) {
        return 'No seats available in this class.';
      }
      if (serverMsg.includes('already has an active hold') || serverMsg.includes('already has an active application')) {
        return 'You already have an active application or confirmed admission in this class.';
      }
      if (serverMsg.includes('expired')) {
        return 'This application hold has expired.';
      }
      if (serverMsg.includes('already confirmed')) {
        return 'This application is already confirmed.';
      }
      if (serverMsg.includes('valid 17-digit')) {
        return 'A valid 17-digit student birth registration number is required.';
      }
      return serverMsg;
    }
  } catch {
    // Ignore JSON parse errors
  }
  return defaultMsg;
};

// 1. POST /classes - Create a new class
export const createClass = async ({ name, totalSeats }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, totalSeats: Number(totalSeats) })
    });

    if (!res.ok) {
      const err = await parseError(res, 'Failed to create class.');
      throw new Error(err);
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the server. Please check if the backend is running.');
    }
    throw err;
  }
};

// 2. GET /classes - Fetch all classes with seat statistics
export const getClasses = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/classes`);
    if (!res.ok) {
      const err = await parseError(res, 'Failed to load class list.');
      throw new Error(err);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the server. Please check if the backend is running.');
    }
    throw err;
  }
};

// 3. GET /classes/{classId} - Fetch specific class seat statistics
export const getClassById = async (classId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/classes/${classId}`);
    if (!res.ok) {
      const err = await parseError(res, 'Failed to load class details.');
      throw new Error(err);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the server.');
    }
    throw err;
  }
};

// 4. POST /classes/{classId}/holds - Apply / Hold Seat
export const createHold = async (classId, studentId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/classes/${classId}/holds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Student-Id': studentId.trim()
      }
    });

    if (!res.ok) {
      if (res.status === 409) {
        const err = await parseError(res, 'No seats available or you already have an active application in this class.');
        throw new Error(err);
      }
      const err = await parseError(res, 'Failed to submit application.');
      throw new Error(err);
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the server.');
    }
    throw err;
  }
};

// 5. GET /holds/{holdId} - Get current status of a hold
export const getHoldById = async (holdId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/holds/${holdId}`);
    if (!res.ok) {
      const err = await parseError(res, 'Application not found.');
      throw new Error(err);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the server.');
    }
    throw err;
  }
};

// 6. POST /holds/{holdId}/confirm - Confirm admission & pay fee
export const confirmHold = async (holdId, studentId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/holds/${holdId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Student-Id': studentId.trim()
      }
    });

    if (!res.ok) {
      const err = await parseError(res, 'Could not confirm admission. The application hold may have expired.');
      throw new Error(err);
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the server.');
    }
    throw err;
  }
};

// 7. DELETE /holds/{holdId} - Cancel hold application
export const cancelHold = async (holdId, studentId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/holds/${holdId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Student-Id': studentId.trim()
      }
    });

    if (!res.ok && res.status !== 204) {
      const err = await parseError(res, 'Failed to cancel application.');
      throw new Error(err);
    }

    return true;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the server.');
    }
    throw err;
  }
};

// 8. GET /me/holds - Fetch applications for the student
export const getMyHolds = async (studentId) => {
  if (!studentId || studentId.trim().length !== 17) {
    return [];
  }

  try {
    const res = await fetch(`${API_BASE_URL}/me/holds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Student-Id': studentId.trim()
      }
    });

    // 404 indicates student currently has no recorded applications
    if (res.status === 404) {
      return [];
    }

    if (!res.ok) {
      const err = await parseError(res, 'Failed to load applications.');
      throw new Error(err);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    }
    if (data && (data.holdId || data.id)) {
      return [data];
    }
    return [];
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the server.');
    }
    throw err;
  }
};

export { API_BASE_URL };
