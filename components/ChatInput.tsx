
import React, { useState, useEffect, useRef } from 'react';
import { SendIcon, MicrophoneIcon } from './Icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

// Add SpeechRecognition to window type to avoid TypeScript errors
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isSpeechRecognitionSupported = useRef(false);
  const latestInput = useRef(input);
  latestInput.current = input;

  const sendMessageAndClear = (message: string) => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setInput('');
    }
  };

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported by this browser.");
      return;
    }
    isSpeechRecognitionSupported.current = true;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Use ref to get the latest input value and send message
      sendMessageAndClear(latestInput.current);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Cleanup function to stop recognition if the component unmounts
    return () => {
      recognition.stop();
    };
  }, []);

  const handleToggleListening = () => {
    if (isLoading || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop(); // This will trigger onend, which sends the message
    } else {
      setInput(''); // Clear input before starting a new recording
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  
  const sendMessage = () => {
      if (isListening) {
          recognitionRef.current?.stop(); // This triggers onend, which sends the message
      } else {
          sendMessageAndClear(input);
      }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
  };

  return (
    <form onSubmit={handleSend} className="flex items-center gap-3 p-4 bg-slate-800/80 border-t border-slate-700">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening..." : "Ask me anything..."}
        className="flex-1 bg-slate-700 text-white placeholder-slate-400 p-3 rounded-lg resize-none focus:ring-2 focus:ring-brand-blue focus:outline-none transition-shadow duration-200"
        rows={1}
        disabled={isLoading}
        style={{maxHeight: '100px'}}
      />
       {isSpeechRecognitionSupported.current && (
        <button
            type="button"
            onClick={handleToggleListening}
            disabled={isLoading}
            className={`p-3 rounded-full ${
                isListening ? 'bg-red-500 text-white' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
            } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        >
            <MicrophoneIcon className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`} />
        </button>
      )}
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="bg-brand-blue text-white p-3 rounded-full disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        aria-label="Send message"
      >
        <SendIcon className="w-6 h-6" />
      </button>
    </form>
  );
};
