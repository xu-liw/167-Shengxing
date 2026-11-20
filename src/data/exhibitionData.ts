// TypeScript type definitions and typed exports for 《167次-勝興》
import {
  ARCHIVE_PLATES as _ARCHIVE_PLATES,
  BLOCK_INSTRUMENT_DATA as _BLOCK_INSTRUMENT_DATA,
  BLOCK_SECTIONS as _BLOCK_SECTIONS,
  CULTURAL_LINKS as _CULTURAL_LINKS,
  CURATORIAL_CREDITS as _CURATORIAL_CREDITS,
  EXHIBITION_IMAGES as _EXHIBITION_IMAGES,
  MAP_OBJECTS as _MAP_OBJECTS,
  MAP_STATIONS as _MAP_STATIONS,
  NAV_ITEMS as _NAV_ITEMS,
  OLD_MOUNTAIN_STOPS as _OLD_MOUNTAIN_STOPS,
  TRAIN_167_OBJECT as _TRAIN_167_OBJECT,
} from './exhibitionData.js';

export interface MapPosition {
  x: number;
  y: number;
}

export type MapObjectType =
  | 'station'
  | 'tunnel'
  | 'bridge'
  | 'train'
  | 'track'
  | 'monument'
  | 'heritage'
  | 'dater'
  | 'signpost'
  | 'equipment';

export interface MapObject {
  id: string;
  name: string;
  shortName: string;
  type: MapObjectType;
  kmMark: string;
  elevation: number;
  elevationStr: string;
  isFocal?: boolean;
  isCenter?: boolean;
  hasStory?: boolean;
  isSignpost?: boolean;
  prevStation?: string;
  nextStation?: string;
  portraitPos: MapPosition;
  landscapePos: MapPosition;
  summary: string;
  detail: string;
  mapIcon?: string;
  thumbnail?: string;
  image?: string;
  fallbackImage?: string;
  imageAlt?: string;
  story?: string;
  walkingTip?: string;
  source?: string;
}

export interface BlockSection {
  id: string;
  name: string;
  rangeLandscape: [number, number];
  rangePortrait: [number, number];
  status: 'clear' | 'occupied';
  statusText: string;
  speedLimit: string;
  mileage: string;
  description: string;
}

export type ExhibitionTabId = 'explore' | 'archive' | 'about' | 'links';

export interface NavItem {
  id: ExhibitionTabId;
  index: string;
  label: string;
  subtitle: string;
}

export interface StationStop {
  id: string;
  order: string;
  name: string;
  kmMark: string;
  elevation: string;
  time167: string;
  summary: string;
  detail: string;
  image: string;
  imageAlt: string;
}

export interface ArchivePlate {
  id: string;
  title: string;
  thumbnail?: string;
  image: string;
  fallbackImage?: string;
  imageAlt: string;
  story: string;
  walkingTip: string;
  source: string;
}

export type BlockInstrumentData = MapObject;

export interface CuratorialCredit {
  role: string;
  members: string[];
  note: string;
  memberDetails?: Array<{
    name: string;
    task: string;
  }>;
}

export interface CulturalLinkItem {
  id: string;
  title: string;
  description: string;
  url?: string;
}

export interface ExhibitionImages {
  shengxingNight: string;
  longtengBridge: string;
  juguangTrain: string;
  mountainTunnel: string;
}

export const EXHIBITION_IMAGES: ExhibitionImages = _EXHIBITION_IMAGES as ExhibitionImages;
export const NAV_ITEMS: NavItem[] = _NAV_ITEMS as NavItem[];
export const MAP_OBJECTS: MapObject[] = _MAP_OBJECTS as MapObject[];
export const TRAIN_167_OBJECT: MapObject = _TRAIN_167_OBJECT as MapObject;
export const MAP_STATIONS: MapObject[] = _MAP_STATIONS as MapObject[];
export const BLOCK_SECTIONS: BlockSection[] = _BLOCK_SECTIONS as BlockSection[];
export const BLOCK_INSTRUMENT_DATA: MapObject =
  _BLOCK_INSTRUMENT_DATA as MapObject;
export const OLD_MOUNTAIN_STOPS: StationStop[] = _OLD_MOUNTAIN_STOPS as StationStop[];
export const ARCHIVE_PLATES: ArchivePlate[] = _ARCHIVE_PLATES as ArchivePlate[];
export const CURATORIAL_CREDITS: CuratorialCredit[] = _CURATORIAL_CREDITS as CuratorialCredit[];
export const CULTURAL_LINKS: CulturalLinkItem[] = _CULTURAL_LINKS as CulturalLinkItem[];
