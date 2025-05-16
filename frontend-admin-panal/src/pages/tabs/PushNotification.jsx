/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import React, { Fragment, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users } from "lucide-react";
import { toast } from "sonner";

const PushNotification = () => {
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    target: 'all', // all, premium, gold, diamond
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNotification(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setNotification(prev => ({ ...prev, target: value }));
  };

  const handleSubmit = (e) => {
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
    
    // Simulate API call
    setTimeout(() => {
      toast.success(`Notification sent to ${notification.target} users!`);
      setLoading(false);
      setNotification({
        title: '',
        message: '',
        target: 'all',
      });
    }, 1500);
  };

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
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="premium">Premium Members</SelectItem>
                    <SelectItem value="gold">Gold Members</SelectItem>
                    <SelectItem value="diamond">Diamond Members</SelectItem>
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
            <div className="text-center text-muted-foreground py-8">
              <Users className="mx-auto h-12 w-12 opacity-50 mb-2" />
              <p>No notifications have been sent yet</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Fragment>
  );
};

export default PushNotification;