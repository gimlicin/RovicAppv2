import ShopFooter from '@/components/frontend/ShopFooter'
import ShopHeader from '@/components/frontend/ShopHeader'
import CartSidebar from '@/components/frontend/CartSidebar'
import NotificationSidebar from '@/components/frontend/NotificationSidebar'
import FlashMessage from '@/components/flash-message'
import React from 'react'
import { ThemeProvider } from "@/components/theme-provider"

export default function ShopFrontLayout({children}:{children:React.ReactNode}) {
  return (
    <div>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
        <FlashMessage />
        <ShopHeader/>
        {children}
        <ShopFooter/>
        <CartSidebar/>
        <NotificationSidebar/>
          </ThemeProvider>
    </div>
  )
}
