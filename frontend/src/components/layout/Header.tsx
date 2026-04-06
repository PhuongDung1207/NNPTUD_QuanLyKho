'use client';

import { Bell, Search, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-white px-6">
      <div className="flex flex-1 items-center space-x-4">
        <div className="relative w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full border-0 bg-gray-100 py-2 pl-10 pr-4 text-sm text-gray-900 ring-0 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-600 sm:leading-6"
            placeholder="Search warehouse..."
          />
        </div>
      </div>

      <div className="ml-4 flex items-center space-x-6">
        <button className="relative text-gray-500 hover:text-blue-600">
          <Bell className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <div className="flex items-center space-x-2 text-gray-700">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
