/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import React, { useEffect, useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import DashboardLoader, { FullPageLoader } from '@/components/custom/loader';
import { Api } from '@/lib/env';

import { toast } from 'sonner';

export const MembershipPricing = () => {
  let [loading, setLoading] = useState(false);
  const [isDisabledInp, setDisableInp] = useState(false);
  const [memberships, setMemberships] = useState({ });

  useEffect(() => {
    (async function () {
      try {
        setLoading(true)
        let response = await fetch(Api + '/membership/pricing', { credentials: 'include', });
        if (response.status === 200) {
          let data = await response.json();
       
          setMemberships(data.data.membership_data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false)
      }
    })();
  }, []);


  const [editingState, setEditingState] = useState({
    membership: null,
    duration: null,
    field: null,
  });

  const [tempValue, setTempValue] = useState('');
  const [activeTab, setActiveTab] = useState('gold');

  const handleEdit = (membership, duration, field, currentValue) => {
    setEditingState({ membership, duration, field });
    setTempValue(field === 'price' ? currentValue.toString() : currentValue);
  };

  const handleSave = () => {
    (async function () {
      try {
        setDisableInp(true)
        const { membership, duration, field } = editingState;
        if (membership && duration && field) {
          let response = await fetch(Api + '/membership/pricing', {
            method: 'put',
            credentials: 'include',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              plan: membership,
              duration,
              field,
              value: Number(tempValue)
            })
          });
          if (response.status !== 200) {
            return toast('Failed to Update the ' + field);
          } else {
            toast('Field Updated SuccessFully')
          }
          setMemberships((prev) => {
            const newMemberships = { ...prev };
            const value = field === 'price' ? Number(tempValue) : tempValue;
            newMemberships[membership].prices[duration][field] = value;
            return newMemberships;
          });
        }
        setEditingState({ membership: null, duration: null, field: null });

      } catch (error) {
        console.error(error);

      } finally {
        setDisableInp(false)
      }
    })()
  };

  const handleCancel = () => {
    setEditingState({ membership: null, duration: null, field: null });
  };

  const renderPriceEditor = (membership, duration, field, value) => {
    const isEditing =
      editingState.membership === membership &&
      editingState.duration === duration &&
      editingState.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">

          <input
            type="number"
            value={tempValue}
            disabled={isDisabledInp}
            onChange={(e) => setTempValue(e.target.value)}
            className="border rounded px-2 py-1 w-24"
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
        <span>{field === 'price' ? `${value}Tk` : value}</span>
        <button
          className="p-1 rounded hover:bg-gray-100"
          onClick={() => handleEdit(membership, duration, field, value)}
        >
          <Edit className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <>
      {loading && <DashboardLoader />}
      {
        !loading && (

          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Membership Pricing Management</h1>

            <div className="mb-6">
              <div className="grid w-full grid-cols-3 border rounded overflow-hidden">
               
                <button
                  className={`py-2 ${activeTab === 'gold' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => setActiveTab('gold')}
                >
                  Gold
                </button>
                <button
                  className={`py-2 ${activeTab === 'diamond' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => setActiveTab('diamond')}
                >
                  Diamond
                </button>

                 <button
                  className={`py-2 ${activeTab === 'platinum' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => setActiveTab('platinum')}
                >
                  Platinum
                </button>
              </div>

              {Object.keys(memberships).map((membershipKey) => (
                <div
                  key={membershipKey}
                  className={`mt-4 ${activeTab === membershipKey ? 'block' : 'hidden'}`}
                >
                  <div className="border rounded shadow-sm">
                    <div className="p-4 border-b">
                      <h2 className="text-xl font-semibold">{memberships[membershipKey].name} Membership Pricing</h2>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.keys(memberships[membershipKey].prices).map((duration) => (
                          <div key={duration} className="border rounded shadow-sm">
                            <div className="p-3 border-b">
                              <h3 className="font-semibold">{duration} Months</h3>
                            </div>
                            <div className="p-4">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Price</h4>
                                  {renderPriceEditor(
                                    membershipKey,
                                    duration,
                                    'price',
                                    memberships[membershipKey].prices[duration].price
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">SMS Text</h4>
                                  {renderPriceEditor(
                                    membershipKey,
                                    duration,
                                    'sms',
                                    memberships[membershipKey].prices[duration].sms
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

    </>

  );
};
