"use client";

import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleUserChange = useCallback((newUser: User | null) => {
    setUser(newUser);
  }, []);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const supabase = createSupabaseBrowserClient();
    
    if (!supabase) {
      handleLoadingChange(false);
      return;
    }

    // Get initial user
    const fetchUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (isMounted) {
          handleUserChange(data.user);
          handleLoadingChange(false);
        }
      } catch {
        if (isMounted) {
          handleLoadingChange(false);
        }
      }
    };

    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        handleUserChange(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleUserChange, handleLoadingChange]);

  return { data: user, isLoading };
}
