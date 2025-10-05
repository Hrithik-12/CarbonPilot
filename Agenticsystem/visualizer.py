"""
Carbon Pilot Visualizer Module

This module creates interactive visualizations and HTML reports from the
Analyzer Agent's output (analysis_results).

Usage:
    from visualizer import create_dashboard, create_detailed_report
    
    # After running analyzer agent and getting analysis_results
    dashboard = create_dashboard(analysis_results)
    dashboard.write_html("dashboard.html")
    
    # Or create a detailed HTML report
    report_html = create_detailed_report(analysis_results)
    with open("report.html", "w") as f:
        f.write(report_html)
"""

import json
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px


def create_dashboard(analysis_json):
    """
    Create interactive dashboard from Analyzer Agent output
    
    Args:
        analysis_json: The analysis_results output from analyzer_agent
                      (can be dict or JSON string)
    
    Returns:
        plotly.graph_objects.Figure: Interactive dashboard with multiple charts
    """
    
    # Parse if string
    if isinstance(analysis_json, str):
        data = json.loads(analysis_json)
    else:
        data = analysis_json
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=(
            'Carbon Emissions by Product',
            'Impact Category Distribution',
            'Material Emission Factors',
            'Top Emitters Ranking'
        ),
        specs=[
            [{"type": "bar"}, {"type": "pie"}],
            [{"type": "bar"}, {"type": "bar"}]
        ]
    )
    
    # 1. EMISSIONS BY PRODUCT (Bar Chart)
    products = []
    emissions = []
    colors = []
    
    for product in data['impact_categories']['high_impact']:
        products.append(product['product_name'])
        emissions.append(product['total_emissions'])
        colors.append('#ef4444')  # Red for high
    
    for product in data['impact_categories']['medium_impact']:
        products.append(product['product_name'])
        emissions.append(product['total_emissions'])
        colors.append('#f59e0b')  # Orange for medium
    
    for product in data['impact_categories']['low_impact']:
        products.append(product['product_name'])
        emissions.append(product['total_emissions'])
        colors.append('#22c55e')  # Green for low
    
    fig.add_trace(
        go.Bar(
            x=products,
            y=emissions,
            marker_color=colors,
            name='Emissions',
            text=[f'{e:,.0f} kg CO2e' for e in emissions],
            textposition='outside'
        ),
        row=1, col=1
    )
    
    # 2. IMPACT CATEGORY PIE CHART
    categories = ['High Impact', 'Medium Impact', 'Low Impact']
    counts = [
        len(data['impact_categories']['high_impact']),
        len(data['impact_categories']['medium_impact']),
        len(data['impact_categories']['low_impact'])
    ]
    category_colors = ['#ef4444', '#f59e0b', '#22c55e']
    
    fig.add_trace(
        go.Pie(
            labels=categories,
            values=counts,
            marker_colors=category_colors,
            hole=0.4,
            textinfo='label+value'
        ),
        row=1, col=2
    )
    
    # 3. MATERIAL EMISSION FACTORS
    materials = []
    factors = []
    profiles = []
    
    for material, info in data['material_insights'].items():
        materials.append(material)
        factors.append(info['emission_factor'])
        profiles.append(info['environmental_profile'])
    
    factor_colors = ['#22c55e' if 'Low' in p else '#f59e0b' if 'Medium' in p else '#ef4444' for p in profiles]
    
    fig.add_trace(
        go.Bar(
            x=materials,
            y=factors,
            marker_color=factor_colors,
            name='Emission Factor',
            text=[f'{f:.2f}' for f in factors],
            textposition='outside'
        ),
        row=2, col=1
    )
    
    # 4. TOP EMITTERS RANKING
    rankers = [item['product_name'] for item in data['top_emitters_ranking']]
    percentages = [item['percentage'] for item in data['top_emitters_ranking']]
    
    fig.add_trace(
        go.Bar(
            x=rankers,
            y=percentages,
            marker_color=['#ef4444', '#f59e0b', '#22c55e'][:len(rankers)],
            name='% of Total',
            text=[f'{p:.1f}%' for p in percentages],
            textposition='outside'
        ),
        row=2, col=2
    )
    
    # Update layout
    fig.update_xaxes(title_text="Products", row=1, col=1)
    fig.update_yaxes(title_text="Emissions (kg CO2e)", row=1, col=1)
    
    fig.update_xaxes(title_text="Materials", row=2, col=1)
    fig.update_yaxes(title_text="Emission Factor (kg CO2e/kg)", row=2, col=1)
    
    fig.update_xaxes(title_text="Products", row=2, col=2)
    fig.update_yaxes(title_text="% of Total Emissions", row=2, col=2)
    
    fig.update_layout(
        title_text="🌱 Carbon Pilot - Analyzer Agent Output",
        title_font_size=24,
        showlegend=False,
        height=800,
        template="plotly_white"
    )
    
    return fig


def create_detailed_report(analysis_json):
    """
    Create a detailed HTML report with multiple visualizations
    
    Args:
        analysis_json: The analysis_results output from analyzer_agent
                      (can be dict or JSON string)
    
    Returns:
        str: Complete HTML report with embedded visualizations
    """
    
    if isinstance(analysis_json, str):
        data = json.loads(analysis_json)
    else:
        data = analysis_json
    
    # Combine all products
    all_products = (
        data['impact_categories']['high_impact'] + 
        data['impact_categories']['medium_impact'] + 
        data['impact_categories']['low_impact']
    )
    
    # Chart 1: Emissions Breakdown
    emissions_data = {
        'Product': [p['product_name'] for p in all_products],
        'Emissions': [p['total_emissions'] for p in all_products],
        'Percentage': [p['percentage_of_total'] for p in all_products],
        'Category': (
            ['High Impact'] * len(data['impact_categories']['high_impact']) +
            ['Medium Impact'] * len(data['impact_categories']['medium_impact']) +
            ['Low Impact'] * len(data['impact_categories']['low_impact'])
        )
    }
    
    fig1 = px.bar(
        emissions_data,
        x='Product',
        y='Emissions',
        color='Category',
        color_discrete_map={
            'High Impact': '#ef4444',
            'Medium Impact': '#f59e0b',
            'Low Impact': '#22c55e'
        },
        title='Carbon Emissions by Product and Impact Category',
        labels={'Emissions': 'Emissions (kg CO2e)'},
        text='Emissions'
    )
    fig1.update_traces(texttemplate='%{text:,.0f}', textposition='outside')
    fig1.update_layout(height=500)
    
    # Chart 2: Percentage Contribution Pie
    fig2 = go.Figure(data=[go.Pie(
        labels=[p['product_name'] for p in all_products],
        values=[p['percentage_of_total'] for p in all_products],
        hole=0.3,
        marker_colors=['#ef4444', '#f59e0b', '#22c55e']
    )])
    fig2.update_layout(
        title='Percentage Contribution to Total Emissions',
        height=500
    )
    
    # Chart 3: Material Comparison
    materials = list(data['material_insights'].keys())
    emission_factors = [data['material_insights'][m]['emission_factor'] for m in materials]
    
    fig3 = go.Figure(data=[
        go.Bar(
            x=materials,
            y=emission_factors,
            marker_color=['#3b82f6', '#8b5cf6', '#ec4899'][:len(materials)],
            text=[f'{ef:.2f}' for ef in emission_factors],
            textposition='outside'
        )
    ])
    fig3.update_layout(
        title='Material Emission Factors Comparison',
        xaxis_title='Material Type',
        yaxis_title='Emission Factor (kg CO2e/kg)',
        height=500
    )
    
    # Generate HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Carbon Analyzer Agent - Visual Report</title>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }}
            .container {{
                max-width: 1400px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }}
            h1 {{
                color: #1f2937;
                text-align: center;
                margin-bottom: 10px;
            }}
            .subtitle {{
                text-align: center;
                color: #6b7280;
                margin-bottom: 40px;
            }}
            .summary-box {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                margin-bottom: 40px;
            }}
            .summary-grid {{
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-top: 20px;
            }}
            .summary-item {{
                text-align: center;
            }}
            .summary-number {{
                font-size: 36px;
                font-weight: bold;
            }}
            .summary-label {{
                font-size: 14px;
                opacity: 0.9;
            }}
            .insights-box {{
                background: #f3f4f6;
                padding: 25px;
                border-radius: 15px;
                margin: 30px 0;
            }}
            .insight-item {{
                padding: 12px;
                margin: 10px 0;
                background: white;
                border-left: 4px solid #667eea;
                border-radius: 5px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌱 Carbon Pilot - Analyzer Agent Report</h1>
            <p class="subtitle">AI-Powered Carbon Footprint Analysis</p>
            
            <div class="summary-box">
                <h2 style="margin-top:0;">Analysis Summary</h2>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-number">{data['analysis_summary']['dominant_emitter'].split()[0]}</div>
                        <div class="summary-label">Dominant Emitter</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number">{data['analysis_summary']['dominant_emitter'].split()[-1]}</div>
                        <div class="summary-label">Contribution</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number">{len(all_products)}</div>
                        <div class="summary-label">Products Analyzed</div>
                    </div>
                </div>
            </div>
            
            <div id="chart1"></div>
            <div id="chart2"></div>
            <div id="chart3"></div>
            
            <div class="insights-box">
                <h2>🔍 Key Patterns Identified</h2>
                {''.join([f'<div class="insight-item">• {pattern}</div>' for pattern in data['key_patterns']])}
            </div>
            
            <div class="insights-box">
                <h2>🎯 Optimization Priorities</h2>
                <h3>Quick Wins:</h3>
                {''.join([f'<div class="insight-item"><strong>{item["product"]}</strong>: {item["reason"]}</div>' for item in data['optimization_priorities']['quick_wins']])}
                
                <h3>Strategic Targets:</h3>
                {''.join([f'<div class="insight-item"><strong>{item["product"]}</strong>: {item["reason"]}</div>' for item in data['optimization_priorities']['strategic_targets']])}
            </div>
        </div>
        
        <script>
            var chart1_data = {fig1.to_json()};
            Plotly.newPlot('chart1', chart1_data.data, chart1_data.layout);
            
            var chart2_data = {fig2.to_json()};
            Plotly.newPlot('chart2', chart2_data.data, chart2_data.layout);
            
            var chart3_data = {fig3.to_json()};
            Plotly.newPlot('chart3', chart3_data.data, chart3_data.layout);
        </script>
    </body>
    </html>
    """
    
    return html_content


def save_dashboard(analysis_results, filename="analyzer_dashboard.html"):
    """
    Convenience function to create and save dashboard
    
    Args:
        analysis_results: Output from analyzer agent
        filename: Output HTML filename
    """
    fig = create_dashboard(analysis_results)
    fig.write_html(filename)
    print(f"✅ Dashboard saved as '{filename}'")
    return fig


def save_report(analysis_results, filename="analyzer_report.html"):
    """
    Convenience function to create and save detailed report
    
    Args:
        analysis_results: Output from analyzer agent
        filename: Output HTML filename
    """
    html_report = create_detailed_report(analysis_results)
    with open(filename, "w") as f:
        f.write(html_report)
    print(f"✅ Report saved as '{filename}'")
