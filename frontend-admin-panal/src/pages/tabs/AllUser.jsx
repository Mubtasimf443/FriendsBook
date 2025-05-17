/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import DashboardLoader from '@/components/custom/loader';
import Pagination from '@/components/custom/Pagination';
import { EmtyUsers, UserCard, UserGrid } from '@/components/custom/Users';
import Awaiter from '@/lib/Awaiter';
import { Api } from '@/lib/env';
import { Plus, RefreshCcw, Users } from 'lucide-react';
import React, { Fragment, useState, useEffect } from 'react';
import { toast } from 'sonner';

const AllUser = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);
    const limit = 10; // Users per page

    // Fetch users based on current filters and pagination
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
                usertype: filterStatus
            });
            
            const response = await fetch(`${Api}/users?${params.toString()}`, {
                credentials: 'include',
                headers : {
                    'cache-control' : "no-cache"
                }
            });
            await Awaiter(100)

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            const data = await response.json();
            
            if (data.success) {
                setUsers(data.data.users);
                setTotalPages(data.data.pagination.totalPages);
                setTotalUsers(data.data.pagination.totalUsers);
                setHasNextPage(data.data.pagination.hasNextPage);
                setHasPrevPage(data.data.pagination.hasPrevPage);
            } else {
                throw new Error('Error fetching users');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Handle filter change
    const handleFilterChange = (e) => {
        setFilterStatus(e.target.value);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    // Fetch users when component mounts or when filter/pagination changes
    useEffect(() => {
        fetchUsers();
    }, [currentPage, filterStatus]);

    // Handle refresh
    const handleRefresh = () => {
        fetchUsers();
    };

    async function deleteUser(_id) {
        let res= await fetch(Api + `/users/${_id}`, {credentials : 'include' , method : "delete"});
        res.status=== 200 && toast('User Deleted SuccessFully');
        handleRefresh();
        return;
    }
    
    async function suspendUser(_id) {
        let res= await fetch(Api + `/users/${_id}/suspend`, {credentials : 'include' , method : "put"});
        res.status=== 200 &&  toast('User Suspended SuccessFully');
        handleRefresh();
        return;
    }
    
    async function unSuspendUser(_id) {
        let res= await fetch(Api + `/users/${_id}/unsuspend`, {credentials : 'include' , method : "put"});
        res.status=== 200 &&  toast('User Un Suspended SuccessFully');
        handleRefresh();
        return;
    }

    return (
        <div className='flex flex-col justify-center items-start'>
            <div className="w-full flex flex-row justify-between items-center gap-4 mb-6">
                {/* User stats */}
                <div className="text-lg font-medium">
                    <span className="text-gray-600">Total:</span> 
                    <span className="ml-1 font-bold">{totalUsers}</span> 
                    <span className="ml-2 text-gray-600">users</span>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Refresh button */}
                    <button
                        onClick={handleRefresh}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Filter dropdown */}
                    <select
                        className="border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        value={filterStatus}
                        onChange={handleFilterChange}
                        disabled={loading}
                    >
                        <option value="all">All Users</option>
                        <option value="premium">Premium Users</option>
                        <option value="active">Active Users</option>
                        <option value="suspended">Suspended Users</option>
                        <option value="new">New Users</option>
                    </select>
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="w-full py-20 flex justify-center items-center">
                    <div className="animate-pulse flex flex-col items-center">
                    
                        <DashboardLoader />
                    </div>
                </div>
            )}

            {/* Error state */}
            {!loading && error && (
                <div className="w-full py-20 flex justify-center items-center">
                    <div className="flex flex-col items-center text-red-500">
                        <p>Failed to load users: {error}</p>
                        <button 
                            onClick={handleRefresh}
                            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* User Grid */}
            {!loading && !error && (
                <UserGrid>
                    {users.length > 0 ? (
                        users.map((user, index) => (
                            <UserCard 
                                key={user._id || index} 
                                user={{
                                    id: user._id,
                                    name: user.name,
                                    email: user.email,
                                    avatar: user.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
                                    status: user.suspension?.isSuspended ? 'suspended' : 
                                            user.onlineStatus?.isOnline ? 'active' : 'offline',
                                    isPremium: user.membership?.currentMembership?.requestId ? true : false,
                                    location :user.address.district.name + " ," + user.address.division.name,
                                    phone : user.phoneInfo.number
                                }} 

                                deleteUser={() => deleteUser(user._id)}
                                suspend={() => suspendUser(user._id)}
                                unsuspend={() => unSuspendUser(user._id)}
                            />
                        ))
                    ) : (
                        <EmtyUsers />
                    )}
                </UserGrid>
            )}

            {/* Pagination controls */}
            {!loading && !error && totalPages > 0 && (
                <div className="w-full flex flex-row justify-center items-center gap-4 my-6">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        hasPrevPage={hasPrevPage}
                        hasNextPage={hasNextPage}
                        marginTop=''
                    />
                </div>
            )}
        </div>
    );
};

export default AllUser;