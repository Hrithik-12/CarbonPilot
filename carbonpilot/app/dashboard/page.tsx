'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingDown, TrendingUp, Target, Zap, Sparkles, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, ArrowRight, TrendingDownIcon } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

type DashboardData = {
  analysis: any;
  optimization: any;
  finalPlan: any;
  metadata: Record<string, unknown>;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [hoveredStrategy, setHoveredStrategy] = useState<string | null>(null);

  useEffect(() => {
    // Get data from sessionStorage
    const storedData = sessionStorage.getItem('carbonPilotResults');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      console.log('[Dashboard] Raw stored data:', parsed);
      setData(parsed);
    }
  }, []);

  const toggleStrategy = (id: string) => {
    const newExpanded = new Set(expandedStrategies);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedStrategies(newExpanded);
  };

  const toggleAction = (actionId: string) => {
    const newCompleted = new Set(completedActions);
    if (newCompleted.has(actionId)) {
      newCompleted.delete(actionId);
    } else {
      newCompleted.add(actionId);
    }
    setCompletedActions(newCompleted);
  };

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
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 60, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  label={{ 
                    value: 'kg CO₂e', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#94a3b8',
                    offset: 10,
                    style: { textAnchor: 'middle' }
                  }}
                  width={80}
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
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={({ percent }: any) => {
                    const percentValue = ((percent || 0) * 100).toFixed(1);
                    // Only show label if percentage is > 3% to avoid congestion
                    return parseFloat(percentValue) > 3 ? `${percentValue}%` : '';
                  }}
                  outerRadius={90}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
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
                  formatter={(value: any, name: any, props: any) => [
                    `${value.toLocaleString()} kg CO₂e`,
                    props.payload.name
                  ]}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={80}
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, entry: any) => {
                    const item = pieChartData[entry.payload?.index || 0];
                    return item ? `${item.name}` : value;
                  }}
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-red-400 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  High Impact Optimization Strategies
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Priority:</span>
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full font-semibold">Critical</span>
                </div>
              </div>
              <div className="space-y-4">
                {highImpactRecs.map((rec: any, idx: number) => {
                  const strategyId = `high-${idx}`;
                  const isExpanded = expandedStrategies.has(strategyId);
                  
                  return (
                    <div 
                      key={idx} 
                      className={`bg-red-500/10 border border-red-500/20 rounded-xl overflow-hidden transition-all duration-300 ${
                        hoveredStrategy === strategyId ? 'shadow-lg shadow-red-500/20 scale-[1.01]' : ''
                      }`}
                      onMouseEnter={() => setHoveredStrategy(strategyId)}
                      onMouseLeave={() => setHoveredStrategy(null)}
                    >
                      <div 
                        className="p-6 cursor-pointer"
                        onClick={() => toggleStrategy(strategyId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-white">{rec.product_name}</h4>
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-emerald-400 font-semibold">
                                  {(rec.proposed_strategies || []).length} strategy{(rec.proposed_strategies || []).length !== 1 ? 's' : ''} available
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <p className="text-slate-300">
                                Current: <span className="text-red-400 font-semibold">{rec.current_material}</span>
                              </p>
                              <span className="text-slate-600">•</span>
                              <p className="text-amber-300 flex items-center gap-1">
                                <Lightbulb className="h-4 w-4" />
                                {rec.primary_issue}
                              </p>
                            </div>
                          </div>
                          <button 
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStrategy(strategyId);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                          {(rec.proposed_strategies || []).map((strategy: any, sIdx: number) => (
                            <div 
                              key={sIdx} 
                              className="bg-black/30 rounded-lg p-5 border border-red-500/10 hover:border-red-500/30 transition-all"
                            >
                              <div className="flex items-start gap-3 mb-4">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                  <Target className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-emerald-400 font-bold text-lg mb-1">{strategy.strategy_type}</p>
                                  <p className="text-sm text-slate-400">Implementation Roadmap</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3 mb-4">
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Action Checklist:
                                </p>
                                <div className="space-y-2">
                                  {(strategy.specific_actions || []).map((action: string, aIdx: number) => {
                                    const actionId = `${strategyId}-${sIdx}-${aIdx}`;
                                    const isCompleted = completedActions.has(actionId);
                                    
                                    return (
                                      <div 
                                        key={aIdx}
                                        className={`flex items-start gap-3 p-3 rounded-lg border-l-2 transition-all cursor-pointer group ${
                                          isCompleted 
                                            ? 'bg-emerald-500/10 border-emerald-500 hover:bg-emerald-500/15' 
                                            : 'bg-white/5 border-emerald-500/30 hover:bg-white/10 hover:border-emerald-500/50'
                                        }`}
                                        onClick={() => toggleAction(actionId)}
                                      >
                                        <div className={`mt-0.5 transition-transform ${isCompleted ? 'scale-110' : ''}`}>
                                          <CheckCircle2 
                                            className={`h-5 w-5 transition-colors ${
                                              isCompleted ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-500 group-hover:text-emerald-400/50'
                                            }`}
                                          />
                                        </div>
                                        <p className={`text-sm flex-1 transition-all ${
                                          isCompleted ? 'text-emerald-200 line-through' : 'text-slate-200'
                                        }`}>
                                          {action}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <TrendingDownIcon className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-emerald-400 font-semibold mb-2 uppercase tracking-wide">
                                      Expected Impact
                                    </p>
                                    <p className="text-sm text-white leading-relaxed">{strategy.expected_outcome}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Medium Impact Strategies */}
          {mediumImpactRecs.length > 0 && (
            <div className="bg-white/5 border border-amber-500/30 rounded-2xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                  <Target className="h-6 w-6" />
                  Medium Impact Optimization Strategies
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Priority:</span>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full font-semibold">Moderate</span>
                </div>
              </div>
              <div className="space-y-4">
                {mediumImpactRecs.map((rec: any, idx: number) => {
                  const strategyId = `medium-${idx}`;
                  const isExpanded = expandedStrategies.has(strategyId);
                  
                  return (
                    <div 
                      key={idx} 
                      className={`bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden transition-all duration-300 ${
                        hoveredStrategy === strategyId ? 'shadow-lg shadow-amber-500/20 scale-[1.01]' : ''
                      }`}
                      onMouseEnter={() => setHoveredStrategy(strategyId)}
                      onMouseLeave={() => setHoveredStrategy(null)}
                    >
                      <div 
                        className="p-6 cursor-pointer"
                        onClick={() => toggleStrategy(strategyId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-white">{rec.product_name}</h4>
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-emerald-400 font-semibold">
                                  {(rec.proposed_strategies || []).length} strategy{(rec.proposed_strategies || []).length !== 1 ? 's' : ''} available
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <p className="text-slate-300">
                                Current: <span className="text-amber-400 font-semibold">{rec.current_material}</span>
                              </p>
                              <span className="text-slate-600">•</span>
                              <p className="text-amber-300 flex items-center gap-1">
                                <Lightbulb className="h-4 w-4" />
                                {rec.primary_issue}
                              </p>
                            </div>
                          </div>
                          <button 
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStrategy(strategyId);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                          {(rec.proposed_strategies || []).map((strategy: any, sIdx: number) => (
                            <div 
                              key={sIdx} 
                              className="bg-black/30 rounded-lg p-5 border border-amber-500/10 hover:border-amber-500/30 transition-all"
                            >
                              <div className="flex items-start gap-3 mb-4">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                  <Zap className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-emerald-400 font-bold text-lg mb-1">{strategy.strategy_type}</p>
                                  <p className="text-sm text-slate-400">Implementation Roadmap</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3 mb-4">
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Action Checklist:
                                </p>
                                <div className="space-y-2">
                                  {(strategy.specific_actions || []).map((action: string, aIdx: number) => {
                                    const actionId = `${strategyId}-${sIdx}-${aIdx}`;
                                    const isCompleted = completedActions.has(actionId);
                                    
                                    return (
                                      <div 
                                        key={aIdx}
                                        className={`flex items-start gap-3 p-3 rounded-lg border-l-2 transition-all cursor-pointer group ${
                                          isCompleted 
                                            ? 'bg-emerald-500/10 border-emerald-500 hover:bg-emerald-500/15' 
                                            : 'bg-white/5 border-emerald-500/30 hover:bg-white/10 hover:border-emerald-500/50'
                                        }`}
                                        onClick={() => toggleAction(actionId)}
                                      >
                                        <div className={`mt-0.5 transition-transform ${isCompleted ? 'scale-110' : ''}`}>
                                          <CheckCircle2 
                                            className={`h-5 w-5 transition-colors ${
                                              isCompleted ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-500 group-hover:text-emerald-400/50'
                                            }`}
                                          />
                                        </div>
                                        <p className={`text-sm flex-1 transition-all ${
                                          isCompleted ? 'text-emerald-200 line-through' : 'text-slate-200'
                                        }`}>
                                          {action}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <TrendingDownIcon className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-emerald-400 font-semibold mb-2 uppercase tracking-wide">
                                      Expected Impact
                                    </p>
                                    <p className="text-sm text-white leading-relaxed">{strategy.expected_outcome}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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
