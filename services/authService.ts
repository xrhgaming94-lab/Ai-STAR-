import { User, Ad, UserRole } from '../types';
import { deleteAllUserConversations } from './chatService';

// Mock database using localStorage
const USERS_KEY = 'ai_star_users';
const CURRENT_USER_KEY = 'ai_star_current_user';
const ADS_KEY = 'ai_star_ads';

const getFromStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return null;
  }
};

const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};

// --- Initialization ---
const initializeAdmin = () => {
  // If the user store doesn't exist, create it with the default admin.
  if (!getFromStorage(USERS_KEY)) {
    const adminUser: User = {
        id: 'admin_001',
        email: 'xrhgaming94@gmail.com',
        password: 'WDRFrikd12845!@#',
        role: 'admin',
    };
    setToStorage(USERS_KEY, [adminUser]);
  }
};

initializeAdmin();

// --- Auth Service ---

export const getCurrentUser = (): User | null => {
  return getFromStorage<User>(CURRENT_USER_KEY);
};

export const register = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getFromStorage<User[]>(USERS_KEY) || [];
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return reject(new Error('User with this email already exists.'));
      }
      
      const role: UserRole = email.toLowerCase() === 'xrhgaming94@gmail.com' ? 'admin' : 'user';

      const newUser: User = {
        id: Date.now().toString(),
        email,
        password, // In a real app, hash this!
        role,
      };

      users.push(newUser);
      setToStorage(USERS_KEY, users);
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userToReturn } = newUser;
      setToStorage(CURRENT_USER_KEY, userToReturn);
      resolve(userToReturn);
    }, 500);
  });
};

export const login = (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = getFromStorage<User[]>(USERS_KEY) || [];
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

            if (user) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password: _, ...userToReturn } = user;
                setToStorage(CURRENT_USER_KEY, userToReturn);
                resolve(userToReturn);
            } else {
                reject(new Error('Invalid email or password.'));
            }
        }, 500);
    });
};

export const logout = (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

export const updateUser = (userId: string, data: Partial<Pick<User, 'email' | 'password'>>): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = getFromStorage<User[]>(USERS_KEY) || [];
            const userIndex = users.findIndex(u => u.id === userId);

            if (userIndex === -1) {
                return reject(new Error('User not found.'));
            }
            
            if (data.email && users.some(u => u.email.toLowerCase() === data.email!.toLowerCase() && u.id !== userId)) {
                return reject(new Error('Email is already in use by another account.'));
            }

            const updatedUser = { ...users[userIndex], ...data };
            users[userIndex] = updatedUser;
            setToStorage(USERS_KEY, users);

            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password: _, ...userToReturn } = updatedUser;
                setToStorage(CURRENT_USER_KEY, userToReturn);
                resolve(userToReturn);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password: _, ...userToReturn } = updatedUser;
                resolve(userToReturn);
            }

        }, 500);
    });
};

export const getAllUsers = (): User[] => {
    const users = getFromStorage<User[]>(USERS_KEY) || [];
    // In a real app, you'd be more careful about exposing password hashes.
    // For this mock service, we return the full user object.
    return users;
};

export const deleteUser = (userId: string): boolean => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        console.error("An admin cannot delete their own account.");
        return false;
    }

    const users = getFromStorage<User[]>(USERS_KEY) || [];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex > -1) {
        // User found, remove them from the array
        users.splice(userIndex, 1);
        setToStorage(USERS_KEY, users);
        
        // Also delete the user's conversation history
        deleteAllUserConversations(userId);
        return true;
    }
    
    // User was not found
    return false;
};


// --- Ad Service ---

export const getAds = (): Ad[] => {
    return getFromStorage<Ad[]>(ADS_KEY) || [];
};

export const addAd = (adData: Omit<Ad, 'id'>): Ad => {
    const ads = getAds();
    const newAd: Ad = {
        id: Date.now().toString(),
        ...adData,
    };
    ads.push(newAd);
    setToStorage(ADS_KEY, ads);
    return newAd;
};

export const updateAd = (id: string, adData: Omit<Ad, 'id'>): Ad | null => {
    const ads = getAds();
    const adIndex = ads.findIndex(ad => ad.id === id);
    if (adIndex > -1) {
        ads[adIndex] = { ...ads[adIndex], ...adData };
        setToStorage(ADS_KEY, ads);
        return ads[adIndex];
    }
    return null;
};

export const deleteAd = (id: string): boolean => {
    let ads = getAds();
    const initialLength = ads.length;
    ads = ads.filter(ad => ad.id !== id);
    if (ads.length < initialLength) {
        setToStorage(ADS_KEY, ads);
        return true;
    }
    return false;
};