/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { UserInfoCard } from '@/components/custom/Users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Mail, Phone, Cake, User, Heart, Briefcase, MapPin, Globe, Book, Music, Coffee, DollarSign } from 'lucide-react';
import React, { useState } from 'react';



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
  const [searchedUser, setSearchedUser] = useState(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      // API call simulation
      // const response = await searchUserById(searchTerm);
      // setSearchedUser(response.data);
      
      // Remove this when implementing actual API
      setTimeout(() => {
        setSearchedUser({
          name: "John Doe",
          mid: "M123456",
          // ... other user details
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Search failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-6 min-h-full w-full p-4 sm:p-6'>
      {/* Search Section */}
      <div className="w-full flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-72">
          <Input
            type="text"
            placeholder="Search user by ID..."
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
      </div>

      {/* User Profile Display */}
      {searchedUser && (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="relative h-48 bg-gradient-to-r from-green-500 to-green-700">
              {searchedUser.coverImage && (
                <img
                  src={searchedUser.coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute -bottom-16 left-6 p-1 bg-green-50 rounded-full">
                <img
                  src={searchedUser.profileImage || `https://ui-avatars.com/api/?name=${searchedUser.name}`}
                  alt={searchedUser.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              </div>
            </div>
            
            <div className="pt-20 px-6 pb-6">
              <h2 className="text-2xl font-bold text-gray-800">{searchedUser.name}</h2>
              <p className="text-gray-500">Matrimony ID: {searchedUser.mid}</p>
            </div>
          </div>

          {/* Basic Information */}
          <UserProfileSection title="Basic Information">
            <UserInfoCard icon={Mail} title="Email" value={searchedUser.email} />
            <UserInfoCard icon={Phone} title="Phone" value={searchedUser.phoneInfo} />
            <UserInfoCard icon={User} title="Gender" value={searchedUser.gender} />
            <UserInfoCard icon={Cake} title="Age" value={`${searchedUser.age} years`} />
            <UserInfoCard icon={Heart} title="Marital Status" value={searchedUser.maritalStatus} />
            <UserInfoCard icon={User} title="Profile Created By" value={searchedUser.profileCreatedBy} />
          </UserProfileSection>

          {/* Professional Information */}
          <UserProfileSection title="Professional Information">
            <UserInfoCard icon={Book} title="Education" value={searchedUser.education} />
            <UserInfoCard icon={Briefcase} title="Occupation" value={searchedUser.occupation} />
            <UserInfoCard icon={DollarSign} title="Annual Income" value={searchedUser.annualIncome} />
          </UserProfileSection>

          {/* Location & Background */}
          <UserProfileSection title="Location & Background">
            <UserInfoCard icon={MapPin} title="Address" value={searchedUser.address} />
            <UserInfoCard icon={Globe} title="Religion" value={searchedUser.religion} />
            <UserInfoCard icon={Globe} title="Languages" value={searchedUser.languages?.join(", ")} />
          </UserProfileSection>

          {/* Interests & Preferences */}
          <UserProfileSection title="Interests & Preferences">
            <UserInfoCard 
              icon={Coffee} 
              title="Hobbies" 
              value={searchedUser.aboutMe?.interestedHobbies?.join(", ")} 
            />
            <UserInfoCard 
              icon={Music} 
              title="Music Preferences" 
              value={searchedUser.aboutMe?.interestedMusicTypes?.join(", ")} 
            />
          </UserProfileSection>
        </div>
      )}
    </div>
  );
};

export default SearchUser;