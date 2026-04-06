'use client';

import { useState } from 'react';
import { MessageCircle, X, Users } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import OnlineUsersList from '@/components/chat/OnlineUsersList';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatWidget() {
  const { isOpen, setIsOpen, activeChatId } = useChatStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Container */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              {activeChatId ? (
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => useChatStore.getState().setActiveChatId(null)}
                    className="hover:bg-blue-700 p-1 rounded-full transition-colors"
                   >
                    ←
                   </button>
                   <span className="font-medium text-sm">Conversation</span>
                </div>
              ) : (
                <>
                  <Users size={18} />
                  <span className="font-medium text-sm">Trực tuyến</span>
                </>
              )}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content Area */}
          <div className="h-[450px] flex flex-col bg-gray-50">
            {activeChatId ? (
              <ChatWindow />
            ) : (
              <OnlineUsersList />
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-gray-800 rotate-90' : 'bg-blue-600'
        } text-white`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
