
import React from 'react';
import { ChatMessage, MessageRole } from '../types';
import { UserIcon, StarAiIcon } from './Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: ChatMessage;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
          <StarAiIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-lg lg:max-w-2xl prose prose-sm prose-invert prose-p:my-0 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 break-words ${
          isUser
            ? 'bg-brand-blue text-white rounded-br-none'
            : 'bg-slate-700 text-slate-100 rounded-bl-none'
        }`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};