import React, { useEffect, useState } from 'react';
import { login, logout, getCurrentUser } from '../services/auth';
import { User } from 'firebase/auth';
import './Popup.css';

export default function Popup() {
  const [status, setStatus] = useState('');
  const [lastRunDate, setLastRunDate] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status when popup opens
    getCurrentUser().then(user => {
      setUser(user);
      setLoading(false);
    });

    // Get last run date when popup opens
    chrome.runtime.sendMessage({ action: 'getLastRunDate' }, (response) => {
      if (response.date) {
        setLastRunDate(response.date);
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Logging in...');
    try {
      const user = await login(email, password);
      setUser(user);
      setStatus('Logged in successfully');
      setEmail('');
      setPassword('');
    } catch (error) {
      setStatus('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setStatus('Logged out successfully');
    } catch (error) {
      setStatus('Logout failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleScrape = async () => {
    if (!user) {
      setStatus('Please log in first');
      return;
    }

    setStatus('Analyzing page...');
    try {
      const response = await chrome.runtime.sendMessage({ action: 'startScrape' });
      
      if (response.success) {
        setStatus('Analysis complete! Check the console for results.');
        // Refresh last run date
        chrome.runtime.sendMessage({ action: 'getLastRunDate' }, (response) => {
          if (response.date) {
            setLastRunDate(response.date);
          }
        });
      } else {
        setStatus('Error: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      setStatus('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="Popup">Loading...</div>;
  }

  return (
    <div className="Popup">
      <h2>DoorDash Scraper</h2>
      
      {!user ? (
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div className="logged-in">
          <p>Logged in as: {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
          
          {lastRunDate && (
            <div className="last-run">
              <span className="checkmark">✓</span>
              Last run: {new Date(lastRunDate).toLocaleDateString()}
            </div>
          )}
          
          <button onClick={handleScrape}>Run Manual Scrape</button>
        </div>
      )}
      
      <div className="status">{status}</div>
    </div>
  );
} 