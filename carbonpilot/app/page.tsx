'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Factory,
  GaugeCircle,
  LineChart,
  Loader2,
  Sparkles,
} from 'lucide-react';

type FormState = {
  scenario: string;
  dataSnapshot: string;
  goal: string;
  urgency: 'immediate' | 'quarter' | 'long-term';
};

type AgentInsight = {
  raw: string | null;
  parsed: unknown | null;
};

type AgentSuccessPayload = {
  analysis: AgentInsight;
  optimization: AgentInsight;
  finalPlan: AgentInsight;
  metadata: Record<string, unknown>;
};

type ApiResponse =
  | { ok: true; data: AgentSuccessPayload }
  | { ok: false; error: string };

const DEFAULT_FORM: FormState = {
  scenario: `The recent product carbon footprint analysis reveals a critical need for focused sustainability intervention, particularly given the Steel Frame component accounts for over two-thirds ($68.4\%$) of the total calculated emissions. While this data successfully pinpoints high-impact material types like Steel, the failure to process an item due to the absence of 'Vibranium' in the database underscores a major operational gap. Immediate priority must be placed on both sourcing lower-carbon alternatives for the dominant steel material and ensuring comprehensive emission factor coverage for all materials used, thereby guaranteeing the integrity and completeness of the final environmental inventory.
`,
  dataSnapshot: `{
  "summary": {
    "totalProducts": 4,
    "successfulCalculations": 3,
    "failedCalculations": 1,
    "totalEmissions": 8110,
    "totalWeight": 3450,
    "averageEmissionsPerProduct": 2703.33
  },
  "results": [
    {
      "productName": "Steel Frame",
      "materialType": "Steel",
      "weight": 15,
      "quantity": 200,
      "totalWeight": 3000,
      "materialEmissions": 5550,
      "emissionFactor": 1.85,
      "unit": "kg CO2e"
    },
    {
      "productName": "Plastic Case",
      "materialType": "Plastic",
      "weight": 0.5,
      "quantity": 500,
      "totalWeight": 250,
      "materialEmissions": 1500,
      "emissionFactor": 6,
      "unit": "kg CO2e"
    },
    {
      "productName": "Cotton T-Shirt",
      "materialType": "Cotton",
      "weight": 0.2,
      "quantity": 1000,
      "totalWeight": 200,
      "materialEmissions": 1060,
      "emissionFactor": 5.3,
      "unit": "kg CO2e"
    }
  ],
  "errors": [
    {
      "productName": "Unknown Material Item",
      "error": "Material type \"Vibranium\" not found in database"
    }
  ]
}`,
  goal: `Analyze the following sustainability targets for a manufacturing operation and outline the three most critical strategic initiatives required to achieve them. The primary goal is to significantly reduce the carbon intensity of goods and eliminate data calculation errors. Targets include: 1) A 15% reduction in the emission factor for Steel (from $1.85$ to $\le 1.57 \text{ kg } \text{CO}_2\text{e}$/kg), which is the largest contributor ($68.4\%$); 2) Achieving a $100\%$ successful calculation rate by integrating all missing material emission factors; and 3) Piloting sustainable sourcing to reduce Cotton T-Shirt emissions by $5\%$ (from $1,060$ to $\le 1,007 \text{ kg } \text{CO}_2\text{e}$). The output should be a prioritized list of three initiatives with brief justifications.`,
  urgency: 'quarter',
};

const AGENT_PHASES = [
  {
    key: 'analysis',
    title: 'Analyzer Agent',
    description: 'Categorizes carbon drivers & identifies priority materials.',
  },
  {
    key: 'optimization',
    title: 'Optimizer Agent',
    description: 'Generates targeted strategies across materials & suppliers.',
  },
  {
    key: 'finalPlan',
    title: 'Loop Agent',
    description: 'Aligns recommendations with demo business requirements.',
  },
] as const;

const TICKER_MESSAGES = [
  '📡 Calibrating emission sensors…',
  '🧠 Mapping analyzer context to Gemini 2.0 Flash…',
  '🔁 Syncing optimization feedback loop…',
  '📦 Evaluating supplier alternatives…',
  '🚀 Finalizing orchestration output…',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const arrayLength = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (isRecord(value) && Array.isArray(value.items)) {
    return value.items.length;
  }
  return 0;
};

const cleanseJsonText = (value: string) =>
  value.replace(/```json/gi, '').replace(/```/g, '').trim();

const safeParseJson = (value: unknown): Record<string, unknown> | null => {
  if (isRecord(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(cleanseJsonText(value));
  } catch {
    return null;
  }
};

export default function Home() {
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentSuccessPayload | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [tickerMessage, setTickerMessage] = useState(TICKER_MESSAGES[0]);

  useEffect(() => {
    if (!loading) {
      setTickerMessage('Ready for the next scenario');
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      setTickerMessage(TICKER_MESSAGES[i % TICKER_MESSAGES.length]);
      i += 1;
    }, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const runCarbonPilot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.scenario.trim() || !formData.dataSnapshot.trim()) {
      setError('Provide both a scenario overview and a data snapshot to run the pipeline.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const body = (await response.json()) as ApiResponse;

      if (!body.ok) {
        throw new Error(body.error ?? 'Agent invocation failed.');
      }

      setResult(body.data);
    } catch (agentError) {
      setError(agentError instanceof Error ? agentError.message : 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(section);
      setTimeout(() => setCopied(null), 2200);
    } catch (copyError) {
      console.error('Clipboard error:', copyError);
    }
  };

  const insightToString = (insight: AgentInsight | null) => {
    if (!insight) return 'Awaiting agent output…';

    const parsed =
      (insight.parsed && safeParseJson(insight.parsed)) || safeParseJson(insight.raw);

    if (parsed) {
      return JSON.stringify(parsed, null, 2);
    }

    return insight.raw ?? 'Awaiting agent output…';
  };

  const parsedOptimization = useMemo(() => {
    if (!result?.optimization) {
      return null;
    }

    if (isRecord(result.optimization.parsed)) {
      return result.optimization.parsed;
    }

    return safeParseJson(result.optimization.raw);
  }, [result?.optimization]);

  const aggregatedImpactCount = useMemo(() => {
    if (!parsedOptimization) {
      return null;
    }

    const analysis = isRecord(parsedOptimization.analysis)
      ? parsedOptimization.analysis
      : parsedOptimization;

    const counts = { high: 0, medium: 0, low: 0 };
    console.log("analysis", analysis)
    const impactAnalysisSources = [
      isRecord(analysis.impact_analysis) ? analysis.impact_analysis : null,
      isRecord(parsedOptimization.impact_analysis) ? parsedOptimization.impact_analysis : null,
    ].filter(Boolean) as Record<string, unknown>[];

    for (const source of impactAnalysisSources) {
      counts.high = Math.max(counts.high, arrayLength(source.high_impact));
      counts.medium = Math.max(counts.medium, arrayLength(source.medium_impact));
      counts.low = Math.max(counts.low, arrayLength(source.low_impact));
    }
    console.log("counts", counts)
    if (counts.high || counts.medium || counts.low) {
      return counts;
    }

    const productSources = [
      Array.isArray(analysis.product_analysis) ? analysis.product_analysis : null,
      Array.isArray(parsedOptimization.product_analysis) ? parsedOptimization.product_analysis : null,
    ].filter(Boolean) as Array<Record<string, unknown>>[];

    for (const list of productSources) {
      list.forEach((entry) => {
        if (!isRecord(entry)) return;
        const impactLevel = String(entry.impact_level ?? '').toLowerCase();
        if (impactLevel.includes('high')) counts.high += 1;
        else if (impactLevel.includes('medium')) counts.medium += 1;
        else if (impactLevel.includes('low')) counts.low += 1;
      });
    }

    if (counts.high || counts.medium || counts.low) {
      return counts;
    }

    return null;
  }, [parsedOptimization]);

  const phaseStatus = (key: (typeof AGENT_PHASES)[number]['key']) => {
    if (result) {
      const section = result[key];
      if (section && (section.raw || section.parsed)) {
        return 'complete';
      }
    }
    return loading ? 'running' : 'idle';
  };

  const renderInsightCard = (
    key: string,
    title: string,
    insight: AgentInsight | null,
    accent: string,
    Icon: typeof LineChart,
  ) => {
    const text = insightToString(insight);

    return (
      <section className={`rounded-2xl border ${accent} bg-white/80 backdrop-blur shadow-sm`}>
        <header className="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-black/5 p-2">
              <Icon className="h-5 w-5 text-slate-700" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500">Agent Output</p>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(text, key)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            {copied === key ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </header>
        <div className="max-h-[420px] overflow-y-auto px-6 py-4 text-sm leading-relaxed text-slate-800">
          {text ? (
            <pre className="whitespace-pre-wrap rounded-xl bg-slate-50/80 p-4 text-left font-mono text-xs text-slate-900 shadow-inner">
              {text}
            </pre>
          ) : (
            <p className="text-slate-500">Awaiting agent output…</p>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="carbon-grid min-h-screen px-4 py-8 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
        {/* Intake Form */}
        <aside className="lg:w-[32%]">
          <div className="sticky top-6 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-400/20 p-3">
                <Factory className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Carbon Pilot</p>
                <h1 className="text-2xl font-semibold text-white">Scenario Console</h1>
              </div>
            </div>

            <form className="space-y-5" onSubmit={runCarbonPilot}>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                  Scenario Overview *
                </span>
                <textarea
                  name="scenario"
                  value={formData.scenario}
                  onChange={handleInputChange}
                  placeholder="Describe the plant, production line, or business objective driving this analysis."
                  rows={4}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white placeholder:text-white/50 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                  Data Snapshot *
                </span>
                <textarea
                  name="dataSnapshot"
                  value={formData.dataSnapshot}
                  onChange={handleInputChange}
                  placeholder="List the pre-calculated emission values, product names, material mixes, and supporting metrics."
                  rows={6}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white placeholder:text-white/50 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                  Sustainability Goal
                </span>
                <textarea
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  placeholder="e.g., Cut Category 3 emissions by 15% in FY26, prioritize recycled aluminum, etc."
                  rows={3}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white placeholder:text-white/50 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                  Urgency
                </span>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="immediate" className="bg-slate-900 text-white">
                    Immediate Hotfix
                  </option>
                  <option value="quarter" className="bg-slate-900 text-white">
                    This Quarter
                  </option>
                  <option value="long-term" className="bg-slate-900 text-white">
                    Long-Term Transformation
                  </option>
                </select>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-3 text-base font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-400/60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Running agents…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Run Carbon Pilot
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
              {loading ? 'Multi-agent pipeline active' : 'Standing by'} — {tickerMessage}
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400 bg-red-500/10 p-4 text-sm text-red-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold text-red-200">Pipeline error</p>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Agent Output */}
        <main className="flex-1 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Agent Control</p>
                <h2 className="text-3xl font-semibold text-white">Real-time Orchestration</h2>
                <p className="mt-2 text-sm text-white/70">
                  Analyzer ➜ Optimizer ➜ Loop agent flow mirrored from the LinkedIn reference implementation.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-3 text-right text-white">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Session</p>
                <p className="text-lg font-semibold">{result?.metadata?.sessionId ?? '—'}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">High Impact</p>
                <p className="text-3xl font-semibold">{aggregatedImpactCount?.high ?? 0}</p>
                <p className="text-sm text-white/60">Products flagged</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Medium Impact</p>
                <p className="text-3xl font-semibold">{aggregatedImpactCount?.medium ?? 0}</p>
                <p className="text-sm text-white/60">Products flagged</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Low Impact</p>
                <p className="text-3xl font-semibold">{aggregatedImpactCount?.low ?? 0}</p>
                <p className="text-sm text-white/60">Products with minimal risk</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {AGENT_PHASES.map((phase) => {
                const status = phaseStatus(phase.key);
                return (
                  <div
                    key={phase.key}
                    className={`rounded-2xl border p-4 ${
                      status === 'complete'
                        ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-50'
                        : status === 'running'
                        ? 'border-amber-300/40 bg-amber-300/10 text-amber-50'
                        : 'border-white/10 bg-white/5 text-white/70'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.4em]">
                      {status === 'complete' ? 'Complete' : status === 'running' ? 'Running' : 'Queued'}
                    </p>
                    <p className="mt-2 text-xl font-semibold">{phase.title}</p>
                    <p className="mt-1 text-sm">{phase.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
              <p className="text-lg font-semibold">Agents are synthesizing insights…</p>
              <p className="text-sm text-white/60">
                Analyzer feeds Optimizer, which then hands context to the Loop Agent for business alignment.
              </p>
            </div>
          )}

          {!loading && !result && (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-white/70">
              Feed the console to see analyzer, optimizer, and loop agent outputs serialized just like the LinkedIn reference build.
            </div>
          )}

          {!loading && result && (
            <div className="space-y-6">
              {renderInsightCard('analysis', 'Analyzer Output', result.analysis, 'border-emerald-100', LineChart)}
              {renderInsightCard('optimization', 'Optimizer Output', result.optimization, 'border-blue-100', GaugeCircle)}
              {renderInsightCard('finalPlan', 'Loop Agent Output', result.finalPlan, 'border-purple-100', Sparkles)}
            </div>
          )}

          {!loading && result && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Metadata</p>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-white/60">Session</p>
                  <p className="text-lg font-semibold text-white">{result.metadata.sessionId as string}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">User</p>
                  <p className="text-lg font-semibold text-white">{(result.metadata.userId as string) ?? 'carbonpilot_user'}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Collected</p>
                  <p className="text-lg font-semibold text-white">
                    {result.metadata.collectedAt
                      ? new Date(result.metadata.collectedAt as string).toLocaleString()
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

