import { useEffect, useId, useRef, useState } from 'react';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ConfirmDialog from '../ui/ConfirmDialog';
import FormField from '../ui/FormField';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import { getSessionUser } from '../../constants/systemUsers';
import { queryKeys } from '../../services/queryKeys';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';
import type { PurchaseOrderCommentApiDto } from '../../types/api/purchasingApi';

interface PoCommentsPanelProps {
  poCode: string;
  canComment: boolean;
}

function authorInitial(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  return t.charAt(0).toLocaleUpperCase('vi-VN');
}

export default function PoCommentsPanel({ poCode, canComment }: PoCommentsPanelProps) {
  const titleId = useId();
  const qc = useQueryClient();
  const me = getSessionUser();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrderCommentApiDto | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const commentsQ = useQuery({
    queryKey: queryKeys.purchaseOrders.comments(poCode),
    queryFn: () => purchaseOrdersService.listComments(poCode),
    enabled: Boolean(poCode),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.comments(poCode) });
  };

  const createMut = useMutation({
    mutationFn: (body: string) => purchaseOrdersService.createComment(poCode, body),
    onSuccess: () => {
      setDraft('');
      invalidate();
      showToast('success', 'Đã gửi bình luận.');
    },
    onError: (err) => {
      showToast('error', getApiErrorMessage(err, 'Không gửi được bình luận.'));
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      purchaseOrdersService.updateComment(poCode, id, body),
    onSuccess: () => {
      setEditingId(null);
      setEditDraft('');
      invalidate();
      showToast('success', 'Đã cập nhật bình luận.');
    },
    onError: (err) => {
      showToast('error', getApiErrorMessage(err, 'Không sửa được bình luận.'));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => purchaseOrdersService.deleteComment(poCode, id),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
      showToast('success', 'Đã xóa bình luận.');
    },
    onError: (err) => {
      showToast('error', getApiErrorMessage(err, 'Không xóa được bình luận.'));
    },
  });

  const comments = commentsQ.data ?? [];

  useEffect(() => {
    if (comments.length === 0) return;
    listEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [comments.length]);

  const submit = () => {
    const body = draft.trim();
    if (!body || createMut.isPending) return;
    createMut.mutate(body);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const body = editDraft.trim();
    if (!body || updateMut.isPending) return;
    updateMut.mutate({ id: editingId, body });
  };

  const canModerate = Boolean(me?.permissions?.includes('purchasing.orders.update'));

  return (
    <section className="pur-detail__card po-comments-panel" aria-labelledby={titleId}>
      <header className="po-comments-panel__head">
        <div className="po-comments-panel__title-row">
          <MessageSquare size={16} strokeWidth={1.75} className="po-comments-panel__icon" aria-hidden />
          <h2 id={titleId} className="po-comments-panel__title">
            Bình luận
            {commentsQ.isSuccess ? (
              <span className="po-comments-panel__count">({comments.length})</span>
            ) : null}
          </h2>
        </div>
        <p className="po-comments-panel__hint">Lưu trên đơn hàng - không mất khi thoát trang.</p>
      </header>

      {commentsQ.isError ? (
        <div className="po-comments-thread po-comments-thread--error" role="alert">
          <p className="po-comments-thread__msg">
            {getApiErrorMessage(commentsQ.error, 'Không tải được bình luận.')}
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { void commentsQ.refetch(); }}>
            Thử lại
          </button>
        </div>
      ) : commentsQ.isLoading ? (
        <div className="po-comments-thread" aria-busy="true" aria-label="Đang tải bình luận">
          {[0, 1, 2].map((i) => (
            <div key={i} className="po-comments-skel">
              <div className="po-comments-skel__avatar" />
              <div className="po-comments-skel__lines">
                <span className="po-comments-skel__line po-comments-skel__line--sm" />
                <span className="po-comments-skel__line" />
                <span className="po-comments-skel__line po-comments-skel__line--mid" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="po-comments-thread po-comments-thread--empty" role="status">
          <p className="po-comments-thread__msg">Chưa có bình luận. Ghi chú trao đổi sẽ hiện ở đây.</p>
        </div>
      ) : (
        <ul className="po-comments-list">
          {comments.map((c) => {
            const isMine = me?.id === c.authorUserId;
            const canEdit = isMine;
            const canDelete = isMine || canModerate;
            const isEditing = editingId === c.id;

            return (
              <li key={c.id} className="po-comments-item">
                <div className="po-comments-item__avatar" aria-hidden>
                  {authorInitial(c.authorName)}
                </div>
                <div className="po-comments-item__main">
                  <div className="po-comments-item__meta">
                    <span className="po-comments-item__author">{c.authorName}</span>
                    <time className="po-comments-item__time" dateTime={c.createdAt}>
                      {formatDateTimeVi(c.createdAt) ?? c.createdAt}
                      {c.updatedAt ? ' (đã sửa)' : ''}
                    </time>
                  </div>

                  {isEditing ? (
                    <div className="po-comments-compose po-comments-compose--inline">
                      <FormField label="Sửa bình luận">
                        <textarea
                          className="form-input po-comments-compose__input"
                          rows={3}
                          maxLength={4000}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          disabled={updateMut.isPending}
                        />
                      </FormField>
                      <div className="po-comments-compose__bar">
                        <span className="po-comments-compose__helper" />
                        <div className="po-comments-compose__actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={updateMut.isPending}
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft('');
                            }}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={updateMut.isPending || !editDraft.trim()}
                            onClick={saveEdit}
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="po-comments-item__body">{c.body}</p>
                  )}

                  {!isEditing && (canEdit || canDelete) ? (
                    <div className="po-comments-item__actions">
                      {canEdit ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          aria-label="Sửa bình luận"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditDraft(c.body);
                          }}
                        >
                          <Pencil size={14} strokeWidth={1.75} aria-hidden />
                          Sửa
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          aria-label="Xóa bình luận"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                          Xóa
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={listEndRef} />

      {canComment ? (
        <div className="po-comments-compose">
          <FormField label="Thêm bình luận">
            <textarea
              className="form-input po-comments-compose__input"
              rows={4}
              maxLength={4000}
              placeholder="Nội dung trao đổi về đơn hàng"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={createMut.isPending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </FormField>
          <div className="po-comments-compose__bar">
            <p className="po-comments-compose__helper">Ctrl+Enter để gửi. Tối đa 4000 ký tự.</p>
            <div className="po-comments-compose__actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={createMut.isPending || !draft.trim()}
                onClick={submit}
              >
                {createMut.isPending ? 'Đang gửi…' : 'Gửi'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate(deleteTarget.id);
        }}
        title="Xóa bình luận"
        message="Bình luận sẽ bị ẩn khỏi đơn hàng. Bạn có chắc muốn xóa?"
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="danger"
      />
    </section>
  );
}
