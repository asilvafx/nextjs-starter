// @/components/LanguageDemo.jsx
'use client';

import { useTranslations } from 'next-intl';
import { useLanguage } from '@/context/LanguageContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LanguageDemo() {
    const homeT = useTranslations('HomePage');
    const shopT = useTranslations('Shop');
    const cartT = useTranslations('Cart');
    const authT = useTranslations('Auth');
    
    const { currentLanguage, availableLanguages, setCurrentLanguage } = useLanguage();

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>🌍 Dynamic Language System Demo</CardTitle>
                <CardDescription>
                    Current Language: <strong>{currentLanguage}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Language Switcher */}
                <div className="space-y-2">
                    <h3 className="font-semibold">Quick Language Switch:</h3>
                    <div className="flex gap-2 flex-wrap">
                        {availableLanguages.map((lang) => (
                            <Button
                                key={lang.id}
                                variant={lang.id === currentLanguage ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentLanguage(lang.id)}
                                className="flex items-center gap-2">
                                {lang.flag} {lang.name}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Translation Examples */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Translation Examples:</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">HomePage</h4>
                            <p className="font-semibold">{homeT('title')}</p>
                            <p className="text-sm">{homeT('welcome_back')}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Shop</h4>
                            <p className="font-semibold">{shopT('shopTitle')}</p>
                            <p className="text-sm">{shopT('addToCart')}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Cart</h4>
                            <p className="font-semibold">{cartT('title')}</p>
                            <p className="text-sm">{cartT('orderSummary')}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Auth</h4>
                            <p className="font-semibold">{authT('login')}</p>
                            <p className="text-sm">{authT('register')}</p>
                        </div>
                    </div>
                </div>

                {/* Fallback Example */}
                <div className="space-y-2">
                    <h3 className="font-semibold">Fallback Examples:</h3>
                    <div className="p-3 bg-yellow-50 rounded-lg dark:bg-yellow-900/20">
                        <p className="text-sm"><strong>Fallback to English:</strong> {cartT('orderSummaryFallbackTest')}</p>
                        <p className="text-sm"><strong>Missing translation:</strong> {cartT('nonExistentKey')}</p>
                    </div>
                </div>

                <div className="text-xs text-gray-500 mt-4">
                    💡 Change language using the header selector or buttons above to see translations update.
                    The page will reload to apply new translations.
                </div>
            </CardContent>
        </Card>
    );
}