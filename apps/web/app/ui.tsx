import React from "react";

type BaseProps = React.PropsWithChildren<{
  style?: React.CSSProperties;
}>;

export function SectionTitle({ children, style }: BaseProps) {
  return (
    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, ...style }}>
      {children}
    </h2>
  );
}

export function Card({ children, style }: BaseProps) {
  return (
    <section
      style={{
        marginTop: 14,
        background: "white",
        borderRadius: 18,
        boxShadow: "0 10px 40px rgba(0,0,0,0.10)",
        padding: 16,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function Pill({
  children,
  tone = "neutral",
  style,
}: BaseProps & { tone?: "ok" | "warn" | "bad" | "neutral" }) {
  const toneStyle: Record<string, React.CSSProperties> = {
    ok: { background: "#E8FFF1", borderColor: "#b7f3ce", color: "#0d7a37" },
    warn: { background: "#fff7ed", borderColor: "#fed7aa", color: "#9a3412" },
    bad: { background: "#fff1f2", borderColor: "#fecdd3", color: "#9f1239" },
    neutral: { background: "#eef2ff", borderColor: "#c7d2fe", color: "#1e3a8a" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid",
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
        ...toneStyle[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  href,
  disabled,
  style,
  title,
}: BaseProps & {
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  title?: string;
}) {
  const base: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "white",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 800,
    opacity: disabled ? 0.6 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...style,
  };

  if (href) {
    return (
      <a href={href} style={base} aria-disabled={disabled} title={title}>
        {children}
      </a>
    );
  }

  return (
    <button style={base} onClick={disabled ? undefined : onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}
