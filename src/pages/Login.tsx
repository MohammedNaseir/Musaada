import React, { useState } from 'react';
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
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background Decorative Shapes */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[var(--primary-500)]/10 blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[var(--tertiary-500)]/10 blur-[80px] pointer-events-none"></div>

      <div className="card w-full max-w-[400px] p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-8 mt-2">
          <div className="w-12 h-12 bg-[var(--primary-100)] text-[var(--primary-500)] rounded-lg flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="h4 text-[var(--secondary-500)]">مرحباً بك في النظام 👋</h1>
          <p className="body-4 text-[var(--grey-500)] mt-1.5 leading-relaxed">الرجاء تسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-danger px-3 py-2 text-center text-sm">
              {error}
            </div>
          )}

          <div className="form-field space-y-1.5">
            <label className="form-label">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 w-4 h-4 text-[var(--grey-400)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input pr-9 w-full"
                required
                dir="ltr"
              />
            </div>
          </div>

          <div className="form-field space-y-1.5 pb-2">
            <label className="form-label">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 w-4 h-4 text-[var(--grey-400)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pr-9 w-full"
                required
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full h-[38px]"
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
