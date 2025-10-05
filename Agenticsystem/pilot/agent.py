"""
Carbon Pilot Root Agent

This module defines the root agent for the carbon footprint analysis application.
It uses a sequential agent that executes specialized sub-agents in a predefined order,
with each agent's output feeding into the next agent in the sequence.
"""

from google.adk.agents import SequentialAgent
from .subagents.analyzer_agent import analyzer_agent
from .subagents.optimizer_agent import optimizer_agent


# Create the Sequential Pipeline following proper sequential pattern
root_agent = SequentialAgent(
    name="pilot",
    sub_agents=[
        analyzer_agent,  # Step 1: Analyze carbon footprint data
        optimizer_agent  # Step 2: Identify optimization opportunities
    ],
    description="Sequential pipeline: analyzes carbon data and identifies optimization opportunities",
)