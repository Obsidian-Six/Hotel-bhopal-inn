import React, { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/lib/AuthContext'
import ProtectedRoute from '@/lib/ProtectedRoute'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Lazy loaded components
const Home = lazy(() => import('@/pages/Home'))
const Rooms = lazy(() => import('@/pages/Rooms'))
const RoomDetail = lazy(() => import('@/pages/RoomDetail'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const Contact = lazy(() => import('@/pages/Contact'))
const Offers = lazy(() => import('@/pages/Offers'))
const FAQ = lazy(() => import('@/pages/FAQ'))
const Booking = lazy(() => import('@/pages/Booking'))
const MyBookings = lazy(() => import('@/pages/MyBookings'))
const Banquet = lazy(() => import('@/pages/Banquet'))
const Gallery = lazy(() => import('@/pages/Gallery'))
const About = lazy(() => import('@/pages/About'))
const AdminLogin = lazy(() => import('@/pages/AdminLogin'))
const FoodMenu = lazy(() => import('@/pages/FoodMenu'))
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'))
const TermsAndConditions = lazy(() => import('@/pages/TermsAndConditions'))
const RefundPolicy = lazy(() => import('@/pages/RefundPolicy'))
import WhatsAppFloat from '@/components/layout/WhatsAppFloat'

// Loading component
const PageLoader = () => (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-[500]">
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#8B735B]/20 border-t-[#8B735B] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B735B]">Loading Bhopal Inn</p>
        </div>
    </div>
);

const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">{title}</h1>
      <p className="text-slate-500 mb-8">This page is under construction (Week 2 Sprint).</p>
      <a href="/" className="px-6 py-3 bg-[#8B735B] text-white rounded-md hover:bg-[#725e4a] transition">Return Home</a>
    </div>
  </div>
)

// Scroll restoration helper
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <GoogleOAuthProvider clientId="473199157851-81idd74itd3v99n3oqdhhd42vgpot4s4.apps.googleusercontent.com">
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:category" element={<RoomDetail />} />
            
            <Route path="/banquet" element={<Banquet />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/menu" element={<FoodMenu />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            
            <Route path="*" element={<PlaceholderPage title="404 - Page Not Found" />} />
          </Routes>
          <WhatsAppFloat />
        </Suspense>
      </Router>
    </AuthProvider>
  </GoogleOAuthProvider>
  )
}

export default App
