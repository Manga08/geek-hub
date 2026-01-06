"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { useRedeemInvite } from "@/features/groups";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { mutate: redeemInvite, isPending, isSuccess, isError, error, data } = useRedeemInvite();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (token && !hasAttempted.current) {
      hasAttempted.current = true;
      redeemInvite(token);
    }
  }, [token, redeemInvite]);

  const handleGoToLibrary = () => {
    router.push("/library");
  };

  const handleGoHome = () => {
    router.push("/search");
  };

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassCard className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h1 className="mb-2 text-xl font-semibold">Invalid Invite Link</h1>
          <p className="mb-6 text-muted-foreground">
            No invite token was provided. Please check your invite link.
          </p>
          <Button onClick={handleGoHome}>Go to Home</Button>
        </GlassCard>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassCard className="max-w-md p-8 text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <h1 className="mb-2 text-xl font-semibold">Joining Group...</h1>
          <p className="text-muted-foreground">
            Please wait while we process your invite.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassCard className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h1 className="mb-2 text-xl font-semibold">Could Not Join Group</h1>
          <p className="mb-6 text-muted-foreground">
            {error?.message || "The invite link may be expired, revoked, or already used."}
          </p>
          <Button onClick={handleGoHome}>Go to Home</Button>
        </GlassCard>
      </div>
    );
  }

  if (isSuccess && data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassCard className="max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h1 className="mb-2 text-xl font-semibold">Welcome to the Group!</h1>
          <p className="mb-2 text-muted-foreground">
            You have joined <span className="font-medium text-foreground">{data.group.name}</span>
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Your role: <span className="font-medium capitalize">{data.role}</span>
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleGoHome}>
              Go to Search
            </Button>
            <Button onClick={handleGoToLibrary}>
              <UserPlus className="mr-2 h-4 w-4" />
              View Library
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return null;
}
