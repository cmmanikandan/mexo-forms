import React, { useState, useRef } from 'react';
import { MexoModal } from './MexoModal';
import { MexoAvatar } from './MexoAvatar';
import { ImageCropperModal } from './ImageCropperModal';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Trash2, Upload, AlertCircle, Loader2 } from 'lucide-react';

export interface ProfilePhotoUploaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  isOpen,
  onClose,
}) => {
  const { profile, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [error, setError] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const displayName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username : 'User';
  const displayAvatarUrl = profile?.avatar_url;

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('This image is too large. Choose an image under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.onerror = () => setError('Could not read the image. Please try another file.');
    reader.readAsDataURL(file);
  };

  const handleCrop = async (blob: Blob) => {
    setIsCropperOpen(false);
    setRawImageSrc(null);
    setError('');
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await updateProfile({ avatar_url: base64data });
        setIsUploading(false);
        onClose();
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setError('Couldn\'t update profile photo. Please try again.');
      setIsUploading(false);
    }
  };

  const handleConfirmRemove = async () => {
    try {
      await updateProfile({ avatar_url: undefined });
    } catch (e) {
      console.error('Failed to remove photo:', e);
    } finally {
      setIsRemoving(false);
      onClose();
    }
  };

  return (
    <>
      <MexoModal open={isOpen} onOpenChange={open => !open && onClose()} title="Profile Photo" maxWidth="max-w-sm">
        <div className="space-y-5 select-none py-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col items-center space-y-3 py-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] opacity-40 blur-xl scale-110 pointer-events-none" />
              <MexoAvatar
                name={displayName}
                src={displayAvatarUrl}
                size="xl"
                className="w-24 h-24 text-3xl shadow-2xl border-4 border-white relative"
              />
            </div>
            <div className="text-center">
              <p className="font-extrabold text-sm text-app-heading">{displayName}</p>
              <p className="text-xs text-app-muted font-mono mt-0.5">{profile?.primary_address}</p>
            </div>
          </div>

          {isUploading && (
            <div className="space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-app-heading">
                <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
                Saving profile photo...
              </div>
            </div>
          )}

          {isRemoving ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <p className="font-bold text-xs text-rose-800">Remove profile photo?</p>
              <p className="text-xs text-rose-700">
                Your initials will be shown instead across MEXO services.
              </p>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRemoving(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-white text-xs font-bold text-app-heading hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemove}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center space-x-2.5 py-3 px-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#7C3AED] bg-slate-50 text-app-heading hover:bg-purple-50/50 transition-all font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#7C3AED]" />
                <span>{displayAvatarUrl ? 'Change photo' : 'Upload photo'}</span>
              </button>

              {displayAvatarUrl && (
                <button
                  type="button"
                  onClick={() => setIsRemoving(true)}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-2xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors font-semibold text-xs disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove photo</span>
                </button>
              )}

              <div className="flex justify-end pt-2 border-t border-app-border">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl border border-app-border text-xs font-bold text-app-heading hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </MexoModal>

      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={rawImageSrc}
        onClose={() => {
          setIsCropperOpen(false);
          setRawImageSrc(null);
        }}
        onCrop={handleCrop}
      />
    </>
  );
};
