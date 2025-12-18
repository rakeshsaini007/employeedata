import React, { useState } from 'react';
import { LogIn, Save, Edit, Loader2, UserCheck, Smartphone, Mail, CreditCard, Calendar, Lock, LogOut, ShieldCheck, ChevronRight, Fingerprint, Type } from 'lucide-react';
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
  const [passwordDate, setPasswordDate] = useState('');
  const [data, setData] = useState<EmployeeData>(INITIAL_DATA);
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [step, setStep] = useState<'login' | 'form'>('login');

  const formatToBackendDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const validateField = (name: keyof EmployeeData, value: string): string | undefined => {
    switch (name) {
      case 'adharNumber': return !REGEX.ADHAR.test(value) ? 'Enter 12 digits' : undefined;
      case 'epicNumber': return !REGEX.EPIC.test(value) ? 'Invalid format' : undefined;
      case 'panNumber': return !REGEX.PAN.test(value) ? 'Use AAAAA0000A' : undefined;
      case 'mobileNumber': return !REGEX.MOBILE.test(value) ? 'Invalid Indian mobile' : undefined;
      case 'gmailId': return !REGEX.GMAIL.test(value) ? 'Must be @gmail.com' : undefined;
      case 'hindiName': 
        // Simple check for Devanagari characters or space
        const hindiRegex = /^[\u0900-\u097F\s]+$/;
        return value && !hindiRegex.test(value) ? 'Please enter only Hindi characters' : undefined;
      default: return undefined;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formattedPassword = formatToBackendDate(passwordDate);
    const response = await loginEmployee(hrmsIdLogin, formattedPassword);
    setLoading(false);

    if (response.status === 'success' && response.data) {
      setData(response.data);
      setIsExisting(response.exists || false);
      setStep('form');
      setToast({ message: 'Authentication Successful', type: 'success' });
    } else {
      setToast({ message: response.message || 'Verification Failed', type: 'error' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = (name === 'panNumber' || name === 'epicNumber') ? value.toUpperCase() : value;
    setData(prev => ({ ...prev, [name]: formattedValue }));
    const error = validateField(name as keyof EmployeeData, formattedValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: ValidationErrors = {};
    let hasError = false;
    (['adharNumber', 'epicNumber', 'panNumber', 'mobileNumber', 'gmailId', 'hindiName'] as const).forEach(field => {
        const error = validateField(field, data[field]);
        if (error || !data[field]) {
            newErrors[field] = error || "Required";
            hasError = true;
        }
    });

    if (hasError) {
        setErrors(newErrors);
        setToast({ message: 'Incomplete or invalid fields detected.', type: 'error' });
        return;
    }

    setLoading(true);
    const response = await saveEmployee(data);
    setLoading(false);

    if (response.status === 'success') {
      setToast({ message: response.message, type: 'success' });
      setIsExisting(true);
    } else {
      setToast({ message: response.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-start py-8 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-6xl relative z-10">
        {/* Navigation / Header */}
        <header className="flex flex-col items-center mb-12 animate-slideUp">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center mb-6 border border-slate-100 group hover:rotate-6 transition-transform">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight text-center">
            Employee <span className="text-indigo-600">Executive</span> Portal
          </h1>
          <p className="mt-4 text-slate-600 font-medium text-lg text-center max-w-xl">
            Identity management system for HRMS verified professionals.
          </p>
        </header>

        {step === 'login' ? (
          <div className="max-w-md mx-auto animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white p-10 relative">
              <div className="absolute top-0 right-10 -translate-y-1/2 w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Lock className="w-6 h-6 text-white" />
              </div>
              
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-950">Secure Login</h2>
                <div className="h-1 w-12 bg-indigo-600 mt-2 rounded-full"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">HRMS Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={hrmsIdLogin}
                      onChange={(e) => setHrmsIdLogin(e.target.value)}
                      placeholder="Enter ID"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-950 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                      required
                    />
                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Date of Birth</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={passwordDate}
                      onChange={(e) => setPasswordDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-950 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                      required
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-slate-950 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 disabled:bg-slate-300"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><LogIn className="w-6 h-6" /> Authenticate Account</>}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="animate-slideUp">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
              <button 
                onClick={() => setStep('login')}
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl border-2 border-slate-200 flex items-center gap-2 shadow-sm transition-all"
              >
                <LogOut className="w-5 h-5" /> Log Out
              </button>
              <div className="flex items-center gap-3 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-100">
                <ShieldCheck className="w-5 h-5" />
                Verified Session: {data.hrmsId}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Digital ID Panel */}
              <div className="lg:col-span-4">
                <div className="bg-slate-950 rounded-[3rem] p-1 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
                  <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-[2.8rem] p-10 text-white border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    
                    <div className="flex items-center justify-between mb-12">
                      <div className="w-20 h-20 bg-indigo-600/30 rounded-3xl border border-indigo-400/30 flex items-center justify-center backdrop-blur-md">
                        <UserCheck className="w-10 h-10 text-indigo-300" />
                      </div>
                      <div className="text-right">
                        <p className="text-indigo-400 text-xs font-black uppercase tracking-tighter">मानव सम्पदा ID</p>
                        <p className="text-2xl font-black font-mono tracking-widest">#{data.hrmsId}</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div>
                        <p className="text-indigo-400/60 text-xs font-bold uppercase tracking-widest mb-1">Employee Name</p>
                        <h3 className="text-2xl font-bold text-white leading-tight">{data.employeeName}</h3>
                        <p className="text-lg font-medium text-indigo-300 font-hindi mt-1 min-h-[1.75rem]">{data.hindiName || '—'}</p>
                      </div>

                      <div className="flex items-center gap-8 border-t border-white/10 pt-8">
                        <div>
                          <p className="text-indigo-400/60 text-xs font-bold uppercase mb-1">Designation</p>
                          <p className="text-lg font-bold">{data.designation}</p>
                        </div>
                        <div>
                          <p className="text-indigo-400/60 text-xs font-bold uppercase mb-1">DOB</p>
                          <p className="text-lg font-bold">{data.dob}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm flex items-center justify-center">
                       <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">HRMS System Verified ✔</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Center Panel */}
              <div className="lg:col-span-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-white">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <Edit className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-950">Record Management</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
                    {/* Basic Info (Hindi Name) */}
                    <div className="md:col-span-2 mb-6">
                      <div className="flex items-center gap-2 text-slate-950 font-black text-sm uppercase tracking-widest">
                         <Type className="w-5 h-5 text-indigo-600" /> Basic Information
                      </div>
                      <div className="h-0.5 w-full bg-slate-100 mt-2"></div>
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Employee Name (Hindi)"
                        name="hindiName"
                        value={data.hindiName}
                        onChange={handleChange}
                        placeholder="नाम हिंदी में लिखें"
                        error={errors.hindiName}
                        isValid={!!data.hindiName && !errors.hindiName}
                        className="font-hindi text-lg"
                      />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 ml-1">
                        Use Hindi keyboard input for this field.
                      </p>
                    </div>

                    <div className="md:col-span-2 mb-6 mt-4">
                      <div className="flex items-center gap-2 text-slate-950 font-black text-sm uppercase tracking-widest">
                         <CreditCard className="w-5 h-5 text-indigo-600" /> Statutory Details
                      </div>
                      <div className="h-0.5 w-full bg-slate-100 mt-2"></div>
                    </div>

                    <Input
                      label="Adhar Number"
                      name="adharNumber"
                      value={data.adharNumber}
                      onChange={handleChange}
                      placeholder="12 Digit Adhar"
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
                    />

                    <div className="md:col-span-2">
                       <Input
                        label="Epic (Voter) Number"
                        name="epicNumber"
                        value={data.epicNumber}
                        onChange={handleChange}
                        placeholder="ID Card Number"
                        error={errors.epicNumber}
                        isValid={!!data.epicNumber && !errors.epicNumber}
                      />
                    </div>

                    <div className="md:col-span-2 mt-8 mb-6">
                      <div className="flex items-center gap-2 text-slate-950 font-black text-sm uppercase tracking-widest">
                         <Smartphone className="w-5 h-5 text-indigo-600" /> Communication
                      </div>
                      <div className="h-0.5 w-full bg-slate-100 mt-2"></div>
                    </div>

                    <Input
                      label="Mobile Number"
                      name="mobileNumber"
                      value={data.mobileNumber}
                      onChange={handleChange}
                      placeholder="10 Digits"
                      maxLength={10}
                      error={errors.mobileNumber}
                      isValid={!!data.mobileNumber && !errors.mobileNumber}
                    />

                    <Input
                      label="Email (Gmail)"
                      name="gmailId"
                      value={data.gmailId}
                      onChange={handleChange}
                      placeholder="user@gmail.com"
                      error={errors.gmailId}
                      isValid={!!data.gmailId && !errors.gmailId}
                    />
                  </div>

                  <div className="mt-14 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group px-10 py-5 bg-indigo-600 hover:bg-slate-950 text-white font-black text-xl rounded-2xl shadow-2xl shadow-indigo-200 transition-all flex items-center gap-4 disabled:bg-slate-300 transform hover:-translate-y-1 active:scale-95"
                    >
                      {loading ? (
                        <Loader2 className="w-7 h-7 animate-spin" />
                      ) : (
                        <>
                          {isExisting ? 'Update Global Record' : 'Create New Entry'}
                          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 text-slate-400 font-bold text-xs uppercase tracking-widest text-center">
        HRMS Data Protocol V4.2 • Secure Cloud Storage<br/>
        <span className="opacity-50">Department of Personnel & IT</span>
      </footer>
    </div>
  );
}

export default App;