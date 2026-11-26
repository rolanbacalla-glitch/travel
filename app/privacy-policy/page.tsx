"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Shield, Lock, Eye, FileText, Scale, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileMenu } from "@/components/MobileMenu";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicyPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = ["Destinations", "Crew", "Guides", "Safety"];

  return (
    <main className="relative min-h-screen bg-sand font-sans selection:bg-sunset selection:text-white overflow-x-hidden">
      <Navbar
        isScrolled={isScrolled}
        navLinks={navLinks}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navLinks={navLinks}
      />

      {/* Hero Section */}
      <section className="relative h-[45vh] flex flex-col justify-center items-center overflow-hidden bg-slate">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/safety-hero.png"
            alt="Privacy Commitment"
            fill
            className="object-cover"
            priority
          />
          {/* Consistent background implementation for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate/80 via-slate/40 to-slate/90 z-10" />
          <div className="absolute inset-0 bg-black/20 z-10" />
        </div>

        <div className="container mx-auto px-6 relative z-20 text-center mt-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4">
            <Shield className="w-4 h-4 text-sunset" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Legal Centre</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
            Privacy Policy
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto font-medium">
            How we protect and process your data under UK GDPR and Data Protection laws.
          </p>
        </div>
      </section>

      {/* Document Information Bar */}
      <div className="bg-slate-mid text-white/60 py-4 px-6 border-b border-white/5 text-center text-xs">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6">
          <span><strong>Effective Date:</strong> May 22, 2026</span>
          <span><strong>Jurisdiction:</strong> United Kingdom (UK GDPR, DPA 2018 &amp; Online Safety Act 2023)</span>
          <span><strong>Version:</strong> 2.2</span>
        </div>
      </div>

      {/* Content Section */}
      <section className="py-16 px-6 bg-sand">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate/5">
          <div className="space-y-10 text-slate-mid leading-relaxed text-sm md:text-base">
            
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-bold text-slate mb-4 flex items-center gap-3">
                <Scale className="w-6 h-6 text-sunset flex-shrink-0" />
                1. Data Controller & Compliance
              </h2>
              <p className="mb-4">
                <strong>Travel Kin Ltd</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is a company registered in England and Wales under Company Registration Number 14782390, with its registered office in London, UK. We are the <strong>Data Controller</strong> in respect of your personal data processed through the Travel Kin platform under the <strong>UK General Data Protection Regulation (UK GDPR)</strong> and the <strong>Data Protection Act 2018</strong>.
              </p>
              <p>
                We are registered with the <strong>Information Commissioner&rsquo;s Office (ICO)</strong>, the UK supervisory authority for data protection issues, and design our user-to-user safety protections in alignment with the <strong>UK Online Safety Act 2023</strong> (regulated by Ofcom). You can verify our data protection registration on the ICO website using our registration certificate.
              </p>
            </div>

            {/* Information We Collect */}
            <div>
              <h2 className="text-2xl font-bold text-slate mb-4 flex items-center gap-3">
                <FileText className="w-6 h-6 text-sunset flex-shrink-0" />
                2. Information We Collect
              </h2>
              <p className="mb-4">
                To facilitate safe and vetted solo travel, we collect and process the following categories of data:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Identity &amp; Verification Data (Special Category Biometric Data):</strong> Mobile phone OTP verification, government ID document captures (passport, UK driving licence, or national ID), and live 3D selfie liveness matched against your profile photo. These checks are processed exclusively by our UK DIATF-aligned, ISO 30107-3 accredited KYC verification partner. Raw ID images and selfie captures are purged automatically immediately upon completion; Travel Kin retains only your Verified status, issuing country, verification timestamp, and an irreversible salted one-way safety hash solely to prevent banned accounts from re-registering.</li>
                <li><strong>Location &amp; Safety Data:</strong> Live GPS coordinates when active trip check-ins or the Emergency SOS button are triggered (vital interest), plus emergency contact details you elect to store.</li>
                <li><strong>Community Profile &amp; Media Data:</strong> Travel history, preferred destinations, Pre-Contact Trust Passport indicators (verification badges, completed trips, mutual Kins, and peer safety ratings), crew communications, and trip photos. Embedded EXIF GPS coordinates are stripped automatically from uploaded trip photos before posting.</li>
                <li><strong>Technical &amp; Usage Data:</strong> IP addresses, device type, cookie preferences, and security interaction logs used to prevent fraud and abuse.</li>
              </ul>
              <div className="p-4 bg-mist rounded-2xl border border-ocean/10 text-xs">
                <p className="font-semibold text-ocean mb-1">UK Case Context — Location Vetting:</p>
                Following the Information Commissioner&rsquo;s Office (ICO) guidelines on location data processing, Travel Kin only accesses background GPS coordinates when an active trip is logged and the safety tracking feature is specifically toggled on by the user, or when an SOS trigger is initiated.
              </div>
            </div>

            {/* Legal Basis for Processing */}
            <div>
              <h2 className="text-2xl font-bold text-slate mb-4 flex items-center gap-3">
                <Lock className="w-6 h-6 text-sunset flex-shrink-0" />
                3. Legal Bases under UK GDPR
              </h2>
              <p className="mb-4">
                Under Articles 6 and 9 of the UK GDPR, we rely on the following legal bases to process your information:
              </p>
              <div className="space-y-4">
                <div className="border-l-4 border-sunset pl-4">
                  <h4 className="font-bold text-slate text-sm">A. Explicit Consent for Biometric Verification (Art 6(1)(a) &amp; Art 9(2)(a))</h4>
                  <p className="text-sm">For one-time 3D selfie liveness and facial comparison against your government ID and profile photo. This is strictly voluntary — you may browse Travel Kin without verifying — and is requested only when you choose to unlock Verified Kin messaging and trip-joining access. You may withdraw consent at any time.</p>
                </div>
                <div className="border-l-4 border-sunset pl-4">
                  <h4 className="font-bold text-slate text-sm">B. Contractual Necessity (Art 6(1)(b))</h4>
                  <p className="text-sm">To create and manage your account, process bookings or payments, and connect you with matching Crews and verified local guides for your trips.</p>
                </div>
                <div className="border-l-4 border-sunset pl-4">
                  <h4 className="font-bold text-slate text-sm">C. Legal Obligation &amp; Online Safety Duties (Art 6(1)(c))</h4>
                  <p className="text-sm">To comply with UK law and our user-to-user safety duties under the UK Online Safety Act 2023 (Ofcom), including Verified-Only contact safeguards, Block &amp; Report triage, ban-evasion hashing, and lawful regulatory disclosures.</p>
                </div>
                <div className="border-l-4 border-sunset pl-4">
                  <h4 className="font-bold text-slate text-sm">D. Vital Interests (Art 6(1)(d))</h4>
                  <p className="text-sm">To share live location coordinates and emergency profile details with local emergency services or your designated emergency contact during an active SOS trigger.</p>
                </div>
                <div className="border-l-4 border-sunset pl-4">
                  <h4 className="font-bold text-slate text-sm">E. Legitimate Interests (Art 6(1)(f))</h4>
                  <p className="text-sm">To monitor platform integrity, moderate reviews and safety reports, prevent impersonation or fraudulent accounts, and protect solo traveller community trust.</p>
                </div>
              </div>
            </div>

            {/* How We Share Your Data */}
            <div>
              <h2 className="text-2xl font-bold text-slate mb-4 flex items-center gap-3">
                <Eye className="w-6 h-6 text-sunset flex-shrink-0" />
                4. Data Sharing & International Transfers
              </h2>
              <p className="mb-4">
                We do not sell your personal data. We only share data with:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Local Safety Teams & Rescue Crews:</strong> Essential profile and GPS data during emergencies in Southeast Asia.</li>
                <li><strong>Vetted Service Providers:</strong> Secure payment processors (Stripe), email providers, and ID validation tools.</li>
                <li><strong>Other Community Members:</strong> Limited to profile details (first name, vetted badge, travel preferences) and reviews you choose to make public.</li>
              </ul>
              <p>
                Because Travel Kin connects users for trips internationally, some data transfers occur outside the United Kingdom. When transferring personal data to countries without a UK adequacy regulation, we rely on the <strong>UK International Data Transfer Agreement (IDTA)</strong> or the <strong>UK Addendum to the EU Standard Contractual Clauses</strong> approved by the UK Parliament, alongside Transfer Risk Assessments (TRAs) and supplementary encryption safeguards.
              </p>
            </div>

            {/* Your Rights */}
            <div>
              <h2 className="text-2xl font-bold text-slate mb-4 flex items-center gap-3">
                <Scale className="w-6 h-6 text-sunset flex-shrink-0" />
                5. Your Legal Rights
              </h2>
              <p className="mb-4">
                Under the UK GDPR, you have the following rights which you can exercise at any time:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-xs mb-4">
                <div className="p-4 bg-mist rounded-xl border border-slate/5">
                  <strong>Right to Access (SAR):</strong> Request a copy of all personal data we hold about you.
                </div>
                <div className="p-4 bg-mist rounded-xl border border-slate/5">
                  <strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete details.
                </div>
                <div className="p-4 bg-mist rounded-xl border border-slate/5">
                  <strong>Right to Erasure:</strong> Ask us to delete your personal data (the &ldquo;right to be forgotten&rdquo;).
                </div>
                <div className="p-4 bg-mist rounded-xl border border-slate/5">
                  <strong>Right to Object/Restrict:</strong> Object to processing for direct marketing or restrict processing.
                </div>
              </div>
              <p>
                To make a <strong>Subject Access Request (SAR)</strong>, withdraw biometric verification consent, or exercise any other right, contact our Data Protection Team at <a href="mailto:privacy@travelkin.co.uk" className="text-sunset hover:underline font-semibold">privacy@travelkin.co.uk</a>. We respond to all valid requests within one calendar month, free of charge.
              </p>
            </div>

            {/* Contact & Complaints */}
            <div>
              <h2 className="text-2xl font-bold text-slate mb-4 flex items-center gap-3">
                <ExternalLink className="w-6 h-6 text-sunset flex-shrink-0" />
                6. Contact & Regulatory Appeals
              </h2>
              <p className="mb-4">
                If you have questions about this policy or our data practices, please write to:
              </p>
              <address className="not-italic bg-mist p-6 rounded-2xl border border-slate/5 text-sm mb-4">
                <strong>Data Protection Officer</strong><br />
                Travel Kin Ltd<br />
                27 Old Gloucester Street, London, WC1N 3AX, United Kingdom<br />
                Email: <a href="mailto:dpo@travelkin.co.uk" className="text-sunset hover:underline font-semibold">dpo@travelkin.co.uk</a>
              </address>
              <p>
                You also have the right to lodge a complaint at any time with the <strong>Information Commissioner&rsquo;s Office (ICO)</strong>. However, we appreciate the chance to address your concerns directly before you contact the regulator:
              </p>
              <p className="mt-2 text-xs font-semibold text-slate flex items-center gap-1">
                ICO Helpline: 0303 123 1113 | Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-sunset hover:underline inline-flex items-center gap-0.5">ico.org.uk <ExternalLink className="w-3 h-3" /></a>
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
