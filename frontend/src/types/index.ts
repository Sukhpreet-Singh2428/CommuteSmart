// TypeScript interfaces for all CommuteSmart API responses and data models

export interface LiveStats {
  activeAlerts: number;
  verifiedAlerts: number;
  totalContributors: number;
  avgResponseTime: number;
}

export interface TrendingArea {
  area: string;
  level: 'High' | 'Medium' | 'Low' | 'Clear';
  alertCount: number;
}

export interface WeeklyProgress {
  week: string;
  pct: number;
}

export interface UserStats {
  points: number;
  carbonSaved: number;
  badges: string[];
  honestyScore: number;
  totalReports: number;
  verifiedReports: number;
  totalTrips: number;
  totalDistance: number;
  currentStreak: number;
  level: number;
  nextLevelXP: number;
  currentLevelXP: number;
  levelProgressPct: number;
  cleanAirRank: number;
  greenScore: string;
  weeklyProgress: WeeklyProgress[];
  treesEquivalent: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  points: number;
  carbonSaved: number;
  badges: string[];
  rank: number;
}

export interface AlertData {
  _id: string;
  id?: string;
  type: string;
  message: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  vehicleId?: string;
  upvotes: number;
  reportedBy: {
    _id: string;
    email: string;
    name?: string;
  };
  timeStamp: string;
  // Transformed fields for UI
  title?: string;
  description?: string;
  timeAgo?: string;
  reporter?: { email: string; name?: string };
  avatar?: string;
  icon?: string;
  iconColor?: string;
  verified?: boolean;
  comments?: number;
  liked?: boolean;
  createdAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PointsEarnedEvent {
  points: number;
  reason: string;
  total: number;
}

export interface BadgeEarnedEvent {
  badges: string[];
}
