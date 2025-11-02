// @/app/admin/developer/ai/page.jsx

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

export default function AIAgentPage() {
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [modelsLoading, setModelsLoading] = useState(false);

    const [aiEnabled, setAiEnabled] = useState(false);
    const [replicateApiKey, setReplicateApiKey] = useState('');

    const [models, setModels] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingModel, setEditingModel] = useState(null);
    const [form, setForm] = useState({ name: '', modelId: '', description: '', enabled: true, config: {} });

    const loadSettings = async () => {
        setSettingsLoading(true);
        try {
            const res = await fetch('/api/ai/settings');
            const json = await res.json();
            if (json?.success && json.data) {
                setAiEnabled(!!json.data.enabled);
                setReplicateApiKey(json.data.replicateApiKey || '');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load AI settings');
        } finally {
            setSettingsLoading(false);
        }
    };

    const saveSettings = async () => {
        setSettingsLoading(true);
        try {
            const res = await fetch('/api/ai/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: aiEnabled, replicateApiKey })
            });
            const json = await res.json();
            if (json?.success) {
                toast.success('Settings saved');
                // reload models visibility
                if (aiEnabled) loadModels();
            } else {
                toast.error('Failed to save settings');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to save settings');
        } finally {
            setSettingsLoading(false);
        }
    };

    const loadModels = async () => {
        setModelsLoading(true);
        try {
            const res = await fetch('/api/ai/models');
            const json = await res.json();
            if (json?.success) setModels(Array.isArray(json.data) ? json.data : []);
        } catch (err) {
            console.error(err);
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
        setForm({ name: '', modelId: '', description: '', enabled: true, config: {} });
        setShowDialog(true);
    };

    const openEditDialog = (m) => {
        setEditingModel(m);
        setForm({
            name: m.name || '',
            modelId: m.modelId || '',
            description: m.description || '',
            enabled: !!m.enabled,
            config: m.config || {}
        });
        setShowDialog(true);
    };

    const submitModel = async () => {
        if (!form.name || !form.modelId) return toast.error('Name and model id are required');
        try {
            if (editingModel) {
                const res = await fetch(`/api/ai/models/${editingModel.id || editingModel.key || editingModel._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
                const json = await res.json();
                if (json?.success) {
                    toast.success('Model updated');
                    setShowDialog(false);
                    loadModels();
                } else {
                    toast.error('Failed to update model');
                }
            } else {
                const res = await fetch('/api/ai/models', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
                const json = await res.json();
                if (json?.success) {
                    toast.success('Model created');
                    setShowDialog(false);
                    loadModels();
                } else {
                    toast.error('Failed to create model');
                }
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to save model');
        }
    };

    const deleteModel = async (m) => {
        try {
            const id = m.id || m.key || m._id;
            const res = await fetch(`/api/ai/models/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json?.success) {
                toast.success('Deleted');
                loadModels();
            } else {
                toast.error('Delete failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Delete failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-2xl">AI Agent</h1>
                    <p className="text-muted-foreground">Manage AI agent, Replicate API key and available models</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Agent Settings</CardTitle>
                    <CardDescription>Enable or disable the AI agent and store your Replicate API key</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                            <Switch checked={aiEnabled} onCheckedChange={(v) => setAiEnabled(!!v)} />
                            <Label>AI Agent Enabled</Label>
                        </div>

                        <div>
                            <Label>Replicate API Key</Label>
                            <Input
                                value={replicateApiKey}
                                onChange={(e) => setReplicateApiKey(e.target.value)}
                                placeholder="sk-..."
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={saveSettings} disabled={settingsLoading}>
                                {settingsLoading ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {!aiEnabled ? (
                <Card>
                    <CardContent>
                        <p className="text-muted-foreground">
                            AI Agent is disabled. Enable it above to manage models and use AI features.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium">Models</h2>
                        <Dialog open={showDialog} onOpenChange={setShowDialog}>
                            <DialogTrigger asChild>
                                <Button onClick={openCreateDialog}>Add Model</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingModel ? 'Edit Model' : 'Add Model'}</DialogTitle>
                                    <DialogDescription>
                                        Provide model details (Replicate model id, description and defaults)
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-3">
                                    <div>
                                        <Label>Name</Label>
                                        <Input
                                            value={form.name}
                                            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Replicate Model ID</Label>
                                        <Input
                                            value={form.modelId}
                                            onChange={(e) => setForm((s) => ({ ...s, modelId: e.target.value }))}
                                            placeholder="e.g. stability-ai/stable-diffusion"
                                        />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Textarea
                                            value={form.description}
                                            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={form.enabled}
                                            onCheckedChange={(v) => setForm((s) => ({ ...s, enabled: !!v }))}
                                        />
                                        <span className="text-sm">Enabled</span>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={submitModel}>{editingModel ? 'Update' : 'Create'}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardContent>
                            {modelsLoading ? (
                                <TableSkeleton columns={3} rows={3} />
                            ) : (
                                <ScrollArea className="max-h-[50vh]">
                                    <div className="grid gap-3">
                                        {models.length === 0 ? (
                                            <div className="text-muted-foreground">
                                                No models yet. Add a model to get started.
                                            </div>
                                        ) : (
                                            models.map((m) => (
                                                <Card key={m.id || m.key || m._id}>
                                                    <CardContent className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <div className="font-medium">{m.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {m.modelId}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {m.description}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="ghost" onClick={() => openEditDialog(m)}>
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => deleteModel(m)}>
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                    {/* Example usage section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Example: Call a model</CardTitle>
                            <CardDescription>How to call the AI model execution endpoint from your application</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Use the following API to run a specific model. Replace <code>{'{id}'}</code> with the model
                                    record id (see the Models list).
                                </p>

                                <div className="rounded bg-muted p-3">
                                    <pre className="overflow-x-auto text-xs">
                                        <code>{`fetch('/api/ai/models/{id}/use', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Translate to French: Hello world', modelSettings: { temperature: 0.7 } })
}).then(r => r.json()).then(console.log);`}</code>
                                    </pre>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    Request body parameters:
                                </p>
                                <ul className="list-disc pl-6 text-sm">
                                    <li><strong>prompt</strong> (string) — The user prompt or input for the model.</li>
                                    <li><strong>modelSettings</strong> (object) — Optional per-call settings that will be merged with the model defaults.</li>
                                </ul>

                                <p className="text-sm text-muted-foreground">
                                    Response: The route returns the raw Replicate response in the <code>data</code> field.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
