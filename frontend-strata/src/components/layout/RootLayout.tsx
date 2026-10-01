import { Outlet } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/layout/ScrollToTop'

export default function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
