// app/api/shop/bulk/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAdminAuth } from '@/lib/auth.js';

// POST bulk operations - admin only
async function bulkOperationsHandler(request) {
    try {
        const { operation, itemIds, data } = await request.json();

        if (!operation) {
            return NextResponse.json(
                { error: 'Operation type is required.' },
                { status: 400 }
            );
        }

        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return NextResponse.json(
                { error: 'Item IDs array is required.' },
                { status: 400 }
            );
        }

        let results = [];
        let successCount = 0;
        let failedCount = 0;

        switch (operation) {
            case 'delete':
                // Bulk delete items
                for (const id of itemIds) {
                    try {
                        const deleted = await DBService.delete(id, "shop_items");
                        if (deleted) {
                            successCount++;
                            results.push({ id, status: 'success' });
                        } else {
                            failedCount++;
                            results.push({ id, status: 'failed', error: 'Delete operation failed' });
                        }
                    } catch (error) {
                        failedCount++;
                        results.push({ id, status: 'failed', error: error.message });
                    }
                }
                break;

            case 'update':
                // Bulk update items
                if (!data) {
                    return NextResponse.json(
                        { error: 'Update data is required for bulk update.' },
                        { status: 400 }
                    );
                }

                const updateData = {
                    ...data,
                    updatedAt: new Date().toISOString(),
                    updatedBy: request.user.id
                };

                for (const id of itemIds) {
                    try {
                        const existingItem = await DBService.readBy("id", id, "shop_items");
                        if (existingItem) {
                            const updated = await DBService.update(id, {...existingItem, ...updateData}, "shop_items");
                            if (updated) {
                                successCount++;
                                results.push({ id, status: 'success' });
                            } else {
                                failedCount++;
                                results.push({ id, status: 'failed', error: 'Update operation failed' });
                            }
                        } else {
                            failedCount++;
                            results.push({ id, status: 'failed', error: 'Item not found' });
                        }
                    } catch (error) {
                        failedCount++;
                        results.push({ id, status: 'failed', error: error.message });
                    }
                }
                break;

            case 'activate':
                // Bulk activate items
                for (const id of itemIds) {
                    try {
                        const existingItem = await DBService.readBy("id", id, "shop_items");
                        if (existingItem) {
                            const updated = await DBService.update(id, {
                                ...existingItem,
                                isActive: true,
                                updatedAt: new Date().toISOString(),
                                updatedBy: request.user.id
                            }, "shop_items");
                            if (updated) {
                                successCount++;
                                results.push({ id, status: 'success' });
                            } else {
                                failedCount++;
                                results.push({ id, status: 'failed', error: 'Activate operation failed' });
                            }
                        } else {
                            failedCount++;
                            results.push({ id, status: 'failed', error: 'Item not found' });
                        }
                    } catch (error) {
                        failedCount++;
                        results.push({ id, status: 'failed', error: error.message });
                    }
                }
                break;

            case 'deactivate':
                // Bulk deactivate items
                for (const id of itemIds) {
                    try {
                        const existingItem = await DBService.readBy("id", id, "shop_items");
                        if (existingItem) {
                            const updated = await DBService.update(id, {
                                ...existingItem,
                                isActive: false,
                                updatedAt: new Date().toISOString(),
                                updatedBy: request.user.id
                            }, "shop_items");
                            if (updated) {
                                successCount++;
                                results.push({ id, status: 'success' });
                            } else {
                                failedCount++;
                                results.push({ id, status: 'failed', error: 'Deactivate operation failed' });
                            }
                        } else {
                            failedCount++;
                            results.push({ id, status: 'failed', error: 'Item not found' });
                        }
                    } catch (error) {
                        failedCount++;
                        results.push({ id, status: 'failed', error: error.message });
                    }
                }
                break;

            default:
                return NextResponse.json(
                    { error: `Unknown operation: ${operation}. Supported operations: delete, update, activate, deactivate` },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            operation,
            summary: {
                total: itemIds.length,
                successful: successCount,
                failed: failedCount
            },
            results,
            message: `Bulk ${operation} completed. ${successCount} successful, ${failedCount} failed.`
        });

    } catch (error) {
        console.error('Bulk operations error:', error);
        return NextResponse.json(
            { error: 'Bulk operation failed.' },
            { status: 500 }
        );
    }
}

export const POST = withAdminAuth(bulkOperationsHandler);
