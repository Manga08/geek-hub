"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Link2,
  LogOut,
  MoreHorizontal,
  Shield,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useUser } from "@/features/auth";

import {
  useCurrentGroup,
  useGroupMembers,
  useCreateInvite,
  useSetMemberRole,
  useRemoveMember,
  useLeaveGroup,
  useGroupInvites,
  useRevokeInvite,
} from "../hooks";
import type { GroupRole, GroupMemberWithProfile, GroupInviteRow } from "../types";

export function ManageGroupDialog() {
  const { data: user } = useUser();
  const { data: currentGroup } = useCurrentGroup();
  const { data: members, isLoading: isLoadingMembers } = useGroupMembers(currentGroup?.group?.id);
  const { data: invites, isLoading: isLoadingInvites } = useGroupInvites(
    currentGroup?.role === "admin" ? currentGroup?.group?.id : undefined
  );
  const { mutate: createInvite, isPending: isCreatingInvite } = useCreateInvite();
  const { mutate: setMemberRole, isPending: isChangingRole } = useSetMemberRole();
  const { mutate: removeMember, isPending: isRemovingMember } = useRemoveMember();
  const { mutate: leaveGroupMutation, isPending: isLeaving } = useLeaveGroup();
  const { mutate: revokeInviteMutation, isPending: isRevoking } = useRevokeInvite();

  const [isOpen, setIsOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteRole, setInviteRole] = useState<GroupRole>("member");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresInHours, setExpiresInHours] = useState("24");

  // Confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<{
    type: "role" | "remove" | "leave" | "revoke";
    targetUser?: GroupMemberWithProfile;
    targetInvite?: GroupInviteRow;
    newRole?: GroupRole;
  } | null>(null);

  const isAdmin = currentGroup?.role === "admin";
  const groupId = currentGroup?.group?.id;
  const adminCount = members?.filter((m) => m.role === "admin").length ?? 0;

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

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangeRole = (member: GroupMemberWithProfile, newRole: GroupRole) => {
    setConfirmAction({ type: "role", targetUser: member, newRole });
  };

  const handleRemoveMember = (member: GroupMemberWithProfile) => {
    setConfirmAction({ type: "remove", targetUser: member });
  };

  const handleLeaveGroup = () => {
    setConfirmAction({ type: "leave" });
  };

  const handleRevokeInvite = (invite: GroupInviteRow) => {
    setConfirmAction({ type: "revoke", targetInvite: invite });
  };

  const executeConfirmedAction = () => {
    if (!confirmAction || !groupId) return;

    switch (confirmAction.type) {
      case "role":
        if (confirmAction.targetUser && confirmAction.newRole) {
          setMemberRole({
            groupId,
            userId: confirmAction.targetUser.user_id,
            role: confirmAction.newRole,
          });
        }
        break;
      case "remove":
        if (confirmAction.targetUser) {
          removeMember({
            groupId,
            userId: confirmAction.targetUser.user_id,
          });
        }
        break;
      case "leave":
        leaveGroupMutation(
          { groupId },
          {
            onSuccess: () => {
              setIsOpen(false);
            },
          }
        );
        break;
      case "revoke":
        if (confirmAction.targetInvite) {
          revokeInviteMutation({
            inviteId: confirmAction.targetInvite.id,
            groupId,
          });
        }
        break;
    }
    setConfirmAction(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setInviteUrl(null);
      setCopied(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isInviteActive = (invite: GroupInviteRow) => {
    if (invite.revoked) return false;
    if (invite.uses_count >= invite.max_uses) return false;
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return false;
    return true;
  };

  if (!currentGroup) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm">
            <User className="h-4 w-4" />
            Manage group
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
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

          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Members</TabsTrigger>
              {isAdmin && <TabsTrigger value="invites">Invites</TabsTrigger>}
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4">
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-white/10 bg-white/5 p-2">
                {isLoadingMembers ? (
                  <div className="flex items-center gap-2 p-2">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
                    <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                  </div>
                ) : (
                  members?.map((member) => {
                    const isCurrentUser = member.user_id === user?.id;
                    const isLastAdmin = member.role === "admin" && adminCount <= 1;

                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between rounded-md p-2 hover:bg-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {member.display_name || "Unknown user"}
                              {isCurrentUser && (
                                <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={member.role === "admin" ? "default" : "outline"}
                            className={cn(
                              "text-xs",
                              member.role === "admin" && "bg-primary/20 text-primary border-primary/30"
                            )}
                          >
                            {member.role === "admin" && <Shield className="mr-1 h-3 w-3" />}
                            {member.role}
                          </Badge>

                          {isAdmin && !isCurrentUser && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {member.role === "member" ? (
                                  <DropdownMenuItem
                                    onClick={() => handleChangeRole(member, "admin")}
                                    disabled={isChangingRole}
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    Make admin
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleChangeRole(member, "member")}
                                    disabled={isChangingRole || isLastAdmin}
                                  >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    Remove admin
                                    {isLastAdmin && " (last admin)"}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleRemoveMember(member)}
                                  disabled={isRemovingMember || isLastAdmin}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove from group
                                  {isLastAdmin && " (last admin)"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Leave group button */}
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={handleLeaveGroup}
                disabled={isLeaving || (isAdmin && adminCount <= 1)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave group
                {isAdmin && adminCount <= 1 && " (promote another admin first)"}
              </Button>
            </TabsContent>

            {/* Invites Tab (Admin only) */}
            {isAdmin && (
              <TabsContent value="invites" className="space-y-4">
                {/* Create invite section */}
                <div className="space-y-3 border-b border-white/10 pb-4">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <UserPlus className="h-4 w-4" />
                    Create invite link
                  </h4>

                  {inviteUrl ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input value={inviteUrl} readOnly className="flex-1 text-xs" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(inviteUrl)}
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

                {/* Existing invites list */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Active invites</h4>
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-white/10 bg-white/5 p-2">
                    {isLoadingInvites ? (
                      <div className="flex items-center gap-2 p-2">
                        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                      </div>
                    ) : invites?.length === 0 ? (
                      <p className="p-2 text-center text-sm text-muted-foreground">No invites yet</p>
                    ) : (
                      invites?.map((invite) => {
                        const active = isInviteActive(invite);
                        const inviteUrlForCopy = `${window.location.origin}/join?token=${invite.token}`;

                        return (
                          <div
                            key={invite.id}
                            className={cn(
                              "flex items-center justify-between rounded-md p-2",
                              !active && "opacity-50"
                            )}
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {invite.invite_role}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {invite.uses_count}/{invite.max_uses} uses
                                </span>
                                {invite.revoked && (
                                  <Badge variant="destructive" className="text-xs">
                                    Revoked
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Expires: {formatDate(invite.expires_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {active && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleCopyLink(inviteUrlForCopy)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                              {active && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleRevokeInvite(invite)}
                                  disabled={isRevoking}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "role" && "Change member role?"}
              {confirmAction?.type === "remove" && "Remove member?"}
              {confirmAction?.type === "leave" && "Leave group?"}
              {confirmAction?.type === "revoke" && "Revoke invite?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "role" && (
                <>
                  {confirmAction.targetUser?.role === "admin" && adminCount <= 1 ? (
                    <span className="text-destructive">
                      This is the last admin. The group must have at least one admin.
                    </span>
                  ) : (
                    <>
                      Change <strong>{confirmAction.targetUser?.display_name || "this user"}</strong>&apos;s
                      role to <strong>{confirmAction.newRole}</strong>?
                    </>
                  )}
                </>
              )}
              {confirmAction?.type === "remove" && (
                <>
                  Remove <strong>{confirmAction.targetUser?.display_name || "this user"}</strong> from the
                  group? They will lose access to all shared content.
                </>
              )}
              {confirmAction?.type === "leave" && (
                <>
                  {isAdmin && adminCount <= 1 ? (
                    <span className="text-destructive">
                      You are the last admin. Promote another member to admin before leaving.
                    </span>
                  ) : (
                    <>
                      Are you sure you want to leave <strong>{currentGroup.group.name}</strong>? You will
                      lose access to all shared content.
                    </>
                  )}
                </>
              )}
              {confirmAction?.type === "revoke" && (
                <>This invite link will no longer work. Anyone who hasn&apos;t used it yet won&apos;t be able to join.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmedAction}
              disabled={
                (confirmAction?.type === "role" &&
                  confirmAction.targetUser?.role === "admin" &&
                  adminCount <= 1) ||
                (confirmAction?.type === "leave" && isAdmin && adminCount <= 1)
              }
              className={cn(
                (confirmAction?.type === "remove" ||
                  confirmAction?.type === "leave" ||
                  confirmAction?.type === "revoke") &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              {confirmAction?.type === "role" && "Change role"}
              {confirmAction?.type === "remove" && "Remove"}
              {confirmAction?.type === "leave" && "Leave"}
              {confirmAction?.type === "revoke" && "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
