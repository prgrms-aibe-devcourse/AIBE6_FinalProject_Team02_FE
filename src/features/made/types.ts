/** 제작 도감 (§6) — 목표·빈칸 없이 등록된 카드만 쌓이는 공동 도감 */

export type MadeDexId = 'date' | 'lunch';

const MADE_DEX_IDS: MadeDexId[] = ['date', 'lunch'];

/** URL 세그먼트를 MadeDexId로 좁힘. 모르는 값이면 null */
export function parseMadeDexId(value: string | undefined): MadeDexId | null {
  return MADE_DEX_IDS.includes(value as MadeDexId) ? (value as MadeDexId) : null;
}

export interface MadeParticipant {
  id: string;
  name: string;
}

export interface MadeCard {
  name: string;
  emoji: string;
  /** 등록한 참여자 이름 */
  by: string;
  location: string;
  tags: string[];
}
