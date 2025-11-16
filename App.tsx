

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, MessageRole, User, Ad, Conversation } from './types';
import { sendMessageToGeminiStream, generateConversationTitle } from './services/geminiService';
import { ChatMessageComponent } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { StarAiIcon, LoadingIcon, LogoutIcon, ProfileIcon, MenuIcon } from './components/Icons';
import { AuthForm } from './components/AuthForm';
import { AdminPanel } from './components/AdminPanel';
import { HistorySidebar } from './components/HistorySidebar';
import { ProfileModal } from './components/ProfileModal';
import * as authService from './services/authService';
import * as chatService from './services/chatService';


const AdBanner: React.FC<{ ad: Ad | null }> = ({ ad }) => {
    if (!ad || !ad.poster) return null;

    return (
        <a
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block h-16 relative overflow-hidden group"
        >
            {/* Background Image */}
            <img
                src={ad.poster}
                alt="Ad Poster"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-black/60"></div>

            {/* Ad Message Text */}
            <div className="relative z-10 h-full flex items-center justify-center">
                <span
                    className="text-white text-lg font-bold text-center px-4"
                    style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)' }}
                >
                    {ad.message}
                </span>
            </div>
        </a>
    );
};

const initialWelcomeMessage: ChatMessage = {
  role: MessageRole.MODEL,
  content: "Welcome to AI STAR! I'm your virtual assistant. I can help you understand our services, generate ad copy, or guide you through the site. What can I do for you today?",
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [displayedAd, setDisplayedAd] = useState<Ad | null>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation ? activeConversation.messages : [initialWelcomeMessage];


  // Check for logged in user on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') {
        setAllUsers(authService.getAllUsers());
      }
    }
    const allAds = authService.getAds();
    setAds(allAds);
  }, []);

  // Load conversations when user logs in
  useEffect(() => {
    if (currentUser) {
      const userConversations = chatService.getConversations(currentUser.id);
      setConversations(userConversations);
      setActiveConversationId(userConversations[0]?.id || null);
    }
  }, [currentUser]);


  // Update displayed ad when ads list changes
  useEffect(() => {
      if (ads.length > 0) {
          const randomAd = ads[Math.floor(Math.random() * ads.length)];
          setDisplayedAd(randomAd);
      } else {
          setDisplayedAd(null);
      }
  }, [ads]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading, activeConversationId]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setAllUsers(authService.getAllUsers());
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setConversations([]);
    setActiveConversationId(null);
    setAllUsers([]);
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };
  
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setIsSidebarOpen(false); // Close sidebar on mobile after starting new chat
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (!currentUser) return;
    chatService.deleteConversation(currentUser.id, conversationId);
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    if (activeConversationId === conversationId) {
      setActiveConversationId(updatedConversations[0]?.id || null);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!currentUser) return;
  
    const userMessage: ChatMessage = { role: MessageRole.USER, content: message };
    let conversationToUpdate: Conversation;
    let isNewConversation = false;
  
    if (!activeConversationId) {
      isNewConversation = true;
      conversationToUpdate = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [userMessage],
      };
      setConversations(prev => [...prev, conversationToUpdate]);
      setActiveConversationId(conversationToUpdate.id);
    } else {
      conversationToUpdate = {
        ...activeConversation!,
        messages: [...activeConversation!.messages, userMessage],
      };
      setConversations(prev => prev.map(c => c.id === activeConversationId ? conversationToUpdate : c));
    }
  
    setIsLoading(true);
  
    // Fork off title generation for new chats
    if (isNewConversation) {
      generateConversationTitle(message).then(title => {
        if (!currentUser) return;
        setConversations(prev => {
          const newConversations = prev.map(c => c.id === conversationToUpdate.id ? { ...c, title } : c);
          chatService.saveConversations(currentUser.id, newConversations);
          return newConversations;
        });
      });
    }
  
    try {
      const stream = sendMessageToGeminiStream(conversationToUpdate.messages);
      let fullResponse = '';
      let modelMessage: ChatMessage = { role: MessageRole.MODEL, content: '' };
      let firstChunk = true;
  
      for await (const chunk of stream) {
        fullResponse += chunk;
        modelMessage.content = fullResponse;
  
        if (firstChunk) {
          firstChunk = false;
          setConversations(prev => prev.map(c => 
            c.id === conversationToUpdate.id 
              ? { ...c, messages: [...c.messages, modelMessage] }
              : c
          ));
        } else {
          setConversations(prev => prev.map(c => 
            c.id === conversationToUpdate.id
              ? { ...c, messages: c.messages.slice(0, -1).concat(modelMessage) }
              : c
          ));
        }
      }
  
      // Save the final state of the conversation
      const finalConversations = conversations.map(c => 
        c.id === conversationToUpdate.id
          ? { ...c, messages: [...conversationToUpdate.messages, modelMessage] }
          : c
      );
      // This is a bit tricky due to state updates, let's refetch state before saving
      setConversations(currentConvos => {
        const convToSave = currentConvos.find(c => c.id === conversationToUpdate.id);
        if (convToSave) {
          chatService.saveConversation(currentUser.id, convToSave);
        }
        return currentConvos;
      });
  
    } catch (error) {
        console.error("Streaming error:", error);
        const errorMessage: ChatMessage = { role: MessageRole.MODEL, content: "Sorry, something went wrong. Please try again." };
        setConversations(prev => prev.map(c => 
            c.id === conversationToUpdate.id 
            ? { ...c, messages: [...c.messages, errorMessage] } 
            : c));
    } finally {
        setIsLoading(false);
    }
  };


  // --- Ad CRUD Handlers ---
  const handleAddAd = (data: Omit<Ad, 'id'>) => {
    const newAd = authService.addAd(data);
    setAds(prevAds => [...prevAds, newAd]);
  };
  
  const handleUpdateAd = (id: string, data: Omit<Ad, 'id'>) => {
    authService.updateAd(id, data);
    setAds(prevAds => prevAds.map(ad => ad.id === id ? { ...ad, ...data } : ad));
  };
  
  const handleDeleteAd = (id: string) => {
    authService.deleteAd(id);
    setAds(prevAds => prevAds.filter(ad => ad.id !== id));
  };
  
  // --- User Management Handler ---
  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      if (authService.deleteUser(userId)) {
        setAllUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      }
    }
  };

  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans">
      <HistorySidebar 
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => { setActiveConversationId(id); setIsSidebarOpen(false); }}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <header className="bg-slate-800/50 p-4 border-b border-slate-700 shadow-md z-10">
          <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-1">
                    <MenuIcon className="w-6 h-6"/>
                  </button>
                  <StarAiIcon className="w-8 h-8 text-yellow-400"/>
                  <h1 className="text-xl font-bold text-slate-100 hidden sm:block">AI STAR</h1>
              </div>
              <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-300 hidden sm:block">{currentUser.email}</span>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    aria-label="Profile"
                  >
                    <ProfileIcon className="w-5 h-5" />
                  </button>
                  <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                      aria-label="Logout"
                  >
                      <LogoutIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>
        </header>
        
        <AdBanner ad={displayedAd} />
        
        <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="container mx-auto">
            {messages.map((msg, index) => (
              <ChatMessageComponent key={index} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 my-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
                  <StarAiIcon className="w-5 h-5 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-slate-700 text-slate-100 rounded-bl-none">
                  <LoadingIcon />
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="w-full">
          <div className="container mx-auto">
              {currentUser.role === 'admin' && (
                  <AdminPanel 
                      ads={ads}
                      onAdd={handleAddAd}
                      onUpdate={handleUpdateAd}
                      onDelete={handleDeleteAd}
                      users={allUsers}
                      onDeleteUser={handleDeleteUser}
                      currentAdminId={currentUser.id}
                  />
              )}
              <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </footer>
      </div>
      {isProfileModalOpen && (
        <ProfileModal 
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default App;