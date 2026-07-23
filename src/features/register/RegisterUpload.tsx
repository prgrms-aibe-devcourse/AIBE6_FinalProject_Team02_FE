

import React from 'react';
import { ArrowLeftIcon, CameraIcon, ImageIcon, UploadCloudIcon, XIcon } from 'lucide-react';

interface Props {hasPhoto: boolean;onBack: () => void;onAddPhoto: () => void;onNext: () => void;}

export function RegisterUpload({ hasPhoto, onBack, onAddPhoto, onNext }: Props) {
  return <div className="flex h-full flex-col bg-cream-100">
    <header className="flex items-center gap-3 px-5 py-4"><button onClick={onBack} aria-label="뒤로가기"><ArrowLeftIcon size={22} className="text-brown" /></button><span className="font-display text-lg text-brown">음식 등록</span></header>
    <main className="flex-1 px-5"><h1 className="font-display text-xl text-brown">음식 사진을 올려 주세요</h1><p className="mt-1 text-sm text-brown-soft">한 상 사진도 OK · 최소 1장 ~ 최대 5장</p>
      {hasPhoto ? <div className="relative mt-5 flex aspect-[4/3] w-full flex-col items-center justify-center rounded-3xl bg-orange-50 text-7xl shadow-soft">🍜<span className="mt-3 text-sm font-medium text-brown">선택한 음식 사진</span><button onClick={onAddPhoto} aria-label="사진 다시 선택" className="absolute right-3 top-3 rounded-full bg-white p-1.5 text-brown-muted shadow-soft"><XIcon size={16} /></button></div> : <button onClick={onAddPhoto} className="mt-5 flex aspect-[4/3] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-orange-400/60 bg-orange-50/40 text-brown-muted"><UploadCloudIcon size={44} className="text-orange-400" /><span className="mt-2 text-sm">사진을 여기에 올려 주세요</span><span className="text-xs">한 상 사진도 수집할 수 있어요</span></button>}
      <div className="mt-4 grid grid-cols-2 gap-3"><button onClick={onAddPhoto} className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 font-medium text-white shadow-card active:scale-[0.98]"><CameraIcon size={18} />촬영하기</button><button onClick={onAddPhoto} className="flex items-center justify-center gap-2 rounded-2xl border-2 border-orange-400 py-3.5 font-medium text-orange-600 active:scale-[0.98]"><ImageIcon size={18} />앨범에서 선택</button></div>
      <div className="mt-6"><label className="mb-1.5 block text-sm font-medium text-brown-soft">음식 이름을 알려 주세요 (선택)</label><input placeholder="예: 김치찌개" className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400" /></div>
    </main>
    <div className="px-5 pb-8 pt-4"><button disabled={!hasPhoto} onClick={onNext} className="w-full rounded-2xl bg-orange-500 py-4 font-display text-lg text-white shadow-card disabled:cursor-not-allowed disabled:opacity-40">다음</button></div>
  </div>;
}