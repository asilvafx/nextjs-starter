'use client';

import { BarChart3, Edit, Eye, Mail, MessageSquare, Phone, Plus, Send, Trash2, TrendingUp, Users, Inbox } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput } from '@/components/ui/phone-input';
import AdminHeader from '@/app/admin/components/AdminHeader';
import { 
    getAllCampaigns, 
    createCampaign, 
    updateCampaign, 
    deleteCampaign,
    getAllSubscribers,
    getAllTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getCampaignAnalytics
} from '@/lib/server/admin';

export default function NewsletterPage() {
    const [selectedTab, setSelectedTab] = useState('campaigns');
    const [campaigns, setCampaigns] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [analytics, setAnalytics] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        campaigns: { page: 1, limit: 10, total: 0 },
        subscribers: { page: 1, limit: 10, total: 0 },
        templates: { page: 1, limit: 10, total: 0 }
    });

    // Campaign states
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
    const [isEditingCampaign, setIsEditingCampaign] = useState(false);
    const [isSendingCampaign, setIsSendingCampaign] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [newCampaign, setNewCampaign] = useState({
        subject: '',
        content: '',
        previewText: '',
        type: 'email', // 'email' or 'sms'
        status: 'draft'
    });

    // SMS states
    const [isSendingSMS, setIsSendingSMS] = useState(false);
    const [newSMSCampaign, setNewSMSCampaign] = useState({
        subject: '',
        message: '',
        type: 'sms',
        status: 'draft'
    });

    // Send configuration
    const [sendConfig, setSendConfig] = useState({
        selectedSubscribers: [],
        selectAll: true,
        manualRecipients: [],
        testEmail: '',
        testPhone: '',
        testName: ''
    });

    // Template states
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        content: '',
        category: 'email',
        thumbnail: '📧'
    });

    // Fetch campaigns with pagination
    const fetchCampaigns = async (page = 1) => {
        try {
            const result = await getAllCampaigns(page, 10);
            if (result.success) {
                setCampaigns(result.data);
                setPagination(prev => ({
                    ...prev,
                    campaigns: { 
                        page, 
                        limit: 10, 
                        total: result.total || 0 
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            toast.error('Failed to load campaigns');
        }
    };

    // Fetch subscribers with pagination
    const fetchSubscribers = async (page = 1) => {
        try {
            const result = await getAllSubscribers(page, 10);
            if (result.success) {
                setSubscribers(result.data);
                setPagination(prev => ({
                    ...prev,
                    subscribers: { 
                        page, 
                        limit: 10, 
                        total: result.total || 0 
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching subscribers:', error);
            toast.error('Failed to load subscribers');
        }
    };

    // Fetch templates with pagination
    const fetchTemplates = async (page = 1) => {
        try {
            const result = await getAllTemplates(page, 10);
            if (result.success) {
                setTemplates(result.data);
                setPagination(prev => ({
                    ...prev,
                    templates: { 
                        page, 
                        limit: 10, 
                        total: result.total || 0 
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load templates');
        }
    };

    // Fetch analytics
    const fetchAnalytics = async () => {
        try {
            const result = await getCampaignAnalytics();
            if (result.success) {
                setAnalytics(result.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics');
        }
    };

    // Fetch all data
    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([
            fetchCampaigns(),
            fetchSubscribers(),
            fetchTemplates(),
            fetchAnalytics()
        ]);
        setIsLoading(false);
    };

    // Create campaign
    const handleCreateCampaign = async () => {
        if (!newCampaign.subject.trim()) {
            toast.error('Subject is required');
            return;
        }

        if (newCampaign.type === 'email' && !newCampaign.content.trim()) {
            toast.error('Content is required for email campaigns');
            return;
        }

        if (newCampaign.type === 'sms' && !newSMSCampaign.message.trim()) {
            toast.error('Message is required for SMS campaigns');
            return;
        }

        try {
            setIsCreatingCampaign(true);
            const campaignData = newCampaign.type === 'email' ? newCampaign : {
                ...newSMSCampaign,
                subject: newCampaign.subject
            };

            const result = await createCampaign(campaignData);
            if (result.success) {
                toast.success('Campaign created successfully');
                setNewCampaign({ subject: '', content: '', previewText: '', type: 'email', status: 'draft' });
                setNewSMSCampaign({ subject: '', message: '', type: 'sms', status: 'draft' });
                await fetchCampaigns();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            toast.error(error.message || 'Failed to create campaign');
        } finally {
            setIsCreatingCampaign(false);
        }
    };

    // Send email campaign
    const handleSendEmailCampaign = async (campaign) => {
        if (!campaign) return;

        const recipients = sendConfig.selectAll 
            ? subscribers.filter(s => s.status === 'active')
            : subscribers.filter(s => sendConfig.selectedSubscribers.includes(s.id));

        if (recipients.length === 0 && sendConfig.manualRecipients.length === 0) {
            toast.error('Please select at least one recipient');
            return;
        }

        try {
            setIsSendingCampaign(true);
            const response = await fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'newsletter',
                    campaign,
                    subscribers: recipients,
                    manualRecipients: sendConfig.manualRecipients
                })
            });

            const result = await response.json();
            if (result.success) {
                toast.success(`Campaign sent! ${result.data.sent} successful, ${result.data.failed} failed`);
                
                // Update campaign status
                await updateCampaign(campaign.id, { 
                    status: 'sent',
                    sentAt: new Date().toISOString(),
                    sentTo: result.data.total
                });
                await fetchCampaigns();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error sending campaign:', error);
            toast.error(error.message || 'Failed to send campaign');
        } finally {
            setIsSendingCampaign(false);
        }
    };

    // Send SMS campaign
    const handleSendSMSCampaign = async (campaign) => {
        if (!campaign) return;

        const recipients = sendConfig.selectAll 
            ? subscribers.filter(s => s.status === 'active' && s.phone)
            : subscribers.filter(s => sendConfig.selectedSubscribers.includes(s.id) && s.phone);

        if (recipients.length === 0 && sendConfig.manualRecipients.filter(r => r.phone).length === 0) {
            toast.error('Please select at least one recipient with a phone number');
            return;
        }

        try {
            setIsSendingSMS(true);
            const response = await fetch('/api/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'sms_campaign',
                    campaign,
                    subscribers: recipients,
                    manualRecipients: sendConfig.manualRecipients.filter(r => r.phone)
                })
            });

            const result = await response.json();
            if (result.success) {
                toast.success(`SMS campaign sent! ${result.data.sent} successful, ${result.data.failed} failed`);
                
                // Update campaign status
                await updateCampaign(campaign.id, { 
                    status: 'sent',
                    sentAt: new Date().toISOString(),
                    sentTo: result.data.total
                });
                await fetchCampaigns();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error sending SMS campaign:', error);
            toast.error(error.message || 'Failed to send SMS campaign');
        } finally {
            setIsSendingSMS(false);
        }
    };

    // Send test email
    const handleSendTestEmail = async (campaign) => {
        if (!sendConfig.testEmail) {
            toast.error('Test email is required');
            return;
        }

        try {
            const response = await fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'newsletter_test',
                    campaign,
                    testEmail: sendConfig.testEmail,
                    testName: sendConfig.testName
                })
            });

            const result = await response.json();
            if (result.success) {
                toast.success('Test email sent successfully');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error sending test email:', error);
            toast.error(error.message || 'Failed to send test email');
        }
    };

    // Send test SMS
    const handleSendTestSMS = async (campaign) => {
        if (!sendConfig.testPhone) {
            toast.error('Test phone number is required');
            return;
        }

        try {
            const response = await fetch('/api/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'sms_test',
                    campaign,
                    testPhone: sendConfig.testPhone,
                    testName: sendConfig.testName
                })
            });

            const result = await response.json();
            if (result.success) {
                toast.success('Test SMS sent successfully');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error sending test SMS:', error);
            toast.error(error.message || 'Failed to send test SMS');
        }
    };

    // Delete campaign
    const handleDeleteCampaign = async (id) => {
        try {
            const result = await deleteCampaign(id);
            if (result.success) {
                toast.success('Campaign deleted successfully');
                await fetchCampaigns();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error deleting campaign:', error);
            toast.error(error.message || 'Failed to delete campaign');
        }
    };

    // Create template
    const handleCreateTemplate = async () => {
        if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
            toast.error('Template name and content are required');
            return;
        }

        try {
            setIsCreatingTemplate(true);
            const result = await createTemplate(newTemplate);
            if (result.success) {
                toast.success('Template created successfully');
                setNewTemplate({ name: '', description: '', content: '', category: 'email', thumbnail: '📧' });
                await fetchTemplates();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error creating template:', error);
            toast.error(error.message || 'Failed to create template');
        } finally {
            setIsCreatingTemplate(false);
        }
    };

    // Delete template
    const handleDeleteTemplate = async (id) => {
        try {
            const result = await deleteTemplate(id);
            if (result.success) {
                toast.success('Template deleted successfully');
                await fetchTemplates();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error(error.message || 'Failed to delete template');
        }
    };

    // Add manual recipient
    const addManualRecipient = () => {
        setSendConfig(prev => ({
            ...prev,
            manualRecipients: [...prev.manualRecipients, { email: '', phone: '', name: '' }]
        }));
    };

    // Remove manual recipient
    const removeManualRecipient = (index) => {
        setSendConfig(prev => ({
            ...prev,
            manualRecipients: prev.manualRecipients.filter((_, i) => i !== index)
        }));
    };

    // Update manual recipient
    const updateManualRecipient = (index, field, value) => {
        setSendConfig(prev => ({
            ...prev,
            manualRecipients: prev.manualRecipients.map((recipient, i) => 
                i === index ? { ...recipient, [field]: value } : recipient
            )
        }));
    };

    // Pagination component
    const PaginationControls = ({ type, onPageChange }) => {
        const paginationData = pagination[type];
        const totalPages = Math.ceil(paginationData.total / paginationData.limit);

        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                    Page {paginationData.page} of {totalPages} ({paginationData.total} total)
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={paginationData.page <= 1}
                        onClick={() => onPageChange(paginationData.page - 1)}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={paginationData.page >= totalPages}
                        onClick={() => onPageChange(paginationData.page + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading) {
        return <NewsletterSkeleton />;
    }

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Newsletter" 
                description="Manage email and SMS campaigns, subscribers, and templates"
            />

            {/* Analytics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalCampaigns || 0}</div>
                        <p className="text-xs text-muted-foreground">Email & SMS campaigns</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.activeSubscribers || 0}</div>
                        <p className="text-xs text-muted-foreground">Subscribed users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sent This Month</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.sentThisMonth || 0}</div>
                        <p className="text-xs text-muted-foreground">Campaigns sent</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.averageOpenRate || '0'}%</div>
                        <p className="text-xs text-muted-foreground">Average engagement</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="sms">SMS Campaigns</TabsTrigger>
                    <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                {/* Email Campaigns Tab */}
                <TabsContent value="campaigns" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Email Campaigns</h2>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Campaign
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create Email Campaign</DialogTitle>
                                    <DialogDescription>
                                        Create a new email campaign to send to your subscribers
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="campaign-subject">Subject</Label>
                                        <Input
                                            id="campaign-subject"
                                            value={newCampaign.subject}
                                            onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                                            placeholder="Enter campaign subject"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="campaign-preview">Preview Text</Label>
                                        <Input
                                            id="campaign-preview"
                                            value={newCampaign.previewText}
                                            onChange={(e) => setNewCampaign(prev => ({ ...prev, previewText: e.target.value }))}
                                            placeholder="Preview text shown in email clients"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="campaign-content">Content</Label>
                                        <Textarea
                                            id="campaign-content"
                                            value={newCampaign.content}
                                            onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                                            placeholder="Email content (HTML supported)"
                                            rows={8}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button 
                                        onClick={handleCreateCampaign}
                                        disabled={isCreatingCampaign}
                                    >
                                        {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {campaigns.filter(c => c.type !== 'sms').length === 0 ? (
                            <Card>
                                <CardContent className="flex items-center justify-center p-12">
                                    <div className="text-center">
                                        <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <h3 className="text-lg font-medium">No email campaigns yet</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Create your first email campaign to start engaging with your subscribers
                                        </p>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Create Your First Campaign
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Create Email Campaign</DialogTitle>
                                                    <DialogDescription>
                                                        Create a new email campaign to send to your subscribers
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="campaign-subject">Subject</Label>
                                                        <Input
                                                            id="campaign-subject"
                                                            value={newCampaign.subject}
                                                            onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                                                            placeholder="Enter campaign subject"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="campaign-preview">Preview Text</Label>
                                                        <Input
                                                            id="campaign-preview"
                                                            value={newCampaign.previewText}
                                                            onChange={(e) => setNewCampaign(prev => ({ ...prev, previewText: e.target.value }))}
                                                            placeholder="Preview text shown in email clients"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="campaign-content">Content</Label>
                                                        <Textarea
                                                            id="campaign-content"
                                                            value={newCampaign.content}
                                                            onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                                                            placeholder="Email content (HTML supported)"
                                                            rows={8}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button 
                                                        onClick={handleCreateCampaign}
                                                        disabled={isCreatingCampaign}
                                                    >
                                                        {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            campaigns.filter(c => c.type !== 'sms').map((campaign) => (
                            <Card key={campaign.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{campaign.subject}</CardTitle>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                                                {campaign.status}
                                            </Badge>
                                            <div className="flex space-x-1">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Preview Campaign</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <strong>Subject:</strong> {campaign.subject}
                                                            </div>
                                                            {campaign.previewText && (
                                                                <div>
                                                                    <strong>Preview:</strong> {campaign.previewText}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <strong>Content:</strong>
                                                                <div 
                                                                    className="mt-2 p-4 border rounded bg-gray-50 max-h-96 overflow-y-auto"
                                                                    dangerouslySetInnerHTML={{ __html: campaign.content }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                {campaign.status === 'draft' && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Send Campaign: {campaign.subject}</DialogTitle>
                                                                <DialogDescription>
                                                                    Configure recipients and send your email campaign
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            
                                                            <div className="space-y-6">
                                                                {/* Test Email Section */}
                                                                <div className="space-y-3">
                                                                    <h4 className="font-medium">Test Email</h4>
                                                                    <div className="flex space-x-2">
                                                                        <Input
                                                                            placeholder="Test email address"
                                                                            value={sendConfig.testEmail}
                                                                            onChange={(e) => setSendConfig(prev => ({ ...prev, testEmail: e.target.value }))}
                                                                        />
                                                                        <Input
                                                                            placeholder="Test name (optional)"
                                                                            value={sendConfig.testName}
                                                                            onChange={(e) => setSendConfig(prev => ({ ...prev, testName: e.target.value }))}
                                                                        />
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => handleSendTestEmail(campaign)}
                                                                        >
                                                                            Send Test
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Recipients Section */}
                                                                <div className="space-y-3">
                                                                    <h4 className="font-medium">Recipients</h4>
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id="select-all"
                                                                                checked={sendConfig.selectAll}
                                                                                onCheckedChange={(checked) => 
                                                                                    setSendConfig(prev => ({ ...prev, selectAll: checked }))
                                                                                }
                                                                            />
                                                                            <Label htmlFor="select-all">
                                                                                Send to all active subscribers ({subscribers.filter(s => s.status === 'active').length})
                                                                            </Label>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Manual Recipients */}
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className="font-medium">Additional Recipients</h4>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={addManualRecipient}
                                                                        >
                                                                            <Plus className="h-4 w-4 mr-1" />
                                                                            Add
                                                                        </Button>
                                                                    </div>
                                                                    {sendConfig.manualRecipients.map((recipient, index) => (
                                                                        <div key={index} className="flex space-x-2">
                                                                            <Input
                                                                                placeholder="Email"
                                                                                value={recipient.email}
                                                                                onChange={(e) => updateManualRecipient(index, 'email', e.target.value)}
                                                                            />
                                                                            <Input
                                                                                placeholder="Name (optional)"
                                                                                value={recipient.name}
                                                                                onChange={(e) => updateManualRecipient(index, 'name', e.target.value)}
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => removeManualRecipient(index)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <DialogFooter>
                                                                <Button
                                                                    onClick={() => handleSendEmailCampaign(campaign)}
                                                                    disabled={isSendingCampaign}
                                                                    className="w-full"
                                                                >
                                                                    {isSendingCampaign ? 'Sending...' : 'Send Campaign'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <CardDescription>
                                        {campaign.previewText && <div>{campaign.previewText}</div>}
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Created: {new Date(campaign.createdAt).toLocaleDateString()}
                                            {campaign.sentAt && ` • Sent: ${new Date(campaign.sentAt).toLocaleDateString()}`}
                                            {campaign.sentTo && ` • Recipients: ${campaign.sentTo}`}
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            ))
                        )}
                    </div>

                    <PaginationControls 
                        type="campaigns" 
                        onPageChange={fetchCampaigns} 
                    />
                </TabsContent>

                {/* SMS Campaigns Tab */}
                <TabsContent value="sms" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">SMS Campaigns</h2>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create SMS Campaign
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create SMS Campaign</DialogTitle>
                                    <DialogDescription>
                                        Create a new SMS campaign to send to your subscribers
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="sms-subject">Campaign Name</Label>
                                        <Input
                                            id="sms-subject"
                                            value={newCampaign.subject}
                                            onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value, type: 'sms' }))}
                                            placeholder="Enter campaign name"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="sms-message">SMS Message</Label>
                                        <Textarea
                                            id="sms-message"
                                            value={newSMSCampaign.message}
                                            onChange={(e) => setNewSMSCampaign(prev => ({ ...prev, message: e.target.value }))}
                                            placeholder="SMS message content (160 characters recommended)"
                                            rows={4}
                                            maxLength={300}
                                        />
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {newSMSCampaign.message.length}/300 characters
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button 
                                        onClick={handleCreateCampaign}
                                        disabled={isCreatingCampaign}
                                    >
                                        {isCreatingCampaign ? 'Creating...' : 'Create SMS Campaign'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {campaigns.filter(c => c.type === 'sms').length === 0 ? (
                            <Card>
                                <CardContent className="flex items-center justify-center p-12">
                                    <div className="text-center">
                                        <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <h3 className="text-lg font-medium">No SMS campaigns yet</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Create your first SMS campaign to reach your subscribers directly
                                        </p>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Create Your First SMS Campaign
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Create SMS Campaign</DialogTitle>
                                                    <DialogDescription>
                                                        Create a new SMS campaign to send to your subscribers
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="sms-subject">Campaign Name</Label>
                                                        <Input
                                                            id="sms-subject"
                                                            value={newCampaign.subject}
                                                            onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value, type: 'sms' }))}
                                                            placeholder="Enter campaign name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="sms-message">SMS Message</Label>
                                                        <Textarea
                                                            id="sms-message"
                                                            value={newSMSCampaign.message}
                                                            onChange={(e) => setNewSMSCampaign(prev => ({ ...prev, message: e.target.value }))}
                                                            placeholder="SMS message content (160 characters recommended)"
                                                            rows={4}
                                                            maxLength={300}
                                                        />
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            {newSMSCampaign.message.length}/300 characters
                                                        </div>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button 
                                                        onClick={handleCreateCampaign}
                                                        disabled={isCreatingCampaign}
                                                    >
                                                        {isCreatingCampaign ? 'Creating...' : 'Create SMS Campaign'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            campaigns.filter(c => c.type === 'sms').map((campaign) => (
                            <Card key={campaign.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center">
                                            <MessageSquare className="h-5 w-5 mr-2" />
                                            {campaign.subject}
                                        </CardTitle>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                                                {campaign.status}
                                            </Badge>
                                            <div className="flex space-x-1">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>SMS Preview</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div className="p-4 border rounded bg-gray-50">
                                                                <div className="text-sm font-medium mb-2">SMS Message:</div>
                                                                <div className="whitespace-pre-wrap">{campaign.message || campaign.content}</div>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Characters: {(campaign.message || campaign.content || '').length}
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                {campaign.status === 'draft' && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Send SMS Campaign: {campaign.subject}</DialogTitle>
                                                                <DialogDescription>
                                                                    Configure recipients and send your SMS campaign
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            
                                                            <div className="space-y-6">
                                                                {/* Test SMS Section */}
                                                                <div className="space-y-3">
                                                                    <h4 className="font-medium">Test SMS</h4>
                                                                    <div className="flex space-x-2">
                                                                        <PhoneInput
                                                                            value={sendConfig.testPhone}
                                                                            onChange={(value) => setSendConfig(prev => ({ ...prev, testPhone: value }))}
                                                                            placeholder="Test phone number"
                                                                        />
                                                                        <Input
                                                                            placeholder="Test name (optional)"
                                                                            value={sendConfig.testName}
                                                                            onChange={(e) => setSendConfig(prev => ({ ...prev, testName: e.target.value }))}
                                                                        />
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => handleSendTestSMS(campaign)}
                                                                        >
                                                                            Send Test
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Recipients Section */}
                                                                <div className="space-y-3">
                                                                    <h4 className="font-medium">Recipients</h4>
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id="select-all-sms"
                                                                                checked={sendConfig.selectAll}
                                                                                onCheckedChange={(checked) => 
                                                                                    setSendConfig(prev => ({ ...prev, selectAll: checked }))
                                                                                }
                                                                            />
                                                                            <Label htmlFor="select-all-sms">
                                                                                Send to all subscribers with phone numbers 
                                                                                ({subscribers.filter(s => s.status === 'active' && s.phone).length})
                                                                            </Label>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Manual Recipients */}
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className="font-medium">Additional Recipients</h4>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={addManualRecipient}
                                                                        >
                                                                            <Plus className="h-4 w-4 mr-1" />
                                                                            Add
                                                                        </Button>
                                                                    </div>
                                                                    {sendConfig.manualRecipients.map((recipient, index) => (
                                                                        <div key={index} className="flex space-x-2">
                                                                            <PhoneInput
                                                                                value={recipient.phone}
                                                                                onChange={(value) => updateManualRecipient(index, 'phone', value)}
                                                                                placeholder="Phone number"
                                                                            />
                                                                            <Input
                                                                                placeholder="Name (optional)"
                                                                                value={recipient.name}
                                                                                onChange={(e) => updateManualRecipient(index, 'name', e.target.value)}
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => removeManualRecipient(index)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <DialogFooter>
                                                                <Button
                                                                    onClick={() => handleSendSMSCampaign(campaign)}
                                                                    disabled={isSendingSMS}
                                                                    className="w-full"
                                                                >
                                                                    {isSendingSMS ? 'Sending...' : 'Send SMS Campaign'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <CardDescription>
                                        <div className="text-sm">
                                            {campaign.message || campaign.content}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-2">
                                            Created: {new Date(campaign.createdAt).toLocaleDateString()}
                                            {campaign.sentAt && ` • Sent: ${new Date(campaign.sentAt).toLocaleDateString()}`}
                                            {campaign.sentTo && ` • Recipients: ${campaign.sentTo}`}
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            ))
                        )}
                    </div>

                    <PaginationControls 
                        type="campaigns" 
                        onPageChange={fetchCampaigns} 
                    />
                </TabsContent>

                {/* Subscribers Tab */}
                <TabsContent value="subscribers" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Subscribers</h2>
                        <div className="text-sm text-muted-foreground">
                            Total: {pagination.subscribers.total} subscribers
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {subscribers.length === 0 ? (
                            <Card>
                                <CardContent className="flex items-center justify-center p-12">
                                    <div className="text-center">
                                        <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <h3 className="text-lg font-medium">No subscribers yet</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Start building your audience by adding subscribers to your mailing list
                                        </p>
                                        <Button variant="outline">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add First Subscriber
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            subscribers.map((subscriber) => (
                            <Card key={subscriber.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{subscriber.name || subscriber.email}</CardTitle>
                                            <CardDescription>
                                                <div>{subscriber.email}</div>
                                                {subscriber.phone && <div className="flex items-center mt-1"><Phone className="h-3 w-3 mr-1" />{subscriber.phone}</div>}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={subscriber.status === 'active' ? 'default' : 'secondary'}>
                                                {subscriber.status}
                                            </Badge>
                                            <div className="text-sm text-muted-foreground">
                                                Joined: {new Date(subscriber.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                            ))
                        )}
                    </div>

                    <PaginationControls 
                        type="subscribers" 
                        onPageChange={fetchSubscribers} 
                    />
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Email Templates</h2>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Template
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create Email Template</DialogTitle>
                                    <DialogDescription>
                                        Create a reusable email template for your campaigns
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="template-name">Template Name</Label>
                                        <Input
                                            id="template-name"
                                            value={newTemplate.name}
                                            onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter template name"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="template-description">Description</Label>
                                        <Input
                                            id="template-description"
                                            value={newTemplate.description}
                                            onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Brief description of the template"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="template-category">Category</Label>
                                        <Select
                                            value={newTemplate.category}
                                            onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="promotional">Promotional</SelectItem>
                                                <SelectItem value="onboarding">Onboarding</SelectItem>
                                                <SelectItem value="notification">Notification</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="template-content">HTML Content</Label>
                                        <Textarea
                                            id="template-content"
                                            value={newTemplate.content}
                                            onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                                            placeholder="Template HTML content"
                                            rows={8}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button 
                                        onClick={handleCreateTemplate}
                                        disabled={isCreatingTemplate}
                                    >
                                        {isCreatingTemplate ? 'Creating...' : 'Create Template'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {templates.length === 0 ? (
                            <div className="col-span-full">
                                <Card>
                                    <CardContent className="flex items-center justify-center p-12">
                                        <div className="text-center">
                                            <Inbox className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                            <h3 className="text-lg font-medium">No email templates yet</h3>
                                            <p className="text-muted-foreground mb-4">
                                                Create reusable email templates to streamline your campaign creation process
                                            </p>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button>
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Create Your First Template
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Create Email Template</DialogTitle>
                                                        <DialogDescription>
                                                            Create a reusable email template for your campaigns
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label htmlFor="template-name">Template Name</Label>
                                                            <Input
                                                                id="template-name"
                                                                value={newTemplate.name}
                                                                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                                                placeholder="Enter template name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="template-description">Description</Label>
                                                            <Input
                                                                id="template-description"
                                                                value={newTemplate.description}
                                                                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                                                                placeholder="Brief description of the template"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="template-category">Category</Label>
                                                            <Select
                                                                value={newTemplate.category}
                                                                onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select category" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="email">Email</SelectItem>
                                                                    <SelectItem value="promotional">Promotional</SelectItem>
                                                                    <SelectItem value="onboarding">Onboarding</SelectItem>
                                                                    <SelectItem value="notification">Notification</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="template-content">HTML Content</Label>
                                                            <Textarea
                                                                id="template-content"
                                                                value={newTemplate.content}
                                                                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                                                                placeholder="HTML template content"
                                                                rows={8}
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button 
                                                            onClick={handleCreateTemplate}
                                                            disabled={isCreatingTemplate}
                                                        >
                                                            {isCreatingTemplate ? 'Creating...' : 'Create Template'}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            templates.map((template) => (
                            <Card key={template.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="text-2xl">{template.thumbnail}</div>
                                            <div>
                                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                                <CardDescription>{template.description}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex space-x-1">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Template Preview: {template.name}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div 
                                                            className="border rounded bg-gray-50 max-h-96 overflow-y-auto p-4"
                                                            dangerouslySetInnerHTML={{ __html: template.content }}
                                                        />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteTemplate(template.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <Badge variant="outline">{template.category}</Badge>
                                    </div>
                                </CardHeader>
                            </Card>
                            ))
                        )}
                    </div>

                    <PaginationControls 
                        type="templates" 
                        onPageChange={fetchTemplates} 
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Newsletter Skeleton Component
function NewsletterSkeleton() {
    return (
        <div className="space-y-6">
            <AdminHeader 
                title="Newsletter" 
                description="Manage email and SMS campaigns, subscribers, and templates"
            />
            
            {/* Analytics Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            {/* Tabs Skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-8 w-8" />
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}