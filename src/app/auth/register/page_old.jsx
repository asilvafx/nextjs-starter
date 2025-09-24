// @/app/auth/register/page.jsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterForm } from "@/components/register-form";
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

const RegisterPage = () => {\n    const router = useRouter();\n    const { status } = useSession();\n    const [isLoading, setIsLoading] = useState(true);\n    const [registrationAllowed, setRegistrationAllowed] = useState(false);\n\n    useEffect(() => {\n        const checkSettings = async () => {\n            try {\n                const response = await fetch('/api/query/public/site_settings?_t=' + Date.now());\n                if (response.ok) {\n                    const data = await response.json();\n                    if (data.success && data.data && data.data.length > 0) {\n                        const settings = data.data[0];\n                        if (settings.allowRegistration === false) {\n                            router.push('/auth/login');\n                            return;\n                        }\n                        setRegistrationAllowed(true);\n                    } else {\n                        // If no settings found, allow registration by default\n                        setRegistrationAllowed(true);\n                    }\n                } else {\n                    // If API fails, allow registration by default\n                    setRegistrationAllowed(true);\n                }\n            } catch (error) {\n                console.error('Failed to fetch settings:', error);\n                // If error, allow registration by default\n                setRegistrationAllowed(true);\n            } finally {\n                setIsLoading(false);\n            }\n        };\n\n        if (status === \"authenticated\") {\n            router.push(\"/\");\n        } else if (status === \"unauthenticated\") {\n            checkSettings();\n        }\n    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (status === "authenticated") {
        return null;
    }

    return (
        <motion.div 
            className='auth-section'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <RegisterForm />
            <div className='mt-6 text-center'>
                <Link href='/' className='text-blue-500 hover:underline'>
                    ← Back to Home
                </Link>
            </div>
        </motion.div>
    );
};

export default RegisterPage;
