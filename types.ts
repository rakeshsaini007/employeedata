export interface EmployeeData {
  hrmsId: string;
  employeeName: string;
  hindiName: string;
  designation: string;
  dob: string;
  adharNumber: string;
  epicNumber: string;
  panNumber: string;
  mobileNumber: string;
  gmailId: string;
}

export interface LoginResponse {
  status: 'success' | 'error';
  exists?: boolean;
  source?: 'Data' | 'List';
  data?: EmployeeData;
  message?: string;
}

export interface SaveResponse {
  status: 'success' | 'error';
  message: string;
}

export interface ValidationErrors {
  adharNumber?: string;
  epicNumber?: string;
  panNumber?: string;
  mobileNumber?: string;
  gmailId?: string;
  hindiName?: string;
}