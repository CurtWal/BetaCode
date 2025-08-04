import { useState, useEffect } from "react";
import "../App.css";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import axios from "axios";
import Select from "react-select";
import makeAnimated from "react-select/animated";

function MedicalForm() {
  const animatedComponents = makeAnimated();
  const [worker, setWorker] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    phone: "",
    email: "",
    address: "",
    zipCode: "",
    emergencyContact: "",
    insuranceProvider: "",
    memberId: "",
    fsaProvider: "",
    physicianContact: "",
    prescriptionOnFile: "",
    painAreas: "",
    treatmentGoal: "",
    underPhysicianCare: "",
    surgeries: "",
    medications: "",
    pressurePreference: "",
    sensitiveAreas: "",
    allergies: "",
    signature: "",
    signatureDate: "",
    formType: "medical",
    formRoles: worker,
    date: "",
    startTime: "",
  });
  const options = [
    { value: "therapist", label: "Massage Therapist" },
    { value: "personal", label: "Personal Trainer" },
    { value: "yoga", label: "Yoga Instructor" },
    { value: "group", label: "Group Fitness Instructor" },
    { value: "nutritionist", label: "Nutritionist" },
    { value: "pilates", label: "Pilates Instructor" },
    { value: "stretch", label: "Stretch Therapist" },
    { value: "cpr", label: "CPR Instructor" },
    { value: "meditation", label: "Meditation Coach" },
    { value: "zumba", label: "Zumba Instructor" },
    { value: "wellness", label: "Wellness Coach" },
    { value: "ergonomics", label: "Ergonomics Specialist" },
    { value: "breathwork", label: "Breathwork Coach" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_VERCEL}new-medicalbooking`,
        formData
      );
      alert("Medical Booking email sent.");
    } catch (err) {
      console.error("Error posting booking:", err);
      alert("Booking failed.");
    }
  };
  return (
    <div>
      <div class="Main-Content">
        <div className="Grid-Container">
          <div className="Container">
            <div className="FormInput">
              <h2 style={{ textAlign: "center" }}>Medical Wellbeing</h2>
              <Form noValidate validated={true} onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom01"
                  >
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Full Name"
                      name="fullName"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom02"
                  >
                    <Form.Label>Date of Birth</Form.Label>
                    <Form.Control
                      required
                      type="date"
                      placeholder="Date of Birth"
                      name="dob"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom03"
                  >
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Phone Number"
                      name="phone"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Row>

                <Row className="mb-3">
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom04"
                  >
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      required
                      type="email"
                      placeholder="Email"
                      name="email"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom05"
                  >
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Address"
                      name="address"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom06"
                  >
                    <Form.Label>Zip Code</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Zip Code"
                      name="zipCode"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Row>

                <Row className="mb-3">
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom07"
                  >
                    <Form.Label>Emergency Contact Name & Phone</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Emergency Contact Name & Phone"
                      name="emergencyContact"
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom08"
                  >
                    <Form.Label>Insurance Provider</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Insurance Provider"
                      name="insuranceProvider"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom09"
                  >
                    <Form.Label>Insurance Member ID</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Insurance Member ID"
                      name="memberId"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom10"
                  >
                    <Form.Label>FSA/HSA Card Provider</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="FSA/HSA Card Provider"
                      name="fsaProvider"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom11"
                  >
                    <Form.Label>Physician's Phone or Fax</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Physician's Phone or Fax"
                      name="physicianContact"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom12"
                  >
                    <Form.Label>Doctor's Prescription on File</Form.Label>
                    <Form.Select
                      required
                      name="prescriptionOnFile"
                      onChange={handleChange}
                    >
                      <option value="">Select Yes/No</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </Form.Select>
                  </Form.Group>
                </Row>

                <Row className="mb-3">
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom13"
                  >
                    <Form.Label>Primary Areas of Pain or Concern</Form.Label>
                    <Form.Control
                      required
                      as="textarea"
                      placeholder="Primary Areas of Pain or Concern"
                      name="painAreas"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom14"
                  >
                    <Form.Label>Main Goal for Treatment</Form.Label>
                    <Form.Control
                      required
                      as="textarea"
                      placeholder="Main Goal for Treatment"
                      name="treatmentGoal"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom15"
                  >
                    <Form.Label>
                      Currently under Physician's care? (Yes/No)
                    </Form.Label>
                    <Form.Control
                      required
                      as="textarea"
                      placeholder="Yes/No and Why"
                      name="underPhysicianCare"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Row>

                <Row className="mb-3">
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom16"
                  >
                    <Form.Label>Surgeries/Injuries (Last 2 years)</Form.Label>
                    <Form.Control
                      required
                      as="textarea"
                      placeholder="Surgeries/Injuries"
                      name="surgeries"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom17"
                  >
                    <Form.Label>Current Medications</Form.Label>
                    <Form.Control
                      required
                      as="textarea"
                      placeholder="Current Medications"
                      name="medications"
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom18"
                  >
                    <Form.Label>Preferred Pressure</Form.Label>
                    <Form.Select
                      required
                      name="pressurePreference"
                      onChange={handleChange}
                    >
                      <option value="">Select Preferred Pressure</option>
                      <option value="Light">Light</option>
                      <option value="Medium">Medium</option>
                      <option value="Firm">Firm</option>
                    </Form.Select>
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom19"
                  >
                    <Form.Label>Sensitive Areas to Avoid</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Sensitive Areas"
                      name="sensitiveAreas"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom20"
                  >
                    <Form.Label>Allergies or Skin Sensitivities</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Allergies or Skin Sensitivities"
                      name="allergies"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom05"
                  >
                    <Form.Label>Wellness Field</Form.Label>
                    <Select
                      className="roleSelect"
                      closeMenuOnSelect={false}
                      components={animatedComponents}
                      isMulti
                      name="formRoles"
                      options={options}
                      onChange={(selectedOptions) => {
                        const values = selectedOptions.map(
                          (option) => option.value
                        );
                        setFormData((prev) => ({ ...prev, ["formRoles"]: values }))
                      }}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom02"
                  >
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      required
                      type="date"
                      placeholder="Date"
                      name="date"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom02"
                  >
                    <Form.Label>Start Time</Form.Label>
                    <Form.Control
                      required
                      type="time"
                      placeholder="Time"
                      name="startTime"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Row>

                <Row className="mb-3">
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom21"
                  >
                    <Form.Label>Signature</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Signature"
                      name="signature"
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group
                    as={Col}
                    xs={12}
                    md={4}
                    controlId="validationCustom22"
                  >
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      required
                      type="date"
                      name="signatureDate"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Row>

                <Button type="submit" className="mt-3">
                  Submit
                </Button>
              </Form>
            </div>
            <div
              className="Text-Info"
              style={{ backgroundColor: "red", color: "white" }}
            >
              <h3>Disclaimer:</h3>
              <p>All massages should be booked one week ahead</p>
              <p>
                If you would like for a booking to be made within less than a
                week email{" "}
              </p>
              <p style={{ textAlign: "left" }}>sam@massageonthegomemphis.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default MedicalForm;
