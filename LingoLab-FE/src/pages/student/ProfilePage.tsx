import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import { authApi, learnerProfilesApi } from "@/services/api";
import type { LearnerProfile } from "@/types";
import {
  User as UserIcon,
  Camera,
  Mail,
  Phone,
  Flag,
  Save,
  KeyRound,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [targetBand, setTargetBand] = useState("7.0");
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Initialize form from user data
  useEffect(() => {
    if (user) {
      const displayName = user.displayName || user.name || "";
      const nameParts = displayName.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
    }
  }, [user]);

  // Fetch learner profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const profile = await learnerProfilesApi.getByUserId(user.id);
        setLearnerProfile(profile);
        setTargetBand(profile.targetBand?.toString() || "7.0");
        setBio(profile.learningGoals || "");
      } catch (error) {
        // Profile might not exist yet, will create one on save
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const displayName = `${firstName} ${lastName}`.trim();

      // Update user profile via auth API (if available)
      // For now, update local state
      setUser({
        ...user,
        displayName,
        name: displayName,
      });

      // Update or create learner profile
      if (learnerProfile) {
        await learnerProfilesApi.update(learnerProfile.id, {
          targetBand: parseFloat(targetBand),
          learningGoals: bio,
        });
      } else {
        const newProfile = await learnerProfilesApi.create({
          targetBand: parseFloat(targetBand),
          learningGoals: bio,
        });
        setLearnerProfile(newProfile);
      }

      toast.success("Đã lưu thông tin thành công!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Không thể lưu thông tin");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin mật khẩu");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }

    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đổi mật khẩu");
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.STUDENT.DASHBOARD);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Main Content */}
      <main className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-6 pt-6">
          <h2 className="text-slate-900 text-3xl font-bold tracking-tight">
            Edit Profile
          </h2>
          <p className="text-slate-500 text-base">
            Update your personal information and learning goals for your IELTS
            journey.
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left">
              <div className="relative group">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full w-24 h-24 border-4 border-white shadow-md bg-slate-200 flex items-center justify-center"
                  style={{
                    backgroundImage: user?.avatarUrl
                      ? `url("${user.avatarUrl}")`
                      : undefined,
                  }}
                >
                  {!user?.avatarUrl && (
                    <span className="text-2xl font-bold text-slate-400">
                      {(user?.displayName || user?.name)?.[0] || "U"}
                    </span>
                  )}
                </div>
                <button
                  className="absolute bottom-0 right-0 bg-purple-600 text-white p-1.5 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
                  title="Change photo"
                >
                  <Camera size={16} />
                </button>
              </div>
              <div>
                <h3 className="text-slate-900 text-xl font-bold">
                  {firstName} {lastName}
                </h3>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  Student • Band {targetBand === "8.5" ? "8.5+" : targetBand}
                </p>
                <div className="flex items-center gap-1 mt-2 justify-center sm:justify-start">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Verified Student
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none items-center justify-center rounded-lg px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">
                Remove
              </button>
              <button className="flex-1 sm:flex-none items-center justify-center rounded-lg px-4 py-2 border border-slate-200 text-purple-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                Change Photo
              </button>
            </div>
          </div>
        </div>

        {/* Personal Info Form */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <UserIcon size={20} className="text-purple-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  First Name
                </label>
                <input
                  className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 transition-all text-sm border"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Last Name
                </label>
                <input
                  className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 transition-all text-sm border"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Mail size={18} />
                  </span>
                  <input
                    className="w-full rounded-lg bg-slate-100 border-slate-200 text-slate-500 pl-10 pr-4 py-2.5 text-sm border cursor-not-allowed"
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Phone size={18} />
                  </span>
                  <input
                    className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2.5 transition-all text-sm border"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+84 xxx xxx xxx"
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Bio & Learning Goals
                </label>
                <textarea
                  className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 transition-all text-sm resize-none border min-h-[100px]"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself and your IELTS goals..."
                  maxLength={300}
                />
                <p className="text-xs text-slate-500 text-right">
                  {bio.length}/300 characters
                </p>
              </div>
              <div className="md:col-span-2 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Flag size={18} className="text-purple-600" />
                    IELTS Target Band Score
                  </label>
                  <select
                    className="w-full rounded-lg bg-white border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm"
                    value={targetBand}
                    onChange={(e) => setTargetBand(e.target.value)}
                  >
                    <option value="6.0">Band 6.0</option>
                    <option value="6.5">Band 6.5</option>
                    <option value="7.0">Band 7.0</option>
                    <option value="7.5">Band 7.5</option>
                    <option value="8.0">Band 8.0</option>
                    <option value="8.5">Band 8.5+</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    This helps our AI tailor your assignments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <KeyRound size={20} className="text-purple-600" />
              Password Change
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Current Password
                </label>
                <input
                  className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border"
                  placeholder="••••••••"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  New Password
                </label>
                <input
                  className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border"
                  placeholder="••••••••"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Confirm New Password
                </label>
                <input
                  className="w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border"
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            {(currentPassword || newPassword || confirmPassword) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-4 z-40 bg-white border border-slate-200 p-4 rounded-xl shadow-lg flex justify-end gap-3 items-center mt-4">
          <button
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 shadow-sm transition-colors flex items-center gap-2 shadow-purple-200 disabled:opacity-50"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
