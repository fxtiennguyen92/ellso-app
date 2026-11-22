/* eslint-disable */
// TỰ SINH bởi scripts/gen-mascots.py từ assets/mascots/*.svg — đừng sửa tay.
import type { ReactElement } from 'react';
import { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

export type MascotName = 'tho' | 'mam' | 'tia' | 'cuMinh' | 'so';

/** Một lớp vẽ (canvas 400 × 440). `p` = tiền tố id gradient / clipPath của lần vẽ này. */
export type MascotLayer = { key: string; render: (p: string) => ReactElement };

export const MASCOT_ART: Record<MascotName, MascotLayer[]> = {
  tho: [
    {
      key: 'shadow',
      render: (p) => (
        <>
        <Ellipse cx="200" cy="414" rx="118" ry="15" fill="#0F172A" opacity="0.12" />
        </>
      ),
    },
    {
      key: 's0',
      render: (p) => (
        <>
        <Defs>
          <ClipPath id={`${p}r-body`}>
            <Ellipse cx="200" cy="352" rx="80" ry="52" />
          </ClipPath>
          <RadialGradient id={`${p}r-sh`} cx="0.75" cy="0.95" r="0.85">
            <Stop offset="0.15" stopColor="#047857" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#047857" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="284" cy="370" r="20" fill="#FFFFFF" stroke="#10B981" strokeOpacity="0.35" strokeWidth="3" />
        <Ellipse cx="158" cy="400" rx="34" ry="16" fill="#FFFFFF" stroke="#10B981" strokeOpacity="0.35" strokeWidth="3" />
        <Ellipse cx="242" cy="400" rx="34" ry="16" fill="#FFFFFF" stroke="#10B981" strokeOpacity="0.35" strokeWidth="3" />
        <Ellipse cx="200" cy="352" rx="80" ry="52" fill="#FFFFFF" stroke="#10B981" strokeOpacity="0.35" strokeWidth="3" />
        <G clipPath={`url(#${p}r-body)`}>
          <Rect x="110" y="296" width="180" height="110" fill={`url(#${p}r-sh)`} />
        </G>
        </>
      ),
    },
    {
      key: 'ear-l',
      render: (p) => (
        <>
        <Defs>
          <RadialGradient id={`${p}r-ear`} cx="0.7" cy="0.9" r="0.9">
            <Stop offset="0.1" stopColor="#047857" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#047857" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <G transform="rotate(-12 150 110)">
          <Ellipse cx="150" cy="110" rx="32" ry="82" fill="#FFFFFF" stroke="#10B981" strokeOpacity="0.35" strokeWidth="3" />
          <Ellipse cx="150" cy="110" rx="32" ry="82" fill={`url(#${p}r-ear)`} />
          <Ellipse cx="150" cy="116" rx="15" ry="58" fill="#34D399" opacity="0.7" />
        </G>
        </>
      ),
    },
    {
      key: 'ear-r',
      render: (p) => (
        <>
        <Defs>
          <RadialGradient id={`${p}r-ear`} cx="0.7" cy="0.9" r="0.9">
            <Stop offset="0.1" stopColor="#047857" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#047857" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <G transform="rotate(16 254 116)">
          <Ellipse cx="254" cy="116" rx="32" ry="80" fill="#FFFFFF" stroke="#10B981" strokeOpacity="0.35" strokeWidth="3" />
          <Ellipse cx="254" cy="116" rx="32" ry="80" fill={`url(#${p}r-ear)`} />
          <Ellipse cx="254" cy="122" rx="15" ry="56" fill="#34D399" opacity="0.7" />
        </G>
        </>
      ),
    },
    {
      key: 's1',
      render: (p) => (
        <>
        <Defs>
          <ClipPath id={`${p}r-head`}>
            <Ellipse cx="200" cy="238" rx="128" ry="104" />
          </ClipPath>
          <RadialGradient id={`${p}r-sh`} cx="0.75" cy="0.95" r="0.85">
            <Stop offset="0.15" stopColor="#047857" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#047857" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="200" cy="238" rx="128" ry="104" fill="#FFFFFF" stroke="#10B981" strokeOpacity="0.35" strokeWidth="3" />
        <G clipPath={`url(#${p}r-head)`}>
          <Rect x="70" y="130" width="260" height="215" fill={`url(#${p}r-sh)`} />
          <Ellipse cx="160" cy="140" rx="40" ry="16" fill="#047857" opacity="0.08" />
          <Ellipse cx="250" cy="140" rx="40" ry="16" fill="#047857" opacity="0.08" />
        </G>
        <Path d="M128 322 Q200 354 272 322 L268 342 Q200 372 132 342 Z" fill="#047857" />
        <Path d="M150 330 Q200 350 250 330" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.25" />
        <Path d="M232 340 L262 388 L240 384 L216 346 Z" fill="#065F46" />
        <Circle cx="150" cy="362" r="20" fill="#FFFFFF" stroke="#10B981" strokeOpacity="0.35" strokeWidth="3" />
        <Circle cx="250" cy="362" r="20" fill="#FFFFFF" stroke="#10B981" strokeOpacity="0.35" strokeWidth="3" />
        <Ellipse cx="122" cy="278" rx="20" ry="11" fill="#F59E0B" opacity="0.35" />
        <Ellipse cx="278" cy="278" rx="20" ry="11" fill="#F59E0B" opacity="0.35" />
        </>
      ),
    },
    {
      key: 'eye-open-l',
      render: (p) => (
        <>
        <Ellipse cx="160" cy="242" rx="16" ry="20" fill="#0F172A" />
        <Circle cx="154" cy="233" r="6" fill="#FFFFFF" />
        <Circle cx="166" cy="250" r="3" fill="#FFFFFF" opacity="0.8" />
        </>
      ),
    },
    {
      key: 'eye-closed-l',
      render: (p) => (
        <>
        <Path d="M143 247 Q160 226 177 247" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'eye-open-r',
      render: (p) => (
        <>
        <Ellipse cx="240" cy="242" rx="16" ry="20" fill="#0F172A" />
        <Circle cx="234" cy="233" r="6" fill="#FFFFFF" />
        <Circle cx="246" cy="250" r="3" fill="#FFFFFF" opacity="0.8" />
        </>
      ),
    },
    {
      key: 'eye-closed-r',
      render: (p) => (
        <>
        <Path d="M223 247 Q240 226 257 247" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 's2',
      render: (p) => (
        <>
        <Ellipse cx="200" cy="268" rx="9" ry="6.5" fill="#F59E0B" />
        </>
      ),
    },
    {
      key: 'mouth-smile',
      render: (p) => (
        <>
        <Path d="M186 280 Q193 289 200 280 Q207 289 214 280" stroke="#0F172A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      ),
    },
    {
      key: 'mouth-grin',
      render: (p) => (
        <>
        <Path d="M184 278 Q200 306 216 278 Z" fill="#0F172A" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round" />
        <Rect x="194" y="278" width="12" height="9" rx="2" fill="#FFFFFF" />
        </>
      ),
    },
  ],
  mam: [
    {
      key: 'shadow',
      render: (p) => (
        <>
        <Ellipse cx="200" cy="410" rx="124" ry="16" fill="#0F172A" opacity="0.12" />
        </>
      ),
    },
    {
      key: 's0',
      render: (p) => (
        <>
        <Ellipse cx="152" cy="390" rx="36" ry="20" fill="#047857" />
        <Ellipse cx="248" cy="390" rx="36" ry="20" fill="#047857" />
        <Ellipse cx="144" cy="383" rx="14" ry="6" fill="#FFFFFF" opacity="0.25" />
        <Ellipse cx="240" cy="383" rx="14" ry="6" fill="#FFFFFF" opacity="0.25" />
        <Ellipse cx="72" cy="292" rx="26" ry="40" fill="#047857" transform="rotate(22 72 292)" />
        </>
      ),
    },
    {
      key: 'arm-r',
      render: (p) => (
        <>
        <Ellipse cx="332" cy="250" rx="26" ry="40" fill="#047857" transform="rotate(-40 332 250)" />
        <Ellipse cx="324" cy="242" rx="10" ry="16" fill="#FFFFFF" opacity="0.2" transform="rotate(-40 324 242)" />
        </>
      ),
    },
    {
      key: 's1',
      render: (p) => (
        <>
        <Path d="M200 146 C197 126 203 112 200 96" stroke="#047857" strokeWidth="9" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'leaves',
      render: (p) => (
        <>
        <Defs>
          <LinearGradient id={`${p}m-leaf`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#6EE7B7" />
            <Stop offset="1" stopColor="#10B981" />
          </LinearGradient>
        </Defs>
        <Path d="M199 100 C178 62 128 58 104 78 C124 108 172 116 199 100 Z" fill={`url(#${p}m-leaf)`} />
        <Path d="M196 99 C170 90 140 82 116 79" stroke="#047857" strokeWidth="3" strokeLinecap="round" opacity="0.45" fill="none" />
        <Path d="M201 98 C214 58 262 40 292 54 C280 88 236 106 201 98 Z" fill={`url(#${p}m-leaf)`} />
        <Path d="M204 97 C230 86 258 70 282 58" stroke="#047857" strokeWidth="3" strokeLinecap="round" opacity="0.45" fill="none" />
        </>
      ),
    },
    {
      key: 's2',
      render: (p) => (
        <>
        <Defs>
          <ClipPath id={`${p}m-clip`}>
            <Ellipse cx="200" cy="268" rx="138" ry="128" />
          </ClipPath>
          <RadialGradient id={`${p}m-hi`} cx="0.3" cy="0.26" r="0.55">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`${p}m-sh`} cx="0.75" cy="0.95" r="0.8">
            <Stop offset="0.2" stopColor="#0F172A" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#0F172A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="200" cy="268" rx="138" ry="128" fill="#10B981" />
        <G clipPath={`url(#${p}m-clip)`}>
          <Rect x="50" y="130" width="300" height="270" fill={`url(#${p}m-sh)`} />
          <Rect x="50" y="130" width="300" height="270" fill={`url(#${p}m-hi)`} />
          <Ellipse cx="200" cy="352" rx="78" ry="44" fill="#ECFDF5" opacity="0.85" />
        </G>
        <Ellipse cx="128" cy="192" rx="34" ry="17" fill="#FFFFFF" opacity="0.5" transform="rotate(-35 128 192)" />
        <Circle cx="164" cy="166" r="6" fill="#FFFFFF" opacity="0.6" />
        <Ellipse cx="122" cy="292" rx="20" ry="11" fill="#F59E0B" opacity="0.35" />
        <Ellipse cx="278" cy="292" rx="20" ry="11" fill="#F59E0B" opacity="0.35" />
        </>
      ),
    },
    {
      key: 'eye-open-l',
      render: (p) => (
        <>
        <Ellipse cx="156" cy="256" rx="17" ry="21" fill="#0F172A" />
        <Circle cx="150" cy="247" r="6.5" fill="#FFFFFF" />
        <Circle cx="162" cy="264" r="3" fill="#FFFFFF" opacity="0.8" />
        </>
      ),
    },
    {
      key: 'eye-closed-l',
      render: (p) => (
        <>
        <Path d="M138 262 Q156 240 174 262" stroke="#0F172A" strokeWidth="6.5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'eye-open-r',
      render: (p) => (
        <>
        <Ellipse cx="244" cy="256" rx="17" ry="21" fill="#0F172A" />
        <Circle cx="238" cy="247" r="6.5" fill="#FFFFFF" />
        <Circle cx="250" cy="264" r="3" fill="#FFFFFF" opacity="0.8" />
        </>
      ),
    },
    {
      key: 'eye-closed-r',
      render: (p) => (
        <>
        <Path d="M226 262 Q244 240 262 262" stroke="#0F172A" strokeWidth="6.5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'mouth-smile',
      render: (p) => (
        <>
        <Path d="M186 290 Q200 304 214 290" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'mouth-grin',
      render: (p) => (
        <>
        <Path d="M181 286 Q200 318 219 286 Z" fill="#0F172A" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round" />
        <Path d="M190 302 Q200 294 210 302 Q200 311 190 302 Z" fill="#F59E0B" opacity="0.6" />
        </>
      ),
    },
  ],
  tia: [
    {
      key: 'shadow',
      render: (p) => (
        <>
        <Ellipse cx="200" cy="410" rx="112" ry="15" fill="#0F172A" opacity="0.12" />
        </>
      ),
    },
    {
      key: 'spark-a',
      render: (p) => (
        <>
        <Path d="M92 102 Q92 120 110 120 Q92 120 92 138 Q92 120 74 120 Q92 120 92 102 Z" fill="#34D399" />
        <Path d="M346 163 Q346 172 355 172 Q346 172 346 181 Q346 172 337 172 Q346 172 346 163 Z" fill="#10B981" />
        </>
      ),
    },
    {
      key: 'spark-b',
      render: (p) => (
        <>
        <Path d="M318 82 Q318 96 332 96 Q318 96 318 110 Q318 96 304 96 Q318 96 318 82 Z" fill="#34D399" />
        <Path d="M62 202 Q62 212 72 212 Q62 212 62 222 Q62 212 52 212 Q62 212 62 202 Z" fill="#10B981" />
        </>
      ),
    },
    {
      key: 's0',
      render: (p) => (
        <>
        <Ellipse cx="164" cy="388" rx="30" ry="18" fill="#F59E0B" />
        <Ellipse cx="236" cy="388" rx="30" ry="18" fill="#F59E0B" />
        <Ellipse cx="164" cy="394" rx="30" ry="12" fill="#0F172A" opacity="0.12" />
        <Ellipse cx="236" cy="394" rx="30" ry="12" fill="#0F172A" opacity="0.12" />
        <Ellipse cx="92" cy="298" rx="20" ry="32" fill="#F59E0B" transform="rotate(30 92 298)" />
        </>
      ),
    },
    {
      key: 'arm-r',
      render: (p) => (
        <>
        <Ellipse cx="318" cy="226" rx="20" ry="32" fill="#FBBF24" transform="rotate(-40 318 226)" />
        </>
      ),
    },
    {
      key: 's1',
      render: (p) => (
        <>
        <Defs>
          <ClipPath id={`${p}t-clip`}>
            <Path d="M200 64 C214 104 250 120 280 160 C308 198 314 236 312 268 C308 334 262 382 200 382 C138 382 92 334 88 268 C86 226 104 190 128 164 C134 196 150 210 166 206 C156 160 172 104 200 64 Z" />
          </ClipPath>
          <RadialGradient id={`${p}t-hi`} cx="0.32" cy="0.3" r="0.55">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.65" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`${p}t-sh`} cx="0.78" cy="0.95" r="0.8">
            <Stop offset="0.2" stopColor="#0F172A" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#0F172A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Path d="M200 64 C214 104 250 120 280 160 C308 198 314 236 312 268 C308 334 262 382 200 382 C138 382 92 334 88 268 C86 226 104 190 128 164 C134 196 150 210 166 206 C156 160 172 104 200 64 Z" fill="#F59E0B" />
        <G clipPath={`url(#${p}t-clip)`}>
          <Rect x="80" y="60" width="240" height="330" fill={`url(#${p}t-sh)`} />
          <Rect x="80" y="60" width="240" height="330" fill={`url(#${p}t-hi)`} />
          <Path d="M200 196 C232 224 262 252 258 294 C254 336 230 362 200 362 C170 362 146 336 142 294 C140 254 170 224 200 196 Z" fill="#FFFFFF" opacity="0.35" />
        </G>
        <Ellipse cx="150" cy="170" rx="22" ry="12" fill="#FFFFFF" opacity="0.55" transform="rotate(-55 150 170)" />
        <Circle cx="184" cy="118" r="5" fill="#FFFFFF" opacity="0.6" />
        <Ellipse cx="140" cy="316" rx="15" ry="9" fill="#FFFFFF" opacity="0.5" />
        <Ellipse cx="260" cy="316" rx="15" ry="9" fill="#FFFFFF" opacity="0.5" />
        </>
      ),
    },
    {
      key: 'eye-open-l',
      render: (p) => (
        <>
        <Ellipse cx="172" cy="286" rx="13" ry="17" fill="#0F172A" />
        <Circle cx="167" cy="278" r="5" fill="#FFFFFF" />
        <Circle cx="177" cy="293" r="2.5" fill="#FFFFFF" opacity="0.8" />
        </>
      ),
    },
    {
      key: 'eye-closed-l',
      render: (p) => (
        <>
        <Path d="M158 290 Q172 272 186 290" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'eye-open-r',
      render: (p) => (
        <>
        <Ellipse cx="228" cy="286" rx="13" ry="17" fill="#0F172A" />
        <Circle cx="223" cy="278" r="5" fill="#FFFFFF" />
        <Circle cx="233" cy="293" r="2.5" fill="#FFFFFF" opacity="0.8" />
        </>
      ),
    },
    {
      key: 'eye-closed-r',
      render: (p) => (
        <>
        <Path d="M214 290 Q228 272 242 290" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'mouth-smile',
      render: (p) => (
        <>
        <Path d="M189 314 Q200 325 211 314" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'mouth-grin',
      render: (p) => (
        <>
        <Path d="M185 310 Q200 336 215 310 Z" fill="#0F172A" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round" />
        </>
      ),
    },
  ],
  cuMinh: [
    {
      key: 'shadow',
      render: (p) => (
        <>
        <Ellipse cx="200" cy="412" rx="124" ry="16" fill="#0F172A" opacity="0.12" />
        </>
      ),
    },
    {
      key: 's0',
      render: (p) => (
        <>
        <Ellipse cx="78" cy="286" rx="30" ry="62" fill="#065F46" transform="rotate(18 78 286)" />
        </>
      ),
    },
    {
      key: 'wing-r',
      render: (p) => (
        <>
        <Ellipse cx="322" cy="286" rx="30" ry="62" fill="#065F46" transform="rotate(-18 322 286)" />
        </>
      ),
    },
    {
      key: 's1',
      render: (p) => (
        <>
        <Defs>
          <ClipPath id={`${p}c-clip`}>
            <Path d="M200 96 C292 96 334 152 334 238 C334 334 282 392 200 392 C118 392 66 334 66 238 C66 152 108 96 200 96 Z" />
          </ClipPath>
          <RadialGradient id={`${p}c-hi`} cx="0.3" cy="0.24" r="0.55">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`${p}c-sh`} cx="0.75" cy="0.95" r="0.8">
            <Stop offset="0.2" stopColor="#0F172A" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#0F172A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Path d="M200 96 C292 96 334 152 334 238 C334 334 282 392 200 392 C118 392 66 334 66 238 C66 152 108 96 200 96 Z" fill="#047857" />
        <G clipPath={`url(#${p}c-clip)`}>
          <Rect x="60" y="90" width="280" height="310" fill={`url(#${p}c-sh)`} />
          <Rect x="60" y="90" width="280" height="310" fill={`url(#${p}c-hi)`} />
          <Ellipse cx="200" cy="334" rx="80" ry="58" fill="#34D399" opacity="0.55" />
        </G>
        <Path d="M168 318 Q180 328 192 318" stroke="#047857" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
        <Path d="M208 318 Q220 328 232 318" stroke="#047857" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
        <Path d="M188 342 Q200 352 212 342" stroke="#047857" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
        <Ellipse cx="170" cy="394" rx="22" ry="11" fill="#F59E0B" />
        <Ellipse cx="230" cy="394" rx="22" ry="11" fill="#F59E0B" />
        <Circle cx="156" cy="222" r="60" fill="#ECFDF5" />
        <Circle cx="244" cy="222" r="60" fill="#ECFDF5" />
        <Ellipse cx="118" cy="262" rx="14" ry="8" fill="#F59E0B" opacity="0.4" />
        <Ellipse cx="282" cy="262" rx="14" ry="8" fill="#F59E0B" opacity="0.4" />
        </>
      ),
    },
    {
      key: 'eye-open-l',
      render: (p) => (
        <>
        <Circle cx="156" cy="222" r="22" fill="#0F172A" />
        <Circle cx="148" cy="213" r="7" fill="#FFFFFF" />
        <Circle cx="164" cy="230" r="3" fill="#FFFFFF" opacity="0.8" />
        </>
      ),
    },
    {
      key: 'eye-closed-l',
      render: (p) => (
        <>
        <Path d="M136 228 Q156 206 176 228" stroke="#0F172A" strokeWidth="6.5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'eye-open-r',
      render: (p) => (
        <>
        <Circle cx="244" cy="222" r="22" fill="#0F172A" />
        <Circle cx="236" cy="213" r="7" fill="#FFFFFF" />
        <Circle cx="252" cy="230" r="3" fill="#FFFFFF" opacity="0.8" />
        </>
      ),
    },
    {
      key: 'eye-closed-r',
      render: (p) => (
        <>
        <Path d="M224 228 Q244 206 264 228" stroke="#0F172A" strokeWidth="6.5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 's2',
      render: (p) => (
        <>
        <Circle cx="156" cy="222" r="38" stroke="#0F172A" strokeWidth="6" fill="none" />
        <Circle cx="244" cy="222" r="38" stroke="#0F172A" strokeWidth="6" fill="none" />
        <Path d="M194 216 Q200 208 206 216" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <Path d="M138 200 Q146 194 154 196" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
        <Path d="M226 200 Q234 194 242 196" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
        <Path d="M188 258 L212 258 L200 280 Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="4" strokeLinejoin="round" />
        <Path d="M148 110 L148 134 Q200 154 252 134 L252 110 Z" fill="#1E293B" />
        <Path d="M112 108 L200 72 L288 108 L200 144 Z" fill="#0F172A" />
        <Path d="M150 98 L200 78 L232 91" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.25" />
        <Circle cx="200" cy="108" r="6" fill="#F59E0B" />
        </>
      ),
    },
    {
      key: 'tassel',
      render: (p) => (
        <>
        <Path d="M200 108 L272 120 L272 150" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Ellipse cx="272" cy="158" rx="7" ry="10" fill="#F59E0B" />
        </>
      ),
    },
  ],
  so: [
    {
      key: 'shadow',
      render: (p) => (
        <>
        <Ellipse cx="204" cy="412" rx="122" ry="15" fill="#0F172A" opacity="0.12" />
        </>
      ),
    },
    {
      key: 's0',
      render: (p) => (
        <>
        <Path d="M164 360 L164 388" stroke="#5B21B6" strokeWidth="10" strokeLinecap="round" />
        <Path d="M236 360 L236 388" stroke="#5B21B6" strokeWidth="10" strokeLinecap="round" />
        <Ellipse cx="158" cy="394" rx="20" ry="10" fill="#5B21B6" />
        <Ellipse cx="242" cy="394" rx="20" ry="10" fill="#5B21B6" />
        <Path d="M276 110 L318 132 L318 374 L276 366 Z" fill="#F5F3FF" />
        <Path d="M303 130 L303 368" stroke="#A78BFA" strokeWidth="2" opacity="0.6" />
        <Path d="M310 134 L310 370" stroke="#A78BFA" strokeWidth="2" opacity="0.6" />
        </>
      ),
    },
    {
      key: 'bookmark',
      render: (p) => (
        <>
        <Path d="M244 108 L244 66 L256 76 L268 66 L268 108 Z" fill="#A78BFA" />
        </>
      ),
    },
    {
      key: 's1',
      render: (p) => (
        <>
        <Path d="M98 250 Q70 264 64 292" stroke="#6D28D9" strokeWidth="10" strokeLinecap="round" fill="none" />
        <Circle cx="63" cy="300" r="13" fill="#F5F3FF" stroke="#6D28D9" strokeWidth="4" />
        </>
      ),
    },
    {
      key: 'arm-r',
      render: (p) => (
        <>
        <Path d="M294 236 Q328 220 334 190" stroke="#6D28D9" strokeWidth="10" strokeLinecap="round" fill="none" />
        <Circle cx="336" cy="180" r="13" fill="#F5F3FF" stroke="#6D28D9" strokeWidth="4" />
        </>
      ),
    },
    {
      key: 's2',
      render: (p) => (
        <>
        <Defs>
          <ClipPath id={`${p}s-clip`}>
            <Rect x="96" y="100" width="200" height="268" rx="24" />
          </ClipPath>
          <RadialGradient id={`${p}s-hi`} cx="0.3" cy="0.22" r="0.6">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`${p}s-sh`} cx="0.8" cy="0.98" r="0.8">
            <Stop offset="0.2" stopColor="#0F172A" stopOpacity="0.26" />
            <Stop offset="1" stopColor="#0F172A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="96" y="100" width="200" height="268" rx="24" fill="#8B5CF6" />
        <G clipPath={`url(#${p}s-clip)`}>
          <Rect x="96" y="100" width="34" height="268" fill="#6D28D9" opacity="0.6" />
          <Rect x="96" y="138" width="34" height="8" fill="#5B21B6" opacity="0.5" />
          <Rect x="96" y="322" width="34" height="8" fill="#5B21B6" opacity="0.5" />
          <Rect x="96" y="100" width="200" height="268" fill={`url(#${p}s-sh)`} />
          <Rect x="96" y="100" width="200" height="268" fill={`url(#${p}s-hi)`} />
        </G>
        <Ellipse cx="168" cy="116" rx="24" ry="7" fill="#FFFFFF" opacity="0.4" />
        <Rect x="156" y="132" width="112" height="44" rx="10" fill="#F5F3FF" />
        <Rect x="170" y="146" width="70" height="6" rx="3" fill="#8B5CF6" />
        <Rect x="170" y="158" width="46" height="6" rx="3" fill="#A78BFA" />
        <Ellipse cx="164" cy="268" rx="16" ry="9" fill="#F59E0B" opacity="0.35" />
        <Ellipse cx="262" cy="268" rx="16" ry="9" fill="#F59E0B" opacity="0.35" />
        </>
      ),
    },
    {
      key: 'eye-open-l',
      render: (p) => (
        <>
        <Ellipse cx="186" cy="238" rx="13" ry="17" fill="#0F172A" />
        <Circle cx="181" cy="230" r="5" fill="#FFFFFF" />
        <Circle cx="191" cy="245" r="2.5" fill="#FFFFFF" opacity="0.8" />
        </>
      ),
    },
    {
      key: 'eye-closed-l',
      render: (p) => (
        <>
        <Path d="M172 242 Q186 224 200 242" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'eye-open-r',
      render: (p) => (
        <>
        <Ellipse cx="240" cy="238" rx="13" ry="17" fill="#0F172A" />
        <Circle cx="235" cy="230" r="5" fill="#FFFFFF" />
        <Circle cx="245" cy="245" r="2.5" fill="#FFFFFF" opacity="0.8" />
        </>
      ),
    },
    {
      key: 'eye-closed-r',
      render: (p) => (
        <>
        <Path d="M226 242 Q240 224 254 242" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'mouth-smile',
      render: (p) => (
        <>
        <Path d="M202 264 Q213 276 224 264" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      ),
    },
    {
      key: 'mouth-grin',
      render: (p) => (
        <>
        <Path d="M198 260 Q213 286 228 260 Z" fill="#0F172A" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round" />
        </>
      ),
    },
  ],
};
