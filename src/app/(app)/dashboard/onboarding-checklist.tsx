"use client";

import Link from "next/link";
import { CheckCircle2, User, Users, Library, ListChecks, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface OnboardingData {
  hasDisplayName: boolean;
  hasAvatar: boolean;
  memberCount: number;
  libraryCount: number;
  listsCount: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  isComplete: boolean;
}

const DISMISSED_KEY = "geek-hub-onboarding-dismissed";

export function OnboardingChecklist({ data }: { data: OnboardingData }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(DISMISSED_KEY) === "true";
  });

  const items: ChecklistItem[] = [
    {
      id: "profile",
      label: "Completa tu perfil",
      description: "Añade tu nombre y avatar",
      href: "/settings/profile",
      icon: User,
      isComplete: data.hasDisplayName && data.hasAvatar,
    },
    {
      id: "group",
      label: "Invita a alguien",
      description: "Comparte tu grupo con amigos",
      href: "/settings/group",
      icon: Users,
      isComplete: data.memberCount > 1,
    },
    {
      id: "library",
      label: "Añade 3 items",
      description: "Busca y guarda tu contenido",
      href: "/search",
      icon: Library,
      isComplete: data.libraryCount >= 3,
    },
    {
      id: "list",
      label: "Crea una lista",
      description: "Organiza tu contenido favorito",
      href: "/lists",
      icon: ListChecks,
      isComplete: data.listsCount >= 1,
    },
  ];

  const completedCount = items.filter((item) => item.isComplete).length;
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;
  const allComplete = completedCount === totalCount;

  // Don't show if dismissed or all complete
  if (dismissed || allComplete) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  return (
    <Card className="bg-linear-to-br from-primary/10 via-white/5 to-white/5 border-primary/20">
      <CardHeader className="pb-2 flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">¡Completa tu configuración!</CardTitle>
          <p className="text-sm text-muted-foreground">
            {completedCount} de {totalCount} pasos completados
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/10"
          aria-label="Cerrar checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />

        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-lg p-3 transition-colors
                  ${
                    item.isComplete
                      ? "bg-white/5 opacity-60"
                      : "bg-white/5 hover:bg-white/10"
                  }
                `}
              >
                <div
                  className={`
                    shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${item.isComplete ? "bg-emerald-500/20" : "bg-white/10"}
                  `}
                >
                  {item.isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      item.isComplete
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
                {!item.isComplete && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
