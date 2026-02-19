"use client";

import React from "react";

type Props = {
  text?: string;
  subtext?: string;
};

export default function HomeFooter({
  text = "El beneficio se asigna automáticamente según plan, historial de pagos y antigüedad.",
  subtext = "🔒 Sistema seguro de SSServicios (demo)",
}: Props) {
  return (
    <div style={{ marginTop: 18, textAlign: "center", fontSize: 12, opacity: 0.65 }}>
      {text}
      <div style={{ marginTop: 8, fontWeight: 700, opacity: 0.7 }}>{subtext}</div>
    </div>
  );
}
