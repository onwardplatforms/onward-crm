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
            A CRM Built by Developers
            <br />
            for Startup Product Companies
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            At Onward, we build great engineering products. We had a problem. We wanted a free and simple CRM
            that could help us track and convert customers without all the cost or feature bloat.
          </p>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            So we created this. An always free, community driven, startup focused CRM that helps you
            focus on what matters. Your users.
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
            <h3 className="text-lg font-semibold">Manage Your Team</h3>
            <p className="text-sm text-muted-foreground">
              Create workspaces, invite team members, and collaborate on deals together.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Track Everything</h3>
            <p className="text-sm text-muted-foreground">
              Contacts, companies, opportunities, and activities all in one simple interface.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Own Your Data</h3>
            <p className="text-sm text-muted-foreground">
              MIT licensed. Self-host it, fork it, contribute to it. Your data stays yours.
            </p>
          </div>
        </div>

        {/* Community */}
        <div className="py-16 border-t space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Help Us Make It Better</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              This is a community project. Your feedback and contributions make Onward CRM better for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link
              href="https://github.com/onwardplatforms/onward-crm/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="border rounded-lg p-6 hover:border-primary transition-colors">
                <h3 className="font-semibold mb-2">Report Issues</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Found a bug? Have a feature request? Let us know on GitHub.
                </p>
                <span className="text-sm text-primary group-hover:underline">
                  Open an issue →
                </span>
              </div>
            </Link>

            <Link
              href="https://github.com/onwardplatforms/onward-crm/pulls"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="border rounded-lg p-6 hover:border-primary transition-colors">
                <h3 className="font-semibold mb-2">Contribute Code</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Want to add a feature or fix something? PRs are always welcome.
                </p>
                <span className="text-sm text-primary group-hover:underline">
                  Submit a pull request →
                </span>
              </div>
            </Link>
          </div>

          <div className="text-center pt-8">
            <p className="text-sm text-muted-foreground mb-4">
              MIT Licensed • Free Forever • Built by the Community
            </p>
            <Link
              href="https://github.com/onwardplatforms/onward-crm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <Image
                  src="/github.svg"
                  alt="GitHub"
                  width={16}
                  height={16}
                  className="mr-2 dark:invert"
                />
                Star us on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}