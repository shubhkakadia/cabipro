"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Waitlist() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        throw new Error("Failed to join waitlist");
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to join waitlist. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 pt-24 sm:py-16 lg:py-20 sm:px-6 lg:px-8">
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
            You&apos;re on the list!
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-2">
            Thanks for joining the waitlist, {name || "there"}! We&apos;ll send
            you an email at{" "}
            <span className="font-semibold text-gray-900 break-words">{email}</span> as soon
            as we launch.
          </p>
          <div className="mt-6 sm:mt-8 rounded-lg bg-blue-50 p-5 sm:p-6 text-left">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-2">
              🎉 Early Access Benefits
            </h3>
            <ul className="space-y-2 text-sm sm:text-base text-gray-700">
              <li className="flex items-start">
                <svg
                  className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-blue-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="leading-relaxed">20% discount on your first year</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-blue-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="leading-relaxed">Priority access when we launch</span>
              </li>
            </ul>
          </div>
          <div className="mt-8 sm:mt-10 px-2">
            <button
              onClick={() => router.push("/")}
              className="cursor-pointer w-full sm:w-auto rounded-lg bg-gray-900 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 touch-manipulation"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      {/* Animated Background Illustrations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-float-1"></div>
        <div className="absolute top-60 right-20 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-float-2"></div>
        <div className="absolute bottom-40 left-1/4 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl animate-float-3"></div>
        
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-waitlist" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-waitlist)" className="animate-grid-move" />
        </svg>
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 border-2 border-gray-300/30 rounded-lg rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 border-2 border-gray-300/30 rounded-full animate-pulse-slow"></div>
        <svg className="absolute top-1/2 left-1/2 w-48 h-48 text-gray-300/20 animate-rotate-slow" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
        </svg>
      </div>
      
      <div className="relative flex items-center justify-center px-4 pt-24 pb-12 sm:py-16 lg:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl w-full">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 px-2 leading-tight"
            data-aos="fade-up"
          >
            Join the waitlist
          </h1>
          <p
            className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Be among the first cabinet manufacturers to experience CabiPro. Get
            early access, exclusive pricing, and help shape the future of job
            management for cabinet manufacturing.
          </p>
        </div>

        <div
          className="rounded-2xl bg-white p-6 sm:p-8 lg:p-10 shadow-lg"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 touch-manipulation"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 touch-manipulation"
                placeholder="john@company.com"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full rounded-lg bg-gray-900 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 touch-manipulation"
            >
              {isSubmitting ? "Joining..." : "Join Waitlist"}
            </button>
          </form>

          <div
            className="mt-6 sm:mt-8 rounded-lg bg-gray-100 p-5 sm:p-6"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              What you&apos;ll get:
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
              <li className="flex items-start">
                <svg
                  className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-green-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="leading-relaxed">20% early-bird discount on your first year</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-green-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="leading-relaxed">Priority access when we launch</span>
              </li>
            </ul>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
