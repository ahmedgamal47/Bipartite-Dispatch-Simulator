
import React from 'react';
import type { Metrics as MetricsType } from '../types';

interface MetricsProps {
  metrics: MetricsType;
}

const MetricItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-baseline p-2 bg-gray-700 rounded-md">
    <span className="text-sm text-gray-400">{label}</span>
    <span className="text-lg font-semibold text-white">{value}</span>
  </div>
);

export default function Metrics({ metrics }: MetricsProps) {
  return (
    <div className="space-y-3 pt-4 border-t border-gray-700">
      <h2 className="text-xl font-semibold text-center text-white mb-3">Metrics</h2>
      <MetricItem label="Active Requests" value={metrics.activeRequests} />
      <MetricItem label="Available Drivers" value={metrics.availableDrivers} />
      <MetricItem label="Total Matches" value={metrics.totalMatches} />
      <MetricItem label="Avg Wait Time" value={`${metrics.averageWaitTime.toFixed(1)}s`} />
      <MetricItem label="Match Rate" value={`${metrics.matchRate.toFixed(1)}%`} />
    </div>
  );
}
