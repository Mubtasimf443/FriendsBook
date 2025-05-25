/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import { createBrowserRouter, RouterProvider } from 'react-router';
import LoadingPage from './pages/LoadingPage';
import { lazy as Lazy, Suspense } from 'react';
import DashboardLoader from './components/custom/loader';
import Overview from './pages/tabs/Overview';
import NotFoundTab from './pages/tabs/NotFoundTab';
import NotFound from './pages/NotFound';
import Logout from './pages/Logout';
import { Toaster } from '@/components/ui/sonner';
import UserManagement from './pages/tabs/UserManagement';
import AllUser from './pages/tabs/AllUser';
import SearchUser from './pages/tabs/SearchUser';
import PushNotification from './pages/tabs/PushNotification';
import { MembershipPricing } from './pages/tabs/MembershipPricing';
import MembershipRequest from './pages/tabs/MembershipRequest';
import Login from './pages/Login';
import  { GiftsManagement } from './pages/tabs/GiftsManagement';
import CoinManagement from './pages/tabs/CoinManagement';
import { GiftContextProvider } from './context/gifts.context';
import PurchaseStatus from './pages/PurchaseStatus';
import CoinPurchaseRequest from './pages/tabs/CoinPurchaseRequest';

const LazyDashboard = Lazy(() => import('./pages/DashBoard'))

function App() {
 
  const router = createBrowserRouter(
    [
      {
        path: '/login',
        element: <Login />
      },
      {
        path :'/loading',
        element : <LoadingPage />
      },
      {
        path: '/admin',
        element: <Suspense fallback={<DashboardLoader />}>  <LazyDashboard />    </Suspense>,
        children: [
          {

            path: '',
            Component: Overview
          },
          {

            path: 'overview',
            Component: Overview
          },
          {

            path: 'users',
            Component: UserManagement,
            children: [
              {
                path: 'all',
                Component: AllUser
              },
              {
                path: 'search',
                Component: SearchUser
              }
            ]
          },
          {
            path : "notifications" ,
            Component : PushNotification
          },
          {
            path : "notifications" ,
            Component : PushNotification
          },
          {
            path :'memberships-management',
            Component : MembershipPricing
          },
          {
            path : 'membership-request' ,
            Component : MembershipRequest
          },
          {
            path: 'coin-request',
            element : <CoinPurchaseRequest />
          },
          {
            path : "gift-management",
            element :<GiftContextProvider children={<GiftsManagement />} />
          }, 
          {
            path : 'coin-management',
            Component : CoinManagement 
          },
          {
            path: '*',
            Component: NotFoundTab
          }
        ],

      },
      {
        path: '/loggout',
        element: <Logout />
      },
      {
        path : "purchase_status",
        element : <PurchaseStatus />
      },
      {
        path: "*",
        element: <NotFound />
      }
    ],
    
  );

  return (
    <>
   <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

export default App;
