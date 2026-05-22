export type SiteInfo = {
  projectName: string;
  siteType: string;
  designTheme: string;
  plantStyle: string;
  keepRoads: boolean;
  keepBuildings: boolean;
  generateLabels: boolean;
  generateLegend: boolean;
  baseMapDescription?: string;
};

export type PlantPatch = {
  id: string;
  name: string;
  plantType:
    | '落叶乔木'
    | '常绿乔木'
    | '灌木'
    | '观花乔灌木'
    | '地被'
    | '草坪'
    | '花境'
    | string;
  recommendedPlants: string[];
  seasonalFocus: string;
  spatialDescription: string;
  colorHint?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
};

export type DrawingType =
  | 'planting_plan'
  | 'seasonal_plan'
  | 'community_detail'
  | 'site_section'
  | 'plant_layering'
  | 'atmosphere_render';

export type GeneratedDrawing = {
  drawingType: DrawingType;
  title: string;
  prompt: string;
};
