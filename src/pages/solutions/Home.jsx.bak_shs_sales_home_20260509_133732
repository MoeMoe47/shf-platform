// src/pages/solutions/Home.jsx
import React from "react";
import { motion } from "framer-motion";
import content from "@/content/solutions.content.json";

const fadeUp = { hidden:{opacity:0,y:16}, show:{opacity:1,y:0,transition:{duration:.5}} };

function Marquee({ logos=[] }) {
  return (
    <div className="sol-marquee" aria-label="Partners">
      <div className="sol-marquee__track">
        {[0,1].map(k=>(
          <div className="sol-marquee__row" key={k}>
            {logos.map((src,i)=> <img className="sol-marquee__logo" src={src} alt="" key={i} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home(){
  const { hero, product=[], ecosystemLogos=[], blog=[] } = content;

  return (
    <div className="sol-home">

      {/* HERO (your copy & media) */}
      <section className="sol-hero">
        <div className="sol-blob" aria-hidden />
        <motion.h1 initial="hidden" whileInView="show" viewport={{ once:true }} variants={fadeUp}>
          {hero.headline}
        </motion.h1>
        {hero.sub && (
          <motion.p initial="hidden" whileInView="show" variants={fadeUp} className="sol-sub">
            {hero.sub}
          </motion.p>
        )}
        <div className="sol-heroCtas">
          {hero.primaryCta && <a className="sol-btn sol-btn--primary" href={hero.primaryCta.href}>{hero.primaryCta.label}</a>}
          {hero.secondaryCta && <a className="sol-btn" href={hero.secondaryCta.href}>{hero.secondaryCta.label}</a>}
        </div>
        {hero.media?.type === "image" && (
          <motion.img
            initial={{opacity:0, y:10}} whileInView={{opacity:1, y:0}} viewport={{once:true}}
            src={hero.media.src} alt={hero.media.alt||""}
            style={{marginTop:24, borderRadius:12, maxWidth:"min(1100px, 92vw)", border:"1px solid var(--line)"}}
          />
        )}
      </section>

      {/* PRODUCT STRIP */}
      <section className="sol-section">
        <motion.h2 initial="hidden" whileInView="show" variants={fadeUp}>Product</motion.h2>
        <div className="sol-cards">
          {product.map((p,i)=>(
            <motion.a key={i} href={p.href||"#"} className="sol-card hover-lift"
              initial={{opacity:0, y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.05}}>
              <div className="sol-card__title">{p.title}</div>
              <div className="sol-card__meta">{p.meta}</div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* ECOSYSTEM MARQUEE */}
      <section className="sol-section">
        <motion.h2 initial="hidden" whileInView="show" variants={fadeUp}>Ecosystem</motion.h2>
        <Marquee logos={ecosystemLogos} />
      </section>

      {/* BLOG TEASER */}
      <section className="sol-section">
        <motion.h2 initial="hidden" whileInView="show" variants={fadeUp}>From the blog</motion.h2>
        <div className="sol-cards">
          {blog.map((b,i)=>(
            <a key={i} className="sol-card hover-lift" href={b.href||"#"}>
              <div className="sol-card__title">{b.title}</div>
              <div className="sol-card__meta">{b.teaser}</div>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}
