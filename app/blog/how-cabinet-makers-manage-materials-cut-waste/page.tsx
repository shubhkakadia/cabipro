import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "How Cabinet Makers Manage Materials and Cut Waste - CabiPro",
  description:
    "Learn proven strategies for material management and waste reduction in cabinet making. Discover cutting optimization techniques, inventory management tips, and cost-saving practices for cabinet makers and joinery workshops.",
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
            How Cabinet Makers Manage Materials and Cut Waste
          </h1>
          <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
            Proven strategies for optimizing material usage, reducing waste, and
            controlling costs in cabinet making and joinery workshops
          </p>
          <div className="mt-3 sm:mt-4 md:mt-5 flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-500">
            <span>January 10, 2026</span>
            <span>•</span>
            <span>10 min read</span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-120 overflow-hidden">
            <Image
              src="/manage-material.png"
              alt="Cabinet Maker Material Management and Waste Reduction"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6 md:mb-8">
            Material waste is one of the biggest hidden costs in cabinet making.
            Every offcut, every miscut panel, and every unused sheet represents
            money walking out the door. For cabinet makers and joinery
            workshops, effective material management isn&apos;t just about
            organization — it&apos;s about profitability.
          </p>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6 md:mb-8">
            The most successful cabinet shops aren&apos;t just skilled craftsmen
            — they&apos;re strategic material planners. They know that waste
            reduction starts long before the first cut is made, and continues
            through every stage of production, from initial quoting to final
            assembly.
          </p>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            Here&apos;s how professional cabinet makers manage materials,
            optimize cutting operations, and minimize waste to protect their
            bottom line.
          </p>

          {/* Section 1: Material Planning and Organization */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              1. Material Planning: The Foundation of Waste Reduction
            </h2>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Start with Accurate Material Lists
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              The first step to reducing waste is knowing exactly what you need.
              Professional cabinet makers create detailed material lists for
              every job, breaking down each component by size, type, and
              quantity. This precision prevents over-ordering and ensures you
              only purchase what you&apos;ll actually use.
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Effective material lists include:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>
                <strong>Component dimensions</strong> — Exact sizes for every
                panel, door, and drawer component
              </li>
              <li>
                <strong>Material specifications</strong> — Board type, finish,
                thickness, and grade
              </li>
              <li>
                <strong>Quantities with waste factors</strong> — Account for
                cutting waste and inevitable mistakes
              </li>
              <li>
                <strong>Hardware and accessories</strong> — Hinges, handles,
                drawer runners, and other components
              </li>
            </ul>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Organize Your Material Library
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              A well-organized material library is essential for efficient
              operations. Many cabinet makers maintain digital libraries that
              include:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>
                Standard board sizes from your suppliers (e.g., Polytec,
                Laminex, Acrilam in Australia)
              </li>
              <li>Current pricing for accurate job costing</li>
              <li>Material properties and best-use applications</li>
              <li>Stock levels and reorder points</li>
            </ul>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              This system allows you to quickly identify the most cost-effective
              materials for each job and avoid ordering materials you already
              have in stock.
            </p>
          </section>

          {/* Section 2: Cutting Optimization Strategies */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              2. Cutting Optimization: Maximizing Every Sheet
            </h2>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Use Nesting Software for Optimal Layouts
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              One of the most effective ways to reduce waste is using nesting
              software to optimize cutting layouts. These tools analyze all the
              components needed for a job and arrange them on standard sheet
              sizes to maximize material usage. Professional cabinet makers
              report waste reductions of 15-25% simply by optimizing their
              cutting patterns.
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Nesting software helps you:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>Combine multiple jobs onto single sheets when possible</li>
              <li>Identify which standard sheet sizes minimize waste</li>
              <li>Account for grain direction and panel orientation</li>
              <li>Generate optimized cut lists for CNC machines</li>
            </ul>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Implement Cutting Waste Standards
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Experienced cabinet makers establish waste factors based on their
              operations. Typically, this includes:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>
                <strong>5-8% waste factor</strong> for simple, repetitive cuts
                on standard panels
              </li>
              <li>
                <strong>10-15% waste factor</strong> for complex jobs with many
                different components
              </li>
              <li>
                <strong>15-20% waste factor</strong> for custom jobs with
                irregular shapes or special finishes
              </li>
            </ul>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Track your actual waste percentages over time and adjust these
              factors based on real performance data. This helps you quote more
              accurately and identify opportunities for improvement.
            </p>
          </section>

          {/* Section 3: Inventory Management */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              3. Smart Inventory Management
            </h2>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Track Stock Levels in Real Time
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Effective inventory management prevents overstocking (which ties
              up capital) and understocking (which causes delays). Many cabinet
              makers use software systems to track:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>Current stock levels by material type, finish, and size</li>
              <li>Materials reserved for specific jobs</li>
              <li>Materials-to-order lists for upcoming projects</li>
              <li>Historical usage patterns to predict future needs</li>
            </ul>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Reuse Offcuts Strategically
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Offcuts don&apos;t have to be waste. Many cabinet makers maintain
              an &quot;offcut library&quot; organized by size and material type.
              Before cutting a new sheet, check if an offcut can be used
              instead. Common strategies include:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>
                Keeping offcuts larger than a minimum usable size (e.g., 300mm x
                300mm)
              </li>
              <li>Organizing by material type and finish for easy searching</li>
              <li>
                Using offcuts for smaller components like drawer bottoms, backs,
                or internal panels
              </li>
              <li>
                Regularly auditing and disposing of offcuts that have been
                unused for extended periods
              </li>
            </ul>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              The key is balance: holding onto every scrap wastes space and
              organization time, but strategically reusing offcuts can
              significantly reduce material costs.
            </p>
          </section>

          {/* Section 4: Waste Reduction Techniques */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              4. Waste Reduction Techniques That Work
            </h2>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Standardize Component Sizes When Possible
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              While every kitchen is unique, standardizing certain components
              can dramatically reduce waste. Many cabinet makers offer standard
              drawer sizes, door heights, and panel dimensions that work across
              multiple jobs. This allows you to:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>Combine cutting operations for multiple jobs</li>
              <li>Maintain stock of pre-cut standard components</li>
              <li>Reduce setup time and material waste from one-off cuts</li>
            </ul>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Minimize Setup Waste
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Setup waste — the material lost during machine calibration, test
              cuts, and adjustments — can add up quickly. Strategies to minimize
              this include:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>
                Grouping similar jobs together to reduce machine setup changes
              </li>
              <li>Using scrap material for test cuts instead of full sheets</li>
              <li>Maintaining machines regularly to ensure consistent cuts</li>
              <li>
                Training staff on proper setup procedures to reduce errors
              </li>
            </ul>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Track and Analyze Waste
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              You can&apos;t improve what you don&apos;t measure. Professional
              cabinet makers track waste in several ways:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>
                Material usage tracking — Recording what&apos;s used, added, and
                wasted for each job
              </li>
              <li>
                Waste cost analysis — Calculating the dollar value of waste
                materials
              </li>
              <li>
                Job-by-job waste percentages — Identifying which types of jobs
                produce the most waste
              </li>
              <li>
                Regular waste audits — Periodically reviewing offcut storage and
                disposal
              </li>
            </ul>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              This data helps you identify trends, set targets for improvement,
              and make informed decisions about material purchasing and job
              pricing.
            </p>
          </section>

          {/* Section 5: Technology Tools */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              5. Technology Tools for Material Management
            </h2>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Cabinet Maker Software Systems
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Purpose-built cabinet maker software can significantly streamline
              material management. These systems typically include:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>Automated material list generation from job designs</li>
              <li>
                Integration with cutting optimization and nesting software
              </li>
              <li>
                Real-time inventory tracking and material-to-order planning
              </li>
              <li>Material usage tracking and waste reporting</li>
              <li>Supplier management and purchase order creation</li>
            </ul>

            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mt-4 sm:mt-6 md:mt-8 mb-2 sm:mb-3 md:mb-4 leading-tight">
              CNC Integration and Automation
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              For shops with CNC machines, integrated software systems can
              dramatically reduce waste by:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>
                Automatically generating optimized cutting programs from job
                data
              </li>
              <li>Minimizing tool changes and setup time</li>
              <li>
                Ensuring precise cuts that match design specifications exactly
              </li>
              <li>Reducing human error that leads to miscuts and rework</li>
            </ul>
          </section>

          {/* Section 6: Best Practices Summary */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              6. Best Practices for Waste Reduction
            </h2>

            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Here&apos;s a quick checklist of best practices that professional
              cabinet makers use to manage materials and cut waste:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>
                <strong>Plan before cutting:</strong> Always create optimized
                cutting layouts before starting production
              </li>
              <li>
                <strong>Batch similar jobs:</strong> Combine multiple jobs with
                similar materials to maximize sheet usage
              </li>
              <li>
                <strong>Maintain accurate inventory:</strong> Know what you have
                in stock before ordering new materials
              </li>
              <li>
                <strong>Track everything:</strong> Record material usage and
                waste for every job to identify improvement opportunities
              </li>
              <li>
                <strong>Train your team:</strong> Ensure all staff understand
                waste reduction goals and techniques
              </li>
              <li>
                <strong>Regular audits:</strong> Periodically review waste
                patterns and adjust processes accordingly
              </li>
              <li>
                <strong>Use technology:</strong> Leverage software tools for
                material management and cutting optimization
              </li>
              <li>
                <strong>Standardize where possible:</strong> Offer standard
                component sizes that work across multiple jobs
              </li>
            </ul>
          </section>

          {/* Section 7: Cost Impact */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              The Bottom Line: Cost Impact of Waste Reduction
            </h2>

            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Material waste directly impacts profitability. For a typical
              cabinet maker operating on a 20-30% gross margin, reducing
              material waste by just 5% can increase profitability by 15-25%.
              The math is compelling:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>
                If you spend $100,000 annually on materials, reducing waste from
                15% to 10% saves $5,000
              </li>
              <li>That savings goes directly to your bottom line</li>
              <li>
                Over 5 years, that&apos;s $25,000 — often enough to justify
                investing in better tools and systems
              </li>
            </ul>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Beyond direct material savings, effective waste reduction also:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4 ml-2 sm:ml-3 md:ml-4">
              <li>Reduces disposal costs for waste materials</li>
              <li>Improves workshop organization and efficiency</li>
              <li>Enables more accurate job costing and quoting</li>
              <li>Enhances your competitive position through better pricing</li>
            </ul>
          </section>

          {/* Final Thoughts */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-6 sm:mt-8 md:mt-10 lg:mt-12 mb-2 sm:mb-3 md:mb-4 leading-tight">
              Final Thoughts
            </h2>

            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Effective material management and waste reduction isn&apos;t about
              being perfect — it&apos;s about being strategic. Every percentage
              point of waste reduction improves your profitability and
              competitive position. The most successful cabinet makers treat
              material management as an ongoing process of measurement,
              analysis, and improvement.
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3 md:mb-4">
              Start small: track your waste for a month, identify your biggest
              waste sources, and implement one improvement at a time. Over time,
              these incremental improvements compound into significant cost
              savings and operational efficiency gains.
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Whether you&apos;re a small custom cabinet shop or a larger
              joinery workshop, better material management is within reach. The
              tools and techniques exist — it&apos;s just a matter of
              implementing them systematically and consistently.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div
          className="mt-8 sm:mt-12 md:mt-16 lg:mt-20 rounded-xl sm:rounded-2xl bg-gray-900 px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-12 lg:py-16 text-center"
          data-aos="fade-up"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3 sm:mb-4 md:mb-6 leading-tight">
            Ready to Optimize Your Material Management?
          </h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-gray-300 mb-4 sm:mb-6 md:mb-8 leading-relaxed px-2">
            CabiPro helps cabinet makers and joinery workshops track materials,
            manage inventory, and reduce waste. Join the waitlist to get early
            access to material management tools built specifically for your
            industry.
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
