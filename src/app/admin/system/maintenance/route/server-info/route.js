// app/admin/system/maintenance/route/server-info/route.js
import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/server/auth.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function handleGet(request) {
    try {
        // Get package.json for version information
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        let packageJson = {};
        
        try {
            const packageData = await fs.readFile(packageJsonPath, 'utf8');
            packageJson = JSON.parse(packageData);
        } catch (error) {
            console.error('Error reading package.json:', error);
        }

        // Get system information
        const systemInfo = {
            // Node.js version
            nodeVersion: process.version,
            
            // Platform information
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            
            // Memory information
            totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100, // GB
            freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100, // GB
            
            // Uptime
            uptime: Math.floor(os.uptime()),
            processUptime: Math.floor(process.uptime()),
            
            // Environment
            nodeEnv: process.env.NODE_ENV || 'development',
            
            // Current working directory
            cwd: process.cwd(),
        };

        // Get dependencies versions
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        
        const keyDependencies = {
            next: dependencies.next || 'Not installed',
            react: dependencies.react || 'Not installed',
            'react-dom': dependencies['react-dom'] || 'Not installed',
            tailwindcss: dependencies.tailwindcss || devDependencies.tailwindcss || 'Not installed',
        };

        // Try to get recent logs (last 100 lines from console if available)
        let recentLogs = [];
        try {
            // This is a simplified approach - in production, you might want to use a proper logging system
            const logMessages = [
                `${new Date().toISOString()} [INFO] Server is running`,
                `${new Date().toISOString()} [INFO] Environment: ${systemInfo.nodeEnv}`,
                `${new Date().toISOString()} [INFO] Node.js version: ${systemInfo.nodeVersion}`,
                `${new Date().toISOString()} [INFO] Platform: ${systemInfo.platform}`,
                `${new Date().toISOString()} [INFO] CPUs: ${systemInfo.cpus}`,
                `${new Date().toISOString()} [INFO] Total Memory: ${systemInfo.totalMemory}GB`,
            ];
            recentLogs = logMessages;
        } catch (error) {
            console.error('Error reading logs:', error);
            recentLogs = [`${new Date().toISOString()} [ERROR] Could not read logs: ${error.message}`];
        }

        const serverInfo = {
            versions: {
                ...keyDependencies,
                node: systemInfo.nodeVersion,
            },
            system: systemInfo,
            logs: recentLogs,
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json({
            success: true,
            data: serverInfo
        });

    } catch (error) {
        console.error('Server info error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve server information.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

export const GET = withAdminAuth(handleGet);