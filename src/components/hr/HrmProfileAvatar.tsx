import { useState } from 'react';
import { profileInitials } from '../../lib/hrm/profileInitials';

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
  const [broken, setBroken] = useState(false);

  if (!photoUrl || broken) {
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

  if (variant === 'profile') {
    return (
      <img
        key={photoUrl}
        src={photoUrl}
        alt=""
        className={className}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <img
      key={photoUrl}
      src={photoUrl}
      alt=""
      className={['hrm-member-avatar', className].filter(Boolean).join(' ')}
      onError={() => setBroken(true)}
    />
  );
}
