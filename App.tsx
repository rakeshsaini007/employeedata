
import React, { useState, useRef } from 'react';
import { LogIn, Edit, Loader2, UserCheck, Smartphone, CreditCard, Calendar, Lock, LogOut, ShieldCheck, ChevronRight, Fingerprint, Type, Camera, Upload, Trash2, Building2, Binary, CheckCircle2 } from 'lucide-react';
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
  postingOffice: '',
  udiseCode: '',
  adharNumber: '',
  epicNumber: '',
  panNumber: '',
  mobileNumber: '',
  gmailId: '',
  photo: ''
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formatToBackendDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'File is too large (max 5MB)', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setData(prev => ({ ...prev, photo: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (name: keyof EmployeeData, value: string): string | undefined => {
    switch (name) {
      case 'adharNumber': return !REGEX.ADHAR.test(value) ? 'Enter 12 digits' : undefined;
      case 'epicNumber': return !REGEX.EPIC.test(value) ? 'Invalid format' : undefined;
      case 'panNumber': return !REGEX.PAN.test(value) ? 'Use AAAAA0000A' : undefined;
      case 'mobileNumber': return !REGEX.MOBILE.test(value) ? 'Invalid Indian mobile' : undefined;
      case 'gmailId': return !REGEX.GMAIL.test(value) ? 'Must be @gmail.com' : undefined;
      case 'hindiName': 
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
      setToast({ message: 'Identity Verified Successfully', type: 'success' });
    } else {
      setToast({ message: response.message || 'Authentication Failed', type: 'error' });
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
        const value = data[field];
        const error = validateField(field, value || '');
        if (error || !value) {
            newErrors[field] = error || "Required";
            hasError = true;
        }
    });

    if (!data.photo) {
      newErrors.photo = "Photo is required";
      hasError = true;
    }

    if (hasError) {
        setErrors(newErrors);
        setToast({ message: 'Missing required information.', type: 'error' });
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
        <header className="flex flex-col items-center mb-12 animate-slideUp">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center mb-6 border border-slate-100 group hover:rotate-6 transition-transform">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight text-center">
            Employee <span className="text-indigo-600">Executive</span> Portal
          </h1>
          <p className="mt-4 text-slate-600 font-medium text-lg text-center max-w-xl">
            Secure identity and record management for HRMS verified personnel.
          </p>
        </header>

        {step === 'login' ? (
          <div className="max-w-md mx-auto animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white p-10 relative">
              <div className="absolute top-0 right-10 -translate-y-1/2 w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-950">Identity Login</h2>
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
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><LogIn className="w-6 h-6" /> Verify & Access Portal</>}
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
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
              <div className="flex items-center gap-3 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-emerald-100">
                <ShieldCheck className="w-5 h-5" />
                Verified Session: {data.hrmsId}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* DIGITAL ID CARD - FIXED AND PROMINENT */}
              <div className="lg:col-span-4 lg:sticky lg:top-8">
                <div className="bg-slate-950 rounded-[3rem] p-1 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)]">
                  <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-[2.8rem] p-8 text-white border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-24 h-24 bg-indigo-600/30 rounded-3xl border-2 border-indigo-400/30 flex items-center justify-center backdrop-blur-md overflow-hidden relative shadow-inner">
                        {data.photo ? (
                          <img src={data.photo} alt="Employee" className="w-full h-full object-cover" />
                        ) : (
                          <UserCheck className="w-12 h-12 text-indigo-300" />
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-tighter">Verified HRMS ID</p>
                        <p className="text-2xl font-black font-mono tracking-widest text-emerald-400">#{data.hrmsId}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-indigo-400/60 text-[10px] font-bold uppercase tracking-widest mb-1">Employee Name</p>
                        <h3 className="text-2xl font-bold text-white leading-tight">{data.employeeName}</h3>
                        <p className="text-xl font-bold text-indigo-300 font-hindi mt-1 bg-white/5 inline-block px-3 py-1 rounded-lg border border-white/5">{data.hindiName || 'नाम दर्ज करें'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                        <div>
                          <p className="text-indigo-400/60 text-[10px] font-bold uppercase mb-1">Designation</p>
                          <p className="text-sm font-bold">{data.designation || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-indigo-400/60 text-[10px] font-bold uppercase mb-1">Birth Date</p>
                          <p className="text-sm font-bold">{data.dob}</p>
                        </div>
                      </div>

                      {/* VERIFIED EMPLOYMENT INFO - ALWAYS FETCHED */}
                      <div className="border-t border-white/10 pt-6 space-y-4">
                        <div>
                          <p className="text-emerald-400/70 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                             <CheckCircle2 className="w-3 h-3" /> Posting Office
                          </p>
                          <div className="bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3">
                             <Building2 className="w-4 h-4 text-indigo-400" />
                             <p className="text-xs font-bold leading-snug">{data.postingOffice || 'Fetching Data...'}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-emerald-400/70 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                             <CheckCircle2 className="w-3 h-3" /> Udise Code
                          </p>
                          <div className="bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3">
                             <Binary className="w-4 h-4 text-indigo-400" />
                             <p className="text-sm font-bold font-mono tracking-wider">{data.udiseCode || 'Fetching Data...'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 backdrop-blur-sm flex items-center justify-center gap-3">
                       <ShieldCheck className="w-4 h-4 text-emerald-400" />
                       <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Master Cloud Synchronized ✔</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DATA FORM SECTION */}
              <div className="lg:col-span-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <Edit className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-950">Record Management</h2>
                  </div>

                  {/* AUTO-FETCHED VERIFIED SECTION */}
                  <div className="mb-12">
                    <div className="flex items-center gap-2 text-slate-950 font-black text-xs uppercase tracking-widest mb-5">
                       <ShieldCheck className="w-4 h-4 text-emerald-600" /> System-Verified Employment Data
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Verified Posting Office</label>
                        <div className="bg-white px-5 py-4 rounded-xl border-2 border-slate-200 text-slate-900 font-bold flex items-center gap-3 shadow-sm">
                          <Building2 className="w-5 h-5 text-indigo-500" />
                          <span className="text-sm">{data.postingOffice || "Not Available"}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Office Udise Code</label>
                        <div className="bg-white px-5 py-4 rounded-xl border-2 border-slate-200 text-slate-900 font-bold font-mono tracking-widest flex items-center gap-3 shadow-sm">
                          <Binary className="w-5 h-5 text-indigo-500" />
                          <span className="text-sm">{data.udiseCode || "Not Available"}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 ml-2">* These details are auto-fetched from the HRMS Master Database.</p>
                  </div>

                  {/* Photo Section */}
                  <div className="mb-12">
                    <div className="flex items-center gap-2 text-slate-950 font-black text-xs uppercase tracking-widest mb-4">
                       <Camera className="w-4 h-4 text-indigo-600" /> Profile Image (Required)
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8 bg-indigo-50/20 p-8 rounded-[2.5rem] border-2 border-dashed border-indigo-200/50">
                      <div className="relative w-36 h-36">
                        <div className={`w-36 h-36 rounded-[2rem] overflow-hidden border-4 ${errors.photo ? 'border-red-400' : 'border-white'} shadow-2xl bg-white flex items-center justify-center transition-transform hover:rotate-2`}>
                          {data.photo ? (
                            <img src={data.photo} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-slate-200 flex flex-col items-center gap-1">
                              <UserCheck className="w-12 h-12" />
                              <span className="text-[8px] font-black uppercase tracking-widest">No Image</span>
                            </div>
                          )}
                        </div>
                        {data.photo && (
                          <button type="button" onClick={() => setData(prev => ({ ...prev, photo: '' }))} className="absolute -top-3 -right-3 bg-red-500 text-white p-2.5 rounded-2xl shadow-xl hover:bg-red-600 transition-all hover:scale-110">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex flex-wrap gap-4">
                          <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                            <Camera className="w-5 h-5" /> Capture Selfie
                          </button>
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white text-slate-950 border-2 border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95">
                            <Upload className="w-5 h-5" /> Local Upload
                          </button>
                        </div>
                        <input type="file" ref={cameraInputRef} accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
                        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handlePhotoChange} />
                        {errors.photo && <p className="text-[10px] text-red-600 font-black uppercase tracking-widest text-center md:text-left">{errors.photo}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <div className="md:col-span-2 mb-6 mt-4">
                      <div className="flex items-center gap-2 text-slate-950 font-black text-xs uppercase tracking-widest">
                         <Type className="w-4 h-4 text-indigo-600" /> Regional Identity (Hindi)
                      </div>
                      <div className="h-0.5 w-full bg-slate-100 mt-2"></div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-indigo-50/30 p-6 rounded-[2.5rem] border-2 border-indigo-100/50 mb-6 focus-within:border-indigo-600 transition-all group">
                        <Input
                          label="Hindi Name (नाम हिंदी में)"
                          name="hindiName"
                          value={data.hindiName}
                          onChange={handleChange}
                          placeholder="अपना नाम हिंदी में दर्ज करें"
                          error={errors.hindiName}
                          isValid={!!data.hindiName && !errors.hindiName}
                          className="font-hindi text-xl py-4 border-none focus:ring-0 shadow-none bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 mb-6 mt-4">
                      <div className="flex items-center gap-2 text-slate-950 font-black text-xs uppercase tracking-widest">
                         <CreditCard className="w-4 h-4 text-indigo-600" /> Statutory Numbers
                      </div>
                      <div className="h-0.5 w-full bg-slate-100 mt-2"></div>
                    </div>
                    <Input label="Adhar Number" name="adharNumber" value={data.adharNumber} onChange={handleChange} placeholder="12 Digit Adhar" maxLength={12} error={errors.adharNumber} isValid={!!data.adharNumber && !errors.adharNumber} />
                    <Input label="PAN Number" name="panNumber" value={data.panNumber} onChange={handleChange} placeholder="ABCDE1234F" maxLength={10} error={errors.panNumber} isValid={!!data.panNumber && !errors.panNumber} />
                    <div className="md:col-span-2">
                       <Input label="Epic (Voter ID) Number" name="epicNumber" value={data.epicNumber} onChange={handleChange} placeholder="Card ID Number" error={errors.epicNumber} isValid={!!data.epicNumber && !errors.epicNumber} />
                    </div>

                    <div className="md:col-span-2 mt-6 mb-6">
                      <div className="flex items-center gap-2 text-slate-950 font-black text-xs uppercase tracking-widest">
                         <Smartphone className="w-4 h-4 text-indigo-600" /> Digital Communication
                      </div>
                      <div className="h-0.5 w-full bg-slate-100 mt-2"></div>
                    </div>
                    <Input label="Mobile Number" name="mobileNumber" value={data.mobileNumber} onChange={handleChange} placeholder="10 Digits" maxLength={10} error={errors.mobileNumber} isValid={!!data.mobileNumber && !errors.mobileNumber} />
                    <Input label="Official Email (Gmail)" name="gmailId" value={data.gmailId} onChange={handleChange} placeholder="user@gmail.com" error={errors.gmailId} isValid={!!data.gmailId && !errors.gmailId} />
                  </div>

                  <div className="mt-14 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group px-12 py-5 bg-indigo-600 hover:bg-slate-950 text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-indigo-100 transition-all flex items-center gap-4 disabled:bg-slate-300 transform hover:-translate-y-1 active:scale-95"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{isExisting ? 'Update Record & Cloud Sync' : 'Initialize Secure Record'} <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 mb-8 text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center leading-relaxed">
        HRMS Official Access Portal • Build V4.7 • Secure Sync Enabled<br/>
        <span className="opacity-50">Authorized Personnel Information System</span>
      </footer>
    </div>
  );
}

export default App;
