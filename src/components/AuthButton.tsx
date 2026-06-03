"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthButton({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(!!session?.user)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Hide entirely until Supabase is configured, or while we don't know the state.
  if (!isSupabaseConfigured || signedIn === null) return null;

  const base = mobile
    ? "px-4 py-3 rounded-xl text-lg font-medium inline-flex items-center gap-2 text-slate-700 hover:bg-slate-50"
    : "btn-ghost inline-flex items-center gap-1.5";

  if (!signedIn) {
    return (
      <Link href="/login" className={base}>
        <LogIn className="w-4 h-4 text-primary" /> Sign in
      </Link>
    );
  }

  const doSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setConfirming(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setConfirming(true)} className={base}>
        <LogOut className="w-4 h-4 text-primary" /> Sign out
      </button>

      {confirming &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 animate-fade-in"
            onClick={() => setConfirming(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-900 mb-1">Sign out?</h3>
              <p className="text-slate-600 text-sm mb-5">
                Are you sure you want to sign out of Retirement360?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-xl border-2 border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={doSignOut}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 font-semibold text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
