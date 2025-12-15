import { GOOGLE_SCRIPT_URL } from '../constants';
import { EmployeeData, SaveResponse, LoginResponse } from '../types';

/**
 * Authenticates user by HRMS ID and Password (DOB).
 */
export const loginEmployee = async (hrmsId: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'login', hrmsId, password }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API Error:", error);
    return { status: 'error', message: 'Network error or invalid response.' };
  }
};

/**
 * Saves or updates employee data.
 */
export const saveEmployee = async (data: EmployeeData): Promise<SaveResponse> => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'save', data }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API Error:", error);
    return { status: 'error', message: 'Failed to save data.' };
  }
};
