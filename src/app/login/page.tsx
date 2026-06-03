"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/onboarding";
  const [error, setError] = useState<string | null>(null);

  // If the owner hasn't wired Supabase yet, don't block anyone — just continue.
  if (!isSupabaseConfigured) {
    return (
      <Shell>
        <p className="text-slate-600 text-center">
          Sign-in isn&apos;t set up yet. You can continue to the planner for now.
        </p>
        <button onClick={() => router.push(next)} className="btn-primary w-full">
          Continue
        </button>
      </Shell>
    );
  }

  const signInWithGoogle = async () => {
    setError(null);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError(error.message);
  };

  return (
    <Shell>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
      )}

      <button
        onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white hover:bg-slate-50 px-5 py-4 text-lg font-semibold text-slate-800 transition-colors"
      >
        <GoogleIcon /> Continue with Google
      </button>

      <p className="text-center text-xs text-slate-400">
        We only use this to save your plan. No spam, ever.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-5">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-light text-primary mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to Retirement360</h1>
          <p className="text-slate-500 text-sm mt-1">Create your free plan in 5 minutes.</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-500">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
