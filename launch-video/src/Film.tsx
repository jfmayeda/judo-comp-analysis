import type { ReactNode } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CAM, SNAP, clamp, press, stepR, track, vis } from "./motion";
import {
  CaptureScreen,
  EndCard,
  HookCard,
  IntelScreen,
  PrintScreen,
  ProfileScreen,
  RosterScreen,
  TodayScreen,
} from "./screens";
import { C, F, HOOK, PHONE, RECT, WIDE, rectCenter } from "./theme";

const CURSOR: { w: number; z: number } = { w: 11, z: 0.88 };
const PHONE_PAN = 560;
const PHONE_ZOOM = 1.02;

type Vis = { opacity: number; blur: number; dy: number };

function Stage({
  v,
  cardW,
  cardH,
  design,
  children,
}: {
  v: Vis;
  cardW: number;
  cardH: number;
  design: { w: number; h: number };
  children: ReactNode;
}) {
  if (v.opacity < 0.015) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: v.opacity,
        filter: v.blur > 0.25 ? `blur(${v.blur}px)` : undefined,
        transform: `translateY(${v.dy}px)`,
      }}
    >
      <div
        style={{
          width: design.w,
          height: design.h,
          transform: `scale(${cardW / design.w}, ${cardH / design.h})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function screenOf(
  px: number,
  py: number,
  cardW: number,
  cardH: number,
  zoom: number,
  panX: number,
  panY: number,
) {
  return {
    x: 960 + panX + (px - cardW / 2) * zoom,
    y: 540 + panY + (py - cardH / 2) * zoom,
  };
}

export function Film() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cardW = track(1040, [
    { t: 0.04, v: HOOK.w, sp: SNAP },
    { t: 3.25, v: PHONE.w, sp: SNAP },
    { t: 17.25, v: WIDE.w, sp: SNAP },
    { t: 28.0, v: 1920, sp: { w: 12, z: 0.94 } },
  ], t);
  const cardH = track(460, [
    { t: 0.04, v: HOOK.h, sp: SNAP },
    { t: 3.25, v: PHONE.h, sp: SNAP },
    { t: 17.25, v: WIDE.h, sp: SNAP },
    { t: 28.0, v: 1080, sp: { w: 12, z: 0.94 } },
  ], t);
  const radius = track(8, [{ t: 28.0, v: 0, sp: CAM }], t);
  const panX = track(0, [
    { t: 3.25, v: PHONE_PAN, sp: CAM },
    { t: 17.25, v: 0, sp: CAM },
  ], t);
  const panY = track(0, [], t);
  const zoom = track(1, [
    { t: 3.4, v: PHONE_ZOOM, sp: CAM },
    { t: 17.2, v: 1, sp: CAM },
  ], t);
  const navy = clamp(stepR(t - 27.7, { w: 28, z: 1 }));
  const shadow = 1 - navy;

  const hookV = vis(t, 0.08, 3.18);
  const profileV = vis(t, 3.28, 8.02);
  const captureV = vis(t, 8.08, 13.32);
  const intelV = vis(t, 13.4, 17.16);
  const rosterV = vis(t, 17.22, 21.02);
  const todayV = vis(t, 21.1, 24.72);
  const printV = vis(t, 24.8, 28.02, 0.16);
  const endV = vis(t, 28.0, null);

  const qc = screenOf(rectCenter(RECT.qc)[0], rectCenter(RECT.qc)[1], PHONE.w, PHONE.h, PHONE_ZOOM, PHONE_PAN, 0);
  const win = screenOf(rectCenter(RECT.win)[0], rectCenter(RECT.win)[1], PHONE.w, PHONE.h, PHONE_ZOOM, PHONE_PAN, 0);
  const ippon = screenOf(rectCenter(RECT.ippon)[0], rectCenter(RECT.ippon)[1], PHONE.w, PHONE.h, PHONE_ZOOM, PHONE_PAN, 0);
  const save = screenOf(rectCenter(RECT.save)[0], rectCenter(RECT.save)[1], PHONE.w, PHONE.h, PHONE_ZOOM, PHONE_PAN, 0);
  const todayNav = screenOf(rectCenter(RECT.todayNav)[0], rectCenter(RECT.todayNav)[1], WIDE.w, WIDE.h, 1, 0, 0);
  const printPack = screenOf(rectCenter(RECT.printPack)[0], rectCenter(RECT.printPack)[1], WIDE.w, WIDE.h, 1, 0, 0);
  const note = screenOf(250, 210, PHONE.w, PHONE.h, PHONE_ZOOM, PHONE_PAN, 0);
  const read = screenOf(180, 96, WIDE.w, WIDE.h, 1, 0, 0);
  const hookPt = screenOf(420, 200, HOOK.w, HOOK.h, 1, 0, 0);
  const cursorEventsX = [
    { t: 2.15, v: hookPt.x, sp: CURSOR },
    { t: 4.15, v: qc.x, sp: CURSOR },
    { t: 8.4, v: win.x, sp: CURSOR },
    { t: 9.35, v: ippon.x, sp: CURSOR },
    { t: 10.5, v: save.x, sp: CURSOR },
    { t: 13.7, v: note.x, sp: CURSOR },
    { t: 18.35, v: todayNav.x, sp: CURSOR },
    { t: 23.15, v: printPack.x, sp: CURSOR },
    { t: 25.35, v: read.x, sp: CURSOR },
    { t: 28.15, v: 960, sp: CAM },
  ];
  const cursorEventsY = [
    { t: 2.15, v: hookPt.y, sp: CURSOR },
    { t: 4.15, v: qc.y, sp: CURSOR },
    { t: 8.4, v: win.y, sp: CURSOR },
    { t: 9.35, v: ippon.y, sp: CURSOR },
    { t: 10.5, v: save.y, sp: CURSOR },
    { t: 13.7, v: note.y, sp: CURSOR },
    { t: 18.35, v: todayNav.y, sp: CURSOR },
    { t: 23.15, v: printPack.y, sp: CURSOR },
    { t: 25.35, v: read.y, sp: CURSOR },
    { t: 28.15, v: 540, sp: CAM },
  ];

  const cursorX = track(640, cursorEventsX, t);
  const cursorY = track(860, cursorEventsY, t);
  const prevX = track(640, cursorEventsX, t - 0.016);
  const prevY = track(860, cursorEventsY, t - 0.016);
  const vx = (cursorX - prevX) / 0.016;
  const vy = (cursorY - prevY) / 0.016;
  const lean = clamp(-vx * 0.0035, -12, 12);
  const cursorIn = stepR(t - 1.45, { w: 18, z: 1 });
  const cursorOut = 1 - clamp((t - 27.85) / 0.28);
  const cursorOpacity = cursorIn * cursorOut;
  const clickTimes = [3.05, 7.9, 8.95, 9.9, 11.25, 20.9, 24.55];
  const pressAmt = clickTimes.reduce((acc, tc) => acc + press(t, tc), 0);

  const glowX = 50 + Math.sin(t * 0.33) * 6 + (panX / 1920) * 18;
  const glowY = 48 + Math.cos(t * 0.27) * 4;

  const phrases = [
    { t0: 3.32, t1: 8.02, k: "Matside", h: "Maya H.", s: "Blue belt · Mat 1 · 9:00" },
    { t0: 8.12, t1: 9.82, k: "Four taps", h: "Win.", s: "Result first. Save stays on screen." },
    { t0: 9.9, t1: 11.18, k: "Four taps", h: "Ippon.", s: "Score it in the order it happened." },
    { t0: 11.26, t1: 13.38, k: "Four taps", h: "Saved.", s: "Win · 1. Ippon" },
    { t0: 13.48, t1: 17.12, k: "Private", h: "Elena K.", s: "First name and last initial. No photos." },
  ];

  const wideLine =
    t >= 17.35 && t < 21.1
      ? "One roster. Every coach."
      : t >= 21.2 && t < 24.8
        ? "Bay Area Open. Print the pack."
        : t >= 24.9 && t < 28.05
          ? "One page. It works offline."
          : null;

  return (
    <AbsoluteFill style={{ background: C.navy, fontFamily: F.body, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 130% at ${glowX}% ${glowY}%, ${C.navy700}, ${C.navy800} 46%, ${C.navy})`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.045) 0.7px, transparent 0.7px)",
          backgroundSize: "3px 3px",
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "960px 540px",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: (1920 - cardW) / 2,
            top: (1080 - cardH) / 2,
            width: cardW,
            height: cardH,
            borderRadius: radius,
            background: mix(C.white, C.navy, navy),
            border: `${2 * shadow}px solid ${C.navy}`,
            boxShadow: shadow > 0.05 ? `${4 * shadow}px ${4 * shadow}px 0 rgba(11,30,46,${shadow})` : "none",
            overflow: "hidden",
          }}
        >
          <Stage v={hookV} cardW={cardW} cardH={cardH} design={HOOK}><HookCard /></Stage>
          <Stage v={profileV} cardW={cardW} cardH={cardH} design={PHONE}><ProfileScreen /></Stage>
          <Stage v={captureV} cardW={cardW} cardH={cardH} design={PHONE}><CaptureScreen t={t} /></Stage>
          <Stage v={intelV} cardW={cardW} cardH={cardH} design={PHONE}><IntelScreen /></Stage>
          <Stage v={rosterV} cardW={cardW} cardH={cardH} design={WIDE}><RosterScreen /></Stage>
          <Stage v={todayV} cardW={cardW} cardH={cardH} design={WIDE}><TodayScreen t={t} /></Stage>
          <Stage v={printV} cardW={cardW} cardH={cardH} design={WIDE}><PrintScreen /></Stage>
          <Stage v={endV} cardW={cardW} cardH={cardH} design={{ w: 1920, h: 1080 }}><EndCard t={t} /></Stage>
        </div>
      </div>

      {phrases.map((phrase) => {
        const v = vis(t, phrase.t0, phrase.t1);
        if (v.opacity < 0.02) return null;
        return (
          <div
            key={phrase.t0}
            style={{
              position: "absolute",
              left: 88,
              top: 280,
              width: 1080,
              opacity: v.opacity,
              filter: v.blur > 0.3 ? `blur(${v.blur}px)` : undefined,
              transform: `translateY(${v.dy}px)`,
            }}
          >
            <div style={{ width: 64, height: 4, background: C.blue, marginBottom: 18 }} />
            <div style={{ fontFamily: F.head, fontWeight: 600, fontSize: 18, letterSpacing: "0.18em", textTransform: "uppercase", color: C.blue }}>
              {phrase.k}
            </div>
            <div style={{ marginTop: 8, fontFamily: F.head, fontWeight: 700, fontSize: 108, lineHeight: 0.92, letterSpacing: "-0.035em", color: C.white }}>
              {phrase.h}
            </div>
            <div style={{ marginTop: 16, fontFamily: F.body, fontSize: 28, color: "rgba(255,255,255,0.82)", maxWidth: 720 }}>
              {phrase.s}
            </div>
          </div>
        );
      })}

      {wideLine ? (
        <div
          style={{
            position: "absolute",
            left: 64,
            top: 26,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: F.head,
            fontWeight: 700,
            fontSize: 22,
            color: C.white,
          }}
        >
          <span style={{ width: 10, height: 10, background: C.blue }} />
          {wideLine}
        </div>
      ) : null}

      {cursorOpacity > 0.02 ? (
        <Cursor x={cursorX} y={cursorY} lean={lean} opacity={cursorOpacity} pressAmt={pressAmt} vx={vx} vy={vy} t={t} clicks={clickTimes} />
      ) : null}

      <Audio src={staticFile("audio/mix.wav")} />
    </AbsoluteFill>
  );
}

function mix(a: string, b: string, p: number) {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const ca = parse(a);
  const cb = parse(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * p));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function Cursor({
  x,
  y,
  lean,
  opacity,
  pressAmt,
  vx,
  vy,
  t,
  clicks,
}: {
  x: number;
  y: number;
  lean: number;
  opacity: number;
  pressAmt: number;
  vx: number;
  vy: number;
  t: number;
  clicks: number[];
}) {
  const scale = 1 - Math.min(pressAmt, 1) * 0.16;
  const pillX = clamp(-vx * 0.01, -18, 18);
  const pillY = clamp(-vy * 0.01, -10, 10);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, pointerEvents: "none" }}>
      {clicks.map((tc) => {
        const age = t - tc;
        if (age < 0 || age > 0.42) return null;
        const p = age / 0.42;
        return (
          <div
            key={tc}
            style={{
              position: "absolute",
              left: x - 28,
              top: y - 28,
              width: 56,
              height: 56,
              borderRadius: 999,
              border: `2px solid ${C.blue}`,
              opacity: (1 - p) * 0.7 * opacity,
              transform: `scale(${0.3 + p * 1.5})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          opacity,
          transform: `rotate(${lean}deg) scale(${scale})`,
          transformOrigin: "8px 4px",
        }}
      >
        <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
          <path d="M3 2.5 3 24.5 9.2 19.2 14.2 29.2 18.4 27.2 13.4 17.2 22.5 16.2 Z" fill={C.white} stroke={C.navy} strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 22 + pillX,
            top: 22 + pillY,
            background: C.navy,
            color: C.white,
            borderRadius: 999,
            padding: "3px 8px",
            fontFamily: F.head,
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.12em",
            whiteSpace: "nowrap",
          }}
        >
          COACH
        </div>
      </div>
    </div>
  );
}
