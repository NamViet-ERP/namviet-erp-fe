import { useState } from 'react';
import { profileInitials } from '../../lib/hrm/profileInitials';
import { useSecureFileUrl } from '../../hooks/useSecureFileUrl';

type HrmProfileAvatarProps = {
  name: string;
  photoUrl?: string;
  /** List row avatar (default) or detail profile strip. */
  variant?: 'member' | 'profile';
  className?: string;
};

export default function HrmProfileAvatar({
  name,
  photoUrl,
  variant = 'member',
  className,
}: HrmProfileAvatarProps) {
  const [brokenUrl, setBrokenUrl] = useState<string | undefined>();
  const securePhoto = useSecureFileUrl(photoUrl);

  if (!photoUrl || brokenUrl === securePhoto.url || securePhoto.error) {
    const fallbackClass =
      variant === 'profile'
        ? 'hrm-profile-avatar-fallback'
        : 'hrm-member-avatar hrm-member-avatar--fallback';
    return (
      <span className={[fallbackClass, className].filter(Boolean).join(' ')} aria-hidden>
        {profileInitials(name)}
      </span>
    );
  }

  if (securePhoto.isLoading || !securePhoto.url) {
    const loadingClass =
      variant === 'profile'
        ? 'hrm-profile-avatar-fallback'
        : 'hrm-member-avatar hrm-member-avatar--fallback';
    return <span className={[loadingClass, className].filter(Boolean).join(' ')} aria-hidden />;
  }

  if (variant === 'profile') {
    return (
      <img
        key={securePhoto.url}
        src={securePhoto.url}
        alt=""
        className={className}
        onError={() => setBrokenUrl(securePhoto.url)}
      />
    );
  }

  return (
    <img
      key={securePhoto.url}
      src={securePhoto.url}
      alt=""
      className={['hrm-member-avatar', className].filter(Boolean).join(' ')}
      onError={() => setBrokenUrl(securePhoto.url)}
    />
  );
}
