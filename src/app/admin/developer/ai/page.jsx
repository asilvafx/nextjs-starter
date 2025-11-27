// @/app/admin/developer/ai/page.jsx

'use client';

import { Eye, EyeOff, Plus, Edit, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminHeader from '@/app/admin/components/AdminHeader';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    getAISettings, 
    updateAISettings, 
    getAllAIModels, 
    createAIModel, 
    updateAIModel, 
    deleteAIModel 
} from '@/lib/server/admin';

export default function AIAgentPage() {
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [aiEnabled, setAiEnabled] = useState(false);
    const [replicateApiKey, setReplicateApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

    const [models, setModels] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingModel, setEditingModel] = useState(null);
    const [form, setForm] = useState({ 
        name: '', 
        modelId: '', 
        description: '', 
        enabled: true, 
        config: {
            prompt: '',
            temperature: 0.7,
            max_tokens: 500
        }
    });

    // Common Replicate model templates for easy selection
    const modelTemplates = [
        {
            name: 'GPT-4 Text Generation',
            modelId: 'openai/gpt-4',
            description: 'Advanced text generation and completion',
            config: { prompt: '', temperature: 0.7, max_tokens: 1000 }
        },
        {
            name: 'Stable Diffusion XL',
            modelId: 'stability-ai/sdxl',
            description: 'High-quality image generation',
            config: { prompt: '', width: 1024, height: 1024, num_inference_steps: 20 }
        },
        {
            name: 'Whisper Speech-to-Text',
            modelId: 'openai/whisper',
            description: 'Convert audio to text',
            config: { audio: '', language: 'en', task: 'transcribe' }
        },
        {
            name: 'LLaMA 2 Chat',
            modelId: 'meta/llama-2-70b-chat',
            description: 'Open-source conversational AI',
            config: { prompt: '', temperature: 0.7, max_new_tokens: 500 }
        }
    ];

    const loadSettings = async () => {
        setSettingsLoading(true);
        try {
            const result = await getAISettings();
            if (result.success && result.data) {
                setAiEnabled(!!result.data.enabled);
                setReplicateApiKey(result.data.replicateApiKey || '');
            }
        } catch (err) {
            console.error('Error loading AI settings:', err);
            toast.error('Failed to load AI settings');
        } finally {
            setSettingsLoading(false);
        }
    };

    const saveSettings = async () => {
        setSettingsLoading(true);
        try {
            const result = await updateAISettings({ 
                enabled: aiEnabled, 
                replicateApiKey 
            });
            
            if (result.success) {
                toast.success('Settings saved successfully');
                if (aiEnabled) loadModels();
            } else {
                toast.error(result.error || 'Failed to save settings');
            }
        } catch (err) {
            console.error('Error saving settings:', err);
            toast.error('Failed to save settings');
        } finally {
            setSettingsLoading(false);
        }
    };

    const loadModels = async () => {
        setModelsLoading(true);
        try {
            const result = await getAllAIModels();
            if (result.success) {
                setModels(result.data || []);
            } else {
                console.error('Error loading models:', result.error);
                toast.error('Failed to load models');
            }
        } catch (err) {
            console.error('Error loading models:', err);
            toast.error('Failed to load models');
        } finally {
            setModelsLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
        loadModels();
    }, []);

    const openCreateDialog = () => {
        setEditingModel(null);
        setForm({ 
            name: '', 
            modelId: '', 
            description: '', 
            enabled: true, 
            config: {
                prompt: '',
                temperature: 0.7,
                max_tokens: 500
            }
        });
        setShowDialog(true);
    };

    const openEditDialog = (model) => {
        setEditingModel(model);
        setForm({
            name: model.name || '',
            modelId: model.modelId || '',
            description: model.description || '',
            enabled: !!model.enabled,
            config: model.config || {}
        });
        setShowDialog(true);
    };

    const applyTemplate = (template) => {
        setForm(prev => ({
            ...prev,
            name: template.name,
            modelId: template.modelId,
            description: template.description,
            config: template.config
        }));
    };

    const submitModel = async () => {
        if (!form.name || !form.modelId) {
            return toast.error('Name and model ID are required');
        }

        setIsSubmitting(true);
        try {
            let result;
            if (editingModel) {
                const modelId = editingModel.id || editingModel.key || editingModel._id;
                result = await updateAIModel(modelId, form);
            } else {
                result = await createAIModel(form);
            }

            if (result.success) {
                toast.success(editingModel ? 'Model updated' : 'Model created');
                setShowDialog(false);
                loadModels();
            } else {
                toast.error(result.error || 'Failed to save model');
            }
        } catch (err) {
            console.error('Error saving model:', err);
            toast.error('Failed to save model');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteModel = async (model) => {
        if (!confirm(`Are you sure you want to delete "${model.name}"?`)) {
            return;
        }

        try {
            const modelId = model.id || model.key || model._id;
            const result = await deleteAIModel(modelId);
            
            if (result.success) {
                toast.success('Model deleted');
                loadModels();
            } else {
                toast.error(result.error || 'Failed to delete model');
            }
        } catch (err) {
            console.error('Error deleting model:', err);
            toast.error('Failed to delete model');
        }
    };

    return (
        <div className="space-y-6">
            <AdminHeader title="AI Agent" description="Manage AI agent, Replicate API key and available models">
                <Button onClick={() => setShowDialog(true)} disabled={!aiEnabled}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Model
                </Button>
            </AdminHeader>

            {/* AI Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Agent Settings</CardTitle>
                    <CardDescription>Enable or disable the AI agent and configure your Replicate API key</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                            <Switch 
                                checked={aiEnabled} 
                                onCheckedChange={setAiEnabled}
                                disabled={settingsLoading}
                            />
                            <Label>AI Agent Enabled</Label>
                        </div>

                        <div>
                            <Label>Replicate API Key</Label>
                            <div className="relative">
                                <Input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={replicateApiKey}
                                    onChange={(e) => setReplicateApiKey(e.target.value)}
                                    placeholder="r8_..."
                                    className="pr-10"
                                    disabled={settingsLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                >
                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Get your API key from{' '}
                                <a 
                                    href="https://replicate.com/account/api-tokens" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="underline hover:no-underline"
                                >
                                    replicate.com/account/api-tokens
                                </a>
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={saveSettings} disabled={settingsLoading}>
                                {settingsLoading ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Models Section */}
            {!aiEnabled ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <p className="text-muted-foreground mb-4">
                                AI Agent is disabled. Enable it above to manage models and use AI features.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>AI Models ({models.length})</CardTitle>
                        <CardDescription>
                            Manage your Replicate AI models. Each model can be called from anywhere in your code.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {modelsLoading ? (
                            <TableSkeleton columns={5} rows={3} />
                        ) : models.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-muted-foreground mb-4">
                                    No AI models configured. Add your first model to get started.
                                </div>
                                <Button onClick={openCreateDialog}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Model
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Replicate Model ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {models.map((model) => (
                                        <TableRow key={model.id || model.key || model._id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{model.name}</div>
                                                    {model.description && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {model.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                                    {model.modelId}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={model.enabled ? 'default' : 'secondary'}>
                                                    {model.enabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(model.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => openEditDialog(model)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => deleteModel(model)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Model Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingModel ? 'Edit AI Model' : 'Add AI Model'}</DialogTitle>
                        <DialogDescription>
                            Configure a Replicate model with default parameters. You can override these when calling the model.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6">
                        {/* Model Templates */}
                        {!editingModel && (
                            <div>
                                <Label className="text-base font-medium">Quick Templates</Label>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Choose a template to get started quickly
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {modelTemplates.map((template) => (
                                        <Button
                                            key={template.modelId}
                                            variant="outline"
                                            className="h-auto p-3 text-left justify-start"
                                            onClick={() => applyTemplate(template)}
                                        >
                                            <div>
                                                <div className="font-medium text-sm">{template.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {template.description}
                                                </div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Basic Information */}
                        <div className="grid gap-4">
                            <div>
                                <Label>Model Name *</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., My Image Generator"
                                />
                            </div>
                            
                            <div>
                                <Label>Replicate Model ID *</Label>
                                <Input
                                    value={form.modelId}
                                    onChange={(e) => setForm(prev => ({ ...prev, modelId: e.target.value }))}
                                    placeholder="e.g., stability-ai/stable-diffusion-xl"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Find models at{' '}
                                    <a 
                                        href="https://replicate.com/explore" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="underline hover:no-underline"
                                    >
                                        replicate.com/explore
                                    </a>
                                </p>
                            </div>
                            
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="What does this model do?"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={form.enabled}
                                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, enabled: checked }))}
                                />
                                <Label>Enabled</Label>
                            </div>
                        </div>

                        {/* Default Configuration */}
                        <div>
                            <Label className="text-base font-medium">Default Configuration (JSON)</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                                Set default parameters for this model. Users can override these when calling the model.
                            </p>
                            <Textarea
                                value={JSON.stringify(form.config, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const config = JSON.parse(e.target.value);
                                        setForm(prev => ({ ...prev, config }));
                                    } catch (err) {
                                        // Invalid JSON - don't update state but allow typing
                                    }
                                }}
                                placeholder={`{
  "prompt": "",
  "temperature": 0.7,
  "max_tokens": 500
}`}
                                className="font-mono text-sm min-h-[120px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitModel} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (editingModel ? 'Update Model' : 'Create Model')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Usage Documentation */}
            <Card>
                <CardHeader>
                    <CardTitle>How to Use AI Models in Your Code</CardTitle>
                    <CardDescription>
                        Examples of how to call AI models from your frontend and backend code
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-medium mb-2">1. From Server-Side Code (Recommended)</h4>
                        <div className="bg-muted p-4 rounded-md">
                            <pre className="text-sm overflow-x-auto">
                                <code>{`import { executeAIModel } from '@/lib/server/admin';

// Execute a model with custom parameters
const result = await executeAIModel('model_id', {
  prompt: 'Generate a beautiful sunset image',
  width: 1024,
  height: 768
});

if (result.success) {
  console.log('AI response:', result.data);
} else {
  console.error('Error:', result.error);
}`}</code>
                            </pre>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">2. From API Route</h4>
                        <div className="bg-muted p-4 rounded-md">
                            <pre className="text-sm overflow-x-auto">
                                <code>{`// /app/api/my-ai-endpoint/route.js
import { executeAIModel } from '@/lib/server/admin';

export async function POST(req) {
  const { prompt } = await req.json();
  
  const result = await executeAIModel('your_model_id', {
    prompt: prompt,
    temperature: 0.8
  });
  
  return Response.json(result);
}`}</code>
                            </pre>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">3. From Frontend (via API)</h4>
                        <div className="bg-muted p-4 rounded-md">
                            <pre className="text-sm overflow-x-auto">
                                <code>{`const response = await fetch('/api/ai/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelId: 'your_model_id',
    params: {
      prompt: 'Your prompt here',
      temperature: 0.7
    }
  })
});

const result = await response.json();`}</code>
                            </pre>
                        </div>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <p className="text-sm text-muted-foreground">
                            <strong>Note:</strong> Model execution happens asynchronously through Replicate. 
                            The response includes a prediction ID that you can use to check status and get results.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
