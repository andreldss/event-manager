import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.06)] sm:p-8">
        <LoginForm />
      </div>
    </main>
  );
}
