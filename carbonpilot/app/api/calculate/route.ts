import { NextResponse } from 'next/server';

const ADK_API_BASE = process.env.ADK_API_BASE ?? 'http://localhost:8000';
const APP_NAME = process.env.ADK_APP_NAME ?? 'pilot';
const DEFAULT_USER_ID = process.env.ADK_DEFAULT_USER_ID ?? 'carbonpilot_user';

type CarbonPilotRequest = {
  scenario: string;
  dataSnapshot: string;
  goal?: string;
  urgency?: 'immediate' | 'quarter' | 'long-term' | string;
};

type AgentInsight = {
  raw: string | null;
  parsed: unknown | null;
};

type AgentResponsePayload = {
  ok: boolean;
  data?: {
    analysis: AgentInsight;
    optimization: AgentInsight;
    finalPlan: AgentInsight;
    metadata: Record<string, unknown>;
  };
  error?: string;
};

const jsonHeaders = { 'Content-Type': 'application/json' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

async function ensureSession(userId: string, sessionId: string) {
  const sessionUrl = `${ADK_API_BASE}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`;

  const response = await fetch(sessionUrl, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      state: {
        initialized: true,
        sessionId,
        createdAt: new Date().toISOString(),
      },
    }),
  });

  if (!response.ok && response.status !== 409) {
    const message = await response.text();
    throw new Error(`Session bootstrap failed (${response.status}): ${message}`);
  }
}

async function fetchSessionState(userId: string, sessionId: string) {
  const url = `${ADK_API_BASE}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}/state`;
  const response = await fetch(url, { method: 'GET', headers: jsonHeaders });

  if (!response.ok) {
    return null;
  }

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildUserMessage(payload: CarbonPilotRequest) {
  const { scenario, dataSnapshot, goal, urgency } = payload;

  return [
    'You are the Carbon Pilot orchestrator. Analyze the provided manufacturing scenario and guide the analyzer + optimizer agents.',
    '',
    '## Scenario',
    scenario.trim(),
    '',
    '## Data Snapshot',
    dataSnapshot.trim(),
    goal ? `\n## Sustainability Goal\n${goal.trim()}` : '',
    urgency ? `\n## Urgency\n${urgency}` : '',
    '',
    'Focus on surfacing actionable analysis + optimization opportunities for carbon reduction.',
  ]
    .filter(Boolean)
    .join('\n');
}

function tryParseJson(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function normalizeInsight(value: unknown): AgentInsight {
  if (!value) {
    return { raw: null, parsed: null };
  }

  if (typeof value === 'object') {
    return {
      raw: JSON.stringify(value, null, 2),
      parsed: value,
    };
  }

  if (typeof value === 'string') {
    const parsed = tryParseJson(value);
    return {
      raw: value.trim(),
      parsed,
    };
  }

  return {
    raw: String(value),
    parsed: null,
  };
}

function pluckStateValue(key: string, ...sources: unknown[]) {
  for (const source of sources) {
    if (!source) continue;

    if (Array.isArray(source)) {
      for (const entry of source) {
        if (!isRecord(entry)) continue;
        const actions = entry.actions;
        if (!isRecord(actions)) continue;
        const delta = actions.state_delta;
        if (isRecord(delta) && key in delta) {
          return delta[key];
        }
      }
      continue;
    }

    if (isRecord(source)) {
      if (key in source) {
        return source[key];
      }
      const state = source.state;
      if (isRecord(state) && key in state) {
        return state[key];
      }
    }
  }

  return null;
}

function buildAgentPayload(userMessage: string, userId: string, sessionId: string) {
  return {
    app_name: APP_NAME,
    user_id: userId,
    session_id: sessionId,
    new_message: {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CarbonPilotRequest>;

    if (!body?.scenario || !body?.dataSnapshot) {
      return NextResponse.json<AgentResponsePayload>(
        { ok: false, error: 'Scenario and data snapshot are required.' },
        { status: 400 },
      );
    }

    const userId = DEFAULT_USER_ID;
    const sessionId = `session_${Date.now()}`;
    const userMessage = buildUserMessage(body as CarbonPilotRequest);

    await ensureSession(userId, sessionId);

    const agentResponse = await fetch(`${ADK_API_BASE}/run`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(buildAgentPayload(userMessage, userId, sessionId)),
    });

    if (!agentResponse.ok) {
      const message = await agentResponse.text();
      throw new Error(`Agent server error (${agentResponse.status}): ${message}`);
    }

    const agentData = await agentResponse.json();
    const sessionState = await fetchSessionState(userId, sessionId);

    const analysisValue = pluckStateValue('analysis_results', sessionState, agentData);
    const optimizationValue = pluckStateValue('optimization_plan', sessionState, agentData);
    const finalPlanValue = pluckStateValue('final_plan', sessionState, agentData);

    return NextResponse.json<AgentResponsePayload>({
      ok: true,
      data: {
        analysis: normalizeInsight(analysisValue),
        optimization: normalizeInsight(optimizationValue),
        finalPlan: normalizeInsight(finalPlanValue),
        metadata: {
          sessionId,
          userId,
          appName: APP_NAME,
          collectedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('[CarbonPilot][API] Error:', error);

    const message =
      error instanceof Error ? error.message : 'Failed to run Carbon Pilot agent pipeline.';

    return NextResponse.json<AgentResponsePayload>(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${ADK_API_BASE}/health`);
    return NextResponse.json({
      ok: true,
      agentServer: {
        url: ADK_API_BASE,
        healthy: response.ok,
        appName: APP_NAME,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        agentServer: {
          url: ADK_API_BASE,
          healthy: false,
          appName: APP_NAME,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 },
    );
  }
}

