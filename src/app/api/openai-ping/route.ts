import OpenAI from 'openai';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

type OpenAIErrorDetails = {
  error: string;
  name?: string;
  statusCode?: number;
  code?: string;
  type?: string;
};

function getErrorDetails(error: unknown): OpenAIErrorDetails {
  if (error instanceof OpenAI.APIError) {
    return {
      error: error.message,
      name: error.name,
      statusCode: error.status,
      code: error.code ?? undefined,
      type: error.type ?? undefined,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      name: error.name,
    };
  }

  return {
    error: 'Unknown OpenAI connection error',
  };
}

function configureOpenAIProxy() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

  if (proxyUrl) {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
  }
}

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        error: 'Missing OPENAI_API_KEY',
      },
      { status: 500 },
    );
  }

  configureOpenAIProxy();

  const openai = new OpenAI({ apiKey });

  try {
    const models = await openai.models.list();
    const modelIds = models.data.map((model) => model.id);

    return Response.json({
      ok: true,
      modelCount: modelIds.length,
      firstModels: modelIds.slice(0, 10),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        ...getErrorDetails(error),
      },
      { status: 500 },
    );
  }
}
