/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */


import React, { Fragment } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router';

const SideBarNavLink = ({ label, icon: Icon, href, badge, description }) => {
    const pathname = useLocation().pathname;
    const isActive = pathname === href;

    return (
        <Fragment>
            <TooltipProvider key={href}>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <Link
                            to={href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-primary/5 hover:text-primary"
                            )}
                        >
                            <div className="flex items-center">
                                <Icon className={cn("h-5 w-5 mr-3")} />
                                <span>{label}</span>
                            </div>
                            {badge && (
                                <Badge variant={badge.variant} className="ml-auto">
                                    {badge.text}
                                </Badge>
                            )}
                        </Link>
                    </TooltipTrigger>
                    {description && (
                        <TooltipContent>
                            <p>{description}</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        </Fragment>
    );
};

export default SideBarNavLink;