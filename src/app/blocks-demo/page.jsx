import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Type, Image, Video, Youtube, FileText, Layout, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Blocks Demo Page
 * 
 * This page demonstrates how to use the BlockEl component system.
 * 
 * To display blocks on this page:
 * 1. Create blocks in the admin panel (/admin/blocks)
 * 2. Import BlockEl: import BlockEl from '@/components/BlockEl'
 * 3. Use the component: <BlockEl id="your_block_id" />
 * 
 * Example:
 * import BlockEl from '@/components/BlockEl';
 * 
 * <BlockEl id="welcome_text" />
 * <BlockEl id="hero_image" className="rounded-lg" />
 */

export default function BlocksDemo() {
    // Define blocks to display (add block IDs here after creating them in admin panel)
    const demoBlocks = [
        // Example: { id: 'welcome_text', title: 'Welcome Text', description: 'A simple text block' },
        // Example: { id: 'hero_image', title: 'Hero Image', description: 'Hero section image' },
    ];

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
                {/* Quick Start Guide */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <Info className="h-6 w-6" />
                            Getting Started
                        </CardTitle>
                        <CardDescription className="text-blue-700">
                            Follow these steps to create and display blocks on this page
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">1</div>
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">Create Blocks in Admin Panel</h4>
                                <p className="text-sm text-blue-700 mb-2">
                                    Go to the admin panel and create your content blocks with different types (text, HTML, images, videos, etc.)
                                </p>
                                <Link 
                                    href="/admin/blocks" 
                                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    Open Admin Blocks Panel <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">2</div>
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">Import BlockEl Component</h4>
                                <p className="text-sm text-blue-700 mb-2">Add this import at the top of this file:</p>
                                <div className="p-3 rounded border border-blue-200 font-mono text-sm">
                                    <code>import BlockEl from '@/components/BlockEl';</code>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">3</div>
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">Add Block IDs to Demo Array</h4>
                                <p className="text-sm text-blue-700 mb-2">Update the demoBlocks array in this file:</p>
                                <div className="p-3 rounded border border-blue-200 font-mono text-sm">
                                    <code className="whitespace-pre">{`const demoBlocks = [
  { id: 'your_block_id', title: 'Block Title', description: 'Description' },
];`}</code>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">4</div>
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">Display Blocks</h4>
                                <p className="text-sm text-blue-700 mb-2">Use the BlockEl component to render your blocks:</p>
                                <div className="p-3 rounded border border-blue-200 font-mono text-sm">
                                    <code>&lt;BlockEl id="your_block_id" /&gt;</code>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                <div className="p-4 rounded-lg font-mono text-sm space-y-2">
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

                {/* Demo Blocks Section */}
                {demoBlocks.length > 0 ? (
                    <div className="grid gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Live Demo Blocks</CardTitle>
                                <CardDescription>
                                    These are the blocks you've imported on this page
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Blocks will be displayed here once you add them to the demoBlocks array */}
                                {/* Example:
                                {demoBlocks.map((block) => (
                                    <Card key={block.id} className="mb-4">
                                        <CardHeader>
                                            <CardTitle>{block.title}</CardTitle>
                                            <CardDescription>{block.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <BlockEl id={block.id} />
                                        </CardContent>
                                    </Card>
                                ))}
                                */}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <Card className="border-2 border-gray-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-700">
                                <Layout className="h-6 w-6" />
                                No Blocks Imported Yet
                            </CardTitle>
                            <CardDescription>
                                Start by creating blocks in the admin panel, then import them here
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-4">
                                This demo page will display blocks once you:
                            </p>
                            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
                                <li>Create blocks in the <Link href="/admin/blocks" className="text-blue-600 hover:underline">admin panel</Link></li>
                                <li>Add block IDs to the <code className="bg-gray-100 px-2 py-1 rounded">demoBlocks</code> array in this file</li>
                                <li>Import <code className="bg-gray-100 px-2 py-1 rounded">BlockEl</code> component at the top of this file</li>
                                <li>Use <code className="bg-gray-100 px-2 py-1 rounded">&lt;BlockEl id="your_block_id" /&gt;</code> to render blocks</li>
                            </ol>
                            <div className="p-4 rounded-lg border border-gray-200">
                                <p className="font-semibold mb-2">Example Implementation:</p>
                                <pre className="p-3 rounded border text-sm overflow-x-auto">
<code>{`// 1. Import BlockEl
import BlockEl from '@/components/BlockEl';

// 2. Add blocks to demoBlocks array
const demoBlocks = [
  { 
    id: 'welcome_text', 
    title: 'Welcome Text', 
    description: 'A text block' 
  },
  { 
    id: 'hero_image', 
    title: 'Hero Image', 
    description: 'Main hero image' 
  },
];

// 3. Display blocks in JSX
{demoBlocks.map((block) => (
  <BlockEl key={block.id} id={block.id} />
))}`}</code>
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* API Documentation */}
                <Card>
                    <CardHeader>
                        <CardTitle>BlockEl Component Props</CardTitle>
                        <CardDescription>
                            Available props for customizing block rendering
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <code className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-semibold">id</code>
                                <span className="text-gray-600 ml-2">(required) - The unique identifier of the block</span>
                            </div>
                            <div>
                                <code className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-semibold">className</code>
                                <span className="text-gray-600 ml-2">(optional) - Additional CSS classes for styling</span>
                            </div>
                            <div>
                                <code className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-semibold">style</code>
                                <span className="text-gray-600 ml-2">(optional) - Inline styles object</span>
                            </div>
                            <div>
                                <code className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-semibold">fallback</code>
                                <span className="text-gray-600 ml-2">(optional) - Content to display if block is not found</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
