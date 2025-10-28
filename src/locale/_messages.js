// Statically import all translation JSON files so the bundler includes them
// This ensures translations are available in production (Vercel) where
// reading from the filesystem at runtime may not work in serverless/edge.

import Auth_en from './en/Auth.json';
import Cart_en from './en/Cart.json';
import Checkout_en from './en/Checkout.json';
import GDPR_en from './en/GDPR.json';
import HomePage_en from './en/HomePage.json';
import Shop_en from './en/Shop.json';

import Auth_es from './es/Auth.json';
import Cart_es from './es/Cart.json';
import Checkout_es from './es/Checkout.json';
import GDPR_es from './es/GDPR.json';
import Shop_es from './es/Shop.json';

import Auth_fr from './fr/Auth.json';
import Cart_fr from './fr/Cart.json';
import Checkout_fr from './fr/Checkout.json';
import GDPR_fr from './fr/GDPR.json';
import HomePage_fr from './fr/HomePage.json';
import Shop_fr from './fr/Shop.json';

function mergeFiles(...files) {
    return Object.assign({}, ...files.filter(Boolean));
}

const bundled = {
    en: mergeFiles(Auth_en, Cart_en, Checkout_en, GDPR_en, HomePage_en, Shop_en),
    es: mergeFiles(Auth_es, Cart_es, Checkout_es, GDPR_es, Shop_es),
    fr: mergeFiles(Auth_fr, Cart_fr, Checkout_fr, GDPR_fr, HomePage_fr, Shop_fr)
};

export function getBundledTranslations(locale) {
    return bundled[locale] || {};
}

export default bundled;
