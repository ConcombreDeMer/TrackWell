import { useRouter } from "expo-router";

import { PlaceholderScreen } from "../../components/screen/PlaceholderScreen";
import { PrimaryButton } from "../../ui/PrimaryButton";

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      description="History remains a root tab. Course opens as a deeper detail screen on top of that section."
      title="History"
    >
      <PrimaryButton label="Open Course" onPress={() => router.push("/course")} />
    </PlaceholderScreen>
  );
}
