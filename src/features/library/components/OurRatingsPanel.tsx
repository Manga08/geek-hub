"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Users, Star, Clock, Play, CheckCircle, XCircle, User } from "lucide-react";

// =========================
// Types
// =========================

interface MemberWithEntry {
  user_id: string;
  member_role: string;
  display_name: string | null;
  avatar_url: string | null;
  entry: {
    rating: number | null;
    status: string;
    is_favorite: boolean;
    updated_at: string;
  } | null;
}

interface ItemSummaryResponse {
  group: {
    id: string;
    name: string;
  };
  members: MemberWithEntry[];
  average_rating: number | null;
  counts: {
    planned: number;
    watching: number;
    completed: number;
    dropped: number;
  };
}

// =========================
// Query
// =========================

async function fetchItemSummary(
  type: string,
  provider: string,
  externalId: string
): Promise<ItemSummaryResponse> {
  const params = new URLSearchParams({ type, provider, externalId });
  const response = await fetch(`/api/library/item/summary?${params}`);

  if (!response.ok) {
    throw new Error("Error al cargar el resumen del grupo");
  }

  return response.json();
}

// =========================
// Status Helpers
// =========================

const STATUS_CONFIG = {
  planned: { label: "Planeado", icon: Clock, color: "text-yellow-400" },
  watching: { label: "Viendo", icon: Play, color: "text-blue-400" },
  completed: { label: "Completado", icon: CheckCircle, color: "text-green-400" },
  dropped: { label: "Abandonado", icon: XCircle, color: "text-red-400" },
} as const;

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  if (!config) return null;

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// =========================
// Component
// =========================

interface OurRatingsPanelProps {
  type: string;
  provider: string;
  externalId: string;
}

export function OurRatingsPanel({ type, provider, externalId }: OurRatingsPanelProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["item-summary", type, provider, externalId],
    queryFn: () => fetchItemSummary(type, provider, externalId),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-gray-700 rounded" />
          <div className="h-12 w-24 bg-gray-700 rounded" />
          <div className="space-y-2">
            <div className="h-10 bg-gray-700 rounded" />
            <div className="h-10 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return null; // Silently hide if error (user might not have a group)
  }

  const { members, average_rating, counts, group } = data;
  const hasAnyEntry = members.some((m) => m.entry !== null);

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-100">Nuestra puntuación</h3>
        </div>
        <span className="text-xs text-gray-500">{group.name}</span>
      </div>

      {/* Average Rating */}
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-baseline gap-2">
          {average_rating !== null ? (
            <>
              <span className="text-4xl font-bold text-primary">{average_rating}</span>
              <span className="text-lg text-gray-500">/ 10</span>
              <Star className="h-5 w-5 text-yellow-400 ml-1" />
            </>
          ) : (
            <span className="text-2xl text-gray-500">—</span>
          )}
        </div>
        {hasAnyEntry && (
          <p className="text-xs text-gray-500 mt-1">
            Basado en {members.filter((m) => m.entry?.rating !== null).length} valoraciones
          </p>
        )}
      </div>

      {/* Members List */}
      <div className="divide-y divide-white/5">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
          >
            {/* Avatar */}
            {member.avatar_url ? (
              <Image
                src={member.avatar_url}
                alt=""
                width={32}
                height={32}
                className="rounded-full shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-gray-400" />
              </div>
            )}

            {/* Name & Status */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate">
                {member.display_name ?? "Usuario"}
              </p>
              {member.entry ? (
                <StatusBadge status={member.entry.status} />
              ) : (
                <span className="text-xs text-gray-500">Sin entrada</span>
              )}
            </div>

            {/* Rating */}
            <div className="text-right">
              {member.entry?.rating != null ? (
                <span className="text-lg font-semibold text-gray-100">
                  {member.entry?.rating}
                </span>
              ) : (
                <span className="text-sm text-gray-500">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Counts */}
      {hasAnyEntry && (
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
          {(Object.entries(counts) as [keyof typeof counts, number][]).map(([status, count]) => {
            if (count === 0) return null;
            const config = STATUS_CONFIG[status];
            return (
              <span
                key={status}
                className={`inline-flex items-center gap-1 rounded-full bg-gray-800 px-2.5 py-1 text-xs ${config.color}`}
              >
                <config.icon className="h-3 w-3" />
                {count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
