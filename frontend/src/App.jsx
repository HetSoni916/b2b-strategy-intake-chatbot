import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Evaluation from './pages/Evaluation';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-mesh bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="pl-64 min-h-screen flex flex-col">
          <main className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/evaluation" element={<Evaluation />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
