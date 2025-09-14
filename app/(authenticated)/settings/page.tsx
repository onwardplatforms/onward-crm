"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Bell, Palette } from "lucide-react";
import { toast } from "sonner";
import { formatPhoneOnChange } from "@/lib/phone";
import { useSession } from "@/components/providers/session-provider";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user } = useSession();
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name?: string;
    email: string;
    phone?: string;
    title?: string;
    password?: string;
    _count?: unknown;
  } | null>(null);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
  });
  const [notificationPreferences, setNotificationPreferences] = useState({
    activityReminders: true,
    dealUpdates: true,
  });
  const [loading, setLoading] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const fetchCurrentUser = async () => {
    if (!user?.id) {
      console.log("No user ID available", user);
      return;
    }
    
    console.log("Fetching user data for ID:", user.id);
    
    try {
      // Get the full user data including CRM-specific fields
      const response = await fetch(`/api/users/${user.id}`);
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log("User data received:", userData);
        setCurrentUser(userData);
        setProfileData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          title: userData.title || "",
        });
      } else {
        const error = await response.text();
        console.error("Failed to fetch user:", error);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const prefs = await response.json();
        setNotificationPreferences({
          activityReminders: prefs.activityReminders,
          dealUpdates: prefs.dealUpdates,
        });
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    }
  };

  const updateNotificationPreference = async (key: string, value: boolean) => {
    setSavingPreferences(true);
    try {
      const newPrefs = { ...notificationPreferences, [key]: value };
      setNotificationPreferences(newPrefs);
      
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPrefs),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }
      
      toast.success("Notification preferences updated");
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      toast.error("Failed to update preferences");
      // Revert on error
      setNotificationPreferences(prev => ({ ...prev, [key]: !value }));
    } finally {
      setSavingPreferences(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCurrentUser();
      fetchNotificationPreferences();
      // Load saved revenue targets from localStorage
      // const savedTargets = localStorage.getItem('revenueTargets');
      // if (savedTargets) {
      //   setRevenueTarget(JSON.parse(savedTargets));
      // }
    }
  }, [user]);

  const handlePasswordUpdate = async () => {
    // Password update functionality temporarily disabled
    toast.info("Password update is currently unavailable");
    return;
  };

  const handleProfileSave = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Only send the fields we want to update, not password
      const { password, _count, ...userWithoutPassword } = currentUser;
      const updateData = {
        ...userWithoutPassword,
        ...profileData,
      };
      
      console.log("Updating profile with data:", updateData);
      
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Profile update error:", error);
        throw new Error(error.error || "Failed to update profile");
      }
      
      toast.success("Profile updated successfully");
      fetchCurrentUser(); // Refresh the data
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="(555) 555-5555" 
                  value={profileData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneOnChange(e.target.value);
                    setProfileData({ ...profileData, phone: formatted });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input 
                  id="title" 
                  placeholder="Sales Manager" 
                  value={profileData.title}
                  onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                />
              </div>
              <Button onClick={handleProfileSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter your new password (min. 8 characters)"
                />
                {passwordData.newPassword && passwordData.newPassword.length < 8 && (
                  <p className="text-xs text-destructive">Password must be at least 8 characters long</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm your new password"
                />
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              <Button 
                onClick={handlePasswordUpdate} 
                disabled={updatingPassword}
              >
                {updatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified in the app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="activity-reminders" className="font-medium">
                    Activity Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified 3 days before upcoming activities
                  </p>
                </div>
                <Switch
                  id="activity-reminders"
                  checked={notificationPreferences.activityReminders}
                  onCheckedChange={(checked) => 
                    updateNotificationPreference("activityReminders", checked)
                  }
                  disabled={savingPreferences}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="deal-updates" className="font-medium">
                    Deal Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone else updates your deals
                  </p>
                </div>
                <Switch
                  id="deal-updates"
                  checked={notificationPreferences.dealUpdates}
                  onCheckedChange={(checked) => 
                    updateNotificationPreference("dealUpdates", checked)
                  }
                  disabled={savingPreferences}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Choose your preferred theme for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                  >
                    Light
                  </Button>
                  <Button 
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                  >
                    Dark
                  </Button>
                  <Button 
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                  >
                    System
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select your preferred color theme for the interface
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}