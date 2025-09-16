import Link from "next/link"
import Image from "next/image";
import { useAuth } from '@/hooks/useAuth';
import { useCart } from 'react-use-cart';
import { FaCartShopping } from "react-icons/fa6"; 
import { Button } from "@/components/ui/button"
import { ThemeSwitchButton } from '@/components/ui/theme-mode';

export default function Header() {
    const { isAuthenticated, user, status, logout } = useAuth();
    const { totalItems } = useCart();

    const handleSignOut = async() => {
    await logout();
    };

    return (
        <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6">
            <Link href="/" className="mr-6 hidden lg:flex" prefetch={false}>
                <Image 
                alt="Logo"
                src="/next.svg"
                width={0}
                height={30}
                className="h-6 w-auto dark:invert"
                priority={true}
                />  
            </Link>
            <div className="ml-auto flex gap-2"> 
 
                <ThemeSwitchButton />

                {!isAuthenticated ? (
                    <>
                    <Link 
                    href="/auth/login" 
                    prefetch={false}
                    >
                    <Button variant="outline" className="justify-self-end">
                        Sign in
                    </Button>
                    </Link> 
                    <Link 
                        href="/auth/register" 
                        prefetch={false}
                    >
                    <Button className="justify-self-end">Create account</Button>
                    </Link>
                    </>
                ) : (
                    <Button 
                        onClick={handleSignOut}
                        className="justify-self-end" 
                    > Sign Out
                    </Button>
                )} 
                
                <Link
                    href="/shop/cart"
                    className="relative"
                >
                    <Button>
                        <FaCartShopping />
                        <span
                            className="badge bg-white text-black dark:bg-black dark:text-white absolute -top-2 -right-2 border font-bold px-2 text-sm rounded-full flex items-center justify-center">
                            {totalItems}
                        </span>
                    </Button>
                </Link>
            </div>
        </header>
    )
}

function ShirtIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path
                d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
    )
}
