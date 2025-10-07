import React, { useRef, useEffect } from 'react';

interface LogPanelProps {
  logs: string[];
}

export default function LogPanel({ logs }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex-grow flex flex-col min-h-0 max-h-80">
      <h2 className="text-lg font-semibold text-white mb-2 flex-shrink-0">Event Log</h2>
      <div ref={scrollRef} className="overflow-y-auto flex-grow pr-2">
        <ul className="space-y-1">
          {logs.map((log, index) => (
            <li key={index} className="text-xs text-gray-400 font-mono">
              <span className="text-blue-400 mr-2">{`[${new Date().toLocaleTimeString()}]`}</span>
              {log}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}