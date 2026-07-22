document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('emailForm');
    const senderNameInput = document.getElementById('senderName');
    const toEmailInput = document.getElementById('toEmail');
    const subjectInput = document.getElementById('subject');
    const messageBodyInput = document.getElementById('messageBody');
    const emailCountInput = document.getElementById('emailCount');
    const sendDelaySelect = document.getElementById('sendDelay');
    const btnSend = document.getElementById('btnSend');
    const btnText = btnSend.querySelector('.btn-text');
    const spinner = btnSend.querySelector('.spinner');
    const btnReset = document.getElementById('btnReset');
    const templateSelect = document.getElementById('templateSelect');
    const btnPlainText = document.getElementById('btnPlainText');
    const btnHtml = document.getElementById('btnHtml');
    const btnClearLogs = document.getElementById('btnClearLogs');
    const consoleWindow = document.getElementById('consoleWindow');

    // Stats Elements
    const statTotal = document.getElementById('statTotal');
    const statSuccess = document.getElementById('statSuccess');
    const statFailed = document.getElementById('statFailed');
    const statProgress = document.getElementById('statProgress');
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');
    const serverStatusIndicator = document.getElementById('serverStatusIndicator');

    let isSending = false;
    let isHtmlMode = false;

    // Presets
    const PRESETS = {
        custom: {
            subject: 'Project Status Update',
            body: 'Hello! This is a test email sent from the Nodemailer Dispatcher Pro dashboard.'
        },
        boss: {
            subject: 'Urgent Task Review Required',
            body: 'Please check the latest updates on the main project dashboard and let me know once completed.\n\nBest,\nManagement'
        },
        security: {
            subject: 'Security Alert: New Sign-in Detected',
            body: 'A new login attempt was recorded for your account. If this was not you, please secure your account immediately.'
        },
        meeting: {
            subject: 'Meeting Confirmation: Project Sync',
            body: 'Hi team,\n\nOur weekly project sync meeting is scheduled for today at 4:00 PM. Please bring your status reports.'
        },
        welcome: {
            subject: 'Welcome to the Platform!',
            body: 'Thank you for joining our platform. We are thrilled to have you on board! Let us know if you need any assistance getting started.'
        }
    };

    // Preset Selector Change
    templateSelect.addEventListener('change', (e) => {
        const selected = PRESETS[e.target.value];
        if (selected) {
            subjectInput.value = selected.subject;
            messageBodyInput.value = selected.body;
            logToConsole('info', `Loaded preset: "${e.target.options[e.target.selectedIndex].text}"`);
        }
    });

    // Format Toggles
    btnPlainText.addEventListener('click', () => {
        isHtmlMode = false;
        btnPlainText.classList.add('active');
        btnHtml.classList.remove('active');
    });

    btnHtml.addEventListener('click', () => {
        isHtmlMode = true;
        btnHtml.classList.add('active');
        btnPlainText.classList.remove('active');
    });

    // Clear Logs
    btnClearLogs.addEventListener('click', () => {
        consoleWindow.innerHTML = '';
        resetStats();
        logToConsole('system', 'Console logs cleared. Ready for new dispatch.');
    });

    // Reset Form
    btnReset.addEventListener('click', () => {
        form.reset();
        templateSelect.value = 'custom';
        senderNameInput.value = 'Your boss';
        toEmailInput.value = 'itsmrahmadasghar@gmail.com';
        subjectInput.value = 'Project Status Update';
        messageBodyInput.value = 'Hello! This is a test email sent from the Nodemailer Dispatcher Pro dashboard.';
        emailCountInput.value = 1;
        sendDelaySelect.value = 3;
        resetStats();
        logToConsole('info', 'Form values restored to default.');
    });

    // Logger Utility
    function logToConsole(type, message) {
        const time = new Date().toLocaleTimeString();
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.innerHTML = `<span class="timestamp">[${time}]</span> <span class="log-msg">${message}</span>`;
        consoleWindow.appendChild(div);
        consoleWindow.scrollTop = consoleWindow.scrollHeight;
    }

    function resetStats() {
        statTotal.textContent = '0';
        statSuccess.textContent = '0';
        statFailed.textContent = '0';
        statProgress.textContent = '0%';
        progressBar.style.width = '0%';
    }

    // Health Check on load
    async function checkServerHealth() {
        try {
            // Attempt simple probe
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            // 400 is expected because body is empty, means server route is active
            if (res.status === 400 || res.status === 200) {
                statusText.textContent = 'Backend Connected (Port 3000)';
                serverStatusIndicator.classList.add('active');
            }
        } catch (err) {
            statusText.textContent = 'Backend Offline / Disconnected';
            serverStatusIndicator.classList.remove('active');
            logToConsole('error', 'Unable to reach backend server at <code>/api/send-email</code>');
        }
    }

    // Form Submit (Batch Send)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSending) return;

        const senderName = senderNameInput.value.trim();
        const to = toEmailInput.value.trim();
        const subject = subjectInput.value.trim();
        const messageBody = messageBodyInput.value.trim();
        const total = parseInt(emailCountInput.value) || 1;
        const delaySeconds = parseInt(sendDelaySelect.value) || 1;

        if (!to || !subject || !messageBody) {
            logToConsole('error', 'Validation Error: Please fill in all required fields (To, Subject, Message).');
            return;
        }

        isSending = true;
        btnSend.disabled = true;
        btnText.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Dispatching (0/${total})...`;
        spinner.classList.remove('hidden');

        resetStats();
        statTotal.textContent = total;

        logToConsole('info', `Starting dispatch session: <strong>${total} email(s)</strong> to <code>${to}</code> with ${delaySeconds}s delay.`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 1; i <= total; i++) {
            btnText.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Sending ${i}/${total}...`;
            logToConsole('info', `Dispatching email <strong>${i}/${total}</strong>... Sender: "${senderName || 'Your App'}"`);

            const payload = {
                to,
                senderName,
                subject: total > 1 ? `${subject} (#${i})` : subject,
            };

            if (isHtmlMode) {
                payload.html = messageBody;
            } else {
                payload.text = messageBody;
            }

            try {
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    successCount++;
                    statSuccess.textContent = successCount;
                    logToConsole('success', `✔ Email ${i}/${total} delivered! Message ID: <code>${data.messageId}</code>`);
                } else {
                    failCount++;
                    statFailed.textContent = failCount;
                    logToConsole('error', `✖ Email ${i}/${total} failed: ${data.error || 'Unknown error'}`);
                }
            } catch (err) {
                failCount++;
                statFailed.textContent = failCount;
                logToConsole('error', `✖ Email ${i}/${total} network failure: ${err.message}`);
            }

            // Update Progress Percentage & Bar
            const percent = Math.round((i / total) * 100);
            statProgress.textContent = `${percent}%`;
            progressBar.style.width = `${percent}%`;

            // Delay if more emails remain
            if (i < total) {
                logToConsole('system', `Waiting ${delaySeconds} seconds before next send...`);
                await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
            }
        }

        // Completion
        logToConsole('system', `🎉 Batch dispatch complete! <strong>${successCount}</strong> succeeded, <strong>${failCount}</strong> failed.`);
        
        isSending = false;
        btnSend.disabled = false;
        btnText.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Dispatch Email(s)`;
        spinner.classList.add('hidden');
    });

    checkServerHealth();
});
