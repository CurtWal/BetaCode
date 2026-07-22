const { createHash } = require("node:crypto");

const MAX_IDEMPOTENCY_KEY_LENGTH = 200;
const DEFAULT_REPLAY_WAIT_ATTEMPTS = 50;
const DEFAULT_REPLAY_WAIT_MS = 100;

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function bookingRequestDigest(body) {
  return createHash("sha256").update(canonicalJson(body)).digest("hex");
}

function bookingFields(body, location) {
  const {
    companyName,
    name,
    email,
    address,
    zipCode,
    services,
    totalPrice,
    payType,
    startTime,
    endTime,
    date,
    extra,
    formType,
    phoneNumber,
  } = body;

  return {
    companyName,
    name,
    email,
    address,
    zipCode,
    services,
    totalPrice,
    payType,
    startTime,
    endTime,
    extra,
    date,
    confirmed: false,
    location,
    formType,
    phoneNumber,
  };
}

function idempotencyKeyFromRequest(req) {
  const value =
    typeof req.get === "function"
      ? req.get("Idempotency-Key")
      : req.headers?.["idempotency-key"];
  if (Array.isArray(value)) return String(value[0] || "").trim();
  return String(value || "").trim();
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function bookingId(booking) {
  return String(booking?._id || booking?.id || "");
}

function matchedDocument(result) {
  return Number(result?.matchedCount ?? result?.n ?? 0) === 1;
}

function keyedSuccess(res, booking, key, replayed) {
  res.set("Idempotency-Key", key);
  return res.status(200).json({
    message: "Booking confirmed and email sent!",
    bookingId: bookingId(booking),
    idempotencyKey: key,
    replayed,
  });
}

function conflict(res, key) {
  res.set("Idempotency-Key", key);
  return res.status(409).json({
    error: "Idempotency key was already used for a different booking request.",
    code: "idempotency_key_conflict",
    idempotencyKey: key,
  });
}

async function findByIdempotencyKey(bookingModel, key) {
  return bookingModel.findOne({ idempotencyKey: key });
}

function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function completedReplay({
  bookingModel,
  key,
  digest,
  wait,
  waitAttempts,
  waitMilliseconds,
}) {
  for (let attempt = 0; attempt < waitAttempts; attempt += 1) {
    const existing = await findByIdempotencyKey(bookingModel, key);
    if (!existing) return null;
    if (existing.idempotencyRequestDigest !== digest) {
      return { conflict: true };
    }
    if (existing.idempotencyStatus === "completed") {
      return { booking: existing };
    }
    if (attempt + 1 < waitAttempts) await wait(waitMilliseconds);
  }
  return { pending: true };
}

function createBookingHandler({
  bookingModel,
  geocodeZipCode,
  sendBookingNotification,
  wait = pause,
  replayWaitAttempts = DEFAULT_REPLAY_WAIT_ATTEMPTS,
  replayWaitMilliseconds = DEFAULT_REPLAY_WAIT_MS,
  logger = console,
}) {
  return async function newBooking(req, res) {
    const key = idempotencyKeyFromRequest(req);
    if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
      return res.status(400).json({
        error: `Idempotency-Key must be ${MAX_IDEMPOTENCY_KEY_LENGTH} characters or fewer.`,
        code: "invalid_idempotency_key",
      });
    }

    if (!key) {
      try {
        const location = await geocodeZipCode(req.body.zipCode);
        const newBooking = await bookingModel.create(bookingFields(req.body, location));
        try {
          await sendBookingNotification(newBooking, req.body.payType);
        } catch (error) {
          logger.error("Error sending email via Mailgun:", error);
        }
        return res.status(200).json({ message: "Booking confirmed and email sent!" });
      } catch (error) {
        logger.error("Error processing booking:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }

    const digest = bookingRequestDigest(req.body);
    let newBooking;
    try {
      newBooking = await bookingModel.create({
        ...bookingFields(req.body, null),
        idempotencyKey: key,
        idempotencyRequestDigest: digest,
        idempotencyStatus: "processing",
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        logger.error("Error processing booking:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      try {
        const replay = await completedReplay({
          bookingModel,
          key,
          digest,
          wait,
          waitAttempts: replayWaitAttempts,
          waitMilliseconds: replayWaitMilliseconds,
        });
        if (replay?.conflict) return conflict(res, key);
        if (replay?.booking) return keyedSuccess(res, replay.booking, key, true);
        return res.status(503).json({
          error: "The original booking request is still being processed. Please retry shortly.",
          code: "idempotency_request_in_progress",
          idempotencyKey: key,
        });
      } catch (replayError) {
        logger.error("Error reading booking idempotency record:", replayError);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }

    try {
      const location = await geocodeZipCode(req.body.zipCode);
      newBooking.location = location;
      const locationUpdate = await bookingModel.updateOne(
        {
          _id: newBooking._id,
          idempotencyKey: key,
          idempotencyRequestDigest: digest,
          idempotencyStatus: "processing",
        },
        { $set: { location } },
      );
      if (!matchedDocument(locationUpdate)) {
        throw new Error("Booking reservation was not available for geocode finalization.");
      }
    } catch (error) {
      try {
        await bookingModel.deleteOne({
          _id: newBooking._id,
          idempotencyKey: key,
          idempotencyStatus: "processing",
        });
      } catch (cleanupError) {
        logger.error("Error cleaning up failed booking reservation:", cleanupError);
      }
      logger.error("Error processing booking:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    try {
      await sendBookingNotification(newBooking, req.body.payType);
    } catch (error) {
      logger.error("Error sending email via Mailgun:", error);
    }

    try {
      const completionUpdate = await bookingModel.updateOne(
        {
          _id: newBooking._id,
          idempotencyKey: key,
          idempotencyRequestDigest: digest,
          idempotencyStatus: "processing",
        },
        {
          $set: {
            idempotencyStatus: "completed",
            idempotencyCompletedAt: new Date(),
          },
        },
      );
      if (!matchedDocument(completionUpdate)) {
        throw new Error("Booking reservation was not available for idempotency finalization.");
      }
    } catch (error) {
      logger.error("Error finalizing booking idempotency record:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    return keyedSuccess(res, newBooking, key, false);
  };
}

module.exports = {
  bookingRequestDigest,
  canonicalJson,
  createBookingHandler,
};
