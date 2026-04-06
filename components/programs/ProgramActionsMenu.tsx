import { Ionicons } from "@expo/vector-icons";
import { ActionSheetIOS, Alert, Platform, StyleSheet } from "react-native";

import { colors, radius } from "../../theme";
import { SquircleButton } from "../../ui/Squircle";

type ProgramActionsMenuProps = {
  onDelete: () => void;
  onEdit: () => void;
};

export function ProgramActionsMenu({ onDelete, onEdit }: ProgramActionsMenuProps) {
  const swiftUIMenu = getSwiftUIMenu();

  if (swiftUIMenu && Platform.OS === "ios") {
    const { Button, ContextMenu, Host } = swiftUIMenu;

    return (
      <Host matchContents>
        <ContextMenu activationMethod="singlePress">
          <ContextMenu.Trigger>
            <SquircleButton style={styles.button}>
              <Ionicons color={colors.text} name="ellipsis-horizontal" size={24} />
            </SquircleButton>
          </ContextMenu.Trigger>
          <ContextMenu.Items>
            <Button onPress={onEdit} systemImage="pencil">
              Edit Program
            </Button>
            <Button onPress={onDelete} role="destructive" systemImage="trash">
              Delete Program
            </Button>
          </ContextMenu.Items>
        </ContextMenu>
      </Host>
    );
  }

  function openFallbackMenu() {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: 2,
          destructiveButtonIndex: 1,
          options: ["Edit Program", "Delete Program", "Cancel"],
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            onEdit();
          } else if (buttonIndex === 1) {
            onDelete();
          }
        },
      );

      return;
    }

    Alert.alert("Program actions", "Choose an action", [
      { text: "Edit Program", onPress: onEdit },
      { style: "destructive", text: "Delete Program", onPress: onDelete },
      { style: "cancel", text: "Cancel" },
    ]);
  }

  return (
    <SquircleButton onPress={openFallbackMenu} style={styles.button}>
      <Ionicons color={colors.text} name="ellipsis-horizontal" size={24} />
    </SquircleButton>
  );
}

function getSwiftUIMenu():
  | {
      Button: typeof import("@expo/ui/swift-ui").Button;
      ContextMenu: typeof import("@expo/ui/swift-ui").ContextMenu;
      Host: typeof import("@expo/ui/swift-ui").Host;
    }
  | null {
  try {
    const swiftUI = require("@expo/ui/swift-ui");

    return {
      Button: swiftUI.Button,
      ContextMenu: swiftUI.ContextMenu,
      Host: swiftUI.Host,
    };
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    elevation: 2,
    height: 52,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    width: 52,
  },
});
