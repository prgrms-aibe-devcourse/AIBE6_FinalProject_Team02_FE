/** 챌린지 도감 (§6) — 개설자가 지정한 목표 리스트를 기본 도감형으로 해금 */

export interface RewardBadge {
  emoji: string;
  name: string;
  /** 뱃지 배경 톤 (Tailwind 클래스) */
  tone: string;
  customImage?: string;
}

export interface ChallengeTarget {
  id: string;
  name: string;
  emoji?: string;
}

export interface ChallengeData {
  id: string;
  title: string;
  emoji: string;
  tag: string;
  dday: string;
  participants: number;
  mine?: string;
  progress?: number;
  owner: string;
  joined?: boolean;
  completed?: boolean;
  isCreator?: boolean;
  target?: number;
  targetRestaurants?: ChallengeTarget[];
  completedTargetIds?: string[];
  rewardBadge?: RewardBadge;
}
