import { useRouter } from "expo-router";
import { View } from "react-native";

import { BackButton } from "../components/navigation/BackButton";
import { PlaceholderScreen } from "../components/screen/PlaceholderScreen";
import { PrimaryButton } from "../ui/PrimaryButton";

export default function ProgramScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      description="Program is a stack detail screen. It can be opened from Home or Programs, then navigate deeper into Course."
      footer={
        <View>
          <BackButton />
        </View>
      }
      title="Program"
    >
      <PrimaryButton label="Open Course" onPress={() => router.push("/course")} />
    </PlaceholderScreen>
  );
}
