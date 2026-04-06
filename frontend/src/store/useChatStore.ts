import { create } from 'zustand';
import { Message } from '@/types/chat';

interface ChatState {
  onlineUserIds: string[];
  activeChatId: string | null;
  messages: Record<string, Message[]>; // contactId -> messages
  isOpen: boolean;
  
  setOnlineUserIds: (ids: string[]) => void;
  setActiveChatId: (id: string | null) => void;
  setIsOpen: (open: boolean) => void;
  addMessage: (contactId: string, message: Message) => void;
  setMessages: (contactId: string, messages: Message[]) => void;
  clearChat: (contactId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  onlineUserIds: [],
  activeChatId: null,
  messages: {},
  isOpen: false,

  setOnlineUserIds: (ids) => set({ onlineUserIds: ids }),
  setActiveChatId: (id) => set({ activeChatId: id, isOpen: !!id }),
  setIsOpen: (open) => set({ isOpen: open }),
  
  addMessage: (contactId, message) => 
    set((state) => {
      const chatMessages = state.messages[contactId] || [];
      
      // Get IDs for comparison (handles both string and object)
      const getMsgSenderId = (m: Message) => 
        typeof m.sender === 'object' ? (m.sender._id || (m.sender as any).id) : m.sender;
      const currentSenderId = getMsgSenderId(message);

      // 1. Check if we have a temporary message with the same content sent recently
      const tempIdx = chatMessages.findLastIndex(m => 
        m._id.startsWith('temp-') && 
        m.content === message.content &&
        getMsgSenderId(m) === currentSenderId
      );

      // 2. If this is a real message from server and we found a matching temp message, REPLACE IT
      if (tempIdx !== -1 && !message._id.startsWith('temp-')) {
        const newMessages = [...chatMessages];
        newMessages[tempIdx] = message;
        return {
          messages: { ...state.messages, [contactId]: newMessages }
        };
      }

      // 3. Fallback duplicate check: if the EXACT message (by _id) or same content/sender exists, skip
      const isDuplicate = chatMessages.some(m => 
        m._id === message._id || (
          m.content === message.content && 
          getMsgSenderId(m) === currentSenderId &&
          Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 10000 // 10 second window
        )
      );

      if (isDuplicate) return state;

      return {
        messages: {
          ...state.messages,
          [contactId]: [...chatMessages, message]
        }
      };
    }),

  setMessages: (contactId, messages) => 
    set((state) => ({
      messages: {
        ...state.messages,
        [contactId]: messages
      }
    })),

  clearChat: (contactId) => 
    set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[contactId];
      return { messages: newMessages };
    }),
}));
