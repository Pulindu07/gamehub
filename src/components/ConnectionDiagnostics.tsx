import React from 'react';
import { apiService } from '../services/apiService';

export default function ConnectionDiagnostics() {
  const [diagnostics, setDiagnostics] = React.useState(apiService.getDiagnostics());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDiagnostics(apiService.getDiagnostics());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!diagnostics) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg max-w-md text-xs font-mono">
      <h3 className="font-bold mb-2">Connection Diagnostics</h3>
      <div className="space-y-1">
        <div>State: {diagnostics.currentState || 'Not connected'}</div>
        <div>Connection ID: {diagnostics.connectionId || 'None'}</div>
        <div>Game ID: {diagnostics.gameId || 'None'}</div>
        <div>Attempts: {diagnostics.attempts}</div>
        {diagnostics.lastAttempt && (
          <div>Last attempt: {new Date(diagnostics.lastAttempt).toLocaleTimeString()}</div>
        )}
        {diagnostics.lastError && (
          <div className="text-red-600">Last error: {diagnostics.lastError}</div>
        )}
      </div>
    </div>
  );
}