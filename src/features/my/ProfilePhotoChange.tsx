import React from 'react';
import { ArrowLeftIcon } from 'lucide-react';

interface Props {
  currentPhoto: string;
  onBack: () => void;
  onSelect: (photo: string) => void;
}

export function ProfilePhotoChange({ currentPhoto, onBack, onSelect }: Props) {
  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex items-center gap-3 px-5 py-4">
        <button type="button" onClick={onBack} aria-label="마이페이지로 돌아가기">
          <ArrowLeftIcon size={21} aria-hidden />
        </button>
        <h1 className="font-display text-xl text-content-primary">프로필 사진 변경</h1>
      </header>
      <main className="flex-1 px-5">
        <div className="mt-4 flex h-36 items-center justify-center rounded-3xl bg-orange-50">
          <span
            aria-hidden
            className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 font-display text-4xl text-content-link">
            {currentPhoto}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelect('📷')}
            className="h-cta rounded-full bg-action-primary text-sm font-bold text-content-on-action">
            촬영하기
          </button>
          <button
            type="button"
            onClick={() => onSelect('🖼️')}
            className="h-cta rounded-full border-2 border-orange-400 text-sm font-bold text-content-link">
            앨범에서 선택
          </button>
        </div>
      </main>
    </div>);

}
