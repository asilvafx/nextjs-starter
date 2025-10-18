'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useVisitorTracking from '@/hooks/useVisitorTracking';

export const TrackingActions = () => {
    const {
        trackEvent,
        trackButtonClick,
        trackFormSubmit,
        trackAddToCart,
        trackSearch,
        trackDownload,
        getVisitorId,
        getSessionId,
        isTrackingAvailable
    } = useVisitorTracking();

    const handleButtonClick = () => {
        trackButtonClick('example-button', 'demo-section');
    };

    const handleFormSubmit = () => {
        trackFormSubmit('demo-form', {
            name: 'John Doe',
            email: 'john@example.com'
        });
    };

    const handleAddToCart = () => {
        trackAddToCart({
            id: 'product-123',
            name: 'Demo Product',
            price: 29.99,
            quantity: 1
        });
    };

    const handleSearch = () => {
        trackSearch('demo search query', 15);
    };

    const handleDownload = () => {
        trackDownload('demo-file.pdf', 'pdf');
    };

    const handleCustomEvent = () => {
        trackEvent('custom_interaction', {
            feature: 'demo',
            value: 42,
            category: 'engagement'
        });
    };

    if (!isTrackingAvailable()) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Visitor Tracking</CardTitle>
                    <CardDescription>Tracking is not available</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Visitor Tracking Examples</CardTitle>
                <CardDescription>Click buttons to send tracking events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleButtonClick}>Track Button Click</Button>
                    <Button onClick={handleFormSubmit}>Track Form Submit</Button>
                    <Button onClick={handleAddToCart}>Track Add to Cart</Button>
                    <Button onClick={handleSearch}>Track Search</Button>
                    <Button onClick={handleDownload}>Track Download</Button>
                    <Button onClick={handleCustomEvent}>Track Custom Event</Button>
                </div>

                <div className="text-gray-600 text-sm">
                    <p>Visitor ID: {getVisitorId()}</p>
                    <p>Session ID: {getSessionId()}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default TrackingActions;
