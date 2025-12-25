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

export default function Features() {
  const router = useRouter();
  const features = [
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

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
            data-aos="fade-up"
          >
            Built for cabinet manufacturers
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Everything you need to manage production orders, materials,
            customers, and your manufacturing floor, all in one place.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="flex gap-6"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900">
                      <IconComponent className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, i) => (
                        <li
                          key={i}
                          className="flex items-start text-sm text-gray-600"
                        >
                          <svg
                            className="mr-2 h-5 w-5 shrink-0 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {benefit}
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

      {/* Why It's Better Section */}
      <section className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
              data-aos="fade-up"
            >
              Why cabinet manufacturers choose CabiPro
            </h2>
            <p
              className="mx-auto mt-4 max-w-2xl text-lg text-gray-600"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Built by manufacturers, for manufacturers. We understand your
              production workflow because we&apos;ve lived it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div
              className="rounded-xl bg-white p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Built for Manufacturing
              </h3>
              <p className="text-gray-600">
                Not a generic project management tool. Every feature is designed
                specifically for how cabinet manufacturing actually works.
              </p>
            </div>
            <div
              className="rounded-xl bg-white p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Get Organized Fast
              </h3>
              <p className="text-gray-600">
                Start tracking production orders and managing materials in
                minutes. No complex setup or training required.
              </p>
            </div>
            <div
              className="rounded-xl bg-white p-8 shadow-sm"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-900">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Scales With You
              </h3>
              <p className="text-gray-600">
                From small manufacturers to large production facilities, CabiPro
                scales with your business. Add production teams and features as
                you grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            data-aos="fade-up"
          >
            Ready to see it in action?
          </h2>
          <p
            className="mx-auto mt-4 max-w-2xl text-lg text-gray-300"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Join the waitlist to get early access and exclusive pricing.
          </p>
          <div className="mt-10" data-aos="fade-up" data-aos-delay="200">
            <button
              onClick={() => router.push("/waitlist")}
              className="cursor-pointer rounded-lg border-2 border-white px-8 py-4 text-base font-medium text-white hover:bg-white/10 transition-colors"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
