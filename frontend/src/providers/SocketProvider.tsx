'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { Message } from '@/types/chat';

export default function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  const { setOnlineUserIds, addMessage } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    // Get token from store
    const accessToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    if (!accessToken) {
      return;
    }

    const socket = connectSocket(accessToken);

    if (socket) {
      socket.off('update_online_users');
      socket.off('receive_message');
      socket.off('message_sent');

      socket.on('update_online_users', (userIds: string[]) => {
        setOnlineUserIds(userIds);
      });

      socket.on('receive_message', (message: Message) => {
        const senderId = typeof message.sender === 'object' ? (message.sender._id || (message.sender as any).id) : message.sender;
        if (senderId) {
          addMessage(senderId, message);
        }
      });

      socket.on('message_sent', (message: Message) => {
        const receiverId = typeof message.receiver === 'object' ? (message.receiver._id || (message.receiver as any).id) : message.receiver;
        if (receiverId) {
          addMessage(receiverId, message);
        }
      });
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token, setOnlineUserIds, addMessage]);

  return <>{children}</>;
}
