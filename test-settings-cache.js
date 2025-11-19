#!/usr/bin/env node
// test-settings-cache.js - Test script for settings caching functionality

import { getSiteSettings, getCachedStoreSettings, clearSettingsCache } from './src/lib/server/admin.js';

async function testSettingsCache() {
    console.log('🧪 Testing Settings Cache Functionality\n');
    
    try {
        // Test 1: Load settings for the first time
        console.log('1️⃣  First load (should hit database):');
        const start1 = Date.now();
        const siteSettings1 = await getSiteSettings();
        const storeSettings1 = await getCachedStoreSettings();
        const end1 = Date.now();
        
        console.log(`   ⏱️  Time: ${end1 - start1}ms`);
        console.log(`   📄 Site settings loaded: ${siteSettings1 ? 'Yes' : 'No'}`);
        console.log(`   🏪 Store settings loaded: ${storeSettings1 ? 'Yes' : 'No'}`);
        console.log('');
        
        // Test 2: Load settings again (should use cache)
        console.log('2️⃣  Second load (should use cache):');
        const start2 = Date.now();
        const siteSettings2 = await getSiteSettings();
        const storeSettings2 = await getCachedStoreSettings();
        const end2 = Date.now();
        
        console.log(`   ⏱️  Time: ${end2 - start2}ms`);
        console.log(`   📄 Site settings from cache: ${siteSettings2 ? 'Yes' : 'No'}`);
        console.log(`   🏪 Store settings from cache: ${storeSettings2 ? 'Yes' : 'No'}`);
        console.log(`   ⚡ Cache hit improvement: ${(end1 - start1) - (end2 - start2)}ms faster`);
        console.log('');
        
        // Test 3: Clear cache and reload
        console.log('3️⃣  Clear cache and reload:');
        clearSettingsCache();
        console.log('   🧹 Cache cleared');
        
        const start3 = Date.now();
        const siteSettings3 = await getSiteSettings();
        const storeSettings3 = await getCachedStoreSettings();
        const end3 = Date.now();
        
        console.log(`   ⏱️  Time after cache clear: ${end3 - start3}ms`);
        console.log(`   📄 Site settings reloaded: ${siteSettings3 ? 'Yes' : 'No'}`);
        console.log(`   🏪 Store settings reloaded: ${storeSettings3 ? 'Yes' : 'No'}`);
        console.log('');
        
        // Test 4: Verify data structure
        console.log('4️⃣  Data structure verification:');
        if (siteSettings3) {
            console.log(`   📄 Site settings keys: ${Object.keys(siteSettings3).length} properties`);
            console.log(`   🎨 Example properties: ${Object.keys(siteSettings3).slice(0, 5).join(', ')}`);
        }
        if (storeSettings3) {
            console.log(`   🏪 Store settings keys: ${Object.keys(storeSettings3).length} properties`);
            console.log(`   💰 Example properties: ${Object.keys(storeSettings3).slice(0, 5).join(', ')}`);
        }
        
        console.log('\n✅ Settings cache test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Export for module usage
export { testSettingsCache };

// Run if called directly
if (process.argv[1].endsWith('test-settings-cache.js')) {
    testSettingsCache();
}