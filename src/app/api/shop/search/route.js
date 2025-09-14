// app/api/shop/search/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAuth } from '@/lib/auth.js';

// GET advanced search - accessible to all authenticated users
async function searchItemsHandler(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Search parameters
        const query = searchParams.get('q') || '';
        const category = searchParams.get('category');
        const minPrice = parseFloat(searchParams.get('minPrice')) || 0;
        const maxPrice = parseFloat(searchParams.get('maxPrice')) || Infinity;
        const inStock = searchParams.get('inStock') === 'true';
        const sortBy = searchParams.get('sortBy') || 'name'; // name, price, stock, createdAt
        const sortOrder = searchParams.get('sortOrder') || 'asc'; // asc, desc
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;

        // Get all items
        let items = await DBService.readAll("shop_items") || [];

        // Filter out inactive items for regular users
        if (request.user.role !== 'admin') {
            items = items.filter(item => item.isActive !== false);
        }

        // Apply filters
        let filteredItems = items;

        // Text search (name and description)
        if (query.trim()) {
            const searchTerm = query.toLowerCase().trim();
            filteredItems = filteredItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                (item.description && item.description.toLowerCase().includes(searchTerm)) ||
                (item.category && item.category.toLowerCase().includes(searchTerm))
            );
        }

        // Category filter
        if (category) {
            filteredItems = filteredItems.filter(item =>
                item.category && item.category.toLowerCase() === category.toLowerCase()
            );
        }

        // Price range filter
        filteredItems = filteredItems.filter(item =>
            item.price >= minPrice && item.price <= maxPrice
        );

        // Stock filter
        if (inStock) {
            filteredItems = filteredItems.filter(item => (item.stock || 0) > 0);
        }

        // Sorting
        filteredItems.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle different data types
            if (sortBy === 'price' || sortBy === 'stock') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            } else if (sortBy === 'createdAt') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else {
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
            }

            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
            } else {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            }
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = filteredItems.slice(startIndex, endIndex);

        // Search suggestions (similar items)
        let suggestions = [];
        if (query.trim() && paginatedItems.length < 5) {
            const queryWords = query.toLowerCase().split(' ');
            suggestions = items
                .filter(item => !paginatedItems.find(p => p.id === item.id))
                .filter(item => {
                    return queryWords.some(word =>
                        item.name.toLowerCase().includes(word) ||
                        (item.category && item.category.toLowerCase().includes(word))
                    );
                })
                .slice(0, 5);
        }

        return NextResponse.json({
            success: true,
            data: paginatedItems,
            suggestions,
            searchParams: {
                query,
                category,
                minPrice,
                maxPrice: maxPrice === Infinity ? null : maxPrice,
                inStock,
                sortBy,
                sortOrder
            },
            pagination: {
                currentPage: page,
                totalItems: filteredItems.length,
                totalPages: Math.ceil(filteredItems.length / limit),
                hasNext: endIndex < filteredItems.length,
                hasPrev: page > 1,
                limit
            },
            filters: {
                appliedFilters: {
                    hasQuery: !!query.trim(),
                    hasCategory: !!category,
                    hasPriceRange: minPrice > 0 || maxPrice !== Infinity,
                    hasStockFilter: inStock
                }
            }
        });

    } catch (error) {
        console.error('Search items error:', error);
        return NextResponse.json(
            { error: 'Search operation failed.' },
            { status: 500 }
        );
    }
}

export const GET = withAuth(searchItemsHandler);
