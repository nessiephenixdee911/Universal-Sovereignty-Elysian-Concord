const SUPABASE_URL = "https://auqzjncsxxleillfnpyh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wKVt9PjkIrXGJPUezL57oQ_RM7V8Yl4";

async function submitVote() {
  const name = document.getElementById('name').value.trim();
  const city = document.getElementById('city').value.trim();
  const province = document.getElementById('province').value.trim();
  const country = document.getElementById('country').value.trim();
  const file = document.getElementById('idFile').files[0];

  if (!name || !city || !province || !country || !file) {
    status("Please fill all fields and upload your ID photo");
    return;
  }

  status("Uploading securely to Supabase...");

  const formData = new FormData();
  formData.append("file", file);

  try {
    // Upload file to Supabase Storage (private bucket recommended)
    const uploadPath = `ids/${Date.now()}_${file.name}`;
    const uploadResp = await fetch(`${SUPABASE_URL}/storage/v1/object/private-ids/${uploadPath}`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: file
    });

    if (!uploadResp.ok) throw new Error("Upload failed");

    // Save vote record
    const voteRecord = {
      name,
      city,
      province,
      country,
      file_path: uploadPath,
      timestamp: new Date().toISOString(),
      status: "registered"
    };

    await fetch(`${SUPABASE_URL}/rest/v1/votes`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(voteRecord)
    });

    status("ID uploaded & registered securely. Now cast your vote:");
    document.getElementById('voteButtons').style.display = "block";
  } catch (e) {
    status("Error: " + e.message);
  }
}

async function castVote(choice) {
  await fetch(`${SUPABASE_URL}/rest/v1/votes`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ choice, timestamp: new Date().toISOString() })
  });

  // Update tally
  const votes = await fetch(`${SUPABASE_URL}/rest/v1/votes?select=choice`).then(r => r.json());
  let sov = 0, sla = 0;
  votes.forEach(v => v.choice === "Sovereignty" ? sov++ : sla++);

  document.querySelectorAll('#tally span')[0].textContent = `${sov} Sovereignty`;
  document.querySelectorAll('#tally span')[1].textContent = `${sla} Slavery`;

  status("Your vote is sealed forever.");
  document.getElementById('voteButtons').style.display = "none";
}

function status(msg) {
  document.getElementById("status").textContent = msg;
}