"use client";

import { Check, ChevronDown, Users } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useCurrentGroup, useGroupsList, useSetCurrentGroup } from "../hooks";
import { ManageGroupDialog } from "./manage-group-dialog";

export function GroupSwitcher() {
  const { data: currentGroupData, isLoading: isCurrentLoading } = useCurrentGroup();
  const { data: groupsList, isLoading: isListLoading } = useGroupsList();
  const { mutate: setCurrentGroup, isPending } = useSetCurrentGroup();

  const isLoading = isCurrentLoading || isListLoading;
  const hasMultipleGroups = (groupsList?.length ?? 0) > 1;
  const currentGroupName = currentGroupData?.group?.name ?? "Sin grupo";
  const currentGroupId = currentGroupData?.group?.id;

  const handleSelectGroup = (groupId: string) => {
    if (groupId !== currentGroupId && !isPending) {
      setCurrentGroup(groupId);
    }
  };

  // Single group: show dropdown with manage option only
  if (!hasMultipleGroups) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="hidden items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 md:flex">
            <Users className="h-3 w-3" />
            {isLoading ? (
              <span className="h-3 w-12 animate-pulse rounded bg-white/10" />
            ) : (
              <span className="max-w-25 truncate">{currentGroupName}</span>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-45">
          <ManageGroupDialog />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Multiple groups: show dropdown with groups list + manage option
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "hidden items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 md:flex",
            isPending && "opacity-50 pointer-events-none"
          )}
          disabled={isPending}
        >
          <Users className="h-3 w-3" />
          {isLoading ? (
            <span className="h-3 w-12 animate-pulse rounded bg-white/10" />
          ) : (
            <span className="max-w-25 truncate">{currentGroupName}</span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-45">
        {groupsList?.map((group) => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => handleSelectGroup(group.id)}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">{group.name}</span>
            {group.id === currentGroupId && (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <ManageGroupDialog />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
