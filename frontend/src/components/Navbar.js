"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, isLoading, logout } = useAuth();

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Packr
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/browse" className="hover:underline">
            Browse
          </Link>
          {isAuthenticated && (
            <Link href="/cards/new" className="hover:underline">
              Add Card
            </Link>
          )}
          {isLoading ? null : isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.email && <span className="text-black/60 dark:text-white/60">{user.email}</span>}
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-black/10 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hover:underline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
