import RegisterForm from "@/components/register-form";

export default function Register() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="bg-foreground p-8 rounded-lg shadow-md w-full max-w-md">
                <RegisterForm />
            </div>
        </div>
    )
}