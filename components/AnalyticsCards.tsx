import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';

interface AnalyticsCardsProps {
  className?: string;
}

const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ className = '' }) => {
  const [loading, setLoading] = useState(true);
  const [proposalTimeStats, setProposalTimeStats] = useState<any>(null);
  const [teamResponseStats, setTeamResponseStats] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [proposalTimes, teamResponses] = await Promise.all([
        analyticsAPI.getProposalTimes(),
        analyticsAPI.getTeamResponses()
      ]);

      setProposalTimeStats(proposalTimes);
      setTeamResponseStats(teamResponses);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {/* Average Proposal Time */}
      <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">Avg. Proposal Time</h3>
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div className="flex items-baseline">
          <p className="text-3xl font-bold text-gray-900">
            {proposalTimeStats?.summary?.averageTimeMinutes
              ? formatTime(proposalTimeStats.summary.averageTimeMinutes)
              : '0m'}
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {proposalTimeStats?.summary?.completedStages || 0} stages completed
        </p>
      </div>

      {/* Team Response Rate */}
      <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">Team Response Rate</h3>
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <div className="flex items-baseline">
          <p className="text-3xl font-bold text-gray-900">
            {teamResponseStats?.stats?.responseRate || 0}%
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {teamResponseStats?.stats?.accepted || 0} accepted,{' '}
          {teamResponseStats?.stats?.declined || 0} declined,{' '}
          {teamResponseStats?.stats?.pending || 0} pending
        </p>
      </div>

      {/* 48-Hour Response Rate */}
      <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">48hr Response Rate</h3>
          <svg
            className="w-5 h-5 text-purple-500"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div className="flex items-baseline">
          <p className="text-3xl font-bold text-gray-900">
            {teamResponseStats?.stats?.responseRate48Hours || 0}%
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {teamResponseStats?.stats?.respondedWithin48Hours || 0} responded within 48 hours
        </p>
        {teamResponseStats?.stats?.averageResponseTimeHours > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Avg: {teamResponseStats.stats.averageResponseTimeHours}h
          </p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCards;
