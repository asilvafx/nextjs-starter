// app/shop/components/FreeShippingProgressBar.jsx
'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const FreeShippingProgressBar = ({ cartTotal, storeSettings = null }) => {
    const t = useTranslations('Cart');
    const [threshold, setThreshold] = useState(50);
    const [currency, setCurrency] = useState('EUR');
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        if (storeSettings) {
            setThreshold(storeSettings.freeShippingThreshold || 50);
            setCurrency(storeSettings.currency || 'EUR');
            setIsEnabled(storeSettings.freeShippingEnabled !== false);
        }
    }, [storeSettings]);

    // Don't render if free shipping is disabled
    if (!isEnabled) {
        return null;
    }

    const progress = Math.min((cartTotal / threshold) * 100, 100);
    const remaining = Math.max(threshold - cartTotal, 0);
    const isEligible = cartTotal >= threshold;
    const currencySymbol = currency === 'USD' ? '$' : '€';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 lg:mb-6">
            <Card className="bg-gradient-to-r from-gray-50 to-neutral-50 dark:from-gray-900 dark:to-neutral-900">
                <CardContent className="p-4 lg:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div
                                className={`rounded-full p-2 ${isEligible ? 'bg-green-100 text-green-700 dark:bg-green-900' : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800'}`}>
                                {isEligible ? <CheckCircle className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                            </div>
                            <div>
                                <h3
                                    className={`font-semibold ${isEligible ? 'text-green-800 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {isEligible
                                        ? t('freeShippingEligible')
                                        : t('almostFreeShipping', { amount: `${currencySymbol}${threshold}` })}
                                </h3>
                                <p
                                    className={`text-sm ${isEligible ? 'text-green-800 dark:text-green-400' : 'text-muted-foreground'}`}>
                                    {isEligible
                                        ? t('freeShipping')
                                        : t('almostFreeShipping', {
                                              amount: `${currencySymbol}${remaining.toFixed(2)}`
                                          })}
                                </p>
                            </div>
                        </div>
                        {!isEligible && (
                            <div className="text-right">
                                <Badge variant="secondary" className="mb-1 px-3 py-1 text-lg">
                                    {currencySymbol}
                                    {remaining.toFixed(2)}
                                </Badge>
                                <div className="text-muted-foreground text-xs">
                                    {t('remaining', { defaultValue: 'restants' })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                        <Progress
                            value={progress}
                            className={`h-3 ${isEligible ? '[&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-green-600' : '[&>div]:bg-gradient-to-r [&>div]:from-neutral-400 [&>div]:to-neutral-600'}`}
                        />
                    </div>

                    {/* Progress indicators */}
                    <div className="flex justify-between text-muted-foreground text-xs">
                        <span>{currencySymbol}0</span>
                        <span className="font-medium">
                            {currencySymbol}
                            {threshold} - {t('freeShipping')}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default FreeShippingProgressBar;
