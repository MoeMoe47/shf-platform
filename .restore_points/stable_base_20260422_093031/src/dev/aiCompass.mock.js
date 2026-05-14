export const pulses = {
  red: { type:"FeatureCollection", features:[
    { type:"Feature", properties:{ idx:64, metro:"Bay Area, CA" },  geometry:{ type:"Point", coordinates:[-122.3, 37.7] } }
  ]},
  green: { type:"FeatureCollection", features:[
    { type:"Feature", properties:{ idx:71, metro:"Cleveland, OH" }, geometry:{ type:"Point", coordinates:[-81.69, 41.49] } }
  ]},
  orange: { type:"FeatureCollection", features:[
    { type:"Feature", properties:{ idx:79, metro:"Columbus, OH" },  geometry:{ type:"Point", coordinates:[-82.99, 39.96] } }
  ]},
};

export const jobClock = {
  baselineTs: 1730448000000,              // any past timestamp (ms)
  displacedBase: 6157102,
  createdBase:   6494617,
  rDay: { displaced: 15000, created: 18000 },
  adjust: { displaced: 1.00, created: 1.03 },
};

export const tickerItems = [
  { id:1, color:"orange", label:"NoVA · DC Ops",                  detail:"+22% roles" },
  { id:2, color:"green",  label:"Columbus OH · Data-Center Tech", detail:"+24% growth" },
  { id:3, color:"orange", label:"Phoenix AZ · AI Packaging Ops",  detail:"+31% hiring" },
  { id:4, color:"red",    label:"Bay Area · Routine Admin",       detail:"−12% positions" },
];

export const aiScore = () => ({
  score: 82,
  explanations: [
    "Low automation exposure in care roles (+12)",
    "High local demand for logistics (+7)",
    "Add CompTIA A+ to unlock Data-Center Tech path (+8)",
  ],
});
