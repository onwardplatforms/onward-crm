"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  image?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/get-session");
        if (response.ok) {
          const session = await response.json();
          if (session?.user) {
            setUser(session.user);
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return { user, loading };
}