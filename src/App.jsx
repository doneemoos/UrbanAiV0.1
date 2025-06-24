import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LandingPage from './components/LandingPage.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import Dashboard from './components/Dashboard.jsx';
import ReportIssue from './components/ReportIssue.jsx';
import { AuthProvider } from './AuthContext'; // importă contextul
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/report" element={<ReportIssue />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;