# School Admission System

A simple, concurrent-safe School Admission System built with .NET 8, PostgreSQL, React 18 (Vite), and Docker.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose installed.

---

## How to Run the Application

From the root of the project directory, run:

```bash
docker compose up --build
```

This single command sets up and launches all required services:
- **PostgreSQL** database on port `5432`
- **Backend API** running at [http://localhost:8080](http://localhost:8080) (Swagger at `http://localhost:8080/swagger`)
- **Frontend UI** accessible at [http://localhost:3000](http://localhost:3000)

Database migrations apply automatically when the backend container starts.

---

## Application URLs

| Service | URL |
| :--- | :--- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) |
| **Backend API** | [http://localhost:8080](http://localhost:8080) |
| **Swagger UI** | [http://localhost:8080/swagger](http://localhost:8080/swagger) |

---

## Running Automated Tests

Make sure the Docker containers are running first:

```bash
docker compose up -d
```

### Option 1: Run via .NET SDK (Host Machine)
```bash
cd backend.Tests
dotnet test
```


The test suite includes validation for:
1. Class creation and seat calculation accuracy.
2. Hold lifecycle (hold creation, confirmation, and release).
3. **Concurrency test**: High concurrent seat reservations to guarantee total reserved seats never exceed `totalSeats`.

---

## Stopping the Application

```bash
docker compose down
```
To also remove persistent database volumes:
```bash
docker compose down -v
```