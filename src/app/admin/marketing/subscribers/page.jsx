'use client';

import {
    Calendar,
    Filter,
    Mail,
    MoreVertical,
    Plus,
    Search,
    TrendingDown,
    TrendingUp,
    UserMinus,
    UserPlus,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { create, getAll, remove, update } from '@/lib/client/query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/phone-input';
import { Download, Trash2 } from 'lucide-react';

export default function SubscribersPage() {
    const [selectedTab, setSelectedTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [subscribers, setSubscribers] = useState([]);
    const [allSubscribers, setAllSubscribers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingSubscriber, setIsAddingSubscriber] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [subscriberToDelete, setSubscriberToDelete] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [stats, setStats] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    });
    const [sortConfig, setSortConfig] = useState({ 
        key: 'subscribedDate', 
        direction: 'desc' 
    });
    const [newSubscriber, setNewSubscriber] = useState({
        name: '',
        email: '',
        phone: '',
        source: 'manual',
        tags: []
    });

    // Fetch subscribers from database with pagination
    const fetchSubscribers = async (page = currentPage, search = searchTerm, status = selectedTab) => {
        try {
            setIsLoading(true);
            
            const params = {
                page,
                limit: 10,
                search: search.trim(),
                status: status === 'all' ? '' : status,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.direction
            };

            const result = await getAll('newsletter_subscribers', params);
            
            if (result.success) {
                setSubscribers(result.data || []);
                setPagination({
                    page: result.pagination?.page || 1,
                    limit: result.pagination?.limit || 10,
                    total: result.pagination?.total || 0,
                    totalPages: result.pagination?.totalPages || 0,
                    hasNext: result.pagination?.hasNext || false,
                    hasPrev: result.pagination?.hasPrev || false
                });
            } else {
                toast.error(result?.error || 'Failed to load subscribers');
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

    // Fetch subscriber statistics
    const fetchStats = async () => {
        try {
            const result = await getAll('newsletter_subscribers', { limit: 10000 });
            
            if (result.success) {
                const allSubs = result.data || [];
                const stats = {
                    total: allSubs.length,
                    active: allSubs.filter(s => s.status === 'active').length,
                    unsubscribed: allSubs.filter(s => s.status === 'unsubscribed').length,
                    bounced: allSubs.filter(s => s.status === 'bounced').length,
                    recentSubscribers: allSubs.filter(s => {
                        const subDate = new Date(s.subscribedDate);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return subDate >= weekAgo;
                    }).length,
                    churnRate: allSubs.length > 0 ? Math.round((allSubs.filter(s => s.status === 'unsubscribed').length / allSubs.length) * 100) : 0
                };
                setStats(stats);
            } else {
                console.error('Failed to load stats:', result?.error);
                setStats({});
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            setStats({});
        }
    };

    // Fetch all subscribers for filtering (used by tabs)
    const fetchAllSubscribers = async () => {
        try {
            const result = await getAll('newsletter_subscribers', { limit: 10000 });
            if (result.success) {
                setAllSubscribers(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching all subscribers:', error);
        }
    };

    useEffect(() => {
        fetchSubscribers();
        fetchStats();
        fetchAllSubscribers();
    }, []);

    // Update data when page changes
    useEffect(() => {
        fetchSubscribers(currentPage, searchTerm, selectedTab);
    }, [currentPage, sortConfig]);

    // Handle tab change
    const handleTabChange = (newTab) => {
        setSelectedTab(newTab);
        setCurrentPage(1);
        fetchSubscribers(1, searchTerm, newTab);
    };

    // Handle search
    const handleSearch = (search) => {
        setSearchTerm(search);
        setCurrentPage(1);
        fetchSubscribers(1, search, selectedTab);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchSubscribers(page, searchTerm, selectedTab);
    };

    const handleAddSubscriber = async () => {
        try {
            if (!newSubscriber.email.trim() || !newSubscriber.name.trim()) {
                toast.error('Name and email are required');
                return;
            }

            setIsAddingSubscriber(true);
            
            const subscriberData = {
                ...newSubscriber,
                status: 'active',
                subscribedDate: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            const result = await create(subscriberData, 'newsletter_subscribers');
            
            if (result.success) {
                toast.success('Subscriber added successfully');
                setNewSubscriber({ 
                    name: '', 
                    email: '', 
                    phone: '', 
                    source: 'manual', 
                    tags: [] 
                });
                fetchSubscribers();
                fetchStats();
                fetchAllSubscribers();
            } else {
                toast.error(result.error || 'Failed to add subscriber');
            }
        } catch (error) {
            console.error('Error adding subscriber:', error);
            toast.error('Failed to add subscriber');
        } finally {
            setIsAddingSubscriber(false);
        }
    };

    const handleUpdateSubscriberStatus = async (subscriberId, newStatus) => {
        try {
            const updateData = {
                status: newStatus,
                lastActivity: new Date().toISOString()
            };
            
            const result = await update(subscriberId, updateData, 'newsletter_subscribers');
            
            if (result.success) {
                toast.success(`Subscriber ${newStatus === 'active' ? 'reactivated' : newStatus} successfully`);
                fetchSubscribers();
                fetchStats();
                fetchAllSubscribers();
            } else {
                toast.error(result.error || 'Failed to update subscriber status');
            }
        } catch (error) {
            console.error('Error updating subscriber status:', error);
            toast.error('Failed to update subscriber status');
        }
    };

    const handleDeleteClick = (subscriber) => {
        setSubscriberToDelete(subscriber);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSubscriber = async () => {
        if (!subscriberToDelete) return;

        try {
            setIsDeleting(true);
            const result = await remove(subscriberToDelete.id, 'newsletter_subscribers');
            
            if (result.success) {
                toast.success('Subscriber deleted successfully');
                fetchSubscribers();
                fetchStats();
                fetchAllSubscribers();
            } else {
                toast.error(result.error || 'Failed to delete subscriber');
            }
        } catch (error) {
            console.error('Error deleting subscriber:', error);
            toast.error('Failed to delete subscriber');
        } finally {
            setIsDeleting(false);
            setDeleteConfirmOpen(false);
            setSubscriberToDelete(null);
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            
            // Get all subscribers based on current filter
            let exportData = allSubscribers;
            
            // Filter by status if not "all"
            if (selectedTab !== 'all') {
                exportData = exportData.filter(sub => sub.status === selectedTab);
            }
            
            // Filter by search term if present
            if (searchTerm.trim()) {
                const search = searchTerm.toLowerCase().trim();
                exportData = exportData.filter(sub => 
                    (sub.name || '').toLowerCase().includes(search) ||
                    (sub.email || '').toLowerCase().includes(search) ||
                    (sub.phone || '').toLowerCase().includes(search)
                );
            }
            
            const csvContent = [
                'Name,Email,Phone,Status,Source,Subscribed Date,Last Activity,Tags',
                ...exportData.map(sub => 
                    `"${sub.name || ''}","${sub.email || ''}","${sub.phone || ''}","${sub.status || 'active'}","${sub.source || 'manual'}","${sub.subscribedDate || ''}","${sub.lastActivity || ''}","${(sub.tags || []).join('; ')}"`
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `subscribers_${selectedTab}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success(`Exported ${exportData.length} subscribers successfully`);
        } catch (error) {
            console.error('Error exporting subscribers:', error);
            toast.error('Failed to export subscribers');
        } finally {
            setIsExporting(false);
        }
    };

    const statusConfig = {
        active: { color: 'bg-green-100 text-green-800', label: 'Active', icon: '✓' },
        unsubscribed: { color: 'bg-gray-100 text-gray-800', label: 'Unsubscribed', icon: '✕' },
        bounced: { color: 'bg-red-100 text-red-800', label: 'Bounced', icon: '!' }
    };

    const sourceConfig = {
        website: { label: 'Website', color: 'bg-blue-100 text-blue-800' },
        'social-media': { label: 'Social Media', color: 'bg-purple-100 text-purple-800' },
        referral: { label: 'Referral', color: 'bg-green-100 text-green-800' },
        'email-campaign': { label: 'Email Campaign', color: 'bg-orange-100 text-orange-800' },
        manual: { label: 'Manual', color: 'bg-gray-100 text-gray-800' }
    };

    // Calculate subscriber counts from stats for tabs
    const subscriberCounts = {
        all: stats.total || 0,
        active: stats.active || 0,
        unsubscribed: stats.unsubscribed || 0,
        bounced: stats.bounced || 0
    };

    // Pagination component
    const PaginationControls = () => {
        if (pagination.totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total subscribers)
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasPrev}
                        onClick={() => handlePageChange(pagination.page - 1)}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasNext}
                        onClick={() => handlePageChange(pagination.page + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="mb-2 h-8 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-3xl">Subscribers</h1>
                    <p className="text-muted-foreground">Manage your email newsletter subscribers</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        <Download className="h-4 w-4" />
                        {isExporting ? 'Exporting...' : 'Export'}
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
                                <DialogDescription>Manually add a new subscriber to your newsletter.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={newSubscriber.name}
                                        onChange={(e) =>
                                            setNewSubscriber((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                        placeholder="Subscriber name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newSubscriber.email}
                                        onChange={(e) =>
                                            setNewSubscriber((prev) => ({ ...prev, email: e.target.value }))
                                        }
                                        placeholder="subscriber@example.com"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                                    <PhoneInput
                                        value={newSubscriber.phone}
                                        onChange={(value) =>
                                            setNewSubscriber((prev) => ({ ...prev, phone: value }))
                                        }
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="source">Source</Label>
                                    <Select
                                        value={newSubscriber.source}
                                        onValueChange={(value) =>
                                            setNewSubscriber((prev) => ({ ...prev, source: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manual">Manual</SelectItem>
                                            <SelectItem value="website">Website</SelectItem>
                                            <SelectItem value="social-media">Social Media</SelectItem>
                                            <SelectItem value="referral">Referral</SelectItem>
                                            <SelectItem value="email-campaign">Email Campaign</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddingSubscriber(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddSubscriber}
                                    disabled={!newSubscriber.email.trim() || !newSubscriber.name.trim() || isAddingSubscriber}
                                >
                                    {isAddingSubscriber ? 'Adding...' : 'Add Subscriber'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Total Subscribers</p>
                                <p className="font-bold text-2xl">{subscriberCounts.all}</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Active</p>
                                <p className="font-bold text-2xl text-green-600">{subscriberCounts.active}</p>
                            </div>
                            <UserPlus className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">This Week</p>
                                <p className="font-bold text-2xl text-blue-600">+{stats.recentSubscribers || 0}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Churn Rate</p>
                                <p className="font-bold text-2xl text-orange-600">{stats.churnRate || 0}%</p>
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
                        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
                        <Input
                            placeholder="Search subscribers..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
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
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
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
                                {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''} found
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {subscribers.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                                        <h3 className="mb-2 font-medium text-lg">No subscribers found</h3>
                                        <p className="mb-4 text-muted-foreground">
                                            {searchTerm
                                                ? `No subscribers match "${searchTerm}"`
                                                : 'Get started by adding your first subscriber'}
                                        </p>
                                        <Button onClick={() => setIsAddingSubscriber(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Subscriber
                                        </Button>
                                    </div>
                                ) : (
                                    subscribers.map((subscriber) => (
                                        <div
                                            key={subscriber.id}
                                            className="flex items-center gap-4 rounded-lg border p-4 transition-shadow hover:shadow-sm">
                                            <Avatar>
                                                <AvatarImage src={`https://avatar.vercel.sh/${subscriber.email}`} />
                                                <AvatarFallback>
                                                    {(subscriber.name || subscriber.email)
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <h3 className="font-medium">{subscriber.name || 'Anonymous'}</h3>
                                                    <Badge
                                                        className={
                                                            statusConfig[subscriber.status]?.color ||
                                                            statusConfig.active.color
                                                        }>
                                                        {statusConfig[subscriber.status]?.icon || '✓'}{' '}
                                                        {statusConfig[subscriber.status]?.label || 'Active'}
                                                    </Badge>
                                                </div>

                                                <p className="mb-2 text-muted-foreground text-sm">{subscriber.email}</p>
                                                
                                                {subscriber.phone && (
                                                    <p className="mb-2 text-muted-foreground text-sm">{subscriber.phone}</p>
                                                )}

                                                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Joined:{' '}
                                                        {subscriber.subscribedDate
                                                            ? new Date(subscriber.subscribedDate).toLocaleDateString()
                                                            : 'Unknown'}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        Last activity:{' '}
                                                        {subscriber.lastActivity
                                                            ? new Date(subscriber.lastActivity).toLocaleDateString()
                                                            : 'Never'}
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            sourceConfig[subscriber.source]?.color ||
                                                            sourceConfig.manual.color
                                                        }>
                                                        {sourceConfig[subscriber.source]?.label || 'Manual'}
                                                    </Badge>
                                                </div>

                                                {subscriber.tags && subscriber.tags.length > 0 && (
                                                    <div className="mt-2 flex gap-1">
                                                        {subscriber.tags.map((tag, index) => (
                                                            <Badge
                                                                key={`${tag}-${index}`}
                                                                variant="outline"
                                                                className="text-xs">
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
                                                        title="Unsubscribe"
                                                        onClick={() =>
                                                            handleUpdateSubscriberStatus(subscriber.id, 'unsubscribed')
                                                        }>
                                                        <UserMinus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {subscriber.status === 'unsubscribed' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        title="Reactivate"
                                                        onClick={() =>
                                                            handleUpdateSubscriberStatus(subscriber.id, 'active')
                                                        }>
                                                        <UserPlus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    title="Delete subscriber"
                                                    onClick={() => handleDeleteClick(subscriber)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            <PaginationControls />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Subscriber</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{subscriberToDelete?.name || subscriberToDelete?.email}"? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSubscriber}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
