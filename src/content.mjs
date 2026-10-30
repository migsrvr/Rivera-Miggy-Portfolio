// Edit this file to add project links, recordings, logos, and real credentials.
export const profile = {
  name: 'Miggy Rivera', fullName: 'Miggy G. Rivera', role: 'Software developer',
  intro: 'I’m an Information Technology student at Jose Rizal University. I build web applications, APIs, and tools for complex workflows.',
  current: 'Currently interning at Top Realty Corporation and serving as The Vice President External at AWS Student Builder Group - JRU.',
  email: 'rivera.dev.miggy@gmail.com', resume: '/assets/resume.pdf', github: 'https://github.com/migsrvr', linkedin: null,
  photo: '/assets/stage-speaking.png', photoAlt: 'Miggy Rivera speaking into a microphone on stage at a general assembly.',
};

export const deployed = [
  {id:'aws-website',title:'AWS Website',role:'Web Development Lead · AWS SBG–JRU',
    purpose:'The organization’s website brings projects, events, and registration into one platform.',
    contribution:'I led development and built most of the site, including centralized registration, the admin review dashboard, and automated email notifications.',
    tools:['JavaScript','FastAPI','Supabase','Vercel'],url:'https://www.awssbgjru.me',repositoryUrl:'https://github.com/migsrvr/awssbgjru'},
  {id:'aws-photobooth',title:'AWS Photobooth',role:'Solo Full Stack Developer',purpose:'Event photobooth kiosk for capturing, printing, and emailing photos.',
    contribution:'Served as the sole full stack developer.',tools:['React','FastAPI','Vercel','Railway'],url:'https://aws-photobooth.vercel.app',repositoryUrl:'https://github.com/migsrvr/AWS-Photobooth'},
  {id:'care-cures',title:'Care Cures',role:'Solo Full Stack Developer',purpose:'Bilingual (English/Tagalog) health information on the Philippines’ 20 priority diseases.',
    contribution:'Served as the sole full stack developer on a freelance project for nursing students at the University of Makati.',tools:['Next.js','TypeScript','Supabase','Vercel'],url:'https://health-service-one.vercel.app',repositoryUrl:'https://github.com/migsrvr/Health-Service'},
  {id:'mediseena',title:'Mediseena',role:'Project Manager / Full Stack Developer',purpose:'Turns handwritten and printed prescriptions into structured, reviewable digital records.',
    contribution:'Managed the project and contributed to full stack development.',tools:['React','Supabase','Google Gemini','Tesseract.js','Vercel'],url:'https://mediseena.vercel.app',repositoryUrl:'https://github.com/migsrvr/Mediseena'},
  {id:'pax-virentia',title:'Pax Virentia',role:'Project Manager / Full Stack Developer',purpose:'Economic and environmental simulation for water-treatment operating scenarios.',
    contribution:'Managed the project and contributed to full stack development.',tools:['React','TypeScript','FastAPI','PostgreSQL','Vercel'],url:'https://pax-virentia.vercel.app',repositoryUrl:'https://github.com/migsrvr/Pax-Virentia'},
  {id:'hydra',title:'Hydra',role:'AI Engineer / Backend Developer',purpose:'Public infrastructure transparency and risk screening.',
    contribution:'Built a pipeline to validate, geocode, and analyze public infrastructure records, with a rule-based risk engine. Developed as a hackathon project.',tools:['Python','Flask','SQLite'],url:null,repositoryUrl:null},
  {id:'rule-vii',title:'Rule VII',role:'AI Engineer / Full Stack Developer',purpose:'Architectural regulation retrieval.',
    contribution:'Built document extraction, hybrid retrieval, and authenticated APIs for searching architectural regulations.',tools:['Next.js','FastAPI','Supabase','pgvector','Groq'],url:'https://rule-vii-frontend.vercel.app',repositoryUrl:'https://github.com/migsrvr/Rule-VII---AI-Architect'},
  {id:'hima-paiflow',title:'Hima-Paiflow',role:'Full Stack Mobile Developer',purpose:'Student allowance app with Safe-to-Spend budgeting, AI advice, and NFC tap-to-pay on the Stellar testnet.',
    contribution:'Handled full stack mobile development for a hackathon project.',tools:['React Native','Expo','TypeScript','Express','Stellar','Groq'],url:'https://hima-showcase.vercel.app',repositoryUrl:'https://github.com/migsrvr/hima-paiflow'},
  {id:'desktop-widget',title:'SESSION',role:'Full Stack Desktop Developer',purpose:'Tasks, focus sessions, and AI plan allowances in one calm workspace, on the web and desktop.',
    contribution:'Handled full stack desktop development.',tools:['React','TypeScript','Vite','Tauri','Rust'],url:'https://session-xi-mauve.vercel.app',repositoryUrl:'https://github.com/migsrvr/Desktop-widget'},
];

export const featured = [
  {id:'aws-website',title:'AWS Website',summary:'Web Development Lead · AWS SBG–JRU',
    contribution:'Led development and built most of the site, from registration to admin review and email.',tools:'JavaScript · FastAPI · Supabase',
    stages:[{title:'Registration',detail:['Applicant details','Database storage'],shortTitle:'Register',shortDetail:'Applicants'},{title:'Review',detail:['Admin dashboard','Application status'],shortTitle:'Review',shortDetail:'Statuses'},{title:'Notifications',detail:['Email workflow','Application updates'],shortTitle:'Email',shortDetail:'Updates'}]},
  {id:'rule-vii',title:'Rule VII',summary:'Architectural regulation retrieval.',
    contribution:'Built document extraction, hybrid search, and secured APIs for architectural regulations.',tools:'Next.js · FastAPI · Supabase · Groq',
    stages:[{title:'Documents',detail:['Building Code','Fire Code · BP 344'],shortTitle:'Documents',shortDetail:'Codes'},{title:'Indexing',detail:['Parsing','Vector storage'],shortTitle:'Indexing',shortDetail:'Vectors'},{title:'Retrieval',detail:['Semantic search','Keyword search'],shortTitle:'Retrieval',shortDetail:'Passages'}]},
  {id:'hydra',title:'HYDRA',summary:'Flood control transparency system.',
    contribution:'Built a public-project data pipeline and rule-based risk screening for infrastructure records.',tools:'Python · Flask · SQLite',
    stages:[{title:'Records',detail:['Public project data','Contractor records'],shortTitle:'Records',shortDetail:'Projects'},{title:'Processing',detail:['Validation','Geocoding'],shortTitle:'Processing',shortDetail:'Validation'},{title:'Risk screening',detail:['Costs & timelines','Project anomalies'],shortTitle:'Risk screening',shortDetail:'Risk flags'}]},
];

const awsWebLeadership = {
  role:'Web Developer Lead',organization:'AWS Student Builder Group — JRU',
  description:'Led a team of 10 developers in building the organization’s official website using Vanilla JavaScript, HTML5, CSS3, and Supabase, deployed on Vercel. Managed Git workflows, weekly sprints, and code reviews while mentoring members in Git, JavaScript, and web fundamentals. Delivered a responsive site with WebP assets, caching, prerendering, and an integrated AI chatbot, and refined the interface through user testing.',
  startDate:'2026-01',endDate:null,employmentType:'Student leadership',location:null,workMode:'Hybrid',logo:'/assets/aws_student_builder_group_jru_logo.jfif',
};
const awsExternalLeadership = {
  role:'Vice President of External Affairs',organization:'AWS Student Builder Group — JRU',
  description:'Lead external relations and partnership strategy from outreach through MOA execution. Onboarded two official partners, including AWS Learning Club – Polar Chapter, and manage 5–10 partnership inquiries monthly. Represent the organization at AWS, Canva, and StellarX events, supervise the Relations Committee, draft formal correspondence, and evaluate proposals against the organization’s CBL and community interests.',
  startDate:'2026-04',endDate:null,employmentType:'Student leadership',location:null,workMode:'Hybrid',logo:'/assets/aws_student_builder_group_jru_logo.jfif',
};

export const experiences = [
  {id:'top-realty',projectIds:[],role:'Information Technology Intern',organization:'Top Realty Corporation',
    description:'Currently completing an information technology internship at Top Realty Corporation.',
    startDate:'2026-10',endDate:null,employmentType:'Internship',location:'Makati, National Capital Region, Philippines',workMode:'On-site',logo:'/assets/top_realty_corporation_logo.jfif'},
  {id:'workflow-ph',projectIds:[],role:'Tech Officer',organization:'WorkFlow PH',description:null,
    startDate:'2026-02',endDate:null,employmentType:'Full-time',location:null,workMode:null,logo:'/assets/WorkFlowPH.jfif'},
  {id:'aws-external-affairs',projectIds:[],...awsExternalLeadership},
  {id:'aws-sbg-jru',projectIds:['aws-website'],...awsWebLeadership},
  {id:'flyrank-ai',projectIds:[],role:'Backend AI Engineer Intern',organization:'FlyRank AI',
    description:'Completed an internship focused on backend AI engineering at FlyRank AI.',
    startDate:'2026-06',endDate:'2026-09',employmentType:'Internship',location:'Chicago, Illinois, United States',workMode:'Remote',logo:'/assets/flyrank_logo.jfif'},
  {id:'freelance',projectIds:['care-cures'],role:'Freelance developer',organization:'Independent commissions',
    description:'Completed two freelance projects for nursing and engineering students.',
    startDate:null,endDate:null,employmentType:'Freelance',location:null,workMode:null,logo:'/assets/favicon.svg'},
];

// Owner-supplied earned badges; use public Credly URLs so visitors can verify without signing in.
// The two IT Specialist dates are expiry dates, not inferred issue dates.
export const credentials = [
  {id:'aws-sbg-core-team-member',name:'AWS SBG Core Team Member Badge',provider:'AWS Community',logo:'/assets/credentials/aws-sbg-core-team-member.png',url:'https://www.credly.com/badges/1a916a6e-5e2c-4e80-94f5-a7ba1e4547d4/public_url',date:'Issued Jul 22, 2026',category:'Community recognition',linkLabel:'Verify',sample:false},
  {id:'comptia-itf-plus',name:'CompTIA IT Fundamentals+ (ITF+) Certification',provider:'CompTIA',logo:'/assets/credentials/comptia-itf-plus.png',url:'https://www.credly.com/badges/7a72f3e5-3a4d-4bc7-a89b-47f40b23af28/public_url',date:'Issued Nov 27, 2024',category:'Certification',linkLabel:'Verify',sample:false},
  {id:'it-specialist-databases',name:'IT Specialist - Databases',provider:'Certiport, a Pearson VUE business',logo:'/assets/credentials/it-specialist-databases.png',url:'https://www.credly.com/badges/d88adc6b-2e0e-4d40-b0d2-90e20331f604/public_url',date:'Expires May 6, 2031',category:'Certification',linkLabel:'Verify',sample:false},
  {id:'it-specialist-java',name:'IT Specialist - Java',provider:'Certiport, a Pearson VUE business',logo:'/assets/credentials/it-specialist-java.png',url:'https://www.credly.com/badges/e000ce45-a027-4b71-8eb7-f92a71f743a3/public_url',date:'Expires Nov 12, 2030',category:'Certification',linkLabel:'Verify',sample:false},
  {id:'javascript-essentials-1',name:'JavaScript Essentials 1',provider:'Cisco',logo:'/assets/credentials/javascript-essentials-1.png',url:'https://www.credly.com/badges/bc2da1a8-73a2-48ed-93cc-ae7772519251/public_url',date:'Issued Aug 9, 2026',category:'Course completion',linkLabel:'Verify',sample:false},
  {id:'javascript-essentials-2',name:'JavaScript Essentials 2',provider:'Cisco',logo:'/assets/credentials/javascript-essentials-2.png',url:'https://www.credly.com/badges/cd183c20-9e35-4321-adc3-2cae2ca48e99/public_url',date:'Issued Aug 12, 2026',category:'Course completion',linkLabel:'Verify',sample:false},
];

export const communityPages = [
  {
    id:'hackathons',path:'/hackathons/',title:'Hackathons',
    intro:'Hackathon experiences, projects, and collaborations.',
    summary:'Events, projects, and outcomes.',
    sampleNote:'Sample entry. Event details will be added here.',
    entries:[{role:'Hackathon experience',organization:'Event name to be added',description:'Participation, project, and outcome details coming soon.',logo:null}],
  },
  {
    id:'leadership',path:'/leadership/',title:'Leadership',
    intro:'Student leadership and development responsibilities.',
    summary:'AWS SBG–JRU leadership roles.',
    entries:[
      {...awsWebLeadership},
      {...awsExternalLeadership},
    ],
  },
  {
    id:'organizations',path:'/organizations/',title:'Organizations',
    intro:'Student groups and campus communities.',
    summary:'AWS SBG–JRU and Notion Campus Leader.',
    entries:[
      {role:'AWS Student Builder Group — JRU',organization:'Jose Rizal University',description:awsWebLeadership.role+' · '+awsExternalLeadership.role,logo:'/assets/aws_student_builder_group_jru_logo.jfif'},
      {role:'Notion Campus Leader',organization:'Notion',description:null,logo:null},
    ],
  },
];

// Project connections above include only owner-confirmed experience associations.
// Legacy Gallery records remain editable in admin; no public Gallery is generated.
export const gallery = [
  {id:'community',title:'Community moments',caption:'Photo to be added',image:null},
  {id:'hackathons',title:'Hackathons',caption:'Photo to be added',image:null},
  {id:'behind-the-scenes',title:'Behind the scenes',caption:'Photo to be added',image:null},
];
export const assistantContent={profile,projects:deployed};

export const routes = [
  {path:'/',title:'Miggy Rivera — Software developer',description:'Selected development work, experience, and credentials from Miggy Rivera.'},
  {path:'/projects/',title:'Projects — Miggy Rivera',description:'Live projects and code.'},
  {path:'/experience/',title:'Experience — Miggy Rivera',description:'Internships, independent work, and student leadership.'},
  {path:'/credentials/',title:'Credentials — Miggy Rivera',description:'Certifications, speaking, hackathons, and other recognition.'},
  ...communityPages.map(page=>({path:page.path,title:page.title+' — Miggy Rivera',description:page.intro})),
];
