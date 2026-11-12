import type { Metadata } from "next";

type AppleWebApp = Exclude<NonNullable<Metadata["appleWebApp"]>, boolean>;

export const splashDevices = [
  [440, 956, 3],
  [402, 874, 3],
  [430, 932, 3],
  [393, 852, 3],
  [428, 926, 3],
  [390, 844, 3],
  [375, 812, 3],
  [414, 896, 3],
  [414, 896, 2],
  [414, 736, 3],
  [375, 667, 2],
  [1024, 1366, 2],
  [834, 1194, 2],
  [820, 1180, 2],
  [810, 1080, 2],
  [744, 1133, 2],
] as const;

export const splashFile = (width: number, height: number, ratio: number) =>
  `/splash/apple-splash-${width * ratio}x${height * ratio}.png`;

export const startupImages: AppleWebApp["startupImage"] = splashDevices.map(
  ([width, height, ratio]) => ({
    url: splashFile(width, height, ratio),
    media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
  }),
);
