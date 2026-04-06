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
        <Icon sf={{ default: "house", selected: "house.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="programs">
        <Label>Programs</Label>
        <Icon sf={{ default: "list.bullet.rectangle", selected: "list.bullet.rectangle.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Label>History</Label>
        <Icon sf={{ default: "clock", selected: "clock.fill" }} />
      </NativeTabs.Trigger>
      {/* <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} />
      </NativeTabs.Trigger> */}
    </NativeTabs>
  );
}
