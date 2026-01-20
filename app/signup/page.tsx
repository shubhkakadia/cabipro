"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  Mail,
  Lock,
  User,
  XCircle,
  Loader2,
  Building2,
  Phone,
  MapPin,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { generateSlug } from "@/lib/slug-utils";
import Image from "next/image";
import { setUser } from "@/lib/slices/userSlice";
import { useDispatch } from "react-redux";

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    // Personal details
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    // Organization details
    organization_name: "",
    organization_email: "",
    organization_phone: "",
    organization_address: "",
    organization_logo: null as File | null,
    logoPreview: null as string | null,
  });
  const [generatedSlug, setGeneratedSlug] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    strength: "weak" | "fair" | "good" | "strong";
    score: number;
    feedback: string;
  }>({ strength: "weak", score: 0, feedback: "" });

  // Generate slug from organization name

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    if (!password) {
      return { strength: "weak" as const, score: 0, feedback: "" };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length checks
    if (password.length >= 8) score += 1;
    else feedback.push("At least 8 characters");

    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("lowercase letters");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("uppercase letters");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("numbers");

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push("special characters");

    // Determine strength level
    let strength: "weak" | "fair" | "good" | "strong" = "weak";
    let strengthFeedback = "";

    if (score <= 2) {
      strength = "weak";
      strengthFeedback =
        feedback.length > 0 ? `Add: ${feedback.slice(0, 2).join(", ")}` : "";
    } else if (score === 3) {
      strength = "fair";
      strengthFeedback = feedback.length > 0 ? `Add: ${feedback[0]}` : "";
    } else if (score === 4 || score === 5) {
      strength = "good";
      strengthFeedback = "Good password!";
    } else {
      strength = "strong";
      strengthFeedback = "Strong password!";
    }

    return { strength, score, feedback: strengthFeedback };
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Generate slug when organization name changes
    if (name === "organization_name") {
      setGeneratedSlug(generateSlug(value));
    }

    // Calculate password strength when password changes
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Logo size must be less than 5MB");
        return;
      }

      setFormData({
        ...formData,
        organization_logo: file,
      });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logoPreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStep1Submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate step 1
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please fill in all personal details");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setStep(2);
    setError("");
  };

  const handleStep2Submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate step 2
    if (!formData.organization_name) {
      setError("Organization name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData
      const submitFormData = new FormData();
      submitFormData.append("first_name", formData.first_name);
      submitFormData.append("last_name", formData.last_name);
      submitFormData.append("email", formData.email);
      submitFormData.append("password", formData.password);
      submitFormData.append("organization_name", formData.organization_name);

      if (formData.organization_email) {
        submitFormData.append(
          "organization_email",
          formData.organization_email,
        );
      }
      if (formData.organization_phone) {
        submitFormData.append(
          "organization_phone",
          formData.organization_phone,
        );
      }
      if (formData.organization_address) {
        submitFormData.append(
          "organization_address",
          formData.organization_address,
        );
      }
      if (formData.organization_logo) {
        submitFormData.append("organization_logo", formData.organization_logo);
      }

      const response = await axios.post("/api/signup", submitFormData, {
        withCredentials: true,
      });
      const data = await response.data;

      if (!response.status) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user) {
        // Regular user signup
        const userData = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          photoUrl: null, // Will be fetched by UserDataInitializer
          organizationName: data.organization?.name || null,
          organizationLogo: data.organization?.logo || null,
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
        typeof response.data.redirectUrl === "string" &&
        response.data.redirectUrl.length > 0
          ? response.data.redirectUrl
          : "/app";
      router.push(redirectPath);
      router.refresh();
    } catch (error) {
      console.error("Signup error:", error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError(
          error instanceof Error
            ? error.message
            : "Signup failed. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex">
      {/* Left Side - Illustration (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
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

        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float-1"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float-2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float-3"></div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12">
          <div data-aos="fade-right">
            <Link href="/" className="inline-block mb-8">
              <h1 className="text-4xl xl:text-5xl font-bold text-white mb-2">
                CabiPro
              </h1>
            </Link>
            <h2 className="text-2xl xl:text-3xl font-semibold text-white mb-4">
              Start your journey
            </h2>
            <p className="text-lg text-gray-300 mb-12 max-w-md">
              Create your account and get started managing your cabinet
              manufacturing operations with ease.
            </p>

            {/* Step Indicator */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                    step >= 1
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
                </div>
                <div>
                  <p className="text-white font-medium">Personal Details</p>
                  <p className="text-gray-400 text-sm">
                    Your account information
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                    step >= 2
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
                </div>
                <div>
                  <p className="text-white font-medium">Organization Details</p>
                  <p className="text-gray-400 text-sm">
                    Your company information
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form (40%) */}
      <div className="flex-1 lg:w-[40%] flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8 xl:px-12">
        <div className="w-full max-w-2xl">
          {/* Logo/Brand for mobile */}
          <div className="lg:hidden text-center mb-8" data-aos="fade-up">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                CabiPro
              </h1>
            </Link>
            <p className="text-sm text-gray-600">Create your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
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

          {/* Signup Form Card */}
          <div
            className="bg-white lg:shadow-none rounded-2xl lg:rounded-none border border-gray-200 lg:border-0 p-8 sm:p-10"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Personal Details
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Enter your personal information
                  </p>
                </div>

                {/* First Name and Last Name in one line */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="first_name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="John"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition-colors text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        autoComplete="family-name"
                        required
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition-colors text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Email and Password in one line */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
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
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        minLength={8}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition-colors text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                passwordStrength.strength === "weak"
                                  ? "bg-red-500 w-1/4"
                                  : passwordStrength.strength === "fair"
                                    ? "bg-yellow-500 w-1/2"
                                    : passwordStrength.strength === "good"
                                      ? "bg-blue-500 w-3/4"
                                      : "bg-green-500 w-full"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              passwordStrength.strength === "weak"
                                ? "text-red-600"
                                : passwordStrength.strength === "fair"
                                  ? "text-yellow-600"
                                  : passwordStrength.strength === "good"
                                    ? "text-blue-600"
                                    : "text-green-600"
                            }`}
                          >
                            {passwordStrength.strength.charAt(0).toUpperCase() +
                              passwordStrength.strength.slice(1)}
                          </span>
                        </div>
                        {passwordStrength.feedback && (
                          <p
                            className={`text-xs ${
                              passwordStrength.strength === "weak" ||
                              passwordStrength.strength === "fair"
                                ? "text-gray-600"
                                : "text-green-600"
                            }`}
                          >
                            {passwordStrength.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="submit"
                  className="cursor-pointer w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </form>
            )}

            {/* Step 2: Organization Details */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Organization Details
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Enter your company information
                  </p>
                </div>

                {/* Organization Name */}
                <div>
                  <label
                    htmlFor="organization_name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="organization_name"
                      name="organization_name"
                      type="text"
                      required
                      value={formData.organization_name}
                      onChange={handleChange}
                      placeholder="Acme Cabinets"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition-colors text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  {/* Generated Slug as text */}
                  {generatedSlug && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Slug:</span>{" "}
                      <span className="text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">
                        {generatedSlug}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        (Your unique organization identifier)
                      </span>
                    </p>
                  )}
                </div>

                {/* Organization Email and Phone in one line */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Organization Email */}
                  <div>
                    <label
                      htmlFor="organization_email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Organization Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="organization_email"
                        name="organization_email"
                        type="email"
                        value={formData.organization_email}
                        onChange={handleChange}
                        placeholder="contact@company.com"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition-colors text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Organization Phone */}
                  <div>
                    <label
                      htmlFor="organization_phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Organization Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="organization_phone"
                        name="organization_phone"
                        type="tel"
                        value={formData.organization_phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition-colors text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Organization Address - Full Width */}
                <div>
                  <label
                    htmlFor="organization_address"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Organization Address
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    </div>
                    <textarea
                      id="organization_address"
                      name="organization_address"
                      rows={3}
                      value={formData.organization_address}
                      onChange={handleChange}
                      placeholder="123 Main St, City, State, ZIP"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition-colors text-gray-900 placeholder-gray-400 resize-none"
                    />
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label
                    htmlFor="organization_logo"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Organization Logo
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    <label
                      htmlFor="organization_logo"
                      className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {formData.logoPreview ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={formData.logoPreview || ""}
                            width={100}
                            height={100}
                            alt="Logo preview"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      )}
                      <input
                        id="organization_logo"
                        name="organization_logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    className="cursor-pointer flex-1 flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Sign in link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-gray-900 hover:text-gray-700 transition-colors"
                >
                  Sign in
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
