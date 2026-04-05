import { useRouter } from "expo-router";

import { PlaceholderScreen } from "../components/screen/PlaceholderScreen";
import { PrimaryButton } from "../ui/PrimaryButton";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      description="This route does not exist in the current TrackWell navigation tree."
      title="Not Found"
    >
      <PrimaryButton label="Back to Home" onPress={() => router.replace("/")} />
    </PlaceholderScreen>
  );
}
