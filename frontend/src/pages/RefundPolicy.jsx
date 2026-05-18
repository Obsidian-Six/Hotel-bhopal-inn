import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { ShieldCheck, Mail, Globe, BadgePercent, XCircle, RotateCcw, AlertTriangle, HelpCircle, FileText } from 'lucide-react';

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
              Refund & <span className="text-[#BFA37E]">Cancellation</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Effective Date: May 18, 2026 | Hotel Bhopal Inn
            </p>
          </div>

          {/* Intro Card */}
          <div className="bg-white border border-[#F1E9DA] p-8 md:p-10 mb-12 shadow-sm rounded-sm">
            <p className="text-[#1A2B48] text-sm md:text-base font-medium leading-relaxed italic">
              Welcome to Hotel Bhopal Inn by Ten On Ten Stays. We are committed to providing a seamless and transparent booking experience for all our guests. This Refund & Cancellation Policy outlines the terms and conditions applicable to all reservations made directly through our website, booking platforms, or through our reservation team.
            </p>
            <p className="text-[#1A2B48] text-sm md:text-base font-semibold leading-relaxed mt-4">
              By confirming a reservation with Hotel Bhopal Inn by Ten On Ten Stays, guests acknowledge and agree to the policies stated below.
            </p>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-12 bg-white border border-[#F1E9DA] p-8 md:p-12 shadow-xl rounded-sm">
            
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">1.</span> Cancellation Policy
              </h2>
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-sm mb-4">
                <h3 className="text-xs font-black uppercase text-emerald-800 tracking-widest mb-2 flex items-center gap-2">
                  <BadgePercent size={16} /> Free Cancellation Eligibility
                </h3>
                <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider leading-relaxed">
                  Guests are eligible for a 100% refund of the booking amount if the reservation is canceled more than 30 days prior to the scheduled check-in date.
                </p>
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                The cancellation request must be submitted through the same platform used for the reservation or directly through our official support channels. Once the cancellation request is verified and approved, the refund process will be initiated accordingly.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">2.</span> Non-Refundable Period
              </h2>
              <div className="bg-red-50 border border-red-100 p-6 rounded-sm mb-4">
                <h3 className="text-xs font-black uppercase text-red-800 tracking-widest mb-2 flex items-center gap-2">
                  <XCircle size={16} /> Strict 30-Day Cancellation Policy
                </h3>
                <p className="text-red-700 text-xs font-bold uppercase tracking-wider leading-relaxed">
                  Reservations canceled within 30 days of the check-in date will be considered non-refundable.
                </p>
              </div>
              
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                During this period:
              </p>
              <ul className="space-y-3 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4 leading-relaxed">
                <li>No refund will be issued for cancellation requests.</li>
                <li>No partial refund will be applicable for unused nights or early check-outs.</li>
                <li>Amendments such as date changes, room modifications, or reduction in stay duration may not be accepted.</li>
                <li>Failure to arrive at the property on the scheduled check-in date (“No Show”) will result in complete forfeiture of the booking amount.</li>
              </ul>
              
              <div className="bg-[#FDFBF7] border-l-2 border-[#BFA37E] p-4 mt-4">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  This policy is implemented to manage room inventory, operational commitments, staffing, and reservation planning effectively.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">3.</span> Booking Amendments & Rescheduling
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Requests related to:
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4 leading-relaxed">
                <li>Change of check-in or check-out dates</li>
                <li>Room category changes</li>
                <li>Guest detail modifications</li>
                <li>Stay duration adjustments</li>
              </ul>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                will be subject to room availability and management approval.
              </p>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Any amendment request made within the 30-day non-refundable period may be denied or treated as a cancellation request. Additional charges may also apply based on revised tariffs, seasonal pricing, or availability.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">4.</span> Refund Processing Timeline
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                For eligible cancellations:
              </p>
              <ul className="space-y-3 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4 leading-relaxed">
                <li>Refunds will be processed through the original mode of payment used during booking.</li>
                <li>The standard processing time may vary between 7–14 business days, depending on the payment gateway, bank processing timelines, or third-party booking platforms.</li>
                <li>Transaction charges, payment gateway fees, or currency conversion fees charged by financial institutions may be non-refundable.</li>
              </ul>
              <p className="text-[11px] text-[#BFA37E] font-bold uppercase tracking-widest mt-2 leading-relaxed">
                Guests are advised to retain booking confirmation emails and payment receipts until the refund process is completed successfully.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">5.</span> Third-Party Booking Platforms
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                For reservations made through Online Travel Agencies (OTAs) or third-party platforms, including but not limited to travel portals and booking marketplaces, cancellation and refund processing may additionally be subject to the respective platform’s policies and timelines.
              </p>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Guests are advised to review the cancellation terms displayed at the time of booking on such platforms.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">6.</span> Early Check-Out & Unused Services
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                No refund or adjustment will be provided for:
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4 leading-relaxed">
                <li>Early departures</li>
                <li>Unused room nights</li>
                <li>Unused hotel facilities or services</li>
                <li>Complimentary inclusions associated with the booking package</li>
              </ul>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Once the guest has checked in, the reservation amount becomes fully non-refundable unless approved otherwise by the management under exceptional circumstances.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">7.</span> Force Majeure & Exceptional Circumstances
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                In situations beyond reasonable control, including but not limited to:
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4 leading-relaxed">
                <li>Natural disasters</li>
                <li>Government restrictions</li>
                <li>Public emergencies</li>
                <li>Transportation shutdowns</li>
                <li>Unforeseen operational issues</li>
              </ul>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                The management of Hotel Bhopal Inn by Ten On Ten Stays reserves the right to review cancellation requests individually and determine suitable resolutions at its sole discretion.
              </p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider italic leading-relaxed">
                Approval under such cases is not guaranteed and may vary depending on the situation.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">8.</span> Fraudulent or Misuse Activities
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                The hotel reserves the right to cancel any reservation without refund in cases involving:
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-600 uppercase tracking-wider list-disc list-inside pl-4 leading-relaxed">
                <li>Fraudulent payment activity</li>
                <li>Misrepresentation of guest information</li>
                <li>Unauthorized transactions</li>
                <li>Violation of hotel policies</li>
                <li>Suspicious or abusive booking behavior</li>
              </ul>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Further legal or administrative action may also be taken where necessary.
              </p>
            </section>

            {/* Section 9 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">9.</span> Policy Acceptance
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                By proceeding with a reservation at Hotel Bhopal Inn by Ten On Ten Stays, guests confirm that they have read, understood, and accepted this Refund & Cancellation Policy in full.
              </p>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                The hotel reserves the right to update, modify, or revise this policy at any time without prior notice. Updated versions will be published through official communication channels and platforms.
              </p>
            </section>

            {/* Section 10 */}
            <section className="space-y-4">
              <h2 className="text-xl font-serif font-black text-[#1A2B48] flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-[#BFA37E]">10.</span> Contact Information
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                For any questions related to cancellations, refunds, booking amendments, or reservation assistance, guests may contact the support team of Hotel Bhopal Inn by Ten On Ten Stays through the official communication channels provided during booking:
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
