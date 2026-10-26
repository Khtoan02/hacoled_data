"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_PASSWORD = "hacoled2026";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem("hacoled_auth", "ok");
        router.push("/admin");
      } else {
        setError("Mật khẩu không đúng. Vui lòng thử lại.");
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-mono font-bold text-xl tracking-tighter shadow mb-4">
            HL
          </div>
          <span className="font-semibold text-lg text-zinc-950 tracking-tight">
            HacoLED Data
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="Mật khẩu"
              autoFocus
              autoComplete="current-password"
              className={`w-full px-4 py-3 rounded-xl border text-sm text-zinc-900 placeholder-zinc-400 bg-white focus:outline-none focus:ring-2 transition-all ${
                error
                  ? "border-zinc-400 focus:ring-zinc-900"
                  : "border-zinc-300 focus:ring-zinc-900 focus:border-zinc-900"
              }`}
            />
            {error && (
              <p className="mt-2 text-xs text-zinc-700 font-medium">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-zinc-950 text-white font-semibold text-sm hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 mt-1"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
