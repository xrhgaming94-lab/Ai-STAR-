import React, { useState } from 'react';
import { login, register } from '../services/authService';
import { User } from '../types';
import { LoadingIcon, StarAiIcon } from './Icons';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const authFn = isLogin ? login : register;
      const user = await authFn(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
                <StarAiIcon className="w-12 h-12 text-yellow-400"/>
                <h1 className="text-3xl font-bold text-slate-100">AI STAR</h1>
            </div>
        </div>
        <div className="bg-slate-800 p-8 rounded-lg shadow-2xl">
          <div className="flex border-b border-slate-600 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-lg font-semibold transition-colors duration-200 ${isLogin ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-400'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 text-lg font-semibold transition-colors duration-200 ${!isLogin ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-400'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-slate-300 mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-slate-300 mb-2">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <LoadingIcon /> : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};