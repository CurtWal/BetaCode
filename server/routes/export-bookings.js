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
    
        // Build a quick map of existing rows by booking id for fast lookup
        const existingMap = new Map();
        for (let i = 0; i < existingRows.length; i++) {
          const row = existingRows[i];
          if (row && row[0]) existingMap.set(row[0].toString(), { row, index: i });
        }

        const newRows = [];
        const valueRangesToUpdate = [];

        for (const b of bookings) {
          // Compute totals: prefer new-schema values (services / totalPrice) and fall back to legacy fields
          let totalPrice =
            typeof b.totalPrice !== "undefined" ? b.totalPrice : b.price || 0;
          let totalWorkers =
            typeof b.therapist === "number" ? b.therapist : 0;
          let totalHours =
            typeof b.eventHours === "number" ? b.eventHours : 0;
          let totalIncrement =
            typeof b.eventIncrement === "number" ? b.eventIncrement : 0;

          if (Array.isArray(b.services) && b.services.length > 0) {
            totalPrice =
              b.services.reduce((acc, svc) => acc + (Number(svc.price) || 0), 0) ||
              totalPrice;
            totalWorkers =
              b.services.reduce((acc, svc) => acc + (Number(svc.workers) || 0), 0) ||
              totalWorkers;
            totalHours =
              b.services.reduce((acc, svc) => acc + (Number(svc.hours) || 0), 0) ||
              totalHours;
            totalIncrement =
              b.services.reduce(
                (acc, svc) => acc + (Number(svc.increment) || 0),
                0
              ) || totalIncrement;
          }

          const row = [
            b._id.toString(),
            `$${totalPrice}`,
            b.companyName,
            b.name,
            b.email,
            b.address,
            b.zipCode,
            totalWorkers,
            totalHours,
            totalIncrement,
            b.date,
            convertTo12Hour(b.startTime),
            convertTo12Hour(b.endTime),
            b.isComplete ? "TRUE" : "FALSE",
          ];

          const existing = existingMap.get(b._id.toString());
          if (!existing) {
            // Booking not in sheet, add to newRows
            newRows.push(row);
          } else {
            // Only update if the row content changed
            const existingRow = existing.row;
            // Normalize undefineds to empty strings for fair comparison
            const normalize = (arr) => arr.map((c) => (typeof c === "undefined" ? "" : String(c)));
            if (JSON.stringify(normalize(existingRow)) !== JSON.stringify(normalize(row))) {
              const rowNumber = existing.index + 1;
              valueRangesToUpdate.push({
                range: `Sheet1!A${rowNumber}:N${rowNumber}`,
                values: [row],
              });
            }
          }
        }
    
        // Add new bookings to the sheet (single append)
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
    
        // Batch-update only rows that actually changed
        async function sleep(ms) {
          return new Promise((r) => setTimeout(r, ms));
        }
    
        async function sendBatchUpdate(ranges) {
          const resource = {
            data: ranges.map((r) => ({ range: r.range, values: r.values })),
            valueInputOption: "RAW",
          };
          return sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            resource,
          });
        }
    
        // chunk size tuned to avoid per-minute-per-user quota (adjust if needed)
        const CHUNK_SIZE = 25;
        const chunks = [];
        for (let i = 0; i < valueRangesToUpdate.length; i += CHUNK_SIZE) {
          chunks.push(valueRangesToUpdate.slice(i, i + CHUNK_SIZE));
        }
    
        for (const chunk of chunks) {
          let attempt = 0;
          const maxAttempts = 5;
          let backoffMs = 1000;
          while (attempt < maxAttempts) {
            try {
              await sendBatchUpdate(chunk);
              break; // success, move to next chunk
            } catch (err) {
              attempt++;
              const status = err && err.response && err.response.status;
              if (status === 429 || (status >= 500 && status < 600)) {
                console.warn(`Batch update attempt ${attempt} failed (${status}). retrying in ${backoffMs}ms`);
                await sleep(backoffMs);
                backoffMs *= 2;
                continue;
              }
              throw err;
            }
          }
        }
        res.status(200).json({
          message: "Export complete",
          added: newRows.length,
          updated: valueRangesToUpdate.length,
        });
      } catch (err) {
        console.error("Error exporting to Google Sheets:", err);
        res.status(500).json({ message: "Export failed", error: err.message });
      }
});

module.exports = router;