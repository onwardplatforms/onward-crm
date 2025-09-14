"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, BarChart3, Shield } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function LandingPage() {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Onward CRM"
                width={32}
                height={32}
                className="dark:invert"
              />
              <div>
                <div className="text-xl font-semibold">Onward CRM</div>
                <div className="text-xs text-muted-foreground">by Onward Platforms</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {session ? (
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/signin">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center space-y-6 pb-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
            The Open Source CRM
            <br />
            for Startups
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, powerful, and free forever. Build better customer relationships without the enterprise complexity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg">
                  Go to Dashboard
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg">
                  Get Started Free
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link
              href="https://github.com/onwardplatforms/onward-crm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                <Image
                  src="/github.svg"
                  alt="GitHub"
                  width={20}
                  height={20}
                  className="mr-2 dark:invert"
                />
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 py-16 border-t">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Contact Management</h3>
            <p className="text-sm text-muted-foreground">
              Keep track of customers, leads, and all your interactions in one place.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Deal Pipeline</h3>
            <p className="text-sm text-muted-foreground">
              Visualize and manage your sales pipeline from lead to close.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Your Data, Your Control</h3>
            <p className="text-sm text-muted-foreground">
              Self-host or use our cloud. Open source means no vendor lock-in.
            </p>
          </div>
        </div>

        {/* Open Source */}
        <div className="text-center py-16 border-t space-y-4">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Open Source
          </p>
          <p className="text-lg">
            MIT Licensed • Free Forever • Community Driven
          </p>
          <Link
            href="https://github.com/onwardplatforms/onward-crm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button variant="ghost" size="sm">
              Star us on GitHub →
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}