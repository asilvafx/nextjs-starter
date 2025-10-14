import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';
import Link from 'next/link';
import Turnstile from 'react-turnstile';
import Fingerprint from '@/utils/fingerprint.js';
import { getTurnstileSiteKey } from '@/lib/client/integrations';
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

export function LoginForm({
  className,
  initialEmail = '',
  ...props
}: React.ComponentProps<"div"> & { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
  const [turnstileKey, setTurnstileKey] = useState<string | null>(null);

  const showPassword = () => setShowPwd((prev) => !prev);

  useEffect(() => {
    const fetchTurnstileKey = async () => {
      const key = await getTurnstileSiteKey();
      setTurnstileKey(key);
    };
    fetchTurnstileKey();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turnstileKey && !isTurnstileVerified) {
      toast.error('Please complete the verification.');
      return;
    }
    setLoading(true);

    try {
      const browserUnique = await Fingerprint();
      const passwordHash = btoa(password);

      const result = await signIn('credentials', {
        email,
        password: passwordHash,
        client: browserUnique,
        action: 'login',
        redirect: false
      });

      if (result?.error) {
        toast.error('Invalid credentials');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        toast.success('Login successful!');
        router.push('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed.');
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Welcome back! Please sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  disabled={loading}
                  placeholder="Enter your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    tabIndex={-1}
                    href="/auth/forgot"
                    className="ml-auto inline-block text-sm text-blue-500 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    disabled={loading}
                    placeholder="Enter your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              {turnstileKey && (
                <div className="flex justify-center">
                  <Turnstile
                    sitekey={turnstileKey}
                    theme="light"
                    size="flexible"
                    onVerify={() => setIsTurnstileVerified(true)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button 
                  type="submit"
                  disabled={loading || (!!turnstileKey && !isTurnstileVerified)}
                  className="w-full"
                >
                  {loading ? 'Please wait...' : 'Sign In'}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-blue-500 hover:underline">
                Sign Up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
