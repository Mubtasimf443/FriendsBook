/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { Fragment } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '../ui/sheet';
import { useGiftContext } from '@/context/gifts.context';
import { Edit } from 'lucide-react';


const EditGift = ({ gift }) => {
    const {

        isAddMode,

        previewUrl,

        giftName,
        setGiftName,
        giftCoins,
        setGiftCoins,

        uploadProgress,

        isUploading,

        handleEditGift ,
handleUpdateGift ,
Upload ,
cancelAction ,
        handleFileChange
    } = useGiftContext();
    return (
        <Sheet >
            <SheetTrigger
                onClick={() => handleEditGift(gift)}
                className="text-indigo-600 hover:text-indigo-900 p-1 cursor-pointer"
            >
                   <Edit size={16} />
            </SheetTrigger>
            <SheetContent >
                <SheetHeader className="text-xl font-semibold">
                    Edit Gift
                </SheetHeader>
                <div className="bg-white px-6 rounded-lg ">

                    <form onSubmit={ handleUpdateGift}>
                      
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 mb-2">Gift Name</label>
                                    <input
                                        type="text"
                                        value={giftName}
                                        onChange={(e) => setGiftName(e.target.value)}
                                        className="w-full border rounded-md px-3 py-2"
                                        placeholder="Enter gift name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">Coins Required</label>
                                    <input
                                        type="number"
                                        value={giftCoins}
                                        onChange={(e) => setGiftCoins(e.target.value)}
                                        className="w-full border rounded-md px-3 py-2"
                                        placeholder="Enter coins required"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                      

                        <div className="flex justify-end mt-6 gap-3">
                            <button
                                type="button"
                                onClick={cancelAction}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                                disabled={isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    )
};

export default EditGift;