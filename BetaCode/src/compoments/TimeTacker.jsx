import React, { useState, useEffect } from 'react';

const TimeTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);

  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const handleClockIn = () => {
    const now = new Date();
    setIsTracking(true);
    setStartTime(now.getTime());
    setClockInTime(now);
    setClockOutTime(null);
  };

  const handleClockOut = () => {
    const now = new Date();
    setIsTracking(false);
    setTotalTime(prevTotal => prevTotal + elapsedTime);
    setElapsedTime(0);
    setClockOutTime(now);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatDateTime = (date) => {
    return date ? date.toLocaleString() : '--';
  };

  return (
    <div className="time-tracker">
      <h2>Time Tracker</h2>
      <div className="time-display" style={{color:"black", fontSize:"50px"}}>{formatTime(elapsedTime)}</div>
      <div className="tracker-buttons">
        <button onClick={handleClockIn} disabled={isTracking}>Clock In</button>
        <button onClick={handleClockOut} disabled={!isTracking}>Clock Out</button>
      </div>
      <div className="clock-times">
        <p>Clock In: {formatDateTime(clockInTime)}</p>
        <p>Clock Out: {formatDateTime(clockOutTime)}</p>
      </div>
      <div className="total-time">
        <h3>Total Time</h3>
        <div className="time-display" style={{color:"black", fontSize:"30px"}}>{formatTime(totalTime)}</div>
      </div>
    </div>
  );
};

export default TimeTracker;