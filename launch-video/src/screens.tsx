import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";
import { press, stepR, type Spring } from "./motion";
import { C, F, PHONE, RECT, WIDE, type Rect } from "./theme";

const SNAP: Spring = { w: 18, z: 0.86 };

function kickerStyle(color = C.blue): CSSProperties {
  return {
    fontFamily: F.head,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color,
    margin: 0,
  };
}

function Btn({
  rect,
  label,
  kind = "primary",
  pressed = 0,
  disabled = false,
}: {
  rect: Rect;
  label: string;
  kind?: "primary" | "secondary";
  pressed?: number;
  disabled?: boolean;
}) {
  const primary = kind === "primary";
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y + pressed * 1.5,
        width: rect.w,
        height: rect.h,
        borderRadius: 999,
        border: `2px solid ${primary ? C.navy : C.navy800}`,
        background: primary ? C.blue : C.white,
        color: primary ? C.white : C.navy800,
        boxShadow: pressed > 0.4 ? `1px 1px 0 ${C.navy}` : `2px 2px 0 ${C.navy}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: F.head,
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </div>
  );
}

function Belt({ name, color }: { name: string; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 22,
          height: 10,
          borderRadius: 2,
          background: color,
          border: "1px solid rgba(11,30,46,0.45)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)",
        }}
      />
      <span style={{ fontFamily: F.body, fontSize: 15, color: C.gray800 }}>{name}</span>
    </span>
  );
}

function Meta({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 8 }}>
      {items.map((item) => (
        <span key={item} style={{ fontFamily: F.body, fontSize: 14, color: C.gray800 }}>
          {item}
        </span>
      ))}
    </div>
  );
}

function Logo({ height }: { height: number }) {
  return (
    <Img
      src={staticFile("svj-logo-white.png")}
      style={{ height, width: "auto", display: "block" }}
    />
  );
}

function PhoneHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 60,
        background: C.navy800,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 14px",
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
      <Logo height={24} />
      <span
        style={{
          marginLeft: 4,
          fontFamily: F.head,
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.8)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function BottomNav() {
  const items = [
    { label: "Roster", on: true },
    { label: "Opponents", on: false },
    { label: "Today", on: false },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 64,
        background: C.white,
        borderTop: `2px solid ${C.navy}`,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            color: item.on ? C.blue : C.gray600,
            fontFamily: F.head,
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              border: `2px solid ${item.on ? C.blue : C.gray600}`,
            }}
          />
          {item.label}
        </div>
      ))}
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 28,
        padding: "0 10px",
        borderRadius: 4,
        background: C.blue50,
        color: C.navy,
        fontFamily: F.body,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

export function HookCard() {
  return (
    <div style={{ width: 1180, height: 450, background: C.white, position: "relative", padding: "40px 64px 32px" }}>
      <p style={{ ...kickerStyle(), fontFamily: F.logo, letterSpacing: "0.14em", fontSize: 16 }}>
        Silicon Valley Judo
      </p>
      <h1
        style={{
          margin: "18px 0 0",
          fontFamily: F.head,
          fontWeight: 700,
          fontSize: 92,
          lineHeight: 0.98,
          letterSpacing: "-0.03em",
          color: C.navy,
        }}
      >
        Four minutes.
      </h1>
      <p style={{ margin: "16px 0 0", fontFamily: F.body, fontSize: 28, color: C.gray800 }}>
        The match is on Mat 1. Maya H. is up at 9:00.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1.3fr", gap: 16, marginTop: 36 }}>
        {[
          ["Mat", "1"],
          ["Time", "9:00–10:00 AM"],
          ["Coach", "sensei.jorge"],
        ].map(([label, value]) => (
          <div key={label} style={{ border: `2px solid ${C.navy}`, borderRadius: 8, padding: "14px 18px", boxShadow: `3px 3px 0 ${C.navy}` }}>
            <div style={kickerStyle(C.gray600)}>{label}</div>
            <div style={{ marginTop: 4, fontFamily: F.head, fontWeight: 700, fontSize: 28, color: label === "Mat" ? C.blue : C.navy }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileScreen() {
  const qc = RECT.qc;
  return (
    <div style={{ width: PHONE.w, height: PHONE.h, background: C.paper, position: "relative" }}>
      <PhoneHeader label="Maya" />
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: 76,
          background: C.white,
          border: `2px solid ${C.navy}`,
          borderRadius: 8,
          boxShadow: `3px 3px 0 ${C.navy}`,
          padding: "16px 16px 18px",
        }}
      >
        <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 32, color: C.navy, lineHeight: 1.1 }}>Maya H.</div>
        <div style={{ marginTop: 8 }}>
          <Belt name="Blue" color={C.belt.blue} />
        </div>
        <Meta items={["Stance: Right", "Weight: -48kg", "Division: Juvenile"]} />
      </div>
      <Btn rect={qc} label="+  Quick capture" />
      <div
        style={{
          position: "absolute",
          left: qc.x + qc.w + 8,
          top: qc.y,
          width: 108,
          height: qc.h,
          borderRadius: 999,
          border: `2px solid ${C.navy800}`,
          background: C.white,
          boxShadow: `2px 2px 0 ${C.navy}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.head,
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.navy800,
        }}
      >
        Print
      </div>
      <div
        style={{
          position: "absolute",
          left: qc.x + qc.w + 124,
          top: qc.y,
          width: 100,
          height: qc.h,
          borderRadius: 999,
          border: `2px solid ${C.navy800}`,
          background: C.white,
          boxShadow: `2px 2px 0 ${C.navy}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.head,
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.navy800,
        }}
      >
        Edit
      </div>
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: 284,
          background: C.white,
          border: `2px solid ${C.navy}`,
          borderRadius: 8,
          boxShadow: `3px 3px 0 ${C.navy}`,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={kickerStyle(C.gray600)}>Today</span>
          <span style={{ ...kickerStyle(C.blue), letterSpacing: "0.08em" }}>Assignments</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1.3fr 1.2fr", gap: 8, marginTop: 10 }}>
          <Tile label="Mat" value="1" accent />
          <Tile label="Coach" value="sensei.jorge" />
          <Tile label="Time" value="9:00–10:00 AM" />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: 468,
          background: C.white,
          border: `2px solid ${C.navy}`,
          borderRadius: 8,
          boxShadow: `3px 3px 0 ${C.navy}`,
          padding: 16,
        }}
      >
        <div style={kickerStyle(C.gray600)}>Development focus</div>
        <p style={{ margin: "8px 0 0", fontFamily: F.body, fontSize: 18, lineHeight: 1.35, color: C.navy }}>
          Ne-waza transitions, grip fighting speed
        </p>
      </div>
      <div style={{ position: "absolute", left: 16, right: 16, top: 600 }}>
        <div style={kickerStyle(C.gray600)}>Techniques</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {["Seoi-nage", "Uchi-mata", "Ko-uchi-gari", "Kesa-gatame"].map((name) => (
            <Tag key={name}>{name}</Tag>
          ))}
        </div>
        <p style={{ margin: "12px 0 0", fontFamily: F.body, fontSize: 15, color: C.gray600 }}>
          Tokui-waza: strong right-sided entries.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}

function Tile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: C.paper, borderRadius: 8, padding: "8px 10px" }}>
      <div style={kickerStyle(C.gray600)}>{label}</div>
      <div
        style={{
          marginTop: 2,
          fontFamily: F.head,
          fontWeight: 700,
          fontSize: accent ? 28 : 15,
          color: accent ? C.blue : C.navy,
          lineHeight: 1.15,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Chip({
  rect,
  label,
  on,
  plus = false,
}: {
  rect: Rect;
  label: string;
  on: boolean;
  plus?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: 999,
        border: `2px solid ${C.navy}`,
        background: on ? C.navy : C.white,
        color: on ? C.white : C.navy,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontFamily: F.head,
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {plus ? <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> : null}
      {label}
    </div>
  );
}

export function CaptureScreen({ t }: { t: number }) {
  const winOn = t >= 8.95;
  const ipponOn = t >= 9.9;
  const savePress = press(t, 11.25);
  const winFill = stepR(t - 8.95, SNAP);
  const row = stepR(t - 9.9, { w: 16, z: 0.9 });
  const summary = !winOn ? "Pick a result to enable Save." : ipponOn ? "Win · 1. Ippon" : "Win";
  return (
    <div style={{ width: PHONE.w, height: PHONE.h, background: C.paper, position: "relative" }}>
      <PhoneHeader label="Maya" />
      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          top: 72,
          bottom: 72,
          background: C.white,
          border: `2px solid ${C.blue}`,
          borderRadius: 8,
        }}
      />
      <div style={{ position: "absolute", left: 28, top: 88, right: 28 }}>
        <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 26, color: C.navy }}>Quick capture</div>
        <p style={{ margin: "4px 0 0", fontFamily: F.body, fontSize: 15, color: C.gray600 }}>
          Maya H. · Result first. Everything else is optional.
        </p>
      </div>
      <div style={{ position: "absolute", left: 28, top: 152, ...kickerStyle(C.navy) }}>
        Result <span style={{ color: C.blue }}>*</span>
      </div>
      <Chip rect={{ x: 186, y: 176, w: 148, h: 52 }} label="Loss" on={false} />
      <Chip rect={{ x: 344, y: 176, w: 148, h: 52 }} label="Other" on={false} />
      <div
        style={{
          position: "absolute",
          left: RECT.win.x,
          top: RECT.win.y,
          width: RECT.win.w * Math.max(winFill, 0.001),
          height: RECT.win.h,
          borderRadius: 999,
          background: C.navy,
          transformOrigin: "left center",
          opacity: winOn ? 1 : 0,
        }}
      />
      <div style={{ position: "absolute", left: RECT.win.x, top: RECT.win.y, width: RECT.win.w, height: RECT.win.h, display: "flex", alignItems: "center", justifyContent: "center", color: winFill > 0.72 ? C.white : C.navy, fontFamily: F.head, fontWeight: 600, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 999, border: `2px solid ${C.navy}` }}>
        Win
      </div>
      <div style={{ position: "absolute", left: 28, top: 248, fontFamily: F.head, fontWeight: 600, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: C.navy }}>
        Score sequence <span style={{ color: C.gray600, letterSpacing: "0.04em", textTransform: "none", fontFamily: F.body, fontWeight: 400 }}>optional</span>
      </div>
      <Chip rect={RECT.ippon} label="Ippon" on={false} plus />
      <Chip rect={{ x: 164, y: 292, w: 156, h: 44 }} label="Waza-ari" on={false} plus />
      <Chip rect={{ x: 328, y: 292, w: 164, h: 44 }} label="Osaekomi" on={false} plus />
      <div
        style={{
          position: "absolute",
          left: 28,
          right: 28,
          top: 350,
          opacity: row,
          transform: `translateY(${(1 - row) * 10}px)`,
          background: C.paper,
          border: `1px solid ${C.gray100}`,
          borderRadius: 8,
          minHeight: 48,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          fontFamily: F.body,
          fontWeight: 600,
          fontSize: 16,
          color: C.navy,
        }}
      >
        1. Ippon
      </div>
      <div style={{ position: "absolute", left: 28, top: 430, fontFamily: F.body, fontSize: 16, color: C.gray800 }}>
        <span style={{ fontFamily: F.head, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13, color: C.gray600 }}>
          Opponent
        </span>
        <span style={{ marginLeft: 8 }}>Unknown opponent</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          top: 708,
          fontFamily: F.body,
          fontSize: 16,
          fontWeight: 600,
          color: winOn ? C.navy : C.gray600,
        }}
      >
        {summary}
      </div>
      <Btn rect={RECT.save} label={savePress > 0.55 ? "Saving…" : "Save capture"} pressed={savePress} disabled={!winOn} />
      <BottomNav />
    </div>
  );
}

export function IntelScreen() {
  return (
    <div style={{ width: PHONE.w, height: PHONE.h, background: C.paper, position: "relative" }}>
      <PhoneHeader label="Maya" />
      <div style={{ position: "absolute", left: 16, right: 16, top: 80 }}>
        <div style={kickerStyle(C.gray600)}>Opponent intel</div>
        <Note
          name="Elena K."
          club="Sacramento Judo"
          headline="Win · 1. Ippon via Seoi-nage"
          body="Clean drop seoi after she reached over the top."
          result="W"
        />
        <div style={{ height: 14 }} />
        <Note
          name="Sarah M."
          club="Peninsula Judo"
          headline="Bay Area Open · left stance"
          body="Very aggressive, likes left uchi-mata. Watch for counter with ko-soto-gake."
        />
      </div>
      <BottomNav />
    </div>
  );
}

function Note({
  name,
  club,
  headline,
  body,
  result,
}: {
  name: string;
  club: string;
  headline: string;
  body: string;
  result?: "W";
}) {
  return (
    <div
      style={{
        marginTop: 12,
        background: C.white,
        border: `2px solid ${C.navy}`,
        borderRadius: 8,
        boxShadow: `3px 3px 0 ${C.navy}`,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 22, color: C.navy }}>vs. {name}</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: C.gray600, marginTop: 2 }}>{club}</div>
        </div>
        {result ? (
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: C.success50,
              color: C.success,
              border: `2px solid ${C.success}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.head,
              fontWeight: 700,
            }}
          >
            {result}
          </span>
        ) : null}
      </div>
      <div style={{ marginTop: 10, fontFamily: F.head, fontWeight: 700, fontSize: 15, color: C.navy }}>{headline}</div>
      <p style={{ margin: "8px 0 0", fontFamily: F.body, fontSize: 16, lineHeight: 1.4, color: C.gray800 }}>{body}</p>
    </div>
  );
}

function WideHeader({ current }: { current: "roster" | "today" }) {
  const links: Array<{ label: string; x: number; w: number; id?: "today" }> = [
    { label: "Roster", x: 1156, w: 120 },
    { label: "Opponents", x: 1284, w: 144 },
    { label: "Today", x: RECT.todayNav.x, w: RECT.todayNav.w, id: "today" },
    { label: "Menu", x: 1552, w: 100 },
  ];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 64, background: C.navy800 }}>
      <div style={{ position: "absolute", left: 28, top: 16 }}>
        <Logo height={30} />
      </div>
      {links.map((link) => {
        const on = (current === "roster" && link.label === "Roster") || (current === "today" && link.id === "today");
        return (
          <div
            key={link.label}
            style={{
              position: "absolute",
              left: link.x,
              top: 12,
              width: link.w,
              height: 40,
              borderRadius: 999,
              background: on ? C.white : "transparent",
              color: on ? C.navy800 : "rgba(255,255,255,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.head,
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {link.label === "Menu" ? "··· Menu" : link.label}
          </div>
        );
      })}
    </div>
  );
}

const ROSTER = [
  { name: "Kenji T.", belt: "White", color: C.belt.white, pill: "Today", sample: false, meta: ["No details yet"], focus: "" },
  { name: "Priya S.", belt: "Yellow", color: C.belt.yellow, pill: "Today · Mat 1", sample: false, meta: ["Stance: Unknown", "Weight: -40kg", "Division: Juvenile"], focus: "Confidence in randori; first tournament this season", foot: "No details yet" },
  { name: "Lucas R.", belt: "Green", color: C.belt.green, pill: "Today · Mat 3", sample: false, meta: ["Stance: Left", "Weight: -73kg", "Division: Cadet"], focus: "Finishing from turtle; stop dropping the head on uchi-mata", foot: "3 techniques · 0W 1L" },
  { name: "Sample B.", belt: "Orange", color: C.belt.orange, pill: "", sample: true, meta: ["Stance: Right", "Weight: -66kg", "Division: Cadet"], focus: "Left-side attacks, tournament cardio", foot: "1 scouting note" },
  { name: "Demo A.", belt: "Green", color: C.belt.green, pill: "", sample: true, meta: ["Stance: Right", "Weight: -48kg", "Division: Juvenile"], focus: "Ne-waza transitions, grip fighting speed", foot: "1 scouting note" },
  { name: "Maya H.", belt: "Blue", color: C.belt.blue, pill: "Today · Mat 1", sample: false, meta: ["Stance: Right", "Weight: -48kg", "Division: Juvenile"], focus: "Ne-waza transitions, grip fighting speed", foot: "5 techniques · 1 scouting note · 1W 1L" },
];

export function RosterScreen() {
  return (
    <div style={{ width: WIDE.w, height: WIDE.h, background: C.paper, position: "relative" }}>
      <WideHeader current="roster" />
      <div style={{ position: "absolute", left: 32, top: 84 }}>
        <p style={kickerStyle()}>Silicon Valley Judo</p>
        <h1 style={{ margin: "4px 0 0", fontFamily: F.head, fontWeight: 700, fontSize: 40, color: C.navy }}>Roster</h1>
        <p style={{ margin: "4px 0 0", fontFamily: F.body, fontSize: 16, color: C.gray600 }}>
          6 athletes · tap a card for the matside profile
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          right: 32,
          top: 108,
          height: 48,
          padding: "0 22px",
          borderRadius: 999,
          background: C.blue,
          color: C.white,
          border: `2px solid ${C.navy}`,
          boxShadow: `2px 2px 0 ${C.navy}`,
          display: "flex",
          alignItems: "center",
          fontFamily: F.head,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: 14,
        }}
      >
        + Add athlete
      </div>
      <div
        style={{
          position: "absolute",
          left: 32,
          right: 32,
          top: 196,
          height: 48,
          borderRadius: 4,
          border: `2px solid ${C.gray300}`,
          background: C.white,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 10,
          color: C.gray600,
          fontFamily: F.body,
          fontSize: 16,
        }}
      >
        <span style={{ fontSize: 16 }}>⌕</span>
        Search by name, weight class, division…
      </div>
      <div style={{ position: "absolute", left: 32, top: 260, ...kickerStyle(C.gray600) }}>Athletes · 6</div>
      <div
        style={{
          position: "absolute",
          left: 32,
          right: 32,
          top: 288,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
        }}
      >
        {ROSTER.map((athlete) => (
          <div
            key={athlete.name}
            style={{
              background: C.white,
              border: `2px solid ${C.navy}`,
              borderRadius: 8,
              boxShadow: `3px 3px 0 ${C.navy}`,
              padding: "14px 14px 12px",
              minHeight: 188,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 22, color: C.navy }}>{athlete.name}</div>
                <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                  <Belt name={athlete.belt} color={athlete.color} />
                  {athlete.sample ? (
                    <span style={{ fontFamily: F.head, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: C.warning, background: C.warning50, border: `1px dashed ${C.warning}`, borderRadius: 4, padding: "2px 6px" }}>
                      Sample
                    </span>
                  ) : null}
                </div>
              </div>
              {athlete.pill ? (
                <span style={{ height: 26, padding: "0 10px", borderRadius: 999, background: C.blue, color: C.white, fontFamily: F.head, fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", display: "inline-flex", alignItems: "center" }}>
                  {athlete.pill}
                </span>
              ) : null}
            </div>
            {athlete.meta.length > 1 ? <Meta items={athlete.meta} /> : null}
            {athlete.focus ? (
              <p style={{ margin: "8px 0 0", fontFamily: F.body, fontSize: 14, color: C.navy, lineHeight: 1.35 }}>
                <span style={{ ...kickerStyle(C.gray600), letterSpacing: "0.08em", marginRight: 6 }}>Focus</span>
                {athlete.focus}
              </p>
            ) : null}
            <div style={{ marginTop: "auto", paddingTop: 10, borderTop: `1px solid ${C.gray100}`, display: "flex", justifyContent: "space-between", color: C.gray600, fontFamily: F.body, fontSize: 13 }}>
              <span>{athlete.foot || athlete.meta[0]}</span>
              <span style={{ color: C.blue }}>›</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const COMPETING = [
  ["Kenji T.", "No mat yet · No coach needed"],
  ["Priya S.", "-40kg · Mat 1 · 9:00-10:00 AM · No coach yet"],
  ["Lucas R.", "-73kg · Mat 3 · 10:00-11:00 AM · No coach yet"],
  ["Maya H.", "-48kg · Mat 1 · 9:00-10:00 AM · Coach assigned"],
];

export function TodayScreen({ t }: { t: number }) {
  const hit = press(t, 24.55);
  return (
    <div style={{ width: WIDE.w, height: WIDE.h, background: C.paper, position: "relative" }}>
      <WideHeader current="today" />
      <div style={{ position: "absolute", left: 32, top: 84 }}>
        <p style={kickerStyle()}>Tournament day</p>
        <h1 style={{ margin: "4px 0 0", fontFamily: F.head, fontWeight: 700, fontSize: 40, color: C.navy }}>Bay Area Open</h1>
        <p style={{ margin: "4px 0 0", fontFamily: F.body, fontSize: 16, color: C.gray600 }}>Today · 4 competing</p>
      </div>
      <Btn rect={{ x: 1048, y: 108, w: 292, h: 48 }} label="Assign coaches" />
      <Btn rect={RECT.printPack} label="Print pack (4)" kind="secondary" pressed={hit} />
      <div
        style={{
          position: "absolute",
          left: 32,
          right: 32,
          top: 196,
          background: C.white,
          border: `2px solid ${C.navy}`,
          borderRadius: 8,
          boxShadow: `3px 3px 0 ${C.navy}`,
          padding: "18px 20px 8px",
        }}
      >
        <div style={kickerStyle(C.gray600)}>Competing today · 4</div>
        {COMPETING.map(([name, meta]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 72, borderTop: `1px solid ${C.gray100}` }}>
            <div>
              <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 20, color: C.navy }}>{name}</div>
              <div style={{ fontFamily: F.body, fontSize: 15, color: C.gray600, marginTop: 2 }}>{meta}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Mini label="Capture" primary />
              <Mini label="Profile" />
            </div>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${C.gray100}`, padding: "12px 0 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={kickerStyle(C.gray600)}>Offline readiness</span>
          <span style={{ height: 36, padding: "0 14px", borderRadius: 999, border: `2px solid ${C.navy800}`, display: "inline-flex", alignItems: "center", fontFamily: F.head, fontWeight: 600, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", color: C.navy800 }}>
            Cache for offline
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 32, top: 628, ...kickerStyle(C.gray600) }}>Who is competing? · 4 of 6</div>
      <div style={{ position: "absolute", left: 32, right: 32, top: 656, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
        {[
          ["Kenji T.", "White", C.belt.white, true],
          ["Priya S.", "Yellow", C.belt.yellow, true],
          ["Lucas R.", "Green", C.belt.green, true],
          ["Sample B.", "Orange", C.belt.orange, false],
          ["Demo A.", "Green", C.belt.green, false],
          ["Maya H.", "Blue", C.belt.blue, true],
        ].map(([name, belt, color, on]) => (
          <div
            key={String(name)}
            style={{
              background: on ? C.blue50 : C.white,
              border: `2px solid ${on ? C.blue : C.navy}`,
              borderRadius: 8,
              boxShadow: on ? `3px 3px 0 ${C.blue}` : `3px 3px 0 ${C.navy}`,
              padding: "10px 10px 12px",
              minHeight: 118,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
              <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 16, color: C.navy }}>{name}</div>
              <span style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${on ? C.blue : C.gray300}`, background: on ? C.blue : C.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {on ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                ) : null}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <Belt name={String(belt)} color={String(color)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Mini({ label, primary = false }: { label: string; primary?: boolean }) {
  return (
    <span
      style={{
        height: 36,
        padding: "0 12px",
        borderRadius: 999,
        border: `2px solid ${C.navy}`,
        background: primary ? C.blue : C.white,
        color: primary ? C.white : C.navy800,
        fontFamily: F.head,
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {label}
    </span>
  );
}

export function PrintScreen() {
  return (
    <div style={{ width: WIDE.w, height: WIDE.h, background: C.white, position: "relative", overflow: "hidden" }}>
      {["Priya S.", "Lucas R.", "Kenji T."].map((name, i) => (
        <div
          key={name}
          style={{
            position: "absolute",
            right: 28 + i * 22,
            top: 48 + i * 14,
            width: 46,
            height: 168,
            background: C.paper,
            border: `2px solid ${C.navy}`,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ writingMode: "vertical-rl", fontFamily: F.head, fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", color: C.navy }}>
            {name}
          </span>
        </div>
      ))}
      <div style={{ position: "absolute", left: 40, right: 210, top: 28, bottom: 24, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `2px solid ${C.navy}`, paddingBottom: 12 }}>
          <div>
            <p style={kickerStyle()}>Matside coach card</p>
            <h1 style={{ margin: "4px 0 0", fontFamily: F.head, fontWeight: 700, fontSize: 48, lineHeight: 1, color: C.navy }}>Maya H.</h1>
            <div style={{ marginTop: 8 }}>
              <Belt name="Blue" color={C.belt.blue} />
            </div>
          </div>
          <div style={{ textAlign: "right", fontFamily: F.body, fontSize: 15, color: C.gray600 }}>
            Bay Area Open
            <div style={{ fontFamily: F.head, fontWeight: 700, color: C.navy, marginTop: 4 }}>Pack · 1 of 4</div>
          </div>
        </div>
        <div style={{ marginTop: 14, background: C.blue50, border: `1px solid ${C.blue}`, borderRadius: 4, padding: "10px 14px", display: "grid", gridTemplateColumns: "1.2fr 0.6fr 1fr" }}>
          <div>
            <div style={kickerStyle(C.blue700)}>Today's assignment</div>
            <div style={{ fontFamily: F.body, fontSize: 16, color: C.navy, marginTop: 4 }}>Coach: sensei.jorge</div>
          </div>
          <div style={{ fontFamily: F.body, fontSize: 16, color: C.navy, alignSelf: "end" }}>Mat: 1</div>
          <div style={{ fontFamily: F.body, fontSize: 16, color: C.navy, alignSelf: "end" }}>Time: 9:00-10:00 AM</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 28px", marginTop: 16 }}>
          <Field label="Tokui-waza (tachi)" body="Strong right-sided entries" />
          <Field label="Ne-waza" body="Fast to kesa from a failed throw" />
          <Field label="Kumi-kata" body="High lapel grip, quick hand changes" />
          <Field label="Development" body="Ne-waza transitions, grip fighting speed" />
        </div>
        <div style={{ marginTop: 14, background: C.paper, borderRadius: 4, padding: "10px 12px" }}>
          <div style={kickerStyle(C.navy)}>Coach notes</div>
          <p style={{ margin: "4px 0 0", fontFamily: F.body, fontSize: 15, color: C.navy }}>
            Competes best when she attacks early. Tends to stall after leading by waza-ari.
          </p>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 16, letterSpacing: "0.06em", textTransform: "uppercase", color: C.navy }}>
            Opponent intel
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 10 }}>
            <IntelCard name="Elena K." club="Sacramento Judo" result="W" body="Win · 1. Ippon via Seoi-nage. Clean drop seoi after she reached over the top." />
            <IntelCard name="Sarah M." club="Peninsula Judo" body="Bay Area Open, left stance. Likes left uchi-mata. Counter with ko-soto-gake. Attack first." />
            <IntelCard name="Unknown" club="Loss · osaekomi" body="Went passive after the waza-ari. Two shidos, then caught in osaekomi." />
          </div>
        </div>
        <div style={{ marginTop: "auto", paddingTop: 18, textAlign: "center", fontFamily: F.head, fontWeight: 600, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: C.gray600 }}>
          Silicon Valley Judo · Competitor analysis
        </div>
      </div>
    </div>
  );
}

function IntelCard({ name, club, body, result }: { name: string; club: string; body: string; result?: string }) {
  return (
    <div style={{ border: `2px solid ${C.navy}`, borderRadius: 8, padding: "12px 12px 14px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 18, color: C.navy }}>vs. {name}</div>
        {result ? (
          <span style={{ width: 28, height: 28, borderRadius: 999, border: `2px solid ${C.success}`, background: C.success50, color: C.success, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.head, fontWeight: 700 }}>
            {result}
          </span>
        ) : null}
      </div>
      <div style={{ marginTop: 4, fontFamily: F.body, fontSize: 13, color: C.gray600 }}>{club}</div>
      <p style={{ margin: "8px 0 0", fontFamily: F.body, fontSize: 15, lineHeight: 1.4, color: C.navy }}>{body}</p>
    </div>
  );
}

function Field({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", color: C.navy }}>{label}</div>
      <p style={{ margin: "3px 0 0", fontFamily: F.body, fontSize: 16, color: C.navy }}>{body}</p>
    </div>
  );
}

export function EndCard({ t }: { t: number }) {
  const sweepP = Math.max(0, Math.min(1, (t - 29.35) / 0.7));
  const sweepX = -20 + sweepP * 140;
  return (
    <div style={{ width: 1920, height: 1080, position: "relative", background: "transparent" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile("svj-logo-white.png")} style={{ width: 860, height: "auto" }} />
        <div style={{ width: 72, height: 3, background: C.blue, marginTop: 28 }} />
        <div style={{ marginTop: 22, fontFamily: F.head, fontWeight: 700, fontSize: 42, color: C.white, letterSpacing: "-0.02em" }}>
          Competitor analysis
        </div>
        <div style={{ marginTop: 12, fontFamily: F.body, fontSize: 22, color: "rgba(255,255,255,0.78)" }}>
          Matside. Private. Offline.
        </div>
      </div>
      {sweepP > 0 && sweepP < 1 ? (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: Math.sin(sweepP * Math.PI) * 0.45 }}>
          <div
            style={{
              position: "absolute",
              top: "30%",
              bottom: "30%",
              left: `${sweepX}%`,
              width: "16%",
              background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.9), transparent)",
              transform: "skewX(-16deg)",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
