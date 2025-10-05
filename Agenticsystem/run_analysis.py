"""
Carbon Pilot - Integration Script

This script demonstrates how to:
1. Run the analyzer agent with real carbon footprint data
2. Extract the dynamic output from the agent
3. Pass it to the visualizer to create reports

This is the REAL implementation that uses actual agent output, not hardcoded data.
"""

import webbrowser
import os
import json
from google.adk import Runner
from pilot.agent import root_agent
from visualizer import save_dashboard, save_report


def run_carbon_analysis(carbon_data):
    """
    Run the analyzer agent with actual carbon footprint data and visualize results
    
    Args:
        carbon_data: Dictionary containing product carbon footprint calculations
                    Expected format:
                    {
                        "products": [
                            {
                                "product_name": str,
                                "material_type": str,
                                "weight_kg": float,
                                "emission_factor": float,
                                "total_emissions": float
                            }
                        ],
                        "summary": {
                            "total_emissions": float,
                            "total_products": int,
                            "average_emissions_per_product": float
                        }
                    }
    
    Returns:
        dict: The analysis results from the analyzer agent
    """
    
    print("=" * 70)
    print("🌱 Carbon Pilot - Dynamic Analysis & Visualization")
    print("=" * 70)
    
    # Step 1: Format the input data for the agent
    print("\n📊 Input Data Summary:")
    print(f"   - Total Products: {carbon_data['summary']['total_products']}")
    print(f"   - Total Emissions: {carbon_data['summary']['total_emissions']:,.2f} kg CO2e")
    print(f"   - Products:")
    for product in carbon_data['products']:
        print(f"      • {product['product_name']}: {product['total_emissions']:,.2f} kg CO2e")
    
    # Step 2: Create the prompt for the analyzer agent
    prompt = f"""
    Please analyze the following carbon footprint data:
    
    PRODUCTS DATA:
    """
    
    for product in carbon_data['products']:
        prompt += f"""
    Product: {product['product_name']}
    - Material Type: {product['material_type']}
    - Weight: {product['weight_kg']} kg
    - Emission Factor: {product['emission_factor']} kg CO2e/kg
    - Total Emissions: {product['total_emissions']} kg CO2e
    - Percentage of Total: {(product['total_emissions'] / carbon_data['summary']['total_emissions'] * 100):.2f}%
    """
    
    prompt += f"""
    
    SUMMARY:
    - Total Emissions: {carbon_data['summary']['total_emissions']} kg CO2e
    - Total Products: {carbon_data['summary']['total_products']}
    - Average Emissions per Product: {carbon_data['summary']['average_emissions_per_product']:.2f} kg CO2e
    
    Please provide your analysis in the exact JSON structure specified in your instructions.
    """
    
    # Step 3: Run the analyzer agent
    print("\n🤖 Running Analyzer Agent...")
    print("   (This may take a few moments...)")
    
    try:
        # CORRECT WAY: Create runner without passing agent
        runner = Runner()
        
        # Run the agent - pass the agent and prompt to run method
        # The run method returns a generator of events
        events = []
        
        # Collect all events from the agent
        for event in runner.run(root_agent, prompt):
            events.append(event)
            
            # Print progress
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts'):
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            print("   Agent is thinking...")
        
        print("✅ Analysis Complete!")
        
        # Step 4: Extract the final response
        # The last event typically contains the final response
        if not events:
            print("\n❌ Error: No events received from agent")
            return None
        
        # Get the last event's text content
        final_event = events[-1]
        analysis_text = None
        
        if hasattr(final_event, 'content') and final_event.content:
            if hasattr(final_event.content, 'parts'):
                for part in final_event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        analysis_text = part.text
                        break
        
        if not analysis_text:
            print("\n❌ Error: Could not extract text from agent response")
            return None
        
        # Parse the JSON from the response
        # The agent should return pure JSON, but might have extra text
        try:
            # Try to find JSON in the response
            start_idx = analysis_text.find('{')
            end_idx = analysis_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                print("\n❌ Error: No JSON found in agent response")
                print(f"\nAgent Response:\n{analysis_text}")
                return None
            
            json_str = analysis_text[start_idx:end_idx]
            analysis_results = json.loads(json_str)
            
        except json.JSONDecodeError as e:
            print(f"\n❌ Error: Failed to parse JSON from agent response: {e}")
            print(f"\nAgent Response:\n{analysis_text}")
            return None
        
        print("✅ Analysis Complete!")
        
        # Step 5: Visualize the dynamic results
        print("\n🎨 Creating Visualizations from Agent Output...")
        
        # Create dashboard
        print("   1️⃣ Generating interactive dashboard...")
        save_dashboard(analysis_results, "carbon_analysis_dashboard.html")
        
        # Create detailed report
        print("   2️⃣ Generating detailed report...")
        save_report(analysis_results, "carbon_analysis_report.html")
        
        print("\n✅ Visualizations Created!")
        
        # Step 6: Open in browser
        print("\n🌐 Opening visualizations in browser...")
        dashboard_path = os.path.abspath("carbon_analysis_dashboard.html")
        report_path = os.path.abspath("carbon_analysis_report.html")
        
        webbrowser.open(f'file://{dashboard_path}')
        print("   ✓ Opened dashboard")
        
        webbrowser.open(f'file://{report_path}')
        print("   ✓ Opened detailed report")
        
        print("\n" + "=" * 70)
        print("✅ COMPLETE: Dynamic analysis and visualization finished!")
        print("=" * 70)
        
        return analysis_results
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {str(e)}")
        print("\nTroubleshooting:")
        print("   1. Check that your .env file has valid API keys")
        print("   2. Ensure the analyzer agent is properly configured")
        print("   3. Verify the input data format is correct")
        return None


# Example usage with real carbon footprint data
if __name__ == "__main__":
    
    # This would typically come from your carbon calculation service
    # Replace this with actual data from your Next.js app or calculation engine
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
    
    print("\n🚀 Starting Carbon Analysis with DYNAMIC Agent Output\n")
    print("📝 Note: This uses the ACTUAL analyzer agent output, not hardcoded data!")
    print("   The visualizer will display whatever the agent produces.\n")
    
    # Run the analysis with dynamic agent output
    results = run_carbon_analysis(sample_carbon_data)
    
    if results:
        print("\n✨ Success! The visualizations show dynamic data from the analyzer agent.")
    else:
        print("\n⚠️  Analysis failed. Check the error messages above.")
