// src/app/api/payments/eupago/route.js
// Redirect to centralized EuPago API route
import { NextResponse } from 'next/server';

export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

export async function POST(req) {
    try {
        // Get request body
        const body = await req.json();

        // Forward to centralized EuPago API
        const baseUrl = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const apiUrl = `${protocol}://${baseUrl}/api/eupago`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('EuPago redirect error:', error.message);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );
    }
}
