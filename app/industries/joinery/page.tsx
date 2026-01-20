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

export default function Joinery() {
  const solutions = [
    {
      title: "Custom Joinery Project Management",
      description:
        "Manage complex joinery projects with multiple components and custom specifications. Track each piece from design to installation.",
      icon: ClipboardList,
      benefits: [
        "Multiple components per project",
        "Custom specification tracking",
        "Production scheduling",
        "Installation planning",
      ],
    },
    {
      title: "Material & Timber Management",
      description:
        "Track timber, hardware, and specialized joinery materials. Manage stock levels, material grades, and supplier relationships.",
      icon: Package,
      benefits: [
        "Timber grade tracking",
        "Hardware inventory",
        "Specialized material management",
        "Supplier relationship tracking",
      ],
    },
    {
      title: "Workshop & Production Management",
      description:
        "Coordinate joinery production across different stages - machining, assembly, finishing. Assign work to specialized teams.",
      icon: Factory,
      benefits: [
        "Multi-stage production tracking",
        "Specialized team assignment",
        "Workshop floor visibility",
        "Quality control tracking",
      ],
    },
    {
      title: "Technical Drawings & Specifications",
      description:
        "Store technical drawings, joinery details, and installation instructions. Keep all project documentation organized and accessible.",
      icon: FileImage,
      benefits: [
        "Technical drawing storage",
        "Joinery detail documentation",
        "Installation instructions",
        "Version control for drawings",
      ],
    },
    {
      title: "Client & Quote Management",
      description:
        "Create detailed quotes for custom joinery work. Manage client relationships and track project approvals and changes.",
      icon: Users,
      benefits: [
        "Detailed joinery quotes",
        "Client approval tracking",
        "Change order management",
        "Project communication history",
      ],
    },
  ];

  const challenges = [
    {
      title: "Complex Project Management",
      description:
        "Manage joinery projects with multiple components, custom specifications, and varying production stages - all while maintaining quality and meeting deadlines.",
    },
    {
      title: "Specialized Material Tracking",
      description:
        "Track different timber grades, hardware types, and specialized joinery materials - ensuring you have what you need when you need it.",
    },
    {
      title: "Multi-Stage Production",
      description:
        "Coordinate machining, assembly, and finishing stages across different teams while maintaining quality and workflow efficiency.",
    },
    {
      title: "Custom Specifications",
      description:
        "Manage detailed technical specifications, drawings, and client requirements for each custom joinery project without losing information.",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gray-50 px-4 pt-24 pb-12 sm:px-6 sm:py-20 lg:px-8 lg:py-32 overflow-hidden">
        <Image
          src="/cabinet_making.png"
          alt="Joinery"
          width={1000}
          height={200}
          className="absolute top-0 left-0 w-full h-full object-cover brightness-70"
        />
        <div className="relative mx-auto max-w-4xl text-center z-10">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-100 drop-shadow-2xl px-2 leading-tight"
            data-aos="fade-up"
          >
            Job Management Software for Joinery Workshops
          </h1>
          <p
            className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-200 drop-shadow-2xl px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Built for joinery manufacturers who need to manage complex projects,
            track specialized materials, and coordinate multi-stage production.
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
              Challenges Joinery Workshops Face
            </h2>
            <p
              className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Custom joinery manufacturing comes with unique challenges. CabiPro
              is designed to help joinery workshops manage complexity with
              confidence.
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
              How CabiPro Helps Joinery Workshops
            </h2>
            <p
              className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Powerful features designed specifically for custom joinery
              manufacturing operations.
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
              Built for Custom Joinery Manufacturing
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            <div
              className="rounded-xl bg-gray-50 p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Handles Complexity
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Manage complex joinery projects with multiple components, custom
                specifications, and varying production stages with ease.
              </p>
            </div>
            <div
              className="rounded-xl bg-gray-50 p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Specialized Material Tracking
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Track different timber grades, hardware types, and specialized
                joinery materials with detailed specifications.
              </p>
            </div>
            <div
              className="rounded-xl bg-gray-50 p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Multi-Stage Production
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Coordinate machining, assembly, and finishing stages across
                specialized teams while maintaining quality and workflow.
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
            Ready to streamline your joinery operations?
          </h2>
          <p
            className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-300 px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Join joinery workshops who are using CabiPro to manage complex
            projects more efficiently.
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
