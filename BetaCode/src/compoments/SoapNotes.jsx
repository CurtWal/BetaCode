import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import "../App.css";
function SoapNotes() {
  const [soapNote, setSoapNote] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSoapNote((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("SOAP Note submitted:", soapNote);
    // Send soapNote to backend via fetch/axios here
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
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="date">
                <Form.Label>Date</Form.Label>
                <Form.Control type="date" name="date" onChange={handleChange} />
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
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="sessionLength">
                <Form.Label>Session Length (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  name="sessionLength"
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="areasFocused" className="mt-3">
            <Form.Label>Body Area(s) Focused On</Form.Label>
            <Form.Control
              type="text"
              name="areasFocused"
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group controlId="subjective" className="mt-3">
            <Form.Label>S – Subjective</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="subjective"
              placeholder="Client’s report of symptoms, pain, stress, etc."
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group controlId="objective" className="mt-3">
            <Form.Label>O – Objective</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="objective"
              placeholder="What you observe or palpate"
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group controlId="assessment" className="mt-3">
            <Form.Label>A – Assessment</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="assessment"
              placeholder="What you believe is contributing to the issue and how the client responded"
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group controlId="plan" className="mt-3">
            <Form.Label>P – Plan</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="plan"
              placeholder="Next steps, recommendations, and follow-up"
              onChange={handleChange}
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
