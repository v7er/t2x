import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppFrame } from "@/components/app-frame";
import { cssVariablesResolver, theme } from "@/lib/theme";
import appCss from "../styles.css?url";

const APP_NAME = "T2x";
const native = import.meta.env.VITE_T2X_NATIVE === "1";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#070908" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      {
        name: "description",
        content: "T2x — master time and direct it toward the spans of a life.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  component: RootDocument,
});

function AppTree() {
  return (
    <AuthProvider>
      <MantineProvider
        theme={theme}
        forceColorScheme="dark"
        defaultColorScheme="dark"
        cssVariablesResolver={cssVariablesResolver}
      >
        <DatesProvider settings={{ firstDayOfWeek: 1, consistentWeeks: true }}>
          <Notifications position="top-center" />
          <AppFrame>
            <Outlet />
          </AppFrame>
        </DatesProvider>
      </MantineProvider>
    </AuthProvider>
  );
}

function RootDocument() {
  if (native) return <AppTree />;

  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <head>
        <HeadContent />
        <ColorSchemeScript forceColorScheme="dark" defaultColorScheme="dark" />
      </head>
      <body>
        <PreviewHostBridge />
        <AppTree />
        <Scripts />
      </body>
    </html>
  );
}
