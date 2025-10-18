"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Mail, 
  Send, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { getAll, create, update, remove } from "@/lib/client/query";
import { toast } from "sonner";

export default function NewsletterPage() {
  const [selectedTab, setSelectedTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isEditingCampaign, setIsEditingCampaign] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [isPreviewingCampaign, setIsPreviewingCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [newCampaign, setNewCampaign] = useState({
    subject: '',
    content: '',
    previewText: ''
  });
  const [sendConfig, setSendConfig] = useState({
    senderName: '',
    senderEmail: '',
    selectedSubscribers: [],
    selectAll: true
  });

  // Fetch data from database
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [campaignResponse, subscriberResponse, templateResponse] = await Promise.all([
        getAll('newsletter_campaigns'),
        getAll('newsletter_subscribers'),
        getAll('newsletter_templates')
      ]);
      
      setCampaigns(campaignResponse?.success ? campaignResponse.data : []);
      setSubscribers(subscriberResponse?.success ? subscriberResponse.data : []);
      setTemplates(templateResponse?.success ? templateResponse.data : []);
      
      // Create default templates if none exist
      if (!templateResponse?.success || templateResponse.data.length === 0) {
        await createDefaultTemplates();
      }
    } catch (error) {
      console.error('Error fetching newsletter data:', error);
      toast.error('Failed to load newsletter data');
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultTemplates = async () => {
    const defaultTemplates = [
      {
        name: "Welcome Newsletter",
        description: "Welcome new subscribers to your newsletter",
        thumbnail: "📧",
        category: "onboarding",
        content: "<h2>Welcome to our newsletter!</h2><p>Thank you for subscribing. We're excited to share updates with you.</p>",
        createdAt: new Date().toISOString()
      },
      {
        name: "Product Update",
        description: "Share product updates and new features",
        thumbnail: "🚀", 
        category: "promotional",
        content: "<h2>New Product Updates</h2><p>Check out our latest features and improvements.</p>",
        createdAt: new Date().toISOString()
      },
      {
        name: "Monthly Digest",
        description: "Regular monthly newsletter template",
        thumbnail: "📰",
        category: "newsletter",
        content: "<h2>Monthly Newsletter</h2><p>Here's what happened this month...</p>",
        createdAt: new Date().toISOString()
      }
    ];

    for (const template of defaultTemplates) {
      try {
        await create(template, 'newsletter_templates');
      } catch (error) {
        console.error('Error creating template:', error);
      }
    }
    
    // Refresh templates
    const templateResponse = await getAll('newsletter_templates');
    setTemplates(templateResponse?.success ? templateResponse.data : []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusConfig = {
    sent: { color: "bg-green-100 text-green-800", label: "Sent" },
    draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
    scheduled: { color: "bg-blue-100 text-blue-800", label: "Scheduled" },
    sending: { color: "bg-blue-100 text-blue-800", label: "Sending" }
  };

  const handleCreateCampaign = async () => {
    try {
      const campaignData = {
        ...newCampaign,
        status: 'draft',
        recipients: 0,
        openRate: 0,
        clickRate: 0,
        createdAt: new Date().toISOString()
      };
      
      const response = await create(campaignData, 'newsletter_campaigns');
      const newCampaignWithId = { ...campaignData, id: response.id || Date.now() };
      
      // Update state locally instead of refetching
      setCampaigns(prev => [newCampaignWithId, ...prev]);
      
      toast.success('Campaign created successfully');
      setIsCreatingCampaign(false);
      setNewCampaign({ subject: '', content: '', previewText: '' });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const handleEditCampaign = async () => {
    try {
      const updatedData = {
        subject: newCampaign.subject,
        content: newCampaign.content,
        previewText: newCampaign.previewText,
        updatedAt: new Date().toISOString()
      };
      
      await update(selectedCampaign.id, updatedData, 'newsletter_campaigns');
      
      // Update state locally
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === selectedCampaign.id 
          ? { ...campaign, ...updatedData }
          : campaign
      ));
      
      toast.success('Campaign updated successfully');
      setIsEditingCampaign(false);
      setSelectedCampaign(null);
      setNewCampaign({ subject: '', content: '', previewText: '' });
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const handlePreviewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setIsPreviewingCampaign(true);
  };

  const handleEditCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setNewCampaign({
      subject: campaign.subject || '',
      content: campaign.content || '',
      previewText: campaign.previewText || ''
    });
    setIsEditingCampaign(true);
  };

  const handleSendCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setSendConfig({
      senderName: '',
      senderEmail: '',
      selectedSubscribers: [],
      selectAll: true
    });
    setIsSendingCampaign(true);
  };

  const handleTestSend = async () => {
    try {
      if (!selectedCampaign || !sendConfig.senderEmail.trim()) {
        toast.error('Please enter a sender email for testing');
        return;
      }

      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'newsletter_test',
          campaign: selectedCampaign,
          testEmail: sendConfig.senderEmail,
          testName: sendConfig.senderName || 'Test User',
          senderName: sendConfig.senderName,
          senderEmail: sendConfig.senderEmail
        })
      });

      toast.success(`Test email sent to ${sendConfig.senderEmail}`);
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    }
  };

  const handleSendCampaign = async () => {
    try {
      if (!selectedCampaign) return;

      // Update campaign status to sending
      setCampaigns(prev => prev.map(c => 
        c.id === selectedCampaign.id ? { ...c, status: 'sending' } : c
      ));
      await update(selectedCampaign.id, { status: 'sending' }, 'newsletter_campaigns');
      
      // Get subscribers to send to
      const recipientList = sendConfig.selectAll 
        ? subscribers.filter(s => s.status === 'active')
        : sendConfig.selectedSubscribers;
      
      if (recipientList.length === 0) {
        toast.error('No subscribers selected');
        return;
      }

      // Send newsletter via API
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'newsletter',
          campaign: selectedCampaign,
          subscribers: recipientList,
          senderName: sendConfig.senderName,
          senderEmail: sendConfig.senderEmail
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update campaign status and stats locally
        const updatedCampaign = {
          status: 'sent',
          sentDate: new Date().toISOString(),
          recipients: result.data?.sent || recipientList.length
        };
        
        setCampaigns(prev => prev.map(c => 
          c.id === selectedCampaign.id ? { ...c, ...updatedCampaign } : c
        ));
        
        await update(selectedCampaign.id, updatedCampaign, 'newsletter_campaigns');
        
        toast.success(`Newsletter sent to ${result.data?.sent || recipientList.length} subscribers`);
        setIsSendingCampaign(false);
        setSelectedCampaign(null);
      } else {
        throw new Error('Failed to send newsletter');
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send newsletter');
      
      // Reset status on error
      if (selectedCampaign) {
        setCampaigns(prev => prev.map(c => 
          c.id === selectedCampaign.id ? { ...c, status: 'draft' } : c
        ));
        await update(selectedCampaign.id, { status: 'draft' }, 'newsletter_campaigns');
      }
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      await remove(campaignId, 'newsletter_campaigns');
      
      // Update state locally
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      
      toast.success('Campaign deleted successfully');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const handleUseTemplate = async (template) => {
    setNewCampaign({
      subject: `Newsletter - ${template.name}`,
      content: template.content,
      previewText: template.description
    });
    setIsCreatingCampaign(true);
  };

  // Calculate stats
  const totalSubscribers = subscribers.length;
  const sentCampaigns = campaigns.filter(c => c.status === 'sent');
  const avgOpenRate = sentCampaigns.length > 0 
    ? (sentCampaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / sentCampaigns.length).toFixed(1)
    : 0;
  const avgClickRate = sentCampaigns.length > 0
    ? (sentCampaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / sentCampaigns.length).toFixed(1) 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
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
          <h1 className="text-3xl font-bold">Newsletter</h1>
          <p className="text-muted-foreground">
            Create and manage your email campaigns
          </p>
        </div>
        <Dialog open={isCreatingCampaign} onOpenChange={setIsCreatingCampaign}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Create a new newsletter campaign to send to your subscribers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input 
                  id="subject"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject"
                />
              </div>
              <div>
                <Label htmlFor="previewText">Preview Text</Label>
                <Input 
                  id="previewText"
                  value={newCampaign.previewText}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, previewText: e.target.value }))}
                  placeholder="Brief description shown in email preview"
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea 
                  id="content"
                  value={newCampaign.content}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Newsletter content (HTML supported)"
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatingCampaign(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign} disabled={!newCampaign.subject.trim()}>
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Campaign Dialog */}
        <Dialog open={isEditingCampaign} onOpenChange={setIsEditingCampaign}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription>
                Update your newsletter campaign details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-subject">Subject Line</Label>
                <Input 
                  id="edit-subject"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject"
                />
              </div>
              <div>
                <Label htmlFor="edit-previewText">Preview Text</Label>
                <Input 
                  id="edit-previewText"
                  value={newCampaign.previewText}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, previewText: e.target.value }))}
                  placeholder="Brief description shown in email preview"
                />
              </div>
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea 
                  id="edit-content"
                  value={newCampaign.content}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Newsletter content (HTML supported)"
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditingCampaign(false);
                setSelectedCampaign(null);
                setNewCampaign({ subject: '', content: '', previewText: '' });
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditCampaign} disabled={!newCampaign.subject.trim()}>
                Update Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Campaign Dialog */}
        <Dialog open={isPreviewingCampaign} onOpenChange={setIsPreviewingCampaign}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Campaign Preview</DialogTitle>
              <DialogDescription>
                {selectedCampaign?.subject || 'Untitled Campaign'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  <strong>Subject:</strong> {selectedCampaign?.subject || 'No subject'}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  <strong>Preview Text:</strong> {selectedCampaign?.previewText || 'No preview text'}
                </div>
                <div className="border-t pt-4">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedCampaign?.content || 'No content available' 
                    }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewingCampaign(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsPreviewingCampaign(false);
                handleSendCampaignClick(selectedCampaign);
              }}>
                Send Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Campaign Dialog */}
        <Dialog open={isSendingCampaign} onOpenChange={setIsSendingCampaign}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Campaign</DialogTitle>
              <DialogDescription>
                Configure and send "{selectedCampaign?.subject}" to your subscribers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Sender Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sender Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="senderName">Sender Name</Label>
                    <Input 
                      id="senderName"
                      value={sendConfig.senderName}
                      onChange={(e) => setSendConfig(prev => ({ ...prev, senderName: e.target.value }))}
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="senderEmail">Sender Email</Label>
                    <Input 
                      id="senderEmail"
                      type="email"
                      value={sendConfig.senderEmail}
                      onChange={(e) => setSendConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                      placeholder="sender@yourdomain.com"
                    />
                  </div>
                </div>
              </div>

              {/* Recipients */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recipients</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={sendConfig.selectAll}
                      onChange={(e) => {
                        setSendConfig(prev => ({
                          ...prev,
                          selectAll: e.target.checked,
                          selectedSubscribers: e.target.checked ? [] : prev.selectedSubscribers
                        }));
                      }}
                      className="rounded"
                    />
                    <Label htmlFor="selectAll">
                      Send to all active subscribers ({subscribers.filter(s => s.status === 'active').length})
                    </Label>
                  </div>
                  
                  {!sendConfig.selectAll && (
                    <div className="border rounded p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {subscribers.filter(s => s.status === 'active').map(subscriber => (
                          <div key={subscriber.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`subscriber-${subscriber.id}`}
                              checked={sendConfig.selectedSubscribers.some(s => s.id === subscriber.id)}
                              onChange={(e) => {
                                setSendConfig(prev => ({
                                  ...prev,
                                  selectedSubscribers: e.target.checked
                                    ? [...prev.selectedSubscribers, subscriber]
                                    : prev.selectedSubscribers.filter(s => s.id !== subscriber.id)
                                }));
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={`subscriber-${subscriber.id}`} className="text-sm">
                              {subscriber.name || 'Anonymous'} ({subscriber.email})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Test Send Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Test Send</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleTestSend}
                    disabled={!sendConfig.senderEmail.trim()}
                  >
                    Send Test Email
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send a test email to {sendConfig.senderEmail || 'your email'} before sending to all subscribers.
                </p>
              </div>

              {/* Campaign Summary */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">Campaign Summary</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Subject:</strong> {selectedCampaign?.subject}</div>
                  <div><strong>Recipients:</strong> {sendConfig.selectAll 
                    ? subscribers.filter(s => s.status === 'active').length 
                    : sendConfig.selectedSubscribers.length} subscribers</div>
                  <div><strong>Status:</strong> Ready to send</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsSendingCampaign(false);
                setSelectedCampaign(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendCampaign}
                disabled={
                  (!sendConfig.selectAll && sendConfig.selectedSubscribers.length === 0) ||
                  (sendConfig.selectAll && subscribers.filter(s => s.status === 'active').length === 0)
                }
              >
                Send Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold">{totalSubscribers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Campaigns Sent</p>
                <p className="text-2xl font-bold">{sentCampaigns.length}</p>
              </div>
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Open Rate</p>
                <p className="text-2xl font-bold">{avgOpenRate}%</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Click Rate</p>
                <p className="text-2xl font-bold">{avgClickRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>
                Manage your email marketing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first newsletter campaign to get started
                    </p>
                    <Button onClick={() => setIsCreatingCampaign(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{campaign.subject || 'Untitled Campaign'}</h3>
                          <Badge className={statusConfig[campaign.status]?.color || statusConfig.draft.color}>
                            {statusConfig[campaign.status]?.label || 'Draft'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {campaign.previewText || 'No preview text'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {campaign.status === 'sent' && (
                            <>
                              <span>{campaign.recipients || 0} recipients</span>
                              <span>{campaign.openRate || 0}% open rate</span>
                              <span>{campaign.clickRate || 0}% click rate</span>
                              <span>Sent: {campaign.sentDate ? new Date(campaign.sentDate).toLocaleDateString() : 'Unknown'}</span>
                            </>
                          )}
                          {campaign.status === 'scheduled' && (
                            <>
                              <span>{campaign.recipients || 0} recipients</span>
                              <span>Scheduled: {campaign.sentDate ? new Date(campaign.sentDate).toLocaleDateString() : 'Unknown'}</span>
                            </>
                          )}
                          {(campaign.status === 'draft' || campaign.status === 'sending') && (
                            <span>
                              {campaign.status === 'sending' ? 'Sending...' : 'Draft saved'}
                              {campaign.createdAt && ` - ${new Date(campaign.createdAt).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePreviewCampaign(campaign)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCampaignClick(campaign)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(campaign.status === 'draft' || campaign.status === 'sent') && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleSendCampaignClick(campaign)}
                            disabled={subscribers.filter(s => s.status === 'active').length === 0}
                            title="Send"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Edit className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No templates available</h3>
                <p className="text-muted-foreground">
                  Templates will be created automatically when you use the system
                </p>
              </div>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{template.thumbnail || '📧'}</span>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.description}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Preview
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => handleUseTemplate(template)}>
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Detailed analytics for your email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Detailed analytics charts and reports would be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}