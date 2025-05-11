/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Badge } from '@/components/ui/badge';
import {Link} from 'react-router';
import React from 'react';

export const HeaderLinks = ({ Icon, href, BadgeNumber, title }) => {
    return (
        <Link
            className="relative h-8 w-7 pt-2 hover:text-primary transition-colors duration-200"
            to={href}
            title={title || ""}
        >
            <Icon className="h-5 w-5" />
            {
                typeof BadgeNumber === 'number' &&
                (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 animate-pulse"
                    >
                        {BadgeNumber}
                    </Badge>
                )
            }
        </Link>
    )
};

export const HeaderLinksContainer = ({ children }) => {
    return (
        <div className="flex items-center gap-4">
            {children}
        </div>
    )
};