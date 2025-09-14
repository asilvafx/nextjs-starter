import { NextResponse } from "next/server";
import { orm } from "@/lib/orm";

// Helper to get JSON body
async function getRequestBody(request) {
    try {
        const contentType = request.headers.get("content-type");
        if (contentType?.includes("multipart/form-data")) {
            return await request.formData();
        }
        return await request.json();
    } catch {
        return null;
    }
}

// Timeout wrapper
function withTimeout(promise, ms = 30000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
        )
    ]);
}

// GET all items or single item
export async function GET(req, { params }) {
    const requestStart = Date.now();

    try {
        const { slug } = await params;

        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!slug) {
            return NextResponse.json({ error: 'Table required' }, { status: 400 });
        }

        let data;

        if (id) {
            const record = await withTimeout(orm.find(slug, id), 15000);
            if (!record) {
                return NextResponse.json({ error: 'Record not found' }, { status: 404 });
            }
            data = [{ id, ...record }];
        } else {
            const records = await withTimeout(orm.fetchAll(slug), 15000);

            // Transform the data structure to match expected format
            data = records.map((record) => ({
                id: record.id,
                ...record.data
            }));
        }

        return NextResponse.json({ success: true, data });
    } catch (err) {
        const duration = Date.now() - requestStart;
        console.error(`❌ GET Error after ${duration}ms:`, err.message);

        return NextResponse.json({
            error: err.message || 'Internal server error',
            duration: duration
        }, { status: 500 });
    }
}

// POST create new item
export async function POST(req, { params }) {
    const requestStart = Date.now();

    try {
        const { slug } = await params;

        const body = await getRequestBody(req);

        if (!slug) {
            return NextResponse.json({ error: 'Table required' }, { status: 400 });
        }
        if (!body) {
            return NextResponse.json({ error: 'Body required' }, { status: 400 });
        }

        const id = body.id || Date.now().toString();

        await withTimeout(orm.insert(slug, id, body), 15000);

        return NextResponse.json(
            {
                success: true,
                data: { id, ...body }
            },
            { status: 201 }
        );
    } catch (err) {
        const duration = Date.now() - requestStart;
        console.error(`❌ POST Error after ${duration}ms:`, err.message);

        return NextResponse.json({
            error: err.message || 'Internal server error',
            duration: duration
        }, { status: 500 });
    }
}

// PUT update item
export async function PUT(req, { params }) {
    const requestStart = Date.now();

    try {
        const { slug } = await params;
        const body = await getRequestBody(req);

        if (!slug) {
            return NextResponse.json({ error: 'Table required' }, { status: 400 });
        }
        if (!body || !body.id) {
            return NextResponse.json({ error: 'Body with id required' }, { status: 400 });
        }

        const existing = await withTimeout(orm.find(slug, body.id), 10000);
        if (!existing) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        await withTimeout(orm.update(slug, body.id, body), 10000);

        return NextResponse.json({
            success: true,
            data: { id: body.id, ...body }
        });
    } catch (err) {
        const duration = Date.now() - requestStart;
        console.error(`❌ PUT Error after ${duration}ms:`, err.message);
        return NextResponse.json({
            error: err.message || 'Internal server error',
            duration: duration
        }, { status: 500 });
    }
}

// DELETE item
export async function DELETE(req, { params }) {
    const requestStart = Date.now();

    try {
        const { slug } = await params;
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!slug) {
            return NextResponse.json({ error: "Table required" }, { status: 400 });
        }
        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const existing = await withTimeout(orm.find(slug, id), 10000);
        if (!existing) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        await withTimeout(orm.delete(slug, id), 10000);

        return NextResponse.json({
            success: true,
            message: "Record deleted",
            data: { id }
        });
    } catch (err) {
        const duration = Date.now() - requestStart;
        console.error(`❌ DELETE Error after ${duration}ms:`, err.message);
        return NextResponse.json({
            error: err.message || "Internal server error",
            duration: duration
        }, { status: 500 });
    }
}

// UPLOAD (optional) - store file metadata in table
export async function PATCH(req, { params }) {
    const requestStart = Date.now();

    try {
        const { slug } = await params;
        const formData = await req.formData();

        if (!slug) {
            return NextResponse.json({ error: 'Table required' }, { status: 400 });
        }
        if (!formData) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const file = formData.get('file');
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const id = Date.now().toString();
        const fileData = {
            filename: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
        };

        await withTimeout(orm.insert(slug, id, fileData), 10000); 

        return NextResponse.json({
            success: true,
            data: { id, ...fileData }
        });
    } catch (err) {
        const duration = Date.now() - requestStart;
        console.error(`❌ PATCH Error after ${duration}ms:`, err.message);
        return NextResponse.json({
            error: err.message || 'Internal server error',
            duration: duration
        }, { status: 500 });
    }
}
