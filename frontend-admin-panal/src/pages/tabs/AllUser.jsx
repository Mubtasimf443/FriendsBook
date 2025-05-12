/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import Pagination from '@/components/custom/Pagination';
import { EmtyUsers, UserCard, UserGrid } from '@/components/custom/Users';
import { Plus, RefreshCcw, Users } from 'lucide-react';
import React, { Fragment, useState } from 'react';

const AllUser = ({ }) => {
    const [filterStatus, setFilterStatus] = useState('all');
    const users = [
        {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            avatar: "https://ui-avatars.com/api/?name=John+Doe",
            status: "active",
            isPremium: true,
        },
        //   {
        //     id: 1,
        //     name: "John Doe",
        //     email: "john@example.com",
        //     avatar: "https://ui-avatars.com/api/?name=John+Doe",
        //     status: "active",
        //     isPremium: true,
        // },
        //   {
        //     id: 1,
        //     name: "John Doe",
        //     email: "john@example.com",
        //     avatar: "https://ui-avatars.com/api/?name=John+Doe",
        //     status: "active",
        //     isPremium: true,
        // },
        //   {
        //     id: 1,
        //     name: "John Doe",
        //     email: "john@example.com",
        //     avatar: "https://ui-avatars.com/api/?name=John+Doe",
        //     status: "active",
        //     isPremium: true,
        // },
    ];

    return (
        <div className='flex flex-col justify-center items-start'>
            <div className="w-full flex flex-row justify-end items-center gap-4 mb-6">

                <div className="flex items-center space-x-4">
                    <select
                        className="border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Users</option>
                        <option value="premium">Premium Users</option>
                        <option value="active">Active Users</option>
                        <option value="suspended">Suspended Users</option>
                        <option value="new">New Users</option>
                    </select>
                </div>
            </div>

            {/* User Grid */}
            <UserGrid>
                {users.length !== 0 && users.map((user, index) => (
                    <UserCard key={index} user={user} />
                ))}

                {users.length === 0 && <EmtyUsers />}
            </UserGrid>

            <div className="w-full flex flex-row justify-center items-center gap-4 my-6">
                <Pagination marginTop='' />
            </div>

        </div>
    )
};

export default AllUser;