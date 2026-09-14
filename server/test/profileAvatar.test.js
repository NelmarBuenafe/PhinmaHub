import assert from "node:assert/strict";
import test from "node:test";
import "dotenv/config";
import {
  isOwnedAvatarPath,
  MAX_PROFILE_AVATAR_BYTES,
  validateProfileAvatar,
  validateProfileAvatarBytes,
} from "../src/controllers/profileAvatarController.js";

const userId = "d34db33f-0000-4000-8000-000000000001";
const ownedPath = `${userId}/11111111-2222-4333-8444-555555555555.webp`;

test("checks uploaded image signatures instead of trusting renamed files", () => {
  assert.equal(validateProfileAvatarBytes(new Uint8Array([255, 216, 255]), "photo.jpg", "image/jpeg").valid, true);
  assert.equal(validateProfileAvatarBytes(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), "photo.png", "image/png").valid, true);
  assert.equal(validateProfileAvatarBytes(new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]), "photo.webp", "image/webp").valid, true);
  assert.equal(validateProfileAvatarBytes(new Uint8Array([60, 104, 116, 109, 108]), "photo.png", "image/png").valid, false);
  assert.equal(validateProfileAvatarBytes(new Uint8Array(), "photo.png", "image/png").valid, false);
});

test("accepts supported profile image types within the 2 MB limit", () => {
  for (const [name, mime] of [["photo.jpg", "image/jpeg"], ["photo.jpeg", "image/jpeg"], ["photo.png", "image/png"], ["photo.webp", "image/webp"]]) {
    assert.equal(validateProfileAvatar(name, mime, 1024).valid, true, name);
  }
  assert.equal(MAX_PROFILE_AVATAR_BYTES, 2 * 1024 * 1024);
});

test("rejects unsupported, mismatched, and oversized profile image uploads", () => {
  assert.equal(validateProfileAvatar("photo.jpg", "image/png", 1024).valid, false);
  assert.equal(validateProfileAvatar("photo.gif", "image/gif", 1024).valid, false);
  assert.equal(validateProfileAvatar("photo.png", "image/png", MAX_PROFILE_AVATAR_BYTES + 1).valid, false);
});

test("profile avatar storage paths are restricted to the authenticated owner", () => {
  assert.equal(isOwnedAvatarPath(ownedPath, userId), true);
  assert.equal(isOwnedAvatarPath("a34db33f-0000-4000-8000-000000000001/11111111-2222-4333-8444-555555555555.webp", userId), false);
  assert.equal(isOwnedAvatarPath(`${userId}/not-a-uuid.webp`, userId), false);
  assert.equal(isOwnedAvatarPath(`${userId}/11111111-2222-4333-8444-555555555555.exe`, userId), false);
});
