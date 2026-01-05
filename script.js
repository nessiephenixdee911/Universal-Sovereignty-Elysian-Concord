const SUPABASE_URL = "https://auqzjncsxxleillfnpyh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wKVt9PjkIrXGJPUezL57oQ_RM7V8Yl4";

const GROK_KEY = "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";

async function verifyID() {
  const name = document.getElementById('name').value.trim();
  const file = document.getElementById('idFile').files[0];
  if (!name || !file) return status("Name + ID required");

  status("Grok checking ID…");
  const base64 = await fileToBase64(file);

  const resp = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${GROK_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [{ role: "user", content: [
        { type: "text", text: `Is this a REAL government ID? Exact name "${name}"? Not fake? YES or NO.` },
        { type: "image_url", image_url: { url: base64 } }
      ]}]
    })
  });

  const data = await resp.json();
  const answer = data.choices[0].message.content.trim().toUpperCase();

  if (answer !== "YES") return status("❌ Grok rejected – not real ID or name wrong");

  const hash = await sha256(await file.arrayBuffer());
  if (localStorage.getItem('voted_' + hash)) return status("Already voted");

  localStorage.setItem('voted_' + hash, 'true');
  localStorage.setItem('myhash', hash);
  status("✅ Real government ID verified! Vote now.");
  document.getElementById('voteButtons').style.display = 'block';
}

async function castVote(choice) {
  const hash = localStorage.getItem('myhash');
  const vote = { choice, timestamp: new Date().toISOString(), proof: hash.slice(0,12) };

  await fetch(`${SUPABASE_URL}/rest/v1/votes`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(vote)
  });

  let local = JSON.parse(localStorage.getItem('localvotes') || '[]');
  local.push(vote);
  localStorage.setItem('localvotes', JSON.stringify(local));

  status("Vote saved forever!");
  document.getElementById('voteButtons').style.display = 'none';
}

function status(t) { document.getElementById('status').innerText = t; }

async function fileToBase64(f) {
  return new Promise(r => {
    let reader = new FileReader();
    reader.onload = () => r(reader.result);
    reader.readAsDataURL(f);
  });
}

async function sha256(b) {
  let h = await crypto.subtle.digest("SHA-256", b);
  return Array.from(new Uint8Array(h)).map(c => c.toString(16).padStart(2,"0")).join("");
}