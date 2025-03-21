import { useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ConfirmBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmBooking = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_VERCEL}confirm-booking/${id}`
        );

        alert(response.data); // Show success message
      } catch (err) {
        console.error("Error confirming booking:", err);
        alert("Error confirming booking. No Therapist In Range.");
      }
    };

    confirmBooking();
  }, [id]);

  return (
    <div style={{ backgroundColor: "white", width: "500px", height: "100px" }}>
      <h2>Processing Booking Confirmation...</h2>
    </div>
  );
};

export default ConfirmBooking;
