'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function IntegrationsTestPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testIntegrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/query/public/integrations');
      const data = await response.json();
      
      if (data.success) {
        setIntegrations(data.data);
      } else {
        setError(data.error || 'Failed to fetch integrations');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testIntegrations();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Integrations Test Page</h1>
      
      <div className="mb-4">
        <Button onClick={testIntegrations} disabled={loading}>
          {loading ? 'Testing...' : 'Test Integrations API'}
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">❌ Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Integrations API Working</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={integration.enabled ? 'default' : 'secondary'}>
                      {integration.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Badge variant={integration.configured ? 'default' : 'outline'}>
                      {integration.configured ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-green-50 rounded">
              <h4 className="font-semibold text-green-800 mb-2">✅ Verification Results:</h4>
              <ul className="space-y-1 text-sm text-green-700">
                {['Google Analytics', 'Google Maps', 'Cloudflare Turnstile'].map(expectedIntegration => {
                  const found = integrations.find(i => i.name === expectedIntegration);
                  return (
                    <li key={expectedIntegration}>
                      {found ? '✅' : '❌'} {expectedIntegration} integration {found ? 'found' : 'missing'}
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}