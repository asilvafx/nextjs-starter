// app/shop/components/FreeShippingProgressBar.jsx
"use client"

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Truck } from 'lucide-react';

const FreeShippingProgressBar = ({ cartTotal, threshold = 50 }) => {
    const progress = Math.min((cartTotal / threshold) * 100, 100);
    const remaining = Math.max(threshold - cartTotal, 0);
    const isEligible = cartTotal >= threshold;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 lg:mb-6"
        >
            <Card className="bg-gradient-to-r from-gray-50 to-neutral-50 dark:from-gray-900 dark:to-neutral-900">
                <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${isEligible ? 'text-green-700 bg-green-100 dark:bg-green-900' : 'text-neutral-800 bg-neutral-100 dark:bg-neutral-800'}`}>
                                {isEligible ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <Truck className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                                <h3 className={`font-semibold ${isEligible ? 'text-green-800 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {isEligible ? (
                                        "Youpi ! Livraison gratuite débloquée 🎉"
                                    ) : (
                                        "Presque là ! Livraison gratuite à 50€"
                                    )}
                                </h3>
                                <p className={`text-sm ${isEligible ? 'text-green-800 dark:text-green-400' : 'text-muted-foreground'}`}>
                                    {isEligible ? (
                                        "Ta commande bénéficie de la livraison gratuite"
                                    ) : (
                                        `Plus que ${remaining.toFixed(2)}€ pour débloquer la livraison gratuite`
                                    )}
                                </p>
                            </div>
                        </div>
                        {!isEligible && (
                            <div className="text-right">
                                <Badge variant="secondary" className="text-lg px-3 py-1 mb-1">
                                    €{remaining.toFixed(2)}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                    restants
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
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>€0</span>
                        <span className="font-medium">€50 - Livraison gratuite</span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default FreeShippingProgressBar;
