import { useRouter } from "expo-router";

import { PrimaryButton } from "../../ui/PrimaryButton";

export function BackButton() {
  const router = useRouter();

  return (
    <PrimaryButton
      label="Go back"
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace("/");
      }}
      variant="secondary"
    />
  );
}
