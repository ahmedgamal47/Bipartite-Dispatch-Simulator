import React from 'react';
import type { SimulationState, SimulationParams } from '../types';
import SimulationMap from './SimulationMap';
import Metrics from './Metrics';
import LogPanel from './LogPanel';

interface SimulationInstanceProps {
  title: string;
  state: SimulationState;
  params: SimulationParams;
}

export default function SimulationInstance({ title, state, params }: SimulationInstanceProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-bold text-center text-white mb-4">{title}</h2>
        <Metrics metrics={state.metrics} />
      </div>
      <div className="relative aspect-square w-full bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
        <SimulationMap
          requests={state.requests}
          drivers={state.drivers}
          matches={state.matches}
          area={params.areaDimensions}
          pools={state.poolVisualizations}
          grid={params.gridResolution}
        />
      </div>
      <LogPanel logs={state.logs} />
    </div>
  );
}
