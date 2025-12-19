
import React, { useState, useRef } from 'react';
import { LogIn, Edit, Loader2, UserCheck, Smartphone, CreditCard, Calendar, Lock, LogOut, ShieldCheck, ChevronRight, Fingerprint, Type, Upload, Trash2, Building2, Binary, CheckCircle2, Save, RefreshCw } from 'lucide-react';
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
        setToast({ message: 'Identity photo too large (Limit: 5MB)', type: 'error' });
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
      case 'adharNumber': return !REGEX.ADHAR.test(value) ? 'Requires 12 numeric digits' : undefined;
      case 'epicNumber': return !REGEX.EPIC.test(value) ? 'Use alphanumeric characters' : undefined;
      case 'panNumber': return !REGEX.PAN.test(value) ? 'Standard PAN format: AAAAA0000A' : undefined;
      case 'mobileNumber': return !REGEX.MOBILE.test(value) ? 'Enter valid 10-digit Indian mobile' : undefined;
      case 'gmailId': return !REGEX.GMAIL.test(value) ? 'Only official @gmail.com addresses' : undefined;
      case 'hindiName': 
        const hindiRegex = /^[\u0900-\u097F\s]+$/;
        return value && !hindiRegex.test(value) ? 'Only Devnagari (Hindi) script permitted' : undefined;
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
      setToast({ message: 'Credentials Verified', type: 'success' });
    } else {
      setToast({ message: response.message || 'Verification Failed', type: 'error' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = (name === 'panNumber' || name === 'epicNumber') ? value.toUpperCase() : value;
    
    if (name === 'hindiName') {
      const hindiChars = value.match(/[\u0900-\u097F\s]/g) || [];
      formattedValue = hindiChars.join('');
    }

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
            newErrors[field] = error || "Mandatory Field";
            hasError = true;
        }
    });

    if (!data.photo) {
      newErrors.photo = "Identity Photo Required";
      hasError = true;
    }

    if (hasError) {
        setErrors(newErrors);
        setToast({ message: 'Incomplete or Invalid Data Present', type: 'error' });
        return;
    }

    setLoading(true);
    const response = await saveEmployee(data);
    setLoading(false);

    if (response.status === 'success') {
      window.alert(response.message);
      setToast({ message: response.message, type: 'success' });
      setIsExisting(true); 
    } else {
      setToast({ message: response.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-start py-8 px-4 bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-6xl relative z-10">
        <header className="flex flex-col items-center mb-12 animate-slideUp">
          <div className="w-20 h-20 bg-slate-950 rounded-3xl shadow-2xl flex items-center justify-center mb-6 border border-slate-800 group hover:scale-105 transition-transform">
            <ShieldCheck className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tighter text-center">
            EXECUTIVE <span className="text-indigo-600">PORTAL</span>
          </h1>
          <p className="mt-4 text-slate-500 font-semibold text-lg text-center max-w-xl uppercase tracking-widest">
            Corporate HRMS Record Management System
          </p>
        </header>

        {step === 'login' ? (
          <div className="max-w-md mx-auto animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-slate-100 p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="mb-12">
                <h2 className="text-4xl font-black text-slate-950 tracking-tight">Login</h2>
                <div className="h-2 w-16 bg-indigo-600 mt-4 rounded-full"></div>
              </div>
              <form onSubmit={handleLogin} className="space-y-8">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">HRMS ID Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={hrmsIdLogin}
                      onChange={(e) => setHrmsIdLogin(e.target.value)}
                      placeholder="e.g. 2216969"
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-slate-950 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                      required
                    />
                    <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Master Key (Date of Birth)</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={passwordDate}
                      onChange={(e) => setPasswordDate(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-slate-950 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                      required
                    />
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-slate-950 hover:bg-indigo-700 text-white font-black text-xl rounded-[1.5rem] shadow-2xl shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-4 disabled:bg-slate-300"
                >
                  {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <><LogIn className="w-6 h-6" /> VERIFY IDENTITY</>}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="animate-slideUp">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
              <button 
                onClick={() => setStep('login')}
                className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-950 font-black rounded-2xl border-2 border-slate-100 flex items-center gap-3 shadow-md transition-all"
              >
                <LogOut className="w-5 h-5" /> DISCONNECT
              </button>
              <div className="flex items-center gap-4 bg-slate-950 text-white px-8 py-4 rounded-2xl font-black shadow-2xl">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span className="tracking-widest uppercase text-sm">ENCRYPTED SESSION: {data.hrmsId}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* VIRTUAL ID CARD */}
              <div className="lg:col-span-4 lg:sticky lg:top-8">
                <div className="bg-slate-950 rounded-[3.5rem] p-1.5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-800">
                  <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 rounded-[3.2rem] p-10 text-white border border-white/5 relative overflow-hidden min-h-[500px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-10">
                        <div className="w-28 h-28 bg-white/10 rounded-[2rem] border-2 border-white/20 flex items-center justify-center backdrop-blur-2xl overflow-hidden relative shadow-2xl">
                          {data.photo ? (
                            <img src={data.photo} alt="Identity" className="w-full h-full object-cover" />
                          ) : (
                            <UserCheck className="w-14 h-14 text-white/30" />
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">RECORD ID</p>
                          <p className="text-3xl font-black font-mono text-white">#{data.hrmsId}</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2">FULL NAME</p>
                          <h3 className="text-3xl font-black text-white leading-tight uppercase">{data.employeeName}</h3>
                          {/* Hindi Name Display */}
                          <div className="mt-4 flex flex-col gap-1">
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">REGIONAL IDENTIFIER</p>
                            <p className="text-2xl font-bold text-indigo-400 font-hindi bg-white/5 inline-block px-4 py-2 rounded-xl border border-white/10">{data.hindiName || '---'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                          <div>
                            <p className="text-white/40 text-[10px] font-black uppercase mb-1 tracking-widest">RANK</p>
                            <p className="text-sm font-black text-indigo-200">{data.designation || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-[10px] font-black uppercase mb-1 tracking-widest">BORN</p>
                            <p className="text-sm font-black text-indigo-200">{data.dob}</p>
                          </div>
                        </div>

                        <div className="border-t border-white/10 pt-8 space-y-4">
                           <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10">
                              <p className="text-[10px] font-black text-white/40 uppercase mb-2 tracking-widest flex items-center gap-2"><Building2 className="w-3 h-3" /> ASSIGNMENT OFFICE</p>
                              <p className="text-xs font-bold leading-relaxed">{data.postingOffice || 'PENDING VERIFICATION'}</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-center gap-4 text-emerald-400">
                       <ShieldCheck className="w-5 h-5" />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em]">SECURE CLOUD SYNCED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DATA MANAGEMENT INTERFACE */}
              <div className="lg:col-span-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-[4rem] p-10 md:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100">
                  <div className="flex items-center gap-6 mb-16">
                    <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center shadow-xl">
                      <Edit className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-slate-950 tracking-tight">System Records</h2>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Personnel Information Update</p>
                    </div>
                  </div>

                  {/* READ-ONLY SYSTEM DATA */}
                  <div className="mb-16">
                    <div className="flex items-center gap-2 text-slate-950 font-black text-xs uppercase tracking-widest mb-6">
                       <CheckCircle2 className="w-4 h-4 text-emerald-600" /> VERIFIED MASTER LIST DATA
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-[3rem] border-2 border-slate-100">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Office of Posting</label>
                        <div className="bg-white px-6 py-5 rounded-[1.5rem] border-2 border-slate-100 text-slate-900 font-bold flex items-center gap-4 shadow-sm select-none">
                          <Building2 className="w-6 h-6 text-indigo-500" />
                          <span className="text-sm font-black">{data.postingOffice || "N/A"}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Office UDISE Code</label>
                        <div className="bg-white px-6 py-5 rounded-[1.5rem] border-2 border-slate-100 text-slate-900 font-black font-mono tracking-[0.2em] flex items-center gap-4 shadow-sm select-none">
                          <Binary className="w-6 h-6 text-indigo-500" />
                          <span className="text-sm">{data.udiseCode || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PHOTO UPLOAD */}
                  <div className="mb-16">
                    <div className="flex items-center gap-2 text-slate-950 font-black text-xs uppercase tracking-widest mb-6">
                       <Upload className="w-4 h-4 text-indigo-600" /> OFFICIAL IDENTITY CAPTURE
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-10 bg-indigo-50/10 p-10 rounded-[3rem] border-2 border-dashed border-indigo-200/50">
                      <div className="relative w-44 h-44">
                        <div className={`w-44 h-44 rounded-[2.5rem] overflow-hidden border-4 ${errors.photo ? 'border-red-400 animate-pulse' : 'border-white'} shadow-2xl bg-white flex items-center justify-center transition-transform hover:scale-105`}>
                          {data.photo ? (
                            <img src={data.photo} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-slate-200 flex flex-col items-center gap-2">
                              <UserCheck className="w-16 h-16" />
                              <span className="text-[10px] font-black uppercase tracking-widest">NO ASSET</span>
                            </div>
                          )}
                        </div>
                        {data.photo && (
                          <button type="button" onClick={() => setData(prev => ({ ...prev, photo: '' }))} className="absolute -top-4 -right-4 bg-slate-950 text-white p-3.5 rounded-[1.2rem] shadow-2xl hover:bg-red-600 transition-all hover:scale-110">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 w-full space-y-6">
                        <p className="text-sm text-slate-500 font-bold leading-relaxed">
                          Please upload a clear, high-resolution portrait for identity verification. Supported formats: JPEG, PNG. Max 5MB.
                        </p>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-slate-950 text-white rounded-[1.8rem] font-black text-lg hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95">
                          <Upload className="w-6 h-6" /> CHOOSE IDENTITY PHOTO
                        </button>
                        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handlePhotoChange} />
                        {errors.photo && <p className="text-xs text-red-600 font-black uppercase tracking-widest text-center md:text-left">{errors.photo}</p>}
                      </div>
                    </div>
                  </div>

                  {/* EDITABLE FIELDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <div className="md:col-span-2 mb-8">
                      <div className="flex items-center gap-3 text-slate-950 font-black text-xs uppercase tracking-widest">
                         <Type className="w-4 h-4 text-indigo-600" /> REGIONAL HINDI IDENTIFICATION
                      </div>
                      <div className="h-0.5 w-full bg-slate-100 mt-4"></div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 mb-8 focus-within:border-indigo-600 focus-within:bg-white transition-all group">
                        <Input
                          label="HINDI NAME (कर्मचारी का नाम)"
                          name="hindiName"
                          value={data.hindiName}
                          onChange={handleChange}
                          placeholder="हिंदी में अपना नाम लिखें"
                          error={errors.hindiName}
                          isValid={!!data.hindiName && !errors.hindiName}
                          className="font-hindi text-2xl font-bold py-5 border-none focus:ring-0 shadow-none bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 mb-8 mt-4">
                      <div className="flex items-center gap-3 text-slate-950 font-black text-xs uppercase tracking-widest">
                         <CreditCard className="w-4 h-4 text-indigo-600" /> STATUTORY REGISTRATIONS
                      </div>
                      <div className="h-0.5 w-full bg-slate-100 mt-4"></div>
                    </div>
                    <Input label="AADHAR CARD (12 DIGITS)" name="adharNumber" value={data.adharNumber} onChange={handleChange} placeholder="0000 0000 0000" maxLength={12} error={errors.adharNumber} isValid={!!data.adharNumber && !errors.adharNumber} />
                    <Input label="PAN CARD (ALPHANUMERIC)" name="panNumber" value={data.panNumber} onChange={handleChange} placeholder="ABCDE1234F" maxLength={10} error={errors.panNumber} isValid={!!data.panNumber && !errors.panNumber} />
                    <div className="md:col-span-2">
                       <Input label="VOTER ID (EPIC) NUMBER" name="epicNumber" value={data.epicNumber} onChange={handleChange} placeholder="ID Card Alpha-Num" error={errors.epicNumber} isValid={!!data.epicNumber && !errors.epicNumber} />
                    </div>

                    <div className="md:col-span-2 mt-10 mb-8">
                      <div className="flex items-center gap-3 text-slate-950 font-black text-xs uppercase tracking-widest">
                         <Smartphone className="w-4 h-4 text-indigo-600" /> COMMUNICATION CHANNELS
                      </div>
                      <div className="h-0.5 w-full bg-slate-100 mt-4"></div>
                    </div>
                    <Input label="MOBILE NUMBER" name="mobileNumber" value={data.mobileNumber} onChange={handleChange} placeholder="10 Digit Primary" maxLength={10} error={errors.mobileNumber} isValid={!!data.mobileNumber && !errors.mobileNumber} />
                    <Input label="OFFICIAL GMAIL ADDRESS" name="gmailId" value={data.gmailId} onChange={handleChange} placeholder="user@gmail.com" error={errors.gmailId} isValid={!!data.gmailId && !errors.gmailId} />
                  </div>

                  <div className="mt-20 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group px-16 py-7 bg-slate-950 hover:bg-indigo-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl shadow-slate-200 transition-all flex items-center gap-6 disabled:bg-slate-300 transform hover:-translate-y-2 active:scale-95"
                    >
                      {loading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <>
                          {isExisting ? (
                            <><RefreshCw className="w-7 h-7 group-hover:rotate-180 transition-transform duration-700" /> OVERWRITE & UPDATE</>
                          ) : (
                            <><Save className="w-7 h-7 group-hover:scale-125 transition-transform" /> SAVE NEW RECORD</>
                          )}
                          <ChevronRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
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

      <footer className="mt-20 mb-12 text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] text-center leading-loose border-t border-slate-200 pt-10 w-full max-w-4xl">
        HRMS EXECUTIVE ANALYTICS PORTAL • BUILD V6.2.0<br/>
        <span className="opacity-50">STRICT OVERWRITE SECURITY PROTOCOLS ACTIVE</span>
      </footer>
    </div>
  );
}

export default App;
