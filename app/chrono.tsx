import { BackButton } from "../components/navigation/BackButton";
import { PlaceholderScreen } from "../components/screen/PlaceholderScreen";

export default function ChronoScreen() {
  return (
    <PlaceholderScreen
      description="Chrono is intentionally empty for now. The route is ready for Home and Course entry points."
      headerSlot={<BackButton />}
      title="Chrono"
    />
  );
}
