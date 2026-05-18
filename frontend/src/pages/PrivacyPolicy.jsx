import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { ShieldCheck, Mail, Globe, Calendar, FileText } from 'lucide-react';

const PrivacyPolicy = () => {
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
              <ShieldCheck className="text-[#BFA37E]" size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-[#000000] mb-4 uppercase">
              Privacy <span className="text-[#BFA37E]">Policy</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Effective Date: May 18, 2026 | Hotel Bhopal Inn
            </p>
          </div>

          {/* Policy Intro Card */}
          <div className="bg-white border border-[#F1E9DA] p-8 md:p-10 mb-12 shadow-sm rounded-sm">
            <p className="text-[#1A2B48] text-sm md:text-base font-medium leading-relaxed italic">
              Welcome to Hotel Bhopal Inn. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you visit or use our website.
            </p>
          </div>

          {/* Policy Content Sections */}
          <div className="space-y-12 bg-white border border-[#F1E9DA] p-8 md:p-12 shadow-xl rounded-sm">
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">1.</span> Information We Collect
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-[#FDFBF7] p-6 border border-slate-100 rounded-sm">
                  <h3 className="text-xs font-black uppercase text-[#BFA37E] tracking-widest mb-3">Personal Information</h3>
                  <ul className="space-y-2 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside">
                    <li>Name</li>
                    <li>Phone number</li>
                    <li>Email address</li>
                    <li>Booking details</li>
                    <li>Special requests or messages submitted through contact forms</li>
                  </ul>
                </div>

                <div className="bg-[#FDFBF7] p-6 border border-slate-100 rounded-sm">
                  <h3 className="text-xs font-black uppercase text-[#BFA37E] tracking-widest mb-3">Non-Personal Information</h3>
                  <ul className="space-y-2 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside">
                    <li>Browser type</li>
                    <li>Device information</li>
                    <li>IP address</li>
                    <li>Website usage data</li>
                    <li>Cookies and analytics data</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">2.</span> How We Use Your Information
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We use your information to:
              </p>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4">
                <li>Process hotel room bookings and inquiries</li>
                <li>Contact you regarding reservations or customer support</li>
                <li>Improve our website and services</li>
                <li>Send booking confirmations or important updates</li>
                <li>Maintain website security and prevent fraud</li>
              </ul>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-sm mt-4">
                <p className="text-emerald-800 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} />
                  We do not sell or rent your personal information to third parties.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">3.</span> Cookies
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Our website may use cookies to improve your browsing experience and analyze website traffic.
              </p>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Cookies help us:
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4">
                <li>Remember user preferences</li>
                <li>Improve website performance</li>
                <li>Understand visitor behavior</li>
              </ul>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-2">
                You can disable cookies through your browser settings if you prefer.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">4.</span> Third-Party Services
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We may use trusted third-party services such as:
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4">
                <li>Booking or reservation systems</li>
                <li>Analytics tools</li>
                <li>Payment gateways</li>
                <li>Hosting providers</li>
              </ul>
              <p className="text-[#BFA37E] text-xs font-black uppercase tracking-wider mt-2">
                These third parties may collect and process information according to their own privacy policies.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">5.</span> Data Protection
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We take reasonable security measures to protect your personal information from unauthorized access, misuse, or disclosure.
              </p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider italic">
                However, no online platform can guarantee complete security of data transmission over the internet.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">6.</span> Links to Other Websites
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of external websites.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">7.</span> Your Rights
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                You may request to:
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your information (where applicable)</li>
              </ul>
              <p className="text-[#BFA37E] text-xs font-black uppercase tracking-wider mt-2">
                For any privacy-related requests, please contact us.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">8.</span> Children's Privacy
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children.
              </p>
            </section>

            {/* Section 9 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">9.</span> Changes to This Privacy Policy
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated effective date.
              </p>
            </section>

            {/* Section 10 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">10.</span> Contact Us
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                If you have any questions regarding this Privacy Policy, please contact us through the contact information available on our website.
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

export default PrivacyPolicy;
