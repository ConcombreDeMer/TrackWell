import { View } from "react-native";

import { BackButton } from "../components/navigation/BackButton";
import { PlaceholderScreen } from "../components/screen/PlaceholderScreen";

export default function ProgramCreateScreen() {
  return (
    <PlaceholderScreen
      description="Program creation screen placeholder. We will implement the form and flow in the next step."
      footer={
        <View>

          <BackButton />
        </View>
      }
      title="Create Program"
    />
  );
}
