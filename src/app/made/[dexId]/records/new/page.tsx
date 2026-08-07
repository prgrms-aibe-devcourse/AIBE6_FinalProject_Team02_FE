'use client'

import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation'
import { RecordForm } from '@/features/made/RecordForm'
import { parseMadeDexId } from '@/features/made/types'
import { ROUTES } from '@/shared/lib/routes'

/** `/made/[dexId]/records/new` 식사 기록 */
export default function NewRecordPage() {
    const router = useRouter()
    const params = useParams<{ dexId: string }>()
    const search = useSearchParams()

    const dexId = parseMadeDexId(params.dexId)
    if (!dexId) notFound()

    // 슬롯 카드로 들어오면 끼니가 정해져 있고, 하단 CTA로 들어오면 화면에서 고른다
    const slotId = Number(search.get('slotId'))
    const date = search.get('date') ?? undefined

    return (
        <RecordForm
            madeDexId={dexId}
            slotId={Number.isSafeInteger(slotId) && slotId > 0 ? slotId : undefined}
            date={date ?? ''}
            onBack={() => router.back()}
            onDone={() => router.replace(ROUTES.madeDex(dexId))}
        />
    )
}
