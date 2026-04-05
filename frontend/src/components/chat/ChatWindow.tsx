'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getSocket } from '@/lib/socket';
import { getChatHistory } from '@/api/messages';
import { Send } from 'lucide-react';
import { Message } from '@/types/chat';

export default function ChatWindow() {
  const { activeChatId, messages, setMessages, addMessage } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeChatId) {
      setIsLoading(true);
      getChatHistory(activeChatId)
        .then((res) => {
          // The history response usually has data as the array
          const historyData = Array.isArray(res.data) ? res.data : (res.data?.docs || []);
          setMessages(activeChatId, [...historyData].reverse()); // Reverse to show latest at bottom
        })
        .catch((err) => {
          console.error('Failed to fetch history:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [activeChatId, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChatId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId || !currentUser) return;

    const content = inputText.trim();
    const socket = getSocket();
    
    if (socket) {
      // 1. Optimistic Update: Add message to UI immediately
      const tempId = 'temp-' + Date.now();
      const optimisticMsg = {
        _id: tempId,
        sender: currentUser._id || currentUser.id,
        receiver: activeChatId,
        content: content,
        createdAt: new Date().toISOString(),
        isRead: false,
        isTemp: true // Flag to identify temporary messages if needed
      };
      
      addMessage(activeChatId, optimisticMsg);
      
      // 2. Clear input
      setInputText('');

      // 3. Emit to server
      socket.emit('send_message', {
        receiverId: activeChatId,
        content: content,
      });
    }
  };

  const currentChatMessages = activeChatId ? (messages[activeChatId] || []) : [];

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-400">Loading conversation...</div>;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages list */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {currentChatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
               <Send size={20} className="text-gray-300" />
            </div>
            <span>Start a conversation</span>
          </div>
        ) : (
          currentChatMessages.map((msg: Message) => {
            // Robust check for current user identity (handles both object and string ID)
            const senderId = typeof msg.sender === 'object' ? (msg.sender?._id || msg.sender?.id) : msg.sender;
            const currentUserId = currentUser?._id || currentUser?.id;
            const isMe = senderId === currentUserId;

            return (
              <div 
                key={msg._id} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm transition-all ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  } ${msg.isTemp ? 'opacity-70' : 'opacity-100'}`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <span className={`text-[10px] block mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <form 
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t flex items-center gap-2"
      >
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..." 
          className="flex-1 px-4 py-2 text-sm rounded-full bg-gray-100 border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button 
          type="submit"
          className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-400"
          disabled={!inputText.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
