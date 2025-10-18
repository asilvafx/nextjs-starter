'use client';

import { BarChart3, Edit, Eye, Mail, Plus, Send, Trash2, TrendingUp, Users } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { create, getAll, remove, update } from '@/lib/client/query';

export default function NewsletterPage() {
    const [selectedTab, setSelectedTab] = useState('campaigns');
    const [campaigns, setCampaigns] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
    const [isEditingCampaign, setIsEditingCampaign] = useState(false);
    const [isSendingCampaign, setIsSendingCampaign] = useState(false);
    const [isPreviewingCampaign, setIsPreviewingCampaign] = useState(false);
    const [isPreviewingTemplate, setIsPreviewingTemplate] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [newCampaign, setNewCampaign] = useState({
        subject: '',
        content: '',
        previewText: ''
    });
    const [sendConfig, setSendConfig] = useState({
        selectedSubscribers: [],
        selectAll: true,
        manualRecipients: []
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
                name: 'Welcome Newsletter',
                description: 'Welcome new subscribers to your newsletter',
                thumbnail: '📧',
                category: 'onboarding',
                content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Our Newsletter!</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for joining our community</p>
            </div>
            
            <div style="padding: 40px 20px;">
              <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Welcome Aboard! 🎉</h2>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We're thrilled to have you as part of our community! You've just joined thousands of subscribers who stay updated with our latest news, insights, and exclusive content.
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333333; font-size: 18px; margin: 0 0 15px 0;">What to expect:</h3>
                <ul style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Weekly updates on industry trends</li>
                  <li>Exclusive content and insights</li>
                  <li>Special offers and promotions</li>
                  <li>Community highlights and stories</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Get Started
                </a>
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If you have any questions, feel free to reply to this email. We're here to help!
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Follow us on social media for daily updates and behind-the-scenes content.
              </p>
            </div>
          </div>
        `,
                createdAt: new Date().toISOString()
            },
            {
                name: 'Product Update',
                description: 'Share product updates and new features',
                thumbnail: '🚀',
                category: 'promotional',
                content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🚀 New Product Updates</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Exciting new features and improvements</p>
            </div>
            
            <div style="padding: 40px 20px;">
              <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">What's New This Month</h2>
              
              <div style="border-left: 4px solid #ff6b6b; padding-left: 20px; margin: 20px 0;">
                <h3 style="color: #ff6b6b; font-size: 18px; margin: 0 0 10px 0;">✨ Enhanced Dashboard</h3>
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0;">
                  We've completely redesigned our dashboard to give you better insights and faster access to your most important data.
                </p>
              </div>
              
              <div style="border-left: 4px solid #ff6b6b; padding-left: 20px; margin: 20px 0;">
                <h3 style="color: #ff6b6b; font-size: 18px; margin: 0 0 10px 0;">⚡ Performance Improvements</h3>
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0;">
                  Our latest update includes significant performance improvements, making everything 40% faster than before.
                </p>
              </div>
              
              <div style="border-left: 4px solid #ff6b6b; padding-left: 20px; margin: 20px 0;">
                <h3 style="color: #ff6b6b; font-size: 18px; margin: 0 0 10px 0;">🔒 Advanced Security</h3>
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0;">
                  New security features including two-factor authentication and advanced encryption protocols.
                </p>
              </div>
              
              <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #fed7d7;">
                <h3 style="color: #e53e3e; font-size: 18px; margin: 0 0 15px 0;">🎯 Coming Soon</h3>
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                  Stay tuned for our upcoming mobile app launch and AI-powered analytics features coming next month!
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Try New Features
                </a>
              </div>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Have feedback on our updates? Reply to this email - we'd love to hear from you!
              </p>
            </div>
          </div>
        `,
                createdAt: new Date().toISOString()
            },
            {
                name: 'Monthly Digest',
                description: 'Regular monthly newsletter template',
                thumbnail: '📰',
                category: 'newsletter',
                content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">📰 Monthly Digest</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Edition</p>
            </div>
            
            <div style="padding: 40px 20px;">
              <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">This Month's Highlights</h2>
              
              <div style="display: flex; margin: 20px 0;">
                <div style="background-color: #4facfe; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
                  <span style="color: #ffffff; font-size: 24px;">📈</span>
                </div>
                <div style="flex: 1;">
                  <h3 style="color: #333333; font-size: 18px; margin: 0 0 10px 0;">Growth & Analytics</h3>
                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                    This month we saw a 25% increase in user engagement and launched three new features based on your feedback.
                  </p>
                </div>
              </div>
              
              <div style="display: flex; margin: 20px 0;">
                <div style="background-color: #4facfe; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
                  <span style="color: #ffffff; font-size: 24px;">🎯</span>
                </div>
                <div style="flex: 1;">
                  <h3 style="color: #333333; font-size: 18px; margin: 0 0 10px 0;">Community Spotlight</h3>
                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                    Meet Sarah Johnson, who increased her productivity by 300% using our new workflow automation tools.
                  </p>
                </div>
              </div>
              
              <div style="display: flex; margin: 20px 0;">
                <div style="background-color: #4facfe; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
                  <span style="color: #ffffff; font-size: 24px;">💡</span>
                </div>
                <div style="flex: 1;">
                  <h3 style="color: #333333; font-size: 18px; margin: 0 0 10px 0;">Industry Insights</h3>
                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                    The latest trends in automation and AI, plus expert predictions for the upcoming quarter.
                  </p>
                </div>
              </div>
              
              <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 15px 0;">🎉 Special Offer</h3>
                <p style="color: #ffffff; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                  Get 20% off our premium features this month. Limited time offer for newsletter subscribers only!
                </p>
                <a href="#" style="background-color: #ffffff; color: #f5576c; text-decoration: none; padding: 10px 25px; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Claim Offer
                </a>
              </div>
              
              <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
                <h3 style="color: #333333; font-size: 18px; margin: 0 0 15px 0;">📚 Recommended Reading</h3>
                <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><a href="#" style="color: #4facfe; text-decoration: none;">The Future of Remote Work: Trends for 2024</a></li>
                  <li><a href="#" style="color: #4facfe; text-decoration: none;">Automation Best Practices: A Complete Guide</a></li>
                  <li><a href="#" style="color: #4facfe; text-decoration: none;">Building Productive Teams in Digital Age</a></li>
                </ul>
              </div>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                Thank you for being part of our community! See you next month.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                <a href="#" style="color: #4facfe; text-decoration: none;">Update Preferences</a> | 
                <a href="#" style="color: #4facfe; text-decoration: none;">View in Browser</a>
              </p>
            </div>
          </div>
        `,
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
        sent: { color: 'bg-green-100 text-green-800', label: 'Sent' },
        draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
        scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
        sending: { color: 'bg-blue-100 text-blue-800', label: 'Sending' }
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
            setCampaigns((prev) => [newCampaignWithId, ...prev]);

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
            setCampaigns((prev) =>
                prev.map((campaign) =>
                    campaign.id === selectedCampaign.id ? { ...campaign, ...updatedData } : campaign
                )
            );

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
            selectedSubscribers: [],
            selectAll: true,
            manualRecipients: []
        });
        setIsSendingCampaign(true);
    };

    const handleTestSend = async () => {
        try {
            if (!selectedCampaign) {
                toast.error('No campaign selected for testing');
                return;
            }

            await fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'newsletter_test',
                    campaign: selectedCampaign
                })
            });

            toast.success('Test email sent successfully');
        } catch (error) {
            console.error('Error sending test email:', error);
            toast.error('Failed to send test email');
        }
    };

    const handleSendCampaign = async () => {
        try {
            if (!selectedCampaign) return;

            // Update campaign status to sending
            setCampaigns((prev) => prev.map((c) => (c.id === selectedCampaign.id ? { ...c, status: 'sending' } : c)));
            await update(selectedCampaign.id, { status: 'sending' }, 'newsletter_campaigns');

            // Get subscribers to send to
            const subscriberList = sendConfig.selectAll
                ? subscribers.filter((s) => s.status === 'active')
                : sendConfig.selectedSubscribers;

            // Combine subscribers with manual recipients
            const allRecipients = [...subscriberList, ...sendConfig.manualRecipients.filter((r) => r.email.trim())];

            if (allRecipients.length === 0) {
                toast.error('No recipients selected');
                return;
            }

            // Send newsletter via API
            const response = await fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'newsletter',
                    campaign: selectedCampaign,
                    subscribers: subscriberList,
                    manualRecipients: sendConfig.manualRecipients.filter((r) => r.email.trim())
                })
            });

            if (response.ok) {
                const result = await response.json();

                // Update campaign status and stats locally
                const updatedCampaign = {
                    status: 'sent',
                    sentDate: new Date().toISOString(),
                    recipients: result.data?.sent || allRecipients.length
                };

                setCampaigns((prev) =>
                    prev.map((c) => (c.id === selectedCampaign.id ? { ...c, ...updatedCampaign } : c))
                );

                await update(selectedCampaign.id, updatedCampaign, 'newsletter_campaigns');

                toast.success(`Newsletter sent to ${result.data?.sent || allRecipients.length} recipients`);
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
                setCampaigns((prev) => prev.map((c) => (c.id === selectedCampaign.id ? { ...c, status: 'draft' } : c)));
                await update(selectedCampaign.id, { status: 'draft' }, 'newsletter_campaigns');
            }
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        try {
            await remove(campaignId, 'newsletter_campaigns');

            // Update state locally
            setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));

            toast.success('Campaign deleted successfully');
        } catch (error) {
            console.error('Error deleting campaign:', error);
            toast.error('Failed to delete campaign');
        }
    };

    const addManualRecipient = () => {
        setSendConfig((prev) => ({
            ...prev,
            manualRecipients: [...prev.manualRecipients, { name: '', email: '' }]
        }));
    };

    const updateManualRecipient = (index, field, value) => {
        setSendConfig((prev) => ({
            ...prev,
            manualRecipients: prev.manualRecipients.map((recipient, i) =>
                i === index ? { ...recipient, [field]: value } : recipient
            )
        }));
    };

    const removeManualRecipient = (index) => {
        setSendConfig((prev) => ({
            ...prev,
            manualRecipients: prev.manualRecipients.filter((_, i) => i !== index)
        }));
    };

    const handlePreviewTemplate = (template) => {
        setSelectedTemplate(template);
        setIsPreviewingTemplate(true);
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
    const sentCampaigns = campaigns.filter((c) => c.status === 'sent');
    const avgOpenRate =
        sentCampaigns.length > 0
            ? (sentCampaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / sentCampaigns.length).toFixed(1)
            : 0;
    const avgClickRate =
        sentCampaigns.length > 0
            ? (sentCampaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / sentCampaigns.length).toFixed(1)
            : 0;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="mb-2 h-8 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
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
                    <h1 className="font-bold text-3xl">Newsletter</h1>
                    <p className="text-muted-foreground">Create and manage your email campaigns</p>
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
                                    onChange={(e) => setNewCampaign((prev) => ({ ...prev, subject: e.target.value }))}
                                    placeholder="Enter email subject"
                                />
                            </div>
                            <div>
                                <Label htmlFor="previewText">Preview Text</Label>
                                <Input
                                    id="previewText"
                                    value={newCampaign.previewText}
                                    onChange={(e) =>
                                        setNewCampaign((prev) => ({ ...prev, previewText: e.target.value }))
                                    }
                                    placeholder="Brief description shown in email preview"
                                />
                            </div>
                            <div>
                                <Label htmlFor="content">Content</Label>
                                <Textarea
                                    id="content"
                                    value={newCampaign.content}
                                    onChange={(e) => setNewCampaign((prev) => ({ ...prev, content: e.target.value }))}
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
                            <DialogDescription>Update your newsletter campaign details.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-subject">Subject Line</Label>
                                <Input
                                    id="edit-subject"
                                    value={newCampaign.subject}
                                    onChange={(e) => setNewCampaign((prev) => ({ ...prev, subject: e.target.value }))}
                                    placeholder="Enter email subject"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-previewText">Preview Text</Label>
                                <Input
                                    id="edit-previewText"
                                    value={newCampaign.previewText}
                                    onChange={(e) =>
                                        setNewCampaign((prev) => ({ ...prev, previewText: e.target.value }))
                                    }
                                    placeholder="Brief description shown in email preview"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-content">Content</Label>
                                <Textarea
                                    id="edit-content"
                                    value={newCampaign.content}
                                    onChange={(e) => setNewCampaign((prev) => ({ ...prev, content: e.target.value }))}
                                    placeholder="Newsletter content (HTML supported)"
                                    rows={6}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
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

                {/* Preview Template Dialog */}
                <Dialog open={isPreviewingTemplate} onOpenChange={setIsPreviewingTemplate}>
                    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Template Preview</DialogTitle>
                            <DialogDescription>{selectedTemplate?.name || 'Template Preview'}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="rounded border p-4">
                                <div className="mb-2 text-muted-foreground text-sm">
                                    <strong>Template:</strong> {selectedTemplate?.name || 'No name'}
                                </div>
                                <div className="mb-2 text-muted-foreground text-sm">
                                    <strong>Category:</strong> {selectedTemplate?.category || 'No category'}
                                </div>
                                <div className="mb-4 text-muted-foreground text-sm">
                                    <strong>Description:</strong> {selectedTemplate?.description || 'No description'}
                                </div>
                                <div className="border-t pt-4">
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <h4 className="mb-3 font-medium text-gray-700 text-sm">Template Preview:</h4>
                                        <div
                                            className="overflow-hidden rounded border bg-white shadow-sm"
                                            style={{
                                                maxHeight: '400px',
                                                overflowY: 'auto',
                                                fontSize: '14px'
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: selectedTemplate?.content || 'No content available'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPreviewingTemplate(false)}>
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsPreviewingTemplate(false);
                                    handleUseTemplate(selectedTemplate);
                                }}>
                                Use Template
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Preview Campaign Dialog */}
                <Dialog open={isPreviewingCampaign} onOpenChange={setIsPreviewingCampaign}>
                    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Campaign Preview</DialogTitle>
                            <DialogDescription>{selectedCampaign?.subject || 'Untitled Campaign'}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="rounded border p-4">
                                <div className="mb-2 text-muted-foreground text-sm">
                                    <strong>Subject:</strong> {selectedCampaign?.subject || 'No subject'}
                                </div>
                                <div className="mb-4 text-muted-foreground text-sm">
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
                            <Button
                                onClick={() => {
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
                    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle>Send Campaign</DialogTitle>
                            <DialogDescription>
                                Configure and send "{selectedCampaign?.subject}" to your recipients
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                            {/* Recipients Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Subscribers</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="selectAll"
                                            checked={sendConfig.selectAll}
                                            onChange={(e) => {
                                                setSendConfig((prev) => ({
                                                    ...prev,
                                                    selectAll: e.target.checked,
                                                    selectedSubscribers: e.target.checked
                                                        ? []
                                                        : prev.selectedSubscribers
                                                }));
                                            }}
                                            className="rounded"
                                        />
                                        <Label htmlFor="selectAll">
                                            Send to all active subscribers (
                                            {subscribers.filter((s) => s.status === 'active').length})
                                        </Label>
                                    </div>

                                    {!sendConfig.selectAll && (
                                        <div className="space-y-3">
                                            <Label htmlFor="subscriberSelect">
                                                Select Subscribers ({sendConfig.selectedSubscribers.length} selected)
                                            </Label>
                                            <select
                                                id="subscriberSelect"
                                                multiple
                                                className="min-h-[200px] w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={sendConfig.selectedSubscribers.map((s) => s.id)}
                                                onChange={(e) => {
                                                    const selectedIds = Array.from(
                                                        e.target.selectedOptions,
                                                        (option) => option.value
                                                    );
                                                    const selectedSubs = subscribers.filter((s) =>
                                                        selectedIds.includes(s.id)
                                                    );
                                                    setSendConfig((prev) => ({
                                                        ...prev,
                                                        selectedSubscribers: selectedSubs
                                                    }));
                                                }}>
                                                {subscribers
                                                    .filter((s) => s.status === 'active')
                                                    .map((subscriber) => (
                                                        <option
                                                            key={subscriber.id}
                                                            value={subscriber.id}
                                                            className="p-2">
                                                            {subscriber.name || 'Anonymous'} ({subscriber.email})
                                                        </option>
                                                    ))}
                                            </select>
                                            <p className="text-muted-foreground text-sm">
                                                Hold Ctrl (Cmd on Mac) to select multiple subscribers
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Manual Recipients Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg">Additional Recipients</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={addManualRecipient}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Recipient
                                    </Button>
                                </div>

                                {sendConfig.manualRecipients.length > 0 && (
                                    <div className="max-h-48 space-y-3 overflow-y-auto rounded border p-3">
                                        {sendConfig.manualRecipients.map((recipient, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    placeholder="Name (optional)"
                                                    value={recipient.name}
                                                    onChange={(e) =>
                                                        updateManualRecipient(index, 'name', e.target.value)
                                                    }
                                                    className="flex-1"
                                                />
                                                <Input
                                                    type="email"
                                                    placeholder="Email address *"
                                                    value={recipient.email}
                                                    onChange={(e) =>
                                                        updateManualRecipient(index, 'email', e.target.value)
                                                    }
                                                    className="flex-1"
                                                    required
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeManualRecipient(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="text-muted-foreground text-sm">
                                    Add email addresses that are not in your subscriber list. These recipients will
                                    receive the newsletter but won't be added to your subscriber database.
                                </p>
                            </div>

                            {/* Test Send Section */}
                            <div className="border-t pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="font-semibold">Test Send</h4>
                                    <Button variant="outline" size="sm" onClick={handleTestSend}>
                                        Send Test Email
                                    </Button>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Send a test email to the configured test address in your site settings.
                                </p>
                            </div>

                            {/* Campaign Summary */}
                            <div className="rounded bg-accent p-4">
                                <h4 className="mb-2 font-semibold">Campaign Summary</h4>
                                <div className="space-y-1 text-sm">
                                    <div>
                                        <strong>Subject:</strong> {selectedCampaign?.subject}
                                    </div>
                                    <div>
                                        <strong>Subscribers:</strong>{' '}
                                        {sendConfig.selectAll
                                            ? subscribers.filter((s) => s.status === 'active').length
                                            : sendConfig.selectedSubscribers.length}
                                    </div>
                                    <div>
                                        <strong>Additional Recipients:</strong>{' '}
                                        {sendConfig.manualRecipients.filter((r) => r.email.trim()).length}
                                    </div>
                                    <div>
                                        <strong>Total Recipients:</strong>{' '}
                                        {(sendConfig.selectAll
                                            ? subscribers.filter((s) => s.status === 'active').length
                                            : sendConfig.selectedSubscribers.length) +
                                            sendConfig.manualRecipients.filter((r) => r.email.trim()).length}
                                    </div>
                                    <div>
                                        <strong>Status:</strong> Ready to send
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsSendingCampaign(false);
                                    setSelectedCampaign(null);
                                }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendCampaign}
                                disabled={
                                    !sendConfig.selectAll &&
                                    sendConfig.selectedSubscribers.length === 0 &&
                                    sendConfig.manualRecipients.filter((r) => r.email.trim()).length === 0
                                }>
                                Send Campaign
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Total Subscribers</p>
                                <p className="font-bold text-2xl">{totalSubscribers}</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Campaigns Sent</p>
                                <p className="font-bold text-2xl">{sentCampaigns.length}</p>
                            </div>
                            <Send className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Avg. Open Rate</p>
                                <p className="font-bold text-2xl">{avgOpenRate}%</p>
                            </div>
                            <Eye className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Avg. Click Rate</p>
                                <p className="font-bold text-2xl">{avgClickRate}%</p>
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
                            <CardDescription>Manage your email marketing campaigns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {campaigns.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Mail className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                                        <h3 className="mb-2 font-medium text-lg">No campaigns yet</h3>
                                        <p className="mb-4 text-muted-foreground">
                                            Create your first newsletter campaign to get started
                                        </p>
                                        <Button onClick={() => setIsCreatingCampaign(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Campaign
                                        </Button>
                                    </div>
                                ) : (
                                    campaigns.map((campaign) => (
                                        <div
                                            key={campaign.id}
                                            className="flex items-center gap-4 rounded-lg border p-4">
                                            <div className="flex-1">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <h3 className="font-medium">
                                                        {campaign.subject || 'Untitled Campaign'}
                                                    </h3>
                                                    <Badge
                                                        className={
                                                            statusConfig[campaign.status]?.color ||
                                                            statusConfig.draft.color
                                                        }>
                                                        {statusConfig[campaign.status]?.label || 'Draft'}
                                                    </Badge>
                                                </div>
                                                <p className="mb-2 text-muted-foreground text-sm">
                                                    {campaign.previewText || 'No preview text'}
                                                </p>
                                                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                                    {campaign.status === 'sent' && (
                                                        <>
                                                            <span>{campaign.recipients || 0} recipients</span>
                                                            <span>{campaign.openRate || 0}% open rate</span>
                                                            <span>{campaign.clickRate || 0}% click rate</span>
                                                            <span>
                                                                Sent:{' '}
                                                                {campaign.sentDate
                                                                    ? new Date(campaign.sentDate).toLocaleDateString()
                                                                    : 'Unknown'}
                                                            </span>
                                                        </>
                                                    )}
                                                    {campaign.status === 'scheduled' && (
                                                        <>
                                                            <span>{campaign.recipients || 0} recipients</span>
                                                            <span>
                                                                Scheduled:{' '}
                                                                {campaign.sentDate
                                                                    ? new Date(campaign.sentDate).toLocaleDateString()
                                                                    : 'Unknown'}
                                                            </span>
                                                        </>
                                                    )}
                                                    {(campaign.status === 'draft' || campaign.status === 'sending') && (
                                                        <span>
                                                            {campaign.status === 'sending'
                                                                ? 'Sending...'
                                                                : 'Draft saved'}
                                                            {campaign.createdAt &&
                                                                ` - ${new Date(campaign.createdAt).toLocaleDateString()}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePreviewCampaign(campaign)}
                                                    title="Preview">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditCampaignClick(campaign)}
                                                    title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {(campaign.status === 'draft' || campaign.status === 'sent') && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleSendCampaignClick(campaign)}
                                                        disabled={
                                                            subscribers.filter((s) => s.status === 'active').length ===
                                                            0
                                                        }
                                                        title="Send">
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                                    title="Delete">
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
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {templates.length === 0 ? (
                            <div className="col-span-full py-12 text-center">
                                <Edit className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                                <h3 className="mb-2 font-medium text-lg">No templates available</h3>
                                <p className="text-muted-foreground">
                                    Templates will be created automatically when you use the system
                                </p>
                            </div>
                        ) : (
                            templates.map((template) => (
                                <Card key={template.id} className="cursor-pointer transition-shadow hover:shadow-md">
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
                                        <p className="mb-4 text-muted-foreground text-sm">{template.description}</p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handlePreviewTemplate(template)}>
                                                Preview
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleUseTemplate(template)}>
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
                            <CardDescription>Detailed analytics for your email campaigns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="py-12 text-center">
                                <BarChart3 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                                <h3 className="mb-2 font-medium text-lg">Analytics Dashboard</h3>
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
