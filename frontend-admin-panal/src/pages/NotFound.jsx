import React from 'react';
import { Home, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center p-4">
            <div className="max-w-md mx-auto text-center">
                {/* 404 Animation */}
                <div className="relative mb-8">
                    {/* Animated Numbers */}
                    <div className="text-[150px] font-bold leading-none">
                        {/* Layer 1 - Shadow */}
                        <span className="absolute inset-0 text-primary/5 blur-sm">404</span>
                        {/* Layer 2 - Main Number */}
                        <span className="relative text-primary/20">404</span>
                        {/* Layer 3 - Glowing Number */}
                        <span className="absolute inset-0 text-primary/10 animate-pulse">404</span>
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-2xl font-bold mb-4">
                    Page Not Found
                </h2>
                <p className="text-muted-foreground mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto flex items-center gap-2 hover:bg-primary/5"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </Button>
                    
                    <Button
                        className="w-full sm:w-auto flex items-center gap-2 bg-primary hover:bg-primary/90"
                    >
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full sm:w-auto flex items-center gap-2"
                    >
                        <HelpCircle className="h-4 w-4" />
                        Help
                    </Button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    {/* Animated Circles */}
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-2xl animate-pulse delay-300" />
                    
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                </div>
            </div>
        </div>
    );
};

export default NotFound;