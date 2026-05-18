import SwiftUI

struct WatchSettingsView: View {
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  private var darkModeBinding: Binding<Bool> {
    Binding(
      get: { themeSettings.mode == .dark },
      set: { themeSettings.mode = $0 ? .dark : .light }
    )
  }

  var body: some View {
    let palette = themeSettings.palette

    ZStack {
      palette.background
        .ignoresSafeArea()

      ScrollView(.vertical, showsIndicators: false) {
        VStack(alignment: .leading, spacing: 10) {
          VStack(alignment: .leading, spacing: 2) {
            Text("Appearance")
              .font(.system(size: 16, weight: .semibold))
              .foregroundStyle(palette.primaryText)

            Text("Choisissez le theme de la montre.")
              .font(.system(size: 10, weight: .regular))
              .foregroundStyle(palette.secondaryText)
          }

          Toggle(isOn: darkModeBinding) {
            VStack(alignment: .leading, spacing: 2) {
              Text("Dark mode")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(palette.primaryText)

              Text(themeSettings.mode == .dark ? "Active" : "Inactive")
                .font(.system(size: 10, weight: .regular))
                .foregroundStyle(palette.secondaryText)
            }
          }
          .toggleStyle(.switch)
          .padding(.horizontal, 14)
          .padding(.vertical, 10)
          .background(palette.cardBackground)
          .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
      }
      .contentMargins(.horizontal, 8, for: .scrollContent)
      .contentMargins(.vertical, 10, for: .scrollContent)
    }
    .navigationTitle("Settings")
  }
}
