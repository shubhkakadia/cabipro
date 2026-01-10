"use client";
import {
  CreditCard,
  Users,
  Layers,
  FileImage,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function QuotingSoftware() {
  
  const features = [
    {
      title: "Quotes & Orders",
      description:
        "Create professional quotes and turn them into jobs when approved. Keep everything connected from quote to production.",
      icon: CreditCard,
      benefits: [
        "Professional quotes",
        "Attach drawings and specifications",
        "Quick conversion from quote to job",
        "Track job from start to finish",
      ],
    },
    {
      title: "Clients & Contacts",
      description:
        "Store all your client details and contacts in one place. Keep track of who to call, email, or follow up with — without digging through emails or paperwork.",
      icon: Users,
      benefits: [
        "All client details stored securely",
        "Multiple contacts per client",
        "Quick access when creating projects",
        "No more lost phone numbers or emails",
      ],
    },
    {
      title: "Material Selection & Specifications",
      description:
        "Record all materials and finishes selected for each job. Keep a clear history of changes so nothing gets missed or confused during production.",
      icon: Layers,
      benefits: [
        "Clear material lists for each job",
        "Track changes and revisions",
        "Organised by kitchen, pantry, wardrobe, etc.",
        "Avoid costly material mistakes",
      ],
    },
    {
      title: "Documents & Drawings",
      description:
        "Store all drawings, plans, site photos, and documents with each quote and job. Everything is organised and easy to find when you need it.",
      icon: FileImage,
      benefits: [
        "Drawings and documents stored per quote/job",
        "Organised folders for easy access",
        "Recover deleted files if needed",
        "Secure access for authorised users",
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gray-50 px-4 pt-24 pb-12 sm:px-6 sm:py-20 lg:px-8 lg:py-32 overflow-hidden">
        <Image
          src="/cabinet_making.png"
          alt="Quoting Software"
          width={1000}
          height={200}
          className="absolute top-0 left-0 w-full h-full object-cover brightness-70"
        />
        <div className="relative mx-auto max-w-4xl text-center z-10">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-100 drop-shadow-2xl px-2 leading-tight"
            data-aos="fade-up"
          >
            Professional Quoting Software for Cabinet Makers &amp; Joinery Workshops
          </h1>
          <p
            className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-200 drop-shadow-2xl px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Create accurate quotes, manage client relationships, and turn quotes into jobs seamlessly. Everything you need to win more business and stay organized.
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
              View All Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-2"
              data-aos="fade-up"
            >
              Powerful quoting features built for cabinet makers and joinery workshops
            </h2>
            <p
              className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              From initial enquiry to final invoice, manage your entire sales process in one place.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-2">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
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
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {feature.benefits.map((benefit, i) => (
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

      {/* Benefits Section */}
      <section className="bg-gray-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-2"
              data-aos="fade-up"
            >
              Why choose CabiPro for quoting?
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            <div
              className="rounded-xl bg-white p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Accurate Quotes
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Material selection and specifications are tracked with each quote, ensuring accuracy from the start.
              </p>
            </div>
            <div
              className="rounded-xl bg-white p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Seamless Conversion
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Approved quotes automatically convert to jobs with all details, materials, and documents already attached.
              </p>
            </div>
            <div
              className="rounded-xl bg-white p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Client Management
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                All client information, contacts, and communication history in one place for better relationship management.
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
            Ready to streamline your quoting process?
          </h2>
          <p
            className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-300 px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Join the waitlist to get early access to CabiPro&apos;s powerful quoting features.
          </p>
          <div className="mt-8 sm:mt-10" data-aos="fade-up" data-aos-delay="200">
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
