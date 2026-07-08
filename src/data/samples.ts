// ---------------------------------------------------------------------------
// Sample resumes and job descriptions across career levels and domains, for
// QA, demos, and manual testing of the tailoring pipeline + career tools.
// These are fictional and safe to ship.
// ---------------------------------------------------------------------------

export interface SampleDoc {
  id: string;
  label: string;
  level: string;
  text: string;
}

export const SAMPLE_RESUMES: SampleDoc[] = [
  {
    id: "entry-grad",
    label: "Entry-level graduate",
    level: "entry",
    text: `Alex Rivera
alex.rivera@email.com | Austin, TX | linkedin.com/in/alexrivera

EDUCATION
B.S. Computer Science, University of Texas at Austin — GPA 3.7 (2025)

EXPERIENCE
Software Engineering Intern, BrightApps (Summer 2024)
- Built React components for a customer dashboard used by 2,000 users.
- Wrote unit tests that raised coverage from 40% to 75%.

PROJECTS
- Campus Events app (React Native, Firebase): 500+ installs.

SKILLS
JavaScript, React, Python, Git, SQL`,
  },
  {
    id: "mid-swe",
    label: "Mid-career software engineer",
    level: "mid",
    text: `Priya Nair
priya.nair@email.com | Remote | 8 years experience

EXPERIENCE
Senior Software Engineer, FinStack (2021–present)
- Led migration of a monolith to microservices, cutting deploy time 60%.
- Owned payments service handling $40M/month across 3M users.
- Mentored 4 engineers; ran the on-call rotation.

Software Engineer, DataCorp (2017–2021)
- Built ETL pipelines in Python and Airflow processing 2TB/day.

SKILLS
Node.js, TypeScript, React, PostgreSQL, AWS, Kubernetes, Airflow`,
  },
  {
    id: "exec-cio",
    label: "Executive (CIO)",
    level: "executive",
    text: `Michael Chen
michael.chen@email.com | New York, NY

SUMMARY
Technology executive with 18 years leading digital transformation for
enterprises. P&L ownership of $120M IT budgets and teams of 250+.

EXPERIENCE
Chief Information Officer, Global Retail Group (2018–present)
- Led a cloud migration that reduced infrastructure spend 35%.
- Launched an enterprise data platform enabling AI-driven merchandising.
- Built and led a 250-person global technology organization.

VP of Engineering, Nova Systems (2012–2018)
- Scaled engineering from 30 to 140 across 4 countries.

SKILLS
Digital transformation, cloud strategy, data & AI, vendor management, governance`,
  },
  {
    id: "tech-ml",
    label: "Technical (ML engineer)",
    level: "mid",
    text: `Dana Kim
dana.kim@email.com | Seattle, WA

EXPERIENCE
Machine Learning Engineer, VisionAI (2020–present)
- Trained and deployed CV models serving 10M predictions/day.
- Reduced inference latency 45% via quantization and batching.
- Built an MLOps pipeline with MLflow and Kubernetes.

Data Scientist, InsightLabs (2018–2020)
- Built churn models improving retention 12%.

SKILLS
Python, PyTorch, TensorFlow, MLflow, Kubernetes, SQL, Spark`,
  },
  {
    id: "pm",
    label: "Project / Program manager",
    level: "mid",
    text: `Sam Patel
sam.patel@email.com | Chicago, IL | PMP

EXPERIENCE
Senior Program Manager, BuildRight (2019–present)
- Delivered a $15M ERP rollout across 12 sites on time and under budget.
- Coordinated 6 cross-functional teams and 40+ stakeholders.

Project Manager, CoreWorks (2015–2019)
- Ran Agile delivery for a mobile banking product (8 releases/year).

SKILLS
Agile/Scrum, stakeholder management, roadmapping, risk management, Jira`,
  },
  {
    id: "sales",
    label: "Sales / Account executive",
    level: "mid",
    text: `Jordan Lee
jordan.lee@email.com | Boston, MA

EXPERIENCE
Enterprise Account Executive, CloudSell (2020–present)
- Closed $6.2M in new ARR in 2024; 118% of quota.
- Managed a pipeline of 40 enterprise accounts.

Account Executive, GrowthCo (2017–2020)
- Grew territory revenue 3x in two years.

SKILLS
Enterprise sales, pipeline management, negotiation, Salesforce, forecasting`,
  },
];

export const SAMPLE_JDS: SampleDoc[] = [
  {
    id: "jd-generic-swe",
    label: "Generic software engineer",
    level: "mid",
    text: `Senior Full-Stack Engineer

We're looking for a senior engineer to build and scale our web platform.
Responsibilities: design and ship features across the stack; improve
reliability; mentor engineers.
Requirements: 5+ years with React and Node.js; experience with PostgreSQL and
cloud (AWS/GCP); strong testing habits. Nice to have: Kubernetes, TypeScript.`,
  },
  {
    id: "jd-executive",
    label: "Executive (VP/CIO)",
    level: "executive",
    text: `Chief Information Officer

Lead the enterprise technology strategy and a global organization. Own the IT
budget and drive digital and AI transformation.
Requirements: 15+ years in technology leadership; proven cloud migration and
data/AI initiatives; P&L ownership; experience scaling large teams; excellent
executive communication and governance.`,
  },
  {
    id: "jd-technical-ml",
    label: "Technical (ML engineer)",
    level: "mid",
    text: `Machine Learning Engineer

Build, deploy, and scale ML models in production.
Requirements: strong Python; PyTorch or TensorFlow; MLOps experience (MLflow,
Docker, Kubernetes); model optimization (quantization, batching); SQL. Bonus:
computer vision, Spark, low-latency serving.`,
  },
];
