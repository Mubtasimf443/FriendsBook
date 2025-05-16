/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import React, { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';

export const MembershipPricing = () => {
  const [memberships, setMemberships] = useState({
    premium: {
      name: 'Premium',
      prices: {
        '3': { price: 299, smsText: 'Get Premium membership for 3 months at $299' },
        '6': { price: 499, smsText: 'Get Premium membership for 6 months at $499' },
        '12': { price: 799, smsText: 'Get Premium membership for 12 months at $799' },
      }
    },
    gold: {
      name: 'Gold',
      prices: {
        '3': { price: 499, smsText: 'Get Gold membership for 3 months at $499' },
        '6': { price: 799, smsText: 'Get Gold membership for 6 months at $799' },
        '12': { price: 1299, smsText: 'Get Gold membership for 12 months at $1299' },
      }
    },
    diamond: {
      name: 'Diamond',
      prices: {
        '3': { price: 799, smsText: 'Get Diamond membership for 3 months at $799' },
        '6': { price: 1299, smsText: 'Get Diamond membership for 6 months at $1299' },
        '12': { price: 1999, smsText: 'Get Diamond membership for 12 months at $1999' },
      }
    }
  });

  const [editingState, setEditingState] = useState({
    membership: null,
    duration: null,
    field: null,
  });

  const [tempValue, setTempValue] = useState('');
  const [activeTab, setActiveTab] = useState('premium');

  const handleEdit = (membership, duration, field, currentValue) => {
    setEditingState({ membership, duration, field });
    setTempValue(field === 'price' ? currentValue.toString() : currentValue);
  };

  const handleSave = () => {
    const { membership, duration, field } = editingState;
    if (membership && duration && field) {
      setMemberships(prev => {
        const newMemberships = { ...prev };
        const value = field === 'price' ? Number(tempValue) : tempValue;
        newMemberships[membership].prices[duration][field] = value;
        return newMemberships;
      });
    }
    setEditingState({ membership: null, duration: null, field: null });
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
          {field === 'price' ? (
            <input 
              type="number" 
              value={tempValue} 
              onChange={(e) => setTempValue(e.target.value)}
              className="border rounded px-2 py-1 w-24"
            />
          ) : (
            <input 
              type="text" 
              value={tempValue} 
              onChange={(e) => setTempValue(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          )}
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
        <span>{field === 'price' ? `$${value}` : value}</span>
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Membership Pricing Management</h1>
      
      <div className="mb-6">
        <div className="grid w-full grid-cols-3 border rounded overflow-hidden">
          <button 
            className={`py-2 ${activeTab === 'premium' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            onClick={() => setActiveTab('premium')}
          >
            Premium
          </button>
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
                              'smsText', 
                              memberships[membershipKey].prices[duration].smsText
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
  );
};
