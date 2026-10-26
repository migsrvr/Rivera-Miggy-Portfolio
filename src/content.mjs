// Edit this file to add project links, recordings, logos, and real credentials.
export const profile = {
  name: 'Miggy Rivera', fullName: 'Miggy G. Rivera', role: 'Software developer',
  intro: 'I’m an Information Technology student at Jose Rizal University. I build web applications, APIs, and tools for complex workflows.',
  current: 'Currently interning at Top Realty Corporation.',
  email: 'rivera.dev.miggy@gmail.com', resume: '/assets/resume.pdf', github: 'https://github.com/migsrvr', linkedin: null,
  photo: '/assets/stage-speaking.png', photoAlt: 'Miggy Rivera speaking into a microphone on stage at a general assembly.',
};

export const deployed = [
  {id:'aws-website',title:'AWS Website',role:'Web Development Lead · AWS SBG–JRU',
    purpose:'The organization’s website brings projects, events, and registration into one platform.',
    contribution:'I led development and built most of the site, including centralized registration, the admin review dashboard, and automated email notifications.',
    tools:['JavaScript','FastAPI','Supabase','Vercel'],url:null,repositoryUrl:null},
  ...[
    ['aws-photobooth','AWS Photobooth'],['care-cures','Care Cures'],['mediseena','Mediseena'],['pax-virentia','Pax Virentia'],
  ].map(([id,title])=>({id,title,role:null,purpose:null,contribution:null,tools:[],url:null,repositoryUrl:null})),
];

export const recorded = [
  {id:'hydra',title:'Hydra',mark:'HY',purpose:'Public infrastructure transparency and risk screening.',
    contribution:'Built a pipeline to validate, geocode, and analyze public infrastructure records, with a rule-based risk engine.',videoUrl:null,repositoryUrl:null,poster:null},
  {id:'rule-vii',title:'Rule VII',mark:'VII',purpose:'Architectural regulation retrieval.',
    contribution:'Built document extraction, hybrid retrieval, and authenticated APIs for searching architectural regulations.',videoUrl:null,repositoryUrl:null,poster:null},
  ...[['hima-paiflow','Hima-Paiflow','HP'],['desktop-widget','Desktop-Widget','DW'],['snea','SNEA','SN']].map(([id,title,mark])=>({id,title,mark,purpose:'Project walkthrough to be added.',contribution:null,videoUrl:null,repositoryUrl:null,poster:null})),
];

export const featured = [
  {id:'aws-website',title:'AWS Website',summary:'Web Development Lead · AWS SBG–JRU',
    contribution:'Led development and built most of the site, from registration to admin review and email.',tools:'JavaScript · FastAPI · Supabase',
    stages:[{title:'Registration',detail:['Applicant details','Database storage'],shortTitle:'Register',shortDetail:'Applicants'},{title:'Review',detail:['Admin dashboard','Application status'],shortTitle:'Review',shortDetail:'Statuses'},{title:'Notifications',detail:['Email workflow','Application updates'],shortTitle:'Email',shortDetail:'Updates'}]},
  {id:'rule-vii',title:'Rule VII',summary:'Architectural regulation retrieval.',
    contribution:'Built document extraction, hybrid search, and secured APIs for architectural regulations.',tools:'Python · FastAPI · PostgreSQL',
    stages:[{title:'Documents',detail:['Building Code','Fire Code · BP 344'],shortTitle:'Documents',shortDetail:'Codes'},{title:'Indexing',detail:['Parsing','Vector storage'],shortTitle:'Indexing',shortDetail:'Vectors'},{title:'Retrieval',detail:['Semantic search','Keyword search'],shortTitle:'Retrieval',shortDetail:'Passages'}]},
  {id:'hydra',title:'HYDRA',summary:'Flood control transparency system.',
    contribution:'Built a public-project data pipeline and rule-based risk screening for infrastructure records.',tools:'Python · Flask · SQLite',
    stages:[{title:'Records',detail:['Public project data','Contractor records'],shortTitle:'Records',shortDetail:'Projects'},{title:'Processing',detail:['Validation','Geocoding'],shortTitle:'Processing',shortDetail:'Validation'},{title:'Risk screening',detail:['Costs & timelines','Project anomalies'],shortTitle:'Risk screening',shortDetail:'Risk flags'}]},
];

export const experiences = [
  {id:'top-realty',projectIds:['hydra','snea'],role:'Intern',organization:'Top Realty Corporation',description:'Currently completing an internship at Top Realty Corporation.',logo:null},
  {id:'freelance',projectIds:['care-cures','mediseena','pax-virentia','rule-vii'],role:'Freelance developer',organization:'Independent commissions',description:'Completed two freelance projects for nursing and engineering students.',logo:null},
  {id:'aws-sbg-jru',projectIds:['aws-website','aws-photobooth','hima-paiflow','desktop-widget'],role:'Web Development Lead',organization:'AWS Student Builder Group — JRU',description:'Led development and built most of the AWS Website, including registration, admin review, and automated email notifications.',logo:null},
];

// Approved mockup entries. Replace with actual certificate names and providers.
// Use linkLabel: 'View certificate' for document evidence instead of issuer verification.
export const credentials = ['Professional certification','Speaker certificate','Hackathon recognition','Course completion certificate','Workshop certificate','Participation certificate'].map((name,index)=>({id:`credential-${index+1}`,name,provider:'Provider or organizer',logo:null,url:null,linkLabel:'Verify',sample:true}));

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
      {role:'Web Development Lead',organization:'AWS Student Builder Group — JRU',description:'Led development and built most of the AWS Website, including centralized registration, admin review, and automated email notifications.',logo:null},
      {role:'VP of External Affairs',organization:'AWS Student Builder Group — JRU',description:null,logo:null},
    ],
  },
  {
    id:'organizations',path:'/organizations/',title:'Organizations',
    intro:'Student groups and campus communities.',
    summary:'AWS SBG–JRU and Notion Campus Leader.',
    entries:[
      {role:'AWS Student Builder Group — JRU',organization:'Jose Rizal University',description:'Web Development Lead · VP of External Affairs',logo:null},
      {role:'Notion Campus Leader',organization:'Notion',description:null,logo:null},
    ],
  },
];

// Sample project connections are approved mockup data; replace projectIds above.
export const gallery = [
  {id:'on-stage',title:'On stage',caption:'Speaking at a general assembly.',image:profile.photo,alt:profile.photoAlt},
  {id:'community',title:'Community moments',caption:'Photo to be added',image:null},
  {id:'hackathons',title:'Hackathons',caption:'Photo to be added',image:null},
  {id:'behind-the-scenes',title:'Behind the scenes',caption:'Photo to be added',image:null},
];
export const assistantContent={profile,projects:[...deployed,...recorded]};

export const routes = [
  {path:'/',title:'Miggy Rivera — Software developer',description:'Selected development work, experience, and credentials from Miggy Rivera.'},
  {path:'/projects/',title:'Projects — Miggy Rivera',description:'Deployed websites, recorded walkthroughs, and development projects.'},
  {path:'/experience/',title:'Experience — Miggy Rivera',description:'Internships, independent work, and student leadership.'},
  {path:'/credentials/',title:'Credentials — Miggy Rivera',description:'Certifications, speaking, hackathons, and other recognition.'},
  ...communityPages.map(page=>({path:page.path,title:page.title+' — Miggy Rivera',description:page.intro})),
  {path:'/gallery/',title:'Gallery — Miggy Rivera',description:'Moments from speaking, community, and building.'},
  ...experiences.map(item=>({path:'/experience/'+item.id+'/',title:item.organization+' — Miggy Rivera',description:item.description})),
];
