import React from 'react';

const gateways_img = '/images/gateways.png';

const Footer = () => {

    return (
        <footer className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-4">
            <p>&copy; 2025</p>
            {/* Vertical Line */}
            <div className="w-px h-28 bg-gradient-to-b from-black dark:from-white to-transparent opacity-50 mb-4" />
            <img src={gateways_img} className="h-12 w-auto mx-auto filter grayscale contrast-125 brightness-150 mb-8" />
            <ul className="w-full flex justify-between items-center gap-2 text-sm mb-8">
                <li>Terms and conditions</li>
                <li>Privacy Policy</li>
                <li>Returns Policy</li>
            </ul>
        </footer>
    );
}

export default Footer;
