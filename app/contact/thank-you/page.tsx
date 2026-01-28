"use client";

import { useRouter } from "next/navigation";

export default function ThankYou() {
  const router = useRouter();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:py-16 lg:py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 sm:mb-6">
          <svg
            className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 px-2">
          Thank You for Reaching Out!
        </h1>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-2">
          We&apos;ve received your message and appreciate you taking the time to
          contact us. Our team will review your inquiry and get back to you
          within 24 hours.
        </p>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-2">
          In the meantime, feel free to explore our other resources or join our
          waitlist to be among the first to experience CabiPro when we launch.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2">
          <button
            onClick={() => router.push("/")}
            className="cursor-pointer w-full sm:w-auto rounded-lg bg-gray-900 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white hover:bg-gray-800 transition-colors touch-manipulation"
          >
            Back to Home
          </button>
          <button
            onClick={() => router.push("/waitlist")}
            className="cursor-pointer w-full sm:w-auto rounded-lg border-2 border-gray-900 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors touch-manipulation"
          >
            Join Waitlist
          </button>
        </div>
      </div>
    </div>
  );
}
