import test from "node:test";
import assert from "node:assert/strict";
import { createQueryCache, clientQueryCache, invalidateAfterMutation } from "./queryCache.js";

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

test("simultaneous consumers and remounts share one request", async () => {
  const cache = createQueryCache();
  const work = deferred();
  let calls = 0;
  const fetcher = () => { calls++; return work.promise; };
  const first = cache.request("user|courses", fetcher);
  const second = cache.request("user|courses", fetcher);
  assert.equal(first, second);
  work.resolve(["course"]);
  await first;
  await cache.request("user|courses", fetcher);
  assert.equal(calls, 1);
});

test("expired data remains visible while one refresh runs", async () => {
  let clock = 100;
  const cache = createQueryCache({ now: () => clock });
  await cache.request("user|courses", async () => ["old"]);
  clock += 30_001;
  const work = deferred();
  const refresh = cache.request("user|courses", () => work.promise);
  assert.deepEqual(cache.read("user|courses").data, ["old"]);
  assert.equal(cache.read("user|courses").pending, true);
  work.resolve(["new"]);
  await refresh;
  assert.deepEqual(cache.read("user|courses").data, ["new"]);
});

test("failures settle pending state and allow explicit retry", async () => {
  const cache = createQueryCache();
  const error = new Error("offline");
  await assert.rejects(cache.request("u|a", async () => { throw error; }), error);
  assert.equal(cache.read("u|a").pending, false);
  assert.equal(cache.read("u|a").stale, false);
  assert.equal(cache.read("u|a").error, error);
  await cache.request("u|a", async () => "recovered", { force: true });
  assert.equal(cache.read("u|a").data, "recovered");
});

test("invalidation prevents an older request from restoring stale data or seeding", async () => {
  const cache = createQueryCache();
  const work = deferred();
  let seeded = false;
  const old = cache.request("u|a", () => work.promise, { onSuccess: () => { seeded = true; } });
  cache.invalidate();
  await cache.request("u|a", async () => "new");
  work.resolve("old");
  await old;
  assert.equal(cache.read("u|a").data, "new");
  assert.equal(seeded, false);
});

test("mutation response updates survive an older background GET", async () => {
  const cache = createQueryCache();
  await cache.request("u|learning", async () => ({ completed: false }));
  const work = deferred();
  const old = cache.request("u|learning", () => work.promise, { force: true });
  cache.update("u|learning", { completed: true });
  work.resolve({ completed: false });
  await old;
  assert.equal(cache.read("u|learning").data.completed, true);
  assert.equal(cache.read("u|learning").pending, false);
});

test("account changes and sign-out clear data and reject late commits", async () => {
  const cache = createQueryCache();
  cache.setAccount("alice");
  await cache.request("alice|profile", async () => "Alice");
  const work = deferred();
  const old = cache.request("alice|courses", () => work.promise);
  cache.setAccount("bob");
  assert.equal(cache.read("alice|profile").data, undefined);
  work.resolve("Alice's courses");
  await old;
  assert.equal(cache.read("alice|courses").data, undefined);
  await cache.request("bob|profile", async () => "Bob");
  cache.clear();
  assert.equal(cache.read("bob|profile").data, undefined);
});

test("authorization failure removes cached data and stops every loader", async () => {
  const cache = createQueryCache();
  await cache.request("u|courses", async () => ["private"]);
  const error = Object.assign(new Error("denied"), { response: { status: 403 } });
  await assert.rejects(cache.request("u|profile", async () => { throw error; }));
  assert.equal(cache.read("u|courses").data, undefined);
  assert.equal(cache.read("u|courses").pending, false);
  assert.equal(cache.read("u|profile").error, error);
});

test("dashboard seeding preserves newer data and independent pending reads", async () => {
  const cache = createQueryCache();
  cache.seed("u|assignments", ["dashboard"]);
  assert.deepEqual(cache.read("u|assignments").data, ["dashboard"]);
  cache.seed("u|assignments", ["older"]);
  assert.deepEqual(cache.read("u|assignments").data, ["dashboard"]);
  const work = deferred();
  const request = cache.request("u|courses", () => work.promise);
  cache.seed("u|courses", ["summary"]);
  assert.equal(cache.read("u|courses").data, undefined);
  work.resolve(["authoritative"]);
  await request;
});

test("mutations invalidate related summaries while preserving unrelated data", () => {
  clientQueryCache.clear();
  for (const endpoint of ["/student/dashboard", "/student/courses", "/student/courses/1/learning", "/student/courses/1/assignments", "/student/assignments", "/teacher/course-categories"]) {
    clientQueryCache.update(`u|${endpoint}`, []);
  }
  invalidateAfterMutation("/student/lessons/1/complete", "post");
  assert.equal(clientQueryCache.read("u|/student/dashboard").stale, true);
  assert.equal(clientQueryCache.read("u|/student/courses/1/learning").stale, false);
  assert.equal(clientQueryCache.read("u|/student/courses/1/assignments").stale, false);
  invalidateAfterMutation("/student/assignments/1/submission", "put");
  assert.equal(clientQueryCache.read("u|/student/courses/1/assignments").stale, true);
  assert.equal(clientQueryCache.read("u|/student/assignments").stale, true);
  invalidateAfterMutation("/teacher/courses", "post");
  assert.equal(clientQueryCache.read("u|/teacher/course-categories").stale, false);
  invalidateAfterMutation("/admin/categories", "post");
  assert.equal(clientQueryCache.read("u|/teacher/course-categories").stale, true);
});

test("unused entries are bounded without evicting active consumers", async () => {
  const cache = createQueryCache({ maxEntries: 2 });
  cache.subscribe("active", () => {});
  await cache.request("active", async () => "keep");
  await cache.request("old", async () => "old");
  await cache.request("new", async () => "new");
  assert.equal(cache.read("active").data, "keep");
  assert.equal(cache.read("old").data, undefined);
});
