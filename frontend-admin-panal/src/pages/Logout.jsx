/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, Loader2, CheckCircle } from 'lucide-react';

const Logout = () => {
    const [logoutStatus, setLogoutStatus] = useState('logging-out');
    const navigate = useNavigate();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                // Clear local storage
                localStorage.removeItem('friendsbook_token');
                localStorage.removeItem('friendsbook_user');
                
                // Clear session storage
                sessionStorage.clear();

                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                setLogoutStatus('success');

                // Redirect after showing success message
                setTimeout(() => {
                    navigate('/login');
                }, 5000);

            } catch (error) {
                console.error('Logout Error:', error);
                setLogoutStatus('error');
            }
        };

        handleLogout();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Card Container */}
                <div className="bg-card rounded-lg shadow-lg p-8 text-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0 bg-grid-primary/10" />
                    </div>

                    {/* Content */}
                    <div className="relative space-y-6">
                        {/* Icon */}
                        <div className="flex justify-center">
                            {logoutStatus === 'logging-out' && (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                                    <div className="relative bg-card p-4 rounded-full border-2 border-primary/20">
                                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                    </div>
                                </div>
                            )}
                            {logoutStatus === 'success' && (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping" />
                                    <div className="relative bg-card p-4 rounded-full border-2 border-green-500/20">
                                        <CheckCircle className="h-12 w-12 text-green-500" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status Message */}
                        <div className="space-y-2">
                            <h3 className="text-2xl font-semibold">
                                {logoutStatus === 'logging-out' ? (
                                    <span className="text-primary">Signing Out...</span>
                                ) : logoutStatus === 'success' ? (
                                    <span className="text-green-500">Successfully Signed Out!</span>
                                ) : (
                                    <span className="text-red-500">Error Signing Out</span>
                                )}
                            </h3>
                            <p className="text-muted-foreground">
                                {logoutStatus === 'logging-out' ? (
                                    'Please wait while we securely sign you out...'
                                ) : logoutStatus === 'success' ? (
                                    'You will be redirected to the login page shortly.'
                                ) : (
                                    'Please try again or contact support if the problem persists.'
                                )}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        {logoutStatus === 'logging-out' && (
                            <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-primary h-full animate-progress" />
                            </div>
                        )}

                        {/* Decorative Elements */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-4">
                    Thank you for using FriendsBook Admin Panel
                </p>
            </div>
        </div>
    );
};

export default Logout;