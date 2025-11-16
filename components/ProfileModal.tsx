import React, { useState } from 'react';
import { User } from '../types';
import { updateUser } from '../services/authService';
import { CloseIcon, LoadingIcon } from './Icons';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
        const updateData: Partial<Pick<User, 'email' | 'password'>> = {};
        if (email !== user.email) {
            updateData.email = email;
        }
        if (password) {
            updateData.password = password;
        }

        if (Object.keys(updateData).length === 0) {
            setSuccess("No changes to save.");
            setIsLoading(false);
            return;
        }

        const updatedUser = await updateUser(user.id, updateData);
        onUpdate(updatedUser);
        setSuccess("Profile updated successfully!");
        setPassword('');
        setConfirmPassword('');
    } catch (err: any) {
        setError(err.message || 'An error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-slate-800 p-8 rounded-lg shadow-2xl w-full max-w-md relative text-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white" aria-label="Close">
          <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Your Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="profile-email" className="block text-slate-300 mb-2">Email</label>
            <input
              type="email"
              id="profile-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="profile-password" className="block text-slate-300 mb-2">New Password (optional)</label>
            <input
              type="password"
              id="profile-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="profile-confirm-password" className="block text-slate-300 mb-2">Confirm New Password</label>
            <input
              type="password"
              id="profile-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!password}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
            />
          </div>
          
          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          {success && <p className="text-green-400 text-center mb-4">{success}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <LoadingIcon /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
