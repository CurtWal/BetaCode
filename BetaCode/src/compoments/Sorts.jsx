import React, { useState } from "react";

const shifts = [
  { name: "Morning Sort", time: "5 AM - 10 AM", slots: 5 },
  { name: "Day Sort", time: "11 AM - 5 PM", slots: 5 },
  { name: "Night Sort", time: "6 PM - 10 PM", slots: 5 },
];


function Sorts() {
        const [workers, setWorkers] = useState({
          "Morning Sort": [],
          "Day Sort": [],
          "Night Sort": [],
        });
      
        const addWorker = (shiftName) => {
          const name = prompt("Enter worker name:");
          if (name && workers[shiftName].length < shifts.find(s => s.name === shiftName).slots) {
            setWorkers(prev => ({
              ...prev,
              [shiftName]: [...prev[shiftName], name],
            }));
          } else {
            alert("Shift is full or invalid name.");
          }
        };

        const removeWorker = (shiftName, index) => {
            setWorkers(prev => ({
              ...prev,
              [shiftName]: prev[shiftName].filter((_, i) => i !== index),
            }));
          };
      
        return (
          <div className="flex flex-col items-center p-6">
            <h2 className="text-xl font-bold mb-4">Sort Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <div key={shift.name} className="p-4 border rounded-lg shadow-lg w-64 bg-white">
                  <h3 className="text-lg font-semibold">{shift.name}</h3>
                  <p className="text-sm text-gray-600">{shift.time}</p>
                  <ul className="mt-2">
                    {workers[shift.name].map((worker, index) => (
                      <li key={index} className="text-blue-500">{worker}
                       <button onClick={() => removeWorker(shift.name, index)} className="ml-2 text-red-500">✖</button>
                      </li>
                    ))}
                  </ul>
                  {workers[shift.name].length < shift.slots && (
                    <button
                      onClick={() => addWorker(shift.name)}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Add Worker
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
}

export default Sorts;