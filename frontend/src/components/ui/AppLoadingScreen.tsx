"use client";

import { Box, Typography } from "@mui/material";

type AppLoadingScreenProps = {
  fullScreen?: boolean;
  title?: string;
  subtitle?: string;
  logoText?: string;
};

export default function AppLoadingScreen({
  fullScreen = false,
  title = "Membership Tracker",
  subtitle = "Preparing workspace...",
  logoText = "MT",
}: AppLoadingScreenProps) {
  return (
    <Box
      sx={{
        minHeight: fullScreen ? "100vh" : "calc(100vh - 112px)",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 3,
        background:
          "radial-gradient(circle at top, rgba(214,234,248,0.72) 0%, rgba(243,249,252,0.38) 28%, rgba(245,249,252,0.12) 55%, rgba(241,245,249,0) 72%), linear-gradient(180deg, #EEF5FB 0%, #F7FAFD 52%, #EEF4F9 100%)",
        overflow: "hidden",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(115deg, transparent 0%, rgba(192,221,241,0.14) 22%, transparent 44%, rgba(221,236,247,0.12) 62%, transparent 82%)",
          backgroundSize: "240px 100%",
          animation: "appLoaderSweep 7s linear infinite",
          opacity: 0.95,
          pointerEvents: "none",
        },
        "@keyframes appLoaderSweep": {
          "0%": { backgroundPosition: "-240px 0" },
          "100%": { backgroundPosition: "calc(100vw + 240px) 0" },
        },
        "@keyframes appLoaderFill": {
          "0%": { transform: "translateX(-115%)" },
          "50%": { transform: "translateX(-18%)" },
          "100%": { transform: "translateX(160%)" },
        },
        "@keyframes appLoaderPulse": {
          "0%, 100%": { transform: "scale(1)", opacity: 0.96 },
          "50%": { transform: "scale(1.03)", opacity: 1 },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 520,
          px: { xs: 3.2, sm: 4.5 },
          py: { xs: 4, sm: 4.5 },
          borderRadius: "30px",
          border: "1px solid rgba(171,199,222,0.95)",
          background:
            "linear-gradient(135deg, rgba(247,253,255,0.96) 0%, rgba(255,252,249,0.98) 48%, rgba(248,245,251,0.96) 100%)",
          boxShadow:
            "0 30px 50px rgba(127,153,177,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
          textAlign: "center",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box
          sx={{
            width: 50,
            height: 50,
            mx: "auto",
            mb: 2.2,
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #315778 0%, #214865 100%)",
            boxShadow: "0 12px 22px rgba(33,72,101,0.28), inset 0 2px 0 rgba(255,255,255,0.18)",
            animation: "appLoaderPulse 2.6s ease-in-out infinite",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: 900,
              letterSpacing: 0.8,
              color: "#FFFFFF",
            }}
          >
            {logoText}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: { xs: "1.15rem", sm: "1.35rem" },
            fontWeight: 900,
            color: "#213A54",
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 1.3,
            fontSize: { xs: "0.98rem", sm: "1.05rem" },
            fontWeight: 700,
            color: "#4D6B87",
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </Typography>

        <Box
          sx={{
            mt: 3,
            mx: "auto",
            width: "100%",
            maxWidth: 326,
            height: 10,
            borderRadius: "999px",
            background: "rgba(190,209,225,0.72)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              width: "42%",
              borderRadius: "inherit",
              background: "linear-gradient(90deg, #2D7D99 0%, #7CC0A7 100%)",
              boxShadow: "0 0 18px rgba(45,125,153,0.24)",
              animation: "appLoaderFill 2.1s ease-in-out infinite",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
