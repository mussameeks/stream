import React from 'react';
import MatchList from './MatchList';

const App: React.FC = () => (
  <div className="min-h-screen bg-gray-100">
    <h1 className="text-2xl font-bold text-center py-4">⚽ Football Streams</h1>
    <MatchList />
  </div>
);

export default App;
