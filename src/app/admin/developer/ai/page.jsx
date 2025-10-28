// @/app/admin/developer/ai/page.jsx

'use client';

import { useEffect, useState } from 'react';

export default function DatabasePage() {
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState(null);
    const [error, setError] = useState(null);

    const prompt = 'high speed supercar driving on the beach at sunset';

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/replicate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });

                const json = await res.json();
                if (!mounted) return;

                if (!res.ok || !json?.success) {
                    setError(json?.error || 'Replicate request failed');
                    setLoading(false);
                    return;
                }

                setOutput(json.output);
            } catch (err) {
                if (!mounted) return;
                setError(err?.message || String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        };

        run();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div>
            <h1>AI Image Test</h1>

            {loading && <p>Generating image…</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {output ? (
                Array.isArray(output) ? (
                    output.map((item, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                            <a href={item} target="_blank" rel="noreferrer">
                                {item}
                            </a>
                            <div>
                                <img src={item} alt={`output-${i}`} style={{ maxWidth: '400px' }} />
                            </div>
                        </div>
                    ))
                ) : typeof output === 'string' ? (
                    <div>
                        <a href={output} target="_blank" rel="noreferrer">
                            {output}
                        </a>
                        <div>
                            <img src={output} alt="output" style={{ maxWidth: '400px' }} />
                        </div>
                    </div>
                ) : (
                    <pre>{JSON.stringify(output, null, 2)}</pre>
                )
            ) : null}
        </div>
    );
}