import type {
  DrawingType,
  GeneratedDrawing,
  PlantPatch,
  SiteInfo,
} from '@/types/planting';

const drawingConfig: Record<
  DrawingType,
  {
    title: string;
    baseTask: string;
    plantExpression: string;
    drawingStyle: string;
  }
> = {
  planting_plan: {
    title: '植物规划平面图',
    baseTask:
      '生成一张植物规划总平面图，清晰表达场地内各植物斑块的位置、范围、类型与空间关系。',
    plantExpression:
      '用柔和但可区分的色块表现乔木、灌木、地被、草坪和花境，斑块边界应自然、清楚，并体现植物群落的主次层级。',
    drawingStyle:
      '采用景观设计竞赛图纸风格，平面表达干净、专业，配色自然，图面留白克制，适合方案汇报。',
  },
  seasonal_plan: {
    title: '植物季相图',
    baseTask:
      '生成一张植物季相分析图，突出春、夏、秋、冬不同季节的植物观赏重点与色彩变化。',
    plantExpression:
      '重点表达花期、秋色叶、常绿背景、草花花境和冬季枝干结构，用季相色彩和轻量标注呈现变化节奏。',
    drawingStyle:
      '采用清爽的信息图式景观图纸风格，色彩柔和明快，季节信息分区清楚，整体具备专业分析图质感。',
  },
  community_detail: {
    title: '局部群落图',
    baseTask:
      '生成一张局部植物群落详图，展示典型植物斑块内部的乔、灌、草搭配关系。',
    plantExpression:
      '强调植物组合、株高变化、冠幅关系、林缘过渡和地被覆盖，推荐植物应按群落层次有序出现。',
    drawingStyle:
      '采用精细景观种植详图风格，画面应具备手绘质感和图纸可读性，植物形态丰富但不杂乱。',
  },
  site_section: {
    title: '场地剖面图',
    baseTask:
      '生成一张场地植物剖面图，表达道路、建筑边界、开敞空间与植物层次之间的竖向关系。',
    plantExpression:
      '展示乔木树冠、亚乔木或大灌木、中低灌木、地被和草坪的高度层级，体现遮荫、围合与视线通透性。',
    drawingStyle:
      '采用景观剖面表达风格，线条清晰、比例明确、植物轮廓自然，适合用于设计汇报版面。',
  },
  plant_layering: {
    title: '植物分层图',
    baseTask:
      '生成一张植物分层分析图，系统说明场地中乔木层、灌木层、地被层、草坪层和花境层的组织逻辑。',
    plantExpression:
      '用分层色块、透明叠加或分解图表达不同植物层级，突出常绿骨架、季相节点和近人尺度植物。',
    drawingStyle:
      '采用现代景观分析图风格，信息层级明确，图面轻盈，适合与总平图和剖面图配套展示。',
  },
  atmosphere_render: {
    title: '意象效果图',
    baseTask:
      '生成一张植物景观意象效果图，呈现场地建成后的空间氛围、植物质感和人在其中的体验。',
    plantExpression:
      '突出植物群落的体量、色彩、季相、光影和层次，推荐植物应以自然真实的景观方式融入空间。',
    drawingStyle:
      '采用高质量景观概念效果图风格，画面温和、自然、有呼吸感，避免商业广告式过度渲染。',
  },
};

const drawingTypes = Object.keys(drawingConfig) as DrawingType[];

function formatBoolean(value: boolean) {
  return value ? '是' : '否';
}

function formatPatch(patch: PlantPatch) {
  const plants =
    patch.recommendedPlants.length > 0
      ? patch.recommendedPlants.join('、')
      : '待补充推荐植物';

  return [
    `${patch.id}. ${patch.name}`,
    `植物类型：${patch.plantType}`,
    `推荐植物：${plants}`,
    `季相重点：${patch.seasonalFocus}`,
    `空间描述：${patch.spatialDescription}`,
    patch.colorHint ? `色彩提示：${patch.colorHint}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildPreservedInfo(siteInfo: SiteInfo) {
  return [
    `项目名称：${siteInfo.projectName || '未命名项目'}`,
    `场地类型：${siteInfo.siteType}`,
    `设计主题：${siteInfo.designTheme}`,
    `植物风格：${siteInfo.plantStyle}`,
    `保留道路系统：${formatBoolean(siteInfo.keepRoads)}`,
    `保留建筑边界：${formatBoolean(siteInfo.keepBuildings)}`,
    `生成植物标签：${formatBoolean(siteInfo.generateLabels)}`,
    `生成植物图例：${formatBoolean(siteInfo.generateLegend)}`,
    siteInfo.baseMapDescription
      ? `场地底图说明：${siteInfo.baseMapDescription}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildDrawingPrompt(
  siteInfo: SiteInfo,
  plantPatches: PlantPatch[],
  drawingType: DrawingType,
) {
  const config = drawingConfig[drawingType];
  const patchText =
    plantPatches.length > 0
      ? plantPatches.map(formatPatch).join('\n\n')
      : '暂无植物斑块，请根据场地信息生成合理的植物配置表达。';

  return [
    `图纸类型：${config.title}`,
    '',
    '【基础任务】',
    config.baseTask,
    '',
    '【保留信息】',
    buildPreservedInfo(siteInfo),
    '必须保留原场地的主要空间结构、道路走向、建筑边界、水体或硬质铺装关系，不得改变总体平面格局。',
    '',
    '【植物表达】',
    config.plantExpression,
    '植物斑块信息如下：',
    patchText,
    '',
    '【图纸风格】',
    config.drawingStyle,
    '图面应为浅色绿色景观工具风格，表达清晰、克制、专业，适合与一套植物规划图纸共同使用。',
    '',
    '【禁止事项】',
    '不要生成与场地无关的建筑、道路或水体；不要改变斑块名称和植物类型；不要使用过度饱和、霓虹或暗黑风格；不要出现乱码、错误中文、无意义标签；不要把植物画成杂乱噪点或不可辨识纹理。',
  ].join('\n');
}

export function buildAllDrawingPrompts(
  siteInfo: SiteInfo,
  plantPatches: PlantPatch[],
): GeneratedDrawing[] {
  return drawingTypes.map((drawingType) => ({
    drawingType,
    title: drawingConfig[drawingType].title,
    prompt: buildDrawingPrompt(siteInfo, plantPatches, drawingType),
  }));
}
