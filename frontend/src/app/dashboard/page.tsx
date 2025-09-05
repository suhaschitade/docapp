"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import { UserGroupIcon, CalendarDaysIcon, ChartBarIcon, HeartIcon, BeakerIcon, BellIcon } from "@heroicons/react/24/outline";
import { NotificationDropdown } from "@/components/ui/NotificationDropdown";
import { UserProfileDropdown } from "@/components/ui/UserProfileDropdown";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/");
      return;
    }
    
    // Get user data only on client side
    const userData = authService.getUser();
    setUser(userData);
    setIsLoading(false);
  }, [router]);

  // Show loading state during hydration
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50">
      <header className="flex items-center justify-between py-6 px-10 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl mb-8">
        <h1 className="text-3xl font-extrabold text-gray-700 tracking-tight" suppressHydrationWarning>
          Welcome, {user?.firstName || 'User'} {user?.lastName || ''}
        </h1>
        <div className="flex items-center space-x-4">
          <NotificationDropdown />
          <UserProfileDropdown />
        </div>
      </header>
      <main className="px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[
            { 
              title: "Patient Management", 
              link: "/manage-patients", 
              gradient: "from-blue-500 to-blue-600",
              hoverGradient: "hover:from-blue-600 hover:to-blue-700",
              icon: UserGroupIcon,
              description: "Manage patient records, medical history, and profile information."
            },
            { 
              title: "Appointment Scheduling", 
              link: "/appointments", 
              gradient: "from-purple-500 to-purple-600",
              hoverGradient: "hover:from-purple-600 hover:to-purple-700",
              icon: CalendarDaysIcon,
              description: "Schedule, view, and manage doctor appointments."
            },
            { 
              title: "Treatment Management", 
              link: "/treatments", 
              gradient: "from-pink-500 to-rose-600",
              hoverGradient: "hover:from-pink-600 hover:to-rose-700",
              icon: HeartIcon,
              description: "Manage patient treatments including chemotherapy, surgery, and radiation."
            },
            { 
              title: "Investigation Management", 
              link: "/investigations", 
              gradient: "from-teal-500 to-cyan-600",
              hoverGradient: "hover:from-teal-600 hover:to-cyan-700",
              icon: BeakerIcon,
              description: "Manage patient investigations including lab tests, imaging, and diagnostics."
            },
            { 
              title: "Reports & Analytics", 
              link: "/reports", 
              gradient: "from-green-500 to-green-600",
              hoverGradient: "hover:from-green-600 hover:to-green-700",
              icon: ChartBarIcon,
              description: "View detailed reports and analytics for better insights."
            },
            { 
              title: "Notifications", 
              link: "/notifications", 
              gradient: "from-orange-500 to-amber-600",
              hoverGradient: "hover:from-orange-600 hover:to-amber-700",
              icon: BellIcon,
              description: "View and manage all notifications, alerts, and system messages."
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden bg-gradient-to-br ${item.gradient} ${item.hoverGradient} text-white rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-2xl`}
              onClick={() => router.push(item.link)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-4">
                  <item.icon className="h-12 w-12 text-white/90" />
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-3 leading-tight">{item.title}</h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-6 flex items-center text-white/80 text-sm font-medium group-hover:text-white transition-colors duration-300">
                  <span>Explore now</span>
                  <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

