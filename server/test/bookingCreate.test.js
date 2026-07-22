const assert = require("node:assert/strict");
const test = require("node:test");

const Booking = require("../model/bookings");
const {
  bookingRequestDigest,
  createBookingHandler,
} = require("../routes/bookingCreate");

function bookingPayload(overrides = {}) {
  return {
    companyName: "Paragon",
    name: "Jordan Avery",
    email: "jordan@example.com",
    address: "100 Oxford Way, Oxford, MS 38655",
    zipCode: "38655",
    services: [
      { role: "therapist", workers: 2, hours: 3, increment: 10, price: 698 },
    ],
    totalPrice: 698,
    payType: "pending",
    startTime: "10:00",
    endTime: "13:00",
    date: "2026-08-18",
    extra: "Sam-confirmed booking",
    formType: "promo-corporate-349",
    phoneNumber: "901-555-0100",
    ...overrides,
  };
}

function request(body, key) {
  return {
    body,
    headers: key ? { "idempotency-key": key } : {},
    get(name) {
      return name.toLowerCase() === "idempotency-key"
        ? this.headers["idempotency-key"]
        : undefined;
    },
  };
}

function response() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function matches(document, filter) {
  return Object.entries(filter).every(([key, value]) => String(document[key]) === String(value));
}

function memoryBookingModel({ createFailure = null, updateFailure = null } = {}) {
  const rows = [];
  let nextId = 1;
  const calls = { create: 0, findOne: 0, updateOne: 0, deleteOne: 0 };
  return {
    rows,
    calls,
    async create(attributes) {
      calls.create += 1;
      if (createFailure) throw createFailure;
      if (
        attributes.idempotencyKey &&
        rows.some((row) => row.idempotencyKey === attributes.idempotencyKey)
      ) {
        const error = new Error("duplicate key");
        error.code = 11000;
        error.keyPattern = { idempotencyKey: 1 };
        throw error;
      }
      const document = {
        ...structuredClone(attributes),
        _id: String(nextId++).padStart(24, "0"),
      };
      rows.push(document);
      return document;
    },
    async findOne(filter) {
      calls.findOne += 1;
      return rows.find((row) => matches(row, filter)) || null;
    },
    async updateOne(filter, update) {
      calls.updateOne += 1;
      if (updateFailure) throw updateFailure;
      const document = rows.find((row) => matches(row, filter));
      if (!document) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      Object.assign(document, structuredClone(update.$set || {}));
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    },
    async deleteOne(filter) {
      calls.deleteOne += 1;
      const index = rows.findIndex((row) => matches(row, filter));
      if (index === -1) return { acknowledged: true, deletedCount: 0 };
      rows.splice(index, 1);
      return { acknowledged: true, deletedCount: 1 };
    },
  };
}

function setup(overrides = {}) {
  const model = overrides.model || memoryBookingModel();
  const counts = { geocode: 0, notify: 0 };
  const geocodeZipCode = overrides.geocodeZipCode || (async () => {
    counts.geocode += 1;
    return { lat: 34.3665, lng: -89.5192 };
  });
  const sendBookingNotification = overrides.sendBookingNotification || (async () => {
    counts.notify += 1;
  });
  const logger = { error() {} };
  const handler = createBookingHandler({
    bookingModel: model,
    geocodeZipCode,
    sendBookingNotification,
    wait: () => new Promise((resolve) => setImmediate(resolve)),
    replayWaitAttempts: 100,
    replayWaitMilliseconds: 0,
    logger,
  });
  return { model, counts, handler };
}

test("persists the keyed request and returns stable response evidence", async () => {
  const { model, counts, handler } = setup();
  const res = response();

  await handler(request(bookingPayload(), "booking-key-1"), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.bookingId, "000000000000000000000001");
  assert.equal(res.body.idempotencyKey, "booking-key-1");
  assert.equal(res.body.replayed, false);
  assert.equal(res.headers["Idempotency-Key"], "booking-key-1");
  assert.equal(model.rows.length, 1);
  assert.equal(model.rows[0].idempotencyRequestDigest, bookingRequestDigest(bookingPayload()));
  assert.equal(model.rows[0].idempotencyStatus, "completed");
  assert.equal(counts.geocode, 1);
  assert.equal(counts.notify, 1);
});

test("sequential same-key replay returns the original ID without side effects", async () => {
  const { model, counts, handler } = setup();
  const first = response();
  const replay = response();

  await handler(request(bookingPayload(), "booking-key-2"), first);
  await handler(request(bookingPayload(), "booking-key-2"), replay);

  assert.equal(replay.statusCode, 200);
  assert.equal(replay.body.bookingId, first.body.bookingId);
  assert.equal(replay.body.replayed, true);
  assert.equal(model.rows.length, 1);
  assert.equal(counts.geocode, 1);
  assert.equal(counts.notify, 1);
});

test("concurrent first deliveries create and notify once", async () => {
  const { model, counts, handler } = setup();
  const first = response();
  const replay = response();

  await Promise.all([
    handler(request(bookingPayload(), "booking-key-concurrent"), first),
    handler(request(bookingPayload(), "booking-key-concurrent"), replay),
  ]);

  assert.equal(first.statusCode, 200);
  assert.equal(replay.statusCode, 200);
  assert.equal(first.body.bookingId, replay.body.bookingId);
  assert.deepEqual([first.body.replayed, replay.body.replayed].sort(), [false, true]);
  assert.equal(model.rows.length, 1);
  assert.equal(counts.geocode, 1);
  assert.equal(counts.notify, 1);
});

test("same key with a different payload returns 409 without mutation", async () => {
  const { model, counts, handler } = setup();
  await handler(request(bookingPayload(), "booking-key-conflict"), response());
  const res = response();

  await handler(
    request(bookingPayload({ address: "200 Atlanta Ave, Atlanta, GA 30303" }), "booking-key-conflict"),
    res,
  );

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, "idempotency_key_conflict");
  assert.equal(model.rows.length, 1);
  assert.equal(counts.geocode, 1);
  assert.equal(counts.notify, 1);
});

test("missing key preserves the public form response and needs no backfill", async () => {
  const { model, counts, handler } = setup();
  const res = response();

  await handler(request(bookingPayload()), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: "Booking confirmed and email sent!" });
  assert.equal(res.headers["Idempotency-Key"], undefined);
  assert.equal(model.rows.length, 1);
  assert.equal("idempotencyKey" in model.rows[0], false);
  assert.equal(counts.geocode, 1);
  assert.equal(counts.notify, 1);

  const idempotencyIndex = Booking.schema
    .indexes()
    .find(([fields]) => fields.idempotencyKey === 1);
  assert.ok(idempotencyIndex);
  assert.equal(idempotencyIndex[1].unique, true);
  assert.equal(idempotencyIndex[1].sparse, true);
});

test("database create failure returns 500 before geocode or notification", async () => {
  const model = memoryBookingModel({ createFailure: new Error("database offline") });
  const { counts, handler } = setup({ model });
  const res = response();

  await handler(request(bookingPayload(), "booking-key-db-failure"), res);

  assert.equal(res.statusCode, 500);
  assert.equal(model.rows.length, 0);
  assert.equal(counts.geocode, 0);
  assert.equal(counts.notify, 0);
});

test("database failure while saving geocode cleans up before notification", async () => {
  const model = memoryBookingModel({ updateFailure: new Error("database offline") });
  const { counts, handler } = setup({ model });
  const res = response();

  await handler(request(bookingPayload(), "booking-key-db-update-failure"), res);

  assert.equal(res.statusCode, 500);
  assert.equal(model.rows.length, 0);
  assert.equal(model.calls.deleteOne, 1);
  assert.equal(counts.geocode, 1);
  assert.equal(counts.notify, 0);
});

test("geocode failure removes the keyed reservation and sends no notification", async () => {
  const model = memoryBookingModel();
  let notifications = 0;
  const { handler } = setup({
    model,
    geocodeZipCode: async () => {
      throw new Error("geocode unavailable");
    },
    sendBookingNotification: async () => {
      notifications += 1;
    },
  });
  const res = response();

  await handler(request(bookingPayload(), "booking-key-geocode-failure"), res);

  assert.equal(res.statusCode, 500);
  assert.equal(model.rows.length, 0);
  assert.equal(model.calls.deleteOne, 1);
  assert.equal(notifications, 0);
});

test("notification failure is not retried by a same-key replay", async () => {
  const model = memoryBookingModel();
  let attempts = 0;
  const { handler } = setup({
    model,
    sendBookingNotification: async () => {
      attempts += 1;
      throw new Error("mail unavailable");
    },
  });
  const first = response();
  const replay = response();

  await handler(request(bookingPayload(), "booking-key-mail-failure"), first);
  await handler(request(bookingPayload(), "booking-key-mail-failure"), replay);

  assert.equal(first.statusCode, 200);
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.body.bookingId, first.body.bookingId);
  assert.equal(model.rows[0].idempotencyStatus, "completed");
  assert.equal(attempts, 1);
});
