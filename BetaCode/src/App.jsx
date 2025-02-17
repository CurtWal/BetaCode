import { useState } from 'react'
import './App.css'
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
// import FormData from './compoments/FormData'
// import TimeTracker from './compoments/TimeTacker'
// import ReportForm from './compoments/ReportForm'
// import Sorts from './compoments/Sorts'
function App() {
  // const [activeTab, setActiveTab] = useState('participants')
  // const [participants, setParticipants] = useState()
  // const [therapists, setTherapists] = useState()
  // const [zipCode, setZipCode] = useState('')
  // const [duration, setDuration] = useState('3 hours')
  // const [eventType, setEventType] = useState('Corporate')
  // const [price , setPrice] = useState(150)

  // const handleSubmit = (e) => {
  //   e.preventDefault()
  //   console.log(`Submitted: ${activeTab === 'participants' ? participants + ' participants' : therapists + ' therapists'}, ${zipCode} zip code, ${duration} duration, ${eventType} event type`)
  //   // Here you can add logic to handle the form submission
  // }
  // const priceCal = () => {
  //   if (duration == "3 hours") {
  //     setPrice(150 * 3)
  //     console.log(`$${price}`)
  //   }else if (duration == "4 hours") {
  //     setPrice(150 * 4)
  //     console.log(`$${price}`)
  //   }else if (duration == "5 hours") {
  //     setPrice(150 * 5)
  //     console.log(`$${price}`)
  //   }
  // }

  const [validated, setValidated] = useState(false);

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }

    setValidated(true);
  };
  return (
    <div>
      <div className='Container'>
        <div className='Text-Info'>
            <h3>1 Therapist</h3>
            <h4>$150/hour</h4>
            <hr></hr>
            <ul>
              <li>Minimum 2 hour Booking</li>
              <li>Can Serve 6 people in 1 hour</li>
              <li>Availiable in 10, 15, and 20 minute increments</li>
            </ul>
        </div>
        <div className='FormInput'>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Form.Group as={Col} md="4" controlId="validationCustom01">
          <Form.Label>Name</Form.Label>
          <Form.Control
            required
            type="text"
            placeholder="Name"
            
          />
          <Form.Control.Feedback type="invalid">
            Please provide a valid Name.
          </Form.Control.Feedback>
          <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        </Form.Group>
        <Form.Group as={Col} md="4" controlId="validationCustom02">
          <Form.Label>Email</Form.Label>
          <Form.Control
            required
            type="text"
            placeholder="Email"
            
          />
          <Form.Control.Feedback type="invalid">
            Please provide a valid Email.
          </Form.Control.Feedback>
          <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        </Form.Group>
        <Form.Group as={Col} md="4" controlId="validationCustom03">
          <Form.Label>Address</Form.Label>
          <Form.Control
            required
            type="text"
            placeholder="Address"
            
          />
          <Form.Control.Feedback type="invalid">
            Please provide a valid Address.
          </Form.Control.Feedback>
          <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        </Form.Group>
      </Row>
      <Row className="mb-3">
        <Form.Group as={Col} md="3" controlId="validationCustom04">
          <Form.Label>ZipCode</Form.Label>
          <Form.Control type="text" placeholder="ZipCode" required />
          <Form.Control.Feedback type="invalid">
            Please provide a valid ZipCode.
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group as={Col} md="5" controlId="validationCustom05">
          <Form.Label># of Therapist</Form.Label>
          <Form.Control type="number" placeholder="Number of Therapist" required />
          <Form.Control.Feedback type="invalid">
            Please provide a valid Therapist Number.
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group as={Col} controlId="validationCustom06">
          <Form.Label>Event Hours</Form.Label>
          <Form.Select  required>
            <option value="2">2 hours</option>
            <option value="3">3 Hours</option>
            <option value="4">4 Hours</option>
            <option value="5">5 Hours</option>
          </Form.Select>
        </Form.Group>
      </Row>
      <Row className="mb-3">
        <Form.Group md="4"as={Col} controlId="validationCustom07">
          <Form.Label>Massage Increments</Form.Label>
          <Form.Select  required>
            <option value="2">10 Minutes</option>
            <option value="3">15 Minutes</option>
            <option value="4">20 Minutes</option>
          </Form.Select>
        </Form.Group>
        
        <Form.Group as={Col} controlId="validationCustom07" style={{marginTop:"8%"}}>
        <p>Total: $$$</p>
        </Form.Group>
        <Form.Group as={Col} controlId="validationCustom07" style={{marginTop:"5%"}}>
        <Button type="submit">Submit form</Button>
        </Form.Group>
      </Row>
      
    </Form>

        </div>
      </div>
      {/* <div className="booking-form">
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
    <button onClick={priceCal}>Calculate Price</button>
    <TimeTracker/>
    <ReportForm />
    <Sorts /> */}
      {/* <FormData participants={participants} activeTab={activeTab} duration={duration} zipCode={zipCode} therapists={therapists} eventType={eventType}/> */}
    </div>
  )
}

export default App