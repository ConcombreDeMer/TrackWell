import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

import { colors } from "../../theme";

export default function TabsLayout() {
  return (
    <NativeTabs
      backBehavior="history"
      blurEffect="systemChromeMaterial"
      disableTransparentOnScrollEdge
      iconColor={{ default: "#848484", selected: colors.text }}
      labelStyle={{
        color: colors.text,
        fontWeight: "600",
      }}
      minimizeBehavior="automatic"
      tintColor={colors.text}
    >
      {/*
        Tabs switch root sections. Detail screens live outside this group and are
        pushed from the root stack so the navigation intent stays explicit.
      */}
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="programs">
        <Label>Programs</Label>
        <Icon sf="list.bullet.rectangle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Label>History</Label>
        <Icon sf="clock.arrow.circlepath" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.crop.circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
