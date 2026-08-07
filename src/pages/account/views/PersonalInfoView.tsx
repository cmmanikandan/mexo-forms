import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { MexoAvatar } from '../../../components/common/MexoAvatar';
import { ProfilePhotoUploader } from '../../../components/common/ProfilePhotoUploader';
import { User, Camera, ShieldCheck } from 'lucide-react';

export const PersonalInfoView: React.FC = () => {
  const { profile, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [recoveryEmail, setRecoveryEmail] = useState(profile?.recovery_email || '');
  const [dob, setDob] = useState(profile?.date_of_birth || '');
  const [gender, setGender] = useState(profile?.gender || 'Select');
  const [isPhotoUploaderOpen, setIsPhotoUploaderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username : '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg('');

    await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      recovery_email: recoveryEmail.trim() || undefined,
      date_of_birth: dob || undefined,
      gender: gender !== 'Select' ? gender : undefined,
    });

    setIsSaving(false);
    setIsEditing(false);
    setMsg('Personal information updated successfully across MEXO services.');
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <ProfilePhotoUploader
        isOpen={isPhotoUploaderOpen}
        onClose={() => setIsPhotoUploaderOpen(false)}
      />

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <User className="w-5 h-5 mr-2 text-[#7C3AED]" /> Personal Information
          </h2>
          <p className="text-xs text-app-muted mt-1 font-medium">
            Basic info, like your name and photo, that you use across MEXO services.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              setFirstName(profile?.first_name || '');
              setLastName(profile?.last_name || '');
              setRecoveryEmail(profile?.recovery_email || '');
              setDob(profile?.date_of_birth || '');
              setGender(profile?.gender || 'Select');
              setIsEditing(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all flex-shrink-0 cursor-pointer"
          >
            Edit Profile
          </button>
        )}
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Cross-App Identity Notice */}
      <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs font-medium text-[#7C3AED] flex items-center gap-2">
        <span className="font-bold">Notice:</span>
        <span>Changes to your MEXO Account apply across all MEXO services (MEXO Mail, MEXO Forms).</span>
      </div>

      {/* Photo Box */}
      <div className="bg-white rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm">
        <h3 className="text-xs font-extrabold text-app-heading uppercase tracking-wider mb-4">Profile Photo</h3>
        <div className="flex items-center space-x-4">
          <div
            className="relative group cursor-pointer flex-shrink-0"
            onClick={() => setIsPhotoUploaderOpen(true)}
          >
            <MexoAvatar
              name={fullName}
              src={profile?.avatar_url}
              size="xl"
              className="w-20 h-20 md:w-24 md:h-24 text-2xl md:text-3xl shadow-mexo-md border-2 border-white"
            />
            <div className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base text-app-heading truncate">
              {fullName}
            </p>
            <p className="text-xs text-[#7C3AED] font-mono font-semibold truncate mt-0.5">{profile?.primary_address}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setIsPhotoUploaderOpen(true)}
                className="px-3.5 py-1.5 rounded-xl border border-app-border bg-slate-50 text-app-heading hover:bg-slate-100 font-bold text-xs inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>{profile?.avatar_url ? 'Change Photo' : 'Add Photo'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form / Read-only Fields */}
      <div className="bg-white rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-app-heading mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-app-border bg-white text-xs font-bold outline-none focus:border-[#7C3AED]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-app-heading mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-app-border bg-white text-xs font-bold outline-none focus:border-[#7C3AED]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-app-heading mb-1">
                MEXO Address (Read-only)
              </label>
              <input
                type="text"
                value={profile?.primary_address || ''}
                readOnly
                disabled
                className="w-full h-11 px-3.5 rounded-xl border border-app-border bg-slate-100 text-app-muted text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-app-heading mb-1">
                Recovery Email
              </label>
              <input
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="recovery@example.com"
                className="w-full h-11 px-3.5 rounded-xl border border-app-border bg-white text-xs font-bold outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-app-heading mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-app-border bg-white text-xs font-bold outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-app-heading mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-app-border bg-white text-xs font-bold outline-none focus:border-[#7C3AED]"
                >
                  <option value="Select">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Rather not say">Rather not say</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-app-border">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-app-border bg-slate-100 text-app-heading font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-app-border text-sm">
            {[
              { label: 'First Name', value: profile?.first_name || '' },
              { label: 'Last Name', value: profile?.last_name || '' },
              { label: 'MEXO Identity Email', value: profile?.primary_address || '', mono: true, blue: true },
              { label: 'Recovery Email', value: profile?.recovery_email || 'Not configured' },
              { label: 'Date of Birth', value: profile?.date_of_birth || 'Not specified' },
              { label: 'Gender', value: profile?.gender || 'Not specified' },
            ].map((row) => (
              <div key={row.label} className="flex flex-col sm:flex-row sm:items-center py-3.5 px-2 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-xs font-bold text-app-muted sm:w-48 flex-shrink-0">{row.label}</span>
                <span className={`text-xs font-extrabold ${row.blue ? 'text-[#7C3AED] font-mono' : 'text-app-heading'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
