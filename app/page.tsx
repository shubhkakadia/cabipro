"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList,
  Package,
  DollarSign,
  Factory,
  FileImage,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const taglines = [
  "From Enquiry to Installation — All in One System.",
  "Stop Managing Jobs in Spreadsheets. Start Managing Them Properly.",
  "See Every Job. Every Stage. Zero Guesswork.",
  "Your Entire Workshop — Organised.",
  "Materials, Jobs, Teams — Finally Working Together.",
  "Build Cabinets. Not Chaos.",
  "One Dashboard. Total Control.",
  "Know What's Done, What's Delayed, and What's Next.",
  "Less Paperwork. More Production.",
  "Cabinet Manufacturing — Made Manageable.",
];

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentTaglineIndex((prev) => (prev + 1) % taglines.length);
        setIsVisible(true);
      }, 300); // Wait for fade out before changing text
    }, 4000); // Change tagline every 3.5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to subscribe");
      }

      setSubmitStatus("success");
      setEmail("");
    } catch (error) {
      console.error("Error subscribing:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Image
        src="/inventory.png"
        alt="Hero Image"
        width={1000}
        height={1000}
        className="absolute top-0 left-0 w-full h-full object-cover brightness-70"
      />
      {/* Hero Section */}
      <section className="overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <div
            className="relative min-h-[150px] sm:min-h-[200px] md:min-h-[250px] lg:min-h-[280px] flex items-center justify-center px-2"
            data-aos="fade-up"
          >
            <h1
              className={`text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl transition-opacity duration-500 drop-shadow-2xl leading-tight sm:leading-tight ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {taglines[currentTaglineIndex]}
            </h1>
          </div>
          <p
            className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-100 px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Job management software built specifically for cabinet
            manufacturers. Track production, manage materials, schedule jobs,
            and optimize your manufacturing floor, all in one place.
          </p>
          <div
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 sm:gap-x-6 px-2"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <button
              onClick={() => router.push("/waitlist")}
              className="cursor-pointer w-full sm:w-auto rounded-lg bg-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-gray-900 hover:bg-gray-200 transition-colors touch-manipulation"
            >
              Join Waitlist
            </button>
            {/* <button
              onClick={() => router.push("/pricing")}
              className="cursor-pointer rounded-lg border-2 border-gray-900 px-8 py-4 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              View Pricing
            </button> */}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-gray-900 py-8 sm:py-12 lg:py-16 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p
            className="text-center text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-500 mb-6 sm:mb-8"
            data-aos="fade-up"
          >
            Trusted by cabinet manufacturers
          </p>
          <div
            className="flex items-center justify-center px-4"
            data-aos="zoom-in"
            data-aos-delay="100"
          >
            <div className="relative h-20 sm:h-24 md:h-28 w-auto opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0">
              <Image
                title="Ikonic Kitchens and Cabinets"
                src="/clients-logo/ikonickitchens.webp"
                alt="Ikonic Kitchens and Cabinets"
                width={400}
                height={130}
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24 z-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-2"
              data-aos="fade-up"
            >
              Everything you need to run your manufacturing
            </h2>
            <p
              className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Powerful features designed specifically for cabinet manufacturers
              and production facilities.
            </p>
          </div>
          <div className="mt-10 sm:mt-12 md:mt-16 grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Production Tracking & Scheduling",
                description:
                  "Track every production order from quote to completion. See what's in production, what's scheduled, and what's ready for delivery.",
                icon: ClipboardList,
              },
              {
                title: "Material Inventory Management",
                description:
                  "Track raw materials, components, and hardware inventory. Generate cut lists, calculate material needs, and optimize stock levels.",
                icon: Package,
              },
              {
                title: "Order Management & Quotes",
                description:
                  "Create professional quotes and manage orders efficiently. Track pricing, specifications, and customer approvals all in one place.",
                icon: DollarSign,
              },
              {
                title: "Manufacturing Floor Management",
                description:
                  "Organize your production floor with job status boards, work order assignments, and real-time production tracking.",
                icon: Factory,
              },
              {
                title: "Document & Drawing Management",
                description:
                  "Store production drawings, specifications, and documents. Share with production teams and keep everything organized.",
                icon: FileImage,
              },
              {
                title: "Supplier Management",
                description:
                  "Store all supplier details, documents, and contacts in one place. Easily see who you buy from and what materials they supply.",
                icon: Truck,
              },
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm transition-shadow hover:shadow-md"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900">
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-2"
              data-aos="fade-up"
            >
              How it works
            </h2>
            <p
              className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Get your manufacturing operations organized in minutes, not weeks.
            </p>
          </div>
          <div className="mt-10 sm:mt-12 md:mt-16 grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Join the Waitlist",
                description:
                  "Sign up to get early access. We'll notify you when CabiPro launches.",
              },
              {
                step: "2",
                title: "Set Up Your Facility",
                description:
                  "Add your production team, set up material inventory, and import your existing production orders.",
              },
              {
                step: "3",
                title: "Start Managing",
                description:
                  "Create quotes, track production orders, manage materials, and watch your manufacturing run smoother than ever.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="text-center px-2"
                data-aos="fade-up"
                data-aos-delay={index * 150}
              >
                <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-gray-900 text-xl sm:text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed px-2">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Subscription Section */}
      <section className="bg-white py-10 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 sm:gap-8 lg:gap-12">
            {/* Left Side - Title */}
            <div
              className="flex-1 w-full text-center lg:text-left"
              data-aos="fade-right"
            >
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 px-2">
                Subscribe to Our Newsletter
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600 px-2">
                Stay updated with the latest features, manufacturing tips, and
                industry insights from CabiPro.
              </p>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 w-full lg:w-auto" data-aos="fade-up">
              <form onSubmit={handleSubscribe}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 touch-manipulation"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer w-full sm:w-auto rounded-lg bg-gray-900 px-5 sm:px-6 py-3 text-sm sm:text-base font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap touch-manipulation"
                  >
                    {isSubmitting ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
                {submitStatus === "success" && (
                  <p className="mt-3 text-green-600 text-xs sm:text-sm">
                    Thank you for subscribing!
                  </p>
                )}
                {submitStatus === "error" && (
                  <p className="mt-3 text-red-600 text-xs sm:text-sm">
                    Something went wrong. Please try again later.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
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
            Join cabinet manufacturers who are already using CabiPro to run more
            organized, efficient operations.
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
              href="/contact"
              className="w-full sm:w-auto text-center rounded-lg border-2 border-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white hover:bg-white/10 transition-colors touch-manipulation"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
