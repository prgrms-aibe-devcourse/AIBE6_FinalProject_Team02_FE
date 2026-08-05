"use client";

import {
  ChallengeSort,
  ChallengeSummary,
  fetchChallenges,
  fetchCreationTickets,
  joinChallenge,
} from "@/features/challenge/api";
import { ChallengeCountHome } from "@/features/challenge/ChallengeCountHome";
import { ChallengeData } from "@/features/challenge/types";
import { getTabHref, ROUTES } from "@/shared/lib/routes";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const MONTHLY_LIMIT = 3;
const PAGE_SIZE = 10;
const SORTS: ChallengeSort[] = ["LATEST", "VIEWS", "PARTICIPANTS", "UNLOCKS"];

/** 서버 요약 → 화면 카드 형태로 변환 */
function toChallengeData(c: ChallengeSummary): ChallengeData {
  return {
    id: String(c.id),
    title: c.name,
    emoji: "🏆",
    tag: c.challengeType === "FIRST_COME" ? "선착순" : "수집형",
    dday:
      c.periodType === "PERMANENT"
        ? "상시"
        : c.endsAt
          ? ddayLabel(c.endsAt)
          : "기간한정",
    participants: c.participantCount,
    score: c.rankScore,
    joined: c.joined,
    owner: "",
  };
}

function ddayLabel(endsAt: string): string {
  const days = Math.ceil(
    (new Date(endsAt).getTime() - Date.now()) / 86_400_000,
  );
  return days >= 0 ? `D-${days}` : "종료";
}

/** \/challenge\ 챌린지 도감 홈 */
function ChallengeHome() {
  const router = useRouter();
  const params = useSearchParams();

  // 탐색 탭/정렬 초기값을 URL에서 복원 (상세에서 뒤로가기 시 그 자리)
  const sortParam = params.get("sort") as ChallengeSort | null;
  const [mainTab, setMainTab] = useState<"mine" | "explore">(
    params.get("tab") === "explore" ? "explore" : "mine",
  );
  const [exploreSort, setExploreSort] = useState<ChallengeSort>(
    sortParam && SORTS.includes(sortParam) ? sortParam : "LATEST",
  );

  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [createdThisMonth, setCreatedThisMonth] = useState(0);
  const [exploreItems, setExploreItems] = useState<ChallengeData[]>([]);
  const [explorePage, setExplorePage] = useState(0);
  const [exploreHasNext, setExploreHasNext] = useState(false);
  const [exploreLoading, setExploreLoading] = useState(false);

  // 탐색 탭/정렬을 URL 쿼리에 반영 → 상세에서 router.back() 시 그대로 복원
  const syncUrl = useCallback(
    (tab: "mine" | "explore", sort: ChallengeSort) => {
      const q = new URLSearchParams();
      if (tab === "explore") q.set("tab", "explore");
      if (sort !== "LATEST") q.set("sort", sort);
      const qs = q.toString();
      router.replace(qs ? `${ROUTES.challenge}?${qs}` : ROUTES.challenge, {
        scroll: false,
      });
    },
    [router],
  );

  const onMainTabChange = (tab: "mine" | "explore") => {
    setMainTab(tab);
    syncUrl(tab, exploreSort);
  };

  const onExploreSortChange = (sort: ChallengeSort) => {
    setExploreSort(sort);
    syncUrl(mainTab, sort);
  };

  const loadExplore = useCallback(
    (sort: ChallengeSort, page: number, append: boolean) => {
      setExploreLoading(true);
      fetchChallenges("ONGOING", sort, page, PAGE_SIZE)
        .then((res) => {
          const mapped = res.content.map(toChallengeData);
          setExploreItems((prev) => (append ? [...prev, ...mapped] : mapped));
          setExplorePage(res.page);
          setExploreHasNext(res.hasNext);
        })
        .catch(() => {})
        .finally(() => setExploreLoading(false));
    },
    [],
  );

  useEffect(() => {
    // 내 챌린지 베이스
    fetchChallenges("ONGOING")
      .then((res) => setChallenges(res.content.map(toChallengeData)))
      .catch(() => {});
    fetchCreationTickets()
      .then((t) => setCreatedThisMonth(MONTHLY_LIMIT - t.remaining))
      .catch(() => {});
  }, []);

  // 정렬 탭 바뀌면 첫 페이지부터 다시 로드
  useEffect(() => {
    loadExplore(exploreSort, 0, false);
  }, [exploreSort, loadExplore]);

  const onExploreLoadMore = () => {
    if (!exploreLoading && exploreHasNext)
      loadExplore(exploreSort, explorePage + 1, true);
  };

  // 탐색 목록에서 바로 참여 → 해당 카드만 "참여 중"으로 (낙관적 갱신)
  const onJoinChallenge = async (c: ChallengeData) => {
    try {
      await joinChallenge(c.id);
      setExploreItems((prev) =>
        prev.map((it) => (it.id === c.id ? { ...it, joined: true } : it)),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "참여에 실패했어요");
    }
  };

  return (
    <ChallengeCountHome
      mainTab={mainTab}
      onMainTabChange={onMainTabChange}
      challenges={challenges}
      createdThisMonth={createdThisMonth}
      exploreItems={exploreItems}
      exploreSort={exploreSort}
      exploreHasNext={exploreHasNext}
      exploreLoading={exploreLoading}
      onExploreSortChange={onExploreSortChange}
      onExploreLoadMore={onExploreLoadMore}
      onJoinChallenge={onJoinChallenge}
      onOpenChallenge={(challenge) =>
        router.push(ROUTES.challengeDetail(challenge.id))
      }
      onCreateChallenge={() => router.push(ROUTES.challengeNew)}
      onTab={(tab) => router.push(getTabHref(tab))}
    />
  );
}

export default function ChallengeHomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-cream-100">
          <p className="text-sm text-brown-soft">불러오는 중…</p>
        </div>
      }
    >
      <ChallengeHome />
    </Suspense>
  );
}
