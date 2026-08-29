import { adminApiBaseUrl, SESSION_COOKIE_NAME } from "../session-cookie";

describe("session-cookie", () => {
  const originalEnv = process.env.ADMIN_API_BASE_URL;

  afterEach(() => {
    process.env.ADMIN_API_BASE_URL = originalEnv;
  });

  test("GIVEN ADMIN_API_BASE_URL is set WHEN adminApiBaseUrl is called THEN it returns that value", () => {
    process.env.ADMIN_API_BASE_URL = "https://api.example.com";
    expect(adminApiBaseUrl()).toBe("https://api.example.com");
  });

  test("GIVEN ADMIN_API_BASE_URL is unset WHEN adminApiBaseUrl is called THEN it falls back to localhost:8000", () => {
    delete process.env.ADMIN_API_BASE_URL;
    expect(adminApiBaseUrl()).toBe("http://localhost:8000");
  });

  test("GIVEN the session cookie name WHEN read THEN it is a stable, namespaced constant", () => {
    expect(SESSION_COOKIE_NAME).toBe("qor_admin_session");
  });
});
