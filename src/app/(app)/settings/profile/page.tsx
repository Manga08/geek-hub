"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, Save, Trash2, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
} from "@/features/profile";

// =========================
// Avatar Upload Component
// =========================

function AvatarUpload() {
  const { data: profile } = useProfile();
  const uploadMutation = useUploadAvatar();
  const deleteMutation = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadMutation.mutateAsync(file);
    } catch {
      // Error handled by mutation
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!profile?.avatar_url) return;
    
    try {
      await deleteMutation.mutateAsync();
    } catch {
      // Error handled by mutation
    }
  };

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;
  const initials = (profile?.display_name ?? profile?.email ?? "U")[0].toUpperCase();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Preview */}
      <div className="relative">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="Avatar"
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-gray-400">
              {initials}
            </div>
          )}
        </div>

        {/* Upload Button Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50"
          title="Cambiar avatar"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Camera className="h-4 w-4 mr-2" />
          Subir foto
        </Button>

        {profile?.avatar_url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        )}
      </div>

      {/* Error Messages */}
      {uploadMutation.isError && (
        <p className="text-sm text-red-400">{uploadMutation.error.message}</p>
      )}
      {deleteMutation.isError && (
        <p className="text-sm text-red-400">{deleteMutation.error.message}</p>
      )}
    </div>
  );
}

// =========================
// Display Name Form
// =========================

function DisplayNameForm() {
  const { data: profile } = useProfile();
  const updateMutation = useUpdateProfile();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [hasChanges, setHasChanges] = useState(false);

  // Sync state when profile loads
  const currentName = profile?.display_name ?? "";
  if (!hasChanges && displayName !== currentName) {
    setDisplayName(currentName);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateMutation.mutateAsync({ display_name: displayName });
      setHasChanges(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isDirty = hasChanges && displayName !== currentName;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="display_name" className="text-sm font-medium text-gray-200">
          Nombre para mostrar
        </label>
        <Input
          id="display_name"
          value={displayName}
          onChange={handleChange}
          placeholder="Tu nombre"
          maxLength={100}
          className="max-w-sm"
        />
        <p className="text-xs text-gray-500">
          Este nombre aparecerá en la actividad del grupo y en los miembros.
        </p>
      </div>

      {/* Email (read-only) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">
          Email
        </label>
        <Input
          value={profile?.email ?? ""}
          disabled
          className="max-w-sm opacity-60"
        />
        <p className="text-xs text-gray-500">
          El email no se puede cambiar desde aquí.
        </p>
      </div>

      {/* Save Button */}
      <Button
        type="submit"
        disabled={!isDirty || updateMutation.isPending}
        className="min-w-24"
      >
        {updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </>
        )}
      </Button>

      {/* Success/Error Messages */}
      {updateMutation.isSuccess && !hasChanges && (
        <p className="text-sm text-green-400">¡Perfil actualizado!</p>
      )}
      {updateMutation.isError && (
        <p className="text-sm text-red-400">{updateMutation.error.message}</p>
      )}
    </form>
  );
}

// =========================
// Page Component
// =========================

export default function ProfileSettingsPage() {
  const { data: profile, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 mt-2">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <div className="text-center py-12">
          <p className="text-red-400">Error al cargar el perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <User className="w-6 h-6 text-cyan-400" />
          Configuración de Perfil
        </h1>
        <p className="text-gray-400 mt-1">
          Personaliza cómo te ven otros miembros del grupo
        </p>
      </header>

      {/* Avatar Section */}
      <section className="mb-8 p-6 rounded-lg border border-gray-800 bg-gray-900/50">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Foto de perfil</h2>
        <AvatarUpload />
      </section>

      {/* Profile Form Section */}
      <section className="p-6 rounded-lg border border-gray-800 bg-gray-900/50">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Información personal</h2>
        <DisplayNameForm />
      </section>
    </div>
  );
}
