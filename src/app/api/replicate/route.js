import Replicate from 'replicate';

// Server-side API route to run Replicate models.
// Requires REPLICATE_API_TOKEN to be set in the environment (server-side).

export async function POST(req) {
    try {
        const body = await req.json();
        const prompt = body?.prompt;

        if (!prompt) {
            return new Response(JSON.stringify({ success: false, error: 'Missing prompt in request body' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) {
            return new Response(JSON.stringify({ success: false, error: 'Server missing REPLICATE_API_TOKEN environment variable' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const client = new Replicate({ auth: token });

        // Adjust model and input as needed.
        const output = await client.run('bytedance/seedance-1-pro-fast', {
            input: { prompt }
        });

        return new Response(JSON.stringify({ success: true, output }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
