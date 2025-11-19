from google.adk.agents.llm_agent import LlmAgent
import os
import json

# Load business requirements
req_path = os.path.join(os.path.dirname(__file__), 'business_requirements.json')
try:
    with open(req_path, 'r') as f:
        business_requirements = f.read()
except FileNotFoundError:
    business_requirements = "No business requirements found."

# Assume 'analyzer_agent' is the agent you defined in your question.
# analyzer_agent = LlmAgent(...) 

loop_agent = LlmAgent(
    name="loop_agent",
    model="gemini-2.0-flash", # Using a more powerful model for creative, strategic recommendations
    description="Generates actionable strategies to reduce carbon footprint based on analysis",
    
    instruction=f"""
    You are the Loop Agent orchestrating business requirement capture and optimization alignment.
    
    CRITICAL: Return ONLY the JSON object. Do NOT include any explanatory text before or after the JSON.
    Do NOT wrap in markdown code blocks. Do NOT add commentary. ONLY return raw JSON starting with {{ and ending with }}.
    
    Your goal is to transform analyzer insights into concrete demo business requirements, persist them, and then refine optimization advice accordingly.

    IMPORTANT: You ONLY focus on the 'high_impact' and 'medium_impact' categories provided. Ignore 'low_impact' items for optimization.

    CURRENT BUSINESS REQUIREMENTS:
    {business_requirements}

    WORKFLOW:
    1. Parse the JSON payload from the Analyzer Agent and extract the most critical challenges, opportunities, and quick wins.
    2. Evaluate the optimizations suggested by the Analyzer Agent, refining or extending them so they align with the CURRENT BUSINESS REQUIREMENTS provided above.
    3. Output the enhanced optimization plan using the schema below.

    RECOMMENDATION FRAMEWORK:
    For each high and medium impact product, formulate your advice considering these angles:

    1.  **Material Substitution:**
        - Can a lower-carbon alternative be used? (e.g., recycled content, bio-plastics, sustainably sourced materials).
        - Suggest specific alternative materials and justify why they are better.

    2.  **Supplier Engagement & Sourcing:**
        - Recommend collaborating with suppliers to get more sustainable materials.
        - Suggest sourcing from suppliers who use renewable energy or have better environmental practices.

    3.  **Product Design & Efficiency (Redesign):**
        - Can the product be redesigned to use less material? (e.g., lightweighting).
        - Can the design be optimized for easier disassembly and recycling?

    4.  **Process Improvement:**
        - Suggest potential improvements in the manufacturing process that could reduce waste or energy consumption associated with the material.

    INPUT:
    You will receive a JSON object from the 'optimizer_agent' containing categories, insights, and priorities.

    OUTPUT REQUIREMENTS:
    Provide your recommendations in this EXACT JSON structure. Do NOT add any text or explanations outside of the JSON block.
    Do NOT change key names. Do NOT add extra nesting levels. Do NOT wrap the JSON in markdown code blocks (e.g., ```json ... ```).
    The output must be a raw JSON string starting with '{' and ending with '}'.

    {{
      "optimization_strategies": {{
        "high_impact_recommendations": [
          {{
            "product_name": "string (from input)",
            "current_material": "string (from input)",
            "primary_issue": "High Emission Factor / High Volume / Both",
            "proposed_strategies": [
              {{
                "strategy_type": "Material Substitution | Supplier Engagement | Product Redesign | Process Improvement",
                "specific_actions": [
                    "Actionable step 1 for this strategy.",
                    "Actionable step 2 for this strategy."
                ],
                "expected_outcome": "Brief description of the expected positive environmental impact."
              }}
            ]
          }}
        ],
        "medium_impact_recommendations": [
          {{
            "product_name": "string (from input)",
            "current_material": "string (from input)",
            "primary_issue": "High Emission Factor / High Volume / Both",
            "proposed_strategies": [
              {{
                "strategy_type": "Material Substitution | Supplier Engagement | Product Redesign | Process Improvement",
                "specific_actions": [
                    "Actionable step 1.",
                    "Actionable step 2."
                ],
                "expected_outcome": "Brief description of the expected positive environmental impact."
              }}
            ]
          }}
        ]
      }},
      "strategic_summary": {{
        "overall_recommendation": "A brief, high-level summary of the most critical action to take.",
        "synergy_opportunities": "Identify if strategies for different products can be combined (e.g., sourcing the same sustainable alternative for multiple products)."
      }}
    }}

    RULES:
    - STRICTLY FOLLOW THE JSON SCHEMA ABOVE.
    - Do NOT rename keys (e.g., do not use "strategies" instead of "proposed_strategies").
    - Do NOT add extra nesting (e.g., do not wrap the whole object in a "result" key).
    - BE SPECIFIC AND ACTIONABLE. Avoid vague advice like "be more green."
    - Ground your recommendations in the data provided (e.g., "Since Aluminum has a high emission factor...").
    - Focus ONLY on the 'high_impact' and 'medium_impact' products from the input.
    - Directly address the 'strategic_targets' and 'quick_wins' identified in the analysis.
    - Ensure the output is a single, valid JSON object.
    """,
    
    output_key="final_plan"
)