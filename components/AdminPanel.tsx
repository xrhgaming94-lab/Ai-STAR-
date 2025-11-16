import React, { useState } from 'react';
import { Ad, User } from '../types';

interface AdminPanelProps {
  ads: Ad[];
  onAdd: (data: Omit<Ad, 'id'>) => void;
  onUpdate: (id: string, data: Omit<Ad, 'id'>) => void;
  onDelete: (id: string) => void;
  users: User[];
  onDeleteUser: (id: string) => void;
  currentAdminId: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const initialFormState = { message: '', link: '', poster: ''};

export const AdminPanel: React.FC<AdminPanelProps> = ({ ads, onAdd, onUpdate, onDelete, users, onDeleteUser, currentAdminId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newAd, setNewAd] = useState(initialFormState);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      if (editingAd) {
        setEditingAd(prev => prev ? { ...prev, poster: base64 } : null);
      } else {
        setNewAd(prev => ({ ...prev, poster: base64 }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAd) {
      if (editingAd.message.trim() && editingAd.link.trim()) {
        const { id, ...adData } = editingAd;
        onUpdate(id, adData);
        setEditingAd(null);
      }
    } else {
      if (newAd.message.trim() && newAd.link.trim() && newAd.poster) {
        onAdd(newAd);
        setNewAd(initialFormState);
      }
    }
  };

  const startEditing = (ad: Ad) => {
    setEditingAd({ ...ad });
    setIsExpanded(true); 
  };
  
  const cancelEditing = () => {
    setEditingAd(null);
  };

  const currentFormData = editingAd || newAd;
  const setCurrentFormData = editingAd ? (setter: React.SetStateAction<Ad>) => setEditingAd(setter as Ad) : (setter: React.SetStateAction<typeof newAd>) => setNewAd(setter);


  return (
    <div className="bg-slate-800/80 p-4 md:p-6 mt-4 rounded-t-lg border-x border-t border-slate-700">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left">
          <h2 className="text-2xl font-bold text-slate-100 flex justify-between items-center">
            <span>Admin Panel</span>
            <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </h2>
      </button>
      
      {isExpanded && (
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Ad Management */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-slate-200">Manage Ads</h3>
            <form onSubmit={handleSubmit} className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={currentFormData.message}
                  onChange={(e) => setCurrentFormData(p => ({...p, message: e.target.value}))}
                  placeholder="Ad Message (e.g., 'Special Offer!')"
                  className="bg-slate-700 text-white placeholder-slate-400 p-3 rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
                  required
                />
                <input
                  type="url"
                  value={currentFormData.link}
                  onChange={(e) => setCurrentFormData(p => ({...p, link: e.target.value}))}
                  placeholder="Link URL (e.g., 'https://example.com')"
                  className="bg-slate-700 text-white placeholder-slate-400 p-3 rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
                  required
                />
              </div>
              
              <div>
                  <label className="block text-slate-300 mb-2">Upload Poster Image</label>
                  <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/gif"
                      className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-blue-600"
                      />
              </div>

              {currentFormData.poster && (
                <div>
                  <label className="block text-slate-300 mb-2">Poster Preview</label>
                  <img src={currentFormData.poster} alt="Poster preview" className="mt-2 h-24 w-auto rounded-md object-cover border border-slate-600" />
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  {editingAd ? 'Update Ad' : 'Add Ad'}
                </button>
                {editingAd && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-500 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div>
              <h4 className="text-lg font-semibold mb-3 text-slate-200 border-t border-slate-700 pt-4">Current Ads</h4>
              {ads.length === 0 ? (
                <p className="text-slate-400">No ads created yet.</p>
              ) : (
                <ul className="space-y-3">
                  {ads.map((ad) => (
                    <li key={ad.id} className="bg-slate-700 p-3 rounded-lg flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 overflow-hidden">
                          <img src={ad.poster} alt="Poster" className="h-10 w-16 rounded-md object-cover flex-shrink-0" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-slate-100 font-semibold truncate">{ad.message}</p>
                            <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm truncate block">{ad.link}</a>
                          </div>
                      </div>
                      <div className="flex gap-3 flex-shrink-0">
                        <button onClick={() => startEditing(ad)} className="text-blue-400 hover:text-blue-300">Edit</button>
                        <button onClick={() => onDelete(ad.id)} className="text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* User Management */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3 text-slate-200 border-t border-slate-700 pt-4">Manage Users</h3>
            {users.length === 0 ? (
              <p className="text-slate-400">No users found.</p>
            ) : (
              <ul className="space-y-3">
                {users.map((user) => {
                  const isCurrentUser = user.id === currentAdminId;
                  return (
                    <li key={user.id} className="bg-slate-700 p-3 rounded-lg flex items-center justify-between gap-4">
                      <p className="text-slate-100 truncate">
                        {user.email}
                        {isCurrentUser && <span className="text-xs text-slate-400 ml-2">(You)</span>}
                      </p>
                      <button
                        onClick={() => !isCurrentUser && onDeleteUser(user.id)}
                        disabled={isCurrentUser}
                        title={isCurrentUser ? "You cannot delete your own account." : "Delete user"}
                        className={`font-semibold transition-colors duration-200 ${
                          isCurrentUser
                            ? 'text-slate-500 cursor-not-allowed'
                            : 'text-red-400 hover:text-red-300'
                        }`}
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};