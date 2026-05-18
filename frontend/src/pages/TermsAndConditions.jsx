import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { FileText, Mail, Globe, AlertCircle, HelpCircle } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] font-sans">
      <header className="fixed top-0 z-[200] w-full shadow-sm bg-white">
        <TopBar />
        <Navbar light={true} />
      </header>

      <main className="flex-grow pt-48 pb-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          {/* Header Banner */}
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-[#BFA37E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="text-[#BFA37E]" size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-[#000000] mb-4 uppercase">
              Terms & <span className="text-[#BFA37E]">Conditions</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Last Updated: May 18, 2026 | Hotel Bhopal Inn
            </p>
          </div>

          {/* Intro Card */}
          <div className="bg-white border border-[#F1E9DA] p-8 md:p-10 mb-12 shadow-sm rounded-sm">
            <p className="text-[#1A2B48] text-sm md:text-base font-medium leading-relaxed italic">
              Welcome to Hotel Bhopal Inn. By accessing or using our website and services, you agree to comply with the following Terms & Conditions. Please read them carefully before making a booking or using our website.
            </p>
          </div>

          {/* Terms Content Sections */}
          <div className="space-y-12 bg-white border border-[#F1E9DA] p-8 md:p-12 shadow-xl rounded-sm">
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">1.</span> General Information
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Hotel Bhopal Inn provides hotel accommodation and related hospitality services. By using this website, you confirm that you are at least 18 years old and legally capable of entering into binding agreements.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">2.</span> Booking Policy
              </h2>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4">
                <li>All room bookings are subject to availability.</li>
                <li>Guests must provide accurate personal and contact information while making reservations.</li>
                <li>Booking confirmation will be sent through email, phone, or other communication channels.</li>
                <li>Hotel management reserves the right to refuse or cancel any booking if incorrect information is provided.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">3.</span> Check-In & Check-Out
              </h2>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4">
                <li>Standard check-in and check-out timings are subject to hotel policy.</li>
                <li>Early check-in or late check-out may be available based on room availability and may include additional charges.</li>
                <li>Valid government-issued ID proof is mandatory during check-in.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">4.</span> Payment Terms
              </h2>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4">
                <li>Guests may be required to make advance payments for booking confirmation.</li>
                <li>All applicable taxes and service charges will be added as per government regulations.</li>
                <li>We reserve the right to modify room prices and offers without prior notice.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">5.</span> Cancellation & Refund Policy
              </h2>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4 mb-4">
                <li>Cancellation requests must be made within the applicable cancellation period.</li>
                <li>Refund eligibility depends on booking type, cancellation timing, and payment terms.</li>
                <li>Refund processing times may vary depending on the payment provider or bank.</li>
              </ul>
              <div className="bg-[#FDFBF7] p-4 border border-slate-100 rounded-sm">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  For refund-related information, please contact our support team directly.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">6.</span> Guest Responsibilities
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Guests are expected to:
              </p>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4">
                <li>Maintain proper conduct within hotel premises</li>
                <li>Avoid damage to hotel property</li>
                <li>Follow hotel safety and security rules</li>
                <li>Respect other guests and staff members</li>
              </ul>
              <p className="text-[#BFA37E] text-xs font-black uppercase tracking-wider mt-2">
                The hotel reserves the right to charge guests for any damage caused to hotel property.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">7.</span> Prohibited Activities
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Guests and website users must not:
              </p>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4">
                <li>Use the website for unlawful purposes</li>
                <li>Attempt unauthorized access to hotel systems or data</li>
                <li>Post or transmit harmful or offensive content</li>
                <li>Engage in activities that may disrupt hotel operations</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">8.</span> Website Content
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                All content available on this website, including text, images, branding, and design, is the property of Hotel Bhopal Inn unless otherwise stated.
              </p>
              <p className="text-rose-700 text-xs font-black uppercase tracking-wider mt-2 flex items-center gap-2">
                <AlertCircle size={14} />
                Unauthorized copying, reproduction, or commercial use of website content is prohibited.
              </p>
            </section>

            {/* Section 9 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">9.</span> Third-Party Links
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Our website may contain links to third-party websites for convenience or additional services. We are not responsible for the content, policies, or practices of external websites.
              </p>
            </section>

            {/* Section 10 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">10.</span> Limitation of Liability
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Hotel Bhopal Inn shall not be held responsible for:
              </p>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4">
                <li>Temporary website downtime</li>
                <li>Technical errors or interruptions</li>
                <li>Loss caused by misuse of website services</li>
                <li>Delays or issues caused by third-party service providers</li>
              </ul>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2 italic">
                Guests are responsible for safeguarding their personal belongings during their stay.
              </p>
            </section>

            {/* Section 11 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">11.</span> Privacy
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Your use of this website is also governed by our Privacy Policy. By using our website, you agree to the collection and use of information as described in the Privacy Policy.
              </p>
            </section>

            {/* Section 12 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">12.</span> Changes to Terms & Conditions
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We reserve the right to update or modify these Terms & Conditions at any time without prior notice. Updated terms will be posted on this page.
              </p>
            </section>

            {/* Section 13 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">13.</span> Contact Information
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                For any questions regarding these Terms & Conditions, please contact us through the contact details available on our website.
              </p>
              
              <div className="bg-[#FDFBF7] border border-[#F1E9DA] p-6 rounded-sm space-y-3 mt-4">
                <div className="flex items-center gap-3">
                  <Globe className="text-[#BFA37E]" size={16} />
                  <span className="text-xs font-bold text-slate-700">WEBSITE:</span>
                  <a href="https://hotelbhopalinn.tenontenstays.com/" target="_blank" rel="noopener noreferrer" className="text-xs font-mono font-bold text-[#BFA37E] hover:underline">
                    https://hotelbhopalinn.tenontenstays.com/
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-[#BFA37E]" size={16} />
                  <span className="text-xs font-bold text-slate-700">EMAIL:</span>
                  <a href="mailto:bhopalinn@gmail.com" className="text-xs font-bold text-slate-700 hover:text-[#BFA37E]">
                    bhopalinn@gmail.com
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
