"""
Carbon Pilot - Test & Demo Script

This script demonstrates how to:
1. Run the analyzer agent with sample carbon footprint data
2. Visualize the results using the visualizer module
3. Generate both dashboard and detailed report

Usage:
    python test_analyzer.py
"""

import webbrowser
import os
from pilot.agent import root_agent
from visualizer import create_dashboard, create_detailed_report, save_dashboard, save_report


# Sample carbon footprint data (example from your calculations)
sample_carbon_data = {
    "products": [
        {
            "product_name": "Steel Frame",
            "material_type": "Steel",
            "weight_kg": 3000,
            "emission_factor": 1.85,
            "total_emissions": 5550
        },
        {
            "product_name": "Plastic Case",
            "material_type": "Plastic",
            "weight_kg": 250,
            "emission_factor": 6.0,
            "total_emissions": 1500
        },
        {
            "product_name": "Cotton T-Shirt",
            "material_type": "Cotton",
            "weight_kg": 200,
            "emission_factor": 5.3,
            "total_emissions": 1060
        }
    ],
    "summary": {
        "total_emissions": 8110,
        "total_products": 3,
        "average_emissions_per_product": 2703.33
    }
}


# Example analyzer output structure (what your analyzer agent should return)
example_analyzer_output = {
    "impact_categories": {
        "high_impact": [
            {
                "product_name": "Steel Frame",
                "material_type": "Steel",
                "total_emissions": 5550,
                "percentage_of_total": 68.44,
                "emission_factor": 1.85,
                "category_reason": "Steel Frame contributes 68.44% of the total emissions"
            }
        ],
        "medium_impact": [
            {
                "product_name": "Plastic Case",
                "material_type": "Plastic",
                "total_emissions": 1500,
                "percentage_of_total": 18.50,
                "emission_factor": 6.0,
                "category_reason": "Plastic Case contributes 18.50% of total emissions"
            }
        ],
        "low_impact": [
            {
                "product_name": "Cotton T-Shirt",
                "material_type": "Cotton",
                "total_emissions": 1060,
                "percentage_of_total": 13.07,
                "emission_factor": 5.3,
                "category_reason": "Cotton T-Shirt contributes 13.07% of the total emissions"
            }
        ]
    },
    "material_insights": {
        "Steel": {
            "emission_factor": 1.85,
            "environmental_profile": "Low carbon intensity",
            "key_observation": "While Steel has a relatively low emission factor, its high total weight makes it the highest contributor."
        },
        "Plastic": {
            "emission_factor": 6.0,
            "environmental_profile": "High carbon intensity",
            "key_observation": "Plastic has a high emission factor, resulting in significant emissions."
        },
        "Cotton": {
            "emission_factor": 5.3,
            "environmental_profile": "Medium carbon intensity",
            "key_observation": "Cotton has a medium emission factor and lower total weight."
        }
    },
    "top_emitters_ranking": [
        {
            "rank": 1,
            "product_name": "Steel Frame",
            "emissions": 5550,
            "percentage": 68.44,
            "why_this_matters": "Dominates total emissions"
        },
        {
            "rank": 2,
            "product_name": "Plastic Case",
            "emissions": 1500,
            "percentage": 18.50,
            "why_this_matters": "High emission factor material"
        },
        {
            "rank": 3,
            "product_name": "Cotton T-Shirt",
            "emissions": 1060,
            "percentage": 13.07,
            "why_this_matters": "Lowest contributor"
        }
    ],
    "optimization_priorities": {
        "quick_wins": [
            {
                "product": "Plastic Case",
                "reason": "Switching to less carbon-intensive plastic could significantly reduce emissions"
            }
        ],
        "strategic_targets": [
            {
                "product": "Steel Frame",
                "reason": "Reducing steel quantity requires complex approach"
            }
        ],
        "low_priority": ["Cotton T-Shirt"]
    },
    "key_patterns": [
        "Pattern 1: Steel Frame is the dominant emitter due to its high weight and quantity.",
        "Pattern 2: Plastic Case has significant impact due to high emission factor.",
        "Pattern 3: Focus on reducing steel quantity or finding lower-emission alternatives."
    ],
    "analysis_summary": {
        "dominant_emitter": "Steel Frame at 68.44%",
        "primary_concern": "Volume of Steel",
        "recommended_focus": "Optimize the Steel Frame's material or quantity."
    }
}


def test_with_example_data():
    """
    Test the visualizer with example data structure
    """
    print("=" * 60)
    print("🧪 Testing Carbon Pilot Visualizer")
    print("=" * 60)
    
    print("\n📊 Using example analyzer output...")
    print(f"   - Products analyzed: {len(example_analyzer_output['impact_categories']['high_impact']) + len(example_analyzer_output['impact_categories']['medium_impact']) + len(example_analyzer_output['impact_categories']['low_impact'])}")
    print(f"   - Materials: {list(example_analyzer_output['material_insights'].keys())}")
    
    print("\n🎨 Creating visualizations...")
    
    # Create dashboard
    print("\n1️⃣ Creating interactive dashboard...")
    dashboard = save_dashboard(example_analyzer_output, "analyzer_dashboard.html")
    
    # Create detailed report
    print("2️⃣ Creating detailed report...")
    save_report(example_analyzer_output, "analyzer_report.html")
    
    print("\n✅ All visualizations created successfully!")
    print("\n📂 Files generated:")
    print("   - analyzer_dashboard.html (Interactive dashboard)")
    print("   - analyzer_report.html (Detailed report)")
    
    # Open files in browser
    print("\n🌐 Opening files in browser...")
    dashboard_path = os.path.abspath("analyzer_dashboard.html")
    report_path = os.path.abspath("analyzer_report.html")
    
    webbrowser.open(f'file://{dashboard_path}')
    print("   ✓ Opened dashboard")
    
    webbrowser.open(f'file://{report_path}')
    print("   ✓ Opened report")
    
    print("\n💡 Tip: Check your browser tabs!")
    print("=" * 60)


def test_with_agent(carbon_data):
    """
    Test by actually running the analyzer agent
    
    Args:
        carbon_data: Carbon footprint calculation data
    """
    print("=" * 60)
    print("🤖 Testing with Analyzer Agent")
    print("=" * 60)
    
    print("\n⚙️ Running analyzer agent...")
    
    # NOTE: This requires proper ADK setup and API keys
    # Uncomment when ready to test with actual agent
    
    # from google.adk import Session
    # session = Session()
    # 
    # # Run the agent with carbon data
    # response = root_agent.run(
    #     prompt=f"Analyze this carbon footprint data: {carbon_data}",
    #     session=session
    # )
    # 
    # # Get analysis results from session state
    # analysis_results = session.state.get("analysis_results")
    # 
    # if analysis_results:
    #     print("✅ Analysis complete!")
    #     
    #     # Create visualizations
    #     print("\n📊 Creating visualizations...")
    #     save_dashboard(analysis_results, "analyzer_dashboard.html")
    #     save_report(analysis_results, "analyzer_report.html")
    #     
    #     print("\n✅ Visualizations created successfully!")
    # else:
    #     print("❌ No analysis results found in session state")
    
    print("\n⚠️ Agent execution commented out - using example data instead")
    test_with_example_data()


if __name__ == "__main__":
    print("\n🌱 Carbon Pilot - Analyzer & Visualizer Demo\n")
    
    # For now, use example data
    # Once your agent is fully set up, you can uncomment the agent test
    test_with_example_data()
    
    # To test with actual agent:
    # test_with_agent(sample_carbon_data)
