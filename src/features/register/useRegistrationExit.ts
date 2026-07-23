import { ROUTES } from '@/shared/lib/routes';
import { useAppState } from '@/shared/store/AppStateProvider';

/**
 * 등록 플로우를 빠져나갈 때 돌아갈 곳.
 * 어디서 등록을 시작했는지(기본/제작/챌린지)에 따라 달라진다.
 */
export function useRegistrationExitHref() {
  const { registrationSource, registrationMadeDexId, registrationChallengeId } = useAppState();

  if (registrationSource === 'made' && registrationMadeDexId) {
    return ROUTES.madeDex(registrationMadeDexId);
  }
  if (registrationSource === 'challenge' && registrationChallengeId) {
    return ROUTES.challengeDetail(registrationChallengeId);
  }
  return ROUTES.home;
}
