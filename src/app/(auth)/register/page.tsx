"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, User, Mail, Key, AlignLeft, AlertCircle } from "lucide-react";
import { registerUser } from "@/lib/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await registerUser(formData);

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[480px] w-full mx-auto my-8 flex flex-col space-y-4 select-text">
      {/* breadcrumb */}
      <div className="bg-[#e6eff6] dark:bg-[#1f2c39] border border-[#a1b7cd] dark:border-slate-800 rounded p-2 text-xs text-slate-600 dark:text-slate-400">
        <Link href="/" className="font-bold text-[#105289] dark:text-[#4a90e2] hover:underline">
          Board Index
        </Link>
        <span className="mx-2">&raquo;</span>
        <span>Registration</span>
      </div>

      {/* Main panel */}
      <div className="board-container rounded overflow-hidden">
        <div className="glossy-header text-xs py-1.5 flex items-center">
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Create a New Forum Account
        </div>
        
        {success ? (
          <div className="p-8 text-center bg-white dark:bg-[#1b2631] space-y-2 text-xs">
            <div className="font-bold text-green-600 dark:text-green-400 text-sm">
              Account created successfully!
            </div>
            <p className="text-slate-500">
              You will be redirected to the login portal in a few seconds...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-[#1b2631] space-y-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 pb-1.5 border-b border-dashed border-slate-200 dark:border-slate-800">
              Please enter your details below to register a profile on the board index. Username can only contain alphanumeric characters and underscores.
            </div>

            {/* Username */}
            <div className="flex flex-col space-y-1 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-[#105289]" /> Username: <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                name="username"
                className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] w-full shadow-inner"
                placeholder="e.g. MySpaceFan_99"
                required
              />
            </div>

            {/* Email */}
            <div className="flex flex-col space-y-1 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1 text-[#105289]" /> Email Address: <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] w-full shadow-inner"
                placeholder="e.g. fan99@retrolink.net"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col space-y-1 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center">
                <Key className="w-3.5 h-3.5 mr-1 text-[#105289]" /> Password: <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="password"
                name="password"
                className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] w-full shadow-inner"
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            {/* Bio */}
            <div className="flex flex-col space-y-1 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center">
                <AlignLeft className="w-3.5 h-3.5 mr-1 text-[#105289]" /> Custom Bio / Signature:
              </label>
              <textarea
                name="bio"
                className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] w-full h-16 shadow-inner"
                placeholder="Introduce yourself or leave a forum signature description..."
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
              <Link href="/login" className="text-xs text-[#105289] dark:text-[#4a90e2] hover:underline font-bold">
                Already have an account?
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="retro-btn-green py-1.5 px-4 cursor-pointer"
              >
                {loading ? "Registering..." : "Submit Registration"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
