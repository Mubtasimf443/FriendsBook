/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import React from 'react';
import ErrorBoundary from './ErrorBoundary';

// Higher-Order Component for Error Boundary
const WithErrorBoundary = (WrappedComponent, errorBoundaryProps = {}) => {
    return function WithErrorBoundaryComponent(props) {
        return (
            <ErrorBoundary {...errorBoundaryProps}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
export default WithErrorBoundary
