import { apiFetch } from '@/shared/lib/api';

export type ChallengeType = 'FIRST_COME' | 'COLLECTION';
export type PeriodType = 'PERMANENT' | 'LIMITED';

export interface CreateSlotInput {
  foodName: string;
  placeName?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface CreateChallengePayload {
  name: string;
  description?: string | null;
  challengeType: ChallengeType;
  periodType: PeriodType;
  startsAt?: string | null;   // ISO, null이면 지금부터
  endsAt?: string | null;     // LIMITED면 필수
  rewardBadgeId?: number | null;
  slots: CreateSlotInput[];
}

export interface CreateChallengeResult {
  challengeId: number;
  remainingTickets: number;
}

/** 이번 달 남은 개설권 */
export function fetchCreationTickets() {
  return apiFetch<{ remaining: number }>('/api/v1/challenges/creation-tickets');
}

/** 챌린지 개설 */
export function createChallenge(payload: CreateChallengePayload) {
  return apiFetch<CreateChallengeResult>('/api/v1/challenges', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
