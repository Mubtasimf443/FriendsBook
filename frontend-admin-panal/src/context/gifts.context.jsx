/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */


import { Api, server_origin } from '@/lib/env';
import { createContext, useContext, useState } from 'react'
import { toast } from 'sonner';
const GiftContext = createContext();

export const useGiftContext = () => useContext(GiftContext);

export const GiftContextProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [gifts, setGifts] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedGift, setSelectedGift] = useState(null);
    const [isAddMode, setIsAddMode] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // Form inputs
    const [giftName, setGiftName] = useState('');
    const [giftCoins, setGiftCoins] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageId, setImageId] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const fetchGifts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${server_origin}/api/data/gifts`, {
                credentials: 'include',
                headers: { 'cache-control': "no-cache" }
            });
            if (response.status === 200) {
                const data = await response.json();
                setGifts(data.data.gifts);
            } else {
                toast('Failed to fetch gifts');
            }
        } catch (error) {
            console.error('Error fetching gifts:', error);
            toast('Error loading gifts');
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async () => {
        if (!imageFile) {
            toast('Please select an image first');
            return null;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await fetch(`${server_origin}/api/assets/upload/image`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (response.status === 201) {
                const data = await response.json();
                setUploadProgress(100);
                toast('Image uploaded successfully');
                return {
                    id: data.data.asset.id,
                    url: data.data.asset.url
                };
            } else {
                toast('Failed to upload image');
                return null;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast('Error uploading image');
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddGift = async (e) => {
        e.preventDefault();

        if (!giftName.trim()) {
            toast('Gift name is required');
            return;
        }

        if (!giftCoins || isNaN(Number(giftCoins)) || Number(giftCoins) <= 0) {
            toast('Please enter a valid number of coins');
            return;
        }

        let imageData = { id: imageId, url: imageUrl };

        // If new image is selected, upload it first
        if (imageFile) {
            const uploadedImage = await uploadImage();
            if (!uploadedImage) return;
            imageData = uploadedImage;
        }

        try {
            setLoading(true);

            const response = await fetch(`${Api}/gifts`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: giftName,
                    coins: Number(giftCoins),
                    image: {
                        id: imageData.id,
                        url: imageData.url
                    }
                }),
            });

            if (response.status === 201) {
                toast('Gift added successfully');
                resetForm();
                setIsAddMode(false);
                let newGift= (await response.json()).data.gift;
                fetchGifts()
            } else {
                toast('Failed to add gift');
            }
        } catch (error) {
            console.error('Error adding gift:', error);
            toast('Error adding gift');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create a preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const cancelAction = () => {
        resetForm();
        setIsEditMode(false);
        setIsAddMode(false);
    };

  
  const handleEditGift = (gift) => {
    setSelectedGift(gift);
    setGiftName(gift.name);
    setGiftCoins(gift.coins.toString());
    setImageUrl(gift.image.url);
    setImageId(gift.image.id);
    setPreviewUrl(gift.image.url);
    setIsEditMode(true);
    setImageFile(null);
  };

  const handleUpdateGift = async (e) => {
    e.preventDefault();
    
    if (!giftName.trim() || !giftCoins || isNaN(Number(giftCoins)) || Number(giftCoins) <= 0) {
      toast('Please fill all fields with valid values');
      return;
    }
    
   
    
    try {
      setLoading(true);
      
      const response = await fetch(`${Api}/gifts/${selectedGift._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: giftName,
          coins: Number(giftCoins),
         
        })
      });
      
      if (response.status === 200) {
        toast('Gift updated successfully');
        resetForm();
        setIsEditMode(false);
        fetchGifts();
      } else {
        toast('Failed to update gift');
      }
    } catch (error) {
      console.error('Error updating gift:', error);
      toast('Error updating gift');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGift = async (giftId) => {
    if (!confirm('Are you sure you want to delete this gift?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`${Api}/gifts/${giftId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.status === 200) {
        toast('Gift deleted successfully');
        fetchGifts();
      } else {
        toast('Failed to delete gift');
      }
    } catch (error) {
      console.error('Error deleting gift:', error);
      toast('Error deleting gift');
    } finally {
      setLoading(false);
    }
  };


  const resetForm = () => {
    setGiftName('');
    setGiftCoins('');
    setImageUrl('');
    setImageId('');
    setImageFile(null);
    setPreviewUrl('');
    setSelectedGift(null);
  };
    return (
        <GiftContext.Provider value={{
            loading,
            setLoading,
            selectedGift,
            setSelectedGift,
            gifts,
            setGifts,
            isEditMode,
            setIsEditMode,
            isAddMode,
            setIsAddMode,
            imageFile,
            setImageFile,
            previewUrl,
            setPreviewUrl,
            giftName,
            setGiftName,
            giftCoins,
            setGiftCoins,
            imageUrl,
            setImageUrl,
            imageId,
            setImageId,
            uploadProgress,
            setUploadProgress,
            isUploading,
            setIsUploading,
            handleAddGift,
            uploadImage,
            handleFileChange,
            cancelAction,
            fetchGifts,
            handleAddGift,
            handleEditGift ,
            handleUpdateGift ,
            handleDeleteGift
        }}>
            {children}
        </GiftContext.Provider>
    )
}