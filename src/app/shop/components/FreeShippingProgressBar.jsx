// app/shop/components/FreeShippingProgressBar.jsx
"use client"

import { motion } from 'framer-motion';
import Link from 'next/link';

const FreeShippingProgressBar = ({ cartTotal, threshold = 50 }) => {
    const progress = Math.min((cartTotal / threshold) * 100, 100);
    const remaining = Math.max(threshold - cartTotal, 0);
    const isEligible = cartTotal >= threshold;

    return (
        <motion.div
            className="bg-gradient-to-r from-gray-50 to-neutral-50 rounded-sm p-4 lg:p-6 mb-4 lg:mb-6 border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${isEligible ? 'text-green-700' : 'text-neutral-800'}`}>
                        {isEligible ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <h3 className={`font-semibold ${isEligible ? 'text-green-800' : 'text-gray-700'}`}>
                            {isEligible ? (
                                "Youpi ! Livraison gratuite débloquée 🎉"
                            ) : (
                                "Presque là ! Livraison gratuite à 50€"
                            )}
                        </h3>
                        <p className={`text-sm ${isEligible ? 'text-green-800' : 'text-gray-600'}`}>
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
                        <div className="text-2xl font-bold text-blue-600">
                            €{remaining.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                            restants
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-300 rounded-full h-3 mb-3 overflow-hidden">
                <motion.div
                    className={`h-3 rounded-full transition-all duration-700 ${
                        isEligible ? 'bg-gradient-to-r from-green-300 to-green-500' : 'bg-gradient-to-r from-neutral-600 to-neutral-800'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </div>

            {/* Progress indicators */}
            <div className="flex justify-between text-xs text-gray-500">
                <span>€0</span>
                <span className="font-medium">€50 - Livraison gratuite</span>
            </div>
        </motion.div>
    );
};

export default FreeShippingProgressBar;
