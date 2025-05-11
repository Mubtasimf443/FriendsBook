/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { Fragment, useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from 'lucide-react';
import SideBarNavLink from './SideBarNavLink';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router';




const SideBarLinksSection = ({ id, title, icon: Icon, routes, route }) => {

    let location = useLocation()
    const [isOpen, setIsOpen] = useState(location.pathname.includes(route));
    const navigate= useNavigate()

 function redirectToRoute() {
        if (!isOpen) {
            navigate(route);
        }
    }


    const toggleOpen = () => setIsOpen(prev => !prev);

  

    return (
        <Fragment>
            <Collapsible
                key={id}
                open={isOpen}
                onOpenChange={toggleOpen}
                className="mb-2"
            >
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full justify-between font-medium text-sm"
                    >
                        <div 
                            className="flex items-center"
                            onClick={redirectToRoute}
                        >
                            <Icon className="h-4 w-4 mr-2" />
                            <span>{title}</span>
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 transition-transform",
                                isOpen && "transform rotate-180"
                            )}
                        />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-2 space-y-1 mt-1">
                    {routes.map((route, key) => (
                        <SideBarNavLink {...route} key={key} />
                    ))}
                </CollapsibleContent>
            </Collapsible>
        </Fragment>
    );
};

export default SideBarLinksSection;