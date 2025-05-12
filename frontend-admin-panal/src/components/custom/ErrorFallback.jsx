import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';

function ErrorFallback({ error, errorInfo, onReset }) {
    const navigate = useNavigate();

    const handleHomeClick = () => {
        navigate('/dashboard');
        onReset();
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                {/* Error Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-white p-4 rounded-full shadow-lg">
                            <AlertTriangle className="h-12 w-12 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Oops! Something went wrong
                    </h2>
                    <div className="bg-red-50 rounded-lg p-4 mt-4">
                        <p className="text-sm text-red-600 font-medium">
                            {error?.message || 'An unexpected error occurred'}
                        </p>
                    </div>
                </div>

                {/* Technical Details (Collapsible) */}
                <details className="bg-gray-50 rounded-lg p-4">
                    <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-primary">
                        Technical Details
                    </summary>
                    <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                        {errorInfo?.componentStack || 'No stack trace available'}
                    </pre>
                </details>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center mt-8">
                    <Button
                        onClick={onReset}
                        variant="outline"
                        className="flex items-center gap-2 hover:bg-gray-100"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Try Again
                    </Button>
                    <Button
                        onClick={handleHomeClick}
                        variant="default"
                        className="flex items-center gap-2"
                    >
                        <Home className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>

                {/* Support Contact */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    Need help? Contact{' '}
                    <a 
                        href="mailto:support@friendsbook.com" 
                        className="text-primary hover:underline"
                    >
                        FriendsBook Support
                    </a>
                </p>
            </div>
        </div>
    );
}

export default ErrorFallback;