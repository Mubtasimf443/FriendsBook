/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, User } from 'lucide-react';

const UserDetailsPopup = (
    { userData } =
        {
            userData: {
                name: "John Doe",
                email: "john.doe@example.com",
                phone: "02647322345",
                profileImage: "/api/placeholder/150/150"
            }
        }
) => {


  const [isOpen, setIsOpen] = useState(false);

  return (

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">User</Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">User Details</DialogTitle>
          </DialogHeader>
          
          <Card>
            <CardContent className="pt-6">
              {/* Profile Image and Name */}
              <div className="flex flex-col items-center space-y-4 mb-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage 
                    src={userData.profileImage || 'https://placehold.co/400'} 
                    alt={userData.name}
                  />
                  <AvatarFallback className="text-2xl">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="text-xl font-semibold text-center">
                  {userData.name}
                </h3>
              </div>

              {/* User Information */}
              <div className="space-y-4">
                {/* Name */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-sm text-gray-900">{userData.name}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{userData.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">+88&nbsp;{userData.phone}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
               
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
  );
};

export default UserDetailsPopup;