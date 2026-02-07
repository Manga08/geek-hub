"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Copy,
  Link2,
  Loader2,
  LogOut,
  MoreHorizontal,
  Save,
  Shield,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

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
  useUpdateGroupName,
} from "@/features/groups/hooks";
import type { GroupRole, GroupMemberWithProfile, GroupInviteRow } from "@/features/groups/types";

// =========================
// Group Name Editor
// =========================

function GroupNameEditor() {
  const { data: currentGroup } = useCurrentGroup();
  const { mutate: updateName, isPending } = useUpdateGroupName();
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = currentGroup?.role === "admin";
  const currentName = currentGroup?.group?.name ?? "";

  const handleStartEdit = () => {
    setName(currentName);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!currentGroup?.group?.id || !name.trim()) return;
    updateName(
      { groupId: currentGroup.group.id, name: name.trim() },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName("");
  };

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Users className="h-4 w-4" />
        Información del grupo
      </h3>
      
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del grupo"
            className="flex-1"
            autoFocus
          />
          <Button size="sm" onClick={handleSave} disabled={isPending || !name.trim()}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{currentName}</p>
            <p className="text-sm text-muted-foreground">
              <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
                {currentGroup?.role ?? "member"}
              </Badge>
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={handleStartEdit}>
              Editar nombre
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// =========================
// Members Section
// =========================

function MembersSection({
  onConfirmAction,
}: {
  onConfirmAction: (action: ConfirmAction) => void;
}) {
  const { data: user } = useUser();
  const { data: currentGroup } = useCurrentGroup();
  const { data: members, isLoading } = useGroupMembers(currentGroup?.group?.id);
  const { isPending: isChangingRole } = useSetMemberRole();
  const { isPending: isRemovingMember } = useRemoveMember();

  const isAdmin = currentGroup?.role === "admin";
  const adminCount = members?.filter((m) => m.role === "admin").length ?? 0;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-white/10 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
              <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <User className="h-4 w-4" />
        Miembros ({members?.length ?? 0})
      </h3>

      <div className="space-y-1">
        {members?.map((member) => {
          const isCurrentUser = member.user_id === user?.id;
          const isLastAdmin = member.role === "admin" && adminCount <= 1;
          const initials = (member.display_name ?? "U")[0].toUpperCase();

          return (
            <div
              key={member.user_id}
              className="flex items-center justify-between rounded-lg p-2 hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary overflow-hidden">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.display_name ?? "Avatar"}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">{initials}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {member.display_name ?? "Usuario"}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-muted-foreground">(tú)</span>
                    )}
                  </p>
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
                          onClick={() =>
                            onConfirmAction({ type: "role", targetUser: member, newRole: "admin" })
                          }
                          disabled={isChangingRole}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Hacer admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            onConfirmAction({ type: "role", targetUser: member, newRole: "member" })
                          }
                          disabled={isChangingRole || isLastAdmin}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Quitar admin
                          {isLastAdmin && " (último admin)"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onConfirmAction({ type: "remove", targetUser: member })}
                        disabled={isRemovingMember || isLastAdmin}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar del grupo
                        {isLastAdmin && " (último admin)"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================
// Invites Section
// =========================

function InvitesSection({
  onConfirmAction,
}: {
  onConfirmAction: (action: ConfirmAction) => void;
}) {
  const { data: currentGroup } = useCurrentGroup();
  const { data: invites, isLoading } = useGroupInvites(currentGroup?.group?.id);
  const { mutate: createInvite, isPending: isCreatingInvite } = useCreateInvite();
  const { isPending: isRevoking } = useRevokeInvite();

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

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
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

  if (!isAdmin) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <UserPlus className="h-4 w-4" />
        Invitaciones
      </h3>

      {/* Create Invite */}
      <div className="mb-4 space-y-3 border-b border-white/10 pb-4">
        {inviteUrl ? (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Enlace de invitación creado:</Label>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="flex-1 text-xs" />
              <Button size="sm" variant="outline" onClick={() => handleCopyLink(inviteUrl)}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInviteUrl(null)}
              className="w-full text-xs text-muted-foreground"
            >
              Crear otra invitación
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Rol</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as GroupRole)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Miembro</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Usos máx.</Label>
                <Select value={maxUses} onValueChange={setMaxUses}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="100">∞</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expira en</Label>
                <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1h</SelectItem>
                    <SelectItem value="24">24h</SelectItem>
                    <SelectItem value="168">7d</SelectItem>
                    <SelectItem value="720">30d</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateInvite} disabled={isCreatingInvite} className="w-full" size="sm">
              <Link2 className="mr-2 h-4 w-4" />
              {isCreatingInvite ? "Creando..." : "Crear enlace de invitación"}
            </Button>
          </div>
        )}
      </div>

      {/* Existing Invites */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Invitaciones activas</Label>
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-white/5" />
        ) : invites?.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No hay invitaciones activas</p>
        ) : (
          <div className="space-y-1">
            {invites?.map((invite) => {
              const active = isInviteActive(invite);
              const inviteUrlForCopy = `${typeof window !== "undefined" ? window.location.origin : ""}/join?token=${invite.token}`;

              return (
                <div
                  key={invite.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg p-2 bg-white/5",
                    !active && "opacity-50"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {invite.invite_role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {invite.uses_count}/{invite.max_uses} usos
                      </span>
                      {invite.revoked && (
                        <Badge variant="destructive" className="text-xs">
                          Revocada
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">Expira: {formatDate(invite.expires_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {active && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopyLink(inviteUrlForCopy)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onConfirmAction({ type: "revoke", targetInvite: invite })}
                          disabled={isRevoking}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =========================
// Leave Group Section
// =========================

function LeaveGroupSection({ onConfirmAction }: { onConfirmAction: (action: ConfirmAction) => void }) {
  const { data: currentGroup } = useCurrentGroup();
  const { data: members } = useGroupMembers(currentGroup?.group?.id);
  const { isPending: isLeaving } = useLeaveGroup();

  const isAdmin = currentGroup?.role === "admin";
  const adminCount = members?.filter((m) => m.role === "admin").length ?? 0;
  const canLeave = !isAdmin || adminCount > 1;

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-destructive">
        <LogOut className="h-4 w-4" />
        Zona de peligro
      </h3>
      <p className="mb-3 text-sm text-muted-foreground">
        Si abandonas el grupo, perderás acceso a todo el contenido compartido.
      </p>
      <Button
        variant="destructive"
        onClick={() => onConfirmAction({ type: "leave" })}
        disabled={isLeaving || !canLeave}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Abandonar grupo
        {!canLeave && " (promueve otro admin primero)"}
      </Button>
    </div>
  );
}

// =========================
// Confirmation Action Type
// =========================

type ConfirmAction = {
  type: "role" | "remove" | "leave" | "revoke";
  targetUser?: GroupMemberWithProfile;
  targetInvite?: GroupInviteRow;
  newRole?: GroupRole;
};

// =========================
// Main Page
// =========================

export default function GroupSettingsPage() {
  const { data: currentGroup, isLoading } = useCurrentGroup();
  const { data: members } = useGroupMembers(currentGroup?.group?.id);
  const { mutate: setMemberRole } = useSetMemberRole();
  const { mutate: removeMember } = useRemoveMember();
  const { mutate: leaveGroupMutation } = useLeaveGroup();
  const { mutate: revokeInviteMutation } = useRevokeInvite();

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const groupId = currentGroup?.group?.id;
  const isAdmin = currentGroup?.role === "admin";
  const adminCount = members?.filter((m) => m.role === "admin").length ?? 0;

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
        leaveGroupMutation({ groupId });
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

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-9 w-9 rounded-full bg-white/10 animate-pulse" />
            <div>
              <div className="h-7 w-56 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-72 animate-pulse rounded bg-white/10 mt-2" />
            </div>
          </div>
          {/* Group info skeleton */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 animate-pulse">
            <div className="h-4 w-40 bg-white/10 rounded mb-3" />
            <div className="h-6 w-48 bg-white/10 rounded mb-1" />
            <div className="h-5 w-16 bg-white/10 rounded" />
          </div>
          {/* Members skeleton */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 animate-pulse">
            <div className="h-5 w-28 bg-white/10 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-20 bg-white/10 rounded mt-1" />
                  </div>
                  <div className="h-8 w-20 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          </div>
          {/* Invites skeleton */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 animate-pulse">
            <div className="h-5 w-32 bg-white/10 rounded mb-4" />
            <div className="h-16 w-full bg-white/10 rounded" />
          </div>
          {/* Danger zone skeleton */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 animate-pulse">
            <div className="h-5 w-36 bg-white/10 rounded mb-3" />
            <div className="h-10 w-40 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-center text-muted-foreground">No tienes un grupo activo.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/search"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Configuración del grupo</h1>
          <p className="text-sm text-muted-foreground">Administra tu grupo y sus miembros</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <GroupNameEditor />
        <MembersSection onConfirmAction={setConfirmAction} />
        {isAdmin && <InvitesSection onConfirmAction={setConfirmAction} />}
        <LeaveGroupSection onConfirmAction={setConfirmAction} />
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "role" && "¿Cambiar rol del miembro?"}
              {confirmAction?.type === "remove" && "¿Eliminar miembro?"}
              {confirmAction?.type === "leave" && "¿Abandonar grupo?"}
              {confirmAction?.type === "revoke" && "¿Revocar invitación?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "role" && (
                <>
                  Cambiar el rol de <strong>{confirmAction.targetUser?.display_name ?? "este usuario"}</strong> a{" "}
                  <strong>{confirmAction.newRole}</strong>?
                </>
              )}
              {confirmAction?.type === "remove" && (
                <>
                  ¿Eliminar a <strong>{confirmAction.targetUser?.display_name ?? "este usuario"}</strong> del grupo?
                  Perderá acceso a todo el contenido compartido.
                </>
              )}
              {confirmAction?.type === "leave" && (
                <>
                  ¿Estás seguro de que quieres abandonar{" "}
                  <strong>{currentGroup.group.name}</strong>? Perderás acceso a todo el contenido compartido.
                </>
              )}
              {confirmAction?.type === "revoke" && (
                <>Este enlace de invitación dejará de funcionar. Quienes no lo hayan usado aún no podrán unirse.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmedAction}
              disabled={
                (confirmAction?.type === "leave" && isAdmin && adminCount <= 1) ||
                (confirmAction?.type === "role" &&
                  confirmAction.targetUser?.role === "admin" &&
                  confirmAction.newRole === "member" &&
                  adminCount <= 1)
              }
              className={cn(
                (confirmAction?.type === "remove" ||
                  confirmAction?.type === "leave" ||
                  confirmAction?.type === "revoke") &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              {confirmAction?.type === "role" && "Cambiar rol"}
              {confirmAction?.type === "remove" && "Eliminar"}
              {confirmAction?.type === "leave" && "Abandonar"}
              {confirmAction?.type === "revoke" && "Revocar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
