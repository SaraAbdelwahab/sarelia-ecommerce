import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { getSessionId } from '../utils/api';
import { cart as cartApi } from '../utils/api';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register({
          firstName: form.firstName,
          lastName:  form.lastName,
          email:     form.email,
          password:  form.password,
        });
      }

      // Merge guest cart into user cart after login/register
      try {
        await cartApi.merge(getSessionId());
      } catch { /* non-critical */ }

      navigate('/');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#0B0B0F] min-h-screen flex">
      {/* Left — decorative */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=85"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F]/60 to-[#0B0B0F]/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-16">
          <Link to="/" className="font-['Playfair_Display'] text-white text-4xl font-bold tracking-widest mb-6">
            Sarélia
          </Link>
          <p className="font-['Cormorant_Garamond'] text-white/60 text-2xl leading-relaxed max-w-sm">
            "Jewelry is a way of keeping memories alive."
          </p>
          <p className="font-['Cormorant_Garamond'] text-[#C8A96A] text-base mt-3 tracking-wider">
            — Sarélia Atelier
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <Link
            to="/"
            className="lg:hidden font-['Playfair_Display'] text-white text-3xl font-bold tracking-widest block mb-12 text-center"
          >
            Sarélia
          </Link>

          {/* Toggle */}
          <div className="flex border border-[#C8A96A]/20 mb-10">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 font-['Cormorant_Garamond'] text-sm tracking-[0.2em] uppercase transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-[#C8A96A] text-[#0B0B0F]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 font-['Cormorant_Garamond'] text-sm tracking-[0.2em] uppercase transition-all duration-300 ${
                mode === 'register'
                  ? 'bg-[#C8A96A] text-[#0B0B0F]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              Create Account
            </button>
          </div>

          <h1 className="font-['Playfair_Display'] text-white text-3xl font-bold mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join Sarélia'}
          </h1>
          <p className="font-['Cormorant_Garamond'] text-white/40 text-lg mb-8">
            {mode === 'login'
              ? 'Sign in to access your account and orders.'
              : 'Create an account to enjoy exclusive benefits.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-['Cormorant_Garamond'] text-white/50 text-xs tracking-[0.2em] uppercase mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#111118] border border-[#C8A96A]/20 text-white font-['Cormorant_Garamond'] text-base px-4 py-3 outline-none focus:border-[#C8A96A]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-['Cormorant_Garamond'] text-white/50 text-xs tracking-[0.2em] uppercase mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#111118] border border-[#C8A96A]/20 text-white font-['Cormorant_Garamond'] text-base px-4 py-3 outline-none focus:border-[#C8A96A]/50 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-['Cormorant_Garamond'] text-white/50 text-xs tracking-[0.2em] uppercase mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-[#111118] border border-[#C8A96A]/20 text-white font-['Cormorant_Garamond'] text-base px-4 py-3 outline-none focus:border-[#C8A96A]/50 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-['Cormorant_Garamond'] text-white/50 text-xs tracking-[0.2em] uppercase">
                  Password
                </label>
                {mode === 'login' && (
                  <button type="button" className="font-['Cormorant_Garamond'] text-[#C8A96A]/70 hover:text-[#C8A96A] text-sm transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full bg-[#111118] border border-[#C8A96A]/20 text-white font-['Cormorant_Garamond'] text-base px-4 py-3 outline-none focus:border-[#C8A96A]/50 transition-colors"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block font-['Cormorant_Garamond'] text-white/50 text-xs tracking-[0.2em] uppercase mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#111118] border border-[#C8A96A]/20 text-white font-['Cormorant_Garamond'] text-base px-4 py-3 outline-none focus:border-[#C8A96A]/50 transition-colors"
                />
              </div>
            )}

            {mode === 'register' && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="mt-1 w-4 h-4 accent-[#C8A96A]" />
                <span className="font-['Cormorant_Garamond'] text-white/40 text-sm leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="text-[#C8A96A] hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#C8A96A] hover:underline">Privacy Policy</a>
                </span>
              </label>
            )}

            {error && (
              <p className="font-['Cormorant_Garamond'] text-red-400 text-sm text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C8A96A] text-[#0B0B0F] font-['Inter'] text-xs font-semibold tracking-[0.3em] uppercase py-4 hover:bg-[#E2C98A] transition-colors duration-300 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Please wait…'
                : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[#C8A96A]/10" />
            <span className="font-['Cormorant_Garamond'] text-white/20 text-sm">or continue with</span>
            <div className="flex-1 h-px bg-[#C8A96A]/10" />
          </div>

          {/* Social login */}
          <div className="grid grid-cols-2 gap-3">
            {['Google', 'Apple'].map((provider) => (
              <button
                key={provider}
                type="button"
                className="flex items-center justify-center gap-2 border border-[#C8A96A]/20 text-white/50 font-['Cormorant_Garamond'] text-sm tracking-wider py-3 hover:border-[#C8A96A]/40 hover:text-white/70 transition-all duration-300"
              >
                {provider === 'Google' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z" />
                    <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" />
                    <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z" />
                    <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                )}
                {provider}
              </button>
            ))}
          </div>

          <p className="font-['Cormorant_Garamond'] text-white/30 text-sm text-center mt-8">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-[#C8A96A] hover:underline"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
