"use client";

import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-20 prose dark:prose-invert">
        <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: October 2026</p>

        <section className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, upload scripts, or communicate with us. This may include your name, email, and billing information.</p>

          <h2 className="text-2xl font-bold text-foreground">2. How We Use Your Information</h2>
          <p>We use your information to provide, maintain, and improve our services, including the generation of AI insights and storyboards based on your narrative inputs.</p>

          <h2 className="text-2xl font-bold text-foreground">3. Data Security</h2>
          <p>We take reasonable measures to protect your personal information and creative content from unauthorized access, use, or disclosure.</p>

          <h2 className="text-2xl font-bold text-foreground">4. Third-Party Services</h2>
          <p>We may use third-party AI providers (like OpenAI or Google) to process certain narrative elements. Your data is sent anonymously to these providers solely for processing purposes.</p>

          <h2 className="text-2xl font-bold text-foreground">5. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information at any time through your account settings.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;