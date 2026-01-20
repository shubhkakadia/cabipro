"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setUser } from "@/lib/slices/userSlice";
import { useAppDispatch } from "@/lib/hooks";
import {
  Mail,
  Lock,
  XCircle,
  Loader2,
  Factory,
  ClipboardList,
  Package,
  TrendingUp,
} from "lucide-react";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/login", formData, {});

      const data = response.data;
      if (!response.status) {
        throw new Error(data.message || "Login failed");
      }

      // Set user data in Redux store
      if (data.user) {
        // Regular user login
        const userData = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          photoUrl: null, // Will be fetched by UserDataInitializer
          organizationName: data.organizationName || null,
          organizationLogo: data.organizationLogo || null,
          isAdmin: false,
        };
        dispatch(setUser(userData));
      } else if (data.admin) {
        // Admin login
        const adminData = {
          id: data.admin.id,
          email: data.admin.email,
          firstName: data.admin.firstName,
          lastName: data.admin.lastName,
          photoUrl: data.admin.image || null,
          organizationName: null, // Admins don't have organizations
          organizationLogo: null, // Admins don't have organization logos
          isAdmin: true,
        };
        dispatch(setUser(adminData));
      }

      const redirectPath =
        typeof data.redirectPath === "string" && data.redirectPath.length > 0
          ? data.redirectPath
          : data.isAdmin
            ? "/admin"
            : "/app";

      router.push(redirectPath);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex">
      {/* Left Side - Illustration (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid-illustration"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-illustration)" />
          </svg>
        </div>

        {/* Floating Circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float-1"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float-2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float-3"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12">
          <div data-aos="fade-right">
            <Link href="/" className="inline-block mb-8">
              <h1 className="text-4xl xl:text-5xl font-bold text-white mb-2">
                CabiPro
              </h1>
            </Link>
            <h2 className="text-2xl xl:text-3xl font-semibold text-white mb-4">
              Welcome back
            </h2>
            <p className="text-lg text-gray-300 mb-12 max-w-md">
              Sign in to continue managing your cabinet manufacturing operations
              with ease.
            </p>

            {/* Feature Icons */}
            <div className="space-y-6">
              <div
                className="flex items-center gap-4"
                data-aos="fade-right"
                data-aos-delay="100"
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Factory className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Workshop Management</p>
                  <p className="text-gray-400 text-sm">
                    Track production and optimize workflow
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-4"
                data-aos="fade-right"
                data-aos-delay="200"
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Job Tracking</p>
                  <p className="text-gray-400 text-sm">
                    Monitor projects from start to finish
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-4"
                data-aos="fade-right"
                data-aos-delay="300"
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Material Management</p>
                  <p className="text-gray-400 text-sm">
                    Keep inventory and orders organized
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-4"
                data-aos="fade-right"
                data-aos-delay="400"
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Analytics & Insights</p>
                  <p className="text-gray-400 text-sm">
                    Make data-driven decisions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (40%) */}
      <div className="flex-1 lg:w-[40%] flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8 xl:px-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand for mobile */}
          <div className="lg:hidden text-center mb-8" data-aos="fade-up">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                CabiPro
              </h1>
            </Link>
            <p className="text-sm text-gray-600">Sign in to your account</p>
          </div>
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form Card */}
          <div
            className="bg-white lg:shadow-none rounded-2xl lg:rounded-none border border-gray-200 lg:border-0 p-8 sm:p-10"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition-colors text-gray-900 placeholder-gray-400"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition-colors text-gray-900 placeholder-gray-400"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Sign up link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-gray-900 hover:text-gray-700 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {/* Back to home */}
            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
