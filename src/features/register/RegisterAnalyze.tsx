


import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CheckIcon, Loader2Icon, SparklesIcon } from 'lucide-react';
import { AI_CANDIDATES, DEX_ENTRIES } from '@/shared/data/dex';
import { SearchBar } from '@/shared/ui/atoms/SearchBar';

interface Props {onBack: () => void;onNext: (candidateId: number) => void;}

export function RegisterAnalyze({ onBack, onNext }: Props) {
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([16]);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {const timer = window.setTimeout(() => setLoading(false), 1300);return () => window.clearTimeout(timer);}, []);
  const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return DEX_ENTRIES.filter((entry) => entry.name.toLowerCase().includes(normalizedQuery)).slice(0, 5);
  }, [query]);

  if (loading) return <div className="flex h-full flex-col bg-cream-100"><header className="flex items-center gap-3 px-5 py-4"><button onClick={onBack} aria-label="뒤로가기"><ArrowLeftIcon size={22} /></button><span className="font-display text-lg">AI 분석</span></header><div className="flex flex-1 flex-col items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2Icon size={48} className="text-orange-500" /></motion.div><p className="mt-5 font-display text-lg text-brown">사진을 분석하고 있어요</p><p className="mt-1 text-sm text-brown-muted">조금만 기다려 주세요…</p></div></div>;

  return <div className="flex h-full flex-col bg-cream-100"><header className="flex items-center gap-3 px-5 py-4"><button onClick={onBack} aria-label="뒤로가기"><ArrowLeftIcon size={22} /></button><span className="font-display text-lg">AI 분석</span></header><main className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-5"><h1 className="font-display text-xl text-brown">이 중 어느 것인가요?</h1><p className="mt-1 text-sm text-brown-soft">비슷한 후보를 찾았어요. 먹은 음식을 골라 주세요.</p>
    <div className="mt-5 space-y-3">{AI_CANDIDATES.map((candidate) => {const active = selected.includes(candidate.id);return <button key={candidate.id} onClick={() => toggle(candidate.id)} className={`flex w-full items-center gap-4 rounded-2xl border-2 p-3 text-left ${active ? 'border-orange-500 bg-orange-50' : 'border-cream-300 bg-white'}`}><div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cream-100 text-3xl">{candidate.emoji}</div><span className="flex-1 font-medium text-brown">{candidate.name}</span><span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${active ? 'border-orange-500 bg-orange-500 text-white' : 'border-cream-300'}`}>{active && <CheckIcon size={14} />}</span></button>;})}</div>
    <section className="mt-6 rounded-2xl border border-cream-300 bg-white p-3 shadow-soft" aria-label="도감에서 직접 검색"><div className="mb-2 flex items-center gap-1.5"><SparklesIcon size={15} className="text-orange-500" /><h2 className="text-sm font-bold text-brown">원하는 음식이 없나요?</h2></div><p className="mb-3 text-xs text-brown-muted">도감에 있는 음식은 직접 찾아 등록할 수 있어요.</p><SearchBar label="도감에서 음식 검색" placeholder="찾는 음식을 검색해보세요" value={query} onChange={setQuery} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)} className={`bg-cream-50 transition ${searchFocused ? 'border-edge-active ring-2 ring-orange-100' : ''}`} />
      {(searchFocused || query) && query && <div className="mt-2 overflow-hidden rounded-xl border border-cream-200 bg-white"><p className="px-3 pt-2 text-xs font-medium text-brown-soft">도감 검색 결과</p>{matches.length > 0 ? matches.map((entry) => <button key={entry.id} onMouseDown={(event) => event.preventDefault()} onClick={() => onNext(entry.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-orange-50 active:bg-orange-50"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream-100 text-xl">{entry.emoji}</span><span className="flex-1 text-sm font-medium text-brown">{entry.name}</span><span className="text-xs text-brown-soft">{entry.category}</span></button>) : <p className="px-3 py-3 text-xs text-brown-muted">일치하는 도감 음식이 없어요.</p>}</div>}
    </section>
    <div className="mt-auto py-6"><button className="mb-3 block w-full text-center text-sm text-brown-muted">↺ 다시 분석</button><button disabled={selected.length === 0} onClick={() => onNext(selected[0])} className="w-full rounded-2xl bg-orange-500 py-4 font-display text-lg text-white shadow-card disabled:opacity-40">선택 완료</button><button className="mt-4 block w-full text-center text-xs text-brown-muted underline">찾는 음식이 도감에 없나요? 새 음식 제보하기</button></div>
  </main></div>;
}