"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from 'react-use-cart';
import { FaCartShopping } from "react-icons/fa6";

const Header = () => {

    const { totalItems } = useCart();

    return (
        <header>
            <nav className="fixed w-full top-0 left-0 right-0 bg-light z-50 border-gray-200 p-4 lg:p-6">
                <div className="w-full max-w-5xl px-0 md:px-4 mx-auto flex flex-wrap gap-4 justify-between items-center h-10">
                    <Link href="/">
                        <Image
                            src='/next.svg'
                            className="h-6 w-auto logo-img"
                            width={80}
                            height={80}
                            alt="logo"
                            placeholder="empty"
                            priority={true}
                            unoptimized={false}
                        />
                    </Link>
                    <div className="flex items-center lg:order-2">

                        <Link
                            href="/shop/cart"
                            className="button px-4 py-2 rounded-sm relative ms-4"
                        >
                            <FaCartShopping />
                            <span className="badge bg-primary text-white absolute -top-2 -right-2 border font-bold px-2 text-sm rounded flex items-center justify-center">
                                {totalItems}
                            </span>
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;
