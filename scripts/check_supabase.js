const fs = require('fs');
const path = require('path');

async function main(){
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if(!fs.existsSync(envPath)){
    console.error('.env.local not found at', envPath);
    process.exit(2);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const env = {};
  for(const line of lines){
    const m = line.match(/^([^=]+)=(.*)$/);
    if(m){ env[m[1]] = m[2]; }
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url || !key){
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    process.exit(2);
  }

  const endpoint = `${url.replace(/\/+$/,'')}/rest/v1/products?select=*`;
  console.log('Checking Supabase REST endpoint:', endpoint);

  try{
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json'
      }
    });

    console.log('HTTP', res.status, res.statusText);
    const txt = await res.text();
    if(res.status >=200 && res.status < 300){
      try{ const json = JSON.parse(txt); console.log('Response JSON sample length:', Array.isArray(json) ? json.length : typeof json); }
      catch(e){ console.log('Response body length:', txt.length); }
      process.exit(0);
    } else {
      console.error('Non-2xx response. Body:\n', txt);
      process.exit(3);
    }
  }catch(err){
    console.error('Request failed:', err);
    process.exit(4);
  }
}

main();
