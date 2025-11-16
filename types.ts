
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export type UserRole = 'user' | 'admin';

export interface User {
    id: string;
    email: string;
    password?: string; // Not ideal to store password, but this is a mock
    role: UserRole;
}

export interface Ad {
    id: string;
    message: string;
    link: string;
    poster: string; // base64 encoded image
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}
