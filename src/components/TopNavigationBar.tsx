'use client';

import React from 'react';
import Link from 'next/link';
import { LogOut, Calendar, User as UserIcon, Shield, Briefcase, ArrowLeft } from 'lucide-react';
import { logoutAction } from '@/app/actions';

interface TopNavigationBarProps {
  userName?: string;
  role?: 'admin' | 'staff';
  currentModule?: string;
  showBackToDashboard?: boolean;
}

export default function TopNavigationBar({
  userName = 'User',
  role = 'staff',
  currentModule,
  showBackToDashboard = false,
}: TopNavigationBarProps) {
  // Format current date cleanly
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 w-full bg-canvas/95 backdrop-blur-sm border-b border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Section: Brand & Breadcrumb */}
        <div className="flex items-center space-x-4">
          {showBackToDashboard ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-wider text-muted hover:text-ink px-2.5 py-1.5 rounded-md border border-hairline hover:bg-surface-soft transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          ) : null}

          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            {/* Minimalist Geometric Mark inspired by DESIGN.md (Anthropic 4-radial spike) */}
            <div className="w-7 h-7 rounded-md bg-surface-dark flex items-center justify-center text-canvas font-mono font-bold text-xs group-hover:bg-primary transition-colors">
              SN
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-normal tracking-tight text-ink group-hover:text-primary transition-colors">
                Smart Note
              </span>
              {currentModule && (
                <span className="text-xs text-muted font-sans font-medium -mt-1 hidden sm:inline">
                  / {currentModule}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Right Section: Date, User & Role, Logout */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* Current Date */}
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-muted font-medium bg-surface-soft px-3 py-1.5 rounded-md border border-hairline-soft">
            <Calendar className="w-3.5 h-3.5 text-muted-soft" />
            <span>{todayFormatted}</span>
          </div>

          {/* User & Role Badge */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-surface-card border border-hairline flex items-center justify-center text-ink text-xs font-medium">
              <UserIcon className="w-4 h-4 text-muted" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-ink leading-tight">{userName}</span>
              <div className="flex items-center space-x-1">
                {role === 'admin' ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded-pill border border-primary/20">
                    <Shield className="w-2.5 h-2.5" />
                    <span>Admin</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-muted uppercase tracking-wider bg-surface-card px-1.5 py-0.5 rounded-pill border border-hairline">
                    <Briefcase className="w-2.5 h-2.5" />
                    <span>Staff</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-hairline hidden sm:block" />

          {/* Logout Action */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-muted hover:text-semantic-error px-3 py-1.5 rounded-md border border-hairline hover:border-semantic-error/30 hover:bg-surface-soft transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
