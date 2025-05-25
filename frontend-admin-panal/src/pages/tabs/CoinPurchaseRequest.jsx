/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { useEffect, useState, Fragment } from 'react';
import {
  User,
  Coins,
  CreditCard,
  TrendingUp,
  Landmark,
  Award,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import UserDetailsPopup from '@/components/custom/viewUserDetails';
import { toast } from 'sonner';

const CoinPurchaseRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({ totalPages: 1, page: 1, limit: 10 });
  const [coinRequests, setCoinRequests] = useState([]);

  useEffect(() => {
    (async function () {
      try {
        setIsLoading(true);
        let params = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit
        });
        let res = await fetch(Api + "/coins/request?" + params.toString(), { credentials: "include" });
        if (res.ok) {
          let data = await res.json();
          console.log({ data });

          setPagination((state) => ({
            ...state,
            page: data.data.pagination.page,
            totalPages: data.data.pagination.totalPages
          }));
          setCoinRequests(data.data.requests || []);
        } else {
          setCoinRequests([]);
        }
      } catch (error) {
        setCoinRequests([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [pagination.page]);

  const handleApprove = async (id) => {
    try {
      setIsLoading(true);
      let res = await fetch(`${Api}/coins/request/${id}/accept`, {
        method: "PUT",
        credentials: "include"
      });
      if (res.ok) {
        setCoinRequests(requests => requests.filter(r => r._id !== id));
        toast('Coin Purchase Request Approved')
      }
    } catch (error) {
      console.error(error);
      toast('Failed to approve coin purchase')
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      let rejectionReason = prompt('Please enter the reason for rejecting the coin purchase request');

      if (rejectionReason) {
        setIsLoading(true);
        let res = await fetch(`${Api}/coins/request/${id}/reject?` + new URLSearchParams({ reason: rejectionReason }).toString(), {
          method: "PUT",
          credentials: "include",
          headers: {
            'content-type': 'application/json'
          }
        });
        if (res.ok) {
          setCoinRequests((requests) => requests.filter(r => r._id !== id));
          toast('Coin Purchase Request Rejected')
        }
      } else {
        toast('Failed To Reject Coin Purchase - No reason provided')
      }
    } catch (error) {
      console.error(error);
      toast('Failed To Reject Coin Purchase')
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-full w-full p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-800">Coin Purchase Requests</h1>
        <p className="text-gray-600">Review and manage coin purchase requests from users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            Users are waiting for coin purchase approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="mx-auto h-8 w-8 animate-spin mb-2" />
              <p>Loading...</p>
            </div>
          ) : coinRequests && coinRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coins Amount</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coinRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <div className="flex flex-row gap-x-1 items-center">
                          <Coins className="h-4 w-4" />
                          {request.coinsAmount} Coins
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex-row flex gap-x-1 items-center">
                          <CreditCard className="h-4 w-4" />
                          {request.paymentInfo.transactionId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex-row flex gap-x-1 items-center">
                          <Landmark className="h-4 w-4" />
                          {request.paymentInfo.paymentMethod}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <UserDetailsPopup 
                            userData={{
                              name: request.requesterID.name,
                              email: request.requesterID.email,
                              phone: request.requesterID.phoneInfo.number,
                              profileImage: request.requesterID.profileImage
                            }}
                          />
                          <Button
                            variant={'outline'}
                            className={'mx-3 text-red-600 border-red-600 hover:bg-red-50'}
                            onClick={() => handleReject(request._id)}
                          >
                            Reject
                          </Button>
                          <Button
                            variant={'outline'}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApprove(request._id)}
                          >
                            Approve
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
              <p>No coin purchase requests found</p>
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

export default CoinPurchaseRequest;