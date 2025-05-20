/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import React, { useEffect, useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import DashboardLoader from '@/components/custom/loader';
import { Api, server_origin } from '@/lib/env';
import { toast } from 'sonner';

export const CoinManagement = () => {
  const [loading, setLoading] = useState(true);
  const [faliedToLoadCoins , setFailedToLoadCoins] = useState(false);
  const [isDisabledInp, setDisableInp] = useState(false);
  const [coinPackages, setCoinPackages] = useState({});

  useEffect(() => {
    (async function () {
      try {
        setLoading(true);
        let response = await fetch(server_origin + '/api/data/coins-data');
        if (response.status === 200) {
          let data = await response.json();
          setCoinPackages(data.data.coin_packages);

        } 
        if (response.status !== 200) {
          setFailedToLoadCoins(true)
        }
      } catch (error) {
        console.error(error);
        toast('Failed to load coin packages');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [editingState, setEditingState] = useState({
    packageId: null,
    field: null,
  });

  const [tempValue, setTempValue] = useState('');
  const [activeTab, setActiveTab] = useState('package_1');

  const handleEdit = (packageId, field, currentValue) => {
    setEditingState({ packageId, field });
    setTempValue(currentValue.toString());
  };

  const handleSave = () => {
    (async function () {
      try {
        setDisableInp(true);
        const { packageId, field } = editingState;
        if (packageId && field) {
          let response = await fetch(Api + '/coins-data', {
            method: 'put',
            credentials: 'include',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              packageId,
              field,
              value: field === 'price' || field === 'coins' ? Number(tempValue) : tempValue
            })
          });
          
          if (response.status !== 200) {
            return toast('Failed to Update the ' + field);
          } else {
            toast(field + ' Updated Successfully');
          }
          
          setCoinPackages((prev) => {
            const newPackages = { ...prev };
            const value = field === 'price' || field === 'coins' ? Number(tempValue).toString() : tempValue;
            newPackages[packageId][field] = value;
            return newPackages;
          });
        }
        setEditingState({ packageId: null, field: null });
      } catch (error) {
        console.error(error);
        toast('An error occurred while updating');
      } finally {
        setDisableInp(false);
      }
    })();
  };

  const handleCancel = () => {
    setEditingState({ packageId: null, field: null });
  };

  const renderEditor = (packageId, field, value) => {
    const isEditing = 
      editingState.packageId === packageId && 
      editingState.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <input 
            type={field === 'name' ? 'text' : 'number'}
            value={tempValue}
            disabled={isDisabledInp}
            onChange={(e) => setTempValue(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
          </button>
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <span>
          {field === 'price' ? `$${value}` : 
           field === 'coins' ? `${value} coins` : value}
        </span>
        <button 
          className="p-1 rounded hover:bg-gray-100" 
          onClick={() => handleEdit(packageId, field, value)}
        >
          <Edit className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <>
      {loading && <DashboardLoader />}
      { faliedToLoadCoins && (
        <>
        <h3>Failed To Load Coins</h3>
        </>
      )}
      {(!loading && !faliedToLoadCoins) && (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Coin Packages Management</h1>
      
          <div className="mb-6">
            <div className="grid w-full grid-cols-4 border rounded overflow-hidden">
              {Object.keys(coinPackages).map((packageId) => (
                <button 
                  key={packageId}
                  className={`py-2 ${activeTab === packageId ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => setActiveTab(packageId)}
                >
                  {coinPackages[packageId].name}
                </button>
              ))}
            </div>
        
            {Object.keys(coinPackages).map((packageId) => (
              <div 
                key={packageId} 
                className={`mt-4 ${activeTab === packageId ? 'block' : 'hidden'}`}
              >
                <div className="border rounded shadow-sm">
                  <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">{coinPackages[packageId].name} Package</h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Package Name</h4>
                        {renderEditor(
                          packageId, 
                          'name', 
                          coinPackages[packageId].name
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Price</h4>
                        {renderEditor(
                          packageId, 
                          'price', 
                          coinPackages[packageId].price
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Coins</h4>
                        {renderEditor(
                          packageId, 
                          'coins', 
                          coinPackages[packageId].coins
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default CoinManagement;