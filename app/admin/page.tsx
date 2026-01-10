import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - CabiPro",
  description: "CabiPro Admin Dashboard",
};

export default function AdminPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 px-4 pt-8 pb-8 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 px-2 leading-tight"
              data-aos="fade-up"
            >
              Admin Dashboard (admin area)
            </h1>
            <p
              className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Manage organizations, users, and system settings
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
