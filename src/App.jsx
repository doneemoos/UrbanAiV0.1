import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import Navbar from './components/Navbar.jsx';
import LandingPage from './components/LandingPage.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import Dashboard from './components/Dashboard.jsx';
import ReportIssue from './components/ReportIssue.jsx';
import { AuthProvider } from './AuthContext'; // importă contextul
import Account from './components/Account.jsx';
import News from './components/News.jsx';
import Events from './components/Events.jsx';
import IssueDetails from './components/IssueDetails.jsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <LoadScript googleMapsApiKey="AIzaSyDW5XKKX0zKaYfddYpTzaF3alj98xMD0fw">
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/report" element={<ReportIssue />} />
              <Route path="/account" element={<Account />} />
              <Route path="/news" element={<News />} />
              <Route path="/events" element={<Events />} />
              <Route path="/issue/:id" element={<IssueDetails />} />
            </Routes>
          </div>
        </LoadScript>
      </Router>
    </AuthProvider>
  );
}

export default App;