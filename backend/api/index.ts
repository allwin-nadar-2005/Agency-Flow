import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../src/app.js';

let appPromise: ReturnType<typeof buildApp> | null = null;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    try {
        if (!appPromise) {
            appPromise = buildApp();
        }

        const app = await appPromise;

        await app.ready();

        app.server.emit('request', req, res);
    } catch (error) {
        console.error('Backend startup error:', error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }
}




