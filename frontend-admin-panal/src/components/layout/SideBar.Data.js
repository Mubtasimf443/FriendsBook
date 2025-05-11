/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import {
    LayoutDashboard,
    Users,
    Grid,
    UserX,
    UserCheck,
    MessageSquare,
    FileText,
    Heart,
    Share2,
    AlertCircle,
} from 'lucide-react';

export const mainRoutes = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/web-admin',
        badge: null,
        description: "Overview of FriendsBook activity"
    },
    {
        label: 'Messages',
        icon: MessageSquare,
        href: '/web-admin/messages',
        badge: {
            text: "5",
            variant: "destructive"
        },
        description: "View user messages"
    },
];

export const sections = [
    {
        id: "posts",
        title: "Posts Management",
        icon: FileText,
        route: "/web-admin/posts",
        routes: [
            {
                label: 'All Posts',
                icon: Grid,
                href: '/web-admin/posts/all',
                badge: {
                    text: "New",
                    variant: "default"
                },
                description: "View and manage user posts"
            },
            {
                label: 'Reported Posts',
                icon: AlertCircle,
                href: '/web-admin/posts/reported',
                badge: {
                    text: "12",
                    variant: "destructive"
                },
                description: "Review reported content"
            },
        ]
    },
    // Converting other sections for social media context
    {
        id: "users",
        title: "User Management",
        icon: Users,
        route: "/web-admin/users",
        routes: [
            {
                label: 'All Users',
                icon: Users,
                href: '/web-admin/users/all',
                badge: {
                    text: "1.2K",
                    variant: "default"
                },
                description: "Manage user accounts"
            },
            {
                label: 'Verified Users',
                icon: UserCheck,
                href: '/web-admin/users/verified',
                badge: null,
                description: "Manage verified accounts"
            },
            {
                label: 'Banned Users',
                icon: UserX,
                href: '/web-admin/users/banned',
                badge: {
                    text: "3",
                    variant: "destructive"
                },
                description: "View banned accounts"
            }
        ]
    },
    {
        id: "engagement",
        title: "Engagement",
        icon: Heart,
        route: "/web-admin/engagement",
        routes: [
            {
                label: 'Comments',
                icon: MessageSquare,
                href: '/web-admin/engagement/comments',
                badge: {
                    text: "25",
                    variant: "default"
                },
                description: "Manage user comments"
            },
            {
                label: 'Likes',
                icon: Heart,
                href: '/web-admin/engagement/likes',
                badge: null,
                description: "View post interactions"
            },
            {
                label: 'Shares',
                icon: Share2,
                href: '/web-admin/engagement/shares',
                badge: null,
                description: "Track content sharing"
            }
        ]
    },


];