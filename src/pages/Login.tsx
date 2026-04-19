import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@system.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background Decorative Shapes */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#7367F0]/10 blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[#00CFE8]/10 blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-8 mt-2">
          <div className="w-12 h-12 bg-[#F0EEFF] text-[#7367F0] rounded-lg flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#3D3B4A]">مرحباً بك في النظام 👋</h1>
          <p className="text-[#A5A3AE] text-[13px] mt-1.5 leading-relaxed">الرجاء تسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-[#FCEAEA] text-[#EA5455] rounded-md text-[13px] font-medium text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#5D596C]">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-2.5 w-4 h-4 text-[#A5A3AE]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#5D596C]"
                required
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1.5 pb-2">
            <label className="block text-[13px] font-medium text-[#5D596C]">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-2.5 w-4 h-4 text-[#A5A3AE]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#5D596C]"
                required
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-[#7367F0] text-white rounded-md font-medium hover:bg-[#5E50EE] transition-colors flex justify-center items-center gap-2 disabled:opacity-75 h-[38px] text-[13px] shadow-sm shadow-[#7367F0]/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
