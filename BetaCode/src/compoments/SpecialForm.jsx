import { useState, useEffect } from "react";
import "../App.css";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import axios from "axios";
import Modal from "react-bootstrap/Modal";
import Payment from "./payment";
import Logo from "../assets/MOTG_Revised_Logo.png";

function SpecialForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [therapist, setTherapist] = useState(1);
  const [eventHours, setEventHours] = useState(2);
  const [eventIncrement, setEventIncrement] = useState(10);
  const [price, setPrice] = useState(90);
  const [specialPrice, setSpecialPrice] = useState(90);
  const [payType, setPayType] = useState("Check");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [extra, setExtra] = useState("");
  const [date, setDate] = useState("");
  const [validated, setValidated] = useState(false);
  const [formType, setFormType] = useState("special");
  const [show, setShow] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const payModalClose = () => setPayModal(false);

  const data = [
    {
      therapists: "1 Therapist",
      duration: "1 Hour",
      massages: "6 Clients",
      cost: `$${specialPrice}`,
    },
    {
      therapists: "1 Therapist",
      duration: "2 Hour",
      massages: "12 Clients",
      cost: `$${specialPrice * 2}`,
    },
    {
      therapists: "2 Therapist",
      duration: "1 Hour",
      massages: "12 Clients",
      cost: `$${specialPrice * 2}`,
    },
    {
      therapists: "2 Therapist",
      duration: "2 Hour",
      massages: "24 Clients",
      cost: `$${specialPrice * 4}`,
    },
    {
      therapists: "3 Therapist",
      duration: "1 Hour",
      massages: "18 Clients",
      cost: `$${specialPrice * 3}`,
    },
  ];

  const postBookings = async (e) => {
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);
    e.preventDefault();
    if (form.checkValidity() === true) {
      setPayModal(true);
      setFormType("special");
    }
  };
  const postBookingsbyCheck = async (e) => {
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);
    e.preventDefault();
    if (form.checkValidity() === true) {
      const newBooking = {
        companyName,
        name,
        email,
        address,
        zipCode,
        therapist,
        eventHours,
        eventIncrement,
        price,
        payType,
        startTime,
        endTime,
        extra,
        date
      };

      await axios.post(
        `${import.meta.env.VITE_VERCEL}new-booking`,
        newBooking
      );

      alert("Payment successful! Booking email Sent.");

      console.log("Booking successful");
    }
  };
  const getBookingPrices = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_VERCEL}admin/booking-prices`
      );
      setSpecialPrice(response.data.specialBooking);
    } catch (error) {
      console.error("Error fetching booking prices:", error);
    }
  };
  useEffect(() => {
    getBookingPrices();
  }, []);
  useEffect(() => {
    setPrice(therapist * specialPrice * eventHours);
  }, [therapist, eventHours]);
  return (
    <div className="Grid-Container">
      <img src={Logo} alt="MOTG Logo" className="Main_Img" />
      <div className="Container">
        <div className="Text-Info">
          <h3>1 Therapist</h3>
          <h4>${specialPrice}/hour</h4>
          <hr></hr>
          <ul class="list-none md:list-disc ...">
            <li>Minimum 2 hour Booking</li>
            <li>Can Serve 6 people in 1 hour</li>
            <li>Availiable in 10, 15, and 20 minute increments</li>
          </ul>
          <h6>
            Disclaimer: 6 people can only be served based on 10 minute
            increments
          </h6>
          <p class="flex justify-end cursor-pointer" onClick={handleShow}>
            <u class="hover:text-sky-700">Price List</u>
          </p>
        </div>
        <div>
          <Modal
            show={show}
            onHide={handleClose}
            centered
            size="xl"
            dialogClassName="custom-modal"
          >
            <Modal.Header closeButton>
              <div className="Modal-Text">
                <Modal.Title>Pricing Structure</Modal.Title>
              </div>
            </Modal.Header>
            <Modal.Body>
              <div className="Modal_Container">
                <div className="Text-Info">
                  <h3>1 Therapist</h3>
                  <h4>$90/hour</h4>
                  <hr></hr>
                  <ul class="list-none md:list-disc ...">
                    <li>Minimum 2 hour Booking</li>
                    <li>Can Serve 6 people in 1 hour</li>
                    <li>Availiable in 10, 15, and 20 minute increments</li>
                  </ul>
                  <h6>
                    Disclaimer: 6 people can only be served based on 10 minute
                    increments
                  </h6>
                </div>
                <div className="Options">
                  <h4>CUSTOMIZABLE OPTIONS </h4>
                  <h5>
                    THE NUMBER OF THERAPISTS AND DURATION CAN BE ADJUSTED BASED
                    ON YOUR COMPANY SIZE AND NEEDS. PLEASE SEE BELOW FOR
                    EXAMPLES OF PACKAGES AVAILABLE{" "}
                  </h5>
                  <h5>
                    SUBSCRIPTION SERVICES: BOOK A BUNDLE CHAIR MASSAGE EVENT AND
                    RECEIVE A DISCOUNT. BOOK THREE EVENTS AND GET 15% OFF THE
                    TOTAL COST.
                  </h5>
                </div>
              </div>

              <div>
                <h2 class="flex justify-center">Package Examples</h2>
                <div className="table-container">
                  <table className="w-full border-collapse text-white mt-4">
                    <thead>
                      <tr className="text-lg font-bold">
                        <th className="p-4 bg-indigo-700 rounded-tl-xl">
                          NUMBER OF THERAPIST
                        </th>
                        <th className="p-4 bg-blue-700">DURATION</th>
                        <th className="p-4 bg-blue-600">TOTAL MASSAGES</th>
                        <th className="p-4 bg-cyan-400 rounded-tr-xl">
                          Total Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => (
                        <tr
                          key={index}
                          className={`text-center text-lg transition hover:bg-gray-700 ${
                            index % 2 === 0 ? "bg-gray-600" : "bg-gray-700"
                          }`}
                        >
                          <td className="p-4">{row.therapists}</td>
                          <td className="p-4">{row.duration}</td>
                          <td className="p-4">{row.massages}</td>
                          <td className="p-4 font-semibold text-lg bg-cyan-500 ">
                            {row.cost}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Modal.Body>
          </Modal>
        </div>
        <div className="FormInput">
          <Form noValidate validated={validated} onSubmit={postBookings}>
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
                  onChange={(e) => setCompanyName(e.target.value)}
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
                controlId="validationCustom01"
              >
                <Form.Label>Name</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="Name"
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
                <Form.Label># of Therapist</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Number of Therapist"
                  onChange={(e) => setTherapist(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid Therapist Number.
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId="validationCustom06"
              >
                <Form.Label>Event Hours</Form.Label>
                <Form.Select
                  onChange={(e) => setEventHours(e.target.value)}
                  required
                >
                  <option value="2">2 hours</option>
                  <option value="3">3 Hours</option>
                  <option value="4">4 Hours</option>
                  <option value="5">5 Hours</option>
                </Form.Select>
              </Form.Group>

              <Form.Group
                xs={12}
                md={4}
                as={Col}
                controlId="validationCustom07"
              >
                <Form.Label>Massage Increments</Form.Label>
                <Form.Select
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
                  onChange={(e) => setDate(e.target.value)}
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
                  onChange={(e) => setStartTime(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid End Time.
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
                  onChange={(e) => setEndTime(e.target.value)}
                  min="1"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid End Time.
                </Form.Control.Feedback>
              </Form.Group>
              <InputGroup>
                <InputGroup.Text>With textarea</InputGroup.Text>
                <Form.Control as="textarea" aria-label="With textarea" onChange={(e) => {setExtra(e.target.value); console.log(extra)}} />
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
              <Form.Group
                as={Col}
                controlId="validationCustom07"
                style={{ marginTop: "4%" }}
              >
                <Button type="submit">Book & Pay by Card</Button>
              </Form.Group>
              <Form.Group
                as={Col}
                controlId="validationCustom07"
                style={{ marginTop: "4%" }}
              >
                <Button onClick={postBookingsbyCheck} style={{ backgroundColor: 'red' }}>
                  Book & Pay by Check
                </Button>
              </Form.Group>
            </Row>
          </Form>
        </div>
        <div>
          <Modal
            show={payModal}
            onHide={payModalClose}
            centered
            dialogClassName="custom-modal"
          >
            <Modal.Body style={{ background: "rgb(0 0 0 / 40%)" }}>
              <Payment
                price={price}
                payModalClose={payModalClose}
                name={name}
                email={email}
                address={address}
                zipCode={zipCode}
                therapist={therapist}
                eventHours={eventHours}
                eventIncrement={eventIncrement}
                formType={formType}
                companyName={companyName}
                startTime={startTime}
                endTime={endTime}
                date={date}
                extra={extra}
              />
            </Modal.Body>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default SpecialForm;
