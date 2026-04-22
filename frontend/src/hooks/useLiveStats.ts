import { useState, useEffect, useCallback, useRef } from 'react';
import { statsAPI, leaderboardAPI } from '../lib/api';
import { useSocket } from './useSocket';
import type { LiveStats, TrendingArea, LeaderboardEntry } from '../types';

/**
 * Hook to fetch and maintain live community statistics.
 * Polls every 30 seconds and updates via socket events.
 */
export function useLiveStats() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { on, off } = useSocket();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await statsAPI.getLiveStats();
      if (response.data.success && response.data.stats) {
        setStats(response.data.stats);
        setError(null);
      }
    } catch (err) {
      console.warn('Failed to fetch live stats:', err);
      setError('Unable to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStats]);

  // Real-time increments via socket
  useEffect(() => {
    const handleNewAlert = () => {
      setStats(s => s ? { ...s, activeAlerts: s.activeAlerts + 1 } : s);
    };
    const cleanupNew = on('newAlert', handleNewAlert);

    return () => {
      if (cleanupNew) cleanupNew();
    };
  }, [on]);

  return { stats, loading, error, refetch: fetchStats };
}

/**
 * Hook to fetch trending areas.
 * Polls every 2 minutes.
 */
export function useTrendingAreas() {
  const [areas, setAreas] = useState<TrendingArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrending = useCallback(async () => {
    try {
      const response = await statsAPI.getTrendingAreas();
      if (response.data.success && response.data.trending) {
        setAreas(response.data.trending);
        setError(null);
      }
    } catch (err) {
      console.warn('Failed to fetch trending areas:', err);
      setError('Unable to load trending areas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
    intervalRef.current = setInterval(fetchTrending, 120000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchTrending]);

  return { areas, loading, error, refetch: fetchTrending };
}

/**
 * Hook to fetch top contributors from leaderboard.
 * Polls every 60 seconds.
 */
export function useTopContributors(limit: number = 3) {
  const [contributors, setContributors] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchContributors = useCallback(async () => {
    try {
      const response = await leaderboardAPI.getLeaderboard(limit);
      if (response.data.success && response.data.leaderboard) {
        setContributors(response.data.leaderboard);
        setError(null);
      }
    } catch (err) {
      console.warn('Failed to fetch contributors:', err);
      setError('Unable to load contributors');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchContributors();
    intervalRef.current = setInterval(fetchContributors, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchContributors]);

  return { contributors, loading, error, refetch: fetchContributors };
}
