/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import DashboardLoader from '@/components/custom/loader';
import React, { Fragment, useEffect, useRef, useState } from 'react';


const PurchaseStatus = ({ }) => {
    let loading = useRef(true);
    let [status , setStatus ] = useState('')
    useEffect(() => {
        let params = new URLSearchParams(window.location.search);
        setStatus(params.get('status') === 'success' ? 'success' : 'failed' );
        loading.current = false;
    }, []); 

    if (loading.current) {
        return (<DashboardLoader />);
    }

    let isSuccess = status === 'success';
    return (
        <Fragment>
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-blue-200">
                    <div className={`text-5xl mb-4 ${isSuccess ? "text-blue-600" : "text-red-500"}`}>
                        {isSuccess ? "✅" : "❌"}
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                        {isSuccess ? "Purchase Successful!" : "Purchase Failed"}
                    </h1>
                    <p className="text-gray-600">
                        {isSuccess
                            ? "Thank you! Your coin purchase was completed successfully."
                            : "Sorry, something went wrong with your coin purchase. Please try again."}
                    </p>
                </div>
            </div>
        </Fragment>
    )
};

export default PurchaseStatus;