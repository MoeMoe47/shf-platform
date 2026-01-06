// src/components/HeaderBrand.jsx
// Option A: importing from src/assets/brand/
import stackedLogo from '../assets/brand/shf-logo-stacked.svg';
// If you chose the public/ path instead, delete the import above and set
//   const stackedLogo = '/brand/shf-logo-stacked.svg';

export default function HeaderBrand() {
  return (
    <a className="app-headerBrand" href="/" aria-label="Silicon Heartland Foundation">
      <img
        className="app-brandImg"
        src={stackedLogo}
        alt="Silicon Heartland Foundation"
        decoding="async"
        fetchpriority="high"
      />
    </a>
  );
}
