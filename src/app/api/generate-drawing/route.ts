import OpenAI, { toFile } from 'openai';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import type { DrawingType, PlantPatch, SiteInfo } from '@/types/planting';

export const maxDuration = 180;

type GenerateDrawingRequest = {
  drawingType: DrawingType;
  prompt: string;
  promptHistory?: string[];
  siteInfo: SiteInfo;
  plantPatches: PlantPatch[];
  baseMapImage?: ReferenceImage;
  plantingPlanImage?: ReferenceImage;
  previousDrawingImage?: ReferenceImage;
};

type ReferenceImage =
  | string
  | {
      dataUrl?: string;
      url?: string;
      mimeType?: string;
      name?: string;
    }
  | null;

type BaseMapUpload = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

function configureOpenAIProxy() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

  if (proxyUrl) {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
  }
}

function getReferenceImageSource(referenceImage: ReferenceImage | undefined) {
  if (typeof referenceImage === 'string') {
    return {
      source: referenceImage,
      mimeType: undefined,
      name: undefined,
    };
  }

  if (referenceImage?.dataUrl) {
    return {
      source: referenceImage.dataUrl,
      mimeType: referenceImage.mimeType,
      name: referenceImage.name,
    };
  }

  if (referenceImage?.url) {
    return {
      source: referenceImage.url,
      mimeType: referenceImage.mimeType,
      name: referenceImage.name,
    };
  }

  return null;
}

function readDataUrl(source: string, name?: string): BaseMapUpload {
  const match = source.match(/^data:([^;,]+)?;base64,(.+)$/);

  if (!match?.[2]) {
    throw new Error('Invalid base map image data');
  }

  const mimeType = match[1] || 'image/png';

  return {
    buffer: Buffer.from(match[2], 'base64'),
    mimeType,
    name: name || `base-map.${mimeType.split('/')[1] || 'png'}`,
  };
}

async function readReferenceUpload(referenceImage: ReferenceImage | undefined) {
  const baseMapSource = getReferenceImageSource(referenceImage);

  if (!baseMapSource?.source) {
    return null;
  }

  if (baseMapSource.source.startsWith('data:')) {
    return readDataUrl(baseMapSource.source, baseMapSource.name);
  }

  const response = await fetch(baseMapSource.source);

  if (!response.ok) {
    throw new Error('Failed to load base map image');
  }

  const mimeType =
    baseMapSource.mimeType ||
    response.headers.get('content-type')?.split(';')[0] ||
    'image/png';

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType,
    name: baseMapSource.name || `base-map.${mimeType.split('/')[1] || 'png'}`,
  };
}

function formatPlantPatches(plantPatches: PlantPatch[]) {
  return plantPatches
    .map((patch) => {
      const geometry = [
        `x ${Math.round(patch.x ?? 0)}%`,
        `y ${Math.round(patch.y ?? 0)}%`,
        `宽 ${Math.round(patch.width ?? 0)}%`,
        `高 ${Math.round(patch.height ?? 0)}%`,
      ].join('，');
      const plants = patch.recommendedPlants.slice(0, 4).join('、');

      return `${patch.id} ${patch.name}：${patch.plantType}；推荐植物 ${plants}；季相 ${patch.seasonalFocus}；位置 ${geometry}`;
    })
    .join('\n')
    .slice(0, 1800);
}

function formatSiteInfo(siteInfo: SiteInfo) {
  return [
    `项目 ${siteInfo.projectName || '未命名项目'}`,
    `场地类型 ${siteInfo.siteType}`,
    `设计主题 ${siteInfo.designTheme}`,
    `植物风格 ${siteInfo.plantStyle}`,
    siteInfo.baseMapDescription ? `底图说明 ${siteInfo.baseMapDescription}` : null,
  ]
    .filter(Boolean)
    .join('；')
    .slice(0, 520);
}

function findRepresentativePatch(plantPatches: PlantPatch[]) {
  return (
    plantPatches.find((patch) => patch.plantType === '观花乔灌木') ||
    plantPatches.find(
      (patch) =>
        patch.name.includes('入口') ||
        patch.name.includes('林带') ||
        patch.spatialDescription.includes('入口'),
    ) ||
    plantPatches.find((patch) => patch.plantType === '常绿乔木') ||
    plantPatches[0]
  );
}

function formatRepresentativePatch(plantPatches: PlantPatch[]) {
  const patch = findRepresentativePatch(plantPatches);

  if (!patch) {
    return '未提供明确代表性斑块，请从植物规划平面图中选择主要种植群落。';
  }

  const plants = patch.recommendedPlants.slice(0, 4).join('、');

  return [
    `${patch.id} ${patch.name}`,
    `类型 ${patch.plantType}`,
    plants ? `推荐植物 ${plants}` : null,
    `季相 ${patch.seasonalFocus}`,
    `空间 ${patch.spatialDescription}`,
  ]
    .filter(Boolean)
    .join('；')
    .slice(0, 620);
}

function buildReferencePrompt(
  drawingType: DrawingType,
  plantPatches: PlantPatch[],
  siteInfo: SiteInfo,
) {
  const patchSummary = formatPlantPatches(plantPatches);
  const siteSummary = formatSiteInfo(siteInfo);
  const representativePatch = formatRepresentativePatch(plantPatches);
  const sharedRules =
    '输入图1是上传底图，输入图2是植物规划平面图。必须以同一个场地方案为依据，保留边界、道路、建筑、水体、植物斑块位置和空间关系。不要脱离底图生成陌生新场地，不要改变布局。少文字，避免乱码。';

  const prompts: Record<DrawingType, string> = {
    functional_zoning:
      `请基于上传底图生成一张景观设计功能分区图。你需要先自主识别图中的红线范围、用地边界或设计范围；如果图中有明显红线，请严格以红线内作为设计区域，只在红线范围内绘制功能分区，不要在红线外添加设计内容。必须保留原底图的道路、建筑、水体、边界和主要线条，不要改变总平面关系。请在红线范围内根据场地结构合理划分不同功能区，例如入口形象区、开放活动草坪区、林下休憩区、花境观赏区、生态雨水区、安静停留区、背景林带或缓冲绿带等；不同功能区用柔和但可区分的半透明色块表达，边界清晰，色块贴合场地形状和道路关系，不要自由发挥成陌生场地。图面风格为中国风景园林/城市设计课程作业的功能分区分析图，白底清晰，右下角保留简洁中文图例，少量标签，避免乱码。项目信息：${siteSummary}。`,
    planting_plan:
      `输入图1是上传底图，输入图2是前端斑块分区草图。请基于这两张图生成一张正式、完整的景观植物规划彩色总平面图，而不是功能分区图。必须严格保留上传底图的场地边界、道路、建筑、水体和主要线条，不要重画底图，不要改变道路和建筑位置。以输入图2的斑块位置作为植物配置依据，把大色块深化为更完整的植物规划表达：乔木群落、常绿背景、观花乔灌木、灌木、地被、草坪、花境应有层次和细节。可以用疏密变化、柔和水彩肌理、小型植物符号、点状花境和地被纹理表达植物配置，但不要生成密集树冠圆圈，不要生成手绘素描树阵，不要只保留几个半透明大色块。画面应像中国风景园林课程作业的植物规划彩平图，白底清晰，斑块边界与植物类型可读，右下角保留简洁植物图例，少量中文标签，避免乱码。项目信息：${siteSummary}。植物斑块信息：\n${patchSummary}`,
    seasonal_plan:
      `${sharedRules} 生成植物季相图，不要脱离输入图重新设计总平面。输出一张由春、夏、秋、冬4张小平面图组成的四宫格图纸。4张小图必须复用上传底图与输入植物规划平面图中的固定植物斑块位置，场地边界、道路、建筑、水体和斑块轮廓保持一致，不得改变总平面关系；只改变斑块季节色彩和季相点状表达。每个斑块使用像素点或网格状季相纹理，保留清晰平面图纸感：春季花色点缀，夏季浓绿，秋季色叶，冬季常绿骨架和浅色休眠层。课程作业图纸风格，四格布局规整，右下角简洁季相图例，少量中文标题，少文字，避免乱码。植物斑块信息：\n${patchSummary}`,
    community_detail:
      `${sharedRules} 项目信息：${siteSummary}。只生成植物群落立面或剖立面示意图，不是放大平面图，不是总平面图，不是效果图。优先依据当前代表性斑块：${representativePatch}。代表性斑块可来自观花乔灌木、常绿背景群落或入口林带，必须与输入植物规划平面图中的斑块位置和空间逻辑一致。画面重点表达乔木层、灌木层、地被层、花境层的高度层次、前后关系、冠幅变化和植物组合，表现近人尺度与群落过渡。白底，课程作业图纸风格，立面或剖立面横向排布，少文字，避免乱码。当前植物斑块信息：\n${patchSummary}`,
    site_section:
      `${sharedRules} 项目信息：${siteSummary}。只生成与输入植物规划平面图对应的场地剖面图，不是效果图，不是自由场景。根据植物规划平面图的道路走向、植物斑块、草坪或地被、建筑边界或水体关系选择合理剖切方向，剖面内容必须来自当前底图和平面方案。画面为横向剖面，包含清晰地面线，表达道路、植物斑块、边界或建筑、水体之间的竖向关系，并表达乔木、灌木、草坪地被的高度变化和乔灌草层次。白底，课程作业图纸表达，少文字，避免乱码。当前植物斑块信息：\n${patchSummary}`,
    plant_layering:
      `${sharedRules} 生成植物分层图，不要生成效果图，不要生成单张意象图。输出一张由5张分类高亮小平面图组成的统一图纸，5张小图分别高亮：1 落叶乔木，2 常绿乔木，3 灌木，4 观花乔灌木，5 地被植物。每张小平面图都必须保留同一上传底图结构、边界、道路、建筑、水体和相同斑块位置。当前高亮植物类型使用清晰色块强调，其他植物类型弱化为浅灰或半透明；类型不存在时仍保留该小图并用弱提示表达。整体简洁、清晰、统一、课程图纸感，少文字，避免乱码。植物斑块信息：\n${patchSummary}`,
    atmosphere_render:
      `${sharedRules} 项目信息：${siteSummary}。生成基于当前植物规划方案的景观意象效果图，必须参考输入植物规划平面图的植物布局、道路关系、边界关系和斑块空间逻辑，不要生成无关陌生公园，不要替换成另一套场地。可从当前方案中选取一个典型人视场景，例如主路径、开放草坪、背景林带、花境节点或林缘空间；场景中的植物类型、层次与氛围要对应当前 plantPatches。风格清爽自然，为景观设计方案效果图，不要过度花哨，不要商业海报化。当前植物斑块信息：\n${patchSummary}`,
  };

  return prompts[drawingType];
}

function buildSafePrompt(
  drawingType: DrawingType,
  plantPatches: PlantPatch[],
  siteInfo: SiteInfo,
  userPrompt: string,
  promptHistory: string[] = [],
) {
  const referencePrompt = buildReferencePrompt(drawingType, plantPatches, siteInfo);
  const trimmedUserPrompt = userPrompt.trim().slice(0, 1600);
  const historyText = promptHistory
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(-6)
    .map((item, index) => `${index + 1}. ${item.slice(0, 900)}`)
    .join('\n');

  if (!trimmedUserPrompt && !historyText) {
    return referencePrompt;
  }

  return [
    referencePrompt,
    historyText ? '\n【历史修改要求 / 生图记忆】' : null,
    historyText || null,
    '',
    '【用户本次修改要求】',
    trimmedUserPrompt || '本次未填写新的修改要求，请延续历史修改要求和当前图纸方向。',
    '',
    '以上历史修改要求和本次修改要求需要共同生效；如果传入了上一张生成图，请在上一张图的基础上继续优化，而不是重新自由生成。不得违反保留底图、红线范围、道路、建筑、水体、边界和当前方案空间关系的约束。',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        status: 'error',
        error: 'Missing OPENAI_API_KEY',
      },
      { status: 500 },
    );
  }

  const body = (await request.json()) as GenerateDrawingRequest;
  const {
    drawingType,
    prompt,
    promptHistory,
    baseMapImage,
    plantingPlanImage,
    previousDrawingImage,
    plantPatches,
    siteInfo,
  } = body;
  const safePrompt = buildSafePrompt(
    drawingType,
    plantPatches,
    siteInfo,
    prompt,
    promptHistory,
  );

  configureOpenAIProxy();

  const openai = new OpenAI({
    apiKey,
    timeout: 180000,
  });

  try {
    const baseMapUpload = await readReferenceUpload(baseMapImage);
    const plantingPlanUpload = await readReferenceUpload(plantingPlanImage);
    const previousDrawingUpload =
      await readReferenceUpload(previousDrawingImage);

    if (!baseMapUpload) {
      return Response.json(
        {
          status: 'error',
          error: '缺少上传底图，无法基于当前场地生成图纸。',
        },
        { status: 400 },
      );
    }

    if (
      drawingType !== 'functional_zoning' &&
      drawingType !== 'planting_plan' &&
      !plantingPlanUpload
    ) {
      return Response.json(
        {
          status: 'error',
          error: '缺少植物规划平面图参考，无法生成配套图纸。',
        },
        { status: 400 },
      );
    }

    const editImages = await Promise.all(
      [baseMapUpload, plantingPlanUpload, previousDrawingUpload]
        .filter((image): image is BaseMapUpload => Boolean(image))
        .map((image) =>
          toFile(image.buffer, image.name, {
            type: image.mimeType,
          }),
        ),
    );

    const result =
      await openai.images.edit(
        {
          image: editImages,
          model: 'gpt-image-2',
          prompt: safePrompt,
          size: '1024x1024',
          quality: 'low',
        },
        { timeout: 180000 },
      );

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      return Response.json(
        {
          status: 'error',
          error: 'OpenAI did not return image data',
        },
        { status: 502 },
      );
    }

    return Response.json({
      status: 'success',
      imageUrl: `data:image/png;base64,${imageBase64}`,
      prompt: safePrompt,
      usedPrompt: safePrompt,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const isTimeoutError =
      error instanceof OpenAI.APIConnectionTimeoutError ||
      message.toLowerCase().includes('timeout') ||
      message.toLowerCase().includes('timed out');

    return Response.json(
      {
        status: 'error',
        error: isTimeoutError
          ? '图像生成超时，请重试或缩短 prompt。'
          : message || 'Failed to generate drawing',
        drawingType,
      },
      { status: 500 },
    );
  }
}
