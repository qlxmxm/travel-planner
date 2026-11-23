// [여행기 상세] 댓글: 작성 · 수정 · 삭제와 입력 중인 내용 보관.
import { useState } from 'react';
import { journalApi } from '../../../api/journalApi.js';

export default function useJournalComments({ journalId, userId, comments, setComments, action }) {
  const [content, setContent] = useState('');                    // 새 댓글 입력
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');      // 수정 중인 댓글 입력

  const addComment = (e) => {
    e.preventDefault();
    if (action.busy) return;
    if (userId == null) { action.setError('댓글을 작성하려면 로그인해 주세요.'); return; }
    if (!content.trim()) { action.setError('댓글 내용을 입력해 주세요.'); return; }

    action.run(async () => {
      const comment = await journalApi.addComment(journalId, content.trim());
      setComments((prev) => [...prev, comment]);
      setContent('');
    }, '댓글을 작성하지 못했습니다.');
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.jc_id);
    setEditingContent(comment.jc_content);
    action.setError('');
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const updateComment = (commentId) => {
    if (action.busy) return;
    if (!editingContent.trim()) { action.setError('댓글 내용을 입력해 주세요.'); return; }

    action.run(async () => {
      const updated = await journalApi.updateComment(commentId, editingContent.trim());
      setComments((prev) => prev.map((c) => (c.jc_id === commentId ? updated : c)));
      cancelEditComment();
    }, '댓글을 수정하지 못했습니다.');
  };

  const removeComment = (commentId) => {
    if (action.busy) return;
    if (!window.confirm('댓글을 삭제할까요?')) return;

    action.run(async () => {
      await journalApi.removeComment(commentId);
      setComments((prev) => prev.filter((c) => c.jc_id !== commentId));
    }, '댓글을 삭제하지 못했습니다.');
  };

  return {
    comments, content, setContent, editingCommentId, editingContent, setEditingContent,
    addComment, startEditComment, cancelEditComment, updateComment, removeComment,
  };
}
