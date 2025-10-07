import React from 'react';
import type { SimulationParams } from '../types';

interface ControlsProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
  isPaused: boolean;
}

const ControlButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  className: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, className, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full px-4 py-2 font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);


export default function Controls({
  params,
  setParams,
  onStart,
  onPause,
  onReset,
  isRunning,
  isPaused,
}: ControlsProps) {
  const handleParamChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'range' || type === 'number';
    setParams((prev) => ({
      ...prev,
      [name]: isNumber ? Number(value) : value,
    }));
  };

  const handleGridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const size = Number(e.target.value);
      setParams(prev => ({
        ...prev,
        gridResolution: { rows: size, cols: size }
      }));
  };

  const isStopped = !isRunning && !isPaused;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center text-white">Controls</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="driverSupply" className="block text-sm font-medium text-gray-300 mb-1">
            Driver Supply ({params.driverSupply})
          </label>
          <input
            type="range"
            id="driverSupply"
            name="driverSupply"
            min="10"
            max="200"
            value={params.driverSupply}
            onChange={handleParamChange}
            disabled={isRunning}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label htmlFor="requestRate" className="block text-sm font-medium text-gray-300 mb-1">
            Request Rate/min ({params.requestRate})
          </label>
          <input
            type="range"
            id="requestRate"
            name="requestRate"
            min="10"
            max="300"
            value={params.requestRate}
            onChange={handleParamChange}
            disabled={isRunning}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label htmlFor="poolingTime" className="block text-sm font-medium text-gray-300 mb-1">
            Pooling Time (s) ({params.poolingTime})
          </label>
          <input
            type="range"
            id="poolingTime"
            name="poolingTime"
            min="1"
            max="15"
            value={params.poolingTime}
            onChange={handleParamChange}
            disabled={isRunning}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label htmlFor="gridResolution" className="block text-sm font-medium text-gray-300 mb-1">
            Grid Size ({params.gridResolution.rows}x{params.gridResolution.cols})
          </label>
          <input
            type="range"
            id="gridResolution"
            name="gridResolution"
            min="2"
            max="10"
            value={params.gridResolution.rows}
            onChange={handleGridChange}
            disabled={isRunning}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-col space-y-2 pt-2">
         {isStopped && (
          <ControlButton onClick={onStart} className="bg-green-600 hover:bg-green-700 focus:ring-green-500">
            Start
          </ControlButton>
        )}
        {isRunning && (
          <ControlButton onClick={onPause} className="bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400">
            Pause
          </ControlButton>
        )}
        {isPaused && (
           <ControlButton onClick={onStart} className="bg-green-600 hover:bg-green-700 focus:ring-green-500">
            Resume
          </ControlButton>
        )}
        <ControlButton onClick={onReset} disabled={isStopped} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
          Reset
        </ControlButton>
      </div>
    </div>
  );
}
