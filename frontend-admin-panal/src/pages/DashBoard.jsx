/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import RestrictedPage from '@/components/custom/restrictedPage';
import WithErrorBoundary from '@/components/custom/withErrorBoundary';
import Header from '@/components/layout/Header';
import Layout from '@/components/layout/Layout';
import { authStore } from '@/lib/auth.store';
import React , { Fragment, useLayoutEffect } from 'react';
import { Outlet } from 'react-router';


const DashBoard = ({ }) => {

  return (
    <Fragment >
      <Layout >
        <Outlet />
      </Layout>
    </Fragment>
  )
};

export default RestrictedPage(WithErrorBoundary(DashBoard));