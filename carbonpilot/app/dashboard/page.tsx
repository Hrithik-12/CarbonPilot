'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingDown, TrendingUp, Target, Zap, Sparkles } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

type DashboardData = {
  analysis: any;
  optimization: any;
  finalPlan: any;
  metadata: Record<string, unknown>;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    // Get data from sessionStorage
    const storedData = sessionStorage.getItem('carbonPilotResults');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      console.log('[Dashboard] Raw stored data:', parsed);
      setData(parsed);
    }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Helper function to safely parse JSON strings
  const safeParse = (value: any): any => {
    if (!value) return null;
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try {
        // Remove markdown code blocks if present
        const cleaned = value.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Parse analysis data with multiple fallback strategies
  let analysisData = safeParse(data.analysis?.parsed) || safeParse(data.analysis?.raw);
  console.log('[Dashboard] Parsed analysis:', analysisData);

  // Try multiple paths to find the analysis results
  const analysisResults = 
    analysisData?.analysis_results || 
    analysisData?.analysis?.categories || 
    analysisData;

  const highImpact = analysisResults?.high_impact || [];
  const mediumImpact = analysisResults?.medium_impact || [];
  const lowImpact = analysisResults?.low_impact || [];

  console.log('[Dashboard] Impact counts:', { high: highImpact.length, medium: mediumImpact.length, low: lowImpact.length });

  // Calculate total emissions
  const totalEmissions = [...highImpact, ...mediumImpact, ...lowImpact].reduce(
    (sum: number, item: any) => sum + (item.absolute_emissions || item.total_emissions || 0),
    0
  );

  const maxEmission = Math.max(
    ...highImpact.map((p: any) => p.absolute_emissions || p.total_emissions || 0),
    ...mediumImpact.map((p: any) => p.absolute_emissions || p.total_emissions || 0),
    1 // Prevent division by zero
  );

  // Parse optimization and final plan data - prioritize final plan
  const finalPlanData = safeParse(data.finalPlan?.parsed) || safeParse(data.finalPlan?.raw);
  const optimizationData = safeParse(data.optimization?.parsed) || safeParse(data.optimization?.raw);
  
  console.log('[Dashboard] Final plan data:', finalPlanData);
  console.log('[Dashboard] Optimization data:', optimizationData);

  // Use final plan if available, otherwise fall back to optimization
  const strategies = finalPlanData?.optimization_strategies || optimizationData?.optimization_strategies || {};
  
  const highImpactRecs = strategies.high_impact_recommendations || [];
  const mediumImpactRecs = strategies.medium_impact_recommendations || [];
  const strategicSummary = strategies.strategic_summary || null;

  console.log('[Dashboard] Recommendations:', { high: highImpactRecs.length, medium: mediumImpactRecs.length });

  // Prepare chart data
  const barChartData = [...highImpact, ...mediumImpact, ...lowImpact].map((product: any) => ({
    name: product.product_name || 'Unknown',
    emissions: product.absolute_emissions || product.total_emissions || 0,
    percentage: product.emission_percentage || 0,
    material: product.material_type || 'Unknown',
  }));

  const pieChartData = [...highImpact, ...mediumImpact, ...lowImpact].map((product: any) => ({
    name: product.product_name || 'Unknown',
    value: product.absolute_emissions || product.total_emissions || 0,
  }));

  const COLORS = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  const getColor = (index: number) => {
    if (index < highImpact.length) return COLORS.high;
    if (index < highImpact.length + mediumImpact.length) return COLORS.medium;
    return COLORS.low;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.close()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-emerald-400">Carbon Impact Dashboard</h1>
              <p className="text-slate-400 mt-1">Visual analysis and optimization strategies</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Session</p>
            <p className="font-mono text-sm">{String(data.metadata.sessionId || 'N/A')}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-red-200 text-sm font-semibold">High Impact</p>
              <TrendingUp className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-4xl font-bold text-white">{highImpact.length}</p>
            <p className="text-red-200/70 text-sm mt-1">Critical attention needed</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-amber-200 text-sm font-semibold">Medium Impact</p>
              <Target className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-4xl font-bold text-white">{mediumImpact.length}</p>
            <p className="text-amber-200/70 text-sm mt-1">Optimize for gains</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-emerald-200 text-sm font-semibold">Low Impact</p>
              <TrendingDown className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-4xl font-bold text-white">{lowImpact.length}</p>
            <p className="text-emerald-200/70 text-sm mt-1">Minimal concern</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-200 text-sm font-semibold">Total Emissions</p>
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-4xl font-bold text-white">{totalEmissions.toLocaleString()}</p>
            <p className="text-blue-200/70 text-sm mt-1">kg CO₂e</p>
          </div>
        </div>

        {/* Interactive Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
            <h2 className="text-2xl font-bold mb-6 text-emerald-400">Emissions by Product</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => [`${value.toLocaleString()} kg CO₂e`, 'Emissions']}
                />
                <Bar dataKey="emissions" radius={[8, 8, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
            <h2 className="text-2xl font-bold mb-6 text-emerald-400">Emission Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => [`${value.toLocaleString()} kg CO₂e`, 'Emissions']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 backdrop-blur">
          <h2 className="text-2xl font-bold mb-6 text-emerald-400">Detailed Emission Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Product</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Material</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Emissions (kg CO₂e)</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">% of Total</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">Impact Level</th>
                </tr>
              </thead>
              <tbody>
                {[...highImpact, ...mediumImpact, ...lowImpact].map((product: any, idx: number) => {
                  const emissions = product.absolute_emissions || product.total_emissions || 0;
                  const percentage = ((emissions / totalEmissions) * 100).toFixed(1);
                  const isHigh = idx < highImpact.length;
                  const isMedium = idx >= highImpact.length && idx < highImpact.length + mediumImpact.length;
                  
                  return (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-4 px-4 text-white font-semibold">{product.product_name}</td>
                      <td className="py-4 px-4 text-slate-300">{product.material_type}</td>
                      <td className="py-4 px-4 text-right text-slate-300">{emissions.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-emerald-400 font-semibold">{percentage}%</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isHigh ? 'bg-red-500/20 text-red-400' :
                          isMedium ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {isHigh ? 'High' : isMedium ? 'Medium' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Optimization Strategies */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* High Impact Strategies */}
          {highImpactRecs.length > 0 && (
            <div className="bg-white/5 border border-red-500/30 rounded-2xl p-6 backdrop-blur">
              <h3 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                High Impact Optimization Strategies
              </h3>
              <div className="space-y-6">
                {highImpactRecs.map((rec: any, idx: number) => (
                  <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1">{rec.product_name}</h4>
                        <p className="text-sm text-slate-300">
                          Current Material: <span className="text-red-400 font-semibold">{rec.current_material}</span>
                        </p>
                        <p className="text-sm text-amber-300 mt-1">Issue: {rec.primary_issue}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {(rec.proposed_strategies || []).map((strategy: any, sIdx: number) => (
                        <div key={sIdx} className="bg-black/20 rounded-lg p-4 border border-red-500/10">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="h-5 w-5 text-emerald-400" />
                            <p className="text-emerald-400 font-bold">{strategy.strategy_type}</p>
                          </div>
                          <div className="space-y-2 mb-3">
                            <p className="text-xs text-slate-400 uppercase tracking-wide">Action Items:</p>
                            <ul className="space-y-2">
                              {(strategy.specific_actions || []).map((action: string, aIdx: number) => (
                                <li key={aIdx} className="text-sm text-slate-200 pl-4 border-l-2 border-emerald-500/30">
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3">
                            <p className="text-xs text-emerald-400 font-semibold mb-1">Expected Outcome:</p>
                            <p className="text-sm text-white">{strategy.expected_outcome}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medium Impact Strategies */}
          {mediumImpactRecs.length > 0 && (
            <div className="bg-white/5 border border-amber-500/30 rounded-2xl p-6 backdrop-blur">
              <h3 className="text-2xl font-bold mb-6 text-amber-400 flex items-center gap-2">
                <Target className="h-6 w-6" />
                Medium Impact Optimization Strategies
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mediumImpactRecs.map((rec: any, idx: number) => (
                  <div key={idx} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-white mb-1">{rec.product_name}</h4>
                      <p className="text-sm text-slate-300">
                        Current Material: <span className="text-amber-400 font-semibold">{rec.current_material}</span>
                      </p>
                      <p className="text-sm text-amber-300 mt-1">Issue: {rec.primary_issue}</p>
                    </div>
                    <div className="space-y-4">
                      {(rec.proposed_strategies || []).map((strategy: any, sIdx: number) => (
                        <div key={sIdx} className="bg-black/20 rounded-lg p-4 border border-amber-500/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-emerald-400" />
                            <p className="text-emerald-400 font-bold text-sm">{strategy.strategy_type}</p>
                          </div>
                          <div className="space-y-2 mb-2">
                            <ul className="space-y-1">
                              {(strategy.specific_actions || []).map((action: string, aIdx: number) => (
                                <li key={aIdx} className="text-xs text-slate-300 pl-3 border-l border-emerald-500/30">
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2 mt-2">
                            <p className="text-xs text-white">{strategy.expected_outcome}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Strategic Summary */}
        {strategicSummary && (
          <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-2xl p-8 backdrop-blur">
            <h3 className="text-2xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Strategic Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-emerald-500/20">
                <p className="text-sm text-emerald-400 font-semibold mb-3 uppercase tracking-wide">Overall Recommendation</p>
                <p className="text-white leading-relaxed">
                  {strategicSummary.overall_recommendation}
                </p>
              </div>
              {strategicSummary.synergy_opportunities && (
                <div className="bg-white/5 rounded-xl p-6 border border-blue-500/20">
                  <p className="text-sm text-blue-400 font-semibold mb-3 uppercase tracking-wide">Synergy Opportunities</p>
                  <p className="text-white leading-relaxed">
                    {strategicSummary.synergy_opportunities}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
