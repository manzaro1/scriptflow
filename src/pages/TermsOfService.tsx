"use client";

import React from 'react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-20 prose dark:prose-invert">
        <h1 className="text-4xl font-black mb-8">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: October 2024</p>
        
        <section className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>By accessing or using ScriptFlow, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.</p>

          <h2 className="text-2xl font-bold text-foreground">2. Description of Service</h2>
          <p>ScriptFlow provides AI-integrated screenwriting and production management tools. We reserve the right to modify or discontinue any part of the service at any time.</p>

          <h2 className="text-2xl font-bold text-foreground">3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

          <h2 className="text-2xl font-bold text-foreground">4. Intellectual Property</h2>
          <p>Your scripts and creative content remain 100% your intellectual property. ScriptFlow does not claim ownership over any narrative content created using our platform.</p>

          <h2 className="text-2xl font-bold text-foreground">5. Limitation of Liability</h2>
          <p>ScriptFlow shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;