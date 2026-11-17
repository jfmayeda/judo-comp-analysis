import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CAMERA, CURSOR, MORPH, PUSH, SNAP, Spring, Track, clamp, press, stepR, vis } from "./motion";
import { archivo, michroma, sourceSans, svj } from "./theme";
import TL from "./timeline.json";
import { useTextWidths } from "./useTextWidths";

const S = TL.sections;
const TAP = TL.taps;

// ---------------------------------------------------------------- the one shape
type Box = { x: number; y: number; w: number; h: number; r: number; bw: number };
const PHONE_W = 420;
const PHONE_BW = 14;
const PHONE_H = Math.round((PHONE_W - 2 * PHONE_BW) / (1170 / 2532)) + 2 * PHONE_BW;
const L: Record<string, Box> = {
  seed: { x: 960, y: 702, w: 0, h: 0, r: 34, bw: 0 },
  dot: { x: 960 - 100, y: 668, w: 200, h: 68, r: 34, bw: 0 },
  full: { x: 0, y: 0, w: 1920, h: 1080, r: 0, bw: 0 },
  right: { x: 800, y: 110, w: 1000, h: 860, r: 20, bw: 0 },
  phone: { x: 1300 - PHONE_W / 2, y: (1080 - PHONE_H) / 2, w: PHONE_W, h: PHONE_H, r: 64, bw: PHONE_BW },
  privacy: { x: 800, y: 290, w: 1000, h: 500, r: 20, bw: 0 },
  end: { x: 960 - 310, y: 668, w: 620, h: 100, r: 50, bw: 0 },
};

const BIG: Spring = { w: 9.5, z: 0.9 };
const SHAPE_KEYS: Array<[number, Box, Spring]> = [
  [2.95, L.dot, { w: 16, z: 0.8 }],
  [S.reveal - 0.06, L.full, BIG],
  [S.roster - 0.15, L.right, MORPH],
  [S.capture - 0.15, L.phone, MORPH],
  [S.assign - 0.15, L.right, MORPH],
  [S.privacy - 0.15, L.privacy, MORPH],
  [S.end - 0.15, L.end, MORPH],
];
const shapeTracks = (["x", "y", "w", "h", "r", "bw"] as const).map((k) => {
  const tr = new Track(L.seed[k]);
  for (const [t, b, sp] of SHAPE_KEYS) tr.to(t, b[k], sp);
  return [k, tr] as const;
});
const blueFill = new Track(1).to(S.reveal - 0.02, 0, SNAP).to(S.end - 0.1, 1, SNAP);

function shapeAt(t: number): Box {
  const o = Object.fromEntries(shapeTracks.map(([k, tr]) => [k, tr.at(t)])) as Box;
  return { ...o, w: Math.max(0, o.w), h: Math.max(0, o.h), r: Math.max(0, o.r), bw: Math.max(0, o.bw) };
}

// ---------------------------------------------------------------- shots inside the shape
type Cam = { cx: Track; cy: Track; lz: Track };
type Key = [number, number, number, number, Spring?];
function cam(start: [number, number, number], keys: Key[]): Cam {
  const c = { cx: new Track(start[0]), cy: new Track(start[1]), lz: new Track(Math.log(start[2])) };
  for (const [t, x, y, vw, sp = CAMERA] of keys) {
    c.cx.to(t, x, sp);
    c.cy.to(t, y, sp);
    c.lz.to(t, Math.log(vw), sp);
  }
  return c;
}

type Shot = { id: string; src: string; iw: number; ih: number; tin: number; tout: number; cam: Cam; cut?: boolean };

const loginCam = cam([1440, 430, 1150], [
  [S.reveal + 0.4, 1440, 900, 2500, { w: 4, z: 1 }],
  [S.reveal + 1.5, 1440, 905, 2120, { w: 1.4, z: 1 }],
]);
const rosterCam = cam([1440, 885, 2050], [
  [S.roster + 0.6, 1520, 900, 1900, { w: 3, z: 1 }],
  [10.0, 2150, 1330, 1150, PUSH],
  [TAP.maya + 0.05, 2200, 1360, 720, PUSH],
]);
const athleteCam = cam([880, 480, 1150], [
  [S.athlete + 0.3, 1440, 720, 2000, PUSH],
  [13.25, 1440, 1330, 2000, PUSH],
  [14.15, 1020, 2150, 1700, PUSH],
  [15.0, 950, 2150, 1300, PUSH],
]);
const phoneCam = cam([585, 1266, 1170], [
  [17.3, 585, 1150, 1100, { w: 4, z: 1 }],
  [19.55, 585, 1266, 1170, { w: 5, z: 1 }],
]);
const assignCam = cam([1440, 885, 2050], [
  [S.assign + 0.35, 1760, 560, 1500, PUSH],
  [TAP.autoassign + 0.15, 1440, 900, 1900, PUSH],
  [24.0, 1850, 1110, 1250, PUSH],
  [TAP.apply + 0.12, 980, 760, 1450, PUSH],
]);
const printCam = cam([1440, 990, 2300], [
  [S.print + 0.55, 1560, 560, 1500, PUSH],
  [27.45, 2192, 300, 620, PUSH],
]);
const todayCam = cam([1440, 885, 2050], [
  [28.6, 920, 1330, 1400, PUSH],
  [TAP.offline + 0.2, 980, 1360, 1250, { w: 4, z: 1 }],
]);
const privacyCam = cam([1440, 1000, 2500], [
  [S.privacy + 0.2, 1440, 880, 2200, PUSH],
  [31.8, 1830, 1250, 1600, { w: 4, z: 1 }],
]);

const D = { iw: 2880, ih: 1800 };
const P = { iw: 1170, ih: 2532 };
const shot = (file: string) => staticFile(`shots/${file}.png`);
const SHOTS: Shot[] = [
  { id: "login", src: shot("login"), ...D, tin: S.reveal - 0.1, tout: S.roster - 0.14, cam: loginCam },
  { id: "roster", src: shot("roster"), ...D, tin: S.roster - 0.17, tout: S.athlete - 0.12, cam: rosterCam },
  { id: "athlete", src: shot("athlete"), iw: 2880, ih: 5106, tin: S.athlete - 0.15, tout: S.capture - 0.14, cam: athleteCam },
  { id: "phone-athlete", src: shot("phone-athlete"), ...P, tin: S.capture - 0.17, tout: TAP.quick + 0.1, cam: phoneCam },
  { id: "capture-0", src: shot("capture-0"), ...P, tin: TAP.quick + 0.06, tout: TAP.win + 0.08, cam: phoneCam, cut: true },
  { id: "capture-1", src: shot("capture-1"), ...P, tin: TAP.win + 0.05, tout: TAP.ippon + 0.08, cam: phoneCam, cut: true },
  { id: "capture-2", src: shot("capture-2"), ...P, tin: TAP.ippon + 0.05, tout: TAP.save + 0.16, cam: phoneCam, cut: true },
  { id: "capture-saved", src: shot("capture-saved"), ...P, tin: TAP.save + 0.12, tout: S.assign - 0.14, cam: phoneCam, cut: true },
  { id: "assign-0", src: shot("assign-0"), ...D, tin: S.assign - 0.17, tout: TAP.autoassign + 0.1, cam: assignCam },
  { id: "assign-1", src: shot("assign-1"), ...D, tin: TAP.autoassign + 0.06, tout: TAP.apply + 0.12, cam: assignCam, cut: true },
  { id: "assign-2", src: shot("assign-2"), ...D, tin: TAP.apply + 0.08, tout: S.print - 0.14, cam: assignCam, cut: true },
  { id: "print", src: shot("print"), iw: 2880, ih: 2404, tin: S.print - 0.17, tout: 28.4, cam: printCam },
  { id: "today", src: shot("tournament-day"), ...D, tin: 28.32, tout: TAP.offline + 0.12, cam: todayCam },
  { id: "today-cached", src: shot("tournament-day-cached"), ...D, tin: TAP.offline + 0.08, tout: S.privacy - 0.14, cam: todayCam, cut: true },
  { id: "privacy", src: shot("roster"), ...D, tin: S.privacy - 0.17, tout: S.end - 0.16, cam: privacyCam },
];
const shotById = Object.fromEntries(SHOTS.map((s) => [s.id, s]));

function shotStyle(s: Shot, t: number) {
  if (s.cut) {
    // in-app state change: a quick crossfade, no blur
    const o = clamp((t - s.tin) / 0.07) * (1 - clamp((t - s.tout) / 0.07));
    return { o, b: 0 };
  }
  const v = vis(t, s.tin, s.tout, 0.12);
  return { o: v.o, b: v.b };
}

function project(s: Shot, inner: { w: number; h: number }, t: number) {
  const vw = Math.exp(s.cam.lz.at(t));
  const k = inner.w / vw;
  return { k, ox: inner.w / 2 - s.cam.cx.at(t) * k, oy: inner.h / 2 - s.cam.cy.at(t) * k };
}

const TheShape: React.FC<{ t: number }> = ({ t }) => {
  const b = shapeAt(t);
  if (b.w < 1) return null;
  const inner = { w: b.w - 2 * b.bw, h: b.h - 2 * b.bw };
  const blue = blueFill.at(t);
  return (
    <div
      style={{
        position: "absolute",
        left: b.x,
        top: b.y,
        width: b.w,
        height: b.h,
        borderRadius: b.r,
        background: b.bw > 0.5 ? "#06121c" : "transparent",
        boxShadow: `0 ${30 * (1 - blue)}px ${80 * (1 - blue)}px rgba(3, 10, 18, ${0.45 * (1 - blue)}), 0 0 0 1px rgba(255,255,255,${0.12 * (1 - blue)})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: b.bw,
          top: b.bw,
          width: inner.w,
          height: inner.h,
          borderRadius: Math.max(0, b.r - b.bw),
          overflow: "hidden",
          background: svj.paper,
        }}
      >
        {SHOTS.map((s) => {
          if (t < s.tin - 0.05 || t > s.tout + 0.4) return null;
          const st = shotStyle(s, t);
          if (st.o <= 0.001) return null;
          const p = project(s, inner, t);
          return (
            <Img
              key={s.id}
              src={s.src}
              style={{
                position: "absolute",
                left: p.ox,
                top: p.oy,
                width: s.iw * p.k,
                height: s.ih * p.k,
                maxWidth: "none",
                opacity: st.o,
                filter: st.b > 0.2 ? `blur(${st.b}px)` : undefined,
              }}
            />
          );
        })}
        <div style={{ position: "absolute", inset: 0, background: svj.blue600, opacity: blue }} />
        {t < S.reveal + 0.2 && <ShapeLabel t={t} tin={3.1} tout={S.reveal - 0.1} label="SIGN IN" size={26} />}
        {t > S.end && <ShapeLabel t={t} tin={S.end + 0.25} tout={null} label="BUILT FOR THE MAT" size={32} />}
      </div>
    </div>
  );
};

const ShapeLabel: React.FC<{ t: number; tin: number; tout: number | null; label: string; size: number }> = ({ t, tin, tout, label, size }) => {
  const v = vis(t, tin, tout, 0.08);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: archivo,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "0.12em",
        paddingLeft: "0.12em",
        color: svj.white,
        opacity: v.o,
        filter: v.b > 0.2 ? `blur(${v.b}px)` : undefined,
        transform: `translateY(${v.dy * 0.5}px)`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};

// ---------------------------------------------------------------- cursor
type CursorSeg = {
  shots: string[];
  mode: "mouse" | "touch";
  appear: number;
  hide: number;
  from: [number, number];
  moves: Array<[number, number, number]>;
  clicks: number[];
};
const CURSORS: CursorSeg[] = [
  { shots: ["roster"], mode: "mouse", appear: 10.3, hide: S.athlete - 0.2, from: [2560, 1720], moves: [[10.4, 2330, 1470]], clicks: [TAP.maya] },
  {
    shots: ["phone-athlete", "capture-0", "capture-1", "capture-2", "capture-saved"],
    mode: "touch",
    appear: 16.5,
    hide: TAP.save + 0.22,
    from: [700, 1500],
    moves: [[16.52, 585, 713], [17.3, 255, 653], [18.25, 247, 918], [18.95, 764, 2250]],
    clicks: [TAP.quick, TAP.win, TAP.ippon, TAP.save],
  },
  {
    shots: ["assign-0", "assign-1", "assign-2"],
    mode: "mouse",
    appear: 22.25,
    hide: TAP.apply + 0.3,
    from: [2300, 760],
    moves: [[22.35, 1874, 306], [23.5, 2062, 1232]],
    clicks: [TAP.autoassign, TAP.apply],
  },
  { shots: ["today", "today-cached"], mode: "mouse", appear: 28.55, hide: 29.85, from: [1150, 1720], moves: [[28.62, 552, 1410]], clicks: [TAP.offline] },
];
const cursorTracks = CURSORS.map((c) => {
  const x = new Track(c.from[0]);
  const y = new Track(c.from[1]);
  for (const [t, mx, my] of c.moves) {
    x.to(t, mx, CURSOR);
    y.to(t, my, CURSOR);
  }
  return { x, y };
});

function cursorScreen(i: number, t: number) {
  const c = CURSORS[i];
  const live = c.shots.map((id) => shotById[id]).find((s) => t >= s.tin - 0.05 && t <= s.tout + 0.05) ?? shotById[c.shots[0]];
  const b = shapeAt(t);
  const inner = { w: b.w - 2 * b.bw, h: b.h - 2 * b.bw };
  const p = project(live, inner, t);
  return {
    x: b.x + b.bw + p.ox + cursorTracks[i].x.at(t) * p.k,
    y: b.y + b.bw + p.oy + cursorTracks[i].y.at(t) * p.k,
  };
}

const Cursors: React.FC<{ t: number }> = ({ t }) => (
  <>
    {CURSORS.map((c, i) => {
      if (t < c.appear - 0.1 || t > c.hide + 0.3) return null;
      const pos = cursorScreen(i, t);
      const prev = cursorScreen(i, t - 1 / 60);
      const vx = (pos.x - prev.x) * 60;
      const born = stepR(t - c.appear, { w: 18, z: 0.8 });
      const gone = clamp((t - c.hide) / 0.18);
      const scale = born * (1 - gone) * c.clicks.reduce((m, tc) => m * press(t, tc), 1);
      const ripples = c.clicks
        .filter((tc) => t >= tc && t < tc + 0.45)
        .map((tc) => {
          const k = (t - tc) / 0.45;
          const e = 1 - (1 - k) ** 3;
          return (
            <div
              key={tc}
              style={{
                position: "absolute",
                left: pos.x - (20 + 46 * e),
                top: pos.y - (20 + 46 * e),
                width: 2 * (20 + 46 * e),
                height: 2 * (20 + 46 * e),
                borderRadius: "50%",
                border: `3px solid ${svj.blue600}`,
                opacity: 1 - k,
              }}
            />
          );
        });
      if (c.mode === "touch") {
        return (
          <React.Fragment key={i}>
            {ripples}
            <div
              style={{
                position: "absolute",
                left: pos.x - 26,
                top: pos.y - 26,
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(11, 30, 46, 0.22)",
                border: `3px solid ${svj.navy900}`,
                transform: `scale(${scale})`,
                opacity: 1 - gone,
              }}
            />
          </React.Fragment>
        );
      }
      const lean = clamp(-vx * 0.004, -12, 12);
      const lag = clamp(-vx * 0.01, -18, 18);
      return (
        <React.Fragment key={i}>
          {ripples}
          <div style={{ position: "absolute", left: pos.x, top: pos.y, transform: `scale(${scale}) rotate(${lean}deg)`, transformOrigin: "0 0" }}>
            <svg width="40" height="48" viewBox="0 0 20 24" style={{ position: "absolute", left: -3, top: -2 }}>
              <path d="M2 2 L2 19 L6.6 14.8 L9.6 21.6 L12.6 20.3 L9.7 13.6 L16 13.6 Z" fill={svj.white} stroke={svj.navy900} strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <div
              style={{
                position: "absolute",
                left: 30 + lag,
                top: 40,
                padding: "6px 14px",
                borderRadius: 999,
                background: svj.blue600,
                border: `2px solid ${svj.navy900}`,
                boxShadow: `2px 2px 0 ${svj.navy900}`,
                color: svj.white,
                fontFamily: archivo,
                fontWeight: 600,
                fontSize: 18,
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
              }}
            >
              COACH
            </div>
          </div>
        </React.Fragment>
      );
    })}
  </>
);

// ---------------------------------------------------------------- copy
type Caption = { tin: number; tout: number; title: string; sub: string };
const CAPTIONS: Caption[] = [
  { tin: S.roster + 0.1, tout: S.athlete - 0.2, title: "Your whole roster.", sub: "Who's competing today,\nand on which mat." },
  { tin: S.athlete + 0.1, tout: S.capture - 0.2, title: "Scouting, before the bow.", sub: "Focus, techniques and notes on every\nopponent, shared by every coach." },
  { tin: S.capture + 0.1, tout: S.assign - 0.2, title: "Log it in seconds.", sub: "Result first. Everything else is optional." },
  { tin: S.assign + 0.1, tout: S.print - 0.2, title: "Coaches, auto\u2011assigned.", sub: "Review first. Locked and exclusive\ncoaches are respected." },
  { tin: S.print + 0.1, tout: S.privacy - 0.2, title: "Print. Scan.\nGo offline.", sub: "A matside coach card with a QR code\nto the full profile." },
  { tin: S.privacy + 0.1, tout: S.end - 0.2, title: "First name. Last initial.", sub: "No photos. Opt-out deletes\nevery linked record." },
];

const TEXT_X = 120;
const TEXT_W = 610;

const Captions: React.FC<{ t: number }> = ({ t }) => (
  <>
    {CAPTIONS.map((c, ci) => {
      if (t < c.tin - 0.05 || t > c.tout + 0.3) return null;
      const lines = c.title.split("\n").map((l) => l.split(" "));
      const words = lines.flat();
      const sub = vis(t, c.tin + 0.12 + words.length * 0.05, c.tout + 0.04);
      return (
        <div key={ci} style={{ position: "absolute", left: TEXT_X, top: 392, width: TEXT_W }}>
          <div style={{ fontFamily: archivo, fontWeight: 700, fontSize: 84, lineHeight: 1.04, color: svj.white, letterSpacing: "-0.01em" }}>
            {lines.map((line, li) => (
              <div key={li}>
                {line.map((w, wi) => {
                  const i = lines.slice(0, li).flat().length + wi;
                  const v = vis(t, c.tin + i * 0.05, c.tout - (words.length - i) * 0.015);
                  return (
                    <span
                      key={wi}
                      style={{
                        display: "inline-block",
                        marginRight: "0.24em",
                        opacity: v.o,
                        filter: v.b > 0.2 ? `blur(${v.b}px)` : undefined,
                        transform: `translateY(${v.dy * 1.6}px)`,
                      }}
                    >
                      {w}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 30,
              fontFamily: sourceSans,
              fontWeight: 400,
              fontSize: 36,
              lineHeight: 1.32,
              color: svj.gray300,
              opacity: sub.o,
              filter: sub.b > 0.2 ? `blur(${sub.b}px)` : undefined,
              transform: `translateY(${sub.dy}px)`,
              whiteSpace: "pre-line",
            }}
          >
            {c.sub}
          </div>
        </div>
      );
    })}
  </>
);

// The brand's pill button, carrying real UI labels; it morphs width per label.
const PILL_LABELS: Array<[number, string]> = [
  [S.roster + 0.05, "ROSTER"],
  [10.2, "TODAY \u00b7 MAT 1"],
  [S.athlete, "MATSIDE PROFILE"],
  [14.1, "OPPONENT INTEL"],
  [S.capture, "QUICK CAPTURE"],
  [TAP.win, "WIN"],
  [TAP.ippon, "WIN \u00b7 1. IPPON"],
  [TAP.save + 0.1, "CAPTURE SAVED"],
  [S.assign, "AUTO-ASSIGN COACHES"],
  [TAP.apply + 0.05, "2 ASSIGNMENTS APPLIED"],
  [S.print, "MATSIDE COACH CARD"],
  [TAP.offline + 0.05, "CACHED FOR OFFLINE"],
  [S.privacy, "PRIVACY-FIRST"],
];
const PILL_FONT_PX = 22;
const PILL_LS = PILL_FONT_PX * 0.1;
const PILL_PAD = 26;
const PILL_ON = S.roster;
const isSuccess = (label: string) => ["CAPTURE SAVED", "2 ASSIGNMENTS APPLIED", "CACHED FOR OFFLINE"].includes(label);
const PILL_OFF = S.end - 0.2;

const Pill: React.FC<{ t: number; widths: Record<string, number> }> = ({ t, widths }) => {
  if (t < PILL_ON - 0.1 || t > PILL_OFF + 0.4) return null;
  const width = new Track(0);
  for (const [tl, label] of PILL_LABELS) {
    width.to(tl - 0.02, widths[label] + 2 * PILL_PAD + (isSuccess(label) ? 26 : 0), { w: 20, z: 0.82 });
  }
  const shown = vis(t, PILL_ON, PILL_OFF);
  const w = width.at(t);
  return (
    <div
      style={{
        position: "absolute",
        left: TEXT_X,
        top: 300,
        height: 58,
        width: Math.max(0, w),
        borderRadius: 999,
        background: svj.blue600,
        border: `2px solid ${svj.navy900}`,
        boxShadow: `3px 3px 0 ${svj.navy900}`,
        overflow: "hidden",
        opacity: shown.o,
        filter: shown.b > 0.2 ? `blur(${shown.b}px)` : undefined,
      }}
    >
      {PILL_LABELS.map(([tl, label], i) => {
        const next = PILL_LABELS[i + 1]?.[0] ?? PILL_OFF + 1;
        if (t < tl - 0.05 || t > next + 0.2) return null;
        const v = vis(t, tl + 0.03, next - 0.07, 0.07);
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: PILL_PAD,
              top: 0,
              height: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: archivo,
              fontWeight: 600,
              fontSize: PILL_FONT_PX,
              letterSpacing: `${PILL_LS}px`,
              color: svj.white,
              whiteSpace: "nowrap",
              opacity: v.o,
              filter: v.b > 0.2 ? `blur(${v.b * 0.6}px)` : undefined,
              transform: `translateY(${v.dy * 0.6}px)`,
            }}
          >
            {isSuccess(label) ? (
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginLeft: -4 }}>
                <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={svj.white} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
            {label}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- hook + end card
const HOOK: Array<[number, string]> = [
  [0.1, "Matside."],
  [1.1, "One free hand."],
  [2.15, "And seconds."],
];
const HOOK_OUT = 3.82;

const Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t > S.reveal) return null;
  const kicker = vis(t, -0.3, HOOK_OUT);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
          textAlign: "center",
          fontFamily: archivo,
          fontWeight: 600,
          fontSize: 28,
          letterSpacing: "0.18em",
          color: svj.blue200,
          opacity: kicker.o,
          filter: kicker.b > 0.2 ? `blur(${kicker.b}px)` : undefined,
        }}
      >
        TOURNAMENT DAY
      </div>
      {HOOK.map(([tin, word], i) => {
        const tout = (HOOK[i + 1]?.[0] ?? HOOK_OUT + 0.06) - 0.08;
        const v = vis(t, tin, tout, 0.1);
        if (v.o <= 0.001) return null;
        const s = 1.08 - 0.08 * v.e;
        return (
          <div
            key={word}
            style={{
              position: "absolute",
              top: 410,
              width: "100%",
              textAlign: "center",
              fontFamily: archivo,
              fontWeight: 700,
              fontSize: 168,
              lineHeight: 1,
              letterSpacing: "-0.015em",
              color: svj.white,
              opacity: v.o,
              filter: v.b > 0.2 ? `blur(${v.b}px)` : undefined,
              transform: `translateY(${v.dy}px) scale(${s})`,
            }}
          >
            {word}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < S.end - 0.1) return null;
  const wipe = stepR(t - (S.end - 0.08), { w: 7, z: 1 });
  const logo = vis(t, S.end - 0.08, null);
  const sub = vis(t, S.end + 0.55, null);
  const drift = 1 + 0.025 * clamp((t - S.end) / (TL.duration - S.end));
  return (
    <AbsoluteFill style={{ transform: `scale(${drift})` }}>
      <div
        style={{
          position: "absolute",
          left: 960 - 560,
          top: 392,
          width: 1120,
          height: 113,
          clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
          opacity: logo.o,
          filter: logo.b > 0.2 ? `blur(${logo.b * 0.6}px)` : undefined,
        }}
      >
        <Img src={staticFile("svj-logo-white.png")} style={{ width: 1120, height: 113 }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 560,
          width: "100%",
          textAlign: "center",
          fontFamily: michroma,
          fontSize: 34,
          letterSpacing: "0.3em",
          color: svj.blue200,
          opacity: sub.o,
          filter: sub.b > 0.2 ? `blur(${sub.b}px)` : undefined,
          transform: `translateY(${sub.dy}px)`,
          paddingLeft: "0.3em",
        }}
      >
        COMPETITOR ANALYSIS
      </div>
    </AbsoluteFill>
  );
};

// Tatami seams: the competition-mat grid, drifting slowly behind everything.
const Tatami: React.FC<{ t: number }> = ({ t }) => {
  const size = 160;
  const dx = (t * 14) % size;
  const dy = (t * 6) % (size * 2);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.045) 2px, transparent 2px)`,
        backgroundSize: `${size}px ${size * 2}px, ${size * 2}px ${size}px`,
        backgroundPosition: `${-dx}px ${-dy}px, ${-dx}px ${-dy}px`,
        maskImage: "radial-gradient(70% 70% at 50% 50%, black, transparent)",
      }}
    />
  );
};

const PILL_FONT = `600 ${PILL_FONT_PX}px ${archivo}`;

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const widths = useTextWidths(
    PILL_LABELS.map(([, l]) => l),
    PILL_FONT,
    PILL_LS,
  );
  return (
    <AbsoluteFill style={{ background: svj.navyField, overflow: "hidden" }}>
      <Tatami t={t} />
      <Hook t={t} />
      <Captions t={t} />
      {widths && <Pill t={t} widths={widths} />}
<TheShape t={t} />
      <EndCard t={t} />
      <Cursors t={t} />
      <Audio src={staticFile("audio/mix.wav")} />
    </AbsoluteFill>
  );
};
