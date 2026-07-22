const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createBookingReadHandler,
  parseBookingReadQuery,
} = require("../routes/bookingRead");

const TOKEN = "dedicated-booking-read-token";

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

function readModel(documents, { failure = null } = {}) {
  const calls = [];
  const forbiddenWrites = [];
  const model = {
    find(filter) {
      calls.push({ operation: "find", filter });
      const chain = {
        select(projection) {
          calls.push({ operation: "select", projection });
          return chain;
        },
        sort(sort) {
          calls.push({ operation: "sort", sort });
          return chain;
        },
        limit(limit) {
          calls.push({ operation: "limit", limit });
          return chain;
        },
        async lean() {
          calls.push({ operation: "lean" });
          if (failure) throw failure;
          return documents;
        },
      };
      return chain;
    },
    create(...args) {
      forbiddenWrites.push(["create", ...args]);
      throw new Error("write attempted");
    },
    updateOne(...args) {
      forbiddenWrites.push(["updateOne", ...args]);
      throw new Error("write attempted");
    },
  };
  return { model, calls, forbiddenWrites };
}

function request(query, token = TOKEN) {
  return {
    headers: token === null ? {} : { authorization: `Bearer ${token}` },
    query,
  };
}

test.beforeEach(() => {
  process.env.MOTG_BOOKING_BACKEND_READ_BEARER_TOKEN = TOKEN;
});

test.after(() => {
  delete process.env.MOTG_BOOKING_BACKEND_READ_BEARER_TOKEN;
});

test("returns known confirmed and unconfirmed bookings from the read model", async () => {
  const { model, calls, forbiddenWrites } = readModel([
    {
      _id: "64b111111111111111111111",
      companyName: "Paragon",
      name: "Jordan Avery",
      email: "jordan@example.com",
      phoneNumber: "901-555-0100",
      address: "100 Oxford Way, Oxford, MS 38655",
      zipCode: "38655",
      services: [{ role: "therapist", workers: 2, hours: 3, increment: 10, price: 698 }],
      totalPrice: 698,
      date: "2026-08-18",
      startTime: "10:00",
      endTime: "13:00",
      confirmed: true,
      paymentIntent: "pi_private",
      extra: "private note",
    },
    {
      _id: "64b222222222222222222222",
      companyName: "Paragon",
      name: "Jordan Avery",
      email: "jordan@example.com",
      address: "200 Atlanta Ave, Atlanta, GA 30303",
      zipCode: "30303",
      services: [{ role: "therapist", workers: 3, hours: 2, increment: 15 }],
      date: "2026-08-18",
      startTime: "14:00",
      endTime: "16:00",
      confirmed: false,
    },
  ]);
  const handler = createBookingReadHandler({
    bookingModel: model,
    now: () => new Date("2026-07-22T12:00:00.000Z"),
  });
  const res = response();

  await handler(request({ date: "2026-08-18", query: "Paragon", limit: "25" }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.complete, true);
  assert.equal(res.body.truncated, false);
  assert.deepEqual(res.body.bounds, { requestedLimit: 25, returnedCount: 2, hasMore: false });
  assert.deepEqual(res.body.bookings.map((booking) => booking.confirmed), [true, false]);
  assert.equal(res.body.bookings[0].bookingId, "64b111111111111111111111");
  assert.equal(res.body.bookings[0].workers, 2);
  assert.doesNotMatch(JSON.stringify(res.body), /phoneNumber|paymentIntent|pi_private|private note|price/);
  assert.equal(res.headers["Cache-Control"], "private, no-store");
  assert.deepEqual(forbiddenWrites, []);
  assert.deepEqual(calls.map((call) => call.operation), ["find", "select", "sort", "limit", "lean"]);
});

test("returns a complete authoritative empty result", async () => {
  const { model } = readModel([]);
  const handler = createBookingReadHandler({ bookingModel: model });
  const res = response();

  await handler(request({ date: "2026-08-19", limit: "10" }), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.bookings, []);
  assert.equal(res.body.complete, true);
  assert.equal(res.body.truncated, false);
  assert.deepEqual(res.body.bounds, { requestedLimit: 10, returnedCount: 0, hasMore: false });
});

test("preserves legacy records without services or payment fields", async () => {
  const { model } = readModel([
    {
      _id: "64b333333333333333333333",
      companyName: "Legacy Co",
      name: "Legacy Contact",
      email: "legacy@example.com",
      address: "300 Main St, Memphis, TN 38103",
      zipCode: "38103",
      therapist: 2,
      price: 500,
      date: "2026-08-20",
      startTime: "09:00",
      endTime: "11:00",
      confirmed: true,
    },
  ]);
  const res = response();

  await createBookingReadHandler({ bookingModel: model })(request({ date: "2026-08-20" }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.bookings[0].workers, 2);
  assert.equal(res.body.bookings[0].totalPrice, 500);
  assert.equal("services" in res.body.bookings[0], false);
  assert.equal("payType" in res.body.bookings[0], false);
});

test("reports truncation instead of authoritative completeness", async () => {
  const documents = [1, 2, 3].map((number) => ({
    _id: `64b${String(number).repeat(21)}`,
    companyName: "Bounded Co",
    name: "Contact",
    date: "2026-08-21",
    startTime: "09:00",
    endTime: "11:00",
    confirmed: false,
  }));
  const { model } = readModel(documents);
  const res = response();

  await createBookingReadHandler({ bookingModel: model })(request({ date: "2026-08-21", limit: "2" }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.complete, false);
  assert.equal(res.body.truncated, true);
  assert.deepEqual(res.body.bounds, { requestedLimit: 2, returnedCount: 2, hasMore: true });
  assert.equal(res.body.bookings.length, 2);
});

test("rejects missing or invalid credentials before database access", async () => {
  const { model, calls } = readModel([]);
  const handler = createBookingReadHandler({ bookingModel: model });

  for (const token of [null, "wrong-token"]) {
    const res = response();
    await handler(request({ date: "2026-08-22" }, token), res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.complete, false);
  }
  assert.deepEqual(calls, []);
});

test("fails closed when the dedicated credential is not configured", async () => {
  delete process.env.MOTG_BOOKING_BACKEND_READ_BEARER_TOKEN;
  const { model, calls } = readModel([]);
  const res = response();

  await createBookingReadHandler({ bookingModel: model })(request({ date: "2026-08-22" }), res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error.code, "read_credential_unavailable");
  assert.deepEqual(calls, []);
});

test("rejects invalid and unbounded lookup requests", () => {
  const invalidQueries = [
    {},
    { date: "2026-02-30" },
    { bookingId: "not-an-object-id" },
    { query: "x" },
    { date: "2026-08-22", limit: "0" },
    { date: "2026-08-22", limit: "101" },
    { date: "2026-08-22", unexpected: "value" },
  ];

  for (const query of invalidQueries) {
    assert.throws(() => parseBookingReadQuery(query));
  }
});

test("returns an incomplete unavailable result when the database read fails", async () => {
  const { model, forbiddenWrites } = readModel([], { failure: new Error("database offline") });
  const res = response();

  await createBookingReadHandler({ bookingModel: model })(request({ date: "2026-08-22" }), res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.complete, false);
  assert.equal(res.body.error.code, "booking_store_unavailable");
  assert.deepEqual(forbiddenWrites, []);
});
