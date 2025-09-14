'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToTop() {
    const pathname = usePathname()

    useEffect(() => {
        // Scroll to top whenever the pathname changes
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [pathname])

    return null
}
