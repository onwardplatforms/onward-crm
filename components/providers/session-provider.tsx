"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession as useBetterAuthSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useBetterAuthSession();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    } else {
      setUser(null);
    }
  }, [session]);

  // Don't redirect here - let middleware handle it
  // This avoids conflicts and infinite loops

  return (
    <SessionContext.Provider value={{ user, loading: isPending }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};