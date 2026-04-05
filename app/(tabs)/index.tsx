import { useRouter } from "expo-router";

import { AppLogo } from "../../components/branding/AppLogo";
import { PlaceholderScreen } from "../../components/screen/PlaceholderScreen";
import { PrimaryButton } from "../../ui/PrimaryButton";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      description="Local-first base screen for TrackWell. Use the buttons below to validate the tab-to-detail flows."
      headerSlot={<AppLogo showHint />}
      title="Home"
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
