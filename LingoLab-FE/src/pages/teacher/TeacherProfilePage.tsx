import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import {
  User as UserIcon,
  Camera,
  Mail,
  Phone,
  Briefcase,
  Save,
  KeyRound,
  GraduationCap,
  MapPin,
  Globe,
  Award,
} from "lucide-react";

export function TeacherProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  // Personal Info
  const [firstName, setFirstName] = useState(
    user?.name?.split(" ")[0] || ""
  );
  const [lastName, setLastName] = useState(
    user?.name?.split(" ").slice(1).join(" ") || ""
  );
  const [bio, setBio] = useState(
    "Experienced IELTS instructor with over 5 years of teaching experience. Passionate about helping students achieve their target band scores."
  );
  const [phone, setPhone] = useState("+84 912 345 678");
  const [location, setLocation] = useState("Ho Chi Minh City, Vietnam");

  // Professional Info
  const [specialization, setSpecialization] = useState("IELTS Academic");
  const [yearsExperience, setYearsExperience] = useState("5");
  const [qualification, setQualification] = useState("CELTA Certified");
  const [languages, setLanguages] = useState("English, Vietnamese");

  const handleSave = () => {
    if (user) {
      setUser({
        ...user,
        name: `${firstName} ${lastName}`.trim(),
      });
      toast.success("Profile updated successfully!");
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.TEACHER.DASHBOARD);
  };

  return (
    <div className='w-full max-w-5xl mx-auto pb-12 animate-in fade-in duration-300'>
      {/* Main Content */}
      <main className='flex flex-col gap-6'>
        {/* Header */}
        <div className='flex flex-col gap-2 border-b border-slate-200 pb-6 pt-6'>
          <h2 className='text-slate-900 text-3xl font-bold tracking-tight'>
            Edit Profile
          </h2>
          <p className='text-slate-500 text-base'>
            Update your personal information and teaching credentials.
          </p>
        </div>

        {/* Profile Header Card */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
          <div className='flex flex-col sm:flex-row gap-6 items-center sm:justify-between'>
            <div className='flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left'>
              <div className='relative group'>
                <div
                  className='bg-center bg-no-repeat bg-cover rounded-full w-24 h-24 border-4 border-white shadow-md bg-slate-200 flex items-center justify-center'
                  style={{
                    backgroundImage: user?.avatar
                      ? `url("${user.avatar}")`
                      : undefined,
                  }}
                >
                  {!user?.avatar && (
                    <span className='text-2xl font-bold text-slate-400'>
                      {user?.name?.[0] || "T"}
                    </span>
                  )}
                </div>
                <button
                  className='absolute bottom-0 right-0 bg-purple-600 text-white p-1.5 rounded-full shadow-lg hover:bg-purple-700 transition-colors'
                  title='Change photo'
                >
                  <Camera size={16} />
                </button>
              </div>
              <div>
                <h3 className='text-slate-900 text-xl font-bold'>
                  {firstName} {lastName}
                </h3>
                <p className='text-slate-500 text-sm font-medium mt-1'>
                  Teacher • {specialization}
                </p>
                <div className='flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap'>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200'>
                    <GraduationCap size={12} className='mr-1' />
                    Verified Teacher
                  </span>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200'>
                    <Award size={12} className='mr-1' />
                    {qualification}
                  </span>
                </div>
              </div>
            </div>
            <div className='flex gap-3 w-full sm:w-auto'>
              <button className='flex-1 sm:flex-none items-center justify-center rounded-lg px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors'>
                Remove
              </button>
              <button className='flex-1 sm:flex-none items-center justify-center rounded-lg px-4 py-2 border border-slate-200 text-purple-600 text-sm font-semibold hover:bg-slate-50 transition-colors'>
                Change Photo
              </button>
            </div>
          </div>
        </div>

        {/* Personal Info Form */}
        <div className='flex flex-col gap-6'>
          <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
            <h3 className='text-lg font-bold text-slate-900 mb-5 flex items-center gap-2'>
              <UserIcon size={20} className='text-purple-600' />
              Personal Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  First Name
                </label>
                <input
                  className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 transition-all text-sm border'
                  type='text'
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Last Name
                </label>
                <input
                  className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 transition-all text-sm border'
                  type='text'
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Email Address
                </label>
                <div className='relative'>
                  <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500'>
                    <Mail size={18} />
                  </span>
                  <input
                    className='w-full rounded-lg bg-slate-100 border-slate-200 text-slate-500 pl-10 pr-4 py-2.5 text-sm border cursor-not-allowed'
                    type='email'
                    value={user?.email || ""}
                    disabled
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Phone Number
                </label>
                <div className='relative'>
                  <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500'>
                    <Phone size={18} />
                  </span>
                  <input
                    className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2.5 transition-all text-sm border'
                    type='tel'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Location
                </label>
                <div className='relative'>
                  <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500'>
                    <MapPin size={18} />
                  </span>
                  <input
                    className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2.5 transition-all text-sm border'
                    type='text'
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder='City, Country'
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Languages
                </label>
                <div className='relative'>
                  <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500'>
                    <Globe size={18} />
                  </span>
                  <input
                    className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2.5 transition-all text-sm border'
                    type='text'
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder='English, Vietnamese...'
                  />
                </div>
              </div>
              <div className='md:col-span-2 flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Bio & Teaching Philosophy
                </label>
                <textarea
                  className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 transition-all text-sm resize-none border min-h-[100px]'
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder='Tell students about yourself and your teaching approach...'
                  maxLength={500}
                />
                <p className='text-xs text-slate-500 text-right'>
                  {bio.length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
            <h3 className='text-lg font-bold text-slate-900 mb-5 flex items-center gap-2'>
              <Briefcase size={20} className='text-purple-600' />
              Professional Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Specialization
                </label>
                <select
                  className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border cursor-pointer'
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                >
                  <option value='IELTS Academic'>IELTS Academic</option>
                  <option value='IELTS General'>IELTS General Training</option>
                  <option value='IELTS Writing'>IELTS Writing Specialist</option>
                  <option value='IELTS Speaking'>IELTS Speaking Specialist</option>
                  <option value='All Skills'>All IELTS Skills</option>
                </select>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Years of Experience
                </label>
                <select
                  className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border cursor-pointer'
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                >
                  <option value='1'>1 year</option>
                  <option value='2'>2 years</option>
                  <option value='3'>3 years</option>
                  <option value='5'>5+ years</option>
                  <option value='10'>10+ years</option>
                </select>
              </div>
              <div className='md:col-span-2 flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Qualifications & Certifications
                </label>
                <input
                  className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 transition-all text-sm border'
                  type='text'
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder='e.g., CELTA, DELTA, MA in TESOL...'
                />
              </div>
              <div className='md:col-span-2 p-4 bg-purple-50 rounded-lg border border-purple-100'>
                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-purple-100 rounded-lg'>
                    <Award size={20} className='text-purple-600' />
                  </div>
                  <div>
                    <h4 className='text-sm font-bold text-slate-900'>
                      Verification Status
                    </h4>
                    <p className='text-xs text-slate-600 mt-1'>
                      Your teaching credentials have been verified. Your profile
                      displays a verification badge to students.
                    </p>
                    <button className='mt-2 text-xs font-medium text-purple-600 hover:underline'>
                      Update Credentials →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
            <h3 className='text-lg font-bold text-slate-900 mb-5 flex items-center gap-2'>
              <KeyRound size={20} className='text-purple-600' />
              Password Change
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Current Password
                </label>
                <input
                  className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border'
                  placeholder='••••••••'
                  type='password'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  New Password
                </label>
                <input
                  className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border'
                  placeholder='••••••••'
                  type='password'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-slate-700'>
                  Confirm New Password
                </label>
                <input
                  className='w-full rounded-lg bg-slate-50 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 text-slate-900 px-4 py-2.5 text-sm border'
                  placeholder='••••••••'
                  type='password'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className='sticky bottom-4 z-40 bg-white border border-slate-200 p-4 rounded-xl shadow-lg flex justify-end gap-3 items-center mt-4'>
          <button
            className='px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors'
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className='px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 shadow-sm transition-colors flex items-center gap-2 shadow-purple-200'
            onClick={handleSave}
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
}

export default TeacherProfilePage;

