// [여행기] 여행기 목록 화면의 데이터 처리: 불러오기 / 태그·검색 필터 / 삭제
import { useEffect, useMemo, useState } from 'react';
import { journalApi } from '../../../api/journalApi.js';
import { tagList } from '../../../data/hashtags.js';

// 제목·소개·장소·작성자·해시태그 중 하나라도 검색어를 포함하는지
function matchesKeyword(journal, keyword) {
  const searchable = [journal.j_title, journal.j_intro, journal.loc, journal.u_name, ...(journal.hashtags ?? [])];
  return searchable.some((value) => String(value ?? '').toLowerCase().includes(keyword));
}

export function useJournalList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tag, setTag] = useState('');
  const [query, setQuery] = useState('');
  const [removing, setRemoving] = useState(null);   // 삭제 확인창에 띄운 여행기
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadJournals = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await journalApi.getList();
        if (!cancelled) setList(result);
      } catch (err) {
        if (!cancelled) setError(err.message || '여행기 목록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadJournals();
    return () => { cancelled = true; };
  }, []);

  const shown = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return list.filter((journal) => {
      if (tag && !(journal.hashtags ?? []).includes(tag)) return false;
      return !keyword || matchesKeyword(journal, keyword);
    });
  }, [list, query, tag]);

  const allTags = useMemo(
    () => [...new Set([...tagList, ...list.flatMap((journal) => journal.hashtags ?? [])])],
    [list],
  );

  const removeJournal = async () => {
    if (!removing || deleting) return;
    setDeleting(true);
    setError('');
    try {
      await journalApi.remove(removing.j_id);
      setList((prev) => prev.filter((journal) => journal.j_id !== removing.j_id));
      setRemoving(null);
    } catch (err) {
      setError(err.message || '여행기를 삭제하지 못했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return { shown, allTags, loading, error, tag, setTag, query, setQuery, removing, setRemoving, deleting, removeJournal };
}
