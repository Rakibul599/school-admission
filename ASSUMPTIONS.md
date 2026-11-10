# Assumptions & Architectural Decisions

- **Multi-Process Concurrency & Bonus:** Ensured strict capacity checks across multiple backend instances/processes by enforcing transactional row-level locks (`SELECT ... FOR UPDATE`) directly in PostgreSQL. Application-level locks were avoided to guarantee that `heldSeats + confirmedSeats <= totalSeats` is always respected, regardless of how many instances run concurrently.
- **Seat Availability & Hold Expiration:** A hold is strictly valid for `HOLD_DURATION_SECONDS` (default: 600s). In queries, seats with expired holds are immediately calculated as available without waiting for background jobs. A background worker periodically cleans up records and marks them `EXPIRED` in the database.
- **Single Active Hold per Class:** A student (`X-Student-Id`) is restricted to having at most one active (`HELD`) or `CONFIRMED` admission per class at any given time.
- **Idempotent Confirmations:** Confirming an already confirmed hold returns a successful 200 response without double-counting confirmed seats.
- **Hold Cancellation:** Releasing or cancelling a hold immediately frees up the seat and transitions the hold status to `CANCELLED`.
- **Time Standard:** All timestamps (`expiresAt`) are handled and stored in UTC (ISO 8601) to prevent timezone drift between client and server.
- **Client State Persistence:** The 17-digit birth registration number is stored in browser `localStorage` to ensure the student's active applications remain visible across page reloads and browser restarts.