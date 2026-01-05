const API_URL = "https://your-fastapi-domain.com";  // Change to your deployed API

async function verifyID() {
  const name = document.getElementById('name').value.trim();
  const file = document.getElementById('idFile').files[0];
  if (!name || !file) return status("Name + ID required");

  status("Verifying with secure server…");

  const formData = new FormData();
  formData.append("name", name);
  formData.append("id_file", file);

  try {
    const resp = await fetch(`${API_URL}/verify-id`, {
      method: "POST",
      body: formData
    });

    const data = await resp.json();

    if (!resp.ok) throw new Error(data.detail || "Verification failed");

    localStorage.setItem('myhash', data.proof_hash);
    status("✅ ID verified! Vote now.");
    document.getElementById('voteButtons').style.display = 'block';
  } catch (err) {
    status(`❌ ${err.message}`);
  }
}

async function castVote(choice) {
  const proof = localStorage.getItem('myhash');
  if (!proof) return status("Verify ID first");

  await fetch(`${API_URL}/record-vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice, proof_hash: proof })
  });

  status("Vote recorded forever!");
  document.getElementById('voteButtons').style.display = 'none';
}

function status(t) { document.getElementById('status').innerText = t; }