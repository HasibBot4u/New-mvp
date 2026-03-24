import { useState } from "react";
import { signInWithGoogle } from "../../services/firebase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Successfully logged in!");
    } catch (error: any) {
      toast.error(error.message || "Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-center text-[var(--color-text)] mb-2">
        Welcome Back
      </h1>
      <p className="text-center text-[var(--color-text-muted)] mb-8">
        Login to Apar's Classroom
      </p>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Input
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          disabled
        />
        <Input
          type="password"
          label="Password"
          placeholder="Enter your password"
          disabled
        />
        
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
            <span className="text-[var(--color-text-muted)]">Remember me</span>
          </label>
          <a href="#" className="text-[var(--color-primary-light)] hover:underline">
            Forgot Password?
          </a>
        </div>

        <Button type="button" className="w-full" disabled>
          Login with Email (Disabled for Demo)
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-4">
        <div className="h-px bg-[var(--color-border)] flex-1" />
        <span className="text-sm text-[var(--color-text-muted)]">OR</span>
        <div className="h-px bg-[var(--color-border)] flex-1" />
      </div>

      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
          loading={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
        Don't have an account?{" "}
        <a href="#" className="text-[var(--color-primary-light)] hover:underline font-medium">
          Register
        </a>
      </p>
    </div>
  );
}
