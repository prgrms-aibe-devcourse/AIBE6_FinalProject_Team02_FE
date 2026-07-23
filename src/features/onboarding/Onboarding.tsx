

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
{
  emoji: '📖',
  title: '도감의 빈 칸을 채워 보세요',
  desc: '전체 200칸이 실루엣으로 공개돼요.\n먹은 음식으로 한 칸씩 채워 나가면 됩니다.'
},
{
  emoji: '📸',
  title: '음식 사진을 찍으면 AI가 인식해 줘요',
  desc: '위치는 검색이나 GPS로 선택 입력,\n스킵도 가능해요.'
}];


export function Onboarding({ onDone }: {onDone?: () => void;}) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  return (
    <div className="flex h-full flex-col bg-cream-100">
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-xl text-orange-600">캣칫 CatchEat</h1>
        <button onClick={onDone} className="min-h-touch px-2 text-sm text-brown-soft">건너뛰기</button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center">
            
            <div className="mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-orange-50 text-7xl shadow-soft">
              {STEPS[step].emoji}
            </div>
            <h2 className="mb-3 font-display text-xl text-brown">{STEPS[step].title}</h2>
            <p className="whitespace-pre-line text-sm leading-6 text-brown-soft">{STEPS[step].desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-10">
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((_, i) =>
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-orange-500' : 'w-2 bg-cream-300'}`} />

          )}
        </div>
        <button
          onClick={() => last ? onDone?.() : setStep((s) => s + 1)}
          className="h-cta w-full rounded-full bg-orange-500 font-display text-lg text-white shadow-card transition active:scale-[0.98]">
          {last ? '시작하기' : '다음'}
        </button>
      </div>
    </div>);

}