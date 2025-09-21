"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { get, update } from "@/lib/client/query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  User, 
  Shield, 
  Bell, 
  Calendar, 
  Phone, 
  MapPin, 
  Save, 
  Key, 
  Smartphone, 
  QrCode,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Mail
} from "lucide-react";

// Profile Tab Component
const ProfileTab = ({ user, userProfile, setUserProfile, loading, onSave }) => {
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", 
    "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Colombia", "Denmark",
    "Egypt", "France", "Germany", "Greece", "India", "Indonesia", "Italy", 
    "Japan", "Mexico", "Netherlands", "New Zealand", "Norway", "Pakistan",
    "Philippines", "Poland", "Portugal", "Russia", "South Africa", "Spain",
    "Sweden", "Switzerland", "Turkey", "United Kingdom", "United States", "Other"
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={userProfile.displayName || ""}
            onChange={(e) => setUserProfile({ ...userProfile, displayName: e.target.value })}
            placeholder="Enter your display name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            value={user?.email || ""}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={userProfile.firstName || ""}
            onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
            placeholder="Enter your first name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={userProfile.lastName || ""}
            onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
            placeholder="Enter your last name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthdate">Birth Date</Label>
          <Input
            id="birthdate"
            type="date"
            value={userProfile.birthdate || ""}
            onChange={(e) => setUserProfile({ ...userProfile, birthdate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={userProfile.phone || ""}
            onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
            placeholder="Enter your phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={userProfile.country || ""} onValueChange={(value) => setUserProfile({ ...userProfile, country: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={userProfile.timezone || ""} onValueChange={(value) => setUserProfile({ ...userProfile, timezone: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select your timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC-12:00">(UTC-12:00) International Date Line West</SelectItem>
              <SelectItem value="UTC-11:00">(UTC-11:00) Coordinated Universal Time-11</SelectItem>
              <SelectItem value="UTC-10:00">(UTC-10:00) Hawaii</SelectItem>
              <SelectItem value="UTC-09:00">(UTC-09:00) Alaska</SelectItem>
              <SelectItem value="UTC-08:00">(UTC-08:00) Pacific Time (US & Canada)</SelectItem>
              <SelectItem value="UTC-07:00">(UTC-07:00) Mountain Time (US & Canada)</SelectItem>
              <SelectItem value="UTC-06:00">(UTC-06:00) Central Time (US & Canada)</SelectItem>
              <SelectItem value="UTC-05:00">(UTC-05:00) Eastern Time (US & Canada)</SelectItem>
              <SelectItem value="UTC-04:00">(UTC-04:00) Atlantic Time (Canada)</SelectItem>
              <SelectItem value="UTC-03:00">(UTC-03:00) Brasilia</SelectItem>
              <SelectItem value="UTC-02:00">(UTC-02:00) Coordinated Universal Time-02</SelectItem>
              <SelectItem value="UTC-01:00">(UTC-01:00) Azores</SelectItem>
              <SelectItem value="UTC+00:00">(UTC+00:00) Dublin, Edinburgh, Lisbon, London</SelectItem>
              <SelectItem value="UTC+01:00">(UTC+01:00) Amsterdam, Berlin, Bern, Rome</SelectItem>
              <SelectItem value="UTC+02:00">(UTC+02:00) Athens, Bucharest, Istanbul</SelectItem>
              <SelectItem value="UTC+03:00">(UTC+03:00) Kuwait, Riyadh</SelectItem>
              <SelectItem value="UTC+04:00">(UTC+04:00) Abu Dhabi, Muscat</SelectItem>
              <SelectItem value="UTC+05:00">(UTC+05:00) Islamabad, Karachi</SelectItem>
              <SelectItem value="UTC+06:00">(UTC+06:00) Astana, Dhaka</SelectItem>
              <SelectItem value="UTC+07:00">(UTC+07:00) Bangkok, Hanoi, Jakarta</SelectItem>
              <SelectItem value="UTC+08:00">(UTC+08:00) Beijing, Chongqing, Hong Kong</SelectItem>
              <SelectItem value="UTC+09:00">(UTC+09:00) Osaka, Sapporo, Tokyo</SelectItem>
              <SelectItem value="UTC+10:00">(UTC+10:00) Canberra, Melbourne, Sydney</SelectItem>
              <SelectItem value="UTC+11:00">(UTC+11:00) Magadan, Solomon Is., New Caledonia</SelectItem>
              <SelectItem value="UTC+12:00">(UTC+12:00) Auckland, Wellington</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={userProfile.bio || ""}
          onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

// Security Tab Component
const SecurityTab = ({ user, loading }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.message || "Failed to update password");
      }
    } catch (error) {
      toast.error("An error occurred while updating password");
    }
  };

  const setupTwoFactor = async () => {
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        setQrCodeUrl(result.qrCode);
        setBackupCodes(result.backupCodes);
        setQrCodeOpen(true);
      } else {
        toast.error("Failed to setup 2FA");
      }
    } catch (error) {
      toast.error("An error occurred while setting up 2FA");
    }
  };

  const verifyTwoFactor = async () => {
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      });

      const result = await response.json();

      if (result.success) {
        setTwoFactorEnabled(true);
        setQrCodeOpen(false);
        toast.success("2FA enabled successfully");
      } else {
        toast.error("Invalid verification code");
      }
    } catch (error) {
      toast.error("An error occurred while verifying 2FA");
    }
  };

  const disableTwoFactor = async () => {
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        setTwoFactorEnabled(false);
        toast.success("2FA disabled successfully");
      } else {
        toast.error("Failed to disable 2FA");
      }
    } catch (error) {
      toast.error("An error occurred while disabling 2FA");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords.current ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={handlePasswordChange} className="w-full md:w-auto">
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Authenticator App</p>
              <p className="text-sm text-muted-foreground">
                Use an authenticator app to generate verification codes
              </p>
            </div>
            <div className="flex items-center gap-2">
              {twoFactorEnabled && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Enabled
                </Badge>
              )}
              <Button
                variant={twoFactorEnabled ? "destructive" : "default"}
                onClick={twoFactorEnabled ? disableTwoFactor : setupTwoFactor}
              >
                {twoFactorEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Passkeys</p>
              <p className="text-sm text-muted-foreground">
                Use biometric authentication or security keys
              </p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog open={qrCodeOpen} onOpenChange={setQrCodeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Setup Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the verification code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCodeUrl && (
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>

            {backupCodes.length > 0 && (
              <div className="space-y-2">
                <Label>Backup Codes</Label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="text-xs">
                      {code}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setQrCodeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={verifyTwoFactor}>
                Verify & Enable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Notifications Tab Component
const NotificationsTab = ({ user, userProfile, setUserProfile, loading, onSave }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const notifications = userProfile.notifications || {
    inApp: {
      orderUpdates: true,
      promotions: true,
      security: true,
      system: true
    },
    email: {
      orderUpdates: true,
      promotions: false,
      security: true,
      system: false
    },
    sms: {
      orderUpdates: false,
      promotions: false,
      security: true,
      system: false
    }
  };

  const updateNotificationSetting = (type, category, value) => {
    const updatedNotifications = {
      ...notifications,
      [type]: {
        ...notifications[type],
        [category]: value
      }
    };

    setUserProfile({
      ...userProfile,
      notifications: updatedNotifications
    });
  };

  return (
    <div className="space-y-6">
      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            In-App Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications within the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Order Updates</p>
              <p className="text-sm text-muted-foreground">
                Notifications about your order status changes
              </p>
            </div>
            <Switch
              checked={notifications.inApp.orderUpdates}
              onCheckedChange={(value) => updateNotificationSetting('inApp', 'orderUpdates', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Promotions & Offers</p>
              <p className="text-sm text-muted-foreground">
                Special deals and promotional notifications
              </p>
            </div>
            <Switch
              checked={notifications.inApp.promotions}
              onCheckedChange={(value) => updateNotificationSetting('inApp', 'promotions', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Security Alerts</p>
              <p className="text-sm text-muted-foreground">
                Important security-related notifications
              </p>
            </div>
            <Switch
              checked={notifications.inApp.security}
              onCheckedChange={(value) => updateNotificationSetting('inApp', 'security', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">System Updates</p>
              <p className="text-sm text-muted-foreground">
                Notifications about system maintenance and updates
              </p>
            </div>
            <Switch
              checked={notifications.inApp.system}
              onCheckedChange={(value) => updateNotificationSetting('inApp', 'system', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Order Updates</p>
              <p className="text-sm text-muted-foreground">
                Email notifications about your order status changes
              </p>
            </div>
            <Switch
              checked={notifications.email.orderUpdates}
              onCheckedChange={(value) => updateNotificationSetting('email', 'orderUpdates', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Promotions & Offers</p>
              <p className="text-sm text-muted-foreground">
                Marketing emails with special deals and offers
              </p>
            </div>
            <Switch
              checked={notifications.email.promotions}
              onCheckedChange={(value) => updateNotificationSetting('email', 'promotions', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Security Alerts</p>
              <p className="text-sm text-muted-foreground">
                Important security notifications via email
              </p>
            </div>
            <Switch
              checked={notifications.email.security}
              onCheckedChange={(value) => updateNotificationSetting('email', 'security', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">System Updates</p>
              <p className="text-sm text-muted-foreground">
                System maintenance and update notifications
              </p>
            </div>
            <Switch
              checked={notifications.email.system}
              onCheckedChange={(value) => updateNotificationSetting('email', 'system', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            SMS Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications via text message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Order Updates</p>
              <p className="text-sm text-muted-foreground">
                SMS notifications about your order status changes
              </p>
            </div>
            <Switch
              checked={notifications.sms.orderUpdates}
              onCheckedChange={(value) => updateNotificationSetting('sms', 'orderUpdates', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Promotions & Offers</p>
              <p className="text-sm text-muted-foreground">
                Promotional text messages with special deals
              </p>
            </div>
            <Switch
              checked={notifications.sms.promotions}
              onCheckedChange={(value) => updateNotificationSetting('sms', 'promotions', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Security Alerts</p>
              <p className="text-sm text-muted-foreground">
                Critical security notifications via SMS
              </p>
            </div>
            <Switch
              checked={notifications.sms.security}
              onCheckedChange={(value) => updateNotificationSetting('sms', 'security', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">System Updates</p>
              <p className="text-sm text-muted-foreground">
                System maintenance notifications via SMS
              </p>
            </div>
            <Switch
              checked={notifications.sms.system}
              onCheckedChange={(value) => updateNotificationSetting('sms', 'system', value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Notification Preferences
        </Button>
      </div>
    </div>
  );
};

// Main Account Page Component
export default function AccountPage() {
  const { user, status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    displayName: "",
    firstName: "",
    lastName: "",
    birthdate: "",
    phone: "",
    country: "",
    timezone: "",
    bio: "",
    notifications: {
      inApp: {
        orderUpdates: true,
        promotions: true,
        security: true,
        system: true
      },
      email: {
        orderUpdates: true,
        promotions: false,
        security: true,
        system: false
      },
      sms: {
        orderUpdates: false,
        promotions: false,
        security: true,
        system: false
      }
    }
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await get(user.id, "users");
        
        if (response.data) {
          setUserProfile(prevState => ({
            ...prevState,
            ...response.data,
            notifications: response.data.notifications || prevState.notifications
          }));
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading" && user?.id) {
      fetchUserProfile();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [user?.id, status]);

  // Save user profile
  const handleSave = async () => {
    if (!user?.id) return;

    try {
      await update(user.id, userProfile, "users");
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    }
  };

  // Show loading skeleton while user is loading
  if (status === "loading" || !user?.id) {
    return (
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="container mx-auto p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-80px)]">
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information, security, and notification preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileTab
                  user={user}
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  loading={loading}
                  onSave={handleSave}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityTab user={user} loading={loading} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationsTab
                  user={user}
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  loading={loading}
                  onSave={handleSave}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

