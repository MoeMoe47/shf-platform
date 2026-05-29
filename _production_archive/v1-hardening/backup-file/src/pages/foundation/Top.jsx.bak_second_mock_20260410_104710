import "@/styles/shf-home.css";
import heroBg from "@/assets/brand/hero-bg-ohio.png";
import heroPeople from "@/assets/brand/hero-people-cutout.png";
import logo from "@/assets/brand/shf-logo-stacked.svg";
import ohioMap from "@/assets/brand/shf-layer-map.svg";
import welderImg from "@/assets/brand/hero-welder.png";
import paperTexture from "@/assets/brand/paper-texture.png";

function StatItem({ value, label }) {
  return (
    <div className="home-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function FeatureCard({ icon, title, body }) {
  return (
    <article className="feature-card">
      <div className="feature-card__icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function ImpactTile({ title, image }) {
  return (
    <article className="impact-tile">
      <div className="impact-tile__media">
        <img src={image} alt="" loading="lazy" />
      </div>
      <div className="impact-tile__bar">
        <span>{title}</span>
        <span aria-hidden="true">›</span>
      </div>
    </article>
  );
}

export default function FoundationTop() {
  return (
    <div className="home-page">
      <div
        className="home-page__paper"
        aria-hidden="true"
        style={{ backgroundImage: `url(${paperTexture})` }}
      />
      <div className="home-page__grid" aria-hidden="true" />

      <header className="top-nav">
        <div className="shell top-nav__inner">
          <a className="top-nav__brand" href="#/top" aria-label="Silicon Heartland Foundation home">
            <img src={logo} alt="Silicon Heartland Foundation" />
          </a>

          <nav className="top-nav__links" aria-label="Primary">
            <a href="#/top">About</a>
            <a href="#/top">Programs</a>
            <a href="#/top">Impact</a>
            <a href="#/top">News</a>
            <a href="#/top">Get Involved</a>
          </nav>

          <div className="top-nav__actions">
            <button className="btn btn--primary" type="button">Donate</button>
            <button className="btn btn--secondary" type="button">SHF Command Center</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="shell">
            <div className="hero__frame">
              <div
                className="hero__bg"
                aria-hidden="true"
                style={{ backgroundImage: `url(${heroBg})` }}
              />
              <div className="hero__overlay" aria-hidden="true" />
              <div
                className="hero__people"
                aria-hidden="true"
                style={{ backgroundImage: `url(${heroPeople})` }}
              />

              <div className="hero__copy">
                <h1>Creating Pathways to Empower Ohio’s Workforce</h1>
                <p>
                  We bridge education, workforce training, and recovery programs to build a brighter
                  future for our communities.
                </p>
                <button className="btn btn--primary btn--hero" type="button">Learn More</button>
              </div>
            </div>

            <div className="stats-band">
              <StatItem value="12,500+" label="Lives impacted" />
              <StatItem value="4,200+" label="Certifications Earned" />
              <StatItem value="85%" label="Job Placement Rate" />
            </div>
          </div>
        </section>

        <section className="mission">
          <div className="shell center">
            <div className="section-kicker">Our Mission</div>
            <h2 className="section-title">
              Empowering Education, Workforce, and Recovery Across Ohio
            </h2>
            <p className="section-copy">
              We provide essential education, vocational training, and recovery programs to uplift lives,
              strengthen communities, and fuel economic growth.
            </p>

            <div className="features-grid">
              <FeatureCard
                icon="🎓"
                title="Education & Skills Training"
                body="Practical, career-focused programs covering fields like healthcare, technology, and more."
              />
              <FeatureCard
                icon="🤝"
                title="Workforce Development"
                body="Bridging the gap between hiring employers and determined workers."
              />
              <FeatureCard
                icon="🧡"
                title="Recovery Support"
                body="Helping Ohioans secure recovery pathways focused toward sustainability and wellness."
              />
            </div>

            <div className="center-cta">
              <button className="btn btn--primary btn--wide" type="button">View Our Programs</button>
            </div>
          </div>
        </section>

        <section className="impact">
          <div className="shell center">
            <h2 className="section-title section-title--dark">Real Impact, Real Results</h2>
            <p className="section-copy section-copy--dark">
              We’re making a tangible difference across Ohio: explore our impact in communities.
            </p>

            <div className="impact-grid">
              <ImpactTile title="Career Education" image={heroBg} />
              <ImpactTile title="Workforce Training" image={welderImg} />
              <article className="map-card">
                <img src={ohioMap} alt="Ohio map" />
              </article>
            </div>

            <div className="center-cta">
              <button className="btn btn--primary btn--wide" type="button">View Our Programs</button>
            </div>
          </div>
        </section>

        <section className="partners">
          <div className="shell center">
            <h2 className="section-title section-title--dark">Partnering with Ohio’s Leaders</h2>
            <p className="section-copy section-copy--dark">
              Trusted by organizations and communities across Silicon Heartland.
            </p>

            <div className="logos-row">
              <div>Ohio Means</div>
              <div>Job & Family Services</div>
              <div>Partners In Hope</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <div className="site-footer__col">
            <div>info@shfoundation.org</div>
            <div>(129) 466-7850</div>
          </div>

          <div className="site-footer__col">
            <h4>Understand Us</h4>
            <a href="#/top">About Us</a>
            <a href="#/top">SHF Leadership</a>
          </div>

          <div className="site-footer__col">
            <h4>Programs</h4>
            <a href="#/top">Programs & Skills Training</a>
            <a href="#/top">Workforce Development</a>
            <a href="#/top">Recovery Support</a>
          </div>

          <div className="site-footer__col">
            <h4>Resources</h4>
            <a href="#/top">Transparency</a>
            <a href="#/top">Impact Reports</a>
          </div>

          <div className="site-footer__socials" aria-label="Social links">
            <span>f</span>
            <span>x</span>
            <span>in</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
