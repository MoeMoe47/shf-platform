import React from 'react';
import { motion } from 'framer-motion';
export default function AIPredictPromo({ onStart }){
  return (
    <motion.aside className="promo" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}
      role="complementary" aria-label="AI Job Market Predictor">
      <h3>AI Job Market Predictor</h3>
      <p>Get a 6–12 month forecast for your ZIP and a personalized pathway.</p>
      <ul className="bullets">
        <li>Regional growth forecast (ZIP-level)</li>
        <li>AI-resistant vs AI-building role fit</li>
        <li>Action plan to boost your score</li>
      </ul>
      <button className="btn-primary" onClick={onStart}>Predict my outlook</button>
      <small className="fine">Powered by BLS baselines + postings momentum + SHF scoring.</small>
    </motion.aside>
  );
}
