/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Edit, Phone, PhoneCall, Mail, MapPin, Users, UserRoundPlus } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Api } from '@/lib/env';
import { setInpState } from '@/lib/setInpState';
import { useUpdateEffect } from '../hooks/useUpdateEffect';

// Empty state component for when no video call users are found
export const EmptyVideoCallUsers = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-white rounded-xl shadow-sm border border-dashed border-gray-200 p-8">
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-blue-50 animate-pulse"></div>
        <div className="relative p-4 bg-blue-100 rounded-full">
          <PhoneCall className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-gray-900">
        No Video Call Users Found
      </h3>
      <p className="mt-2 text-center text-gray-500 max-w-sm">
        There are no users available for video calls at the moment.
      </p>
    </div>
  );
};

// Main video call user card component
export const VideoCallUserCard = ({ user }) => {

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
      {/* User Header Section */}
      <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4 sm:gap-0">
        <div className="flex items-start space-x-4 w-full sm:w-auto">
          {/* Avatar with online indicator */}
          <div className="relative flex-shrink-0">
            <img
              src={user.profileImage.url}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-offset-2 ring-gray-100"
            />
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white
                                ${user.status === 'online' ? 'bg-green-400' : 'bg-gray-300'}`}
            />
          </div>

          {/* User Info */}
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-lg truncate">{user.name}</h3>
            <div className="flex items-center text-gray-500 text-sm">
              <Mail className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{user.location?.country || 'Not specified'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center pt-4 border-t border-gray-100 gap-2">
        <VideoCallUserUpdateBtn user={user} />

      </div>
    </div>
  );
};

// Update form component
export const VideoCallUserUpdateBtn = ({ user }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);

  const closeRef = useRef();
  const [isUpdated, setIsUpdated] = useState(false);

  useUpdateEffect(() => setIsUpdated(true), [name, email, phone]);

  function close() {
    if (closeRef.current) {
      closeRef.current.click();
    }
  }

  async function updateUser() {
    try {
      if (isUpdated) {
        const response = await fetch(`${Api}/video-user/${user._id}`, {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone
          }),
          credentials: 'include',
          method: 'PUT'
        });

        switch (response.status) {
          case 200:
            toast.success('User updated successfully');
            close();
            break;
          default:
            toast.error('Failed to update user');
            break;
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update user');
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="p-2 hover:bg-blue-50 rounded-lg group transition-colors duration-200"
          title="Edit User"
        >
          <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Video Call User</SheetTitle>
          <SheetDescription>
            Update the video call user's information here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={setInpState(setName)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              value={email}
              onChange={setInpState(setEmail)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Phone
            </Label>
            <Input
              id="location"
              value={phone}
              onChange={setInpState(setPhone)}
              className="col-span-3"
            />
          </div>

        </div>
        <SheetFooter>
          <SheetClose ref={closeRef} />
          <Button type="submit" onClick={updateUser}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// Grid container for video call users
export const VideoCallUserGrid = ({ children }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm w-full p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-4">
        {children}
      </div>
    </div>
  );
};