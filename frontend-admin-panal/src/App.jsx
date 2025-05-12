/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import { createBrowserRouter, RouterProvider } from 'react-router'
import LoadingPage from './pages/LoadingPage'

import { lazy as Lazy, Suspense } from 'react'
import DashboardLoader from './components/custom/loader'
import ErrorBoundary from './components/custom/ErrorBoundary'
import WithErrorBoundary from './components/custom/withErrorBoundary'
import Overview from './pages/tabs/Overview'
import NotFoundTab from './pages/tabs/NotFoundTab'
import NotFound from './pages/NotFound'
import Logout from './pages/Logout'
import LoginPage from './pages/Login'
import { Toaster } from '@/components/ui/sonner'
import UserManagement from './pages/tabs/UserManagement'
import AllUser from './pages/tabs/AllUser'
import SearchUser from './pages/tabs/SearchUser'

const LazyDashboard = Lazy(() => import('./pages/DashBoard'))

function App() {
  const router = createBrowserRouter(
    [
      {
        path: '/',
        element: <LoadingPage />
      },
      {
        path: '/login',
        element: <LoginPage />
      },
      {
        path: '/loggout',
        element: <Logout />
      },
      {
        path: '/dashboard',
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
            path: '*',
            Component: NotFoundTab
          }
        ],

      },
      {
        path: "*",

        element: <NotFound />
      }
    ],
    {
      basename: '/admin'
    }
  )
  return (
    <>

      <RouterProvider router={router} />
      <Toaster />

    </>
  )
}

export default App;
