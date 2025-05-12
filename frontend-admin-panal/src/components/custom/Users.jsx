/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Edit, Trash, UserX } from 'lucide-react';
import React, { Fragment } from 'react';


export const UserCard = ({ user }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {user.isPremium && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              Premium
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'active' ? 'bg-green-100 text-green-800' :
              user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
            }`}>
            {user.status}
          </span>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Edit className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <UserX className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Trash className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
};


export const UserGrid = ({ children }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  )
};

