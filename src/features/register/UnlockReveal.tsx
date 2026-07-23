import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Props {foodName: string;foodEmoji: string;onGoDex: () => void;}

/**
 * §7 시그니처 순간 — 카드 해금.
 * 대담한 모션은 이 화면 한 곳에만. 카드 뒤집기 400ms ease-out + 스케일 팝.
 * 무한 루프 장식 애니메이션은 금지이므로 반짝임은 1회만 재생.
 * prefers-reduced-motion 시 모든 모션을 생략하고 즉시 표시.
 */
export function UnlockReveal({ foodName, foodEmoji, onGoDex }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-orange-500 px-8 text-center">
      {!reduceMotion && Array.from({ length: 12 }).map((_, index) =>
        <motion.span
          key={index}
          aria-hidden
          className="absolute text-xl"
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], y: [-10, -80], scale: [0, 1, 0.6] }}
          transition={{ delay: 0.3 + index * 0.06, duration: 1.4 }}
          style={{ left: `${8 + index * 6.4 % 84}%`, top: `${20 + index % 5 * 12}%` }}>
          {['✨', '🎉', '⭐'][index % 3]}
        </motion.span>
      )}

      <motion.h1
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 font-display text-xl text-white">
        새로운 음식을 수집했습니다!
      </motion.h1>

      <motion.div
        initial={reduceMotion ? false : { rotateY: 180, opacity: 0, scale: 0.9 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 0.25, duration: 0.4, ease: 'easeOut' }}
        className="flex h-52 w-44 flex-col items-center justify-center rounded-3xl bg-white shadow-modal">
        <span aria-hidden className="text-7xl">{foodEmoji}</span>
        <span className="mt-4 font-display text-xl text-brown">{foodName}</span>
        <span aria-label="별 1개" className="mt-1 text-orange-500">★☆☆</span>
      </motion.div>

      <motion.button
        type="button"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 1 }}
        onClick={onGoDex}
        className="mt-10 h-cta rounded-full border-2 border-white px-10 font-display text-lg text-white">
        도감 보러 가기
      </motion.button>
    </div>);

}
