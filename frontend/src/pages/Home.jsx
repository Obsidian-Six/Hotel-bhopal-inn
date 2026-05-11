import React from 'react';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import TopBar from '@/components/layout/TopBar';
import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/home/HeroSection';
import BookingWidget from '@/components/home/BookingWidget';
import USPStrip from '@/components/home/USPStrip';
import RoomCategories from '@/components/home/RoomCategories';
import SpecialOffers from '@/components/home/SpecialOffers';
import BanquetTeaser from '@/components/home/BanquetTeaser';
import AmenitiesOverview from '@/components/home/AmenitiesOverview';
import LocationMap from '@/components/home/LocationMap';
import Testimonials from '@/components/home/Testimonials';
import InstagramFeed from '@/components/home/InstagramFeed';
import NewsletterSignup from '@/components/home/NewsletterSignup';
import Footer from '@/components/layout/Footer';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="fixed top-0 z-[100] w-full transition-colors duration-500">
        <TopBar />
        <Navbar />
      </header>
      
      <main className="flex-grow pt-0"> {/* Let hero slide under fixed header */}
        <HeroSection />
        <BookingWidget />
        <USPStrip />
        <RoomCategories />
        <SpecialOffers />
        <BanquetTeaser />
        <AmenitiesOverview />
        <LocationMap />
        <Testimonials />
        <InstagramFeed />
        <NewsletterSignup />
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
