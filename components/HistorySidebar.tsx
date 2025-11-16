import React from 'react';
import { Conversation } from '../types';
import { NewChatIcon, DeleteIcon, HistoryIcon } from './Icons';

interface HistorySidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  setIsOpen,
}) => {
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent conversation from being selected when deleting
    if (window.confirm('Are you sure you want to delete this chat?')) {
        onDeleteConversation(id);
    }
  };

  return (
    <>
      <aside className={`absolute md:relative z-20 h-full bg-slate-800 text-slate-200 w-64 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Chat History</h2>
          </div>
        </div>
        <div className="p-2">
            <button
                onClick={onNewConversation}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm rounded-md bg-slate-700 hover:bg-brand-blue transition-colors duration-200"
            >
                <NewChatIcon className="w-5 h-5" />
                <span>New Chat</span>
            </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <ul>
            {conversations.slice().reverse().map((conv) => (
              <li key={conv.id}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectConversation(conv.id);
                  }}
                  className={`flex items-center justify-between p-2.5 text-sm rounded-md group ${
                    activeConversationId === conv.id ? 'bg-brand-blue text-white' : 'hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate flex-1">{conv.title}</span>
                  <button 
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/50 text-slate-400 hover:text-white transition-opacity"
                    aria-label="Delete conversation"
                  >
                    <DeleteIcon className="w-4 h-4" />
                  </button>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 z-10 md:hidden"></div>}
    </>
  );
};
