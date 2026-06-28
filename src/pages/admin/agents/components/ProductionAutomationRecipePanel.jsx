import React from "react";

export default function ProductionAutomationRecipePanel({ recipes = [], agentsById = {}, onCreateRun }) {
  return (
    <section className="agent-workbench-panel production-automation-recipes" aria-label="Production Automation V2 Recipes">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Automation Recipes</span>
          <strong>{recipes.length} safe V2 recipes</strong>
        </div>
      </div>
      <div className="agent-template-grid production-automation-recipe-grid">
        {recipes.map((recipe) => (
          <article key={recipe.automation_recipe_id}>
            <span>{recipe.recipe_type} · {recipe.risk_level}</span>
            <strong>{recipe.title}</strong>
            <p>{recipe.description}</p>
            <small>Owner: {agentsById[recipe.owner_agent_id]?.name || recipe.owner_agent_id}</small>
            <small>Outputs: {recipe.outputs?.join(", ")}</small>
            <button type="button" onClick={() => onCreateRun(recipe.automation_recipe_id)}>Create Automation Run</button>
          </article>
        ))}
      </div>
    </section>
  );
}
