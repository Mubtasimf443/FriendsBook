/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import React, { useEffect, useState } from 'react';
import { Edit, Save, X, Upload, Trash2, Plus } from 'lucide-react';
import DashboardLoader from '@/components/custom/loader';
import {  server_origin } from '@/lib/env';
import { toast } from 'sonner';
import UploadGift from '@/components/section/UploadGift';
import { useGiftContext } from '@/context/gifts.context';

import GiftList from '@/components/section/GiftList';

export const GiftsManagement = () => {

  let {
    isAddMode,
    isEditMode,
    loading,
    fetchGifts ,
    setGifts,
    setLoading
  } = useGiftContext();
  // Load all gifts
  useEffect(() => {
    fetchGifts();
  }, []);

 






  return (
    <div className="container mx-auto p-4">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gifts Management</h1>

        <UploadGift />

      </div>

      {loading && <DashboardLoader />}




      {/* Gift List */}
      {!loading && !isAddMode  && (
        <GiftList />
      )}
    </div>
  );
};