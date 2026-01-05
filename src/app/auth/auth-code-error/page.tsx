export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">No se pudo completar el inicio de sesión</h1>
        <p className="text-sm text-zinc-600">
          El enlace de autenticación no es válido o expiró. Vuelve a intentar desde la aplicación
          solicitando un nuevo correo de confirmación o inicia sesión nuevamente.
        </p>
      </div>
    </div>
  );
}
