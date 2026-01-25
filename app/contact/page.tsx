'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Contact() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contactcabipro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12 sm:py-16 lg:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 sm:mb-6">
            <svg
              className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 px-2">
            Message sent!
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-2">
            Thanks for reaching out, {formData.name}. We&apos;ve received your message and will get back to you within 24 hours.
          </p>
          <div className="mt-8 sm:mt-10 px-2">
            <button 
              onClick={() => router.push('/')} 
              className="cursor-pointer w-full sm:w-auto rounded-lg bg-gray-900 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white hover:bg-gray-800 transition-colors touch-manipulation"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-white px-4 pt-24 pb-12 sm:px-6 sm:py-20 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 px-2 leading-tight"
            data-aos="fade-up"
          >
            Get in touch
          </h1>
          <p 
            className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Have questions about CabiPro? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible. Contact us to book a demo
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative bg-gray-100 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16 overflow-hidden">
        {/* Animated Background Illustrations */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating circles */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-float-1"></div>
          <div className="absolute top-60 right-20 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-float-2"></div>
          <div className="absolute bottom-40 left-1/4 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl animate-float-3"></div>
          
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-contact" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-contact)" className="animate-grid-move" />
          </svg>
          
          {/* Geometric shapes */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 border-2 border-gray-300/30 rounded-lg rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-1/3 left-1/3 w-24 h-24 border-2 border-gray-300/30 rounded-full animate-pulse-slow"></div>
          <svg className="absolute top-1/2 left-1/2 w-48 h-48 text-gray-300/20 animate-rotate-slow" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
          </svg>
        </div>
        
        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div 
              className="rounded-2xl bg-white p-6 sm:p-8 lg:p-10 shadow-lg"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 touch-manipulation"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 touch-manipulation"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 touch-manipulation"
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y touch-manipulation"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer w-full rounded-lg bg-gray-900 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div 
              className="space-y-6 sm:space-y-8"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">Contact Information</h2>
                <div className="space-y-5 sm:space-y-6">
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <h3 className="text-sm font-semibold text-gray-900">Email</h3>
                      <p className="mt-1 text-sm text-gray-600 wrap-break-words">
                        <a href="mailto:cabipro16@gmail.com" className="hover:text-gray-900 transition-colors">
                          cabipro16@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <h3 className="text-sm font-semibold text-gray-900">Phone</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        <a href="tel:+61478518103" className="hover:text-gray-900 transition-colors">
                          +61 478 518 103
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <h3 className="text-sm font-semibold text-gray-900">Office</h3>
                      <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                        10 Wattle Street<br />
                        Campbelltown, SA 5074<br />
                        Australia
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

