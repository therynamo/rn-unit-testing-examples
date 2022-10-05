import App from "..";

import { render } from "@test-utils";

describe("React Navigation Basic Example", () => {
  it("should navigate from one screen to the next", () => {
    const { getByText } = render(<App />);

    expect(getByText("Home Screen")).toBeTruthy();
  });
});
