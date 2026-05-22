'use client';

import { buildAllDrawingPrompts } from '@/lib/promptBuilder';
import type { DrawingType, PlantPatch, SiteInfo } from '@/types/planting';
import { useEffect, useState } from 'react';

const mockSiteInfo: SiteInfo = {
  projectName: '园林植物种植规划设计',
  siteType: '综合绿地',
  designTheme: '自然生态与景观体验',
  plantStyle: '乔灌草复合植物群落',
  keepRoads: true,
  keepBuildings: true,
  generateLabels: true,
  generateLegend: true,
  baseMapDescription:
    '场地包含道路、建筑边界、开放草坪、节点空间和植物种植区域。',
};

const mockPlantPatches: PlantPatch[] = [
  {
    id: 'A',
    name: '入口迎宾林带',
    plantType: '落叶乔木',
    recommendedPlants: ['榉树', '乌桕', '银杏'],
    seasonalFocus: '秋色叶与疏朗林冠',
    spatialDescription: '沿主入口形成开合有序的树阵空间，保留视线通廊并强化到达感。',
    colorHint: '柔和绿色',
    x: 12,
    y: 16,
    width: 24,
    height: 28,
    rotation: -8,
  },
  {
    id: 'B',
    name: '常绿背景群落',
    plantType: '常绿乔木',
    recommendedPlants: ['香樟', '广玉兰', '桂花'],
    seasonalFocus: '常绿骨架与冬季界面',
    spatialDescription: '布置在场地北侧和建筑边界，形成稳定背景并遮挡硬质界面。',
    colorHint: '深绿色',
    x: 64,
    y: 12,
    width: 26,
    height: 34,
    rotation: 5,
  },
  {
    id: 'C',
    name: '春花灌木岛',
    plantType: '观花乔灌木',
    recommendedPlants: ['樱花', '垂丝海棠', '绣球'],
    seasonalFocus: '春季观花与近人尺度',
    spatialDescription: '设置在主要步行动线转折处，形成停留节点和春季记忆点。',
    colorHint: '粉色',
    x: 36,
    y: 32,
    width: 25,
    height: 24,
    rotation: 12,
  },
  {
    id: 'D',
    name: '林下耐阴地被',
    plantType: '地被',
    recommendedPlants: ['麦冬', '玉簪', '阔叶十大功劳'],
    seasonalFocus: '细腻叶色与低维护覆盖',
    spatialDescription: '衔接乔木林下与步道边缘，减少裸土并控制后期维护成本。',
    colorHint: '黄绿色',
    x: 18,
    y: 64,
    width: 34,
    height: 20,
    rotation: 4,
  },
  {
    id: 'E',
    name: '雨水花境带',
    plantType: '花境',
    recommendedPlants: ['鸢尾', '狼尾草', '鼠尾草', '金鸡菊'],
    seasonalFocus: '夏秋花序与雨水花园意象',
    spatialDescription: '沿低洼绿带组织多年生花境，兼顾雨水消纳和步道观赏面。',
    colorHint: '浅紫色',
    x: 53,
    y: 59,
    width: 25,
    height: 23,
    rotation: -10,
  },
  {
    id: 'F',
    name: '开放活动草坪',
    plantType: '草坪',
    recommendedPlants: ['矮生百慕大', '黑麦草混播'],
    seasonalFocus: '开敞绿色基底',
    spatialDescription: '位于中心开敞区，承接活动、休憩和视线展开，边缘以低矮植物收边。',
    colorHint: '蓝绿色',
    x: 43,
    y: 54,
    width: 30,
    height: 24,
    rotation: 2,
  },
];

const drawingTypeLabels: Record<DrawingType, string> = {
  planting_plan: 'Planting Plan',
  seasonal_plan: 'Seasonal Plan',
  community_detail: 'Community Detail',
  site_section: 'Site Section',
  plant_layering: 'Plant Layering',
  atmosphere_render: 'Atmosphere Render',
};

type DrawingCard = {
  drawingType: DrawingType;
  title: string;
  type: string;
  prompt: string;
  status: 'idle' | 'generated' | 'error';
  imageUrl: string;
  createdAt: string;
  errorMessage: string;
};

type GenerateDrawingResponse = {
  status: string;
  imageUrl?: string;
  prompt?: string;
  createdAt?: string;
  error?: string;
};

type UploadedBaseMap = {
  dataUrl: string;
  mimeType: string;
  name: string;
};

function getStoredPlantPatches() {
  try {
    const stored = localStorage.getItem('plantPatches');

    if (!stored) return mockPlantPatches;

    const parsed = JSON.parse(stored) as PlantPatch[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return mockPlantPatches;
    }

    return parsed;
  } catch {
    return mockPlantPatches;
  }
}

function getStoredSiteInfo() {
  try {
    const stored = localStorage.getItem('plantingProjectState');

    if (!stored) return mockSiteInfo;

    const parsed = JSON.parse(stored) as Partial<SiteInfo>;

    return {
      ...mockSiteInfo,
      projectName:
        typeof parsed.projectName === 'string'
          ? parsed.projectName
          : mockSiteInfo.projectName,
      siteType:
        typeof parsed.siteType === 'string'
          ? parsed.siteType
          : mockSiteInfo.siteType,
      designTheme:
        typeof parsed.designTheme === 'string'
          ? parsed.designTheme
          : mockSiteInfo.designTheme,
      plantStyle:
        typeof parsed.plantStyle === 'string'
          ? parsed.plantStyle
          : mockSiteInfo.plantStyle,
      keepRoads:
        typeof parsed.keepRoads === 'boolean'
          ? parsed.keepRoads
          : mockSiteInfo.keepRoads,
      keepBuildings:
        typeof parsed.keepBuildings === 'boolean'
          ? parsed.keepBuildings
          : mockSiteInfo.keepBuildings,
      generateLabels:
        typeof parsed.generateLabels === 'boolean'
          ? parsed.generateLabels
          : mockSiteInfo.generateLabels,
      generateLegend:
        typeof parsed.generateLegend === 'boolean'
          ? parsed.generateLegend
          : mockSiteInfo.generateLegend,
      baseMapDescription:
        typeof parsed.baseMapDescription === 'string'
          ? parsed.baseMapDescription
          : mockSiteInfo.baseMapDescription,
    };
  } catch {
    return mockSiteInfo;
  }
}

function createInitialDrawings(
  siteInfo: SiteInfo,
  plantPatches: PlantPatch[],
  hasUploadedBaseMap: boolean,
): DrawingCard[] {
  return buildAllDrawingPrompts(siteInfo, plantPatches).map((drawing) => ({
    drawingType: drawing.drawingType,
    title: drawing.title,
    type: drawingTypeLabels[drawing.drawingType],
    prompt: drawing.prompt,
    status:
      drawing.drawingType === 'planting_plan' && hasUploadedBaseMap
        ? 'generated'
        : 'idle',
    imageUrl: '',
    createdAt: '',
    errorMessage: '',
  }));
}

function formatFilenameDate(createdAt: string) {
  return createdAt
    ? new Date(createdAt).toISOString().replace(/[:.]/g, '-')
    : 'local-overlay';
}

function getUploadedBaseMap(): UploadedBaseMap | null {
  try {
    const uploadedBaseMap = localStorage.getItem('uploadedBaseMap');

    if (uploadedBaseMap) {
      const mimeType =
        uploadedBaseMap.match(/^data:([^;]+);base64,/)?.[1] || 'image/png';

      return {
        dataUrl: uploadedBaseMap,
        mimeType,
        name: 'uploaded-base-map.png',
      };
    }

    const stored = localStorage.getItem('landscape-planting-ai:base-map');

    if (!stored) return null;

    const parsed = JSON.parse(stored) as UploadedBaseMap;

    if (!parsed.dataUrl || !parsed.mimeType || !parsed.name) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

const patchPalette = [
  'rgba(134, 197, 106, 0.56)',
  'rgba(63, 138, 91, 0.48)',
  'rgba(238, 156, 187, 0.58)',
  'rgba(182, 214, 80, 0.58)',
  'rgba(187, 166, 232, 0.54)',
  'rgba(108, 201, 203, 0.52)',
];

const seasonalTitles = ['春季', '夏季', '秋季', '冬季'] as const;
const localDrawingTypes = [
  'planting_plan',
  'seasonal_plan',
  'plant_layering',
] as const;
const layeringTypes = [
  { title: '落叶乔木', plantType: '落叶乔木' },
  { title: '常绿乔木', plantType: '常绿乔木' },
  { title: '灌木', plantType: '灌木' },
  { title: '观花乔灌木', plantType: '观花乔灌木' },
  { title: '地被植物', plantType: '地被' },
] as const;

const seasonalPalette: Record<string, string[]> = {
  常绿乔木: ['#3f9a5b', '#1f6f3f', '#1f5c3a', '#143e2b'],
  落叶乔木: ['#9ed86b', '#4f9b53', '#d9772b', '#8b7766'],
  灌木: ['#b6df84', '#5fa35e', '#a8bf52', '#8e8476'],
  观花乔灌木: ['#f2c6d7', '#5f9e5f', '#ce8a51', '#8d8075'],
  地被: ['#a8d96b', '#60a55b', '#b1bf59', '#7f9b77'],
  草坪: ['#83d93f', '#5aa75b', '#aebb59', '#a9ae86'],
  花境: ['#ef9fc0', '#d66fa2', '#e3a24d', '#9aa174'],
};

function patchGeometry(patch: PlantPatch, index: number) {
  const fallback = mockPlantPatches[index] || mockPlantPatches[0];

  return {
    x: patch.x ?? fallback.x ?? 10,
    y: patch.y ?? fallback.y ?? 10,
    width: patch.width ?? fallback.width ?? 24,
    height: patch.height ?? fallback.height ?? 20,
    rotation: patch.rotation ?? fallback.rotation ?? 0,
  };
}

function loadDrawingImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error('上传底图加载失败。'));
    };

    image.src = src;
  });
}

function drawContainedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, x, y, drawWidth, drawHeight);
}

function drawPatchEllipse(
  context: CanvasRenderingContext2D,
  patch: PlantPatch,
  index: number,
  bounds: { x: number; y: number; width: number; height: number },
  fillStyle: string,
  opacity = 1,
) {
  const geometry = patchGeometry(patch, index);
  const width = (geometry.width / 100) * bounds.width;
  const height = (geometry.height / 100) * bounds.height;
  const x = bounds.x + (geometry.x / 100) * bounds.width;
  const y = bounds.y + (geometry.y / 100) * bounds.height;

  context.save();
  context.globalAlpha = opacity;
  context.translate(x + width / 2, y + height / 2);
  context.rotate((geometry.rotation * Math.PI) / 180);
  context.beginPath();
  context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
  context.fillStyle = fillStyle;
  context.fill();
  context.lineWidth = Math.max(1, bounds.width / 260);
  context.strokeStyle = 'rgba(255, 255, 255, 0.86)';
  context.stroke();
  context.restore();
}

function drawPatchPixelGrid(
  context: CanvasRenderingContext2D,
  patch: PlantPatch,
  index: number,
  bounds: { x: number; y: number; width: number; height: number },
  fillStyle: string,
) {
  const geometry = patchGeometry(patch, index);
  const width = (geometry.width / 100) * bounds.width;
  const height = (geometry.height / 100) * bounds.height;
  const x = bounds.x + (geometry.x / 100) * bounds.width;
  const y = bounds.y + (geometry.y / 100) * bounds.height;
  const step = Math.max(6, Math.round(bounds.width / 42));
  const tile = Math.max(4, Math.round(step * 0.68));

  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate((geometry.rotation * Math.PI) / 180);
  context.beginPath();
  context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = 'rgba(255, 255, 255, 0.22)';
  context.fillRect(-width / 2, -height / 2, width, height);
  context.fillStyle = fillStyle;

  for (let gridX = -width / 2; gridX < width / 2; gridX += step) {
    for (let gridY = -height / 2; gridY < height / 2; gridY += step) {
      context.fillRect(gridX, gridY, tile, tile);
    }
  }

  context.beginPath();
  context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
  context.lineWidth = Math.max(1, bounds.width / 250);
  context.strokeStyle = 'rgba(255, 255, 255, 0.82)';
  context.stroke();
  context.restore();
}

function drawPanelTitle(
  context: CanvasRenderingContext2D,
  title: string,
  x: number,
  y: number,
  panelWidth: number,
) {
  context.save();
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  context.fillRect(x + 16, y + 14, Math.min(panelWidth - 32, 172), 42);
  context.fillStyle = '#292524';
  context.font = '600 25px Arial, sans-serif';
  context.fillText(title, x + 30, y + 43);
  context.restore();
}

function drawPanelBaseMap(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.save();
  context.fillStyle = '#f8f6ef';
  context.fillRect(x, y, width, height);
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.translate(x, y);
  drawContainedImage(context, image, width, height);
  context.restore();
  context.save();
  context.strokeStyle = '#d6d3d1';
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);
  context.restore();
}

function seasonalColor(patch: PlantPatch, seasonIndex: number) {
  const palette = seasonalPalette[patch.plantType] || seasonalPalette.灌木;

  if (patch.plantType === '花境') {
    const focus = patch.seasonalFocus;

    if (focus.includes('春') && seasonIndex === 0) return '#f08fbd';
    if (focus.includes('夏') && seasonIndex === 1) return '#e76298';
    if (focus.includes('秋') && seasonIndex === 2) return '#e39a3d';
  }

  return palette[seasonIndex];
}

async function composePlantingPlan(baseMap: string, plantPatches: PlantPatch[]) {
  if (!baseMap) {
    throw new Error('缺少上传底图，请返回首页重新上传。');
  }

  const image = await loadDrawingImage(baseMap);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('无法创建植物规划平面图。');
  }

  canvas.width = 1400;
  canvas.height = 1000;
  drawContainedImage(context, image, canvas.width, canvas.height);

  plantPatches.forEach((patch, index) => {
    const geometry = patchGeometry(patch, index);
    const width = (geometry.width / 100) * canvas.width;
    const height = (geometry.height / 100) * canvas.height;
    const x = (geometry.x / 100) * canvas.width;
    const y = (geometry.y / 100) * canvas.height;

    context.save();
    context.translate(x + width / 2, y + height / 2);
    context.rotate((geometry.rotation * Math.PI) / 180);
    context.beginPath();
    context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    context.fillStyle = patchPalette[index % patchPalette.length];
    context.fill();
    context.lineWidth = 5;
    context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    context.stroke();
    context.restore();

    context.save();
    context.font = '600 22px Arial, sans-serif';
    const label = `${patch.id} ${patch.name}`;
    const labelWidth = context.measureText(label).width + 28;
    const labelX = x + width / 2 - labelWidth / 2;
    const labelY = y + height / 2 - 22;
    context.fillStyle = 'rgba(255, 255, 255, 0.86)';
    context.fillRect(labelX, labelY, labelWidth, 38);
    context.fillStyle = '#292524';
    context.fillText(label, labelX + 14, labelY + 26);
    context.restore();
  });

  context.save();
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  context.fillRect(canvas.width - 290, canvas.height - 174, 250, 126);
  context.fillStyle = '#1c1917';
  context.font = '600 22px Arial, sans-serif';
  context.fillText('植物斑块图例', canvas.width - 264, canvas.height - 136);
  context.font = '18px Arial, sans-serif';
  plantPatches.slice(0, 3).forEach((patch, index) => {
    const rowY = canvas.height - 104 + index * 25;
    context.fillStyle = patchPalette[index % patchPalette.length];
    context.fillRect(canvas.width - 264, rowY - 14, 24, 16);
    context.fillStyle = '#57534e';
    context.fillText(patch.plantType, canvas.width - 230, rowY);
  });
  context.restore();

  return canvas.toDataURL('image/png');
}

async function composeSeasonalPlan(baseMap: string, plantPatches: PlantPatch[]) {
  if (!baseMap) {
    throw new Error('缺少上传底图，请返回首页重新上传。');
  }

  const image = await loadDrawingImage(baseMap);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('无法创建植物季相图。');
  }

  canvas.width = 1600;
  canvas.height = 1180;
  context.fillStyle = '#f5f3ee';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const gap = 34;
  const panelWidth = (canvas.width - gap * 3) / 2;
  const panelHeight = (canvas.height - gap * 3) / 2;

  seasonalTitles.forEach((title, seasonIndex) => {
    const panelX = gap + (seasonIndex % 2) * (panelWidth + gap);
    const panelY = gap + Math.floor(seasonIndex / 2) * (panelHeight + gap);
    const panelBounds = {
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
    };

    drawPanelBaseMap(context, image, panelX, panelY, panelWidth, panelHeight);
    plantPatches.forEach((patch, patchIndex) => {
      drawPatchPixelGrid(
        context,
        patch,
        patchIndex,
        panelBounds,
        seasonalColor(patch, seasonIndex),
      );
    });
    drawPanelTitle(context, title, panelX, panelY, panelWidth);
  });

  context.save();
  context.fillStyle = 'rgba(255, 255, 255, 0.92)';
  context.fillRect(canvas.width - 308, canvas.height - 106, 258, 58);
  context.fillStyle = '#57534e';
  context.font = '20px Arial, sans-serif';
  context.fillText('同底图 / 同斑块位置 / 四季色彩', canvas.width - 286, canvas.height - 70);
  context.restore();

  return canvas.toDataURL('image/png');
}

async function composePlantLayering(baseMap: string, plantPatches: PlantPatch[]) {
  if (!baseMap) {
    throw new Error('缺少上传底图，请返回首页重新上传。');
  }

  const image = await loadDrawingImage(baseMap);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('无法创建植物分层图。');
  }

  canvas.width = 1800;
  canvas.height = 1220;
  context.fillStyle = '#f5f3ee';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const gap = 32;
  const panelWidth = (canvas.width - gap * 4) / 3;
  const panelHeight = (canvas.height - gap * 3) / 2;

  layeringTypes.forEach((layer, index) => {
    const panelX = gap + (index % 3) * (panelWidth + gap);
    const panelY = gap + Math.floor(index / 3) * (panelHeight + gap);
    const panelBounds = {
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
    };

    drawPanelBaseMap(context, image, panelX, panelY, panelWidth, panelHeight);
    plantPatches.forEach((patch, patchIndex) => {
      const isHighlighted = patch.plantType === layer.plantType;

      drawPatchEllipse(
        context,
        patch,
        patchIndex,
        panelBounds,
        isHighlighted
          ? patchPalette[patchIndex % patchPalette.length]
          : 'rgba(168, 162, 158, 0.66)',
        isHighlighted ? 1 : 0.25,
      );
    });
    drawPanelTitle(context, layer.title, panelX, panelY, panelWidth);
  });

  context.save();
  context.fillStyle = 'rgba(255, 255, 255, 0.94)';
  context.fillRect(gap, canvas.height - panelHeight + 56, panelWidth, 150);
  context.fillStyle = '#1c1917';
  context.font = '600 27px Arial, sans-serif';
  context.fillText('植物类型高亮图', gap + 28, canvas.height - panelHeight + 104);
  context.fillStyle = '#57534e';
  context.font = '21px Arial, sans-serif';
  context.fillText('高亮当前类型', gap + 28, canvas.height - panelHeight + 146);
  context.globalAlpha = 0.4;
  context.fillText('其余斑块浅灰弱化', gap + 28, canvas.height - panelHeight + 182);
  context.restore();

  return canvas.toDataURL('image/png');
}

function isLocalDrawingType(drawingType: DrawingType) {
  return localDrawingTypes.some((localType) => localType === drawingType);
}

async function composeLocalDrawing(
  drawingType: DrawingType,
  baseMap: string,
  plantPatches: PlantPatch[],
) {
  if (drawingType === 'seasonal_plan') {
    return composeSeasonalPlan(baseMap, plantPatches);
  }

  if (drawingType === 'plant_layering') {
    return composePlantLayering(baseMap, plantPatches);
  }

  return composePlantingPlan(baseMap, plantPatches);
}

export default function ResultsPage() {
  const [mounted, setMounted] = useState(false);
  const [currentSiteInfo, setCurrentSiteInfo] = useState(mockSiteInfo);
  const [currentPlantPatches, setCurrentPlantPatches] =
    useState(mockPlantPatches);
  const [uploadedBaseMap, setUploadedBaseMap] =
    useState<UploadedBaseMap | null>(null);
  const [drawings, setDrawings] = useState(() =>
    createInitialDrawings(mockSiteInfo, mockPlantPatches, false),
  );
  const [loadingTypes, setLoadingTypes] = useState<Set<DrawingType>>(
    () => new Set(),
  );
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingCard | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);

    const storedSiteInfo = getStoredSiteInfo();
    const storedPlantPatches = getStoredPlantPatches();
    const storedBaseMap = getUploadedBaseMap();

    window.setTimeout(() => {
      setCurrentSiteInfo(storedSiteInfo);
      setCurrentPlantPatches(storedPlantPatches);
      setUploadedBaseMap(storedBaseMap);
      setDrawings(
        createInitialDrawings(
          storedSiteInfo,
          storedPlantPatches,
          Boolean(storedBaseMap),
        ),
      );

      if (storedBaseMap) {
        void Promise.all([
          composeSeasonalPlan(storedBaseMap.dataUrl, storedPlantPatches),
          composePlantLayering(storedBaseMap.dataUrl, storedPlantPatches),
        ]).then(([seasonalImage, layeringImage]) => {
          setDrawings((current) =>
            current.map((drawing) => {
              if (drawing.drawingType === 'seasonal_plan') {
                return {
                  ...drawing,
                  status: 'generated',
                  imageUrl: seasonalImage,
                  createdAt: new Date().toISOString(),
                  errorMessage: '',
                };
              }

              if (drawing.drawingType === 'plant_layering') {
                return {
                  ...drawing,
                  status: 'generated',
                  imageUrl: layeringImage,
                  createdAt: new Date().toISOString(),
                  errorMessage: '',
                };
              }

              return drawing;
            }),
          );
        });
      }
    }, 0);
  }, []);

  const refreshLocalDrawing = async (drawing: DrawingCard) => {
    const imageUrl = await composeLocalDrawing(
      drawing.drawingType,
      uploadedBaseMap?.dataUrl || '',
      currentPlantPatches,
    );
    const nextDrawing = {
      ...drawing,
      status: 'generated' as const,
      imageUrl,
      createdAt: new Date().toISOString(),
      errorMessage: '',
    };

    setDrawings((current) =>
      current.map((item) =>
        item.drawingType === drawing.drawingType ? nextDrawing : item,
      ),
    );

    return nextDrawing;
  };

  const handleRegenerate = async (drawing: DrawingCard) => {
    if (!mounted) return;

    setLoadingTypes((current) => new Set(current).add(drawing.drawingType));

    try {
      if (isLocalDrawingType(drawing.drawingType)) {
        await refreshLocalDrawing(drawing);
        return;
      }

      const plantingPlanImage = await composePlantingPlan(
        uploadedBaseMap?.dataUrl || '',
        currentPlantPatches,
      );

      const response = await fetch('/api/generate-drawing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drawingType: drawing.drawingType,
          prompt: drawing.prompt,
          siteInfo: currentSiteInfo,
          plantPatches: currentPlantPatches,
          baseMapImage: uploadedBaseMap,
          plantingPlanImage: {
            dataUrl: plantingPlanImage,
            mimeType: 'image/png',
            name: 'planting-plan-overlay.png',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('图像生成失败，请稍后重试。');
      }

      const data = (await response.json()) as GenerateDrawingResponse;

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.error || '图像生成失败，请稍后重试。');
      }

      setDrawings((current) =>
        current.map((item) =>
          item.drawingType === drawing.drawingType
            ? {
                ...item,
                status: 'generated',
                imageUrl: data.imageUrl || '',
                prompt: data.prompt || item.prompt,
                createdAt: data.createdAt || new Date().toISOString(),
                errorMessage: '',
              }
            : item,
        ),
      );
    } catch (error) {
      setDrawings((current) =>
        current.map((item) =>
          item.drawingType === drawing.drawingType
            ? {
                ...item,
                status: 'error',
                errorMessage:
                  error instanceof Error ? error.message : '生成失败',
              }
            : item,
        ),
      );
    } finally {
      setLoadingTypes((current) => {
        const next = new Set(current);
        next.delete(drawing.drawingType);
        return next;
      });
    }
  };

  const downloadDrawing = (drawing: DrawingCard) => {
    if (!drawing.imageUrl) return;

    const link = document.createElement('a');
    link.href = drawing.imageUrl;
    link.download = `${drawing.title}-${formatFilenameDate(
      drawing.createdAt,
    )}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async (drawing: DrawingCard) => {
    if (isLocalDrawingType(drawing.drawingType) && !mounted) return;

    if (drawing.imageUrl) {
      downloadDrawing(drawing);
      return;
    }

    if (!isLocalDrawingType(drawing.drawingType)) return;

    try {
      downloadDrawing(await refreshLocalDrawing(drawing));
    } catch (error) {
      setDrawings((current) =>
        current.map((item) =>
          item.drawingType === drawing.drawingType
            ? {
                ...item,
                status: 'error',
                errorMessage:
                  error instanceof Error ? error.message : '叠图生成失败',
              }
            : item,
        ),
      );
    }
  };

  const handleOpenLocalPreview = async (drawing: DrawingCard) => {
    if (!mounted) return;

    try {
      setSelectedDrawing(await refreshLocalDrawing(drawing));
    } catch (error) {
      setDrawings((current) =>
        current.map((item) =>
          item.drawingType === drawing.drawingType
            ? {
                ...item,
                status: 'error',
                errorMessage:
                  error instanceof Error ? error.message : '叠图生成失败',
              }
            : item,
        ),
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-6 py-6">
          <p className="text-xs font-medium tracking-[0.25em] text-green-700">
            DRAWING SET RESULTS
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            植物规划套图生成结果
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-500">
            当前为植物规划套图结果页，植物规划平面图由底图叠加生成，其余图纸可调用 AI 生成。
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {drawings.map((drawing, index) => {
            const isLoading = loadingTypes.has(drawing.drawingType);
            const hasUploadedBaseMap = mounted && Boolean(uploadedBaseMap);

            return (
              <article
                key={drawing.title}
                className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[linear-gradient(to_right,rgba(120,113,108,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,113,108,0.12)_1px,transparent_1px)] bg-[#e9e2d3] bg-[size:32px_32px]">
                  {drawing.imageUrl ? (
                    <button
                      type="button"
                      aria-label={drawing.title}
                      onClick={() => setSelectedDrawing(drawing)}
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${drawing.imageUrl})` }}
                    />
                  ) : drawing.drawingType === 'planting_plan' &&
                    hasUploadedBaseMap ? (
                    <button
                      type="button"
                      aria-label="打开植物规划平面图预览"
                      onClick={() => handleOpenLocalPreview(drawing)}
                      className="absolute inset-0"
                    >
                      <img
                        src={uploadedBaseMap?.dataUrl}
                        alt="上传底图"
                        className="absolute inset-0 h-full w-full bg-white object-contain"
                      />
                      {currentPlantPatches.map((patch, patchIndex) => {
                        const geometry = patchGeometry(patch, patchIndex);

                        return (
                          <div
                            key={patch.id}
                            className="absolute flex items-center justify-center rounded-[38%] border border-white/90 text-center shadow-sm"
                            style={{
                              left: `${geometry.x}%`,
                              top: `${geometry.y}%`,
                              width: `${geometry.width}%`,
                              height: `${geometry.height}%`,
                              transform: `rotate(${geometry.rotation}deg)`,
                              backgroundColor:
                                patchPalette[patchIndex % patchPalette.length],
                            }}
                          >
                            <span className="max-w-full truncate rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-stone-800">
                              {patch.id} {patch.name}
                            </span>
                          </div>
                        );
                      })}
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-green-100 bg-white/80 px-6 py-4 text-center shadow-sm">
                      <p className="text-xs font-medium text-green-700">
                        MOCK PREVIEW {index + 1}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-stone-900">
                        {drawing.title}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">{drawing.title}</h2>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-400">
                        {drawing.type}
                      </p>
                      <p className="mt-2 text-xs text-stone-500">
                        状态：
                        {isLoading
                          ? '生成中'
                          : drawing.status === 'generated'
                            ? '已生成'
                            : drawing.status === 'error'
                              ? '生成失败'
                              : '未生成'}
                      </p>
                      {drawing.createdAt && (
                        <p className="mt-1 text-xs text-stone-400">
                          生成时间：
                          {new Date(drawing.createdAt).toLocaleString('zh-CN')}
                        </p>
                      )}
                      {drawing.errorMessage && (
                        <p className="mt-1 text-xs text-red-500">
                          {drawing.errorMessage}
                        </p>
                      )}
                    </div>

                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      {drawing.drawingType === 'planting_plan' &&
                      drawing.status === 'generated'
                        ? '本地叠加'
                        : drawing.drawingType === 'seasonal_plan' &&
                            drawing.status === 'generated'
                          ? '本地季相'
                          : drawing.drawingType === 'plant_layering' &&
                              drawing.status === 'generated'
                            ? '本地分层'
                        : drawing.status === 'generated'
                              ? 'AI生成'
                              : 'mock'}
                    </span>
                  </div>

                  <details className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-stone-800">
                      查看 prompt
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {drawing.prompt}
                    </p>
                  </details>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => handleRegenerate(drawing)}
                      disabled={isLoading || !mounted}
                      className="flex-1 rounded-full border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? '生成中...' : '重新生成'}
                    </button>
                    <button
                      onClick={() => handleDownload(drawing)}
                      disabled={
                        !drawing.imageUrl &&
                        !(
                          mounted &&
                          isLocalDrawingType(drawing.drawingType) &&
                          uploadedBaseMap
                        )
                      }
                      className="flex-1 rounded-full bg-green-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      下载
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedDrawing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6"
          onClick={() => setSelectedDrawing(null)}
        >
          <button
            type="button"
            aria-label="关闭大图"
            onClick={() => setSelectedDrawing(null)}
            className="absolute right-6 top-6 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-white"
          >
            关闭
          </button>
          <img
            src={selectedDrawing.imageUrl}
            alt={selectedDrawing.title}
            className="max-h-[88vh] max-w-[92vw] rounded-2xl bg-white object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
