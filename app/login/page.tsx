"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Zap, UserCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Hard navigation ensures fresh session cookies are sent directly to the server
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleInstantDemoLogin = async () => {
    setEmail("alex@tokenguard.io");
    setPassword("Password123!");
    await performLogin("alex@tokenguard.io", "Password123!");
  };

  const handleFillDemo = () => {
    setEmail("alex@tokenguard.io");
    setPassword("Password123!");
    setError(null);
  };

  return (
    <Card className="border border-cyan-500/20 bg-[#0d1322]/90 backdrop-blur-xl shadow-[0_0_35px_rgba(0,0,0,0.7)]">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold text-white">Operator Sign In</CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Provide credentials to access your TokenGuard security console.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Instant Demo Login Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 font-mono">
                <Zap className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span>DEMO ENVIRONMENT ACCESS</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                1-CLICK READY
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Sign in as <span className="text-cyan-300 font-semibold">alex@tokenguard.io</span> (Lead Security Operator).
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="cyber"
                size="sm"
                onClick={handleInstantDemoLogin}
                isLoading={isLoading}
                className="w-full text-xs font-bold"
              >
                <UserCheck className="h-3.5 w-3.5 mr-1" />
                Instant Demo Sign-In
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleFillDemo}
                className="text-xs whitespace-nowrap"
              >
                Fill Form
              </Button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-mono uppercase">Or Enter Manually</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <Input
              type="email"
              placeholder="alex@tokenguard.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Password</label>
            </div>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />
          </div>

          <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <Shield className="h-3 w-3" />
              <span>Active Session Protection</span>
            </div>
            <p>Telemetry fingerprinting, impossible-travel checks, and single-use token rotation are active.</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button type="submit" variant="cyber" className="w-full" isLoading={isLoading}>
            Authenticate Session
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>

          <div className="text-center text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-cyan-400 hover:underline font-semibold">
              Register here
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#060913] cyber-grid flex items-center justify-center p-4 selection:bg-cyan-500/30 selection:text-cyan-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:scale-105 transition-all">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="font-bold text-xl text-white tracking-wide">
              Token<span className="text-cyan-400">Guard</span>
            </span>
          </Link>
          <p className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Secure Authentication Portal
          </p>
        </div>

        <Suspense fallback={
          <div className="p-8 text-center text-slate-400 font-mono text-xs">
            Loading authentication portal...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
