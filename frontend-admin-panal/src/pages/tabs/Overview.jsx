/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  Users,
  UserCheck,
  Star,
  Shield,
  UserX,
  UserCog,
  Video,
  Film,
  PlayCircle
} from 'lucide-react';
import DashboardLoader from '@/components/custom/loader';
import { Api } from '@/lib/env';

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, }) => {
  return (
    <div className={`p-6 rounded-lg shadow-md  `}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-green-400 mb-1">{title}</p>
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

  const [data ,setData] = useState({});
  const [loading ,setLoading] = useState(true );
  

  
  useLayoutEffect(() => {
    // Fetch video profile statistics
    const fetchVideoProfileStats = async () => {
      try {
        const response =await fetch(Api +'/overview-statistics', {credentials :'include'});
        if (response.ok) {


          
          setData(((await response.json()).data ));
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch video profile stats:', error);
      }
      ;
    };
    
    fetchVideoProfileStats();
  }, []);




  if (loading) {
    return (
      <>
        <DashboardLoader />
      </>
      );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your app's key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Users" 
          value={data.totalUsers}
          icon={Users} 
        />
      
      
        
        <StatsCard 
          title="Active Users" 
          value={data.onlineActiveUsers}
          icon={UserCheck} 
        />
        
        <StatsCard 
          title="Premium Members" 
          value={data.usersJoinedThisMonth}
          icon={Star} 
        />
        
        <StatsCard 
          title="New Users (This Month)" 
          value={data.premiumUsers}
          icon={UserCog} 
        />
        
        <StatsCard 
          title="Suspended Users" 
          value={data.premiumUsers} 
          icon={UserX} 
        />
        
        <StatsCard 
          title="Regular Users" 
          value={data.suspendedUsers}
          icon={Shield} 
        />
      </div>

      <div className="mt-8 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Video Profile Statistics</h2>
        <p className="text-gray-600">Monitor video profile metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          title="Video Users" 
          value={data.videoProfileUsers}
          icon={Shield} 
        />
      </div>

   
    </div>
  );
};

export default Overview;