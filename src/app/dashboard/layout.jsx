// app/dashboard/layout.js
import { LayoutProvider } from './context/LayoutProvider'

export default function DashboardLayout({ children }) {
    return (
        <LayoutProvider>
            {children}
        </LayoutProvider>
    )
}
