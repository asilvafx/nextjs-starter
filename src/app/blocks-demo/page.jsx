import Block from '@/components/Block';
import BlocksList from '@/components/BlocksList';

export default function BlocksDemo() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blocks Demo</h1>
      
      <div className="space-y-12">
        {/* Single Block Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Single Block Example</h2>
          <p className="text-gray-600 mb-4">
            This demonstrates how to display a single block by its slug:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="text-sm">
              {`<Block slug="welcome-message" className="my-custom-class" />`}
            </code>
          </div>
          <div className="mt-4 border rounded-lg p-4">
            <Block 
              slug="welcome-message" 
              className="welcome-block"
              fallback={<p className="text-gray-500">Block 'welcome-message' not found</p>}
            />
          </div>
        </section>

        {/* Multiple Blocks Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Blocks List Example</h2>
          <p className="text-gray-600 mb-4">
            This demonstrates how to display all blocks of a specific type:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="text-sm">
              {`<BlocksList type="text" limit={3} className="space-y-6" />`}
            </code>
          </div>
          <div className="mt-4">
            <BlocksList 
              type="text" 
              limit={5}
              className="space-y-6"
              itemClassName="border rounded-lg p-4 bg-white shadow-sm"
              fallback={<p className="text-gray-500">No text blocks found</p>}
            />
          </div>
        </section>

        {/* HTML Blocks Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">HTML Blocks Example</h2>
          <p className="text-gray-600 mb-4">
            HTML blocks can contain custom code and styling:
          </p>
          <div className="mt-4">
            <BlocksList 
              type="html" 
              limit={3}
              className="space-y-6"
              itemClassName="border rounded-lg p-4 bg-white shadow-sm"
              fallback={<p className="text-gray-500">No HTML blocks found</p>}
            />
          </div>
        </section>

        {/* Form Blocks Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Form Blocks Example</h2>
          <p className="text-gray-600 mb-4">
            Form blocks can contain interactive forms:
          </p>
          <div className="mt-4">
            <BlocksList 
              type="form" 
              limit={2}
              className="space-y-6"
              itemClassName="border rounded-lg p-4 bg-white shadow-sm"
              fallback={<p className="text-gray-500">No form blocks found</p>}
            />
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-blue-900">How to Use Blocks</h2>
          <div className="space-y-4 text-blue-800">
            <div>
              <h3 className="font-semibold">1. Create blocks in the admin panel</h3>
              <p className="text-sm">Go to Admin → Store → Blocks to create and manage your content blocks.</p>
            </div>
            <div>
              <h3 className="font-semibold">2. Use blocks in your components</h3>
              <p className="text-sm">Import and use the Block component with a slug to display content.</p>
            </div>
            <div>
              <h3 className="font-semibold">3. List multiple blocks</h3>
              <p className="text-sm">Use the BlocksList component to display multiple blocks of the same type.</p>
            </div>
            <div>
              <h3 className="font-semibold">4. Add custom styling</h3>
              <p className="text-sm">Each block can have custom CSS and JavaScript for advanced functionality.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}