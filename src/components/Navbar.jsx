import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from './img/UrbanAi_logo_transparent.png';

function Navbar() {
  return (
    <nav className="borderNav">
    <div className="navStyle">
      <nav className="navbar">
        <img src={logo} alt="Girl in a jacket"  height="100rem"></img>
        <ul>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/signup">Signup</Link>
          </li>
        </ul>
      </nav>
    </div>
    </nav>
  );
}

export default Navbar;
