import React, { useState } from 'react';
import { LogIn, Save, Edit, Loader2, UserCheck, Smartphone, Mail, CreditCard, Calendar, Lock } from 'lucide-react';
import { Input } from './components/Input';
import { Toast } from './components/Toast';
import { loginEmployee, saveEmployee } from './services/api';
import { EmployeeData, ValidationErrors } from './types';
import { REGEX } from './constants';

const INITIAL_DATA: EmployeeData = {
  hrmsId: '',
  employeeName: '',
  hindiName: '',
  designation: '',
  dob: '',
  adharNumber: '',
  epicNumber: '',
  panNumber: '',
  mobileNumber: '',
  gmailId: ''
};

function App() {
  const [hrmsIdLogin, setHrmsIdLogin] = useState('');
  const [passwordDate, setPasswordDate] = useState(''); // Stores YYYY-MM-DD from input
  
  const [data, setData] = useState<EmployeeData>(INITIAL_DATA);
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [step, setStep] = useState<'login' | 'form'>('login');

  // Helper to convert YYYY-MM-DD to DD-MM-YYYY
  const formatToBackendDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const validateField = (name: keyof EmployeeData, value: string): string | undefined => {
    switch (name) {
      case 'adharNumber':
        return !REGEX.ADHAR.test(value) ? 'Adhar must be exactly 12 digits' : undefined;
      case 'epicNumber':
        return !REGEX.EPIC.test(value) ? 'Alpha-numeric with / or \\ only' : undefined;
      case 'panNumber':
        return !REGEX.PAN.test(value) ? 'Format: AAAAA1234A (5 Caps, 4 Digits, 1 Cap)' : undefined;
      case 'mobileNumber':
        return !REGEX.MOBILE.test(value) ? 'Invalid Indian mobile number' : undefined;
      case 'gmailId':
        return !REGEX.GMAIL.test(value) ? 'Must be a valid @gmail.com address' : undefined;
      default:
        return undefined;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hrmsIdLogin || !passwordDate) {
      setToast({ message: 'Please enter both User ID and select your DOB.', type: 'error' });
      return;
    }

    setLoading(true);
    
    // Convert YYYY-MM-DD to DD-MM-YYYY for backend check
    const formattedPassword = formatToBackendDate(passwordDate);
    
    // Attempt Login
    const response = await loginEmployee(hrmsIdLogin, formattedPassword);
    
    setLoading(false);

    if (response.status === 'success' && response.data) {
      setData(response.data);
      setIsExisting(response.exists || false);
      setStep('form');
      setToast({ message: 'Login successful!', type: 'success' });
    } else {
      setToast({ message: response.message || 'Login failed. Check credentials.', type: 'error' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Special handling for uppercase enforcement on PAN and EPIC
    let formattedValue = value;
    if (name === 'panNumber' || name === 'epicNumber') {
      formattedValue = value.toUpperCase();
    }

    setData(prev => ({ ...prev, [name]: formattedValue }));

    const error = validateField(name as keyof EmployeeData, formattedValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final Validation Check
    const newErrors: ValidationErrors = {};
    let hasError = false;
    
    (['adharNumber', 'epicNumber', 'panNumber', 'mobileNumber', 'gmailId'] as const).forEach(field => {
        const error = validateField(field, data[field]);
        if (error) {
            newErrors[field] = error;
            hasError = true;
        }
        if(!data[field]) {
             newErrors[field] = "This field is required";
             hasError = true;
        }
    });

    if (hasError) {
        setErrors(newErrors);
        setToast({ message: 'Please fix validation errors before saving.', type: 'error' });
        return;
    }

    setLoading(true);
    const response = await saveEmployee(data);
    setLoading(false);

    if (response.status === 'success') {
      setToast({ message: response.message, type: 'success' });
      setIsExisting(true); // Now it exists in DB
    } else {
      setToast({ message: response.message, type: 'error' });
    }
  };

  const handleLogout = () => {
    setStep('login');
    setData(INITIAL_DATA);
    setHrmsIdLogin('');
    setPasswordDate('');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-700 pb-12">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-200/30 rounded-[100%] blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-200/30 rounded-[100%] blur-3xl opacity-50" />
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-xl shadow-indigo-100 mb-6">
            <UserCheck className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
            Employee <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Portal</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Securely manage and update your HRMS records with real-time validation.
          </p>
        </header>

        {step === 'login' ? (
          /* Login Section */
          <div className="max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-indigo-100 border border-white">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
                <p className="text-slate-500 text-sm mt-2">Login with your HRMS ID and Date of Birth</p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="userId" className="block text-sm font-semibold text-slate-700 mb-2">
                    User ID (HRMS Code)
                  </label>
                  <div className="relative">
                    <input
                      id="userId"
                      type="text"
                      value={hrmsIdLogin}
                      onChange={(e) => setHrmsIdLogin(e.target.value)}
                      placeholder="Enter HRMS ID"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Date of Birth (Password)
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="date"
                      value={passwordDate}
                      onChange={(e) => setPasswordDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                      required
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-right">Select your date from the calendar</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !hrmsIdLogin || !passwordDate}
                  className="mt-2 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" /> Login
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Form Section */
          <div className="animate-fadeIn">
             <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogOutIcon className="w-4 h-4" /> Logout
                </button>
                <div className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Logged in as {data.hrmsId}
                </div>
             </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Read Only Card */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-2xl shadow-slate-300">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <span className="text-2xl font-bold">{data.employeeName.charAt(0)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400 font-medium">HRMS ID</p>
                      <p className="text-2xl font-mono tracking-wider">{data.hrmsId}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Full Name</p>
                      <h3 className="text-xl font-semibold">{data.employeeName}</h3>
                      <p className="text-lg font-medium text-slate-300 font-hindi">{data.hindiName}</p>
                    </div>
                    
                    <div className="h-px bg-white/10" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Designation</p>
                        <p className="text-base font-medium">{data.designation}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">DOB</p>
                        <p className="text-base font-medium">{data.dob}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-8 border border-slate-100">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    {isExisting ? <Edit className="w-6 h-6 text-indigo-500" /> : <Save className="w-6 h-6 text-indigo-500" />}
                    {isExisting ? 'Update Information' : 'Enter Details'}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-1 text-indigo-600 text-sm font-semibold uppercase tracking-wider">
                         <CreditCard className="w-4 h-4" /> Identity Details
                      </div>
                    </div>

                    <Input
                      label="Adhar Number"
                      name="adharNumber"
                      value={data.adharNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 9012"
                      maxLength={12}
                      error={errors.adharNumber}
                      isValid={!!data.adharNumber && !errors.adharNumber}
                    />

                    <Input
                      label="PAN Number"
                      name="panNumber"
                      value={data.panNumber}
                      onChange={handleChange}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      error={errors.panNumber}
                      isValid={!!data.panNumber && !errors.panNumber}
                      style={{ textTransform: 'uppercase' }}
                    />

                    <Input
                      label="Epic Number"
                      name="epicNumber"
                      value={data.epicNumber}
                      onChange={handleChange}
                      placeholder="GDN/12/34"
                      error={errors.epicNumber}
                      isValid={!!data.epicNumber && !errors.epicNumber}
                      style={{ textTransform: 'uppercase' }}
                    />
                    
                    <div className="hidden md:block"></div>

                    <div className="md:col-span-2 mt-2">
                      <div className="flex items-center gap-2 mb-1 text-indigo-600 text-sm font-semibold uppercase tracking-wider">
                         <Smartphone className="w-4 h-4" /> Contact Information
                      </div>
                    </div>

                    <Input
                      label="Mobile Number"
                      name="mobileNumber"
                      value={data.mobileNumber}
                      onChange={handleChange}
                      placeholder="9876543210"
                      maxLength={10}
                      type="tel"
                      error={errors.mobileNumber}
                      isValid={!!data.mobileNumber && !errors.mobileNumber}
                    />

                    <Input
                      label="Gmail ID"
                      name="gmailId"
                      value={data.gmailId}
                      onChange={handleChange}
                      placeholder="example@gmail.com"
                      type="email"
                      error={errors.gmailId}
                      isValid={!!data.gmailId && !errors.gmailId}
                    />
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`
                        px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2
                        ${loading 
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                          : isExisting 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                        }
                      `}
                    >
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : isExisting ? (
                        <><Edit className="w-5 h-5" /> Update Record</>
                      ) : (
                        <><Save className="w-5 h-5" /> Save Record</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple Logout Icon component locally to avoid import error if not exported from lucide-react in older versions
const LogOutIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

export default App;
