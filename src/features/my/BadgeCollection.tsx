

import React, { useState } from 'react';
import { ArrowLeftIcon, CheckIcon, LockIcon } from 'lucide-react';
import { BadgeId, BadgeMedalIcon, badgeLabel } from '@/shared/ui/atoms/EquippedBadge';

interface Props {equippedBadge: BadgeId;onBack: () => void;onEquip: (badge: BadgeId) => void;}
const badges: Array<{id: BadgeId | 'locked-1' | 'locked-2';name: string;description: string;image?: string;}> = [
{ id: 'silver-spoon', name: '은수저 수집가', description: '기본 도감 50종 수집', image: "/badge-autumn.png" },
{ id: 'spring-discoverer', name: '봄 제철 탐험가', description: '봄 제철 음식 10종 수집', image: "/badge-spring.png" },
{ id: 'locked-1', name: '금수저 수집가', description: '기본 도감 100종 수집' },
{ id: 'locked-2', name: '겨울 완주자', description: '겨울 제철 음식 20종 수집' }];


export function BadgeCollection({ equippedBadge, onBack, onEquip }: Props) {
  const [selected, setSelected] = useState<BadgeId>(equippedBadge);
  const selectedBadge = badges.find((badge) => badge.id === selected);
  return <div className="flex h-full flex-col bg-cream-100"><header className="flex items-center gap-3 px-5 py-4"><button onClick={onBack} aria-label="뒤로가기"><ArrowLeftIcon size={22} /></button><span className="font-display text-xl text-brown">나의 뱃지</span></header><main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6"><p className="text-sm text-brown-muted">획득한 뱃지를 탭해 대표 뱃지로 설정하세요.</p><div className="mt-5 grid grid-cols-2 gap-3">{badges.map((badge) => {const unlocked = !badge.id.startsWith('locked');const id = badge.id as BadgeId;const active = unlocked && selected === id;return <button key={badge.id} disabled={!unlocked} onClick={() => unlocked && setSelected(id)} className={`relative overflow-hidden rounded-2xl border-2 p-3 text-left ${active ? 'border-orange-500 bg-orange-50' : unlocked ? 'border-transparent bg-white shadow-soft' : 'border-cream-300 bg-cream-200 opacity-70'}`}>
    <div className="flex h-20 items-center justify-center rounded-xl bg-cream-50">{unlocked ? badge.image ? <img src={badge.image} alt="" className="h-16 w-16 object-contain" /> : <BadgeMedalIcon badge={id} /> : <LockIcon size={27} className="text-brown-muted" />}</div><p className="mt-2 text-sm font-bold text-brown">{badge.name}</p><p className="mt-1 text-xs text-brown-soft">{badge.description}</p>{active && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white"><CheckIcon size={13} /></span>}
  </button>;})}</div></main><div className="border-t border-cream-300 bg-cream-50 px-5 py-4"><button onClick={() => onEquip(selected)} className="min-h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card">대표 뱃지로 설정</button>{selectedBadge && <p className="mt-2 text-center text-xs text-brown-muted">현재 선택: {badgeLabel(selected)}</p>}</div></div>;
}