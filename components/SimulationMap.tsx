import React from 'react';
import type { Request, Driver, Match, Point, PoolVisualization } from '../types';
import { RequestStatus, DriverStatus } from '../types';
import UserIcon from './icons/UserIcon';
import CarIcon from './icons/CarIcon';

interface SimulationMapProps {
  requests: Request[];
  drivers: Driver[];
  matches: Match[];
  area: { width: number; height: number };
  pools: PoolVisualization[];
  grid: { rows: number; cols: number };
}

const getStatusColor = (status: RequestStatus | DriverStatus) => {
  switch (status) {
    case RequestStatus.Pending: return 'text-yellow-400';
    case RequestStatus.Matched: return 'text-green-400';
    case DriverStatus.Available: return 'text-blue-400';
    case DriverStatus.EnRouteToPickup: return 'text-indigo-400';
    case DriverStatus.Busy: return 'text-red-400';
    default: return 'text-gray-500';
  }
};

const Entity: React.FC<{ point: Point; color: string; children: React.ReactNode }> = ({ point, color, children }) => (
  <div
    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out ${color}`}
    style={{ left: `${point.x}%`, top: `${point.y}%` }}
  >
    {children}
  </div>
);

export default function SimulationMap({ requests, drivers, matches, area, pools, grid }: SimulationMapProps) {
  const { rows, cols } = grid;
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;

  const activePoolsMap = new Map(pools.map(p => [p.id, p]));
  const gridCells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellId = `cell-${r}-${c}`;
      const pool = activePoolsMap.get(cellId);
      const isActive = !!pool && pool.requestCount > 0;
      
      gridCells.push(
        <div
          key={cellId}
          className={`absolute border border-gray-700/50 transition-colors duration-300 pointer-events-none ${isActive ? 'bg-blue-500 bg-opacity-20' : 'bg-transparent'}`}
          style={{
            left: `${c * cellWidth}%`,
            top: `${r * cellHeight}%`,
            width: `${cellWidth}%`,
            height: `${cellHeight}%`,
          }}
        >
          {isActive && (
            <span className="absolute top-1 left-1 text-xs font-bold text-blue-300 bg-gray-900 bg-opacity-50 px-1.5 py-0.5 rounded">
              Pool ({pool.requestCount})
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div className="w-full h-full relative bg-gray-900">
      {/* Static Grid & Pool Highlights */}
      {gridCells}

      {/* Requests */}
      {requests.filter(r => r.status === RequestStatus.Pending).map((req) => (
        <Entity key={req.id} point={req.location} color={getStatusColor(req.status)}>
          <UserIcon className="w-4 h-4" />
        </Entity>
      ))}

      {/* Drivers */}
      {drivers.map((driver) => (
        <Entity key={driver.id} point={driver.location} color={getStatusColor(driver.status)}>
            <CarIcon className="w-5 h-5" />
        </Entity>
      ))}
      
      {/* Matches as SVG lines */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ width: '100%', height: '100%' }}>
        <defs>
            <marker id="arrowhead" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto">
                <polygon points="0 0, 5 1.75, 0 3.5" fill="#818cf8" />
            </marker>
        </defs>
        {matches.map((match) => (
          <line
            key={match.id}
            x1={`${match.driverLocation.x}%`}
            y1={`${match.driverLocation.y}%`}
            x2={`${match.requestLocation.x}%`}
            y2={`${match.requestLocation.y}%`}
            stroke="#818cf8" // indigo-400
            strokeWidth="1.5"
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
            className="animate-pulse"
          />
        ))}
      </svg>
    </div>
  );
}
