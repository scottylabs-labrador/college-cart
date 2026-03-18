'use client';

import MainHeader from '@/components/main-header';
import RequireLogin from '@/components/require_login';
import { useAuth, useUser } from '@/lib/auth-client';
import { Card } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function AccountPage() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <MainHeader />
        <RequireLogin />
      </div>
    );
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'Account';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MainHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Manage account</h1>

        <Card className="p-6 mb-6 border border-slate-200 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Profile
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-slate-500">Name</dt>
              <dd className="text-base font-medium text-slate-900">{displayName}</dd>
            </div>
            {user?.email && (
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="text-base text-slate-900 break-all">{user.email}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-6 border border-slate-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#2f167a]/10 p-2 text-[#2f167a]">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Notifications</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Notification preferences (email, messages, and listing alerts) will be
                available here soon. Check back after we roll out account settings with
                your team.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
