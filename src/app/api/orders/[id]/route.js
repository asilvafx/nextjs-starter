// @/app/api/orders/[id]/route.js

import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

export async function GET(_request, { params }) {
    try {
        const { id } = await params;

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

        try {
            // First try to get by exact id field
            order = await DBService.getItemByKey('id', id, 'orders'); 
        } catch (e) { 
            // If not found by id, try by uid field
            try {
                order = await DBService.getItemByKey('uid', id, 'orders'); 
            } catch (e2) { 
                // Last attempt - search through all orders
                try {
                    const allOrders = await DBService.readAll('orders'); 
                    order = allOrders.find(
                        (o) =>
                            (o.id && o.id === id) ||
                            (o.uid && o.uid === id) ||
                            (o.id && o.id.toString() === id) ||
                            (o.uid && o.uid.toString() === id)
                    );  
                } catch (e3) {
                    console.error('Failed to search all orders:', e3);
                }
            }
        }

        if (!order) { 
            return NextResponse.json(
                {
                    success: false,
                    error: 'Order not found'
                },
                { status: 404 }
            );
        }
  
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
