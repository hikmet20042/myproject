"use client";

import { useEffect, useState, Suspense } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react";
import { signInWithOAuth, signInWithPassword } from "@/lib/auth/client";
import { normalizeInternalCallbackUrl } from "@/lib/auth/redirect";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input, Button } from "@/components/ui";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import Logo from "@/components/Logo";

function SignInContent() {
  const localePath = useLocalizedPath();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const safeCallbackUrl = normalizeInternalCallbackUrl(callbackUrl) || "/";
  const urlError = searchParams?.get("error");
  const urlMessage = searchParams?.get("message");
  const { showError, showInfo } = useGlobalFeedback();

  const resolvedUrlErrorMessage =
    urlError === "CredentialsSignin"
      ? "Yanlış e-poçt və ya şifrə"
      : urlError === "OAuthSignin"
        ? "Google ilə daxil olma xətası"
        : urlError === "Verification"
          ? "Daxil olmadan əvvəl e-poçtunu təsdiqlə"
          : urlError
            ? "Daxil olma zamanı xəta baş verdi"
            : "";

  const verificationRequired =
    error === "Daxil olmadan əvvəl e-poçtunu təsdiqlə" || urlError === "Verification";

  useEffect(() => {
    if (error) showError(error);
  }, [error, showError]);

  useEffect(() => {
    if (resolvedUrlErrorMessage) showError(resolvedUrlErrorMessage);
  }, [resolvedUrlErrorMessage, showError]);

  useEffect(() => {
    if (urlMessage) showInfo(urlMessage);
  }, [urlMessage, showInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const emailValid = /\S+@\S+\.\S+/.test(formData.email);
      if (!emailValid) {
        setError("E-poçt formatı yanlışdır");
        setLoading(false);
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setError("Şifrə ən azı 6 simvol olmalıdır");
        setLoading(false);
        return;
      }
      const result = await signInWithPassword(
        formData.email,
        formData.password,
      );

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }
    } catch (error: any) {
      // Catch any thrown errors and display them
      setError(error?.message || "Daxil olma zamanı xəta baş verdi");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signInWithOAuth(
        "google",
        `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeCallbackUrl)}`,
      );
    } catch (error: any) {
      // Catch Google OAuth errors
      setError(error?.message || "Google ilə daxil olma zamanı xəta baş verdi");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex justify-center">
            <Logo
              href={localePath("/")}
              size="md"
              variant="dark"
              showText={false}
              showTagline={false}
            />
          </div>
          <h1 className="mt-6 text-3xl font-black text-gray-900">
            {"Hesabına daxil ol"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {"icma360 ilə əlaqə qur, öyrən və inkişaf et"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {verificationRequired && (
              <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                <strong>{"E-poçt təsdiqlənməyib."}</strong>{" "}
                {"Daxil olmadan əvvəl e-poçtunu təsdiqləməlisən. "}
                <Link
                  href={localePath("/auth/verify-request")}
                  className="underline text-blue-700"
                >
                  {"Təsdiq e-poçtunu yenidən göndər"}
                </Link>
              </div>
            )}

            {/* Google Sign In */}
            <div className="mb-6">
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                fullWidth
                className="justify-center items-center"
                disabled={googleLoading || loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {"Google ilə davam et"}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {"Və ya e-poçt ilə daxil ol"}
                </span>
              </div>
            </div>

            {/* Credentials Sign In */}
            <form
              className="mt-6 space-y-5"
              onSubmit={handleCredentialsSignIn}
              autoComplete="off"
            >
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {"E-poçt ünvanı"}
                  </label>
                  <div className="mt-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={"E-poçt ünvanını daxil et"}
                      icon={Mail}
                      inputSize="md"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {"Şifrə"}
                  </label>
                  <div className="mt-1 relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={"Şifrəni daxil et"}
                      icon={Lock}
                      inputSize="md"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end mt-4">
                <Link
                  href={localePath("/auth/forgot-password")}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {"Şifrəni unutmusunuz?"}
                </Link>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  disabled={loading || !formData.email || !formData.password}
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  {loading ? "Daxil olunur..." : "Daxil ol"}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {"Hesabın yoxdur?"}{" "}
                  <Link
                    href={localePath("/auth/register")}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {"Buradan yarat"}
                  </Link>
                </p>
              </div>
            </div>

            
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Yüklənir...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
