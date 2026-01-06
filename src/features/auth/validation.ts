/**
 * Password validation helper
 * Pure function - no server actions, no supabase
 */

export function validatePassword(password: string, confirmPassword: string): string | null {
  if (!password || password.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres";
  }
  if (password !== confirmPassword) {
    return "Las contraseñas no coinciden";
  }
  return null;
}
