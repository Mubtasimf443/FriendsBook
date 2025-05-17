


/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { create } from 'zustand';


export const authStore = create((set) => ({
    authToken : null,
    isLoadingAuth : true , 
    isAuthenticated : false ,
    setAuthToken : (token) => set({authToken : token ,isAuthenticated : true }),
    removeAuthToken : () => set({authToken : null ,isAuthenticated : false }),
    setIsLoadingAuth : (BOOL) => set({isLoadingAuth : BOOL}),

}));