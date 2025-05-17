/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { UserInfoCard } from '@/components/custom/Users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Api } from '@/lib/env';
import { Search, Mail, Phone, Cake, User, Heart, Briefcase, MapPin, Globe, Book, Music, Coffee, DollarSign, Circle, Clock, Languages, Monitor } from 'lucide-react';
import React, { useEffect, useState } from 'react';


const UserProfileSection = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

const SearchUser = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [videoUser, setVUser] = useState(null);
  const [mUser, setMUser] = useState(null);




  const [userType , setUserType ] = useState('matrimony');

  const handleSearch = async () => {
    setIsLoading(true);
    setVUser(null);
    setMUser(null);

    try {
      let params = new URLSearchParams({ searchTerm, userType })
      let res = await fetch(Api + "/users/search?" + params.toString() , { credentials : 'include'});
      if (res.ok) {
        let user =(await res.json()).data.user;
        if (userType === 'video') {
          setVUser(user)
        } 
        if (userType !== 'video') {
          setMUser(user)
        }
        console.log(user);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false)
    }
  };


  useEffect(() => console.log(videoUser) , [videoUser]);
  useEffect(() => console.log(mUser) , [mUser]);



  return (
    <div className='flex flex-col gap-6 min-h-full w-full p-4 sm:p-6'>
      {/* Search Section */}
      <div className="w-full flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-72">
          <Input
            type="text"
            placeholder="Search user by email,phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        
        </div>

        <Button 
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
        <select
        disabled={isLoading}
          className="h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 shadow"
          style={{ width: '160px' }}
          onChange={(e) => setUserType(e.target.value)}
        >
       
          <option value="matrimony">Matrimony</option>
          <option value="video">Video Call</option>
        </select>
      </div>

      {/* User Profile Display */}

     
         {
        videoUser && (
          <div className="space-y-6">
            {/* Video User Profile Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                <div className="absolute -bottom-16 left-6 p-1 bg-blue-50 rounded-full">
                  <img
                    src={`https://ui-avatars.com/api/?name=${videoUser.name}`}
                    alt={videoUser.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                </div>
              </div>
              
              <div className="pt-20 px-6 pb-6">
                <h2 className="text-2xl font-bold text-gray-800">{videoUser.name}</h2>
                <p className="text-gray-500">Video Call User</p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Circle className="w-2 h-2 mr-1 fill-current" /> {videoUser.status}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <UserProfileSection title="Basic Information">
              <UserInfoCard icon={Mail} title="Email" value={videoUser.email} />
              <UserInfoCard icon={Phone} title="Phone" value={videoUser.phone} />
              <UserInfoCard icon={User} title="Gender" value={videoUser.gender} />
              <UserInfoCard icon={Cake} title="Age" value={`${videoUser.age} years`} />
              <UserInfoCard icon={Clock} title="Last Active" value={new Date(videoUser.lastActive).toLocaleString()} />
              <UserInfoCard icon={MapPin} title="Location" value={videoUser.location?.country} />
            </UserProfileSection>

            {/* Additional Information */}
            <UserProfileSection title="Account Information">
              <UserInfoCard icon={Clock} title="Member Since" value={new Date(videoUser.createdAt).toLocaleDateString()} />
              <UserInfoCard icon={Languages} title="Languages" value={videoUser.languages?.join(", ")} />
              <UserInfoCard icon={Monitor} title="Session Status" value={videoUser.socketId ? "Connected" : "Disconnected"} />
            </UserProfileSection>
          </div>
        )
      }
      
      {
        mUser && (
          <div className="space-y-6">
            {/* Matrimony User Profile Header */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-48 bg-gradient-to-r from-green-500 to-green-700">
                {mUser.coverImage && (
                  <img
                    src={mUser.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute -bottom-16 left-6 p-1 bg-green-50 rounded-full">
                  <img
                    src={mUser.profileImage?.url || `https://ui-avatars.com/api/?name=${mUser.name}`}
                    alt={mUser.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                </div>
              </div>
              
              <div className="pt-20 px-6 pb-6">
                <h2 className="text-2xl font-bold text-gray-800">{mUser.name}</h2>
                <p className="text-gray-500">Matrimony ID: {mUser.mid}</p>
              </div>
            </div>

            {/* Basic Information */}
            <UserProfileSection title="Basic Information">
              <UserInfoCard icon={Mail} title="Email" value={mUser.email} />
              <UserInfoCard icon={Phone} title="Phone" value={mUser.phoneInfo?.number} />
              <UserInfoCard icon={User} title="Gender" value={mUser.gender} />
              <UserInfoCard icon={Cake} title="Age" value={`${mUser.age} years`} />
              <UserInfoCard icon={Heart} title="Marital Status" value={mUser.maritalStatus?.replace('_', ' ')} />
              <UserInfoCard icon={User} title="Profile Created By" value={mUser.profileCreatedBy} />
            </UserProfileSection>

            {/* Professional Information */}
            <UserProfileSection title="Professional Information">
              <UserInfoCard icon={Book} title="Education" value={mUser.education ? mUser.education[0]?.degree || "Not specified" : "Not specified"} />
              <UserInfoCard icon={Briefcase} title="Occupation" value={mUser.occupation || "Not specified"} />
              <UserInfoCard icon={DollarSign} title="Annual Income" value={mUser.annualIncome?.currency || "Not specified"} />
            </UserProfileSection>

            {/* Location & Background */}
            <UserProfileSection title="Location & Background">
              <UserInfoCard icon={MapPin} title="Address" value={mUser.address?.country || "Not specified"} />
              <UserInfoCard icon={Globe} title="Religion" value={mUser.religion} />
              <UserInfoCard icon={Globe} title="Languages" value={mUser.languages?.join(", ")} />
            </UserProfileSection>

            {/* Physical Attributes */}
            <UserProfileSection title="Physical Attributes">
              <UserInfoCard icon={User} title="Height" value={mUser.height} />
              <UserInfoCard icon={User} title="Weight" value={`${mUser.weight} kg`} />
            </UserProfileSection>
          </div>
        )
      }
    
    </div>
  );
};

export default SearchUser;