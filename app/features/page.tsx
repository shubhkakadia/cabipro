"use client";
import {
  ClipboardList,
  Package,
  DollarSign,
  Factory,
  FileImage,
  CreditCard,
  Smartphone,
  Target,
  Zap,
  Wrench,
  Shield,
  FileText,
  Users,
  UserCheck,
  FolderKanban,
  Layers,
  TrendingUp,
  Truck,
  ShoppingCart,
  Receipt,
  Bell,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Features() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("project");

  const allFeatures = [
    {
      title: "User Accounts & Access Control",
      description:
        "Control who can access your system and what they can see. Create different user roles for owners, managers, and staff, so everyone only sees what's relevant to their job.",
      icon: Shield,
      benefits: [
        "Different access levels for owners, managers, and staff",
        "Secure login for all users",
        "Link staff profiles to login accounts",
        "Automatic logout for inactive users",
      ],
    },
    {
      title: "Activity History (Who Did What)",
      description:
        "See a clear history of everything that happens in your system. Know who updated a job, changed an order, uploaded files, or made important changes — all in one place.",
      icon: FileText,
      benefits: [
        "Clear history of all changes",
        "See who made each update and when",
        "Easy to review mistakes or changes",
        "Useful for accountability and tracking",
      ],
    },
    {
      title: "Projects & Job Tracking",
      description:
        "Manage all your projects in one place. Each project can have multiple jobs or areas, with clear progress tracking so you always know what's happening and what's next.",
      icon: FolderKanban,
      benefits: [
        "Multiple jobs under one project",
        "Clear job status tracking",
        "Quick overview of all active work",
        "Notes and updates saved with each job",
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
      title: "Production Scheduling & Job Status",
      description:
        "See exactly what stage each job is at — design, production, finishing, or ready to install. This helps you plan workloads and avoid delays.",
      icon: ClipboardList,
      benefits: [
        "Clear job status at every stage",
        "Visual production overview",
        "Better planning and scheduling",
        "Fewer missed deadlines",
      ],
    },
    {
      title: "Staff Management",
      description:
        "Manage your team easily. Store staff details, assign them to jobs, and see who is working on what across your projects.",
      icon: UserCheck,
      benefits: [
        "Staff profiles with photos",
        "Role and responsibility tracking",
        "Assign staff to specific jobs",
        "Clear visibility of workload",
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
      title: "Inventory Management",
      description:
        "Keep track of all your materials and stock levels in one place. Know what you have, what you're running low on, and what needs ordering.",
      icon: Package,
      benefits: [
        "Live stock level tracking",
        "Organised by material type",
        "Link materials to suppliers",
        "Add photos for easy identification",
      ],
    },
    {
      title: "Material Usage Tracking",
      description:
        "Track how much material is used, wasted, or added to stock. This helps reduce waste and understand real material costs.",
      icon: TrendingUp,
      benefits: [
        "Track used, added, and wasted materials",
        "See material usage per job",
        "Better cost control",
        "Less stock loss and surprises",
      ],
    },
    {
      title: "Supplier Management",
      description:
        "Store all supplier details, documents, and contacts in one place. Easily see who you buy from and what materials they supply.",
      icon: Truck,
      benefits: [
        "All supplier details in one place",
        "Store invoices and documents",
        "Link suppliers to materials",
        "Easier supplier communication",
      ],
    },
    {
      title: "Materials to Order",
      description:
        "Plan what materials need to be ordered for each project. Track what's required, what's already ordered, and what's been used.",
      icon: ShoppingCart,
      benefits: [
        "Clear material order planning",
        "Avoid missing items",
        "Track order progress",
        "Link materials directly to jobs",
      ],
    },
    {
      title: "Purchase Orders",
      description:
        "Create and manage purchase orders easily. Track deliveries, upload invoices, and update stock automatically when materials arrive.",
      icon: Receipt,
      benefits: [
        "Simple purchase order creation",
        "Track partial and full deliveries",
        "Invoice uploads",
        "Automatic stock updates",
      ],
    },
    {
      title: "Supplier Statements & Payments",
      description:
        "Keep track of supplier bills and payments. See what's due, what's paid, and manage cash flow more confidently.",
      icon: DollarSign,
      benefits: [
        "Monthly supplier statements",
        "Track paid and unpaid bills",
        "Due date reminders",
        "Clear financial overview",
      ],
    },
    {
      title: "Documents & Drawings",
      description:
        "Store all drawings, plans, site photos, and documents with each job. Everything is organised and easy to find when you need it.",
      icon: FileImage,
      benefits: [
        "Drawings and documents stored per job",
        "Organised folders for easy access",
        "Recover deleted files if needed",
        "Secure access for authorised users",
      ],
    },
    {
      title: "Workshop & Factory Overview",
      description:
        "Get a clear picture of what's happening on your workshop floor. See active jobs, current stages, and progress at a glance.",
      icon: Factory,
      benefits: [
        "Clear workshop overview",
        "Track job progress visually",
        "Assign work to teams",
        "Reduce confusion on the floor",
      ],
    },
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
      title: "Mobile Access",
      description:
        "Access your system from anywhere. Update job status, upload photos, and check materials while on the factory floor or on site.",
      icon: Smartphone,
      benefits: [
        "Access from phone or tablet",
        "Update jobs on the go",
        "Upload site and progress photos",
        "Designed for workshop use",
      ],
    },
    {
      title: "Notifications & Alerts",
      description:
        "Stay informed about important updates and deadlines. Get notified about job status changes, low stock levels, payment due dates, and other critical information that needs your attention.",
      icon: Bell,
      benefits: [
        "Real-time job status updates",
        "Low stock level alerts",
        "Payment due date reminders",
        "Customizable notification preferences",
      ],
    },
  ];

  // Group features by category
  const featureGroups = {
    all: {
      name: "All Features",
      features: allFeatures,
    },
    project: {
      name: "Project Management",
      features: allFeatures.filter((f) =>
        [
          "Projects & Job Tracking",
          "Production Scheduling & Job Status",
          "Workshop & Factory Overview",
          "Quotes & Orders",
          "Documents & Drawings",
        ].includes(f.title),
      ),
    },
    team: {
      name: "Team & Clients",
      features: allFeatures.filter((f) =>
        [
          "Clients & Contacts",
          "Staff Management",
          "User Accounts & Access Control",
        ].includes(f.title),
      ),
    },
    materials: {
      name: "Materials & Inventory",
      features: allFeatures.filter((f) =>
        [
          "Inventory Management",
          "Material Selection & Specifications",
          "Material Usage Tracking",
          "Materials to Order",
          "Supplier Management",
          "Purchase Orders",
          "Supplier Statements & Payments",
        ].includes(f.title),
      ),
    },
    system: {
      name: "System & Tools",
      features: allFeatures.filter((f) =>
        [
          "Activity History (Who Did What)",
          "Mobile Access",
          "Notifications & Alerts",
        ].includes(f.title),
      ),
    },
  };

  const tabs = Object.keys(featureGroups).map((key) => ({
    id: key,
    name: featureGroups[key as keyof typeof featureGroups].name,
    count: featureGroups[key as keyof typeof featureGroups].features.length,
  }));

  const displayedFeatures =
    featureGroups[activeTab as keyof typeof featureGroups]?.features || [];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Smooth scroll to top of features section
    // const featuresSection = document.getElementById('features-section');
    // if (featuresSection) {
    //   featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gray-50 px-4 pt-24 pb-12 sm:px-6 sm:py-20 lg:px-8 lg:py-32 overflow-hidden">
        <Image
          src="/cabinet_making.png"
          alt="Features Image"
          width={1000}
          height={200}
          className="absolute top-0 left-0 w-full h-full object-cover brightness-70"
        />
        <div className="relative mx-auto max-w-4xl text-center z-10">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-100 drop-shadow-2xl px-2 leading-tight"
            data-aos="fade-up"
          >
            Built for Cabinet Makers, Manufacturers &amp; Joinery Workshops
          </h1>
          <p
            className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-200 drop-shadow-2xl px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Everything cabinet makers, manufacturers, and joinery workshops need
            to manage production orders, materials, customers, and manufacturing
            floors, all in one place.
          </p>
        </div>
      </section>

      {/* Feature Categories Section */}
      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10 sm:mb-12">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-2"
              data-aos="fade-up"
            >
              Explore Our Features
            </h2>
            <p
              className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Dive deeper into specific feature categories designed for cabinet
              manufacturing
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/features/quoting-software"
              className="group rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900 group-hover:bg-gray-200 transition-colors">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                Quoting Software
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Create professional quotes, manage clients, and convert quotes
                to jobs seamlessly.
              </p>
            </Link>
            <Link
              href="/features/project-management"
              className="group rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900 group-hover:bg-gray-200 transition-colors">
                <FolderKanban className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                Project Management
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Track projects, schedule production, assign teams, and manage
                your workshop floor.
              </p>
            </Link>
            <Link
              href="/features/inventory-management"
              className="group rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900 group-hover:bg-gray-200 transition-colors">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                Inventory Management
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Track materials, manage suppliers, plan orders, and optimize
                your inventory.
              </p>
            </Link>
            <Link
              href="/features/invoicing"
              className="group rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
              data-aos="fade-up"
              data-aos-delay="500"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900 group-hover:bg-gray-200 transition-colors">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                Invoicing
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Manage supplier payments, track invoices, and maintain clear
                financial records.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  cursor-pointer flex items-center gap-2 px-4 sm:px-6 py-4 text-sm sm:text-base font-medium whitespace-nowrap border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <span>{tab.name}</span>
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${
                      activeTab === tab.id
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }
                  `}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features-section"
        className="relative bg-gray-100 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16 z-20 overflow-hidden"
      >
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
                id="grid"
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
              fill="url(#grid)"
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

        <div className="relative mx-auto max-w-7xl">
          {displayedFeatures.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-2">
              {displayedFeatures.map((feature, index) => {
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
                            <svg
                              className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-green-500 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="leading-relaxed">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No features found in this category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Why It's Better Section */}
      <section className="bg-gray-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-2"
              data-aos="fade-up"
            >
              Why cabinet makers and joinery workshops choose CabiPro
            </h2>
            <p
              className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Built by manufacturers, for manufacturers. We understand your
              production workflow because we&apos;ve lived it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            <div
              className="rounded-xl bg-white p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900">
                <Target className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Built for Manufacturing
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Not a generic project management tool. Every feature is designed
                specifically for how cabinet makers, manufacturers, and joinery
                workshops actually work.
              </p>
            </div>
            <div
              className="rounded-xl bg-white p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Get Organized Fast
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Start tracking production orders and managing materials in
                minutes. No complex setup or training required.
              </p>
            </div>
            <div
              className="rounded-xl bg-white p-6 sm:p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900">
                <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Scales With You
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                From small cabinet shops to large joinery workshops and
                manufacturing facilities, CabiPro scales with your business. Add
                production teams and features as you grow.
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
            Ready to see it in action?
          </h2>
          <p
            className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-gray-300 px-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Join the waitlist to get early access and exclusive pricing.
          </p>
          <div
            className="mt-8 sm:mt-10"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <button
              onClick={() => router.push("/waitlist")}
              className="cursor-pointer w-full sm:w-auto rounded-lg border-2 border-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white hover:bg-white/10 transition-colors touch-manipulation"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
