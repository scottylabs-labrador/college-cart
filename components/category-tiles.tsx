"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import styles from "./category-tiles.module.css";

import dormFridge from "@/app/assets/landing/cards/dorm-fridge.webp";
import dormBasket from "@/app/assets/landing/cards/dorm-basket.webp";
import dormFan from "@/app/assets/landing/cards/dorm-fan.webp";
import dormClock from "@/app/assets/landing/cards/dorm-clock.webp";
import laptop from "@/app/assets/landing/cards/electronics-laptop.webp";
import monitor from "@/app/assets/landing/cards/electronics-monitor.webp";
import controllerRed from "@/app/assets/landing/cards/electronics-controller-red.webp";
import controllerBlue from "@/app/assets/landing/cards/electronics-controller-blue.webp";
import textbook from "@/app/assets/landing/cards/books-textbook.webp";
import ruler from "@/app/assets/landing/cards/books-ruler.webp";
import calculator from "@/app/assets/landing/cards/books-calculator.webp";
import apple from "@/app/assets/landing/cards/books-apple.webp";
import shirt from "@/app/assets/landing/cards/clothing-shirt.webp";
import jacket from "@/app/assets/landing/cards/clothing-jacket.webp";
import cap from "@/app/assets/landing/cards/clothing-cap.webp";
import sneaker from "@/app/assets/landing/cards/clothing-sneaker.webp";
import campusMap from "@/app/assets/landing/cards/commute-map.webp";
import bike from "@/app/assets/landing/cards/commute-bike.webp";
import lock from "@/app/assets/landing/cards/commute-lock.webp";
import helmet from "@/app/assets/landing/cards/commute-helmet.webp";
import rug from "@/app/assets/landing/cards/furniture-rug.webp";
import lamp from "@/app/assets/landing/cards/furniture-lamp.webp";
import sideTable from "@/app/assets/landing/cards/furniture-side-table.webp";
import sofa from "@/app/assets/landing/cards/furniture-sofa.webp";
import plant from "@/app/assets/landing/cards/furniture-plant.webp";
import balloons from "@/app/assets/landing/cards/freeandfun-balloons.webp";
import discoBall from "@/app/assets/landing/cards/freeandfun-disco-ball.webp";

/**
 * The cards reproduce the Figma file "CollegeCart", frame "MacBook Air - 1".
 * Every position below is in that design's pixels, measured from the top-left
 * corner of the card, so the numbers can be compared with Figma directly.
 */
type Accent = "clock" | "padRed" | "padBlue" | "apple" | "sneaker" | "bike" | "lamp" | "disco";

type Layer =
  | {
      src: StaticImageData;
      /** Box of the picture before any rotation. */
      x: number;
      y: number;
      w: number;
      h: number;
      /** A CSS transform applied about the centre of the box. */
      transform?: string;
      /** How the picture sits inside its box when Figma crops it, in percent of the box. */
      crop?: { left: number; top: number; width: number; height: number };
      /** The motion to play while the card is hovered; see the stylesheet. */
      accent?: Accent;
    }
  | { effect: "glow"; x: number; y: number; w: number }
  | { effect: "glints" };

type Tile = {
  title: string;
  eyebrow: string;
  href: string;
  /** Size of the card in the design. */
  size: [width: number, height: number];
  /** Layers from back to front. */
  layers: Layer[];
};

export const HERO_TILES: Tile[] = [
  {
    title: "Dorm Essentials",
    eyebrow: "Hangers, mini-fridge, fans",
    href: "/c?c=2&n=Appliances",
    size: [378, 255],
    layers: [
      { src: dormFridge, x: -31, y: 91, w: 225, h: 225 },
      { src: dormBasket, x: 117, y: 158, w: 156, h: 156 },
      { src: dormFan, x: 237, y: 83, w: 180, h: 180 },
      { src: dormClock, x: 185, y: 91, w: 92, h: 92, transform: "rotate(10.35deg)", accent: "clock" },
    ],
  },
  {
    title: "Electronics",
    eyebrow: "TVs, laptops, monitors",
    href: "/c?c=4&n=Electronics",
    size: [378, 255],
    layers: [
      { src: laptop, x: -37, y: 82, w: 211, h: 211 },
      { src: monitor, x: 213, y: 40, w: 236, h: 236 },
      { src: controllerRed, x: 100, y: 89, w: 98, h: 98, accent: "padRed" },
      { src: controllerBlue, x: 152, y: 105, w: 139, h: 139, accent: "padBlue" },
    ],
  },
  {
    title: "Books & School",
    eyebrow: "Textbooks, school supplies",
    href: "/c?c=3&n=Study%20Supplies",
    size: [378, 255],
    layers: [
      { src: textbook, x: 202, y: 75, w: 218, h: 218 },
      { src: ruler, x: -7.73, y: 112.32, w: 164.872, h: 164.872, transform: "rotate(11.09deg)" },
      { src: calculator, x: 128, y: 111, w: 182, h: 182 },
      { src: apple, x: 52, y: 128, w: 144, h: 144, accent: "apple" },
    ],
  },
];

export const SMALL_TILES: Tile[] = [
  {
    title: "Clothing",
    eyebrow: "Merch, coats, formal wear",
    href: "/c?c=5&n=Clothing",
    size: [276, 224],
    layers: [
      { src: shirt, x: -25.29, y: 78.71, w: 191.047, h: 191.047, transform: "rotate(-13.54deg)" },
      { src: jacket, x: 127.73, y: 96.73, w: 164.695, h: 164.695, transform: "rotate(9.73deg)" },
      { src: cap, x: 192.09, y: 22.09, w: 78.997, h: 78.997, transform: "rotate(-154.7deg) scaleY(-1)" },
      { src: sneaker, x: 99.6, y: 89.52, w: 92, h: 61, transform: "rotate(9.99deg)", accent: "sneaker" },
    ],
  },
  {
    title: "Commute",
    eyebrow: "Bikes, scooters, accessories",
    href: "/c?c=6&n=Commute",
    size: [276, 224],
    layers: [
      {
        src: campusMap,
        x: -29,
        y: 126,
        w: 338,
        h: 135,
        crop: { left: -0.02, top: -8.61, width: 100, height: 100.12 },
      },
      { src: bike, x: 54, y: 85, w: 253, h: 169, accent: "bike" },
      { src: lock, x: 74.57, y: 87.2, w: 46.89, h: 46.89, transform: "rotate(24.28deg)" },
      { src: helmet, x: 8.04, y: 108.04, w: 69.167, h: 69.167, transform: "rotate(-20.85deg)" },
    ],
  },
  {
    title: "Furniture",
    eyebrow: "Beds, lamps, chairs",
    href: "/c?c=1&n=Furniture",
    size: [276, 224],
    layers: [
      { src: rug, x: -24, y: 155, w: 317.91, h: 105.97 },
      { src: lamp, x: 139.55, y: 13, w: 168.449, h: 168.449, accent: "lamp" },
      { src: sideTable, x: 2.86, y: 130.01, w: 80.816, h: 80.816 },
      { src: sofa, x: 65.83, y: 82.39, w: 212.021, h: 141.348 },
      { src: plant, x: 16, y: 92, w: 54, h: 54 },
      { effect: "glow", x: 150, y: 52, w: 104 },
    ],
  },
  {
    title: "Free & Fun!",
    eyebrow: "Tickets, art, thingamabobs",
    href: "/c?c=7&n=Free%20%26%20Fun",
    size: [267, 224],
    layers: [
      { src: balloons, x: -8, y: 81, w: 184, h: 230 },
      {
        src: discoBall,
        x: 126.82,
        y: 88.82,
        w: 162.847,
        h: 162.847,
        transform: "rotate(14.53deg)",
        accent: "disco",
      },
      { effect: "glints" },
    ],
  },
];

/**
 * Light glinting off the disco ball: a soft bloom, a bright core and thin
 * lens streaks, each fading to nothing. Positions are in the card's pixels.
 */
const GLINTS = [
  { x: 176, y: 132, size: 1, delay: 0, tint: "#ff8fe0" },
  { x: 226, y: 113, size: 0.62, delay: 0.5, tint: "#7ad9ff" },
  { x: 248, y: 160, size: 0.8, delay: 0.25, tint: "#ffd978" },
  { x: 190, y: 190, size: 0.55, delay: 0.8, tint: "#7ad9ff" },
  { x: 214, y: 152, size: 0.45, delay: 1.1, tint: "#ff8fe0" },
];

function DiscoGlints({ size }: { size: Tile["size"] }) {
  return (
    <svg
      viewBox={`0 0 ${size[0]} ${size[1]}`}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full overflow-visible ${styles.glints}`}
    >
      <defs>
        <radialGradient id="glint-bloom">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glint-streak">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {GLINTS.map((g, i) => (
          <radialGradient key={i} id={`glint-halo-${i}`}>
            <stop offset="0" stopColor={g.tint} stopOpacity="0.75" />
            <stop offset="0.45" stopColor={g.tint} stopOpacity="0.3" />
            <stop offset="1" stopColor={g.tint} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {GLINTS.map((g, i) => (
        <g key={i} transform={`translate(${g.x} ${g.y}) scale(${g.size * 1.44})`}>
          <g className={styles.glint} style={{ animationDelay: `${g.delay}s` }}>
            <circle r="15" fill={`url(#glint-halo-${i})`} />
            <circle r="7" fill="url(#glint-bloom)" />
            <ellipse rx="20" ry="0.9" fill="url(#glint-streak)" />
            <ellipse rx="0.9" ry="20" fill="url(#glint-streak)" />
            <ellipse rx="9" ry="0.6" fill="url(#glint-streak)" transform="rotate(45)" opacity="0.75" />
            <ellipse rx="9" ry="0.6" fill="url(#glint-streak)" transform="rotate(-45)" opacity="0.75" />
            <circle r="2" fill="#ffffff" />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** Plays the accent once when the card scrolls into view on touch screens. */
function usePlayOnceInView() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: none)").matches) return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setActive(true);
        timer = window.setTimeout(() => setActive(false), 1600);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return { ref, active };
}

/**
 * One category card.
 *
 * How it resizes: the pictures live on a "stage" that has the proportions of
 * the Figma card and is always as tall as the card, so the composition scales
 * as one piece and never rearranges. A card normally has those same
 * proportions, so the stage fills it exactly and the card's edge crops the
 * pictures where the design does. When a card is wider than the design (the
 * card that takes a whole row on tablets), the stage sits against the right
 * edge under the text and the pictures are free to show past its left side,
 * so nothing looks cut off in the middle of the card.
 *
 * Text sizes come from the width of the whole grid (the cqw units, see
 * CategoryGrid), so every card's title is the same size, as in the design.
 */
function CategoryTile({ tile, hero }: { tile: Tile; hero: boolean }) {
  const { ref, active } = usePlayOnceInView();
  const [width, height] = tile.size;
  const pctX = (px: number) => `${(px / width) * 100}%`;
  const pctY = (px: number) => `${(px / height) * 100}%`;
  // The third large card takes a whole row in the two-column tablet layout.
  const wideOnTablet = tile.title === HERO_TILES[2].title;

  const shape = hero
    ? wideOnTablet
      ? "aspect-[378/255] sm:col-span-2 sm:aspect-[3.04] lg:col-span-4 lg:aspect-[378/255]"
      : "aspect-[378/255] lg:col-span-4"
    : "aspect-[276/224] lg:col-span-3";

  return (
    <Link
      ref={ref}
      href={tile.href}
      data-active={active ? "true" : undefined}
      className={`group relative isolate block overflow-hidden rounded-2xl bg-[#f0ecfa] text-black transition-colors duration-300 hover:bg-[#e9e3f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${styles.tile} ${shape}`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 left-1/2 -translate-x-1/2 ${
          wideOnTablet ? "sm:left-auto sm:right-0 sm:translate-x-0 lg:left-1/2 lg:right-auto lg:-translate-x-1/2" : ""
        }`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {tile.layers.map((layer, i) => {
          if ("effect" in layer) {
            if (layer.effect === "glints") return <DiscoGlints key={i} size={tile.size} />;
            return (
              <div
                key={i}
                className={`absolute aspect-square rounded-full ${styles.glow}`}
                style={{
                  left: pctX(layer.x),
                  top: pctY(layer.y),
                  width: pctX(layer.w),
                  background:
                    "radial-gradient(closest-side, rgba(255, 221, 128, 0.85), rgba(255, 221, 128, 0.35) 55%, rgba(255, 221, 128, 0))",
                }}
              />
            );
          }
          const picture = (
            <Image
              src={layer.src}
              alt=""
              fill
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 25vw"
              loading={hero ? "eager" : "lazy"}
              draggable={false}
              className={`select-none ${layer.crop ? "object-fill" : "object-cover"} ${
                layer.accent ? `${styles.accent} ${styles[layer.accent]}` : ""
              }`}
            />
          );
          return (
            <div
              key={i}
              className={`absolute ${layer.crop ? "overflow-hidden" : ""}`}
              style={{
                left: pctX(layer.x),
                top: pctY(layer.y),
                width: pctX(layer.w),
                height: pctY(layer.h),
                transform: layer.transform,
              }}
            >
              {layer.crop ? (
                <div
                  className="absolute"
                  style={{
                    left: `${layer.crop.left}%`,
                    top: `${layer.crop.top}%`,
                    width: `${layer.crop.width}%`,
                    height: `${layer.crop.height}%`,
                  }}
                >
                  {picture}
                </div>
              ) : (
                picture
              )}
            </div>
          );
        })}
      </div>

      {/* Sizes here are in em, where 1em is the title size (36px in the design). */}
      <div
        className={`relative text-[length:var(--tile-title)] leading-none ${
          hero ? "pl-[0.5em] pt-[0.639em]" : "pl-[0.361em] pt-[0.583em]"
        }`}
      >
        <p className="text-[0.444em] leading-none">{tile.eyebrow}</p>
        <h3 className={`font-semibold leading-none ${hero ? "mt-[0.194em]" : "mt-[0.167em]"}`}>{tile.title}</h3>
        {hero && (
          <span className="absolute right-[2.19em] top-[1.5em] whitespace-nowrap text-[0.444em] leading-none text-[#1668cd] group-hover:underline">
            See more
          </span>
        )}
      </div>
    </Link>
  );
}

/**
 * The grid of category cards. Three large cards over four small ones on
 * desktop, two columns on tablets, one column on phones. Its width is the
 * yardstick for the text and gaps, so they keep the design's proportions.
 */
export function CategoryGrid() {
  return (
    <section className="[container-type:inline-size]">
      <div
        className={
          "grid grid-cols-1 gap-4 [--tile-title:clamp(26px,9.524cqw,40px)] " +
          "sm:grid-cols-2 sm:gap-x-5 sm:gap-y-6 sm:[--tile-title:clamp(24px,calc(4.762cqw-1.2px),40px)] " +
          "lg:grid-cols-12 lg:gap-x-[1.786cqw] lg:gap-y-[3.23cqw] lg:[--tile-title:3.061cqw]"
        }
      >
        {HERO_TILES.map((tile) => (
          <CategoryTile key={tile.title} tile={tile} hero />
        ))}
        {SMALL_TILES.map((tile) => (
          <CategoryTile key={tile.title} tile={tile} hero={false} />
        ))}
      </div>
    </section>
  );
}
