export interface Point {
  x: number;
  y: number;
}

export enum RequestStatus {
  Pending = 'pending',
  Matched = 'matched',
  Completed = 'completed',
}

export interface Request {
  id: string;
  location: Point;
  status: RequestStatus;
  createdAt: number; // timestamp
  poolId: string; // Changed from number for grid cell ID
}

export enum DriverStatus {
  Available = 'available',
  EnRouteToPickup = 'en-route-to-pickup',
  Busy = 'busy',
}

export interface Driver {
  id: string;
  location: Point;
  status: DriverStatus;
  targetLocation?: Point;
}

export interface Match {
  id: string;
  requestId: string;
  driverId: string;
  requestLocation: Point;
  driverLocation: Point;
  createdAt: number;
}

export interface Metrics {
  activeRequests: number;
  availableDrivers: number;
  totalMatches: number;
  averageWaitTime: number; // in seconds
  matchRate: number; // percentage
  totalWaitTime: number;
  matchedCount: number;
  totalRequestsCreated: number;
}

export type SimulationStatus = 'stopped' | 'running' | 'paused';

export type MatchingAlgorithm = 'Proximity';

export type PoolingStrategy = 'FixedWindow' | 'FlexibleWindow';

export interface SimulationParams {
  areaDimensions: { width: number; height: number };
  requestRate: number; // requests per minute
  driverSupply: number;
  poolingTime: number; // seconds
  matchingAlgorithm: MatchingAlgorithm;
  gridResolution: { rows: number; cols: number };
  poolingStrategy: PoolingStrategy;
}

export interface PoolVisualization {
  id: string; // e.g., 'cell-0-1'
  row: number;
  col: number;
  requestCount: number;
}

export interface SimulationState {
  status: SimulationStatus;
  requests: Request[];
  drivers: Driver[];
  matches: Match[];
  metrics: Metrics;
  logs: string[];
  poolVisualizations: PoolVisualization[];
}

export interface Pool {
  id: string; // Changed from number for grid cell ID
  createdAt: number;
  requests: string[];
}