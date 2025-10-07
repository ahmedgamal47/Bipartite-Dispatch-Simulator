
import type { Request, Driver } from '../types';

const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// This uses a greedy algorithm, which is a heuristic for the Hungarian algorithm (optimal solver).
// It's suitable for a simulation to demonstrate the concept of cost-based matching.
export const solveAssignmentProblem = (
  requests: Request[],
  drivers: Driver[],
  costMatrix?: number[][]
): { requestIndex: number; driverIndex: number; cost: number }[] => {
  if (requests.length === 0 || drivers.length === 0) {
    return [];
  }

  const numRequests = requests.length;
  const numDrivers = drivers.length;
  
  let matrix: number[][] = costMatrix || [];
  
  // If no cost matrix is provided (e.g., for proximity matching or as a fallback), calculate one based on distance.
  if (!costMatrix) {
    matrix = Array(numRequests).fill(0).map((_, rIdx) => 
      Array(numDrivers).fill(0).map((_, dIdx) => 
        calculateDistance(requests[rIdx].location, drivers[dIdx].location)
      )
    );
  }

  const assignments: { requestIndex: number; driverIndex: number; cost: number }[] = [];
  const assignedRequests = new Set<number>();
  const assignedDrivers = new Set<number>();

  // Create a flat list of all possible assignments with their costs
  const potentialAssignments: { r: number; d: number; cost: number }[] = [];
  for (let r = 0; r < numRequests; r++) {
    for (let d = 0; d < numDrivers; d++) {
      potentialAssignments.push({ r, d, cost: matrix[r][d] });
    }
  }

  // Sort assignments by cost, lowest first
  potentialAssignments.sort((a, b) => a.cost - b.cost);

  // Greedily pick the best available assignments
  for (const assignment of potentialAssignments) {
    const { r, d, cost } = assignment;
    if (!assignedRequests.has(r) && !assignedDrivers.has(d)) {
      assignments.push({ requestIndex: r, driverIndex: d, cost });
      assignedRequests.add(r);
      assignedDrivers.add(d);
    }
    // Stop if we can't make any more assignments
    if (assignments.length >= Math.min(numRequests, numDrivers)) {
      break;
    }
  }

  return assignments;
};
