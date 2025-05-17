/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import { FullPageLoader } from '@/components/custom/loader';
import { authStore } from '@/lib/auth.store';
import { Api } from '@/lib/env';
import React, { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'

const LoadingPage = () => {
  const setAuthToken  = authStore((state) => state.setAuthToken );
  const removeAuthToken= authStore((state) => state.removeAuthToken);
  const navigate = useNavigate();
  async function auth() {
    let response = await fetch(Api + '/is-loggedin', { method : "post" , credentials : "include"});
    if (response.status === 200) {
      let {data } = await response.json();
      setAuthToken(data.token);
      navigate('/admin')
    } else {
      removeAuthToken();
      navigate('/login')
    }
  }
  useEffect(() => { auth()}, []);
  return (
      <>
      <FullPageLoader />
      </>
  );
}

export default LoadingPage
