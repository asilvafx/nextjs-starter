// @/app/api/orders/[id]/route.js

import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        
        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Order ID is required'
                },
                { status: 400 }
            );
        }

        // Try to find order by ID or uid
        let order = null;
        
        console.log('Looking for order with ID:', id);
        
        try {
            // First try to get by exact id field
            order = await DBService.getItemByKey('id', id, 'orders');
            console.log('Found order by id field:', !!order);
        } catch (e) {
            console.log('Failed to find by id field:', e.message);
            // If not found by id, try by uid field
            try {
                order = await DBService.getItemByKey('uid', id, 'orders');
                console.log('Found order by uid field:', !!order);
            } catch (e2) {
                console.log('Failed to find by uid field:', e2.message);
                // Last attempt - search through all orders
                try {
                    const allOrders = await DBService.readAll('orders');
                    console.log('Total orders found:', allOrders.length);
                    order = allOrders.find(o => 
                        (o.id && o.id === id) || 
                        (o.uid && o.uid === id) ||
                        (o.id && o.id.toString() === id) ||
                        (o.uid && o.uid.toString() === id)
                    );
                    console.log('Found order by search:', !!order);
                    if (order) {
                        console.log('Matched order fields:', { id: order.id, uid: order.uid });
                    }
                } catch (e3) {
                    console.error('Failed to search all orders:', e3);
                }
            }
        }

        if (!order) {
            console.log('No order found for ID:', id);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Order not found'
                },
                { status: 404 }
            );
        }

        console.log('Successfully found order:', order.id || order.uid);

        return NextResponse.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Failed to fetch order:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch order'
            },
            { status: 500 }
        );
    }
}