import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { clearAuthToken } from "@/api/authToken";
import { createMockHandlers } from "@/api/mocks/handlers";
import { server } from "@/api/mocks/node";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  server.resetHandlers(...createMockHandlers());
});

afterEach(() => {
  clearAuthToken();
});

afterAll(() => {
  server.close();
});
