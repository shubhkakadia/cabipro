"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  FolderOpen,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

// Type definitions
interface Organisation {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  plan: "STARTER" | "PLUS" | "PRO" | "ENTERPRISE" | "CUSTOM";
  plan_expires_at?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  owner_name: string;
  total_users: number;
  total_projects: number;
  total_clients: number;
  total_files: number;
  enabled_modules: {
    all_clients: boolean;
    dashboard: boolean;
    all_employees: boolean;
    all_projects: boolean;
    all_suppliers: boolean;
    all_items: boolean;
    logs: boolean;
    materialstoorder: boolean;
    purchaseorder: boolean;
  };
}

type TabType = "overview" | "plan" | "storage" | "addons";

// Plan colors
const PLAN_COLORS = {
  STARTER: "bg-slate-100 text-slate-700",
  PLUS: "bg-blue-100 text-blue-700",
  PRO: "bg-emerald-100 text-emerald-700",
  ENTERPRISE: "bg-purple-100 text-purple-700",
  CUSTOM: "bg-orange-100 text-orange-700",
};

// Plan pricing
const PLAN_PRICES = {
  STARTER: "$0/mo",
  PLUS: "$29/mo",
  PRO: "$99/mo",
  ENTERPRISE: "Custom",
  CUSTOM: "Custom",
};

// Storage limits by plan (in GB)
const STORAGE_LIMITS = {
  STARTER: 5,
  PLUS: 50,
  PRO: 200,
  ENTERPRISE: 1000,
  CUSTOM: 500,
};

export default function OrganisationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch organisation data
  useEffect(() => {
    const fetchOrganisation = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/admin/organisations/${id}`, {
          withCredentials: true,
        });

        if (response.data.status) {
          setOrganisation(response.data.data);
        } else {
          setError(response.data.message || "Failed to fetch organisation");
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "Failed to fetch organisation. Please try again.",
          );
        } else {
          setError("Failed to fetch organisation. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrganisation();
    }
  }, [id]);

  // Normalize logo path
  const normalizeLogoPath = (
    path: string | null | undefined,
  ): string | null => {
    if (!path) return null;
    const normalized = path.startsWith("/public/")
      ? path.replace("/public", "")
      : path;
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-sm text-slate-600 font-medium">
            Loading organisation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !organisation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-red-600 mb-4 font-medium">
            {error || "Organisation not found"}
          </p>
          <button
            onClick={() => router.push("/admin/organisations")}
            className="cursor-pointer btn-primary px-4 py-2 text-sm font-medium rounded-lg"
          >
            Back to Organisations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/organisations")}
              className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            {organisation.logo ? (
              <Image
                src={normalizeLogoPath(organisation.logo) || ""}
                alt={organisation.name}
                width={48}
                height={48}
                className="rounded-lg border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-700">
                {organisation.name}
              </h1>
              <p className="text-sm text-slate-500">{organisation.slug}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
              organisation.is_active
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {organisation.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 shrink-0 bg-white border-b border-slate-200">
        <div className="flex gap-1">
          {[
            { id: "overview", label: "Overview" },
            { id: "plan", label: "Plan" },
            { id: "storage", label: "Storage" },
            { id: "addons", label: "Addons" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`cursor-pointer px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Organisation Information */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Organisation Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">Name</p>
                    <p className="text-sm text-slate-700">
                      {organisation.name}
                    </p>
                  </div>
                </div>

                {organisation.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">
                        Email
                      </p>
                      <p className="text-sm text-slate-700">
                        {organisation.email}
                      </p>
                    </div>
                  </div>
                )}

                {organisation.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">
                        Phone
                      </p>
                      <p className="text-sm text-slate-700">
                        {organisation.phone}
                      </p>
                    </div>
                  </div>
                )}

                {organisation.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">
                        Address
                      </p>
                      <p className="text-sm text-slate-700">
                        {organisation.address}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">
                      Created
                    </p>
                    <p className="text-sm text-slate-700">
                      {formatDate(organisation.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner & Stats */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Overview & Statistics
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">Owner</p>
                    <p className="text-sm text-slate-700">
                      {organisation.owner_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">
                      Total Users
                    </p>
                    <p className="text-sm text-slate-700">
                      {organisation.total_users}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FolderOpen className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">
                      Total Projects
                    </p>
                    <p className="text-sm text-slate-700">
                      {organisation.total_projects}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">
                      Total Clients
                    </p>
                    <p className="text-sm text-slate-700">
                      {organisation.total_clients}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "plan" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Subscription Plan
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    Current Plan
                  </p>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold ${PLAN_COLORS[organisation.plan]}`}
                  >
                    {organisation.plan}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    Pricing
                  </p>
                  <p className="text-2xl font-bold text-slate-700">
                    {PLAN_PRICES[organisation.plan]}
                  </p>
                </div>

                {organisation.plan_expires_at && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-2">
                      Plan Expires
                    </p>
                    <p className="text-sm text-slate-700">
                      {formatDate(organisation.plan_expires_at)}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    Plan Features
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {organisation.plan === "STARTER" && (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> Up to 5
                          users
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> 5 GB
                          storage
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> Basic
                          features
                        </li>
                      </>
                    )}
                    {organisation.plan === "PLUS" && (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> Up to 20
                          users
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> 50 GB
                          storage
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> Advanced
                          features
                        </li>
                      </>
                    )}
                    {organisation.plan === "PRO" && (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> Up to 100
                          users
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> 200 GB
                          storage
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> Pro
                          features
                        </li>
                      </>
                    )}
                    {organisation.plan === "ENTERPRISE" && (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> Unlimited
                          users
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> 1 TB
                          storage
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span> All
                          features
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "storage" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Storage Usage
              </h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-500">
                      Storage Used
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {/* Estimate: assuming each file averages 2MB */}
                      {((organisation.total_files * 2) / 1024).toFixed(2)} GB /
                      {STORAGE_LIMITS[organisation.plan]} GB
                    </p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((organisation.total_files * 2) /
                            1024 /
                            STORAGE_LIMITS[organisation.plan]) *
                            100,
                          100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    Total Files
                  </p>
                  <p className="text-2xl font-bold text-slate-700">
                    {organisation.total_files}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Storage limit based on {organisation.plan} plan
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "addons" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Available Addons
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Paid extras for enhanced functionality
              </p>

              <div className="space-y-3">
                {/* Example addons - these would come from database in production */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Additional Users
                    </p>
                    <p className="text-xs text-slate-500">
                      Add more users beyond plan limit
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    Not Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      AI Integration
                    </p>
                    <p className="text-xs text-slate-500">
                      Advanced AI-powered features
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    Not Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      WhatsApp Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      Real-time notifications via WhatsApp
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    Not Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Extra Storage
                    </p>
                    <p className="text-xs text-slate-500">
                      Additional storage capacity
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    Not Active
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Total Addon Cost
                  </p>
                  <p className="text-lg font-bold text-slate-700">$0/mo</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
