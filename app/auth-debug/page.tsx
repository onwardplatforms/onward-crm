"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [cookieTestResult, setCookieTestResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/debug");
      const data = await response.json();
      setDebugInfo(data);
      console.log("[Debug Page] Debug info:", data);
    } catch (error) {
      console.error("[Debug Page] Error fetching debug info:", error);
      setDebugInfo({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testCookies = async () => {
    setLoading(true);
    try {
      console.log("[Debug Page] Testing cookie setting...");
      const response = await fetch("/api/auth/debug", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      
      // Check if cookie was set
      const cookies = document.cookie;
      console.log("[Debug Page] Document cookies after test:", cookies);
      
      setCookieTestResult({
        response: data,
        cookies: cookies,
        testCookieSet: cookies.includes("test-cookie"),
      });
    } catch (error) {
      console.error("[Debug Page] Cookie test error:", error);
      setCookieTestResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    setLoading(true);
    try {
      console.log("[Debug Page] Attempting test sign-in...");
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: "test@example.com",
          password: "testpassword",
        }),
      });
      
      console.log("[Debug Page] Sign-in response status:", response.status);
      console.log("[Debug Page] Sign-in response headers:", Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log("[Debug Page] Sign-in response data:", data);
      
      // Check cookies after sign-in attempt
      console.log("[Debug Page] Document cookies after sign-in:", document.cookie);
    } catch (error) {
      console.error("[Debug Page] Sign-in test error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Environment & Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-xs">
              {loading ? "Loading..." : JSON.stringify(debugInfo, null, 2)}
            </pre>
            <Button onClick={fetchDebugInfo} className="mt-4" disabled={loading}>
              Refresh Debug Info
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cookie Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testCookies} disabled={loading}>
              Test Cookie Setting
            </Button>
            {cookieTestResult && (
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-xs mt-4">
                {JSON.stringify(cookieTestResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign-In Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testSignIn} disabled={loading}>
              Test Sign-In Request
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Check browser console for detailed logs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Browser Cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-xs">
              {document.cookie || "No cookies set"}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}