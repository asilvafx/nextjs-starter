"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  UserPlus,
  UserMinus
} from "lucide-react";
import { getAll, create, update, remove } from "@/lib/client/query";
import { toast } from "sonner";

export default function SubscribersPage() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSubscriber, setIsAddingSubscriber] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({
    name: '',
    email: '',
    source: 'manual'
  });

  // Fetch subscribers from database
  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      const response = await getAll('newsletter_subscribers');
      
      if (response?.success && response.data) {
        setSubscribers(response.data);
      } else {
        setSubscribers([]);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to load subscribers');
      setSubscribers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleAddSubscriber = async () => {
    try {
      const subscriber = {
        ...newSubscriber,
        status: 'active',
        subscribedDate: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        tags: [],
        createdAt: new Date().toISOString()
      };
      
      await create(subscriber, 'newsletter_subscribers');
      toast.success('Subscriber added successfully');
      setIsAddingSubscriber(false);
      setNewSubscriber({ name: '', email: '', source: 'manual' });
      fetchSubscribers();
    } catch (error) {
      console.error('Error adding subscriber:', error);
      toast.error('Failed to add subscriber');
    }
  };

  const handleUpdateSubscriberStatus = async (subscriberId, newStatus) => {
    try {
      await update(subscriberId, { 
        status: newStatus,
        lastActivity: new Date().toISOString()
      }, 'newsletter_subscribers');
      toast.success('Subscriber updated successfully');
      fetchSubscribers();
    } catch (error) {
      console.error('Error updating subscriber:', error);
      toast.error('Failed to update subscriber');
    }
  };

  const handleDeleteSubscriber = async (subscriberId) => {
    try {
      await remove(subscriberId, 'newsletter_subscribers');
      toast.success('Subscriber removed successfully');
      fetchSubscribers();
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error('Failed to remove subscriber');
    }
  };

  const statusConfig = {
    active: { color: "bg-green-100 text-green-800", label: "Active", icon: "✓" },
    unsubscribed: { color: "bg-gray-100 text-gray-800", label: "Unsubscribed", icon: "✕" },
    bounced: { color: "bg-red-100 text-red-800", label: "Bounced", icon: "!" }
  };

  const sourceConfig = {
    website: { label: "Website", color: "bg-blue-100 text-blue-800" },
    "social-media": { label: "Social Media", color: "bg-purple-100 text-purple-800" },
    referral: { label: "Referral", color: "bg-green-100 text-green-800" },
    "email-campaign": { label: "Email Campaign", color: "bg-orange-100 text-orange-800" },
    manual: { label: "Manual", color: "bg-gray-100 text-gray-800" }
  };

  // Filter subscribers
  const filteredSubscribers = subscribers
    .filter(subscriber => {
      if (selectedTab === 'all') return true;
      return subscriber.status === selectedTab;
    })
    .filter(subscriber => {
      if (!searchTerm) return true;
      return subscriber.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             subscriber.email?.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const subscriberCounts = {
    all: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length,
    bounced: subscribers.filter(s => s.status === 'bounced').length
  };

  // Calculate growth stats
  const recentSubscribers = subscribers.filter(s => {
    const subDate = new Date(s.subscribedDate);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return subDate >= weekAgo && s.status === 'active';
  }).length;

  const churnRate = subscribers.length > 0 
    ? ((subscribers.filter(s => s.status === 'unsubscribed').length / subscribers.length) * 100).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground">
            Manage your email newsletter subscribers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddingSubscriber} onOpenChange={setIsAddingSubscriber}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Subscriber
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Add New Subscriber</DialogTitle>
                <DialogDescription>
                  Manually add a new subscriber to your newsletter.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name"
                    value={newSubscriber.name}
                    onChange={(e) => setNewSubscriber(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Subscriber name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={newSubscriber.email}
                    onChange={(e) => setNewSubscriber(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="subscriber@example.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingSubscriber(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddSubscriber} 
                  disabled={!newSubscriber.email.trim() || !newSubscriber.name.trim()}
                >
                  Add Subscriber
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold">{subscriberCounts.all}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{subscriberCounts.active}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-blue-600">+{recentSubscribers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold text-orange-600">{churnRate}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            All
            <Badge variant="secondary">{subscriberCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            Active
            <Badge variant="secondary">{subscriberCounts.active}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unsubscribed" className="flex items-center gap-2">
            Unsubscribed
            <Badge variant="secondary">{subscriberCounts.unsubscribed}</Badge>
          </TabsTrigger>
          <TabsTrigger value="bounced" className="flex items-center gap-2">
            Bounced
            <Badge variant="secondary">{subscriberCounts.bounced}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          <Card>
            <CardHeader>
              <CardTitle>Subscribers List</CardTitle>
              <CardDescription>
                {filteredSubscribers.length} subscriber{filteredSubscribers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSubscribers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No subscribers found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? `No subscribers match "${searchTerm}"`
                        : "Get started by adding your first subscriber"
                      }
                    </p>
                    <Button onClick={() => setIsAddingSubscriber(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subscriber
                    </Button>
                  </div>
                ) : (
                  filteredSubscribers.map((subscriber) => (
                    <div key={subscriber.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${subscriber.email}`} />
                        <AvatarFallback>
                          {(subscriber.name || subscriber.email).split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{subscriber.name || 'Anonymous'}</h3>
                          <Badge className={statusConfig[subscriber.status]?.color || statusConfig.active.color}>
                            {statusConfig[subscriber.status]?.icon || '✓'} {statusConfig[subscriber.status]?.label || 'Active'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {subscriber.email}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined: {subscriber.subscribedDate ? new Date(subscriber.subscribedDate).toLocaleDateString() : 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Last activity: {subscriber.lastActivity ? new Date(subscriber.lastActivity).toLocaleDateString() : 'Never'}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={sourceConfig[subscriber.source]?.color || sourceConfig.manual.color}
                          >
                            {sourceConfig[subscriber.source]?.label || 'Manual'}
                          </Badge>
                        </div>
                        
                        {subscriber.tags && subscriber.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {subscriber.tags.map((tag, index) => (
                              <Badge key={`${tag}-${index}`} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {subscriber.status === 'active' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateSubscriberStatus(subscriber.id, 'unsubscribed')}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                        {subscriber.status === 'unsubscribed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateSubscriberStatus(subscriber.id, 'active')}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteSubscriber(subscriber.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}