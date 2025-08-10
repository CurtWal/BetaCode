import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import { Spinner } from "react-bootstrap";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import "../App.css";

const ConfirmBooking = () => {
  const { id } = useParams();
  const [validated, setValidated] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [therapist, setTherapist] = useState(1);
  const [eventHours, setEventHours] = useState("2");
  const [eventIncrement, setEventIncrement] = useState("10");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [extra, setExtra] = useState("");
  const [price, setPrice] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [regularPrice, setRegularPrice] = useState(150);
  const [formType, setFormType] = useState("");
  const [specialPrice, setSpecialPrice] = useState(90);
  const [formRoles, setFormRoles] = useState([]);
  const animatedComponents = makeAnimated();

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

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_VERCEL}bookings/${id}`
        );
        const data = res.data;
        setCompanyName(data.companyName || "");
        setName(data.name || "");
        setEmail(data.email || "");
        setAddress(data.address || "");
        setZipCode(data.zipCode || "");
        setTherapist(data.therapist || 1);
        setEventHours(data.eventHours || "2");
        setEventIncrement(data.eventIncrement || "10");
        setDate(data.date?.split("T")[0] || "");
        setStartTime(data.startTime || "");
        setEndTime(data.endTime || "");
        setExtra(data.extra || "");
        setPrice(data.price || 0);
        setFormType(data.formType || "");
        setFormRoles(data.formRoles || []);
        setPhoneNumber(data.phoneNumber || "");
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
      await axios.put(`${import.meta.env.VITE_VERCEL}bookings/${id}`, {
        companyName,
        name,
        email,
        address,
        zipCode,
        therapist,
        eventHours,
        eventIncrement,
        date,
        startTime,
        endTime,
        extra,
        price,
        formType,
        formRoles,
        phoneNumber,
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
      await axios.get(`${import.meta.env.VITE_VERCEL}confirm-booking/${id}`);
      alert("Notifications sent and booking marked as ready.");
    } catch (err) {
      console.error("Error confirming booking:", err);
      alert("Error confirming booking.");
    } finally {
      setConfirming(false);
    }
  };
  const getBookingPrices = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_VERCEL}admin/booking-prices`
      );
      setRegularPrice(response.data.regularBooking);
      setSpecialPrice(response.data.specialBooking);
    } catch (error) {
      console.error("Error fetching booking prices:", error);
    }
  };
  useEffect(() => {
    getBookingPrices();
  }, []);
  useEffect(() => {
    if (formType == "regular" && eventHours) {
      const hours = parseFloat(eventHours); // Convert to a number
      const wholeHours = Math.floor(hours); // Full hours
      const isHalfHour = hours % 1 !== 0; // Check if there's a half-hour

      const basePrice = therapist * regularPrice * wholeHours; // Price for full hours
      const halfHourPrice = isHalfHour ? therapist * (regularPrice * 0.5) : 0; // Half-hour price

      setPrice(basePrice + halfHourPrice);
    } else if (formType == "special" && eventHours) {
      const hours = parseFloat(eventHours); // Convert to a number
      const wholeHours = Math.floor(hours); // Full hours
      const isHalfHour = hours % 1 !== 0; // Check if there's a half-hour

      const basePrice = therapist * specialPrice * wholeHours; // Price for full hours
      const halfHourPrice = isHalfHour ? therapist * (specialPrice * 0.5) : 0; // Half-hour price

      setPrice(basePrice + halfHourPrice);
    }
  }, [therapist, eventHours, regularPrice, specialPrice]);

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
                <Form.Label>Company Name</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Company Name.
                </Form.Control.Feedback>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom01"
              >
                <Form.Label>Name</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                controlId="validationCustom02"
              >
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  required
                  type="number"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Email.
                </Form.Control.Feedback>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>
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
            </Row>
            <Row className="mb-3">
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
                  options={options}
                  onChange={(selectedOptions) => {
                    const values = selectedOptions.map(
                      (option) => option.value
                    );
                    setFormRoles(values);
                    //console.log(formRoles);
                  }}
                  value={getSelectedOptions(formRoles)}
                />
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label># of Workers</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Number of Workers"
                  value={therapist}
                  onChange={(e) => setTherapist(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Worker Number.
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom06"
              >
                <Form.Label>Event Hours</Form.Label>
                <Form.Select
                  value={eventHours}
                  onChange={(e) => setEventHours(e.target.value)}
                  required
                >
                  <option value="2">2 Hours</option>
                  <option value="2.5">2 Hours 30 Minutes</option>
                  <option value="3">3 Hours</option>
                  <option value="3.5">3 Hours 30 Minutes</option>
                  <option value="4">4 Hours</option>
                  <option value="4.5">4 Hours 30 Minutes</option>
                  <option value="5">5 Hours</option>
                  <option value="5.5">5 Hours 30 Minutes</option>
                  <option value="6">6 Hours</option>
                  <option value="6.5">6 Hours 30 Minutes</option>
                  <option value="7">7 Hours 30 Minutes</option>
                  <option value="7.5">7 Hours 30 Minutes</option>
                  <option value="8">8 Hours</option>
                  <option value="8.5">8 Hours 30 Minutes</option>
                  <option value="9">9 Hours</option>
                  <option value="9.5">9 Hours</option>
                  <option value="10">10 Hours</option>
                  <option value="10.5">10 Hours 30 Minutes</option>
                  <option value="11">11 Hours</option>
                  <option value="11.5">11 Hours 30 Minutes</option>
                  <option value="12">12 Hours</option>
                  <option value="12.5">12 Hours 30 Minutes</option>
                </Form.Select>
              </Form.Group>

              <Form.Group
                xs={12}
                md={4}
                as={Col}
                controlId="validationCustom07"
              >
                <Form.Label>Event Increments</Form.Label>
                <Form.Select
                  value={eventIncrement}
                  onChange={(e) => setEventIncrement(e.target.value)}
                  required
                >
                  <option value="10">10 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="20">20 Minutes</option>
                </Form.Select>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Availiable Date</Form.Label>
                <Form.Control
                  type="Date"
                  placeholder="Date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid date.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="time"
                  placeholder="Time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Start Time.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom05"
              >
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="time"
                  placeholder="Time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid End Time.
                </Form.Control.Feedback>
              </Form.Group>
              <InputGroup>
                <InputGroup.Text>Anything else?</InputGroup.Text>
                <Form.Control
                  as="textarea"
                  aria-label="With textarea"
                  value={extra}
                  onChange={(e) => {
                    setExtra(e.target.value);
                    //console.log(extra);
                  }}
                />
              </InputGroup>
              <Form.Group
                as={Col}
                controlId="validationCustom07"
                style={{ marginTop: "6%" }}
              >
                <p>Total: ${price}</p>
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

export default ConfirmBooking;
