import { BackButton } from "../components/navigation/BackButton";
import { PlaceholderScreen } from "../components/screen/PlaceholderScreen";

export default function SettingsScreen() {
  return (
    <PlaceholderScreen
      description="Settings is a placeholder detail screen opened from Profile. Program data is now kept locally on the device, with a typed schema prepared for a future remote database."
      headerSlot={<BackButton />}
      title="Settings"
    />
  );
}
