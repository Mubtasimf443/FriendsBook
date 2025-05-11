/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import { createBrowserRouter , RouterProvider} from  'react-router'
import LoadingPage from './pages/LoadingPage'

function App() {
  const router = createBrowserRouter(
    [
      {
        path :'/' ,
        element :<LoadingPage />
      }
  ] , 
  {
 
  }
)
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
