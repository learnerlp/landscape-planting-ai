'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type SiteType =
  | 'residential'
  | 'commercial'
  | 'park'
  | 'campus'
  | 'institutional'
  | 'other';

type DesignTheme =
  | 'modern'
  | 'classical'
  | 'natural'
  | 'tropical'
  | 'japanese'
  | 'english';

type PlantStyle =
  | 'native'
  | 'mixed'
  | 'seasonal'
  | 'flowering'
  | 'lowMaintenance'
  | 'ecological';

const supportedBaseMapTypes = ['image/jpeg', 'image/png', 'image/webp'];
const baseMapMaxSize = 1400;
const baseMapQuality = 0.72;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error('Failed to load uploaded image'));
    };

    image.src = src;
  });
}

function readFileAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Invalid file data URL'));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read uploaded file'));
    };

    reader.readAsDataURL(file);
  });
}

async function compressImageFile(file: File) {
  const originalDataUrl = await readFileAsDataURL(file);
  const image = await loadImage(originalDataUrl);
  const scale = Math.min(
    1,
    baseMapMaxSize / image.naturalWidth,
    baseMapMaxSize / image.naturalHeight,
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas is not available');
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', baseMapQuality);
}

function isQuotaExceededError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

async function saveBaseMapFile(file: File) {
  if (!supportedBaseMapTypes.includes(file.type)) return '';

  const dataUrl = await compressImageFile(file);

  localStorage.removeItem('uploadedBaseMap');

  try {
    localStorage.setItem('uploadedBaseMap', dataUrl);
    return dataUrl;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error('图片过大，请上传较小图片或压缩后再试。');
    }

    throw error;
  }
}

export default function Home() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [projectName, setProjectName] = useState('');
  const [siteType, setSiteType] = useState<SiteType>('park');
  const [designTheme, setDesignTheme] = useState<DesignTheme>('natural');
  const [plantStyle, setPlantStyle] = useState<PlantStyle>('native');
  const [keepRoads, setKeepRoads] = useState(true);
  const [keepBuildings, setKeepBuildings] = useState(true);
  const [generateLabels, setGenerateLabels] = useState(true);
  const [generateLegend, setGenerateLegend] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedBaseMap, setUploadedBaseMap] = useState('');
  const [uploadError, setUploadError] = useState('');

  const persistBaseMapFile = (file: File) => {
    setUploadError('');

    void saveBaseMapFile(file)
      .then(setUploadedBaseMap)
      .catch((error: unknown) => {
        setUploadedBaseMap('');
        setUploadError(
          error instanceof Error
            ? error.message
            : '图片过大，请上传较小图片或压缩后再试。',
        );
      });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const nextFiles = Array.from(event.target.files);
    setFiles(nextFiles);

    const baseMapFile = nextFiles.find((file) =>
      supportedBaseMapTypes.includes(file.type),
    );

    if (baseMapFile) {
      persistBaseMapFile(baseMapFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (!event.dataTransfer.files) return;
    const nextFiles = Array.from(event.dataTransfer.files);
    setFiles(nextFiles);

    const baseMapFile = nextFiles.find((file) =>
      supportedBaseMapTypes.includes(file.type),
    );

    if (baseMapFile) {
      persistBaseMapFile(baseMapFile);
    }
  };

  const canGenerate = files.length > 0 && projectName.trim().length > 0;

  const saveProjectState = () => {
    localStorage.setItem(
      'plantingProjectState',
      JSON.stringify({
        projectName,
        siteType,
        designTheme,
        plantStyle,
        keepRoads,
        keepBuildings,
        generateLabels,
        generateLegend,
      }),
    );
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    saveProjectState();

    let nextUploadedBaseMap =
      uploadedBaseMap || localStorage.getItem('uploadedBaseMap') || '';

    if (!nextUploadedBaseMap) {
      const baseMapFile = files.find((file) =>
        supportedBaseMapTypes.includes(file.type),
      );

      if (baseMapFile) {
        try {
          nextUploadedBaseMap = await saveBaseMapFile(baseMapFile);
          setUploadedBaseMap(nextUploadedBaseMap);
        } catch (error) {
          setUploadError(
            error instanceof Error
              ? error.message
              : '图片过大，请上传较小图片或压缩后再试。',
          );
          return;
        }
      }
    }

    if (!nextUploadedBaseMap) return;

    router.push('/confirm');
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#1f2933]">
      {/* Top Bar */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-medium tracking-[0.25em] text-green-700">
              LANDSCAPE PLANTING AI
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900">
              园林植物规划套图生成工具
            </h1>
          </div>

          <div className="hidden rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600 md:block">
            斑块规划 · 季相图 · 群落图 · 剖面图 · 分层图 · 意象图
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.9fr)]">
          {/* Upload Panel */}
          <section className="min-w-0 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-stone-900">
                01 上传基础图纸
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                上传总平图、植物规划草图或场地底图。第一版先用于前端原型展示，后续再接入图像识别与生成接口。
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                isDragging
                  ? 'border-green-500 bg-green-50'
                  : 'border-stone-300 bg-stone-50 hover:border-green-500 hover:bg-green-50'
              }`}
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                <span className="text-3xl">↑</span>
              </div>

              <p className="text-base font-medium text-stone-900">
                拖拽图纸到这里，或点击上传
              </p>
              <p className="mt-2 text-sm text-stone-500">
                支持 JPG、PNG、PDF。建议上传清晰的场地总平面。
              </p>

              <input
                id="file-upload"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <label
                htmlFor="file-upload"
                className="mt-6 cursor-pointer rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-800"
              >
                选择文件
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-3 text-sm font-medium text-stone-900">
                  已上传文件
                </p>

                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm"
                    >
                      <span className="truncate text-stone-700">
                        {file.name}
                      </span>
                      <span className="ml-4 shrink-0 text-xs text-stone-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-900">建议上传内容</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-green-800">
                <li>• 场地总平面图</li>
                <li>• 道路与建筑边界清晰的底图</li>
                <li>• 已有植物规划草图或手绘方案</li>
              </ul>
            </div>
          </section>

          {/* Parameter Panel */}
          <section className="min-w-0 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm xl:min-w-[420px]">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-stone-900">
                02 填写规划参数
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                这些参数将用于后续生成植物斑块、植物类型、季相重点和套图 prompt。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block whitespace-nowrap text-sm font-medium text-stone-900">
                  项目名称
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="例如：校园入口植物景观提升设计"
                  className="w-full min-w-0 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block whitespace-nowrap text-sm font-medium text-stone-900">
                  场地类型
                </label>
                <select
                  value={siteType}
                  onChange={(event) =>
                    setSiteType(event.target.value as SiteType)
                  }
                  className="w-full min-w-0 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                >
                  <option value="residential">住宅区</option>
                  <option value="commercial">商业街区</option>
                  <option value="park">城市公园</option>
                  <option value="campus">校园绿地</option>
                  <option value="institutional">机构园区</option>
                  <option value="other">其他场地</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block whitespace-nowrap text-sm font-medium text-stone-900">
                  设计主题
                </label>
                <select
                  value={designTheme}
                  onChange={(event) =>
                    setDesignTheme(event.target.value as DesignTheme)
                  }
                  className="w-full min-w-0 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                >
                  <option value="modern">现代简洁</option>
                  <option value="classical">古典中式</option>
                  <option value="natural">自然生态</option>
                  <option value="tropical">热带风格</option>
                  <option value="japanese">日式庭园</option>
                  <option value="english">英式花园</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block whitespace-nowrap text-sm font-medium text-stone-900">
                  植物风格
                </label>
                <select
                  value={plantStyle}
                  onChange={(event) =>
                    setPlantStyle(event.target.value as PlantStyle)
                  }
                  className="w-full min-w-0 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                >
                  <option value="native">乡土植物为主</option>
                  <option value="mixed">乔灌草复合群落</option>
                  <option value="seasonal">四季季相变化</option>
                  <option value="flowering">观花植物突出</option>
                  <option value="lowMaintenance">低维护植物群落</option>
                  <option value="ecological">生态自然式种植</option>
                </select>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-stone-200 bg-stone-50 p-5">
              <h3 className="mb-4 text-sm font-semibold text-stone-900">
                生成控制
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
                  <span className="whitespace-nowrap text-sm text-stone-700">
                    保留道路系统
                  </span>
                  <input
                    type="checkbox"
                    checked={keepRoads}
                    onChange={(event) => setKeepRoads(event.target.checked)}
                    className="h-4 w-4 accent-green-700"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
                  <span className="whitespace-nowrap text-sm text-stone-700">
                    保留建筑边界
                  </span>
                  <input
                    type="checkbox"
                    checked={keepBuildings}
                    onChange={(event) =>
                      setKeepBuildings(event.target.checked)
                    }
                    className="h-4 w-4 accent-green-700"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
                  <span className="whitespace-nowrap text-sm text-stone-700">
                    生成植物标签
                  </span>
                  <input
                    type="checkbox"
                    checked={generateLabels}
                    onChange={(event) =>
                      setGenerateLabels(event.target.checked)
                    }
                    className="h-4 w-4 accent-green-700"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
                  <span className="whitespace-nowrap text-sm text-stone-700">
                    生成植物图例
                  </span>
                  <input
                    type="checkbox"
                    checked={generateLegend}
                    onChange={(event) =>
                      setGenerateLegend(event.target.checked)
                    }
                    className="h-4 w-4 accent-green-700"
                  />
                </label>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-stone-200 p-5">
              <h3 className="text-sm font-semibold text-stone-900">
                后续生成内容
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {[
                  '植物规划平面图',
                  '植物季相图',
                  '局部群落图',
                  '场地剖面图',
                  '植物分层图',
                  '意象效果图',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl bg-stone-50 px-3 py-3 text-center text-xs font-medium text-stone-600"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Action */}
        <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                03 进入植物规划确认
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                下一步将生成可编辑的植物斑块、植物类型、推荐植物和季相重点。
              </p>

              {!canGenerate && (
                <p className="mt-3 text-sm text-amber-700">
                  请先上传至少一张图纸，并填写项目名称。
                </p>
              )}

              {uploadError && (
                <p className="mt-3 text-sm text-red-600">{uploadError}</p>
              )}
            </div>

            <button
              disabled={!canGenerate}
              onClick={handleGenerate}
              className="rounded-full bg-green-800 px-8 py-4 text-sm font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              开始生成植物规划
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
