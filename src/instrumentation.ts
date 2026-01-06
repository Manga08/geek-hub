/**
 * Next.js Instrumentation
 * Runs once when the server starts
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only hook console in development, on server side
  if (process.env.NODE_ENV === "development") {
    const { hookServerConsole } = await import("@/lib/debug/server-log");
    hookServerConsole();
  }
}
