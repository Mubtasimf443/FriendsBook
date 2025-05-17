/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { authStore } from '@/lib/auth.store';
import LoadingPage from '@/pages/LoadingPage';
import Login from '@/pages/Login';
import React , { Fragment } from 'react';
import { Navigate } from 'react-router';


const RestrictedPage = (WrappedComponent) => {
  return function (props) {
    const isAuthenticated = authStore((state) => state.isAuthenticated);
    return (
      <>
         {
          isAuthenticated ? <WrappedComponent {...props} /> : <Navigate to={'/loading'} replace />
         }
      </>
    );
  }
};

export default RestrictedPage;