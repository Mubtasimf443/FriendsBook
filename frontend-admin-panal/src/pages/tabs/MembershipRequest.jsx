/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { useState } from 'react';
import { 
  User,
  Mail,
  CreditCard,
  Hash,
  Calendar,
  Award,
  Check,
  X,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const MembershipRequest = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDuration, setFilterDuration] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Example data - Replace with actual data from your backend
  const membershipRequests = [
    {
      id: 1,
      userName: 'Ahmed Khan',
      userEmail: 'ahmed.khan@example.com',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN123456789',
      membershipType: 'Premium',
      membershipDuration: '3 months',
      status: 'pending'
    },
    {
      id: 2,
      userName: 'Fatima Ali',
      userEmail: 'fatima.ali@example.com',
      paymentMethod: 'PayPal',
      transactionId: 'TXN987654321',
      membershipType: 'Gold',
      membershipDuration: '6 months',
      status: 'pending'
    },
    {
      id: 3,
      userName: 'Muhammad Usman',
      userEmail: 'muhammad.usman@example.com',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN456789123',
      membershipType: 'Diamond',
      membershipDuration: '12 months',
      status: 'pending'
    },
  ];

  // Filter requests based on search term and filters
  const filteredRequests = membershipRequests.filter(request => {
    const matchesSearch = 
      request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || request.membershipType === filterType;
    const matchesDuration = filterDuration === 'all' || request.membershipDuration === filterDuration;
    
    return matchesSearch && matchesType && matchesDuration;
  });

  const handleApprove = (id) => {
    // Implement approval logic
    console.log(`Approved request ${id}`);
  };

  const handleReject = (id) => {
    // Implement rejection logic
    console.log(`Rejected request ${id}`);
  };

  return (
    <div className="flex flex-col gap-6 min-h-full w-full p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-800">Membership Requests</h1>
        <p className="text-gray-600">Review and manage membership upgrade requests</p>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by name, email or transaction ID"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Membership Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDuration} onValueChange={setFilterDuration}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Durations</SelectItem>
                  <SelectItem value="3 months">3 Months</SelectItem>
                  <SelectItem value="6 months">6 Months</SelectItem>
                  <SelectItem value="12 months">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            Users waiting for membership approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length > 0 ? (
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
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {request.userName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.userEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {request.paymentMethod}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {request.transactionId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {request.membershipType}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {request.membershipDuration}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApprove(request.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleReject(request.id)}
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
    </div>
  );
};

export default MembershipRequest;
