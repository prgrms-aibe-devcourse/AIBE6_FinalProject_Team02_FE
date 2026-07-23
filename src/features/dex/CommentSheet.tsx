import React, { useState } from 'react';
import { BadgeId, BadgeMark } from '@/shared/ui/atoms/EquippedBadge';
import { Badge } from '@/shared/ui/atoms/Badge';
import { BottomSheet } from '@/shared/ui/molecules/BottomSheet';

export interface CommentItem {initial: string;name: string;time: string;body: string;badge?: BadgeId;}

interface Props {comments: CommentItem[];onClose: () => void;onPost: (body: string) => void;}

export function CommentSheet({ comments, onClose, onPost }: Props) {
  const [draft, setDraft] = useState('');
  const submit = () => {const body = draft.trim();if (!body) return;onPost(body);setDraft('');};

  return (
    <BottomSheet
      title={`댓글 ${comments.length}`}
      onClose={onClose}
      draggable
      maxHeightClass="max-h-[70%]">

      <div className="mt-3 shrink-0 border-t border-edge-default" />

      {comments.length === 0 ?
        <p className="px-5 py-10 text-center text-sm text-content-secondary">
          아직 댓글이 없어요. 첫 댓글을 남겨 보세요.
        </p> :
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {comments.map((comment, index) =>
            <article key={`${comment.name}-${index}`} className="flex gap-3">
              <Badge variant="member" className="h-9 w-9 border-0 text-sm" label={comment.name}>
                {comment.initial}
              </Badge>
              <div>
                <p className="flex items-center gap-1 text-sm">
                  <span className="font-bold text-content-primary">
                    {comment.badge && <BadgeMark badge={comment.badge} size={14} />} {comment.name}
                  </span>
                  <span className="text-xs text-content-secondary">{comment.time}</span>
                </p>
                <p className="mt-1 text-sm text-content-secondary">{comment.body}</p>
              </div>
            </article>
          )}
        </div>
      }

      <div className="flex shrink-0 items-center gap-3 border-t border-edge-default px-5 py-3 pb-6">
        <Badge variant="member" className="border-0" label="나">신</Badge>
        <input
          aria-label="댓글 입력"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {if (event.key === 'Enter') submit();}}
          placeholder="댓글 달기…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-content-muted" />

        <button
          type="button"
          disabled={!draft.trim()}
          onClick={submit}
          className="min-h-touch shrink-0 px-2 text-sm font-bold text-action-primary disabled:text-action-disabled-text">
          게시
        </button>
      </div>
    </BottomSheet>);

}
