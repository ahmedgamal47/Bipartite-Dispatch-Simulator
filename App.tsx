
import React from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import SimulationInstance from './components/SimulationInstance';
import { useSimulation } from './hooks/useSimulation';
import type { SimulationParams } from './types';

export default function App() {
  const fixedWindowSim = useSimulation({ poolingStrategy: 'FixedWindow' });
  // FIX: Corrected typo from `usesimulation` to `useSimulation`.
  const flexibleWindowSim = useSimulation({ poolingStrategy: 'FlexibleWindow' });

  const handleSetParams = (
    updater: React.SetStateAction<SimulationParams>
  ) => {
    // This updater function will be applied independently to each simulation's state
    fixedWindowSim.setSimulationParams(updater);
    flexibleWindowSim.setSimulationParams(updater);
  };

  const startAll = () => {
    fixedWindowSim.startSimulation();
    flexibleWindowSim.startSimulation();
  };

  const pauseAll = () => {
    fixedWindowSim.pauseSimulation();
    flexibleWindowSim.pauseSimulation();
  };

  const resetAll = () => {
    fixedWindowSim.resetSimulation();
    flexibleWindowSim.resetSimulation();
  };

  // Use one of the simulations' params for the controls UI, as they will be kept in sync.
  const displayParams = fixedWindowSim.simulationParams;
  
  // The running status should also be synchronized.
  const isRunning = fixedWindowSim.state.status === 'running';
  const isPaused = fixedWindowSim.state.status === 'paused';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col lg:flex-row p-4 gap-4">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-gray-800 rounded-lg p-4 sticky top-4 flex flex-col gap-4">
            <Controls
              params={displayParams}
              setParams={handleSetParams}
              onStart={startAll}
              onPause={pauseAll}
              onReset={resetAll}
              isRunning={isRunning}
              isPaused={isPaused}
            />
          </div>
        </div>
        <div className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SimulationInstance
            title="Fixed Window Strategy"
            state={fixedWindowSim.state}
            params={fixedWindowSim.simulationParams}
          />
          <SimulationInstance
            title="Flexible Window Strategy (80%)"
            state={flexibleWindowSim.state}
            params={flexibleWindowSim.simulationParams}
          />
        </div>
      </main>
    </div>
  );
}