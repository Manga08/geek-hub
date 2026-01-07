/**
 * Next.js Instrumentation
 * Runs once when the server starts
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only hook console and process events in development, on server side (Node.js only)
  if (process.env.NODE_ENV === "development" && process.env.NEXT_RUNTIME === "nodejs") {
    const { hookServerConsole, pushServerLog, generateErrorId } = await import("@/lib/debug/server-log");
    hookServerConsole();

    // Guard against duplicate process listeners on hot reload
    const globalAny = globalThis as typeof globalThis & { __gh_proc_hooks?: boolean };
    if (!globalAny.__gh_proc_hooks) {
      globalAny.__gh_proc_hooks = true;

      // Capture unhandled promise rejections
      process.on("unhandledRejection", (reason: unknown) => {
        const errorId = generateErrorId();
        const err = reason instanceof Error ? reason : new Error(String(reason));
        pushServerLog({
          level: "error",
          message: `[UnhandledRejection] ${err.message}`,
          stack: err.stack,
          errorId,
        });
      });

      // Capture uncaught exceptions
      process.on("uncaughtException", (err: Error) => {
        const errorId = generateErrorId();
        pushServerLog({
          level: "error",
          message: `[UncaughtException] ${err.message}`,
          stack: err.stack,
          errorId,
        });
        // Note: Don't exit process here - Next.js handles this
      });
    }
  }
}
