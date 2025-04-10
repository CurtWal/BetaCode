const express = require("express");
const { google } = require("googleapis");
const Booking = require("../model/bookings");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();
const fs = require("fs");

const auth = new google.auth.GoogleAuth({
    credentials: {
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Ensure newlines are handled correctly
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const spreadsheetId = process.env.SPREADSHEET;


const convertTo12Hour = (time) => {
    if (!time) return ""; // Handle empty or undefined values
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12AM
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };
router.post("/export-bookings", verifyToken, async (req, res) => {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });
    
        // Get existing rows from the sheet
        const readRes = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: "Sheet1",
        });
    
        const existingRows = readRes.data.values || [];
    
        // Fetch confirmed bookings
        const bookings = await Booking.find({ confirmed: true }).lean();
    
        const newRows = [];
        const updates = [];
    
        for (const b of bookings) {
          const row = [
            `$${b.price}`,
            b.companyName,
            b.name,
            b.email,
            b.address,
            b.zipCode,
            b.therapist,
            b.eventHours,
            b.eventIncrement,
            b.date,
            convertTo12Hour(b.startTime),
            convertTo12Hour(b.endTime),
            b.isComplete ? "TRUE" : "FALSE", // Column M
          ];
    
          const matchIndex = existingRows.findIndex((r) =>
            r[0] === row[0] &&
            r[1] === row[1] &&
            r[2] === row[2] &&
            r[3] === row[3] &&
            r[4] === row[4] &&
            r[5] === row[5] &&
            r[6] === row[6] &&
            r[7] === row[7] &&
            r[8] === row[8] &&
            r[9] === row[9] &&
            r[10] === row[10] &&
            r[11] === row[11]
          );
    
          if (matchIndex === -1) {
            // Booking not in sheet, add to newRows
            newRows.push(row);
          } else {
            // Booking already in sheet, check isComplete
            const sheetIsComplete = existingRows[matchIndex][12]; // Column M
            if (b.isComplete && sheetIsComplete !== "TRUE") {
              const rowNumber = matchIndex + 1; // Google Sheets is 1-indexed
              updates.push(
                sheets.spreadsheets.values.update({
                  spreadsheetId,
                  range: `Sheet1!M${rowNumber}`,
                  valueInputOption: "RAW",
                  resource: {
                    values: [["TRUE"]],
                  },
                })
              );
            }
          }
        }
    
        // Add new bookings to the sheet
        if (newRows.length > 0) {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Sheet1",
            valueInputOption: "RAW",
            resource: {
              values: newRows,
            },
          });
        }
    
        // Update isComplete values
        if (updates.length > 0) {
          await Promise.all(updates);
        }
    
        res.status(200).json({
          message: "Export complete",
          added: newRows.length,
          updated: updates.length,
        });
      } catch (err) {
        console.error("Error exporting to Google Sheets:", err);
        res.status(500).json({ message: "Export failed", error: err.message });
      }
});

module.exports = router;