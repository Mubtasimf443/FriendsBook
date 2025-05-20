import React from 'react';
import { Home, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink, useNavigate ,} from 'react-router';

const NotFound = () => {
    const navigate = useNavigate();
    const goBack = () => {
        navigate(-1); 
    };
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center p-4">
            <div className="max-w-md mx-auto text-center">
                <div className="relative mb-8">
                    <div className="text-[150px] font-bold leading-none">
                        <span className="absolute inset-0 text-primary/5 blur-sm">404</span>
                        <span className="relative text-primary/20">404</span>
                        <span className="absolute inset-0 text-primary/10 animate-pulse">404</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-4">
                    Page Not Found
                </h2>
                
                <p className="text-muted-foreground mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-2xl animate-pulse delay-300" />

                    <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                </div>
            </div>
        </div>
    );
};

export default NotFound;