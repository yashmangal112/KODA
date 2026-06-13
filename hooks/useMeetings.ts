import { useState, useCallback, useEffect, useRef  } from 'react';
import { getMeetings, getMeeting, getMeetingTranscript  } from '@/services/meetings';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage, isNetworkError } from '@/lib/apiErrors';
import { buildDateLabel } from '@/helper/utils';

export interface Meeting {
  id: string;
  title: string;
  type: 'team' | 'personal';
  status: 'recording' | 'processing' | 'done' | 'archived';
  dateLabel: string;
  participantCount: number;
  integrations: string[];
  actionItems?: { count: number; pending: number };
  summary: string;
  started_at: string;
  duration_seconds: number;
}

export interface UseMeetingsParams {
  filter?: 'all' | 'team' | 'personal';
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

export function useMeetings(params: UseMeetingsParams = {}) {
  const { filter = 'all', page = 1, limit = 20, autoFetch = true } = params;
  const toast = useToast();
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);


  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiParams: Record<string, any> = { page, limit };
      if (filter !== 'all') {
        apiParams.type = filter;
      }

      const rawMeetings = await getMeetings(apiParams);
      const meetingsList = Array.isArray(rawMeetings)
        ? rawMeetings
        : rawMeetings?.meetings
        ?? rawMeetings?.items
        ?? rawMeetings?.data
        ?? [];

      // Step 2 — normalize each item
      const normalized = meetingsList.map((m: any) => ({
        id: m.id ?? '',
        title: m.title ?? 'Untitled',
        type: m.type ?? 'personal',
        status: m.status ?? 'processing',
        dateLabel: buildDateLabel(m.started_at, m.ended_at, m.duration_seconds),
        participantCount: m.participants_count,
        integrations: Array.isArray(m.integrations) ? m.integrations : ['jira', 'slack', 'notes'],
        actionItemPendings: m.pending_action_items ?? 0
      }));

      // Step 3 — set state
      setMeetings(normalized);
      setTotalCount(rawMeetings?.total ?? normalized.length);
      setHasMore(normalized.length === limit);
    } catch (err) {
      if (isNetworkError(err)) return;
      const msg = getApiErrorMessage(err, 'Failed to load meetings.');
      setError(msg);
      toast.showError(msg);
    } finally {
      setLoading(false);
    }
  }, [filter, page, limit, toast]);

  useEffect(() => {
    if (autoFetch) {
      fetchMeetings();
    }
  }, [autoFetch, fetchMeetings]);

  return {
    meetings,
    loading,
    error,
    hasMore,
    totalCount,
    refetch: fetchMeetings,
  };
}

export function useMeeting(id: string) {
  const toast = useToast();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeeting = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getMeeting(id);
      const meetingData = data?.meeting;
      setMeeting(meetingData);
    } catch (err) {
      if (isNetworkError(err)) return;
      
      const msg = getApiErrorMessage(err, 'Failed to load meeting.');
      setError(msg);
      toast.showError(msg);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  return {
    meeting,
    loading,
    error,
    refetch: fetchMeeting,
  };
}


export interface TextRun {
  text: string;
  isAction?: boolean;
}

export interface TranscriptBlock {
  voice: string;
  time: string;
  runs: TextRun[];
}

export interface UseMeetingTranscriptParams {
  meetingId: string;
  meetingStatus?: string;
  enabled?: boolean;
  pollInterval?: number;
}

const ACTIVE_STATUSES = ['recording', 'processing'];

const transcriptCache = new Map<string, TranscriptBlock[]>();

export function useMeetingTranscript(params: UseMeetingTranscriptParams) {
  const { meetingId, meetingStatus, enabled = true, pollInterval = 30000 } = params;
  
  const toast = useToast();

  const [transcript, setTranscript] = useState<TranscriptBlock[]>(
    () => transcriptCache.get(meetingId) ?? []
  );

  // Only show loader if nothing cached yet
  const [loading, setLoading] = useState(
    () => !transcriptCache.has(meetingId)
  );

  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);


  const shouldPoll =
    enabled &&
    !!meetingId &&
    (!meetingStatus || ACTIVE_STATUSES.includes(meetingStatus));

  const fetchTranscript = useCallback(async (showLoading = true) => {
    if (!meetingId || !isMountedRef.current) return;
    
    if (showLoading && !transcriptCache.has(meetingId)) {
      setLoading(true);
    }
    setIsPolling(true);
    setError(null);
    
    try {
      const data = await getMeetingTranscript(meetingId);
      const transcriptData = data?.transcript ?? [];

      if (isMountedRef.current) {
        transcriptCache.set(meetingId, transcriptData);
        setTranscript(transcriptData);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (isNetworkError(err)) return;
      const msg = getApiErrorMessage(err, 'Failed to load transcript.');
      setError(msg);
      if (showLoading) toast.showError(msg);
    } finally {
      if (isMountedRef.current) {
        if (showLoading) {
          setLoading(false);
        }
        setIsPolling(false);
      }
    }
  }, [meetingId, toast]);


  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!meetingId || !enabled) {
      stopPolling();
      return;
    }

    const hasCached = transcriptCache.has(meetingId);
    fetchTranscript(!hasCached);

    if (shouldPoll) {
      intervalRef.current = setInterval(() => {
        fetchTranscript(false); // always silent for polls
      }, pollInterval);
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [enabled, meetingId, shouldPoll, pollInterval]);

  return {
    transcript,
    loading,
    isPolling,
    error,
    lastUpdated,
    refetch: () => fetchTranscript(true),
    stopPolling,
  };
}