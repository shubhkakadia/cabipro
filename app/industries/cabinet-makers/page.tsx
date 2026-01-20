"use client";
import {
  ClipboardList,
  Package,
  Factory,
  FileImage,
  Users,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CabinetMakers() {
  const solutions = [
    {
      title: "Production Order Management",
      description:
        "Track every production order from quote to completion. See what's in production, what's scheduled, and what's ready for delivery.",
      icon: ClipboardList,
      benefits: [
        "Multiple jobs under one project",
        "Clear job status tracking",
        "Production scheduling",
        "Real-time workshop overview",
      ],
    },
    {
      title: "Material & Inventory Management",
      description:
        "Track raw materials, components, and hardware inventory. Generate material lists, calculate material needs, and optimize stock levels.",
      icon: Package,
      benefits: [
        "Live stock level tracking",
        "Material usage tracking",
        "Supplier management",
        "Purchase order automation",
      ],
    },
    {
      title: "Manufacturing Floor Management",
      description:
        "Organize your production floor with job status boards, work order assignments, and real-time production tracking.",
      icon: Factory,
      benefits: [
        "Visual workshop overview",
        "Team assignment and workload balance",
        "Production stage tracking",
        "Reduce workshop confusion",
      ],
    },
    {
      title: "Document & Drawing Management",
      description:
        "Store production drawings, specifications, and documents. Share with production teams and keep everything organized.",
      icon: FileImage,
      benefits: [
        "Organized document storage",
        "Drawing version control",
        "Site photos and progress tracking",
        "Secure access control",
      ],
    },
    {
      title: "Client & Quote Management",
      description:
        "Create professional quotes and manage client relationships. Store all client details and communication in one place.",
      icon: Users,
      benefits: [
        "Professional quotes",
        "Client contact management",
        "Quote to job conversion",
        "Communication history",
      ],
    },
  ];

  const challenges = [
    {
      title: "Juggling Multiple Jobs",
      description:
        "Keep track of dozens of production orders at different stages without missing deadlines or losing information.",
    },
    {
      title: "Material Management",
      description:
        "Know what materials you have, what you need, and when to order - without manual tracking and guesswork.",
    },
    {
      title: "Workshop Coordination",
      description:
        "Coordinate teams, assign work, and ensure everyone knows what they're working on and when it's due.",
    },
    {
      title: "Client Communication",
      description:
        "Keep clients informed about job progress, manage quotes, and maintain professional relationships without administrative overhead.",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gray-50 px-4 pt-24 pb-12 sm:px-6 sm:py-20 lg:px-8 lg:py-32 overflow-hidden">
        <Image
          src="/cabinet_making.png"
          alt="Cabinet Makers"
          width={1000}
          height={200}
          className="absolute top-0 left-0 w-full h-full object-cover brightness-70"
        />
        <div className="relative mx-auto max-w-4xl text-center z-10">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-100 drop-shadow-2xl px-2 leading-tight"
            data-aos="fade-up"
          >
            Job Management Software for Cabinet Makers
          </h1>
          <p
            className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-200 drop-shadow-2xl px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Built specifically for cabinet makers and manufacturers. Track
            production, manage materials, schedule jobs, and optimize your
            manufacturing floor, all in one place.
          </p>
          <div
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 sm:gap-x-6 px-2"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <Link
              href="/waitlist"
              className="w-full sm:w-auto text-center rounded-lg bg-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-gray-900 hover:bg-gray-100 transition-colors touch-manipulation"
            >
              Join Waitlist
            </Link>
            <Link
              href="/features"
              className="w-full sm:w-auto text-center rounded-lg border-2 border-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white hover:bg-white/10 transition-colors touch-manipulation"
            >
              View Features
            </Link>
          </div>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-2"
              data-aos="fade-up"
            >
              Challenges Cabinet Makers Face Every Day
            </h2>
            <p
              className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              We understand the daily challenges of running a cabinet
              manufacturing business. CabiPro is built to solve them.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            {challenges.map((challenge, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  {challenge.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {challenge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="bg-gray-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-2"
              data-aos="fade-up"
            >
              How CabiPro Helps Cabinet Makers
            </h2>
            <p
              className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Powerful features designed specifically for cabinet manufacturing
              operations.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-2">
            {solutions.map((solution, index) => {
              const IconComponent = solution.icon;
              return (
                <div
                  key={index}
                  className="flex gap-4 sm:gap-6"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="shrink-0">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900">
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3 leading-tight">
                      {solution.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                      {solution.description}
                    </p>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {solution.benefits.map((benefit, i) => (
                        <li
                          key={i}
                          className="flex items-start text-xs sm:text-sm text-gray-600"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-green-500 mt-0.5" />
                          <span className="leading-relaxed">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-2"
              data-aos="fade-up"
            >
              Built Specifically for Cabinet Makers &amp; Manufacturers
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            <div
              className="rounded-xl bg-gray-50 p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Industry-Specific Features
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Not a generic project management tool. Every feature is designed
                specifically for how cabinet manufacturing actually works.
              </p>
            </div>
            <div
              className="rounded-xl bg-gray-50 p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Easy to Get Started
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Start tracking production orders and managing materials in
                minutes. No complex setup or extensive training required.
              </p>
            </div>
            <div
              className="rounded-xl bg-gray-50 p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Grows With Your Business
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                From small workshops to large production facilities, CabiPro
                scales with your business. Add features and team members as you
                grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white px-2"
            data-aos="fade-up"
          >
            Ready to transform your cabinet manufacturing?
          </h2>
          <p
            className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-300 px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Join cabinet makers and manufacturers who are already using CabiPro
            to run more organized, efficient operations.
          </p>
          <div
            className="mt-8 sm:mt-10"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <Link
              href="/waitlist"
              className="inline-block rounded-lg bg-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-gray-900 hover:bg-gray-200 transition-colors touch-manipulation"
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
