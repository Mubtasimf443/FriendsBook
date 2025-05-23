/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { Fragment, useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { Api, notification_socket } from '@/lib/env';
import { io } from 'socket.io-client';

const NOTIFICATION_STORAGE_KEY = "sent_notifications";

function getStoredNotifications() {
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY)) || [];
  } catch (e) {
    items = [];
  }
  // Remove notifications older than 7 days
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const filtered = items.filter(n => now - n.timestamp < weekMs);
  if (filtered.length !== items.length) {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(filtered));
  }
  return filtered;
}
function addNotificationToStorage(notification) {
  const items = getStoredNotifications();
  items.unshift(notification);
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(items));
}

const PushNotification = () => {
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    target: 'all_users', // all_users, video_users, matrimony_users
  });
  const [loading, setLoading] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);
  const socketRef = useRef(null);

  // Load notifications from localStorage on mount and setup socket
  useEffect(() => {
    setSentNotifications(getStoredNotifications());
    const filtered = getStoredNotifications();
    setSentNotifications(filtered);
    const interval = setInterval(() => {
      setSentNotifications(getStoredNotifications());
    }, 60 * 60 * 1000); // every hour

    // Setup socket connection
    const socket = io(notification_socket);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Socket Io');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket Io');
    });

    // Optionally listen for server acks or errors
    socket.on('notification_sent', (data) => {
      toast.success("Notification sent (server ack)");
    });
    socket.on('notification_error', (err) => {
      toast.error("Server error sending notification");
    });

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNotification(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setNotification(prev => ({ ...prev, target: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!notification.title.trim()) {
      toast.error("Please enter a notification title");
      return;
    }

    if (!notification.message.trim()) {
      toast.error("Please enter a notification message");
      return;
    }

    setLoading(true);

    try {
      // Map UI target to backend type
      let room = notification.target;
      

      const payload = {
        room,
        title: notification.title,
        body: notification.message,
      };
o
      let res = await fetch(Api + "/notification" , {
        headers : {
          'content-type' :'application/json'
        },
        body : JSON.stringify(payload),
        method : 'post'
      });

      if (res.status === 200) toast('Notification Sent SuccessFull');

    } catch (err) {
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  let userTypes = [
    {
      name: "All Members",
      value: 'allProfileRoom'
    },
    {
      name: "Matrimony Members",
      value: 'matrimonyProfileRoom'
    },
    {
      name: "Video Calling Members",
      value: 'videoProfileRoom'
    },
  ];

  return (
    <Fragment>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Bell className="h-8 w-8 text-primary" />
          Push Notifications
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Send Push Notification</CardTitle>
            <CardDescription>
              Create and send push notifications to your users
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Notification Title</label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter notification title"
                  value={notification.title}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">Notification Message</label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Enter notification message"
                  rows={4}
                  value={notification.message}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="target" className="text-sm font-medium">Target Audience</label>
                <Select
                  value={notification.target}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {
                      userTypes.map(element => {
                        return (
                          <SelectItem key={element.value} value={element.value}>{element.name}</SelectItem>
                        );
                      })
                    }
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Notification
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              History of recently sent notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentNotifications && sentNotifications.length > 0 ? (
              <div className="space-y-4">
                {sentNotifications.map((n, idx) => (
                  <div key={idx} className="border rounded p-3 flex flex-col gap-1 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{n.title}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(n.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">{n.message || n.body}</div>
                    <div className="text-xs text-gray-500">
                      Target: {n.target || n.type}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Users className="mx-auto h-12 w-12 opacity-50 mb-2" />
                <p>No notifications have been sent yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Fragment>
  );
};

export default PushNotification;