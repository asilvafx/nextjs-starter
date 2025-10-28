// @/app/admin/system/integrations/page.jsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function IntegrationsPage() {
    return (
        <div className="container mx-auto p-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-3xl">Integrations</h1>
                    <p className="text-muted-foreground">This page is reserved for third-party integrations.\nCurrently, integrations like Google Maps, Turnstile and Twilio are configured in System Settings.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>No integrations configured here</CardTitle>
                </CardHeader>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Use the <strong>System Settings</strong> page to configure built-in integrations (Maps, SMS, Security).
                </CardContent>
            </Card>
        </div>
    );
}
