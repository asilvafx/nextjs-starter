'use client';

import { Play, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
    getAllCronjobsAction,
    createCronjobAction,
    updateCronjobAction,
    deleteCronjobAction,
    executeDueCronjobsAction
} from '@/lib/server/admin.js';

export default function CronjobsAdminPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        enabled: true,
        type: 'http',
        intervalMinutes: 60,
        config: { url: '', method: 'GET' }
    });

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const result = await getAllCronjobsAction();
            if (result?.success) {
                setJobs(result.data || []);
            } else {
                toast.error(result?.error || 'Failed to load cronjobs');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load cronjobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const createJob = async () => {
        if (!form.name || !form.config.url) return toast.error('Name and URL are required');
        
        try {
            const result = await createCronjobAction(form);
            if (result?.success) {
                toast.success('Cronjob created');
                setForm({
                    name: '',
                    enabled: true,
                    type: 'http',
                    intervalMinutes: 60,
                    config: { url: '', method: 'GET' }
                });
                fetchJobs();
            } else {
                toast.error(result?.error || 'Failed to create cronjob');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to create cronjob');
        }
    };

    const removeJob = async (id) => {
        try {
            const result = await deleteCronjobAction(id);
            if (result?.success) {
                toast.success('Cronjob deleted');
                fetchJobs();
            } else {
                toast.error(result?.error || 'Failed to delete cronjob');
            }
        } catch (err) {
            console.error(err);
            toast.error('Delete failed');
        }
    };

    const toggleJobEnabled = async (job) => {
        try {
            const result = await updateCronjobAction(job.id || job.key || job._id, { 
                enabled: !job.enabled 
            });
            if (result?.success) {
                fetchJobs();
            } else {
                toast.error(result?.error || 'Failed to update job');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update job');
        }
    };

    const runNow = async () => {
        try {
            const result = await executeDueCronjobsAction();
            if (result?.success) {
                toast.success(result.message || 'Cronjobs executed');
                fetchJobs();
            } else {
                toast.error(result?.error || 'Run failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Run failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start justify-start gap-2">
                <div>
                    <h1 className="font-semibold text-2xl">Cronjobs</h1>
                    <p className="text-muted-foreground">Create and manage scheduled HTTP cronjobs</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={fetchJobs}>
                        <RefreshCw className="h-4 w-4" /> 
                    </Button>
                    <Button onClick={runNow}>
                        <Play className="mr-2 h-4 w-4" />
                        Run Due Now
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Create Cronjob
                            </CardTitle>
                            <CardDescription>
                                Add an HTTP cronjob that your server will call on schedule
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <Label>URL</Label>
                                    <Input
                                        value={form.config.url}
                                        placeholder="https://example.com/webhook"
                                        onChange={(e) =>
                                            setForm((s) => ({ ...s, config: { ...s.config, url: e.target.value } }))
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Interval (minutes)</Label>
                                    <Input
                                        type="number"
                                        value={form.intervalMinutes}
                                        onChange={(e) =>
                                            setForm((s) => ({ ...s, intervalMinutes: Number(e.target.value) }))
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={form.enabled}
                                            onCheckedChange={(v) => setForm((s) => ({ ...s, enabled: !!v }))}
                                        />
                                        <span className="text-sm">Enabled</span>
                                    </div>
                                    <Button onClick={createJob}>Create</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Existing Cronjobs</CardTitle>
                            <CardDescription>List of scheduled cronjobs and last run status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="max-h-[60vh]">
                                <div className="grid gap-3">
                                    {loading ? (
                                        <div>Loading...</div>
                                    ) : (
                                        jobs.map((job) => (
                                            <Card key={job.id || job.key || job._id}>
                                                <CardContent className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{job.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {job.config?.url || job.type} • every {job.intervalMinutes}m
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Last run: {job.lastRun || 'never'} • status:{' '}
                                                            {job.lastStatus || '-'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={!!job.enabled}
                                                            onCheckedChange={() => toggleJobEnabled(job)}
                                                        />
                                                        <Button
                                                            onClick={() => runNow()}>
                                                            <Play className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={() => removeJob(job.id || job.key || job._id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
