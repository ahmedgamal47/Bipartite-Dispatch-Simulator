import { useState, useRef, useCallback, useEffect } from 'react';
import type { SimulationParams, SimulationState, Request, Driver, Point, Pool, Match, PoolVisualization, PoolingStrategy } from '../types';
import { RequestStatus, DriverStatus } from '../types';
import { solveAssignmentProblem } from '../services/assignmentSolver';

const INITIAL_PARAMS: SimulationParams = {
  areaDimensions: { width: 100, height: 100 },
  requestRate: 60,
  driverSupply: 50,
  poolingTime: 5,
  matchingAlgorithm: 'Proximity',
  gridResolution: { rows: 4, cols: 4 },
  poolingStrategy: 'FixedWindow',
};

const INITIAL_STATE: SimulationState = {
  status: 'stopped',
  requests: [],
  drivers: [],
  matches: [],
  metrics: {
    activeRequests: 0,
    availableDrivers: 0,
    totalMatches: 0,
    averageWaitTime: 0,
    matchRate: 0,
    totalWaitTime: 0,
    matchedCount: 0,
    totalRequestsCreated: 0,
  },
  logs: ['Simulation initialized.'],
  poolVisualizations: [],
};

const SIMULATION_TICK_MS = 250; // Run simulation logic 4 times a second
const ENTITY_MOVE_DISTANCE = 0.5; // Controls driver movement speed

export function useSimulation(overrideParams?: Partial<SimulationParams>) {
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    ...INITIAL_PARAMS,
    ...overrideParams,
  });
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);
  
  const simulationInterval = useRef<number | null>(null);
  const requestsRef = useRef<Request[]>(state.requests);
  const driversRef = useRef<Driver[]>(state.drivers);
  const matchesRef = useRef<Match[]>(state.matches);
  const poolsRef = useRef<Map<string, Pool>>(new Map());
  const nextId = useRef(0);
  const metricsRef = useRef(state.metrics);

  useEffect(() => {
    requestsRef.current = state.requests;
    driversRef.current = state.drivers;
    matchesRef.current = state.matches;
    metricsRef.current = state.metrics;
  }, [state]);

  const addLog = useCallback((message: string) => {
    setState(prevState => ({
      ...prevState,
      logs: [...prevState.logs.slice(-100), message],
    }));
  }, []);

  const generateRandomPoint = useCallback((): Point => ({
    x: Math.random() * simulationParams.areaDimensions.width,
    y: Math.random() * simulationParams.areaDimensions.height,
  }), [simulationParams.areaDimensions]);

  const runMatchingLogic = useCallback(async () => {
    const now = Date.now();
    // FIX: Explicitly type `pool` to resolve type inference issue.
    const readyPools = Array.from(poolsRef.current.values()).filter((pool: Pool) => (now - pool.createdAt) >= simulationParams.poolingTime * 1000);

    if (readyPools.length === 0) return;

    for (const pool of readyPools) {
      const availableDrivers = driversRef.current.filter((d: Driver) => d.status === DriverStatus.Available);
      // FIX: Explicitly type `r` to resolve type inference issue.
      const allPoolRequests = requestsRef.current.filter((r: Request) => r.poolId === pool.id && r.status === RequestStatus.Pending);
      
      let requestsToMatch: Request[] = [];

      if (simulationParams.poolingStrategy === 'FlexibleWindow') {
        const cutoffTime = pool.createdAt + (simulationParams.poolingTime * 1000 * 0.8);
        // FIX: Explicitly type `r` to resolve type inference issue.
        requestsToMatch = allPoolRequests.filter((r: Request) => r.createdAt <= cutoffTime);
      } else { // FixedWindow
        requestsToMatch = allPoolRequests;
      }

      const assignments = (availableDrivers.length > 0 && requestsToMatch.length > 0) 
        ? solveAssignmentProblem(requestsToMatch, availableDrivers)
        : [];
      
      if (assignments.length > 0) {
        addLog(`Pool ${pool.id}: Matching for ${requestsToMatch.length} requests, found ${assignments.length} pairs.`);
      }

      const newMatches: Match[] = [];
      const matchedRequestIds = new Set<string>();
      const matchedDriverIds = new Set<string>();

      assignments.forEach(({ requestIndex, driverIndex }) => {
        const request = requestsToMatch[requestIndex];
        const driver = availableDrivers[driverIndex];

        if (!request || !driver || matchedRequestIds.has(request.id) || matchedDriverIds.has(driver.id)) return;

        matchedRequestIds.add(request.id);
        matchedDriverIds.add(driver.id);
        
        const newMatch: Match = {
          id: `m-${nextId.current++}`,
          requestId: request.id,
          driverId: driver.id,
          requestLocation: request.location,
          driverLocation: driver.location,
          createdAt: now,
        };
        newMatches.push(newMatch);
        const waitTime = (now - request.createdAt) / 1000;
        
        metricsRef.current = {
          ...metricsRef.current,
          totalMatches: metricsRef.current.totalMatches + 1,
          matchedCount: metricsRef.current.matchedCount + 1,
          totalWaitTime: metricsRef.current.totalWaitTime + waitTime,
        };
        
        addLog(`✅ Match: Rider ${request.id.slice(-4)} <> Driver ${driver.id.slice(-4)}. Wait: ${waitTime.toFixed(1)}s`);
      });

      // FIX: Explicitly type `r` to resolve type inference issues.
      requestsRef.current = requestsRef.current.map((r: Request) => matchedRequestIds.has(r.id) ? { ...r, status: RequestStatus.Matched } : r);
      // FIX: Explicitly type `d` and `m` to resolve type inference issues.
      driversRef.current = driversRef.current.map((d: Driver) => {
        if(matchedDriverIds.has(d.id)) {
            const match = newMatches.find((m: Match) => m.driverId === d.id);
            return {...d, status: DriverStatus.EnRouteToPickup, targetLocation: match?.requestLocation}
        }
        return d;
      });
      matchesRef.current.push(...newMatches);

      // Handle re-queuing for any requests in the pool that were not matched
      // FIX: Explicitly type `r` to resolve type inference issues.
      const unmatchedRequestsInPool = allPoolRequests.filter((r: Request) => !matchedRequestIds.has(r.id));
      poolsRef.current.delete(pool.id);

      if (unmatchedRequestsInPool.length > 0) {
        // FIX: Explicitly type `r` in map to resolve type inference issues.
        const newPool = { id: pool.id, createdAt: now, requests: unmatchedRequestsInPool.map((r: Request) => r.id) };
        poolsRef.current.set(pool.id, newPool);
        addLog(`Pool ${pool.id}: Re-queuing ${unmatchedRequestsInPool.length} request(s) for the next cycle.`);
      }
    }
  }, [addLog, simulationParams.poolingTime, simulationParams.poolingStrategy]);
  
  const simulationTick = useCallback(() => {
    const now = Date.now();
    const tickSeconds = SIMULATION_TICK_MS / 1000;
    
    // 1. Generate new requests
    const requestsPerSecond = simulationParams.requestRate / 60;
    if (Math.random() < requestsPerSecond * tickSeconds) {
      const newRequest: Request = {
        id: `r-${nextId.current++}`,
        location: generateRandomPoint(),
        status: RequestStatus.Pending,
        createdAt: now,
        poolId: '',
      };
      
      const { rows, cols } = simulationParams.gridResolution;
      const cellWidth = simulationParams.areaDimensions.width / cols;
      const cellHeight = simulationParams.areaDimensions.height / rows;

      const cellCol = Math.min(cols - 1, Math.floor(newRequest.location.x / cellWidth));
      const cellRow = Math.min(rows - 1, Math.floor(newRequest.location.y / cellHeight));
      const cellId = `cell-${cellRow}-${cellCol}`;

      let pool = poolsRef.current.get(cellId);
      if (!pool) {
          pool = { id: cellId, createdAt: now, requests: [] };
          poolsRef.current.set(cellId, pool);
          addLog(`💡 New pool activated in grid cell [${cellRow}, ${cellCol}].`);
      }
      pool.requests.push(newRequest.id);
      newRequest.poolId = cellId;

      requestsRef.current.push(newRequest);
      metricsRef.current = {
          ...metricsRef.current,
          totalRequestsCreated: metricsRef.current.totalRequestsCreated + 1,
      };
      addLog(`🚀 New request #${newRequest.id.slice(-4)} in pool ${cellId}.`);
    }

    // 2. Manage driver supply
    while (driversRef.current.length < simulationParams.driverSupply) {
      const newDriver: Driver = { id: `d-${nextId.current++}`, location: generateRandomPoint(), status: DriverStatus.Available };
      driversRef.current.push(newDriver);
    }
    if (driversRef.current.length > simulationParams.driverSupply) {
      driversRef.current.length = simulationParams.driverSupply;
    }

    // 3. Move drivers
    // FIX: Explicitly type `driver` to resolve type inference issues.
    driversRef.current.forEach((driver: Driver) => {
        if(driver.status === DriverStatus.EnRouteToPickup && driver.targetLocation) {
             const dx = driver.targetLocation.x - driver.location.x;
             const dy = driver.targetLocation.y - driver.location.y;
             const dist = Math.sqrt(dx * dx + dy * dy);
             if (dist < ENTITY_MOVE_DISTANCE) { // Arrived
                driver.status = DriverStatus.Busy;
                driver.targetLocation = undefined;
                
                // FIX: Explicitly type `m` to resolve type inference issues.
                const match = matchesRef.current.find((m: Match) => m.driverId === driver.id);
                if (match) {
                    // FIX: Explicitly type `r` to resolve type inference issues.
                    requestsRef.current = requestsRef.current.map((r: Request) => r.id === match.requestId ? {...r, status: RequestStatus.Completed} : r);
                    // FIX: Explicitly type `m` to resolve type inference issues.
                    matchesRef.current = matchesRef.current.filter((m: Match) => m.id !== match.id);
                    addLog(`🤝 Driver ${driver.id.slice(-4)} picked up Rider ${match.requestId.slice(-4)}.`);
                    // Simulate trip, make driver available again
                    setTimeout(() => {
                        // FIX: Explicitly type `dr` to resolve type inference issues.
                        const d = driversRef.current.find((dr: Driver) => dr.id === driver.id);
                        if (d) d.status = DriverStatus.Available;
                    }, 5000 + Math.random() * 5000);
                }
             } else {
                 driver.location.x += (dx / dist) * ENTITY_MOVE_DISTANCE * 2; // Move faster when en-route
                 driver.location.y += (dy / dist) * ENTITY_MOVE_DISTANCE * 2;
             }
        } else if (driver.status === DriverStatus.Available) {
            // Random walk
            driver.location.x += (Math.random() - 0.5) * ENTITY_MOVE_DISTANCE;
            driver.location.y += (Math.random() - 0.5) * ENTITY_MOVE_DISTANCE;
            driver.location.x = Math.max(0, Math.min(simulationParams.areaDimensions.width, driver.location.x));
            driver.location.y = Math.max(0, Math.min(simulationParams.areaDimensions.height, driver.location.y));
        }
    });
    
    // 4. Clean up completed requests
    // FIX: Explicitly type `r` to resolve type inference issues.
    requestsRef.current = requestsRef.current.filter((r: Request) => r.status !== RequestStatus.Completed);
    
    // 5. Run matching
    runMatchingLogic();

    // 6. Update metrics and visualizations
    // FIX: Explicitly type `r` to resolve type inference issues.
    const activeRequests = requestsRef.current.filter((r: Request) => r.status === RequestStatus.Pending).length;
    // FIX: Explicitly type `d` to resolve type inference issues.
    const availableDrivers = driversRef.current.filter((d: Driver) => d.status === DriverStatus.Available).length;
    const { totalWaitTime, matchedCount, totalRequestsCreated } = metricsRef.current;
    const averageWaitTime = matchedCount > 0 ? totalWaitTime / matchedCount : 0;
    const matchRate = totalRequestsCreated > 0 ? (matchedCount / totalRequestsCreated) * 100 : 0;

    // FIX: Explicitly type `pool` to resolve type inference issues.
    const poolVisualizations: PoolVisualization[] = Array.from(poolsRef.current.values()).map((pool: Pool) => {
      const [_, row, col] = pool.id.split('-').map(Number);
      // FIX: Explicitly type `r` to resolve type inference issues.
      const poolRequests = requestsRef.current.filter((r: Request) => r.poolId === pool.id && r.status === RequestStatus.Pending);
      if (poolRequests.length === 0) return null;
      return {
        id: pool.id,
        row,
        col,
        requestCount: poolRequests.length,
      };
    }).filter((p): p is PoolVisualization => p !== null);
    
    setState(prevState => ({
      ...prevState,
      requests: [...requestsRef.current],
      drivers: [...driversRef.current],
      matches: [...matchesRef.current],
      poolVisualizations,
      metrics: { 
        ...metricsRef.current, 
        activeRequests, 
        availableDrivers, 
        averageWaitTime, 
        matchRate 
      },
    }));
  }, [simulationParams, generateRandomPoint, addLog, runMatchingLogic]);

  const startSimulation = () => {
    if (simulationInterval.current) return;
    
    if(state.status === 'stopped') {
        const initialDrivers: Driver[] = Array.from({ length: simulationParams.driverSupply }, () => ({
          id: `d-${nextId.current++}`,
          location: generateRandomPoint(),
          status: DriverStatus.Available,
        }));
        driversRef.current = initialDrivers;
        setState(prevState => ({...prevState, drivers: initialDrivers}));
        addLog('Simulation started.');
    } else {
        addLog('Simulation resumed.');
    }

    setState(prevState => ({ ...prevState, status: 'running' }));
    simulationInterval.current = window.setInterval(simulationTick, SIMULATION_TICK_MS);
  };
  
  const pauseSimulation = () => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
      setState(prevState => ({ ...prevState, status: 'paused' }));
      addLog('Simulation paused.');
    }
  };
  
  const resetSimulation = () => {
    pauseSimulation();
    nextId.current = 0;
    poolsRef.current = new Map();
    requestsRef.current = [];
    driversRef.current = [];
    matchesRef.current = [];
    metricsRef.current = INITIAL_STATE.metrics;
    setState(INITIAL_STATE);
    addLog('Simulation reset.');
  };

  return { state, simulationParams, setSimulationParams, startSimulation, pauseSimulation, resetSimulation };
}