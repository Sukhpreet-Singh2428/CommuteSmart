import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../lib/api';
import { useSocket } from './useSocket';
import { useAuth } from '../context/AuthContext';
import type { UserStats, PointsEarnedEvent, BadgeEarnedEvent } from '../types';

/**
 * Hook to fetch and maintain user-specific stats for the Profile page.
 * Re-fetches when points:earned socket event fires.
 */
export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointsAnimation, setPointsAnimation] = useState<{ points: number; reason: string } | null>(null);
  const { on, emit } = useSocket();
  const { user, updateUser } = useAuth();

  const fetchStats = useCallback(async () => {
    try {
      const response = await userAPI.getStats();
      if (response.data.success && response.data.stats) {
        setStats(response.data.stats);
        setError(null);
      }
    } catch (err) {
      console.warn('Failed to fetch user stats:', err);
      setError('Unable to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Join personal socket room when user is authenticated
  useEffect(() => {
    if (user?.id) {
      emit('join:personal', { userId: user.id });
    }
  }, [user?.id, emit]);

  // Listen for points:earned events
  useEffect(() => {
    const handlePointsEarned = (data: unknown) => {
      const event = data as PointsEarnedEvent;
      // Show floating animation
      setPointsAnimation({ points: event.points, reason: event.reason });
      setTimeout(() => setPointsAnimation(null), 2000);

      // Update user context
      updateUser({ points: event.total });

      // Re-fetch full stats
      fetchStats();
    };

    const cleanupPoints = on('points:earned', handlePointsEarned);

    return () => {
      if (cleanupPoints) cleanupPoints();
    };
  }, [on, updateUser, fetchStats]);

  // Listen for badge:earned events
  useEffect(() => {
    const handleBadgeEarned = (data: unknown) => {
      const event = data as BadgeEarnedEvent;
      // Update user context badges
      if (user?.badges) {
        updateUser({ badges: [...user.badges, ...event.badges] });
      }
      // Re-fetch full stats
      fetchStats();
    };

    const cleanupBadges = on('badge:earned', handleBadgeEarned);

    return () => {
      if (cleanupBadges) cleanupBadges();
    };
  }, [on, user?.badges, updateUser, fetchStats]);

  return { stats, loading, error, pointsAnimation, refetch: fetchStats };
}
