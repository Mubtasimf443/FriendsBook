/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Button } from '@/components/ui/button';
import { Search, Settings, Users, MessageSquare, BarChart2, UserPlus, Shield, Heart, Flag, Image, Video, FileText, HelpCircle } from 'lucide-react';
import React, { Fragment, useLayoutEffect, useState } from 'react';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Link } from 'react-router';



const searchItems = [
    // Overview
    {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: BarChart2,
        description: "Platform analytics and insights",
        shortcut: ["g", "d"],
        category: "overview"
    },
    {
        title: "Messages",
        href: "/admin/messages",
        icon: MessageSquare,
        description: "Monitor user communications",
        shortcut: ["g", "m"],
        category: "overview"
    },

    // Users
    {
        title: "User Management",
        href: "/admin/users",
        icon: Users,
        description: "Manage user accounts",
        category: "users"
    },
    {
        title: "New Registrations",
        href: "/admin/users/new",
        icon: UserPlus,
        description: "Review new sign-ups",
        category: "users"
    },
    {
        title: "User Roles",
        href: "/admin/users/roles",
        icon: Shield,
        description: "Manage user permissions",
        category: "users"
    },

    // Content
    {
        title: "Posts",
        href: "/admin/content/posts",
        icon: FileText,
        description: "Manage user posts",
        category: "content"
    },
    {
        title: "Photos",
        href: "/admin/content/photos",
        icon: Image,
        description: "Manage photo uploads",
        category: "content"
    },
    {
        title: "Videos",
        href: "/admin/content/videos",
        icon: Video,
        description: "Manage video content",
        category: "content"
    },

    // Moderation
    {
        title: "Reports",
        href: "/admin/moderation/reports",
        icon: Flag,
        description: "Handle user reports",
        category: "moderation"
    },
    {
        title: "Engagement",
        href: "/admin/moderation/engagement",
        icon: Heart,
        description: "Monitor user interactions",
        category: "moderation"
    },

    // Settings
    {
        title: "General Settings",
        href: "/admin/settings",
        icon: Settings,
        description: "Platform configuration",
        category: "settings"
    },

    // Help
    {
        title: "Documentation",
        href: "/admin/help/docs",
        icon: FileText,
        description: "Admin panel guides",
        category: "help"
    },
    {
        title: "Support",
        href: "/admin/help/support",
        icon: HelpCircle,
        description: "Get technical support",
        category: "help"
    },
];

const HeaderSearch = () => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    useLayoutEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const filteredItems = search.length > 0
        ? searchItems.filter(item =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
        )
        : searchItems;

    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <Fragment>
            <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-80 xl:justify-start xl:px-3 xl:py-2"
                onClick={() => setOpen(true)}
            >
                
                <Search className="h-4 w-4 xl:mr-2" />
                <span className="hidden xl:inline-flex">Search FriendsBook Admin (Ctrl + K)</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <Command className="rounded-lg border shadow-md">
                    <CommandInput 
                        placeholder="Search FriendsBook admin panel..." 
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList className="max-h-[500px] overflow-y-auto">
                        <CommandEmpty>No results found.</CommandEmpty>
                        
                        {Object.entries(groupedItems).map(([category, items]) => (
                            <Fragment key={category}>
                                <CommandGroup heading={category.charAt(0).toUpperCase() + category.slice(1)}>
                                    {items.map((item) => (
                                        <Link key={item.href} to={item.href}>
                                            <CommandItem
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-accent cursor-pointer"
                                                onSelect={() => {
                                                    setOpen(false);
                                                }}
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background">
                                                    <item.icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{item.title}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                {item.shortcut && (
                                                    <div className="flex items-center gap-1">
                                                        {item.shortcut.map((key, index) => (
                                                            <Fragment key={index}>
                                                                <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                                                                    {key}
                                                                </kbd>
                                                                {index < item.shortcut.length - 1 && 
                                                                    <span className="text-muted-foreground">+</span>
                                                                }
                                                            </Fragment>
                                                        ))}
                                                    </div>
                                                )}
                                            </CommandItem>
                                        </Link>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                            </Fragment>
                        ))}
                    </CommandList>
                </Command>
            </CommandDialog>
        </Fragment>
    );
};

export default HeaderSearch;