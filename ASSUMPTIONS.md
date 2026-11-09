# Assumptions

- **Seat Concurrency:** Used PostgreSQL row locking (`SELECT ... FOR UPDATE`) in transactions instead of in-memory locks, ensuring strict capacity checks even across multiple backend instances.
- **Hold Expiration:** Holds expire after `HOLD_DURATION_SECONDS` (default: 600s). Expired seats are immediately treated as available in calculations, and a lightweight background service periodically marks status as `EXPIRED`.
- **Student Restriction:** A student (`X-Student-Id`) can hold or confirm at most one seat per class at any given time.
- **Idempotency:** Re-confirming an already confirmed hold returns success without incrementing confirmed seat counts again.
- **State Persistence:** `studentId` and active hold tracking are stored in the browser's `localStorage` to persist across page refreshes.