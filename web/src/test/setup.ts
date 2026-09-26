import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { clearAuthToken } from "@/api/core/authToken";
import { createMockHandlers } from "@/api/mocks/handlers";
import { server } from "@/api/mocks/node";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  server.resetHandlers(...createMockHandlers());
});

afterEach(() => {
  cleanup();
  clearAuthToken();
});

afterAll(() => {
  server.close();
});
