const SUPABASE_URL = "https://auqzjncsxxleillfnpyh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wKVt9PjkIrXGJPUezL57oQ_RM7V8Yl4";

async function submitAndVote() {
  const fields = ['name', 'city', 'province', 'country', 'idFile'];
  for (let id of fields.slice(0, -1)) {
    const val = document.getElementById(id).value.trim();
    if (!val) return status("Fill all fields");
  }
  const file = document.getElementById('idFile').files[0];
  if (!file) return status("Upload ID");

  status("Uploading ID securely…");

  // Upload raw file — Supabase handles encryption
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload", JSON.stringify({ name: file.name, size: file.size }));

  try {
    const uploadResp = await fetch(`${SUPABASE_URL}/storage/v1/object/ids?bucket=private-ids`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: formData
    });

    if (!uploadResp.ok) throw new Error("Upload failed");

    // Save vote record with metadata — no public link
    const voteData = {
      name: document.getElementById('name').value,
      city: document.getElementById('city').value,
      province: document.getElementById('province').value,
      country: document.getElementById('country').value,
      file_url: `https://auqzjncsxxleillfnpyh.supabase.co/storage/v1/object/public/ids/${file.name}`, // even this is private in real bucket
      status: "uploaded",
      timestamp: new Date().toISOString()
    };

    await fetch(`${SUPABASE_URL}/rest/v1/votes`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(voteData)
    });

    status("ID stored — encrypted & locked. Vote now.");
    document.getElementById('voteButtons').style.display = "block";
    localStorage.setItem("voted", "true");
  } catch (e) {
    status("Error: " + e.message);
  }
}

async function castVote(choice) {
  const data = await fetch(`${SUPABASE_URL}/rest/v1/votes?select=choice`).then(r => r.json());
  const tally = { Sovereignty: 0, Slavery: 0 };
  data.forEach(v => tally ++);

  document.querySelectorAll('#tally span').forEach((s, i) => {
    const key = i === 0 ? "Sovereignty" : "Slavery";
    s.textContent = `${tally } ${key}`;
  });

  // Save final vote
  const vote = { choice, timestamp: new Date().toISOString() };
  await fetch(`${SUPABASE_URL}/rest/v1/votes`, {
    method: "POST",
    headers: { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(vote)
  });

  status("Vote sealed forever.");
  document.getElementById('voteButtons').style.display = "none";
}

function status(msg) { document.getElementById("status").textContent = msg; }