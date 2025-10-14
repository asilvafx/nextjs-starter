// /app/api/query/transactions/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth.js';
import DBService from '@/data/rest.db.js';

// GET - Fetch user transactions
async function handleGet(request, context) {
    const { user } = context;
    
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 50;
        const status = url.searchParams.get('status');
        const type = url.searchParams.get('type');

        // Build query conditions
        const conditions = { userId: user.id };
        if (status) conditions.status = status;
        if (type) conditions.type = type;

        // Get transactions for this user
        const transactions = await DBService.readAll('user_transactions', conditions);
        
        // Convert to array and sort by timestamp (newest first)
        const transactionArray = Object.values(transactions || {})
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Implement pagination
        const startIndex = (page - 1) * limit;
        const paginatedTransactions = transactionArray.slice(startIndex, startIndex + limit);

        return NextResponse.json({
            success: true,
            data: paginatedTransactions,
            pagination: {
                page,
                limit,
                total: transactionArray.length,
                totalPages: Math.ceil(transactionArray.length / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}

// POST - Create new transaction record
async function handlePost(request, context) {
    const { user } = context;
    
    try {
        const body = await request.json();
        const {
            hash,
            type, // 'sent' or 'received'
            amount,
            toAddress,
            fromAddress,
            status = 'pending',
            note = '',
            gasUsed = '0',
            gasPrice = '0'
        } = body;

        // Validate required fields
        if (!hash || !type || !amount || !toAddress || !fromAddress) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create transaction record
        const transactionData = {
            userId: user.id,
            hash,
            type,
            amount: amount.toString(),
            toAddress,
            fromAddress,
            status,
            note,
            gasUsed: gasUsed.toString(),
            gasPrice: gasPrice.toString(),
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const result = await DBService.create('user_transactions', transactionData);

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create transaction record' },
            { status: 500 }
        );
    }
}

// PATCH - Update transaction status
async function handlePatch(request, context) {
    const { user } = context;
    
    try {
        const body = await request.json();
        const { transactionId, status, hash } = body;

        if (!transactionId && !hash) {
            return NextResponse.json(
                { success: false, error: 'Transaction ID or hash is required' },
                { status: 400 }
            );
        }

        if (!status) {
            return NextResponse.json(
                { success: false, error: 'Status is required' },
                { status: 400 }
            );
        }

        // Find transaction
        let transaction;
        if (transactionId) {
            transaction = await DBService.readOne('user_transactions', transactionId);
        } else {
            // Find by hash
            const transactions = await DBService.readAll('user_transactions', { hash });
            transaction = Object.values(transactions || {})[0];
        }

        if (!transaction) {
            return NextResponse.json(
                { success: false, error: 'Transaction not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (transaction.userId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Update transaction
        const updateData = {
            status,
            updatedAt: new Date().toISOString()
        };

        const result = await DBService.update('user_transactions', transaction.id, updateData);

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error updating transaction:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update transaction' },
            { status: 500 }
        );
    }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
export const PATCH = withAuth(handlePatch);