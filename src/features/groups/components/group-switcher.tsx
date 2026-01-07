"use client";

import Link from "next/link";
import { Check, ChevronDown, Settings, Users, LogOut, Shield, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { NavActionPill } from "@/components/shared/NavActionPill";

import { useCurrentGroup, useGroupsList, useSetCurrentGroup, useLeaveGroup } from "../hooks";
import type { GroupRole } from "../types";

// Role badge component
function RoleBadge({ role }: { role: GroupRole }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={cn(
        "ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase",
        isAdmin
          ? "bg-amber-500/20 text-amber-400"
          : "bg-blue-500/20 text-blue-400"
      )}
    >
      {isAdmin ? <Shield className="inline h-2.5 w-2.5 mr-0.5" /> : <User className="inline h-2.5 w-2.5 mr-0.5" />}
      {role}
    </span>
  );
}

export function GroupSwitcher() {
  const { data: currentGroupData, isLoading: isCurrentLoading } = useCurrentGroup();
  const { data: groupsList, isLoading: isListLoading } = useGroupsList();
  const { mutate: setCurrentGroup, isPending } = useSetCurrentGroup();
  const { mutate: leaveGroup, isPending: isLeaving } = useLeaveGroup();

  const isLoading = isCurrentLoading || isListLoading;

  // Dedupe groups by id (in case of duplicate memberships)
  const uniqueGroups = groupsList
    ? [...new Map(groupsList.map((g) => [g.id, g])).values()]
    : [];

  const hasMultipleGroups = uniqueGroups.length > 1;
  const currentGroupName = currentGroupData?.group?.name ?? "Sin grupo";
  const currentGroupId = currentGroupData?.group?.id;
  const currentRole = currentGroupData?.role;

  // Find current group's role from list (fallback)
  const currentGroupFromList = uniqueGroups.find((g) => g.id === currentGroupId);
  const displayRole = currentRole ?? currentGroupFromList?.role;

  const handleSelectGroup = (groupId: string) => {
    if (groupId !== currentGroupId && !isPending) {
      setCurrentGroup(groupId);
    }
  };

  const handleLeaveGroup = () => {
    if (!currentGroupId || isLeaving) return;

    // Only allow leaving if not the only admin or if multiple groups exist
    if (displayRole === "admin" && uniqueGroups.length === 1) {
      alert("No puedes abandonar tu único grupo siendo administrador. Transfiere el rol primero.");
      return;
    }

    if (confirm(`¿Seguro que quieres abandonar "${currentGroupName}"?`)) {
      leaveGroup({ groupId: currentGroupId });
    }
  };

  // Single group: show dropdown with manage and leave options
  if (!hasMultipleGroups) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <NavActionPill className="hidden md:flex gap-1.5 px-3 text-xs text-muted-foreground justify-start">
            <Users className="h-3 w-3 shrink-0" />
            {isLoading ? (
              <span className="h-3 w-12 animate-pulse rounded bg-white/10" />
            ) : (
              <>
                <span className="max-w-24 truncate">{currentGroupName}</span>
                {displayRole && <RoleBadge role={displayRole} />}
              </>
            )}
            <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
          </NavActionPill>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-45">
          <DropdownMenuItem asChild>
            <Link href="/settings/group" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Gestionar grupo
            </Link>
          </DropdownMenuItem>
          {displayRole !== "admin" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLeaveGroup}
                disabled={isLeaving}
                className="flex items-center gap-2 text-red-400 focus:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                {isLeaving ? "Saliendo..." : "Abandonar grupo"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Multiple groups: show dropdown with groups list + manage option
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <NavActionPill
          className={cn(
            "hidden md:flex gap-1.5 px-3 text-xs text-muted-foreground justify-start",
            (isPending || isLeaving) && "opacity-50 pointer-events-none"
          )}
          disabled={isPending || isLeaving}
        >
          <Users className="h-3 w-3 shrink-0" />
          {isLoading ? (
            <span className="h-3 w-12 animate-pulse rounded bg-white/10" />
          ) : (
            <>
              <span className="max-w-24 truncate">{currentGroupName}</span>
              {displayRole && <RoleBadge role={displayRole} />}
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
        </NavActionPill>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-45">
        {uniqueGroups.map((group) => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => handleSelectGroup(group.id)}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-1">
              <span className="truncate">{group.name}</span>
              <RoleBadge role={group.role} />
            </span>
            {group.id === currentGroupId && (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/group" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gestionar grupo
          </Link>
        </DropdownMenuItem>
        {displayRole !== "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLeaveGroup}
              disabled={isLeaving}
              className="flex items-center gap-2 text-red-400 focus:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              {isLeaving ? "Saliendo..." : "Abandonar grupo"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
