/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React from 'react';
import { 
  Users,
  UserCheck,
  Star,
  Shield,
  UserX,
  UserCog,
} from 'lucide-react';

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, className }) => {
  return (
    <div className={`p-6 rounded-lg shadow-md ${className} hover:scale-105 transition-transform`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className="p-3 rounded-full bg-white/30">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const Overview = () => {
  // Example data - Replace with actual data from your backend
  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      icon: Users,
      className: "bg-blue-500 text-white"
    },
    {
      title: "Active Users",
      value: "892",
      icon: UserCheck,
      className: "bg-green-500 text-white"
    },
    {
      title: "Premium Members",
      value: "156",
      icon: Star,
      className: "bg-yellow-500 text-white"
    },
    {
      title: "New Users (This Month)",
      value: "45",
      icon: UserCog,
      className: "bg-purple-500 text-white"
    },
    {
      title: "Suspended Users",
      value: "23",
      icon: UserX,
      className: "bg-red-500 text-white"
    },
    {
      title: "Regular Users",
      value: "1,078",
      icon: Shield,
      className: "bg-indigo-500 text-white"
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your app's key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* We can add charts and graphs here later */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Growth Chart</h2>
          {/* Add Chart Component Here */}
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            Chart will be implemented here
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Membership Distribution</h2>
          {/* Add Chart Component Here */}
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            Chart will be implemented here
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;