import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResetFormProps extends React.ComponentProps<"div"> {
  initialEmail?: string;
  initialCode?: string;
  initialToken?: string;
}

export function ResetForm({
  className,
  initialEmail = "",
  initialCode = "",
  initialToken = "",
  ...props
}: ResetFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !code || !token) {
      toast.error('Invalid reset link. Please try again.');
      router.push('/auth/forgot');
    }
  }, [email, code, token, router]);

  const showPassword = () => setShowPwd((prev) => !prev);

  const passwordValid = (pwd: string) => {
    return (
      pwd.length >= 8 &&
      pwd.length <= 32 &&
      /[a-z]/.test(pwd) &&
      /[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)
    );
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Client-side validation
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!passwordValid(newPassword)) {
      toast.error('Password must be at least 8 characters with lowercase and one uppercase or number.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/auth/api/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword,
          confirmPassword,
          code, 
          token, // Pass the encrypted code as token
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);

        // If token is expired/invalid, redirect to forgot password
        if (data.error.includes('expired') || data.error.includes('Invalid')) {
          setTimeout(() => {
            router.push('/auth/forgot');
          }, 2000);
        }
        setLoading(false);
        return;
      }

      toast.success(data.message);
      // Navigate to login page with email pre-filled
      router.push(`/auth/login?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error("Failed to update password.");
    }

    setLoading(false);
  };

  if (!email || !token) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your new password for <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPwd ? "text" : "password"}
                  disabled={loading}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  tabIndex={-1}
                  type="button"
                  onClick={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPwd ? <IoMdEyeOff size={22} /> : <IoMdEye size={22} />}
                </button>
              </div>

              {/* Password Requirements */}
              <ul className="text-sm text-gray-500 list-disc ml-6 space-y-1">
                <li className={newPassword.length >= 8 && newPassword.length <= 32 ? "text-green-600" : "text-red-500"}>
                  8–32 characters
                </li>
                <li className={/[a-z]/.test(newPassword) ? "text-green-600" : "text-red-500"}>
                  Includes lowercase letter
                </li>
                <li className={/[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) ? "text-green-600" : "text-red-500"}>
                  Includes uppercase, number, or symbol
                </li>
              </ul>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPwd ? "text" : "password"}
                  disabled={loading}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  tabIndex={-1}
                  type="button"
                  onClick={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPwd ? <IoMdEyeOff size={22} /> : <IoMdEye size={22} />}
                </button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-sm">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                loading ||
                !passwordValid(newPassword) ||
                newPassword !== confirmPassword
              }
              className="w-full"
            >
              {loading ? "Updating Password..." : "Reset Password"}
            </Button>

            <div className="text-center text-sm">
              Remember your password?{" "}
              <Link href="/auth/login" className="text-blue-500 hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
