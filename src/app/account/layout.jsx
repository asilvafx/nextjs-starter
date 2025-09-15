// app/account/layout.js
import { LayoutProvider } from '@/app/main/context/LayoutProvider'

export default function MainLayout({ children }) {
    return (
        <LayoutProvider>
            {children}
        </LayoutProvider>
    )
}
