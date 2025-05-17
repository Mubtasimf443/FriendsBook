/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { useEffect, useState } from 'react';
import { 
  User,
  Mail,
  CreditCard,
  Hash,
  Calendar,
  Award,
  Check,
  X,

  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 

  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Pagination from '@/components/custom/Pagination';
import { Api } from '@/lib/env';

const MembershipRequest = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({ totalPages: 1, page: 1, limit: 10 });
  const [membershipRequests, setMembershipRequests] = useState([]);

  useEffect(() => {
    (async function () {
      try {
        setIsLoading(true);
        let params = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit
        });
        let res = await fetch(Api + "/membership/request?" + params.toString(), { credentials: "include"  });
        if (res.ok) {
          let data = await res.json();
          setPagination((state) => ({
            ...state,
            page: data.data.pagination.page,
            totalPages: data.data.pagination.totalPages
          }));
          setMembershipRequests(data.data.requests || []);
        } else {
          setMembershipRequests([]);
        }
      } catch (error) {
        setMembershipRequests([]);
      } finally {
        setIsLoading(false);
      }
    })();
   
  }, [pagination.page]);

  const handleApprove = async (id) => {
    try {
      setIsLoading(true);
      let res = await fetch(`${Api}/membership/request/${id}/accapt`, {
        method: "PUT",
        credentials: "include"
      });
      if (res.ok) {
        setMembershipRequests(requests => requests.filter(r => r._id !== id));
      }
    } catch (error) {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setIsLoading(true);
      let res = await fetch(`${Api}/membership/request/${id}/reject`, {
        method: "PUT",
        credentials: "include"
      });
      if (res.ok) {
        setMembershipRequests(requests => requests.filter(r => r._id !== id));
      }
    } catch (error) {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-full w-full p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-800">Membership Requests</h1>
        <p className="text-gray-600">Review and manage membership upgrade requests</p>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            Users waiting for membership approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="mx-auto h-8 w-8 animate-spin mb-2" />
              <p>Loading...</p>
            </div>
          ) : membershipRequests && membershipRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Payment Details</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membershipRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {request.userName || request.user?.name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.userEmail || request.user?.email || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {request.paymentMethod || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {request.transactionId || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {request.membershipType || request.plan || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {request.membershipDuration || request.duration || "N/A"} months
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApprove(request._id)}
                            disabled={isLoading}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleReject(request._id)}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="mx-auto h-12 w-12 opacity-30 mb-2" />
              <p>No membership requests found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setPagination(state => ({ ...state, page }))}
      />
    </div>
  );
};

export default MembershipRequest;
