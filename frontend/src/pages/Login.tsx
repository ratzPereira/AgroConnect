export function Login() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-neutral-50">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-8 w-full max-w-md">
        <img
          src="/logotipo.png"
          alt="AgroConnect"
          className="h-16 mx-auto mb-6"
        />
        <h1 className="text-xl font-semibold text-neutral-800 text-center mb-6">
          Entrar
        </h1>
        <p className="text-sm text-neutral-500 text-center">
          Autenticação será implementada no Sprint 1
        </p>
      </div>
    </div>
  );
}
