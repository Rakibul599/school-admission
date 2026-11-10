const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// Fetch all classes
export const getClasses = async () => {
  const res = await fetch(`${API_BASE_URL}/classes`);
  if (!res.ok) {
    throw new Error('Failed to load class list from server');
  }
  return res.json();
};

// Create a seat hold (Apply Now)
export const createHold = async (classId, studentId) => {
  const res = await fetch(`${API_BASE_URL}/classes/${classId}/holds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Student-Id': studentId
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    if (res.status === 409) {
      throw new Error(errorData?.message || 'No seats available or you already have an active application in this class.');
    }
    throw new Error(errorData?.message || 'Failed to submit application. Please try again.');
  }

  return res.json();
};