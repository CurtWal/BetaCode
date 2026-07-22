const crypto = require("crypto");
const express = require("express");
const Booking = require("../model/bookings");

const SCHEMA_VERSION = "motg-booking-read-v1";
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const ALLOWED_QUERY_FIELDS = new Set(["bookingId", "date", "query", "limit"]);
const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function createBookingReadRouter({ bookingModel = Booking, now = () => new Date() } = {}) {
  const router = express.Router();
  router.get("/bookings", createBookingReadHandler({ bookingModel, now }));
  return router;
}

function createBookingReadHandler({ bookingModel = Booking, now = () => new Date() } = {}) {
  return async function bookingReadHandler(req, res) {
    setReadOnlyHeaders(res);

    const authorizationError = authorize(req.headers?.authorization, process.env.MOTG_BOOKING_BACKEND_READ_BEARER_TOKEN);
    if (authorizationError) {
      return sendError(res, authorizationError.status, authorizationError.code, authorizationError.message);
    }

    let parsed;
    try {
      parsed = parseBookingReadQuery(req.query || {});
    } catch (error) {
      return sendError(res, 400, "invalid_query", error.message);
    }

    try {
      const documents = await bookingModel
        .find(parsed.filter)
        .select({
          _id: 1,
          companyName: 1,
          name: 1,
          email: 1,
          address: 1,
          zipCode: 1,
          services: 1,
          formRoles: 1,
          therapist: 1,
          totalPrice: 1,
          price: 1,
          payType: 1,
          date: 1,
          startTime: 1,
          endTime: 1,
          confirmed: 1,
        })
        .sort({ date: 1, startTime: 1, _id: 1 })
        .limit(parsed.limit + 1)
        .lean();

      const truncated = documents.length > parsed.limit;
      const visibleDocuments = documents.slice(0, parsed.limit);
      const bookings = visibleDocuments.map(sanitizeBooking);

      return res.status(200).json({
        schemaVersion: SCHEMA_VERSION,
        observedAt: now().toISOString(),
        complete: !truncated,
        truncated,
        bounds: {
          requestedLimit: parsed.limit,
          returnedCount: bookings.length,
          hasMore: truncated,
        },
        bookings,
      });
    } catch (error) {
      console.error(
        "Error reading booking reconciliation candidates:",
        error && error.name ? error.name : "unknown_error",
      );
      return sendError(
        res,
        503,
        "booking_store_unavailable",
        "The booking records could not be read.",
      );
    }
  };
}

function authorize(authorizationHeader, configuredToken) {
  const expected = String(configuredToken || "").trim();
  if (!expected) {
    return {
      status: 503,
      code: "read_credential_unavailable",
      message: "The booking read credential is not configured.",
    };
  }

  const match = /^Bearer ([^\s]+)$/.exec(String(authorizationHeader || ""));
  if (!match || !tokensMatch(match[1], expected)) {
    return {
      status: 401,
      code: "unauthorized",
      message: "A valid booking read credential is required.",
    };
  }
  return null;
}

function tokensMatch(actual, expected) {
  const actualDigest = crypto.createHash("sha256").update(actual).digest();
  const expectedDigest = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(actualDigest, expectedDigest);
}

function parseBookingReadQuery(query) {
  for (const key of Object.keys(query)) {
    if (!ALLOWED_QUERY_FIELDS.has(key)) {
      throw new Error(`Unsupported query field: ${key}`);
    }
    if (Array.isArray(query[key])) {
      throw new Error(`Query field ${key} must be provided once.`);
    }
  }

  const bookingId = cleanText(query.bookingId);
  const eventDate = cleanText(query.date);
  const eventQuery = cleanText(query.query);
  const limit = parseLimit(query.limit);

  if (!bookingId && !eventDate && !eventQuery) {
    throw new Error("Provide bookingId, date, or query to bound the booking lookup.");
  }
  if (bookingId && !OBJECT_ID_PATTERN.test(bookingId)) {
    throw new Error("bookingId must be a 24-character hexadecimal ID.");
  }
  if (eventDate && !isRealIsoDate(eventDate)) {
    throw new Error("date must be a real calendar date in YYYY-MM-DD format.");
  }
  if (eventQuery && (eventQuery.length < 3 || eventQuery.length > 128)) {
    throw new Error("query must be between 3 and 128 characters.");
  }

  const filter = {};
  if (bookingId) {
    filter._id = bookingId;
  }
  if (eventDate) {
    filter.date = eventDate;
  }
  if (eventQuery) {
    const literalQuery = new RegExp(escapeRegularExpression(eventQuery), "i");
    filter.$or = [
      { companyName: literalQuery },
      { name: literalQuery },
      { address: literalQuery },
      { zipCode: literalQuery },
    ];
  }

  return { filter, limit };
}

function parseLimit(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_LIMIT;
  }
  if (!/^\d+$/.test(String(value))) {
    throw new Error("limit must be an integer.");
  }
  const limit = Number(value);
  if (limit < 1 || limit > MAX_LIMIT) {
    throw new Error(`limit must be between 1 and ${MAX_LIMIT}.`);
  }
  return limit;
}

function isRealIsoDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeBooking(document) {
  const services = Array.isArray(document.services)
    ? document.services.map(sanitizeService).filter(Boolean)
    : [];
  const serviceRoles = uniqueStrings([
    ...services.map((service) => service.role),
    ...(Array.isArray(document.formRoles) ? document.formRoles : []),
  ]);
  const serviceWorkers = services.reduce(
    (total, service) => total + (Number.isInteger(service.workers) ? service.workers : 0),
    0,
  );
  const legacyWorkers = finiteNumber(document.therapist);

  const booking = {
    bookingId: String(document._id),
    companyName: cleanText(document.companyName),
    clientName: cleanText(document.name),
    clientEmail: cleanText(document.email),
    eventAddress: cleanText(document.address),
    zipCode: cleanText(document.zipCode),
    eventDate: cleanText(document.date),
    startTime: cleanText(document.startTime),
    endTime: cleanText(document.endTime),
    confirmed: document.confirmed === true,
  };

  if (services.length) booking.services = services;
  if (serviceRoles.length) booking.serviceRoles = serviceRoles;
  if (serviceWorkers > 0 || legacyWorkers !== null) {
    booking.workers = serviceWorkers > 0 ? serviceWorkers : legacyWorkers;
  }

  const totalPrice = finiteNumber(document.totalPrice) ?? finiteNumber(document.price);
  if (totalPrice !== null) booking.totalPrice = totalPrice;

  const payType = cleanText(document.payType);
  if (payType) booking.payType = payType;

  return booking;
}

function sanitizeService(service) {
  if (!service || typeof service !== "object") return null;
  const sanitized = {};
  const role = cleanText(service.role);
  if (role) sanitized.role = role;
  for (const field of ["workers", "hours", "increment"]) {
    const value = finiteNumber(service[field]);
    if (value !== null) sanitized[field] = value;
  }
  return Object.keys(sanitized).length ? sanitized : null;
}

function finiteNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function uniqueStrings(values) {
  const unique = [];
  for (const value of values) {
    const cleaned = cleanText(value).toLowerCase();
    if (cleaned && !unique.includes(cleaned)) unique.push(cleaned);
  }
  return unique;
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function setReadOnlyHeaders(res) {
  res.set("Cache-Control", "private, no-store");
  res.set("Pragma", "no-cache");
}

function sendError(res, status, code, message) {
  return res.status(status).json({
    schemaVersion: SCHEMA_VERSION,
    complete: false,
    truncated: false,
    error: { code, message },
  });
}

const router = createBookingReadRouter();

module.exports = router;
module.exports.createBookingReadHandler = createBookingReadHandler;
module.exports.parseBookingReadQuery = parseBookingReadQuery;
module.exports.sanitizeBooking = sanitizeBooking;
