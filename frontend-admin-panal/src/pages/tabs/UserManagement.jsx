/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { useState } from 'react';
import { 
  Search,
  Filter,
  MoreVertical,
  Shield,
  UserX,
  Edit,
  Trash,
} from 'lucide-react';
import { Outlet } from 'react-router';


const UserManagement = () => {
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-600">Manage and monitor user accounts</p>
      </div>

      <Outlet />

   
    </div>
  );
};

export default UserManagement;