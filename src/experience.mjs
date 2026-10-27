const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const clean=value=>typeof value==='string'?value.trim():'';

function formatMonth(value){
  const text=clean(value),match=text.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  return match?`${months[Number(match[2])-1]} ${match[1]}`:text;
}

export function formatExperiencePeriod({startDate,endDate}={}){
  const start=formatMonth(startDate),end=formatMonth(endDate);
  return start?`${start} – ${end||'Present'}`:end;
}

export function formatExperienceContext({employmentType,location,workMode}={}){
  return [employmentType,location,workMode].map(clean).filter(Boolean).join(' · ');
}
