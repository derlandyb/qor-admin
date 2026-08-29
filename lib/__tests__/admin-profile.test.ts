import { PROFILE_COOKIE_NAME } from "@/lib/api/session-cookie";
import { readAdminProfile } from "../admin-profile";

function setCookie(value: string) {
  document.cookie = `${PROFILE_COOKIE_NAME}=${value}`;
}

describe("readAdminProfile", () => {
  afterEach(() => {
    document.cookie = `${PROFILE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });

  test("GIVEN no profile cookie WHEN readAdminProfile is called THEN it returns null", () => {
    expect(readAdminProfile()).toBeNull();
  });

  test("GIVEN a valid profile cookie WHEN readAdminProfile is called THEN it parses name/isSuperAdmin", () => {
    setCookie(encodeURIComponent(JSON.stringify({ name: "Ana", isSuperAdmin: true })));
    expect(readAdminProfile()).toEqual({ name: "Ana", isSuperAdmin: true });
  });

  test("GIVEN a malformed profile cookie WHEN readAdminProfile is called THEN it returns null", () => {
    setCookie("not-json");
    expect(readAdminProfile()).toBeNull();
  });

  test("GIVEN a cookie missing required fields WHEN readAdminProfile is called THEN it returns null", () => {
    setCookie(encodeURIComponent(JSON.stringify({ name: "Ana" })));
    expect(readAdminProfile()).toBeNull();
  });
});
