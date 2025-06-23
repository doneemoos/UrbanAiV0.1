import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="LandingPage">
      <h1>Welcome to the Urban Mobility App</h1>
      <p>Submit your complaints about city issues and view them on the map.</p>
      <div className="complaint-form">
        <h2>Submit a Complaint</h2>
        <form>
          <textarea placeholder="Describe your complaint..." required></textarea>
          <button type="submit">Submit</button>
        </form>
      </div>
      <div className="map-view">
        <h2>View Complaints on Map</h2>
        {/* Map component will be integrated here */}
      </div>
      <div className="navbar-links">
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
      </div>
    </div>
  );
}

export default LandingPage;