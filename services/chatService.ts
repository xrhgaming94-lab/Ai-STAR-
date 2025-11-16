import { Conversation } from '../types';

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

const getConversationsKey = (userId: string) => `ai_star_conversations_${userId}`;

export const getConversations = (userId: string): Conversation[] => {
  if (!userId) return [];
  return getFromStorage<Conversation[]>(getConversationsKey(userId)) || [];
};

export const saveConversations = (userId: string, conversations: Conversation[]): void => {
  if (!userId) return;
  setToStorage(getConversationsKey(userId), conversations);
};

export const saveConversation = (userId: string, conversation: Conversation): void => {
  if (!userId || !conversation) return;
  const conversations = getConversations(userId);
  const existingIndex = conversations.findIndex(c => c.id === conversation.id);

  if (existingIndex > -1) {
    conversations[existingIndex] = conversation;
  } else {
    conversations.push(conversation);
  }
  saveConversations(userId, conversations);
};

export const deleteConversation = (userId: string, conversationId: string): void => {
  if (!userId || !conversationId) return;
  let conversations = getConversations(userId);
  conversations = conversations.filter(c => c.id !== conversationId);
  saveConversations(userId, conversations);
};

export const deleteAllUserConversations = (userId: string): void => {
    if (!userId) return;
    try {
        localStorage.removeItem(getConversationsKey(userId));
    } catch (error) {
        console.error(`Error removing conversations for user ${userId}:`, error);
    }
};
