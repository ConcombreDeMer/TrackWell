import { View } from "react-native";

import { BackButton } from "../components/navigation/BackButton";
import { PlaceholderScreen } from "../components/screen/PlaceholderScreen";

export default function SettingsScreen() {
  return (
    <PlaceholderScreen
      description="Settings is a placeholder detail screen opened from Profile. No auth or persistence is introduced at this stage."
      footer={
        <View>
          <BackButton />
        </View>
      }
      title="Settings"
    />
  );
}
