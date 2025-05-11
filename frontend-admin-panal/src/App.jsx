/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import { createBrowserRouter, RouterProvider } from 'react-router'
import LoadingPage from './pages/LoadingPage'

import { lazy as Lazy, Suspense } from 'react'
import DashboardLoader from './components/custom/loader'
import ErrorBoundary from './components/custom/ErrorBoundary'
import WithErrorBoundary from './components/custom/withErrorBoundary'

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
        element: <LoadingPage />
      },
      {
        path: '/dashboard',
        element: <Suspense fallback={<DashboardLoader />}>  <LazyDashboard />    </Suspense>,
    
      }
    ],
    {

    }
  )
  return (
    <>
 
      <RouterProvider router={router} />
    
     
    </>
  )
}

export default WithErrorBoundary(App)
