import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { ShieldCheck, Mail, Globe, BadgePercent, XCircle, RotateCcw } from 'lucide-react';

const RefundPolicy = () => {
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
              <RotateCcw className="text-[#BFA37E]" size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-[#000000] mb-4 uppercase">
              Refund <span className="text-[#BFA37E]">Policy</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Effective Date: May 18, 2026 | Hotel Bhopal Inn
            </p>
          </div>

          {/* Core Policy Highlight Card */}
          <div className="bg-white border border-[#F1E9DA] p-8 md:p-10 mb-12 shadow-sm rounded-sm">
            <h2 className="text-xs font-black uppercase text-[#BFA37E] tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck size={16} /> Core Motto & Principle
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-sm">
                <BadgePercent className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wider">100% Refund Guarantee</h4>
                  <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mt-1 leading-relaxed">
                    Get a full 100% refund of your booking amount if the cancellation is made more than 30 days prior to your scheduled check-in date.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-100 rounded-sm">
                <XCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-black text-red-800 uppercase tracking-wider">No Refund or Amendment Zone</h4>
                  <p className="text-xs text-red-700 font-bold uppercase tracking-wider mt-1 leading-relaxed">
                    Strictly no refunds, amendments, or date modifications are permitted if booking is cancelled or altered within 30 days of the scheduled check-in date.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-12 bg-white border border-[#F1E9DA] p-8 md:p-12 shadow-xl rounded-sm">
            
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">1.</span> Cancellation Windows
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                At Hotel Bhopal Inn, we aim to balance absolute transparency with high operational excellence. Our detailed cancellation timeline is defined below:
              </p>
              <div className="space-y-3 pl-4">
                <div className="border-l-2 border-[#BFA37E] pl-4 py-1">
                  <p className="text-xs font-black uppercase text-[#1A2B48] tracking-widest">More than 30 Days before Check-In</p>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    Guests are eligible for a complete 100% refund of the room tariff paid. No cancellation processing fee is charged.
                  </p>
                </div>
                <div className="border-l-2 border-red-500 pl-4 py-1">
                  <p className="text-xs font-black uppercase text-red-700 tracking-widest">Within 30 Days of Check-In (0-30 Days)</p>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    No refund will be issued. The entire paid booking amount will be retained as a booking retention/cancellation charge.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">2.</span> Booking Amendment & Modifications
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We understand that travel plans can change unexpectedly. Below is our policy regarding reservation adjustments:
              </p>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4 leading-relaxed">
                <li>Amendments requested more than 30 days prior to check-in are allowed free of charge, subject to room availability and seasonal price variations.</li>
                <li>No date changes or category downgrades are permitted within 30 days of the check-in date.</li>
                <li>Splitting check-in dates or reducing the number of rooms booked is treated as a partial cancellation.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">3.</span> No-Show Policy
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                If you fail to arrive at Hotel Bhopal Inn on your scheduled check-in date without prior notification:
              </p>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4 leading-relaxed">
                <li>The reservation will be classified as a "No-Show".</li>
                <li>100% of the room booking amount will be forfeited.</li>
                <li>The remaining nights of the booking (if any) will be automatically cancelled.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">4.</span> Early Departure & Shortened Stay
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                If you choose to shorten your stay or check out early after check-in, no refunds or credit vouchers will be issued for the remaining unused nights.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">5.</span> Refund Processing Timeline
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                For eligible cancellations (more than 30 days notice):
              </p>
              <ul className="space-y-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4 leading-relaxed">
                <li>Refunds are initiated immediately upon cancellation approval.</li>
                <li>It typically takes 7 to 10 business days for the funds to reflect in your original payment mode (credit card, bank account, UPI).</li>
                <li>Any processing fees levied by your bank or the payment gateway are non-refundable.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">6.</span> Force Majeure & Exceptional Situations
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                In extraordinary circumstances such as natural disasters, national emergencies, severe weather events, or flight/train cancellations due to sudden disruptions:
              </p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider italic leading-relaxed">
                Decisions on booking transfers, credit note generation, or exemptions from the cancellation window will be evaluated on an individual basis by the hotel management at its absolute discretion.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">7.</span> Contact Us for Cancellations
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                To initiate a cancellation or request a refund, please contact our support team immediately with your booking ID and registration details:
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

export default RefundPolicy;
