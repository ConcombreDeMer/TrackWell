import { Ionicons } from "@expo/vector-icons";
import { ActionSheetIOS, Alert, Platform, StyleSheet } from "react-native";

import { colors, radius, useThemePalette } from "../../theme";
import { SquircleButton } from "../../ui/Squircle";

type CourseActionsMenuProps = {
  isCompleted?: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggleCompletion?: () => void;
};

export function CourseActionsMenu({
  isCompleted = false,
  onDelete,
  onEdit,
  onToggleCompletion,
}: CourseActionsMenuProps) {
  const palette = useThemePalette();
  const swiftUIMenu = getSwiftUIMenu();
  const userInterfaceStyle = palette.statusBarStyle === "light" ? "dark" : "light";

  if (swiftUIMenu && Platform.OS === "ios") {
    const { Button, ContextMenu, Host } = swiftUIMenu;

    return (
      <Host matchContents>
        <ContextMenu activationMethod="singlePress">
          <ContextMenu.Trigger>
            <SquircleButton
              style={[
                styles.fallbackButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Ionicons color={palette.text} name="ellipsis-horizontal" size={24} />
            </SquircleButton>
          </ContextMenu.Trigger>
          <ContextMenu.Items>
            <Button onPress={onEdit} systemImage="pencil">
              Edit
            </Button>
            <Button onPress={onDelete} role="destructive" systemImage="trash">
              Delete
            </Button>
            {onToggleCompletion ? (
              <Button
                onPress={onToggleCompletion}
                systemImage={isCompleted ? "checkmark" : "checkmark.circle"}
              >
                {isCompleted ? "Completed" : "Mark Complete"}
              </Button>
            ) : null}
          </ContextMenu.Items>
        </ContextMenu>
      </Host>
    );
  }

  function openFallbackMenu() {
    const completionLabel = isCompleted ? "Completed" : "Mark Complete";

    if (Platform.OS === "ios") {
      const options = ["Edit", "Delete"];
      let cancelButtonIndex = 2;

      if (onToggleCompletion) {
        options.push(completionLabel);
        cancelButtonIndex = 3;
      }

      options.push("Cancel");

      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex,
          destructiveButtonIndex: 1,
          options,
          userInterfaceStyle,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            onEdit();
          } else if (buttonIndex === 1) {
            onDelete();
          } else if (onToggleCompletion && buttonIndex === 2) {
            onToggleCompletion();
          }
        },
      );

      return;
    }

    Alert.alert("Course actions", "Choose an action", [
      { text: "Edit", onPress: onEdit },
      { style: "destructive", text: "Delete", onPress: onDelete },
      ...(onToggleCompletion
        ? [{ text: completionLabel, onPress: onToggleCompletion as () => void }]
        : []),
      { style: "cancel", text: "Cancel" },
    ]);
  }

  return (
    <SquircleButton
      onPress={openFallbackMenu}
      style={[
        styles.fallbackButton,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <Ionicons color={palette.text} name="ellipsis-horizontal" size={24} />
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
  fallbackButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
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
