import { useRouter } from "expo-router";
import { View } from "react-native";

import { BackButton } from "../components/navigation/BackButton";
import { PlaceholderScreen } from "../components/screen/PlaceholderScreen";
import { PrimaryButton } from "../ui/PrimaryButton";

export default function CourseScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      description="Course sits in the detail stack and can move laterally back to Program or deeper into Chrono."
      footer={
        <View>
          <BackButton />
        </View>
      }
      title="Course"
    >
      <PrimaryButton label="Open Program" onPress={() => router.push("/program")} />
      <PrimaryButton
        label="Open Chrono"
        onPress={() => router.push("/chrono")}
        variant="secondary"
      />
    </PlaceholderScreen>
  );
}
