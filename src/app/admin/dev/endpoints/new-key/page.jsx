"use client";

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Key, 
  ArrowLeft, 
  Copy,
  CheckCircle,
  Info,
  Shield,
  Zap,
  Clock
} from "lucide-react";
import { toast } from "sonner";

// Form validation schema
const apiKeySchema = z.object({
  name: z.string().min(1, "API key name is required").max(50, "Name must be less than 50 characters"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "At least one permission must be selected"),
  rateLimit: z.number().min(1, "Rate limit must be at least 1").max(10000, "Rate limit cannot exceed 10,000"),
  expiresAt: z.string().optional()
});

export default function NewKeyPage() {
  const [step, setStep] = useState(1);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Available permissions
  const permissions = [
    { id: "read:users", label: "Read Users", description: "View user information and profiles" },
    { id: "write:users", label: "Write Users", description: "Create and update user accounts" },
    { id: "delete:users", label: "Delete Users", description: "Remove user accounts" },
    { id: "read:products", label: "Read Products", description: "View product catalog and details" },
    { id: "write:products", label: "Write Products", description: "Create and update products" },
    { id: "delete:products", label: "Delete Products", description: "Remove products from catalog" },
    { id: "read:orders", label: "Read Orders", description: "View order information and history" },
    { id: "write:orders", label: "Write Orders", description: "Create and update orders" },
    { id: "read:analytics", label: "Read Analytics", description: "Access analytics and reporting data" },
    { id: "read:settings", label: "Read Settings", description: "View system configuration" },
    { id: "write:settings", label: "Write Settings", description: "Modify system configuration" }
  ];

  const form = useForm({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
      rateLimit: 100,
      expiresAt: ""
    }
  });

  const onSubmit = async (data) => {
    try {
      // Generate a mock API key
      const mockApiKey = `pk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGeneratedKey({
        key: mockApiKey,
        ...data,
        createdAt: new Date().toISOString(),
        id: Math.random().toString(36).substring(2, 9)
      });
      
      setStep(2);
      toast.success("API key created successfully!");
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedKey.key);
      setIsCopied(true);
      toast.success("API key copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const goBack = () => {
    window.history.back();
  };

  if (step === 2 && generatedKey) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to API Keys
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>API Key Created Successfully</CardTitle>
              <CardDescription>
                Your new API key has been generated. Make sure to copy it now as you won't be able to see it again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generated API Key */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Your API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    value={generatedKey.key} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2"
                  >
                    {isCopied ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Key Details */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">Key Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{generatedKey.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Rate Limit</p>
                    <p className="font-medium">{generatedKey.rateLimit} requests/hour</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(generatedKey.createdAt).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>

                {generatedKey.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{generatedKey.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedKey.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Security Warning */}
              <div className="flex gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Important Security Information</p>
                  <ul className="mt-2 text-yellow-700 space-y-1">
                    <li>• Store this API key securely and never share it publicly</li>
                    <li>• This key won't be shown again - copy it now</li>
                    <li>• Use environment variables to store the key in your applications</li>
                    <li>• Monitor usage and revoke the key if compromised</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={goBack} className="flex-1">
                  Go to API Keys
                </Button>
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Create Another Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create API Key</h1>
          <p className="text-muted-foreground">
            Generate a new API key with specific permissions and rate limits
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key Configuration
            </CardTitle>
            <CardDescription>
              Configure your new API key settings and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="My Application Key" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name to identify this API key
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Optional description of this key's purpose..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional description to help you remember this key's purpose
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Rate Limiting */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Rate Limiting
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="rateLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requests per Hour</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="100" 
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 100)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of requests this key can make per hour
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permissions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select the permissions this API key should have. Choose only the minimum required permissions for security.
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="permissions"
                    render={() => (
                      <FormItem>
                        <div className="grid gap-3">
                          {permissions.map((permission) => (
                            <FormField
                              key={permission.id}
                              control={form.control}
                              name="permissions"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={permission.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(permission.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, permission.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== permission.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-sm font-medium">
                                        {permission.label}
                                      </FormLabel>
                                      <FormDescription className="text-xs">
                                        {permission.description}
                                      </FormDescription>
                                    </div>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Expiration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Expiration (Optional)
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expires On</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave empty for a key that never expires
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <Button type="button" variant="outline" onClick={goBack} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    <Key className="h-4 w-4 mr-2" />
                    Generate API Key
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}