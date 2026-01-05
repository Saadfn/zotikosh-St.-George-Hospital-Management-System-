
import React, { useState, useEffect } from 'react';
import { Stethoscope, Mail, Lock, LogIn, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { db } from '../utils/storage';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    db.init(); // Ensure DB is ready
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = db.login(email, password);
    if (user) {
      onLoginSuccess();
    } else {
      setError("Invalid credentials. Hint: Use 'admin@stgeorgehospital.org' and password '123'");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-50"></div>

      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-in zoom-in-95 duration-500">
        
        {/* Left Side - Visual/Marketing */}
        <div className="md:w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                <Stethoscope size={28} className="text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">St. George</span>
            </div>
            
            <h1 className="text-4xl font-bold leading-tight mb-6">
              Compassionate Care <br /> 
              <span className="text-blue-200">Global Excellence.</span>
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed max-w-md">
              Welcome to the St. George Hospital HMS. Access unified medical records, smart scheduling, and advanced diagnostics in one secure portal.
            </p>
          </div>

          <div className="relative z-10 pt-12">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                <ShieldCheck className="text-blue-200" size={24} />
                <div>
                  <p className="text-sm font-bold">Secure Health Portal</p>
                  <p className="text-xs text-blue-100">Encrypted Patient Data Storage</p>
                </div>
              </div>
              <p className="text-xs text-blue-200/60 font-medium">© 2025 St. George Health Group. All rights reserved.</p>
            </div>
          </div>

          {/* Abstract Grid Decor */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mb-32"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-12 lg:p-20 bg-white">
          <div className="max-w-md mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Portal Sign In</h2>
              <p className="text-slate-500 font-medium">Please enter your hospital credentials to proceed.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-rose-700 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Staff Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@stgeorgehospital.org"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Password</label>
                  <a href="#" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider">Forgot?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 ml-1">
                <input type="checkbox" id="remember" className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer" />
                <label htmlFor="remember" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">Remember this session</label>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Secure Login
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                System Operational
              </div>
              <span>SGH-HMS v2.4.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
