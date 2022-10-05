import { View, Text } from "react-native";
import { render } from "@testing-library/react-native";

const App = () => (
  <View>
    <Text>Hi there!</Text>
  </View>
);

describe("Rendering an App", () => {
  it("should do something", () => {
    const { getByText } = render(<App />);

    expect(getByText("Hi there!")).toBeTruthy();
  });
});
