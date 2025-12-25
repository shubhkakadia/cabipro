'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-3 z-50 w-[95%] mx-auto border rounded-2xl border-gray-200 bg-white/90 backdrop-blur-xs shadow-lg">
      <nav className="mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            CabiPro
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/features" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Features
          </Link>
          {/* <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Pricing
          </Link> */}
          <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Contact
          </Link>
          <Link
            href="/waitlist"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Join Waitlist
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg
            className="h-6 w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={`border-t border-gray-200 bg-white md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen
            ? 'max-h-96 opacity-100'
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-1 px-4 pb-4 pt-2">
          <Link
            href="/features"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </Link>
          {/* <Link
            href="/pricing"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pricing
          </Link> */}
          <Link
            href="/contact"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>
          <Link
            href="/waitlist"
            className="block rounded-md bg-gray-900 px-3 py-2 text-center text-base font-medium text-white hover:bg-gray-800 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Join Waitlist
          </Link>
        </div>
      </div>
    </header>
  );
}

