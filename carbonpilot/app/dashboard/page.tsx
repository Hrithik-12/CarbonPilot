'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingDown, TrendingUp, Target, Zap, Sparkles, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, ArrowRight, TrendingDownIcon, Download, Filter, DollarSign, Award } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Line, Area } from 'recharts';

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
  const [impactFilter, setImpactFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

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

  // Parse optimization and final plan data - prioritize final plan (MOVED BEFORE CALCULATIONS)
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

  // Calculate potential savings from optimization strategies
  const calculatePotentialSavings = () => {
    let totalSavings = 0;
    
    [...highImpactRecs, ...mediumImpactRecs].forEach((rec: any) => {
      const product = [...highImpact, ...mediumImpact, ...lowImpact].find(
        (p: any) => p.product_name === rec.product_name
      );
      if (product) {
        const currentEmission = product.absolute_emissions || product.total_emissions || 0;
        // Conservative estimate: high impact can reduce 30-50%, medium 15-30%
        const reductionRate = highImpactRecs.includes(rec) ? 0.35 : 0.20;
        totalSavings += currentEmission * reductionRate;
      }
    });
    
    return Math.round(totalSavings);
  };

  const potentialSavings = calculatePotentialSavings();
  const savingsPercentage = totalEmissions > 0 ? ((potentialSavings / totalEmissions) * 100).toFixed(1) : '0';
  
  // Filter data based on selected impact level
  const getFilteredProducts = () => {
    if (impactFilter === 'high') return highImpact;
    if (impactFilter === 'medium') return mediumImpact;
    if (impactFilter === 'low') return lowImpact;
    return [...highImpact, ...mediumImpact, ...lowImpact];
  };

  const filteredProducts = getFilteredProducts();

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Product Name', 'Material Type', 'Emissions (kg CO₂e)', '% of Total', 'Impact Level'];
    const rows = [...highImpact, ...mediumImpact, ...lowImpact].map((product: any, idx: number) => {
      const emissions = product.absolute_emissions || product.total_emissions || 0;
      const percentage = ((emissions / totalEmissions) * 100).toFixed(1);
      const isHigh = idx < highImpact.length;
      const isMedium = idx >= highImpact.length && idx < highImpact.length + mediumImpact.length;
      const level = isHigh ? 'High' : isMedium ? 'Medium' : 'Low';
      
      return [
        product.product_name,
        product.material_type,
        emissions.toLocaleString(),
        percentage + '%',
        level
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon-emissions-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Prepare chart data
  const barChartData = filteredProducts.map((product: any) => ({
    name: product.product_name || 'Unknown',
    emissions: product.absolute_emissions || product.total_emissions || 0,
    percentage: product.emission_percentage || 0,
    material: product.material_type || 'Unknown',
  }));

  const pieChartData = filteredProducts.map((product: any) => ({
    name: product.product_name || 'Unknown',
    value: product.absolute_emissions || product.total_emissions || 0,
  }));

  // Waterfall chart data showing current → optimized emissions
  const waterfallData = [
    { name: 'Current Emissions', value: totalEmissions, fill: '#ef4444' },
    { name: 'High Impact Reductions', value: -Math.round(potentialSavings * 0.6), fill: '#10b981' },
    { name: 'Medium Impact Reductions', value: -Math.round(potentialSavings * 0.4), fill: '#3b82f6' },
    { name: 'Projected Emissions', value: totalEmissions - potentialSavings, fill: '#8b5cf6' },
  ];

  // Calculate cumulative values for waterfall
  let cumulative = 0;
  const waterfallChartData = waterfallData.map((item, idx) => {
    const start = cumulative;
    cumulative += item.value;
    return {
      name: item.name,
      value: Math.abs(item.value),
      start: idx === 0 ? 0 : start,
      end: cumulative,
      fill: item.fill,
      isReduction: item.value < 0
    };
  });

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
              <p className="text-slate-400 mt-1">Data-driven emissions analysis & optimization roadmap</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition border border-white/20"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-semibold">Export Report</span>
            </button>
            <div className="text-right">
              <p className="text-sm text-slate-400">Session</p>
              <p className="font-mono text-sm">{String(data.metadata.sessionId || 'N/A')}</p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl p-8 mb-8 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Award className="h-6 w-6 text-purple-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Executive Summary</h2>
              <p className="text-purple-200 text-sm">Key insights from your carbon footprint analysis</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-300 font-semibold">Total Baseline Emissions</p>
                <Zap className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">{totalEmissions.toLocaleString()}</p>
              <p className="text-sm text-slate-400">kg CO₂e across {highImpact.length + mediumImpact.length + lowImpact.length} products</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-emerald-300 font-semibold">Potential Reduction</p>
                <TrendingDown className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-4xl font-bold text-emerald-400 mb-2">{potentialSavings.toLocaleString()}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${savingsPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-emerald-300 font-bold">{savingsPercentage}%</p>
              </div>
              <p className="text-sm text-slate-400 mt-2">kg CO₂e achievable through optimization</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6 border border-amber-500/30">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-amber-300 font-semibold">Action Items Identified</p>
                <CheckCircle2 className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">{highImpactRecs.length + mediumImpactRecs.length}</p>
              <p className="text-sm text-slate-400">
                {highImpactRecs.length} critical priority, {mediumImpactRecs.length} moderate priority
              </p>
            </div>
          </div>

          <div className="mt-6 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold mb-1">Key Insight</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  By prioritizing the {highImpact.length} high-impact products (contributing to {((highImpact.reduce((sum: number, p: any) => sum + (p.absolute_emissions || p.total_emissions || 0), 0) / totalEmissions) * 100).toFixed(1)}% of total emissions), 
                  you can achieve {((potentialSavings * 0.6 / totalEmissions) * 100).toFixed(1)}% reduction. 
                  Focus on material substitution and process optimization for these critical items first.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-12 -mt-12" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-red-200 text-sm font-semibold">High Impact</p>
                <TrendingUp className="h-5 w-5 text-red-400" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">{highImpact.length}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-red-500/20 rounded-full text-red-300 font-semibold">
                  {((highImpact.reduce((sum: number, p: any) => sum + (p.absolute_emissions || p.total_emissions || 0), 0) / totalEmissions) * 100).toFixed(0)}% of emissions
                </span>
              </div>
              <p className="text-red-200/70 text-sm mt-2">Critical attention needed</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-12 -mt-12" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-amber-200 text-sm font-semibold">Medium Impact</p>
                <Target className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">{mediumImpact.length}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-amber-500/20 rounded-full text-amber-300 font-semibold">
                  {((mediumImpact.reduce((sum: number, p: any) => sum + (p.absolute_emissions || p.total_emissions || 0), 0) / totalEmissions) * 100).toFixed(0)}% of emissions
                </span>
              </div>
              <p className="text-amber-200/70 text-sm mt-2">Optimize for gains</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-emerald-200 text-sm font-semibold">Low Impact</p>
                <TrendingDown className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">{lowImpact.length}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-emerald-500/20 rounded-full text-emerald-300 font-semibold">
                  {((lowImpact.reduce((sum: number, p: any) => sum + (p.absolute_emissions || p.total_emissions || 0), 0) / totalEmissions) * 100).toFixed(0)}% of emissions
                </span>
              </div>
              <p className="text-emerald-200/70 text-sm mt-2">Minimal concern</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-200 text-sm font-semibold">Avg per Product</p>
                <Zap className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                {Math.round(totalEmissions / (highImpact.length + mediumImpact.length + lowImpact.length)).toLocaleString()}
              </p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 mb-2">
                <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '65%' }} />
              </div>
              <p className="text-blue-200/70 text-sm">kg CO₂e per product line</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Filter className="h-5 w-5 text-emerald-400" />
                Filter by Impact Level
              </h3>
              <p className="text-sm text-slate-400 mt-1">Adjust visualizations to focus on specific emission categories</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setImpactFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  impactFilter === 'all'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                All Products ({highImpact.length + mediumImpact.length + lowImpact.length})
              </button>
              <button
                onClick={() => setImpactFilter('high')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  impactFilter === 'high'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                High ({highImpact.length})
              </button>
              <button
                onClick={() => setImpactFilter('medium')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  impactFilter === 'medium'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Medium ({mediumImpact.length})
              </button>
              <button
                onClick={() => setImpactFilter('low')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  impactFilter === 'low'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Low ({lowImpact.length})
              </button>
            </div>
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
                  {barChartData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Waterfall Chart - Reduction Potential */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
            <h2 className="text-2xl font-bold mb-6 text-emerald-400">Reduction Potential Analysis</h2>
            <p className="text-sm text-slate-400 mb-4">Projected emissions after implementing optimization strategies</p>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={waterfallChartData} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
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
                  formatter={(value: any, name: any, props: any) => {
                    const item = props.payload;
                    if (item.isReduction) {
                      return [`-${value.toLocaleString()} kg CO₂e`, 'Reduction'];
                    }
                    return [`${value.toLocaleString()} kg CO₂e`, 'Emissions'];
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {waterfallChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-300 font-semibold">Current Baseline</p>
                <p className="text-2xl font-bold text-white">{totalEmissions.toLocaleString()}</p>
                <p className="text-xs text-slate-400">kg CO₂e</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-xs text-emerald-300 font-semibold">After Optimization</p>
                <p className="text-2xl font-bold text-white">{(totalEmissions - potentialSavings).toLocaleString()}</p>
                <p className="text-xs text-slate-400">kg CO₂e ({savingsPercentage}% reduction)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 backdrop-blur">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-emerald-400">Detailed Emission Breakdown</h2>
              <p className="text-sm text-slate-400 mt-1">
                {impactFilter === 'all' 
                  ? `Showing all ${filteredProducts.length} products` 
                  : `Filtered to ${filteredProducts.length} ${impactFilter}-impact products`}
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </button>
          </div>
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
                {filteredProducts.map((product: any, idx: number) => {
                  const emissions = product.absolute_emissions || product.total_emissions || 0;
                  const percentage = ((emissions / totalEmissions) * 100).toFixed(1);
                  const isHigh = highImpact.some((p: any) => p.product_name === product.product_name);
                  const isMedium = mediumImpact.some((p: any) => p.product_name === product.product_name);
                  
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

        {/* ROI Summary Section */}
        {(highImpactRecs.length > 0 || mediumImpactRecs.length > 0) && (
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-8 mb-8 backdrop-blur">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <DollarSign className="h-6 w-6 text-blue-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Return on Investment Analysis</h2>
                <p className="text-blue-200 text-sm">Projected business impact of optimization strategies</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-emerald-300 font-semibold">Total Emission Reduction</p>
                  <TrendingDown className="h-5 w-5 text-emerald-400" />
                </div>
                <p className="text-4xl font-bold text-white mb-2">{potentialSavings.toLocaleString()}</p>
                <p className="text-sm text-slate-400">kg CO₂e annually</p>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-slate-500">Represents {savingsPercentage}% of total footprint</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-blue-300 font-semibold">Est. Cost Avoidance</p>
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
                <p className="text-4xl font-bold text-white mb-2">
                  ${Math.round((potentialSavings * 50) / 1000).toLocaleString()}k
                </p>
                <p className="text-sm text-slate-400">@ $50/ton CO₂e carbon pricing</p>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-slate-500">Based on current carbon market rates</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-purple-300 font-semibold">Implementation Priority</p>
                  <Target className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-4xl font-bold text-white mb-2">{highImpactRecs.length}</p>
                <p className="text-sm text-slate-400">High-priority actions</p>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-slate-500">Focus here for maximum ROI</p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold mb-2">Business Impact Summary</p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Implementing the recommended strategies could reduce your carbon footprint by <span className="text-emerald-400 font-bold">{savingsPercentage}%</span>, 
                    potentially avoiding <span className="text-blue-400 font-bold">${Math.round((potentialSavings * 50) / 1000)}k</span> in carbon-related costs. 
                    High-impact products account for {((highImpact.reduce((sum: number, p: any) => sum + (p.absolute_emissions || p.total_emissions || 0), 0) / totalEmissions) * 100).toFixed(0)}% 
                    of emissions but offer the greatest reduction potential with an estimated <span className="text-emerald-400 font-bold">{((potentialSavings * 0.6 / totalEmissions) * 100).toFixed(1)}%</span> improvement 
                    through targeted interventions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
