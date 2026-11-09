# AI Usage

### Tools Used
- Claude / ChatGPT

### Where Used
- Scaffolding model/DTO boilerplate.
- Drafting initial `docker-compose.yml` structure.
- Brainstorming boilerplate for the parallel concurrency test.

### Mistakes Caught & Fixed
1. **Wrong Package Versions:** AI suggested `dotnet add package Microsoft.EntityFrameworkCore` without versioning, pulling `.NET 10` packages that broke on `.NET 8`. Fixed by pinning to `-v 8.0.11`.
2. **In-Memory Locking:** AI suggested C# `lock` / `SemaphoreSlim` for seat holds. Replaced with PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) to handle multiple container processes correctly.
3. **API Contract Mismatches:** AI defaulted to generic field names like `"id"` instead of the required `"holdId"`. Corrected to strictly match the assignment spec.