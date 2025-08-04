import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import "../App.css";
import axios from "axios";
import { useParams } from "react-router-dom";

function SoapNotes() {
  const { bookingId, therapistId } = useParams();
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState("");
  const [therapistName, setTherapistName] = useState("");
  const [sessionLength, setSessionLength] = useState("");
  const [bodyAreasFocused, setbodyAreasFocused] = useState("");
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

 useEffect(() => {
    const fetchBooking = async () => {
      try {
        console.log(bookingId)
        const res = await axios.get(
          `${import.meta.env.VITE_VERCEL}soapnotes/${bookingId}/${therapistId}`
        );
        const data = res.data;
        const formattedDate = new Date(data.date).toISOString().split("T")[0]
        setClientName(data.clientName || "");
        setDate(formattedDate || "")
        setTherapistName(data.therapistName)
      } catch (err) {
        console.error("Failed to fetch booking", err);
      }
    };
    fetchBooking();
  }, [ bookingId, therapistId]);

  const handleSubmit = async(e) => {
    e.preventDefault();
    let newSoapNotes= {
      clientName,
      date,
      therapistName,
      sessionLength,
      bodyAreasFocused,
      subjective,
      objective,
      assessment,
      plan,
      bookingId,
      therapistId
    }
    try{
      await axios.post(
          `${import.meta.env.VITE_VERCEL}soapnotes`,
          newSoapNotes
        );
        alert("Soap Notes Submitted");
    }catch(err){
      console.error("Error submitting soap notes:", err);
        alert("Error submitting soap notes.");
    }
  };
  return (
    <div class="Main-Content">
        <div className="Grid-Container">
        <div className="FormInput">
    <h2 className="mb-4" style={{textAlign:"center"}}>SOAP Note Form</h2>
    <div className="Container">
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group controlId="clientName">
                <Form.Label>Client Name</Form.Label>
                <Form.Control
                  type="text"
                  name="clientName"
                  value={clientName}
                  onChange={(e)=> setClientName(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="date">
                <Form.Label>Date</Form.Label>
                <Form.Control type="date" name="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={6}>
              <Form.Group controlId="therapistName">
                <Form.Label>Therapist Name</Form.Label>
                <Form.Control
                  type="text"
                  name="therapistName"
                  value={therapistName}
                  onChange={(e) => setTherapistName(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="sessionLength">
                <Form.Label>Session Length (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  name="sessionLength"
                  value={sessionLength}
                  onChange={(e) => setSessionLength(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="areasFocused" className="mt-3">
            <Form.Label>Body Area(s) Focused On</Form.Label>
            <Form.Control
              type="text"
              name="areasFocused"
              value={bodyAreasFocused}
              onChange={(e) => setbodyAreasFocused(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="subjective" className="mt-3">
            <Form.Label>S – Subjective</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="subjective"
              placeholder="Client’s report of symptoms, pain, stress, etc."
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="objective" className="mt-3">
            <Form.Label>O – Objective</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="objective"
              placeholder="What you observe or palpate"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="assessment" className="mt-3">
            <Form.Label>A – Assessment</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="assessment"
              placeholder="What you believe is contributing to the issue and how the client responded"
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="plan" className="mt-3">
            <Form.Label>P – Plan</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="plan"
              placeholder="Next steps, recommendations, and follow-up"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="mt-4">
            Save SOAP Note
          </Button>
        </Form>
        </div>
    </div>
    </div>
    </div>
  );
}

export default SoapNotes;
