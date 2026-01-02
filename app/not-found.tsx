import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "404 - Page Not Found | CabiPro",
  description: "The page you are looking for could not be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background Illustrations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-float-1"></div>
        <div className="absolute top-60 right-20 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-float-2"></div>
        <div className="absolute bottom-40 left-1/4 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl animate-float-3"></div>

        {/* Grid pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid-404"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#grid-404)"
            className="animate-grid-move"
          />
        </svg>

        {/* Geometric shapes */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 border-2 border-gray-300/30 rounded-lg rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 border-2 border-gray-300/30 rounded-full animate-pulse-slow"></div>
        <svg
          className="absolute top-1/2 left-1/2 w-48 h-48 text-gray-300/20 animate-rotate-slow"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl sm:text-[12rem] font-bold text-gray-200 leading-none">
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Professional Button */}
        <div className="mt-8">
          <Link
            href=".."
            className="group inline-flex items-center justify-center gap-6 rounded-lg bg-gray-900 px-6 py-4 text-sm sm:text-base font-medium text-white hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:-translate-x-1" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
