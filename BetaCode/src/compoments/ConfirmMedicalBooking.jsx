import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import { Spinner } from "react-bootstrap";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import "../App.css";

const ConfirmMedicalBooking = () => {
  const { id } = useParams();
  const [validated, setValidated] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [memberId, setMemberId] = useState("");
  const [fsaProvider, setFsaProvider] = useState("");
  const [physicianContact, setPhysicianContact] = useState("");
  const [prescriptionOnFile, setPrescriptionOnFile] = useState("");
  const [painAreas, setPainAreas] = useState("");
  const [treatmentGoal, setTreatmentGoal] = useState("");
  const [underPhysicianCare, setUnderPhysicianCare] = useState("");
  const [surgeries, setSurgeries] = useState("");
  const [medications, setMedications] = useState("");
  const [pressurePreference, setPressurePreference] = useState("");
  const [sensitiveAreas, setSensitiveAreas] = useState("");
  const [allergies, setAllergies] = useState("");
  const [signature, setSignature] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [formType, setFormType] = useState("");
  const [formRoles, setFormRoles] = useState([]);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [visit, setVisit] = useState("");
  const [regularPrice, setRegularPrice] = useState(150);
  const [specialPrice, setSpecialPrice] = useState(90);
  const animatedComponents = makeAnimated();

  const options = [{ value: "medical", label: "Medical Therapist" }];

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_VERCEL}medical-bookings/${id}`
        );
        const data = res.data;
        console.log(data);
        setFullName(data.fullName || "");
        setDob(data.dob || "");
        setEmail(data.email || "");
        setAddress(data.address || "");
        setZipCode(data.zipCode || "");
        setPhone(data.phone || 1);
        setEmergencyContact(data.emergencyContact || "");
        setInsuranceProvider(data.insuranceProvider || "");
        setMemberId(data.memberId || "");
        setFsaProvider(data.fsaProvider || "");
        setPhysicianContact(data.physicianContact || "");
        setPrescriptionOnFile(data.prescriptionOnFile || "");
        setPainAreas(data.painAreas || "");
        setTreatmentGoal(data.treatmentGoal || "");
        setUnderPhysicianCare(data.underPhysicianCare || "");
        setSurgeries(data.surgeries || "");
        setMedications(data.medications || "");
        setPressurePreference(data.pressurePreference || "");
        setSensitiveAreas(data.sensitiveAreas || "");
        setAllergies(data.allergies || "");
        setFormType(data.formType || "");
        setFormRoles(data.formRoles);
        setDate(data.date || "");
        setStartTime(data.startTime || "");
        setDocumentUrl(data.documentUrl || "");
        setVisit(data.visit || "");
      } catch (err) {
        console.error("Failed to fetch booking", err);
      }
    };
    fetchBooking();
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidated(true);
    try {
      await axios.put(`${import.meta.env.VITE_VERCEL}medical-bookings/${id}`, {
        fullName,
        dob,
        email,
        address,
        zipCode,
        emergencyContact,
        insuranceProvider,
        memberId,
        fsaProvider,
        physicianContact,
        prescriptionOnFile,
        painAreas,
        treatmentGoal,
        underPhysicianCare,
        surgeries,
        medications,
        pressurePreference,
        sensitiveAreas,
        allergies,
        formType,
        formRoles,
        date,
        startTime,
        visit,
      });
      alert("Booking updated!");
    } catch (err) {
      console.error("Error updating booking", err);
      alert("Error updating booking");
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await axios.get(
        `${import.meta.env.VITE_VERCEL}confirm-medicalbooking/${id}`
      );
      alert("Notifications sent and booking marked as ready.");
    } catch (err) {
      console.error("Error confirming booking:", err);
      alert("Error confirming booking.");
    } finally {
      setConfirming(false);
    }
  };
  const getSelectedOptions = (selectedValues) => {
    return options.filter((opt) => selectedValues.includes(opt.value));
  };
  return (
    <div class="Main-Content">
      <div className="Grid-Container">
        <div className="FormInput">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Full Name.
                </Form.Control.Feedback>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom01"
              >
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control
                  required
                  type="date"
                  placeholder="Date of Birth"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Name.
                </Form.Control.Feedback>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom02"
              >
                <Form.Label>Email</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Email.
                </Form.Control.Feedback>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom03"
              >
                <Form.Label>Address</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Address.
                </Form.Control.Feedback>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom04"
              >
                <Form.Label>ZipCode</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="ZipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid ZipCode.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Phone Number.
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Emergency Contact</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Emergency Contact"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Emergency Contact.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom06"
              >
                <Form.Label>Insurance Provider</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Insurance Provider"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Insurance Provider.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                xs={12}
                md={4}
                as={Col}
                controlId="validationCustom07"
              >
                <Form.Label>MemberId</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="memberId"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid MemberId.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>FsaProvider</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="fsaProvider"
                  value={fsaProvider}
                  onChange={(e) => setFsaProvider(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid FsaProvider.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Physician Contact</Form.Label>
                <Form.Control
                  type="tett"
                  placeholder="Physician Contact"
                  value={physicianContact}
                  onChange={(e) => setPhysicianContact(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Physician Contact.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Prescription On File</Form.Label>
                <Form.Select
                  required
                  name="Prescription On File"
                  value={prescriptionOnFile}
                  onChange={(e) => setPrescriptionOnFile(e.target.value)}
                  min="1"
                >
                  <option value="">Select Yes/No</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Prescription On File.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Pain Areas</Form.Label>
                <Form.Control
                  as="textarea"
                  placeholder="Pain Areas"
                  value={painAreas}
                  onChange={(e) => setPainAreas(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide valid Pain Areas.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Treatment Goal</Form.Label>
                <Form.Control
                  as="textarea"
                  placeholder="Treatment Goal"
                  value={treatmentGoal}
                  onChange={(e) => setTreatmentGoal(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide valid Treatment Goal.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Under Physician Care</Form.Label>
                <Form.Control
                  as="textarea"
                  placeholder="Under Physician Care"
                  value={underPhysicianCare}
                  onChange={(e) => setUnderPhysicianCare(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide valid Under Physician Care.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Surgeries</Form.Label>
                <Form.Control
                  as="textarea"
                  placeholder="Surgeries"
                  value={surgeries}
                  onChange={(e) => setSurgeries(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide valid Surgeries.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Medications</Form.Label>
                <Form.Control
                  as="textarea"
                  placeholder="Medications"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide valid Medications.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Pressure Preference</Form.Label>
                <Form.Select
                  required
                  type="text"
                  name="pressurePreference"
                  value={pressurePreference}
                  onChange={(e) => setPressurePreference(e.target.value)}
                >
                  <option value="">Select Preferred Pressure</option>
                  <option value="Light">Light</option>
                  <option value="Medium">Medium</option>
                  <option value="Firm">Firm</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Please provide valid Pressure Preference.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Sensitive Areas</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Sensitive Areas"
                  value={sensitiveAreas}
                  onChange={(e) => setSensitiveAreas(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide valid Sensitive Areas.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Allergies</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide valid Allergies.
                </Form.Control.Feedback>
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
                  name="roles"
                  value={getSelectedOptions(formRoles)}
                  options={options}
                  onChange={(selectedOptions) => {
                    const values = selectedOptions.map(
                      (option) => option.value
                    );
                    setFormRoles(values);
                  }}
                />
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom18"
              >
                <Form.Label>Preferred Visit</Form.Label>
                <Form.Select
                  required
                  name="visit"
                  value={visit}
                  onChange={(e) => setVisit(e.target.value)}
                >
                  <option value="">Select Preferred Visit</option>
                  <option value="Office-Visit">Office</option>
                  <option value="Home-Visit">Home Visit</option>
                </Form.Select>
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom02"
              >
                <Form.Label>Prescription Link: </Form.Label>
                <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                  Image
                </a>
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col}>
                <Button type="submit">Update Booking</Button>
              </Form.Group>
              <Form.Group as={Col}>
                <Button
                  onClick={handleConfirm}
                  style={{ backgroundColor: "green" }}
                  disabled={confirming} // disable while loading
                >
                  {confirming ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Processing...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </Form.Group>
            </Row>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ConfirmMedicalBooking;
