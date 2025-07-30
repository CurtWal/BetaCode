import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import makeAnimated from "react-select/animated";
import Select from "react-select";

function UserProfiles() {
  const animatedComponents = makeAnimated();
  const [formRoles, setFormRoles] = useState([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    zip: "",
    email: "",
    role: formRoles,
  });
  const roleOptions = [
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

  const userRoles = [
    "therapist",
    "group",
    "nutritionist",
    "pilates",
    "stretch",
    "cpr",
    "meditation",
    "zumba",
    "wellness",
    "ergonomics",
    "breathwork",
    "admin",
  ];
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
  const hasRole = (targetRoles) => {
    try {
      const role = JSON.parse(localStorage.getItem("role") || "[]");
      const userRoles = Array.isArray(role) ? role : [role];
      return userRoles.some((r) => targetRoles.includes(r));
    } catch (e) {
      return false;
    }
  };
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_VERCEL}account/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const user = res.data;
        console.log(user);
        setForm({
          name: user.username || "",
          address: user.address || "",
          phone: user.phone || "",
          zip: user.zipCode || "",
          email: user.email || "",
          role: user.role || [],
        });
      } catch (err) {
        console.error("Error loading user:", err.response?.data || err);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    try {
      await axios.put(
        `${import.meta.env.VITE_VERCEL}account/${userId}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Account updated successfully!");
    } catch (err) {
      console.error("Error updating user:", err.response?.data || err);
    }
  };
  const getSelectedOptions = (selectedValues) => {
    return options.filter((opt) => selectedValues.includes(opt.value));
  };
  return (
    <div class="Main-Content">
      <div className="Grid-Container">
        <div className="FormInput">
          <h2 className="mb-4" style={{ textAlign: "center" }}>
            Account
          </h2>
          <div className="Container">
            {/* Regular Account Will see this one */}
            {hasRole(!userRoles) && (
              <Form onSubmit={handleSubmit}>
                <Col>
                  <Form.Group controlId="clientName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="Name"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Form.Group controlId="email" className="mt-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-4">
                  Update Account
                </Button>
              </Form>
            )}
            {/* Workers will see this one */}
            {hasRole(userRoles) && (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="clientName">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="Name"
                        value={form.name}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="Address">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        type="address"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col md={6}>
                    <Form.Group controlId="phone">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="number"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="zip">
                      <Form.Label>Zip Code</Form.Label>
                      <Form.Control
                        type="number"
                        name="zip"
                        value={form.zip}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group controlId="email" className="mt-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group controlId="email" className="mt-3">
                  <Form.Label>Email</Form.Label>
                  <p>
                    Role:
                    <Select
                      closeMenuOnSelect={false}
                      isMulti
                      components={animatedComponents}
                      value={getSelectedOptions(form.role)}
                      options={options}
                      onChange={(selectedOptions) => {
                        const values = selectedOptions.map(
                          (option) => option.value
                        );
                        setFormRoles(values);
                      }}
                    />
                  </p>
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-4">
                  Update Account
                </Button>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfiles;
