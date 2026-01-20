"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import AnimatedCounter from "@/components/AnimatedCounter";

export default function Pricing() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      name: "Starter",
      price: { monthly: 150, annual: 120 },
      description: "Get organised with the essentials for small cabinet shops",
      offices: 2,
      features: [
        "Unlimited jobs & projects",
        "Client & contact management",
        "Advanced production tracking",
        "Full material inventory tracking",
        "Material usage & waste tracking",
        "Supplier management",
        "Materials-to-Order (MTO)",
        "Purchase orders",
        "Advanced production scheduling",
        "Material selection & revision history",
        "Supplier statements & payment tracking",
        "Stock audits & adjustments",
        "Detailed job & material history",
        "Quotes",
        "Customer portal (optional)",
        "Document uploads (10 GB)",
        "AI integration",
        "Data import assistance",
        "Email support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Growth",
      price: { monthly: 450, annual: 360 },
      description: "Run your shop properly with better tracking and controls",
      offices: 6,
      features: [
        "Unlimited jobs & projects",
        "Client & contact management",
        "Advanced production tracking",
        "Full material inventory tracking",
        "Material usage & waste tracking",
        "Supplier management",
        "Materials-to-Order (MTO)",
        "Purchase orders",
        "Advanced production scheduling",
        "Material selection & revision history",
        "Supplier statements & payment tracking",
        "Stock audits & adjustments",
        "Detailed job & material history",
        "Quotes",
        "Customer portal (optional)",
        "Document uploads (50 GB)",
        "AI integration",
        "Data import assistance",
        "Priority email support",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Professional",
      price: { monthly: 900, annual: 720 },
      description: "Scale without chaos with advanced scheduling and insights",
      offices: 12,
      features: [
        "Unlimited jobs & projects",
        "Client & contact management",
        "Advanced production tracking",
        "Full material inventory tracking",
        "Material usage & waste tracking",
        "Supplier management",
        "Materials-to-Order (MTO)",
        "Purchase orders",
        "Advanced production scheduling",
        "Material selection & revision history",
        "Supplier statements & payment tracking",
        "Stock audits & adjustments",
        "Detailed job & material history",
        "Quotes",
        "Customer portal (optional)",
        "Document uploads (100 GB)",
        "AI integration",
        "Data import assistance",
        "Priority support",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Enterprise",
      price: { monthly: "Custom", annual: "Custom" },
      description: "Built around your business with custom workflows & support",
      offices: "Unlimited",
      features: [
        "Unlimited jobs & projects",
        "Client & contact management",
        "Advanced production tracking",
        "Full material inventory tracking",
        "Material usage & waste tracking",
        "Supplier management",
        "Materials-to-Order (MTO)",
        "Purchase orders",
        "Advanced production scheduling",
        "Material selection & revision history",
        "Supplier statements & payment tracking",
        "Stock audits & adjustments",
        "Detailed job & material history",
        "Quotes",
        "Customer portal (optional)",
        "Unlimited document storage",
        "AI integration",
        "Data import assistance",
        "Priority support",
        "Custom integrations",
        "On-site or remote training",
        "Dedicated account manager",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
            data-aos="fade-up"
          >
            Simple, transparent pricing
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Choose the plan that&apos;s right for your manufacturing facility.
            All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div
            className="mt-8 flex items-center justify-center gap-4"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <span
              className={`text-sm font-medium ${
                billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() =>
                setBillingCycle(
                  billingCycle === "monthly" ? "annual" : "monthly",
                )
              }
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out"
              role="switch"
              aria-checked={billingCycle === "annual"}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  billingCycle === "annual" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                billingCycle === "annual" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Annual
              <span className="ml-2 text-green-600">Save 20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl bg-white p-6 sm:p-8 shadow-lg ${
                  plan.popular ? "ring-2 ring-gray-900 lg:scale-105" : ""
                }`}
                data-aos="fade-up"
                data-aos-delay={index * 150}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gray-900 px-4 py-1 text-sm font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {plan.description}
                  </p>
                  <div className="mt-6">
                    {typeof plan.price[billingCycle] === "number" ? (
                      <div className="flex items-baseline justify-center flex-wrap">
                        <span className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
                          $
                          <AnimatedCounter
                            value={plan.price[billingCycle]}
                            duration={2}
                          />
                        </span>
                        <span className="ml-2 text-base sm:text-lg font-semibold text-gray-600">
                          /month
                        </span>
                      </div>
                    ) : (
                      <div className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
                        {plan.price[billingCycle]}
                      </div>
                    )}
                    {billingCycle === "annual" &&
                      typeof plan.price.annual === "number" && (
                        <p className="mt-2 text-sm text-gray-500">
                          Billed annually ($
                          <AnimatedCounter
                            value={plan.price.annual * 12}
                            duration={2}
                          />
                          /year)
                        </p>
                      )}
                    <p className="mt-2 text-sm text-gray-600">
                      {plan.offices !== "Unlimited"
                        ? `${plan.offices} users`
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        plan.name === "Enterprise" ? "/contact" : "/waitlist",
                      )
                    }
                    className="cursor-pointer mt-8 w-full rounded-lg bg-gray-900 px-8 py-4 text-base font-medium text-white hover:bg-gray-800 transition-colors"
                  >
                    {plan.cta}
                  </button>
                </div>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      {feature === "AI integration" ? (
                        <Sparkles className="mr-3 h-5 w-5 shrink-0 text-indigo-500" />
                      ) : (
                        <svg
                          className="mr-3 h-5 w-5 shrink-0 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      {/* <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
              data-aos="fade-up"
            >
              Compare plans
            </h2>
            <p
              className="mx-auto mt-4 max-w-2xl text-lg text-gray-600"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              See what&apos;s included in each plan at a glance.
            </p>
          </div>
          <div
            className="overflow-x-auto"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Starter
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Growth
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 relative bg-gray-50">
                    <div className="flex flex-col items-center gap-2">
                      <span>Professional</span>
                      <span className="rounded-full bg-gray-900 px-3 py-0.5 text-xs font-semibold text-white">
                        Most Popular
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  {
                    feature: "Offices",
                    starter: "2",
                    growth: "6",
                    professional: "12",
                    enterprise: "Unlimited",
                  },
                  {
                    feature: "Jobs & projects",
                    starter: "Unlimited",
                    growth: "Unlimited",
                    professional: "Unlimited",
                    enterprise: "Unlimited",
                  },
                  {
                    feature: "Client & contact management",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Production tracking",
                    starter: "Advanced",
                    growth: "Advanced",
                    professional: "Advanced",
                    enterprise: "Advanced",
                  },
                  {
                    feature: "Material tracking & inventory",
                    starter: "Full + history",
                    growth: "Full + history",
                    professional: "Full + history",
                    enterprise: "Full + history",
                  },
                  {
                    feature: "Material usage & waste tracking",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Supplier management",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Materials-to-Order (MTO)",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Purchase orders",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Advanced production scheduling",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Material selection & revision history",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Supplier statements & payment tracking",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Stock audits & adjustments",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Detailed job & material history",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Quotes",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Customer portal",
                    starter: "Optional",
                    growth: "Optional",
                    professional: "Optional",
                    enterprise: "Optional",
                  },
                  {
                    feature: "Document storage",
                    starter: "10 GB",
                    growth: "50 GB",
                    professional: "100 GB",
                    enterprise: "Unlimited",
                  },
                  {
                    feature: "AI integration",
                    starter: (
                      <Sparkles className="mx-auto h-4 w-4 text-indigo-500" />
                    ),
                    growth: (
                      <Sparkles className="mx-auto h-4 w-4 text-indigo-500" />
                    ),
                    professional: (
                      <Sparkles className="mx-auto h-4 w-4 text-indigo-500" />
                    ),
                    enterprise: (
                      <Sparkles className="mx-auto h-4 w-4 text-indigo-500" />
                    ),
                  },
                  {
                    feature: "Data import assistance",
                    starter: "✅",
                    growth: "✅",
                    professional: "✅",
                    enterprise: "✅",
                  },
                  {
                    feature: "Support",
                    starter: "Email",
                    growth: "Priority email",
                    professional: "Priority",
                    enterprise: "SLA & priority",
                  },
                  {
                    feature: "Custom integrations",
                    starter: "❌",
                    growth: "❌",
                    professional: "❌",
                    enterprise: "✅",
                  },
                  {
                    feature: "On-site or remote training",
                    starter: "❌",
                    growth: "❌",
                    professional: "❌",
                    enterprise: "✅",
                  },
                  {
                    feature: "Dedicated account manager",
                    starter: "❌",
                    growth: "❌",
                    professional: "❌",
                    enterprise: "✅",
                  },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {row.starter}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {row.growth}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 bg-gray-50 font-medium">
                      {row.professional}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {row.enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
              data-aos="fade-up"
            >
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                question: "Can I change plans later?",
                answer:
                  "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges. Perfect as your manufacturing operation grows.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept all major credit cards, ACH transfers, and wire transfers for Enterprise plans. All payments are processed securely.",
              },
              {
                question: "Is there a free trial?",
                answer:
                  "Yes! All paid plans include a 14-day free trial. No credit card required. Start tracking production orders and see how CabiPro works for your facility.",
              },
              {
                question: "What happens if I need more offices?",
                answer:
                  "You can upgrade your plan at any time to add more offices. Starter includes 2 offices, Growth includes 6 offices, Professional includes 12 offices, and Enterprise offers unlimited offices.",
              },
              {
                question: "Do you offer discounts for annual plans?",
                answer:
                  "Yes! Annual plans save you 20% compared to monthly billing. Perfect for manufacturers looking to commit long-term.",
              },
              {
                question:
                  "Can I import my existing production orders and data?",
                answer:
                  "Absolutely! We offer data import assistance for all plans. Contact us to discuss migrating your existing production order data.",
              },
            ].map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-lg bg-white shadow-sm overflow-hidden"
                  data-aos="fade-up"
                  data-aos-delay={i * 100}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="cursor-pointer w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 shrink-0 transition-transform duration-300 ${
                        isOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Still have questions?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Our team is here to help. Get in touch and we&apos;ll find the
            perfect plan for you.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
            <button
              onClick={() => router.push("/contact")}
              className="cursor-pointer w-full sm:w-auto rounded-lg bg-white px-8 py-4 text-base font-medium text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </button>
            <button
              onClick={() => router.push("/waitlist")}
              className="cursor-pointer w-full sm:w-auto rounded-lg border-2 border-white px-8 py-4 text-base font-medium text-white hover:bg-white/10 transition-colors"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
