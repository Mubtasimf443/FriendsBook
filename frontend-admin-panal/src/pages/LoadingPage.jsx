/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'


const LoadingPage = () => {
  let navigate = useNavigate()
  useEffect(() => {
    let timeOut =setTimeout(() => {
      navigate('/dashboard')
    }, 1000);
    return () => clearTimeout(timeOut);
  }, [])
  return (
    <div>
      <h1 className='text-green-600'>Hello</h1>
    </div>
  )
}

export default LoadingPage
