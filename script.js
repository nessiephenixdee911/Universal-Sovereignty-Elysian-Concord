// script.js - Sovereign Voting Ledger System (Client-Side Blockchain Simulation)
// Works with index.html, voting.html, doctrine.html, ledger.html

document.addEventListener('DOMContentLoaded', () => {
    // Initialize ledger in localStorage if not exists
    if (!localStorage.getItem('sovereignLedger')) {
        localStorage.setItem('sovereignLedger', JSON.stringify([]));
    }

    // Simple hash function (for demo - simulates blockchain hash)
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).toUpperCase().padStart(16, '0');
    }

    // Format current date like blockchain timestamp
    function getTimestamp() {
        const now = new Date();
        return now.toISOString(); // e.g., 2026-01-06T12:34:56.789Z
    }

    // Load and display ledger on ledger.html
    if (document.getElementById('ledger-body')) {
        updateLedgerDisplay();
    }

    // Update live tally on voting.html and ledger.html
    updateLiveTally();

    // Handle form submission on voting.html
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.querySelector('input[type="text"]').value.trim();
            const email = document.querySelector('input[type="email"]').value.trim();
            const region = document.querySelector('input[type="text"]:nth-of-type(2)').value.trim() || 'Earth';
            const voteSelect = document.querySelector('select');
            const vote = voteSelect.options[voteSelect.selectedIndex].text;
            const voteValue = voteSelect.value;
            const statement = document.querySelector('textarea').value.trim();

            if (!name || !voteValue) {
                alert('Name and Vote are required.');
                return;
            }

            // Create vote record
            const voteData = {
                name: name,
                region: region,
                vote: vote,
                voteValue: voteValue,
                statement: statement || 'No statement',
                timestamp: getTimestamp()
            };

            // Generate unique hash (blockchain-style Vote ID)
            const dataString = JSON.stringify(voteData) + Date.now();
            voteData.id = simpleHash(dataString);

            // Save to ledger
            const ledger = JSON.parse(localStorage.getItem('sovereignLedger'));
            ledger.unshift(voteData); // Newest first
            localStorage.setItem('sovereignLedger', JSON.stringify(ledger));

            // Success feedback
            alert(`SOVEREIGN VOTE RECORDED!\n\nVote ID: ${voteData.id}\nYour vote is now permanently on the public ledger.\nThe people have spoken.`);

            // Reset form
            form.reset();
            voteSelect.selectedIndex = 0;

            // Update displays
            updateLiveTally();
            if (document.getElementById('ledger-body')) {
                updateLedgerDisplay();
            }
        });
    }

    // Function to update ledger table
    function updateLedgerDisplay() {
        const tbody = document.getElementById('ledger-body');
        if (!tbody) return;

        const ledger = JSON.parse(localStorage.getItem('sovereignLedger'));
        tbody.innerHTML = '';

        ledger.forEach(entry => {
            const row = document.createElement('tr');
            if (entry.voteValue === 'yes') row.classList.add('yes');
            if (entry.voteValue === 'no') row.classList.add('no');

            row.innerHTML = `
                <td class="vote-id">${entry.id}</td>
                <td class="timestamp">${entry.timestamp.replace('T', ' ').split('.')[0]} UTC</td>
                <td><strong>${escapeHtml(entry.name)}</strong></td>
                <td>${escapeHtml(entry.region)}</td>
                <td><strong>${escapeHtml(entry.vote)}</strong></td>
                <td>${escapeHtml(entry.statement)}</td>
            `;
            tbody.appendChild(row);
        });

        if (ledger.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#666;">No votes recorded yet. Be the first to affirm the Concord.</td></tr>';
        }
    }

    // Function to update live tally (on voting and ledger pages)
    function updateLiveTally() {
        const tallyElements = document.querySelectorAll('.tally-total, table tbody');
        if (tallyElements.length === 0) return;

        const ledger = JSON.parse(localStorage.getItem('sovereignLedger'));
        const total = ledger.length;

        let yes = 0, no = 0, abstain = 0;
        ledger.forEach(v => {
            if (v.voteValue === 'yes') yes++;
            else if (v.voteValue === 'no') no++;
            else if (v.voteValue === 'abstain') abstain++;
        });

        const yesPct = total ? ((yes / total) * 100).toFixed(1) : '0.0';
        const noPct = total ? ((no / total) * 100).toFixed(1) : '0.0';
        const abstainPct = total ? ((abstain / total) * 100).toFixed(1) : '0.0';

        // Update any tally tables
        document.querySelectorAll('table tbody').forEach(tbody => {
            const rows = tbody.querySelectorAll('tr');
            if (rows.length >= 3) {
                rows[0].querySelectorAll('td')[1].textContent = yes.toLocaleString();
                rows[0].querySelectorAll('td')[2].textContent = yesPct + '%';
                rows[1].querySelectorAll('td')[1].textContent = no.toLocaleString();
                rows[1].querySelectorAll('td')[2].textContent = noPct + '%';
                rows[2].querySelectorAll('td')[1].textContent = abstain.toLocaleString();
                rows[2].querySelectorAll('td')[2].textContent = abstainPct + '%';
            }
        });

        // Update total text
        document.querySelectorAll('.tally-total').forEach(el => {
            el.innerHTML = `Total Sovereign Votes Cast: ${total.toLocaleString()}<br>Last updated: Live • Threshold Watch Active`;
        });

        // Highlight YES row if over 51%
        if (parseFloat(yesPct) >= 51.0) {
            document.querySelectorAll('.yes-row, tr.yes').forEach(row => {
                row.style.backgroundColor = '#ccffcc';
                row.style.fontWeight = 'bold';
            });
        }
    }

    // Safe HTML escape
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Auto-refresh tally every 10 seconds on voting/ledger pages
    if (window.location.pathname.includes('voting.html') || window.location.pathname.includes('ledger.html')) {
        setInterval(() => {
            updateLiveTally();
            if (document.getElementById('ledger-body')) updateLedgerDisplay();
        }, 10000);
    }
});