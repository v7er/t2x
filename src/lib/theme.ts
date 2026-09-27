import {
  Button,
  Card,
  Drawer,
  Modal,
  NavLink,
  Paper,
  TextInput,
  Textarea,
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";

const sage: MantineColorsTuple = [
  "#e9fff1",
  "#c6fbd8",
  "#96f4b8",
  "#62ea94",
  "#3ddb7a",
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#166534",
  "#0f3d22",
];

const dark: MantineColorsTuple = [
  "#f5f8f3",
  "#cdd6cb",
  "#b7c4b6",
  "#8a9788",
  "#4e5a4e",
  "#323a33",
  "#222922",
  "#171d18",
  "#101411",
  "#070908",
];

export const theme = createTheme({
  primaryColor: "sage",
  primaryShade: { light: 6, dark: 4 },
  fontFamily: '"Outfit Variable", Outfit, ui-sans-serif, system-ui, sans-serif',
  fontFamilyMonospace: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  headings: {
    fontFamily: '"Newsreader Variable", Newsreader, ui-serif, Georgia, serif',
    fontWeight: "500",
    sizes: {
      h1: { fontSize: "2.125rem", lineHeight: "1.15" },
      h2: { fontSize: "1.5rem", lineHeight: "1.25" },
      h3: { fontSize: "1.125rem", lineHeight: "1.3" },
    },
  },
  defaultRadius: "md",
  cursorType: "pointer",
  colors: { sage, dark },
  black: "#070908",
  white: "#f5f8f3",
  spacing: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  radius: {
    xs: "6px",
    sm: "8px",
    md: "12px",
    lg: "20px",
    xl: "28px",
  },
  components: {
    Button: Button.extend({
      defaultProps: { radius: "md" },
      vars: (_theme, props) => {
        const variant = props.variant ?? "filled";
        if (variant === "filled") {
          return {
            root: {
              "--button-bg": "var(--color-accent)",
              "--button-hover": "#62ea94",
              "--button-color": "var(--color-accent-fg)",
              "--button-bd": "transparent",
            },
          };
        }
        return { root: {} };
      },
    }),
    Paper: Paper.extend({
      defaultProps: {
        radius: "lg",
        withBorder: true,
      },
    }),
    Card: Card.extend({
      defaultProps: {
        radius: "lg",
        padding: "lg",
        withBorder: true,
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        radius: "lg",
        centered: true,
        overlayProps: { backgroundOpacity: 0.55, blur: 4 },
      },
    }),
    Drawer: Drawer.extend({
      defaultProps: {
        overlayProps: { backgroundOpacity: 0.55, blur: 4 },
      },
    }),
    TextInput: TextInput.extend({
      defaultProps: { radius: "md", size: "md" },
    }),
    Textarea: Textarea.extend({
      defaultProps: { radius: "md" },
    }),
    NavLink: NavLink.extend({
      defaultProps: { color: "sage" },
    }),
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: {
    "--mantine-color-body": "#070908",
    "--mantine-color-text": "#f5f8f3",
    "--mantine-color-dimmed": "#b7c4b6",
    "--mantine-color-placeholder": "#7e8c7c",
    "--mantine-color-anchor": "#3ddb7a",
    "--mantine-color-default": "#121614",
    "--mantine-color-default-hover": "#1a211c",
    "--mantine-color-default-color": "#f5f8f3",
    "--mantine-color-default-border": "rgba(245, 248, 243, 0.16)",
  },
});
