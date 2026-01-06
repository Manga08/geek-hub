"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  profileKeys,
  fetchProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} from "./queries";
import type { UserProfile, UpdateProfileDTO } from "./types";

// =========================
// Profile Hooks
// =========================

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: profileKeys.current(),
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfileDTO>({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.current(), data);
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, File>({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.current(), data);
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, void>({
    mutationFn: deleteAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.current(), data);
    },
  });
}
