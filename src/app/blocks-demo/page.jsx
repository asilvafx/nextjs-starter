import BlockEl from '@/components/BlockEl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Type, Image, Video, Youtube, FileText, Layout } from 'lucide-react';

export default function BlocksDemo() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="mb-4 font-bold text-4xl">Content Blocks Demo</h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    This page demonstrates the BlockEl component system. Create blocks in the admin panel 
                    and use them anywhere in your site with just a simple <code className="bg-gray-100 px-2 py-1 rounded">&lt;BlockEl id="block_id" /&gt;</code> component.
                </p>
            </div>

            <div className="space-y-12">
                {/* Introduction */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layout className="h-6 w-6" />
                            How It Works
                        </CardTitle>
                        <CardDescription>
                            The BlockEl component automatically fetches and renders different types of content blocks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Available Block Types</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Type className="h-4 w-4" />
                                        <Badge variant="outline">Text Block</Badge>
                                        <span className="text-sm text-gray-600">Simple text content</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Code className="h-4 w-4" />
                                        <Badge variant="outline">HTML Block</Badge>
                                        <span className="text-sm text-gray-600">Custom HTML + CSS + JS</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Image className="h-4 w-4" />
                                        <Badge variant="outline">Image Block</Badge>
                                        <span className="text-sm text-gray-600">Images with captions</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Video className="h-4 w-4" />
                                        <Badge variant="outline">Video Block</Badge>
                                        <span className="text-sm text-gray-600">Video files and streams</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Youtube className="h-4 w-4" />
                                        <Badge variant="outline">YouTube Block</Badge>
                                        <span className="text-sm text-gray-600">YouTube video embeds</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <Badge variant="outline">Form Block</Badge>
                                        <span className="text-sm text-gray-600">Contact and data forms</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Layout className="h-4 w-4" />
                                        <Badge variant="outline">Layout Block</Badge>
                                        <span className="text-sm text-gray-600">Grid and container layouts</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Usage Examples</h3>
                                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm space-y-2">
                                    <div>
                                        <span className="text-gray-600">// Basic usage</span><br />
                                        <code>&lt;BlockEl id="welcome_text" /&gt;</code>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">// With custom styling</span><br />
                                        <code>&lt;BlockEl id="hero_image" className="rounded-lg shadow-lg" /&gt;</code>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">// With fallback content</span><br />
                                        <code>&lt;BlockEl id="missing_block" fallback=&lt;p&gt;Content not found&lt;/p&gt; /&gt;</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Example Blocks */}
                <div className="grid gap-8">
                    {/* Text Block Example */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Type className="h-5 w-5" />
                                Text Block Example
                            </CardTitle>
                            <CardDescription>
                                Simple text content that can be managed from the admin panel
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                                    &lt;BlockEl id="welcome_text" /&gt;
                                </code>
                            </div>
                            <div className="border rounded-lg p-4 bg-white">
                                <BlockEl 
                                    id="welcome_text" 
                                    fallback={
                                        <div className="text-gray-500 italic">
                                            Create a text block with ID "welcome_text" in the admin panel to see it here.
                                        </div>
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* HTML Block Example */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="h-5 w-5" />
                                HTML Block Example
                            </CardTitle>
                            <CardDescription>
                                Custom HTML with CSS and JavaScript support
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                                    &lt;BlockEl id="custom_widget" /&gt;
                                </code>
                            </div>
                            <div className="border rounded-lg p-4 bg-white">
                                <BlockEl 
                                    id="custom_widget"
                                    fallback={
                                        <div className="text-gray-500 italic">
                                            Create an HTML block with ID "custom_widget" in the admin panel to see a custom widget here.
                                        </div>
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Image Block Example */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                Image Block Example
                            </CardTitle>
                            <CardDescription>
                                Images with alt text and optional captions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                                    &lt;BlockEl id="hero_image" className="rounded-lg shadow-lg" /&gt;
                                </code>
                            </div>
                            <div className="border rounded-lg p-4 bg-white">
                                <BlockEl 
                                    id="hero_image" 
                                    className="rounded-lg shadow-lg"
                                    fallback={
                                        <div className="text-gray-500 italic">
                                            Create an image block with ID "hero_image" in the admin panel to display an image here.
                                        </div>
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* YouTube Block Example */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Youtube className="h-5 w-5" />
                                YouTube Block Example
                            </CardTitle>
                            <CardDescription>
                                Embedded YouTube videos with custom settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                                    &lt;BlockEl id="demo_video" /&gt;
                                </code>
                            </div>
                            <div className="border rounded-lg p-4 bg-white">
                                <BlockEl 
                                    id="demo_video"
                                    fallback={
                                        <div className="text-gray-500 italic">
                                            Create a YouTube block with ID "demo_video" in the admin panel to embed a video here.
                                        </div>
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Block Example */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Form Block Example
                            </CardTitle>
                            <CardDescription>
                                Dynamic forms with customizable fields
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                                    &lt;BlockEl id="contact_form" /&gt;
                                </code>
                            </div>
                            <div className="border rounded-lg p-4 bg-white">
                                <BlockEl 
                                    id="contact_form"
                                    fallback={
                                        <div className="text-gray-500 italic">
                                            Create a form block with ID "contact_form" in the admin panel to display a contact form here.
                                        </div>
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Layout Block Example */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layout className="h-5 w-5" />
                                Layout Block Example
                            </CardTitle>
                            <CardDescription>
                                Grid and flexbox layouts for organizing content
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                                    &lt;BlockEl id="feature_grid" /&gt;
                                </code>
                            </div>
                            <div className="border rounded-lg p-4 bg-white">
                                <BlockEl 
                                    id="feature_grid"
                                    fallback={
                                        <div className="text-gray-500 italic">
                                            Create a layout block with ID "feature_grid" in the admin panel to display a grid layout here.
                                        </div>
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Getting Started Guide */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-blue-900">Getting Started</CardTitle>
                        <CardDescription className="text-blue-700">
                            Follow these steps to start using content blocks in your site
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6 text-blue-800">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold">1. Create Blocks in Admin</h3>
                                    <p className="text-sm">
                                        Go to <code className="bg-blue-100 px-2 py-1 rounded">Admin → Blocks</code> to create and manage your content blocks.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold">2. Copy the Block ID</h3>
                                    <p className="text-sm">
                                        Each block gets a unique ID that you'll use to reference it in your components.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold">3. Use BlockEl Component</h3>
                                    <p className="text-sm">
                                        Import and use the BlockEl component in any React page or component.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold">Code Example</h3>
                                    <div className="bg-blue-100 p-3 rounded text-sm font-mono">
                                        <div className="text-blue-600">// Import the component</div>
                                        <div>import BlockEl from '@/components/BlockEl';</div>
                                        <br />
                                        <div className="text-blue-600">// Use in your JSX</div>
                                        <div>&lt;BlockEl id="your_block_id" /&gt;</div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Features</h3>
                                    <ul className="text-sm space-y-1">
                                        <li>✅ Automatic type detection and rendering</li>
                                        <li>✅ Loading states and error handling</li>
                                        <li>✅ Fallback content support</li>
                                        <li>✅ Custom styling with className and style props</li>
                                        <li>✅ Active/inactive status respect</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Multiple Blocks Example */}
                <Card>
                    <CardHeader>
                        <CardTitle>Multiple Blocks Example</CardTitle>
                        <CardDescription>
                            You can use multiple blocks together to build complex layouts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <BlockEl 
                                    id="sidebar_text" 
                                    fallback={<div className="bg-gray-100 p-4 rounded text-gray-500 italic">Sidebar text block</div>}
                                />
                                <BlockEl 
                                    id="main_content" 
                                    fallback={<div className="bg-gray-100 p-4 rounded text-gray-500 italic">Main content block</div>}
                                />
                            </div>
                            <BlockEl 
                                id="footer_info" 
                                fallback={<div className="bg-gray-100 p-4 rounded text-center text-gray-500 italic">Footer info block</div>}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
