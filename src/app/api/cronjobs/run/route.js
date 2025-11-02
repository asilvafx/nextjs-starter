import DBService from '@/data/rest.db.js';
import { NextResponse } from 'next/server';

// Runs due cronjobs. Supports type 'http' with config { url, method, headers, body }
export async function POST() {
    try {
        const all = await DBService.readAll('cronjobs');
        if (!all) return NextResponse.json({ success: true, data: [] });

        // Normalize records (array or object)
        const jobs = Array.isArray(all) ? all : Object.values(all || {});

        const now = Date.now();
        const results = [];

        for (const job of jobs) {
            try {
                if (!job.enabled) continue;

                const interval = Number(job.intervalMinutes) || 60;
                const lastRun = job.lastRun ? new Date(job.lastRun).getTime() : 0;
                const nextRunAt = lastRun + interval * 60 * 1000;

                // If never run, or nextRunAt <= now, execute
                if (!job.lastRun || nextRunAt <= now) {
                    if (job.type === 'http' && job.config?.url) {
                        const method = (job.config.method || 'GET').toUpperCase();
                        const fetchOpts = { method };
                        if (job.config.headers) fetchOpts.headers = job.config.headers;
                        if (job.config.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                            fetchOpts.body = typeof job.config.body === 'string' ? job.config.body : JSON.stringify(job.config.body);
                        }

                        // perform the external request
                        const res = await fetch(job.config.url, fetchOpts);
                        const text = await res.text();

                        const updatePayload = {
                            lastRun: new Date().toISOString(),
                            lastStatus: res.status,
                            lastResult: text?.slice ? text.slice(0, 1000) : String(text)
                        };
                        await DBService.update(job.id || job.key || job._id, updatePayload, 'cronjobs');

                        results.push({ id: job.id || job.key || job._id, url: job.config.url, status: res.status });
                    } else {
                        // unsupported type - mark lastRun anyway
                        const updatePayload = { lastRun: new Date().toISOString(), lastStatus: 'skipped', lastResult: 'unsupported job type' };
                        await DBService.update(job.id || job.key || job._id, updatePayload, 'cronjobs');
                        results.push({ id: job.id || job.key || job._id, status: 'skipped' });
                    }
                }
            } catch (err) {
                console.error('Error running job', job, err);
                try {
                    await DBService.update(job.id || job.key || job._id, { lastRun: new Date().toISOString(), lastStatus: 'error', lastResult: err.message }, 'cronjobs');
                } catch (e) {}
            }
        }

        return NextResponse.json({ success: true, data: results });
    } catch (err) {
        console.error('POST /api/cronjobs/run error', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
