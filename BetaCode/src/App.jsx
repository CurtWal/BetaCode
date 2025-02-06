import { useState } from 'react'
import './App.css'
import FormData from './compoments/FormData'
import TimeTracker from './compoments/TimeTacker'
import ReportForm from './compoments/ReportForm'
function App() {
  const [activeTab, setActiveTab] = useState('participants')
  const [participants, setParticipants] = useState(6)
  const [therapists, setTherapists] = useState(1)
  const [zipCode, setZipCode] = useState('')
  const [duration, setDuration] = useState('3 hours')
  const [eventType, setEventType] = useState('Corporate')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(`Submitted: ${activeTab === 'participants' ? participants + ' participants' : therapists + ' therapists'}, ${zipCode} zip code, ${duration} duration, ${eventType} event type`)
    // Here you can add logic to handle the form submission
  }

  return (
    <div>
    <div className="booking-form">
      <div className="tabs">
        <button 
          className={activeTab === 'participants' ? 'active' : ''} 
          onClick={() => setActiveTab('participants')}
        >
          Number of Participants
        </button>
        <button 
          className={activeTab === 'therapists' ? 'active' : ''} 
          onClick={() => setActiveTab('therapists')}
        >
          Number of Therapists
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor={activeTab}>{activeTab === 'participants' ? '# Participants' : '# Therapists'}</label>
            <input
              type="number"
              id={activeTab}
              value={activeTab === 'participants' ? participants : therapists}
              onChange={(e) => activeTab === 'participants' 
                ? setParticipants(Math.max(6, parseInt(e.target.value) || 6))
                : setTherapists(Math.max(1, parseInt(e.target.value) || 1))
              }
              min={activeTab === 'participants' ? "6" : "1"}
              placeholder={activeTab === 'participants' ? "Min. 6" : "Min. 1"}
            />
          </div>
          <div className="form-group">
            <label htmlFor="zipCode">Event Zip Code</label>
            <input
              type="text"
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter zip code"
            />
          </div>
          <div className="form-group">
            <label htmlFor="duration">Event Duration</label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option>3 hours</option>
              <option>4 hours</option>
              <option>5 hours</option>
            </select>
          </div>
          <div className="form-group event-type">
            <button type="button" className={eventType === 'Corporate' ? 'active' : ''} onClick={() => setEventType('Corporate')}>Corporate</button>
            <button type="button" className={eventType === 'Personal' ? 'active' : ''} onClick={() => setEventType('Personal')}>Personal</button>
          </div>
          <button type="submit" className="book-button">Book &gt;</button>
        </div>
      </form>
      
    </div>
    <TimeTracker/>
    <ReportForm />
    {/* <FormData participants={participants} activeTab={activeTab} duration={duration} zipCode={zipCode} therapists={therapists} eventType={eventType}/> */}
    </div>
  )
}

export default App