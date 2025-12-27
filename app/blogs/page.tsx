import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Blog - CabiPro",
  description: "Read articles about cloud security, job management, and best practices for cabinet manufacturers.",
};

const blogPosts = [
  {
    slug: "How_safe_is_your_business_data_when_using_cloud_software",
    title: "How Safe Is Your Business Data When Using Cloud Software?",
    preview: "Learn about cloud security, the shared responsibility model, and how to vet cloud software providers to keep your business data safe.",
    date: "December 27, 2025",
    readTime: "5 min read",
    image: "/cabinet_making.png",
  },
];

export default function Blogs() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 px-4 pt-24 pb-8 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 px-2 leading-tight"
              data-aos="fade-up"
            >
              Blogs
            </h1>
            <p
              className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-gray-600 px-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Insights, tips, and best practices for cabinet manufacturers
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20 overflow-hidden">
        {/* Animated Background Illustrations */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating circles */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-float-1"></div>
          <div className="absolute top-60 right-20 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-float-2"></div>
          <div className="absolute bottom-40 left-1/4 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl animate-float-3"></div>
          
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-blogs" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-blogs)" className="animate-grid-move" />
          </svg>
          
          {/* Geometric shapes */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 border-2 border-gray-300/30 rounded-lg rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-1/3 left-1/3 w-24 h-24 border-2 border-gray-300/30 rounded-full animate-pulse-slow"></div>
          <svg className="absolute top-1/2 left-1/2 w-48 h-48 text-gray-300/20 animate-rotate-slow" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
          </svg>
        </div>
        
        <div className="relative mx-auto max-w-7xl z-10">
          {blogPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post, index) => (
                <Link
                  key={post.slug}
                  href={`/blogs/${post.slug}`}
                  className="group block rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  {/* Image */}
                  <div className="relative h-48 sm:h-56 md:h-48 lg:h-56 w-full overflow-hidden bg-gray-100">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    {/* Date and Read Time */}
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3">
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-gray-700 transition-colors leading-tight">
                      {post.title}
                    </h2>

                    {/* Preview */}
                    <p className="text-sm sm:text-base text-gray-600 line-clamp-3 leading-relaxed">
                      {post.preview}
                    </p>

                    {/* Read More Link */}
                    <div className="mt-4 sm:mt-5 flex items-center text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                      Read more
                      <svg
                        className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <p className="text-base sm:text-lg text-gray-600">
                No blog posts available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

