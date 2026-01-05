"use client";

import { useState } from "react";
import { Check, Copy, Link2, Settings, Shield, User, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useCurrentGroup, useGroupMembers, useCreateInvite } from "../hooks";
import type { GroupRole } from "../types";

export function ManageGroupDialog() {
  const { data: currentGroup } = useCurrentGroup();
  const { data: members, isLoading: isLoadingMembers } = useGroupMembers(currentGroup?.group?.id);
  const { mutate: createInvite, isPending: isCreatingInvite } = useCreateInvite();

  const [isOpen, setIsOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteRole, setInviteRole] = useState<GroupRole>("member");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresInHours, setExpiresInHours] = useState("24");

  const isAdmin = currentGroup?.role === "admin";
  const groupId = currentGroup?.group?.id;

  const handleCreateInvite = () => {
    if (!groupId) return;

    createInvite(
      {
        groupId,
        inviteRole,
        maxUses: parseInt(maxUses) || 1,
        expiresInHours: parseInt(expiresInHours) || 24,
      },
      {
        onSuccess: (data) => {
          setInviteUrl(data.invite_url);
        },
      }
    );
  };

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setInviteUrl(null);
      setCopied(false);
    }
  };

  if (!currentGroup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm">
          <Settings className="h-4 w-4" />
          Manage group
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{currentGroup.group.name}</span>
            <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
              {currentGroup.role}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Members List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Members</h4>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-white/10 bg-white/5 p-2">
            {isLoadingMembers ? (
              <div className="flex items-center gap-2 p-2">
                <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
                <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
              </div>
            ) : (
              members?.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-sm">
                      {member.display_name || "Unknown user"}
                    </span>
                  </div>
                  <Badge
                    variant={member.role === "admin" ? "default" : "outline"}
                    className={cn(
                      "text-xs",
                      member.role === "admin" && "bg-primary/20 text-primary border-primary/30"
                    )}
                  >
                    {member.role === "admin" ? (
                      <Shield className="mr-1 h-3 w-3" />
                    ) : null}
                    {member.role}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Invite Section (Admin only) */}
        {isAdmin && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserPlus className="h-4 w-4" />
              Invite members
            </h4>

            {inviteUrl ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={inviteUrl}
                    readOnly
                    className="flex-1 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInviteUrl(null)}
                  className="w-full text-xs text-muted-foreground"
                >
                  Create another invite
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as GroupRole)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max uses</Label>
                    <Select value={maxUses} onValueChange={setMaxUses}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 use</SelectItem>
                        <SelectItem value="5">5 uses</SelectItem>
                        <SelectItem value="10">10 uses</SelectItem>
                        <SelectItem value="100">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expires in</Label>
                  <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="168">7 days</SelectItem>
                      <SelectItem value="720">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateInvite}
                  disabled={isCreatingInvite}
                  className="w-full"
                  size="sm"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  {isCreatingInvite ? "Creating..." : "Create invite link"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
