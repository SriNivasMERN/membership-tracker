import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#1E3A5F",
      light: "#2E75B6",
      dark: "#152A47",
    },
    secondary: {
      main: "#2E75B6",
    },
    background: {
      default: "#F1F5F9",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111827",
      secondary: "#374151",
    },
    success: {
      main: "#16A34A",
      dark: "#15803D",
    },
    warning: {
      main: "#D97706",
    },
    error: {
      main: "#DC2626",
      dark: "#B91C1C",
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    body2: { fontWeight: 400 },
    caption: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          color: "#111827",
          backgroundColor: "#F1F5F9",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
          boxShadow: "none",
        },
        containedPrimary: {
          "&:hover": {
            boxShadow: "0 10px 20px rgba(30,58,95,0.12)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 14,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "#FFFFFF",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#F8FAFC",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 999,
        },
      },
    },
  },
});
