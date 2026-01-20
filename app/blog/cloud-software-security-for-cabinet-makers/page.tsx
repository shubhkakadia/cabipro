import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Cloud Software Security for Cabinet Makers - CabiPro",
  description:
    "Learn about cloud security, the shared responsibility model, and how to vet cloud software providers to keep your business data safe.",
};

export default function BlogPost() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <svg
              className="mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Blog
          </Link>
        </div>

        <div className="mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
            How Safe Is Your Business Data When Using Cloud Software?
          </h1>
          <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
            Understanding cloud security and your role in protecting your data
          </p>
          <div className="mt-3 sm:mt-4 md:mt-5 flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-500">
            <span>December 27, 2025</span>
            <span>•</span>
            <span>5 min read</span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-120 overflow-hidden">
            <Image
              src="/cloud-software-security.png"
              alt="How Safe Is Your Business Data When Using Cloud Software?"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6 md:mb-8">
            For most small-to-medium businesses, data is generally safer in the
            cloud than on individual office servers, but it requires you to
            handle your &quot;end&quot; of the security deal.
          </p>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6 md:mb-8">
            Major cloud providers (like AWS, Google Cloud, and Microsoft Azure)
            spend billions on security that a typical business cannot afford to
            replicate. However, they operate on a &quot;Shared Responsibility
            Model&quot;—they secure the building, but you must lock the door.
          </p>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            Here is a detailed breakdown of how safe your data actually is, the
            risks you need to manage, and how to verify a software
            provider&apos;s security.
          </p>

          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              1. The Shared Responsibility Model
            </h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              This is the single most important concept to understand. Cloud
              security is a partnership. If you leave your password on a sticky
              note, the most secure cloud in the world cannot protect you.
            </p>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              The Provider&apos;s Responsibility (Security of the Cloud)
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              They protect the physical data centers, the hardware, the cabling,
              and the core software infrastructure. They ensure the power stays
              on and the servers aren&apos;t physically stolen.
            </p>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Your Responsibility (Security in the Cloud)
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              You are responsible for who has passwords, setting up Multi-Factor
              Authentication (MFA), setting user permissions (so the intern
              doesn&apos;t have admin access), and ensuring your employees
              don&apos;t fall for phishing scams.
            </p>
          </section>

          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              2. Cloud vs. On-Premise: A Comparison
            </h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4 md:mb-6">
              Many businesses feel safer with a server in the office because
              they can see it. Statistically, this is often a &quot;false sense
              of security.&quot;
            </p>

            <div className="overflow-x-auto -mx-4 sm:mx-0 mb-3 sm:mb-4 md:mb-6">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full border border-gray-300 rounded-lg text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                        Feature
                      </th>
                      <th className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-left font-semibold text-gray-900">
                        Cloud Software (SaaS)
                      </th>
                      <th className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-left font-semibold text-gray-900">
                        On-Premise (Office Server)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-300">
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 font-medium text-gray-900 whitespace-nowrap">
                        Physical Security
                      </td>
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-gray-700">
                        High. Armed guards, biometrics, disaster-proof
                        buildings.
                      </td>
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-gray-700">
                        Low. Often a locked closet or under a desk; vulnerable
                        to break-ins/fire.
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 font-medium text-gray-900 whitespace-nowrap">
                        Updates/Patching
                      </td>
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-gray-700">
                        Automatic. Vendors patch vulnerabilities instantly.
                      </td>
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-gray-700">
                        Manual. Requires your IT staff to schedule and install
                        updates (often delayed).
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 font-medium text-gray-900 whitespace-nowrap">
                        Backups
                      </td>
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-gray-700">
                        Redundant. Data is often mirrored across multiple
                        locations.
                      </td>
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-gray-700">
                        Single Point of Failure. If the server breaks or backup
                        drive fails, data is lost.
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 font-medium text-gray-900 whitespace-nowrap">
                        Risk Source
                      </td>
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-gray-700">
                        Account Hijacking. Hackers try to steal login
                        credentials.
                      </td>
                      <td className="border border-gray-300 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 text-gray-700">
                        Ransomware. Hackers encrypt your local network and
                        demand payment.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              3. Key Risks in the Cloud
            </h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              While the infrastructure is safe, the data is still vulnerable to
              specific threats:
            </p>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Misconfiguration
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              This is the #1 cause of cloud breaches. This happens when a
              business accidentally sets a folder to &quot;Public&quot; instead
              of &quot;Private.&quot;
            </p>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Weak Access Controls
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Using weak passwords (e.g., &quot;Password123&quot;) or sharing
              accounts between employees.
            </p>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Insider Threats
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Disgruntled employees downloading customer lists before leaving.
            </p>
          </section>

          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              4. How to Vet a Cloud Software Provider
            </h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4 md:mb-6">
              If you are evaluating a specific software tool (e.g., a CRM or
              Project Management tool), do not just take their word for it. Look
              for these specific trust signals:
            </p>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              SOC 2 Type II Report
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              This is the gold standard. It means an independent auditor has
              verified that the company actually follows their security
              procedures over a long period (not just a one-time check).
            </p>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              ISO 27001
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              An international standard proving the company has a rigorous
              system for managing information security.
            </p>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Data Encryption
            </h3>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>
                <strong>At Rest:</strong> Is data scrambled when it sits on
                their servers?
              </li>
              <li>
                <strong>In Transit:</strong> Is data scrambled when it travels
                from their server to your computer? (Look for the HTTPS lock
                icon).
              </li>
            </ul>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Uptime SLA
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Do they guarantee 99.9% uptime? This ensures you can actually
              access your data when you need it.
            </p>
          </section>

          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Summary
            </h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Your business data is highly safe in the cloud regarding physical
              loss, hardware failure, or sophisticated infrastructure attacks.
              It is moderately vulnerable to human error, weak passwords, and
              phishing attacks targeting your employees.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div
          className="mt-8 sm:mt-12 md:mt-16 lg:mt-20 rounded-xl sm:rounded-2xl bg-gray-900 px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-12 lg:py-16 text-center"
          data-aos="fade-up"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3 sm:mb-4 md:mb-6 leading-tight">
            Ready to Secure Your Business Data?
          </h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-gray-300 mb-4 sm:mb-6 md:mb-8 leading-relaxed px-2">
            CabiPro is built with security in mind. Join the waitlist to get
            early access to a job management platform designed specifically for
            cabinet makers, manufacturers, and joinery workshops, with
            enterprise-grade security and data protection.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/waitlist"
              className="w-full sm:w-auto rounded-lg bg-white px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base font-medium text-gray-900 hover:bg-gray-100 transition-colors touch-manipulation text-center"
            >
              Join Waitlist
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto rounded-lg border-2 border-white px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base font-medium text-white hover:bg-white/10 transition-colors touch-manipulation text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
