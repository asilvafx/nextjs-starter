// @/app/api/locale/available-languages/route.js

import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const localeDir = path.join(process.cwd(), 'src', 'locale');

        // Check if locale directory exists
        if (!fs.existsSync(localeDir)) {
            return Response.json({
                success: false,
                error: 'Locale directory not found'
            });
        }

        // Get all directories in the locale folder (each directory represents a language)
        const items = fs.readdirSync(localeDir, { withFileTypes: true });
        const languages = items
            .filter((item) => item.isDirectory())
            .map((item) => item.name)
            .filter((name) => name !== 'node_modules' && !name.startsWith('.'))
            .sort();

        return Response.json({
            success: true,
            data: languages
        });
    } catch (error) {
        console.error('Failed to get available languages:', error);
        return Response.json({
            success: false,
            error: 'Failed to read locale directory'
        });
    }
}
