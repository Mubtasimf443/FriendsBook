/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React , { Fragment } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import WithErrorBoundary from '../custom/withErrorBoundary';


const Layout = ({ children }) => {
    return (
        <Fragment>
            <div className="min-h-screen">
                <Header />
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
                        {children}
                    </main>
                </div>
            </div>
           
        </Fragment>
    )
};

export default Layout;