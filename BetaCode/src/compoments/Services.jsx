import React from "react";
import { useNavigate } from "react-router-dom";
import "../services.css";
import med from "../assets/meditation.png";
function Services() {
  const navigate = useNavigate();

  const handleButtonClick = (link) => {
    switch (link) {
      case "2":
        navigate("/medical-form");
        break;
      case "3":
        navigate("/special-form");
        break;
    }
  };
  return (
    <div className="Service-container">
      {/* Intro Section */}
      <section className="intro">
        <h1>Introducing MOTG-Wellbeing</h1>
        <p>
          A Corporate Wellness Company providing robust onsite group fitness
          programming and activities to get employees engaged, moving and living
          and healthier lifestyle.
        </p>
        {/* <button className="learn-more-btn">Learn More</button> */}
      </section>

      {/* Services Section */}
      <section className="services-section">
        <h1 className="services-title">Services</h1>
        <p className="services-subtitle">Strength. Vitality. Balance.</p>

        <div className="services-grid">
          <div className="service-item">
            <img src={med} alt="Online Fitness" style={{ marginLeft: "25%" }} />
            <p>Corporate Wellbeing</p>
          </div>
          <div className="service-item">
            <img src={med} alt="Technology" style={{ marginLeft: "25%", cursor:"pointer" }} onClick={() => handleButtonClick("2")}/>
            <a href="http://localhost:5173/medical-form" style={{color:"white"}}>Medical Wellbeing</a>
          </div>
          <div className="service-item">
            <img
              src={med}
              alt="Employee Benefits"
              style={{ marginLeft: "25%", cursor:"pointer" }}
              onClick={() => handleButtonClick("3")}
            />
            <a href="http://localhost:5173/special-form" style={{color:"white"}}>ST. Jude Service</a>
            <p></p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Services;
