'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { PlantPatch } from '@/types/planting';

const plantTypes = [
  '落叶乔木',
  '常绿乔木',
  '灌木',
  '观花乔灌木',
  '地被',
  '草坪',
  '花境',
];

type EditablePatch = {
  id: string;
  name: string;
  type: string;
  plants: string;
  season: string;
  description: string;
  colorHint: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  colorClassName: string;
};

const initialPatches: EditablePatch[] = [
  {
    id: 'A',
    name: '入口迎宾林带',
    type: '落叶乔木',
    plants: '槐树、白蜡、银杏',
    season: '秋色叶与疏朗林冠',
    description: '沿主入口形成开敞有序的树阵空间，保留视线通廊并强化到达感。',
    colorHint: '柔和绿色',
    x: 12,
    y: 16,
    width: 24,
    height: 28,
    rotation: -8,
    colorClassName: 'bg-green-300/60 border-green-600',
  },
  {
    id: 'B',
    name: '常绿背景群落',
    type: '常绿乔木',
    plants: '油松、白皮松、桧柏',
    season: '冬季常绿背景',
    description: '布置在场地边界，形成稳定背景界面，弱化周边干扰。',
    colorHint: '深绿色',
    x: 64,
    y: 12,
    width: 26,
    height: 34,
    rotation: 5,
    colorClassName: 'bg-emerald-700/40 border-emerald-800',
  },
  {
    id: 'C',
    name: '春花灌木岛',
    type: '观花乔灌木',
    plants: '紫叶李、榆叶梅、连翘',
    season: '春季开花重点',
    description: '位于核心视线节点，形成春季花色焦点与空间转换界面。',
    colorHint: '粉色',
    x: 36,
    y: 32,
    width: 25,
    height: 24,
    rotation: 12,
    colorClassName: 'bg-pink-300/65 border-pink-500',
  },
  {
    id: 'D',
    name: '林下耐阴地被',
    type: '地被',
    plants: '玉簪、麦冬、鸢尾',
    season: '夏季叶色与地被层次',
    description: '布置在林下边缘，补充低层覆盖，降低裸土并丰富近人尺度。',
    colorHint: '黄绿色',
    x: 18,
    y: 64,
    width: 34,
    height: 20,
    rotation: 4,
    colorClassName: 'bg-lime-300/65 border-lime-500',
  },
  {
    id: 'E',
    name: '雨水花境带',
    type: '花境',
    plants: '千屈菜、萱草、宿根鼠尾草',
    season: '夏秋花境连续观赏',
    description: '结合低洼汇水区域，形成兼具观赏与雨洪消纳的植物带。',
    colorHint: '浅紫色',
    x: 53,
    y: 59,
    width: 25,
    height: 23,
    rotation: -10,
    colorClassName: 'bg-violet-300/60 border-violet-500',
  },
  {
    id: 'F',
    name: '开放活动草坪',
    type: '草坪',
    plants: '冷季型草坪、白三叶',
    season: '全年开放活动界面',
    description: '保留中心开敞活动面，为休憩、停留和小型活动提供弹性空间。',
    colorHint: '蓝绿色',
    x: 43,
    y: 54,
    width: 30,
    height: 24,
    rotation: 2,
    colorClassName: 'bg-cyan-300/55 border-cyan-500',
  },
];

type PatchInteraction = {
  id: string;
  mode: 'drag' | 'resize';
  startClientX: number;
  startClientY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function ConfirmPage() {
  const [uploadedBaseMap, setUploadedBaseMap] = useState('');
  const [patches, setPatches] = useState<EditablePatch[]>(initialPatches);
  const patchCanvasRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<PatchInteraction | null>(null);

  useEffect(() => {
    const storedBaseMap = localStorage.getItem('uploadedBaseMap') || '';
    const storedPatches = localStorage.getItem('plantPatches');

    window.setTimeout(() => {
      setUploadedBaseMap(storedBaseMap);

      if (storedPatches) {
        const parsedPatches = JSON.parse(storedPatches) as PlantPatch[];
        setPatches(
          parsedPatches.map((patch, index) => ({
            id: patch.id,
            name: patch.name,
            type: patch.plantType,
            plants: patch.recommendedPlants.join('、'),
            season: patch.seasonalFocus,
            description: patch.spatialDescription,
            colorHint: patch.colorHint || initialPatches[index]?.colorHint || '',
            x: patch.x ?? initialPatches[index]?.x ?? 10,
            y: patch.y ?? initialPatches[index]?.y ?? 10,
            width: patch.width ?? initialPatches[index]?.width ?? 24,
            height: patch.height ?? initialPatches[index]?.height ?? 20,
            rotation: patch.rotation ?? initialPatches[index]?.rotation ?? 0,
            colorClassName: initialPatches[index]?.colorClassName || '',
          })),
        );
      }
    }, 0);
  }, []);

  const updatePatch = (
    id: string,
    field: keyof Omit<
      EditablePatch,
      | 'id'
      | 'x'
      | 'y'
      | 'width'
      | 'height'
      | 'rotation'
      | 'colorClassName'
    >,
    value: string,
  ) => {
    setPatches((current) =>
      current.map((patch) =>
        patch.id === id
          ? {
              ...patch,
              [field]: value,
            }
          : patch,
      ),
    );
  };

  const buildPlantPatches = (): PlantPatch[] =>
    patches.map((patch) => ({
      id: patch.id,
      name: patch.name,
      plantType: patch.type,
      recommendedPlants: patch.plants
        .split(/[、,，]/)
        .map((plant) => plant.trim())
        .filter(Boolean),
      seasonalFocus: patch.season,
      spatialDescription: patch.description,
      colorHint: patch.colorHint,
      x: patch.x,
      y: patch.y,
      width: patch.width,
      height: patch.height,
      rotation: patch.rotation,
    }));

  const savePlantPatches = () => {
    localStorage.setItem('plantPatches', JSON.stringify(buildPlantPatches()));
  };

  const beginPatchInteraction = (
    event: React.PointerEvent<HTMLElement>,
    patch: EditablePatch,
    mode: PatchInteraction['mode'],
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      id: patch.id,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      x: patch.x,
      y: patch.y,
      width: patch.width,
      height: patch.height,
    };
  };

  const movePatchInteraction = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    const canvasRect = patchCanvasRef.current?.getBoundingClientRect();

    if (!interaction || !canvasRect) return;

    const deltaX = ((event.clientX - interaction.startClientX) / canvasRect.width) * 100;
    const deltaY =
      ((event.clientY - interaction.startClientY) / canvasRect.height) * 100;

    setPatches((current) =>
      current.map((patch) => {
        if (patch.id !== interaction.id) return patch;

        if (interaction.mode === 'resize') {
          return {
            ...patch,
            width: clamp(interaction.width + deltaX, 12, 100 - interaction.x),
            height: clamp(interaction.height + deltaY, 10, 100 - interaction.y),
          };
        }

        return {
          ...patch,
          x: clamp(interaction.x + deltaX, 0, 100 - interaction.width),
          y: clamp(interaction.y + deltaY, 0, 100 - interaction.height),
        };
      }),
    );
  };

  const endPatchInteraction = () => {
    interactionRef.current = null;
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] pb-28 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-medium tracking-[0.25em] text-green-700">
              PLANTING PLAN CONFIRMATION
            </p>
            <h1 className="mt-2 text-3xl font-semibold">植物规划确认</h1>
          </div>

          <Link
            href="/"
            className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600 transition hover:bg-stone-100"
          >
            返回首页
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1500px] grid-cols-1 gap-8 px-6 py-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.9fr)]">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">01 场地底图与植物斑块</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                {uploadedBaseMap
                  ? '当前使用上传底图，半透明色块表示不同植物群落配置区域。'
                  : '当前为 mock 场地底图，半透明色块表示不同植物群落配置区域。'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {plantTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full border border-green-100 bg-green-50 px-4 py-2 text-xs font-medium text-green-800"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div
            ref={patchCanvasRef}
            onPointerMove={movePatchInteraction}
            onPointerUp={endPatchInteraction}
            onPointerCancel={endPatchInteraction}
            className="relative h-[620px] overflow-hidden rounded-2xl border border-stone-200 bg-[#e9e2d3]"
          >
            {uploadedBaseMap ? (
              <img
                src={uploadedBaseMap}
                alt="上传底图"
                className="absolute inset-0 h-full w-full bg-white object-contain"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,113,108,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,113,108,0.14)_1px,transparent_1px)] bg-[size:52px_52px]" />

                <div className="absolute left-[8%] top-[10%] h-[78%] w-[84%] rounded-[48%] border-2 border-dashed border-stone-400/35" />

                <div className="absolute left-[10%] top-[48%] h-8 w-[72%] rotate-[-1deg] rounded-full bg-stone-300/55" />
                <div className="absolute left-[47%] top-[8%] h-[80%] w-10 rotate-[5deg] rounded-full bg-stone-300/40" />

                <div className="absolute left-[10%] bottom-[12%] h-28 w-44 rounded-2xl border border-stone-300 bg-white/55" />
                <div className="absolute right-[8%] top-[12%] h-28 w-44 rounded-2xl border border-stone-300 bg-white/55" />

                <div className="absolute left-[38%] top-[39%] h-36 w-36 rounded-full bg-sky-300/35" />
              </>
            )}

            {patches.map((patch) => (
              <div
                key={patch.id}
                onPointerDown={(event) =>
                  beginPatchInteraction(event, patch, 'drag')
                }
                className={`absolute cursor-grab touch-none rounded-[36%] border-2 shadow-sm backdrop-blur-[1px] active:cursor-grabbing ${patch.colorClassName}`}
                style={{
                  left: `${patch.x}%`,
                  top: `${patch.y}%`,
                  width: `${patch.width}%`,
                  height: `${patch.height}%`,
                  transform: `rotate(${patch.rotation}deg)`,
                }}
              >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm">
                  {patch.id} · {patch.name}
                </div>
                <button
                  type="button"
                  aria-label={`缩放斑块 ${patch.name}`}
                  onPointerDown={(event) =>
                    beginPatchInteraction(event, patch, 'resize')
                  }
                  className="absolute -bottom-1 -right-1 h-5 w-5 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-green-800 shadow"
                />
              </div>
            ))}

            <div className="absolute bottom-6 right-6 rounded-2xl border border-stone-200 bg-white/90 p-5 text-sm shadow-sm">
              <p className="font-semibold text-stone-900">底图图例</p>
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-stone-600">
                <span>灰色：道路</span>
                <span>浅灰：建筑</span>
                <span>蓝色：水体</span>
                <span>彩色：植物斑块</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">02 植物斑块编辑列表</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              编辑植物斑块信息，左侧标签与后续生成 prompt 会同步使用当前内容。
            </p>
          </div>

          <div className="max-h-[680px] space-y-5 overflow-y-auto pr-2">
            {patches.map((patch) => (
              <article
                key={patch.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-green-700">
                      斑块 {patch.id}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-stone-900">
                      {patch.name}
                    </h3>
                  </div>

                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs text-stone-600">
                    {patch.type}
                  </span>
                </div>

                <div className="space-y-4 text-sm leading-6">
                  <div>
                    <label className="font-semibold text-stone-900">
                      斑块名称
                    </label>
                    <input
                      value={patch.name}
                      onChange={(event) =>
                        updatePatch(patch.id, 'name', event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-900">
                      植物类型
                    </label>
                    <select
                      value={patch.type}
                      onChange={(event) =>
                        updatePatch(patch.id, 'type', event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                    >
                      {plantTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-900">
                      推荐植物
                    </label>
                    <input
                      value={patch.plants}
                      onChange={(event) =>
                        updatePatch(patch.id, 'plants', event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-900">
                      季相重点
                    </label>
                    <input
                      value={patch.season}
                      onChange={(event) =>
                        updatePatch(patch.id, 'season', event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-900">
                      空间描述
                    </label>
                    <textarea
                      value={patch.description}
                      onChange={(event) =>
                        updatePatch(
                          patch.id,
                          'description',
                          event.target.value,
                        )
                      }
                      rows={3}
                      className="mt-1 w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-900">
                      色彩提示
                    </label>
                    <input
                      value={patch.colorHint}
                      onChange={(event) =>
                        updatePatch(patch.id, 'colorHint', event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="sticky bottom-0 z-20 border-t border-stone-200 bg-white/90 px-6 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              03 确认生成
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              确认植物斑块、植物类型与季相重点后，进入植物规划套图生成流程。
            </p>
          </div>

          <Link
            href="/results"
            onClick={savePlantPatches}
            className="rounded-full bg-green-800 px-8 py-4 text-center text-sm font-semibold text-white transition hover:bg-green-900"
          >
            确认植物规划并生成套图
          </Link>
        </div>
      </section>
    </main>
  );
}
