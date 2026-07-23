'use client';

import { useRouter } from 'next/navigation';
import { ProfilePhotoChange } from '@/features/my/ProfilePhotoChange';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

/** `/my/photo` 프로필 사진 변경 */
export default function ProfilePhotoPage() {
  const router = useRouter();
  const { profilePhoto, setProfilePhoto } = useAppState();

  return (
    <ProfilePhotoChange
      currentPhoto={profilePhoto}
      onBack={() => router.push(ROUTES.my)}
      onSelect={(photo) => {
        setProfilePhoto(photo);
        router.push(ROUTES.my);
      }} />);

}
