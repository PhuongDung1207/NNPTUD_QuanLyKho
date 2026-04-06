'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/types/auth';
import { getUsers } from '@/api/users';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function OnlineUsersList() {
  const { onlineUserIds, setActiveChatId } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  // The backend returns { success, message, data: users[] }
  // data here is the result of getUsers() which is the full response object
  const users = useMemo(() => {
    if (!data) return [];
    // If axios returns the response object, we need data.data
    // If the API returns { data: [...] }, we need data.data
    return Array.isArray(data.data) ? data.data : [];
  }, [data]);

  const filteredUsers = useMemo(() => {
    const currentId = currentUser?._id || currentUser?.id;
    return users.filter((u: User) => {
      const isSelf = (u._id || u.id) === currentId;
      if (isSelf) return false;

      const nameMatch = (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const userMatch = (u.username || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return nameMatch || userMatch;
    });
  }, [users, currentUser, searchTerm]);

  if (isLoading) return <div className="p-4 text-center text-sm text-gray-500">Loading users...</div>;
  
  if (error) return <div className="p-4 text-center text-sm text-red-500">Failed to load users</div>;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-3 border-b">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-sm text-gray-400">No other users found</p>
            <p className="text-[10px] text-gray-300 mt-1">Try searching or adding new users from User Management</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filteredUsers.map((u: User) => {
              const userId = u._id || u.id;
              const isOnline = onlineUserIds.includes(userId);
              const displayName = u.fullName || u.username || 'Unknown User';
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <li 
                  key={userId}
                  onClick={() => setActiveChatId(userId)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors flex items-center gap-3"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase overflow-hidden text-sm relative">
                      {u.avatarUrl ? (
                         <Image 
                           src={u.avatarUrl} 
                           alt={displayName} 
                           fill 
                           className="object-cover" 
                         />
                      ) : (
                        initial
                      )}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{displayName}</h4>
                      {isOnline && <span className="text-[10px] text-green-600 font-medium">Online</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
