import SwiftUI

struct WatchScreenShell<Content: View>: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject private var themeSettings: WatchThemeSettings

  let title: String
  let content: Content

  init(title: String, @ViewBuilder content: () -> Content) {
    self.title = title
    self.content = content()
  }

  var body: some View {
    let palette = themeSettings.palette

    ZStack {
      palette.background
        .ignoresSafeArea()

      ScrollView(.vertical, showsIndicators: false) {
        VStack(alignment: .leading, spacing: 10) {
          HStack(spacing: 12) {
            Button {
              dismiss()
            } label: {
              Image(systemName: "arrow.left")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(palette.buttonForeground)
                .frame(width: 34, height: 34)
                .background(palette.buttonBackground)
                .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Text(title)
              .font(.system(size: 20, weight: .bold))
              .foregroundStyle(palette.primaryText)
              .lineLimit(1)
              .minimumScaleFactor(0.85)

            Spacer(minLength: 0)
          }

          content
        }
        .padding(.horizontal, 8)
        .padding(.top, 4)
        .padding(.bottom, 10)
      }
    }
    .toolbar(.hidden, for: .navigationBar)
  }
}
