
async function vote(){
  const res = await fetch("/api/vote",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      identity_token: document.getElementById("identity").value,
      choice: document.getElementById("choice").value
    })
  });
  document.getElementById("out").textContent = await res.text();
}
