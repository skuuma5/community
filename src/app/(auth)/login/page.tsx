"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Key, User, AlertCircle, ShieldAlert } from "lucide-react";

function LoginForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  // Read error parameter from URL if any
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "CredentialsSignin") {
      setError("Incorrect username/email or password.");
    } else if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError("Please enter both fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        usernameOrEmail: usernameOrEmail.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || "Failed to log in.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[450px] w-full mx-auto my-12 flex flex-col space-y-4 select-text">
      {/* breadcrumb */}
      <div className="bg-[#e6eff6] dark:bg-[#1f2c39] border border-[#a1b7cd] dark:border-slate-800 rounded p-2 text-xs text-slate-600 dark:text-slate-400">
        <Link href="/" className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
          Board Index
        </Link>
        <span className="mx-2">&raquo;</span>
        <span>Login Portal</span>
      </div>

      {/* Main panel */}
      <div className="board-container rounded overflow-hidden">
        <div className="glossy-header text-xs py-1.5 flex items-center">
          <Key className="w-3.5 h-3.5 mr-1" /> Log in to your Board Account
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-[#1b2631] space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 pb-1.5 border-b border-dashed border-slate-200 dark:border-slate-800">
            Please enter your registered username or email address and password to authenticate.
          </div>

          {/* Username */}
          <div className="flex flex-col space-y-1 text-xs">
            <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-[#105289]" /> Username or Email:
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] w-full shadow-inner"
              placeholder="e.g. ModeratorBob"
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-1 text-xs">
            <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center">
              <Key className="w-3.5 h-3.5 mr-1 text-[#105289]" /> Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] w-full shadow-inner"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-center space-x-1.5 text-xs text-red-600 font-bold bg-red-50 dark:bg-[#2a1b1b] border border-red-200 dark:border-red-950 p-2 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between pt-1">
            <Link href="/register" className="text-xs text-[#105289] dark:text-[#4a90e2] hover:underline font-bold">
              Register a new account
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="retro-btn py-1.5 px-4 cursor-pointer"
            >
              {loading ? "Authenticating..." : "Log In"}
            </button>
          </div>
        </form>
      </div>

      {/* Demo helper */}
      <div className="board-container rounded bg-amber-50 dark:bg-[#1f2324] border-amber-300 dark:border-amber-950 p-3.5 text-xs leading-relaxed space-y-2">
        <h4 className="font-bold text-amber-800 dark:text-amber-400 flex items-center">
          <ShieldAlert className="w-4 h-4 mr-1 text-amber-600" /> Seeding Demo Accounts (Test Logs):
        </h4>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          You can use any of the seeded forum accounts to instantly test Retrolink. Password for all: <strong className="text-amber-700 dark:text-amber-300 font-mono">password123</strong>
        </p>
        <ul className="list-disc pl-5 text-[11px] space-y-1 text-slate-600 dark:text-slate-400 font-mono">
          <li><strong>ModeratorBob</strong> (Site Admin, 250 rep)</li>
          <li><strong>CSS_Wizard_2010</strong> (Web Dev, 180 rep)</li>
          <li><strong>WinampLover</strong> (Tech Mod, 95 rep)</li>
          <li><strong>xX_TrollFace_Xx</strong> (Troll account, -15 rep)</li>
        </ul>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[450px] w-full mx-auto my-12 text-center text-xs text-slate-500">
        Loading login form...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

