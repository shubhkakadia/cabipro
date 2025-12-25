import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 mb-4">CabiPro</h3>
            <p className="text-sm text-gray-600 max-w-md">
              Job management software built specifically for cabinet manufacturers. 
              Track production, manage materials, schedule jobs, and optimize your manufacturing operations.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </Link>
              </li>
              {/* <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
              </li> */}
              <li>
                <Link href="/waitlist" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Join Waitlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    <a href="mailto:shubhkakadia@gmail.com" className="hover:text-gray-900 transition-colors">
                      shubhkakadia@gmail.com
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="shrink-0">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    <a href="tel:+61478518103" className="hover:text-gray-900 transition-colors">
                      +61 478 518 103
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="shrink-0">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    10 Wattle Street<br />
                    Campbelltown, SA 5074<br />
                    Australia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-600 text-center">
            © {new Date().getFullYear()} CabiPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

