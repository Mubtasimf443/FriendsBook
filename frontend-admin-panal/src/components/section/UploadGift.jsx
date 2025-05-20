/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { Fragment } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Plus, Upload } from 'lucide-react';
import { useGiftContext } from '@/context/gifts.context';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const UploadGift = ({ }) => {
  let {
    cancelAction,
    setIsAddMode,
    setGiftName,
    setGiftCoins,
    handleAddGift,
    giftName,
    giftCoins,
    previewUrl,
    handleFileChange,
    isUploading,
    isAddMode,
    uploadProgress
  } = useGiftContext()


  return (
    <Fragment>
      <Sheet open={isAddMode}>
        <SheetTrigger
          onClick={() => setIsAddMode(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer"
        >

          <Plus size={16} />
          Add New Gift

        </SheetTrigger>
        <SheetContent side='bottom'  className={'pb-8 px-6'}>
        <SheetTitle />
          <form onSubmit={handleAddGift}>
            <div className="flex flex-col gap-y-6">

              <div >

                <Label className="block text-gray-700 mb-2">Gift Name</Label>
                <input
                  type="text"
                  value={giftName}
                  onChange={(e) => setGiftName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Enter gift name"
                  minLength={1}
                  maxLength={50}
                  required
                />
              </div>


              <div className="">
                <Label className="block text-gray-700 mb-2">Coins Required</Label>
                <Input
                  type="number"
                  value={giftCoins}
                  onChange={(e) => setGiftCoins(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Enter coins required"
                  min="1"
                  max="100000"
                  required
                />
              </div>



              <div className="">
                <Label className="block text-gray-700 mb-2">Gift Image</Label>
                <div className="border rounded-md p-4 flex flex-col items-center">
                  {previewUrl && (
                    <div className="mb-3">
                      <img
                        src={previewUrl}
                        alt="Gift preview"
                        className="h-40 object-contain"
                      />
                    </div>
                  )}
                  <Label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-md text-center w-full">
                    <div className="flex items-center justify-center gap-2">
                      <Upload size={16} />
                      {previewUrl ? 'Change Image' : 'Select Image'}
                    </div>
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </Label>
                  {isUploading && (
                    <div className="w-full mt-2">
                      <div className="bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        >

                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              <SheetFooter>

                <div className="flex justify-end mt-6 gap-3">
                  <Button
                    type="button"
                    onClick={cancelAction}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Add Gift'}
                  </Button>
                </div>
              </SheetFooter>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </Fragment>
  )
};

export default UploadGift;