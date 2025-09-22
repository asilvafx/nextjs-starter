// app/main/layout.js
import { LayoutProvider } from './context/LayoutProvider'


export default function MainLayout({ children }) {
    return (
        <LayoutProvider>
            {children}
        </LayoutProvider>
    )
}
