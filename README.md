# Magic Link Authentication – TODO

This checklist tracks what is required to make the magic-link authentication flow **production-ready**.

---

## ✅ Core Flow (Already Implemented)

- [x] Magic link intent endpoint (`POST /magic-link/intent`)
- [x] Email input validation (Zod / AuthModel)
- [x] Token generation service
- [x] Callback endpoint (`POST /magic-link/callback`)
- [x] Token consumption logic
- [x] User find-or-create logic
- [x] Safe user JSON transformation

---

## 🔐 Token Security

- [ ] Generate cryptographically secure random tokens (≥128 bits)
- [ ] Hash tokens before storage (SHA-256 or better)
- [ ] Store only hashed tokens in Redis / DB
- [ ] Set short expiration (5–15 minutes)
- [ ] Ensure tokens are single-use
- [ ] Atomically invalidate token on consume
- [ ] Reject expired or already-used tokens

---

## 🧠 Token Context Binding (Recommended)

- [ ] Bind token to user-agent hash
- [ ] Optionally bind token to IP hash
- [ ] Reject token if context mismatch

---

## 🔑 Authentication Session Issuance

- [ ] Decide auth strategy:
  - [ ] HTTP-only session cookies
  - [ ] JWT (access + refresh)

- [ ] Issue session/JWT after successful callback
- [ ] Attach auth state to Hono context
- [ ] Ensure cookies are `HttpOnly`, `Secure`, `SameSite`

---

## 🚦 Abuse & Rate Limiting

- [ ] Rate limit `/magic-link/intent` by IP
- [ ] Rate limit by email address
- [ ] Enforce max requests per time window
- [ ] Add cooldown between magic link requests

---

## 🕵️ Enumeration & Error Safety

- [ ] Return identical responses for existing/non-existing users
- [ ] Normalize response timing to avoid side-channel leaks
- [ ] Avoid detailed error messages on auth endpoints

---

## ✉️ Email Delivery

- [ ] Send magic link via email in production
- [ ] Use background/async job for email sending
- [ ] Handle email provider failures gracefully
- [ ] Add retry strategy

---

## 🌍 UX & Flow Design

- [ ] Decide callback style:
  - [ ] JSON-based API response
  - [ ] Redirect-based web flow

- [ ] If redirect-based:
  - [ ] Consume token server-side
  - [ ] Set session cookie
  - [ ] Redirect to frontend dashboard

- [ ] Support mobile deep links (optional)

---

## 📜 Logging & Auditing

- [ ] Log token generation events
- [ ] Log successful token consumption
- [ ] Log failed/expired token attempts
- [ ] Add alerting for abnormal patterns

---

## 🔒 Infrastructure Requirements

- [ ] Enforce HTTPS everywhere
- [ ] Secure Redis / DB access
- [ ] Rotate secrets regularly

---

## 🧪 Testing

- [ ] Unit tests for token lifecycle
- [ ] Integration tests for auth flow
- [ ] Test replay attack scenarios
- [ ] Test expiration handling

---

## 🚀 Optional Enhancements

- [ ] Allow magic link login + signup in one flow
- [ ] Add magic link invalidation on logout
- [ ] Add "Resend magic link" with cooldown
- [ ] Admin audit dashboard

---

**Status:** ⬜ Not production-ready until all critical sections are complete
