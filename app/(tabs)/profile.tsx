import { useRouter } from "expo-router";

import { PlaceholderScreen } from "../../components/screen/PlaceholderScreen";
import { PrimaryButton } from "../../ui/PrimaryButton";

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      description="Profile is the account and settings entry point for now, without auth or backend coupling."
      title="Profile"
    >
      <PrimaryButton label="Open Settings" onPress={() => router.push("/settings")} />
    </PlaceholderScreen>
  );
}
