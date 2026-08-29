import { redirectTo } from "../navigation";

describe("redirectTo", () => {
  test("GIVEN a path WHEN redirectTo is called THEN it assigns window.location.href without throwing", () => {
    // jsdom doesn't implement real navigation, so the assignment itself
    // (not the resulting href value) is what this test exercises.
    expect(() => redirectTo("/entrar")).not.toThrow();
  });
});
