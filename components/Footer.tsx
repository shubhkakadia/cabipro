import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-2">
            <Link href="/" className="inline-block mb-3 sm:mb-4">
              <Image
                src="/CabiPro.svg"
                alt="CabiPro Logo"
                width={150}
                height={60}
                className="h-8 sm:h-10 w-auto"
                unoptimized
              />
            </Link>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md leading-relaxed">
              Job management software built specifically for cabinet
              manufacturers. Track production, manage materials, schedule jobs,
              and optimize your manufacturing operations.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4">
              Product
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  href="/features"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Features
                </Link>
              </li>
              {/* <li>
                <Link href="/pricing" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
              </li> */}
              <li>
                <Link
                  href="/blog"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/waitlist"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Join Waitlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4">
              Company
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4">
              Contact
            </h4>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5" />
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <a
                      href="mailto:shubhkakadia@gmail.com"
                      className="hover:text-gray-900 transition-colors wrap-break-words"
                    >
                      shubhkakadia@gmail.com
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="shrink-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5" />
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <a
                      href="tel:+61478518103"
                      className="hover:text-gray-900 transition-colors"
                    >
                      +61 478 518 103
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="shrink-0">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5" />
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    10 Wattle Street
                    <br />
                    Campbelltown, SA 5074
                    <br />
                    Australia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-6 sm:pt-8">
          <p className="text-xs sm:text-sm text-gray-600 text-center">
            © {new Date().getFullYear()} CabiPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
