import { useCallback, useEffect, useState } from 'react'
import { MAX_PHOTOS, putToS3, requestUploadTargets, validatePhotoFile } from '@/shared/lib/upload'
import { createRecord, fetchRecord, fetchSlots, updateRecord } from './logitApi'
import { madeErrorMessage } from './errors'
import { RECORD_MAX_PHOTOS, timeLabel } from './logitTypes'
import { newPhotoId, newPhotosOf, readyCount, updatePayloadOf } from './recordPhotos'
import type { LogitSlot } from './logitTypes'
import type { RecordPhoto } from './recordPhotos'
import type { MadeDexId } from './types'

interface Options {
    madeDexId: MadeDexId
    /** 수정이면 기록 id. 신규면 null */
    recordId: number | null
    /** 하단 CTA로 들어오면 비어 있고, 슬롯 카드로 들어오면 정해져 있다 */
    initialSlotId: number | null
    initialDate: string
}

export function useRecordForm({ madeDexId, recordId, initialSlotId, initialDate }: Options) {
    const [slots, setSlots] = useState<LogitSlot[]>([])
    const [slotId, setSlotId] = useState<number | null>(initialSlotId)
    const [loggedOn, setLoggedOn] = useState(initialDate)
    const [photos, setPhotos] = useState<RecordPhoto[]>([])
    // `HH:mm`. 비어 있으면 시각을 남기지 않는다
    const [loggedTime, setLoggedTime] = useState('')

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 숨긴 슬롯에는 새로 쓸 수 없다. 고를 수 있는 것만 보여 준다
    const selectable = slots.filter((slot) => !slot.hidden)

    useEffect(() => {
        let live = true
        setLoading(true)

        const load = async () => {
            const [allSlots, record] = await Promise.all([
                fetchSlots(madeDexId),
                recordId === null ? Promise.resolve(null) : fetchRecord(madeDexId, recordId),
            ])
            if (!live) return

            setSlots(allSlots)
            if (record) {
                setSlotId(record.slotId)
                setLoggedOn(record.loggedOn)
                setLoggedTime(record.loggedAt ? timeLabel(record.loggedAt) : '')
                setPhotos(
                    record.photos.map((photo) => ({
                        id: newPhotoId(),
                        kind: 'kept' as const,
                        photoId: photo.photoId,
                        url: photo.url,
                        caption: photo.caption ?? '',
                    })),
                )
            }
        }

        load()
            .catch((failure) => {
                if (live) setError(madeErrorMessage(failure, '기록을 불러오지 못했어요.'))
            })
            .finally(() => {
                if (live) setLoading(false)
            })

        return () => {
            live = false
        }
    }, [madeDexId, recordId])

    // 미리보기 blob URL은 두면 페이지를 떠나도 메모리에 남는다
    useEffect(() => {
        return () => {
            setPhotos((current) => {
                current.forEach((photo) => {
                    if (photo.kind === 'new') URL.revokeObjectURL(photo.previewUrl)
                })
                return current
            })
        }
    }, [])

    const upload = useCallback(async (items: Array<{ id: string; file: File }>) => {
        try {
            const targets = await requestUploadTargets(
                items.map((item) => item.file),
                'logit-record',
            )
            await Promise.all(
                items.map(async (item, index) => {
                    const target = targets[index]
                    try {
                        await putToS3(item.file, item.file.type, target)
                        setPhotos((current) =>
                            current.map((photo) =>
                                photo.id === item.id && photo.kind === 'new'
                                    ? { ...photo, status: 'done', key: target.key }
                                    : photo,
                            ),
                        )
                    } catch (failure) {
                        setPhotos((current) =>
                            current.map((photo) =>
                                photo.id === item.id && photo.kind === 'new'
                                    ? { ...photo, status: 'failed', error: String(failure) }
                                    : photo,
                            ),
                        )
                    }
                }),
            )
        } catch (failure) {
            // presign 자체가 실패하면 이 묶음 전부가 실패다
            const ids = new Set(items.map((item) => item.id))
            setPhotos((current) =>
                current.map((photo) =>
                    ids.has(photo.id) && photo.kind === 'new' ? { ...photo, status: 'failed' } : photo,
                ),
            )
            setError(madeErrorMessage(failure, '사진을 올리지 못했어요.'))
        }
    }, [])

    const addFiles = useCallback(
        (files: File[]) => {
            setError(null)

            const invalid = files.map(validatePhotoFile).find(Boolean)
            if (invalid) {
                setError(invalid)
                return
            }

            setPhotos((current) => {
                // 한 번에 보낼 수 있는 장수도 서버가 막으므로 둘 중 작은 쪽을 따른다
                const room = Math.min(RECORD_MAX_PHOTOS, MAX_PHOTOS['logit-record']) - current.length
                if (room <= 0) return current

                const accepted = files.slice(0, room).map((file) => ({
                    id: newPhotoId(),
                    kind: 'new' as const,
                    status: 'uploading' as const,
                    file,
                    previewUrl: URL.createObjectURL(file),
                    caption: '',
                }))
                void upload(accepted.map((photo) => ({ id: photo.id, file: photo.file })))
                return [...current, ...accepted]
            })
        },
        [upload],
    )

    const writeCaption = (id: string, caption: string) => {
        setPhotos((current) => current.map((photo) => (photo.id === id ? { ...photo, caption } : photo)))
    }

    const removePhoto = (id: string) => {
        setPhotos((current) => {
            const target = current.find((photo) => photo.id === id)
            if (target?.kind === 'new') URL.revokeObjectURL(target.previewUrl)
            return current.filter((photo) => photo.id !== id)
        })
    }

    const retryPhoto = (id: string) => {
        setPhotos((current) => {
            const target = current.find((photo) => photo.id === id)
            if (target?.kind !== 'new') return current
            void upload([{ id, file: target.file }])
            return current.map((photo) =>
                photo.id === id && photo.kind === 'new' ? { ...photo, status: 'uploading' } : photo,
            )
        })
    }

    const submit = async (): Promise<boolean> => {
        setSubmitting(true)
        setError(null)
        try {
            const common = {
                slotId: slotId as number,
                loggedOn,
                // 서버는 LocalTime을 받는다. 비었으면 시각을 남기지 않는다
                loggedTime: loggedTime || null,
                foodNames: [],
                locationName: null,
                lat: null,
                lng: null,
            }
            if (recordId === null) {
                await createRecord(madeDexId, { ...common, photos: newPhotosOf(photos) })
            } else {
                await updateRecord(madeDexId, recordId, { ...common, ...updatePayloadOf(photos) })
            }
            return true
        } catch (failure) {
            setError(madeErrorMessage(failure, '기록을 남기지 못했어요.'))
            return false
        } finally {
            setSubmitting(false)
        }
    }

    // 올리는 중인 사진을 세면 상한을 넘긴 채로 제출된다
    const ready = slotId !== null && readyCount(photos) > 0

    return {
        slots: selectable,
        slotId,
        setSlotId,
        loggedOn,
        loggedTime,
        setLoggedTime,
        photos,
        loading,
        submitting,
        error,
        ready,
        addFiles,
        writeCaption,
        removePhoto,
        retryPhoto,
        submit,
    }
}
