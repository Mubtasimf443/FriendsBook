/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Edit, Trash, UserX, Mail, Calendar, MapPin, Users, UserCog2, UserRoundCheckIcon, UserRoundPlus } from 'lucide-react';
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


export const UserGrid = ({ children }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm w-full p-3 sm:p-4">
            <div className="grid grid-cols-1  gap-4">
                {children}
            </div>
        </div>
    );
};

export const EmtyUsers = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-white rounded-xl shadow-sm border border-dashed border-gray-200 p-8">
      {/* Icon */}
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-blue-50 animate-pulse"></div>
        <div className="relative p-4 bg-blue-100 rounded-full">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Text Content */}
      <h3 className="mt-4 text-xl font-semibold text-gray-900">
        No Users Found
      </h3>
      <p className="mt-2 text-center text-gray-500 max-w-sm">
        There are no users to display at the moment. You can refresh the list or add a new user manually.
      </p>
    </div>
  )
}

export const UserInfoCard = ({ icon: Icon, title, value, className = "" }) => (
  <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 ${className}`}>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-green-50 rounded-full">
        <Icon className="w-5 h-5 text-green-800" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="font-medium">{value || 'Not specified'}</p>
      </div>
    </div>
  </div>
);


export const UserCard = ({ user , deleteUser , suspend , unsuspend }) => {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
            {/* User Header Section */}
            <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4 sm:gap-0">
                <div className="flex items-start space-x-4 w-full sm:w-auto">
                    {/* Avatar with online/offline indicator */}
                    <div className="relative flex-shrink-0">
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-offset-2 ring-gray-100"
                        />
                        <span
                            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white
                                ${user.status === 'active' ? 'bg-green-400' : 'bg-gray-300'}`}
                        />
                    </div>

                    {/* User Info */}
                    <div className="space-y-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-lg truncate">{user.name}</h3>
                        <div className="flex items-center text-gray-500 text-sm">
                            <Mail className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {user.isPremium && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Premium
                                </span>
                            )}
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${user.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : user.status === 'suspended'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                {user.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="text-left sm:text-right text-sm w-full sm:w-auto">
                    <div className="text-gray-500">Joined</div>
                    <div className="font-medium">{user.joinedDate || 'Recently'}</div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-100 gap-4 sm:gap-0">
                <div className="flex items-center space-x-2 text-sm text-gray-500" >
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{user.location || 'Not specified'}</span>
                </div>
                <div className="flex space-x-1">
                    <UserUpdateBtn user={user}/>

                    {
                        user.status !== 'suspended' ? 
                        (
                            <button
                            onClick={suspend}
                            className="p-2 hover:bg-yellow-50 rounded-lg group transition-colors duration-200"
                            title="Suspend User"
                            >
                                <UserX className="w-4 h-4 text-gray-400 group-hover:text-yellow-500" />
                            </button>
                        ) 
                        :
                        (
                            <button
                            onClick={unsuspend}
                            className="p-2 hover:bg-yellow-50 rounded-lg group transition-colors duration-200"
                            title="UnSuspend User"
                        >
                            <UserRoundPlus className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
                            </button>
                        )
                    }
                    <button
                        onClick={deleteUser}
                        className="p-2 hover:bg-red-50 rounded-lg group transition-colors duration-200"
                        title="Delete User"
                    >
                        <Trash className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};


export const UserUpdateBtn= ({user , }) => {
    let [name , sName ] = useState(user.name);
    let [email , sEmail ] = useState(user.email);
    let [phone , sPhone] = useState(user.phone);
    let _id = user.id;
    let closeRef = useRef();
    let [isUpdated ,setIsUpdated] = useState(false);
    useUpdateEffect(() => setIsUpdated(true),[ name , email , phone])
    
    function close() {
        if (closeRef.current) {
            closeRef.current.click()
        }
    }
    async function updateUser() {
        try {
           if (isUpdated) {
            let response = await fetch(Api +`/users/${_id}` , {
              headers : {
                  'content-type' : 'application/json'
              } ,
              body : JSON.stringify({
                  name , email , phone 
              }),
              credentials : 'include',
              method : 'put'
          });

          switch (response.status) {
              case 200:
                  toast()
                  break;
              default:
                  toast('Failed to Update')
                  break;
          }
           }
            
        } catch (error) {
            console.error(error);
            
            toast('Failed to Update')
        }
    }
    


    return (
        <>
        <Sheet >
          <SheetTrigger asChild>
          <button
                        className="p-2 hover:bg-blue-50 rounded-lg group transition-colors duration-200"
                        title="Edit User"
                    >
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
            </button>
          </SheetTrigger>
          <SheetContent >
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you're done.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" value={name} onChange={setInpState(sName)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                 Email
                </Label>
                <Input id="email" value={email} onChange={setInpState(sEmail)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                 Phone
                </Label>
                <Input id="phone" value={phone} onChange={setInpState(sPhone)} className="col-span-3" />
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="submit" onClick={updateUser}>Save changes</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        </>
    );
}