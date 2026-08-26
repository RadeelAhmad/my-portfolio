/* ---------- matrix rain background ---------- */
(function matrixRain() {
  const canvas = document.getElementById("matrix");
  const ctx = canvas.getContext("2d");
  let width, height, columns, drops;
  const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@!%&*<>/\\";

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Math.floor(width / 16);
    drops = new Array(columns).fill(1);
  }
  window.addEventListener("resize", resize);
  resize();

  function draw() {
    ctx.fillStyle = "rgba(3, 6, 4, 0.08)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#00ff66";
    ctx.font = "14px monospace";
    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * 16, drops[i] * 16);
      if (drops[i] * 16 > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  setInterval(draw, 50);
})();

/* ---------- status bar clock ---------- */
(function statusClock() {
  const clockEl = document.getElementById("clock");
  const batteryEl = document.getElementById("battery");
  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString("en-GB", { hour12: false });
  }
  tick();
  setInterval(tick, 1000);
  let pct = 98;
  setInterval(() => {
    pct = pct <= 20 ? 98 : pct - 1;
    batteryEl.textContent = pct + "%";
  }, 8000);
})();

/* ---------- terminal intro sequence ---------- */
(function terminalIntro() {
  const cmdEl = document.getElementById("typedCmd");
  const cmdCursor = document.getElementById("cmdCursor");
  const outputEl = document.getElementById("whoamiOutput");
  const finalPrompt = document.getElementById("finalPrompt");
  const introReveal = document.getElementById("introReveal");

  const command = "whoami --verbose";
  const output = [
    "user   : Radeel Ahmad",
    "role   : Cybersecurity Analyst / Penetration Tester",
    "focus  : Red Teaming, CTF, Threat Hunting",
    "email  : mr.radeelahmad@icloud.com",
  ].join("\n");

  const COMMAND_TYPE_DURATION_MS = 2000;
  const PROMPT_DELAY_MS = 500;
  const REVEAL_DELAY_MS = 500;
  const charDelay = COMMAND_TYPE_DURATION_MS / command.length;
  let i = 0;

  function typeCommand() {
    if (i <= command.length) {
      cmdEl.textContent = command.slice(0, i);
      i++;
      setTimeout(typeCommand, charDelay);
    } else {
      cmdCursor.style.display = "none";
      outputEl.textContent = output;
      setTimeout(() => {
        finalPrompt.style.display = "";
        setTimeout(() => {
          introReveal.classList.add("is-visible");
        }, REVEAL_DELAY_MS);
      }, PROMPT_DELAY_MS);
    }
  }
  typeCommand();
})();

/* ---------- window open / close / drag / focus ---------- */
(function windowManager() {
  const pills = document.querySelectorAll(".nav-pills button");
  const windowsArea = document.getElementById("windowsArea");

  function openWindow(id) {
    const win = document.getElementById("win-" + id);
    if (!win) return;
    document.querySelectorAll(".app-window").forEach(w => {
      if (w !== win) w.classList.remove("is-open");
    });
    win.classList.add("is-open");
    bringToFront(win);
    win.scrollIntoView({ behavior: "smooth", block: "center" });
    pills.forEach(p => p.classList.toggle("is-active", p.dataset.target === id));
  }

  function closeWindow(id) {
    const win = document.getElementById(id.startsWith("win-") ? id : "win-" + id);
    if (win) win.classList.remove("is-open");
  }

  function bringToFront(win) {
    document.querySelectorAll(".app-window").forEach(w => (w.style.zIndex = 1));
    win.style.zIndex = 5;
  }

  pills.forEach(btn => {
    btn.addEventListener("click", () => openWindow(btn.dataset.target));
  });

  document.querySelectorAll("[data-close]").forEach(dot => {
    dot.addEventListener("click", e => {
      e.stopPropagation();
      closeWindow(dot.dataset.close);
    });
  });

  document.querySelectorAll(".app-window").forEach(win => {
    win.addEventListener("mousedown", () => bringToFront(win));
  });

  /* simple drag via titlebar, desktop widths only */
  document.querySelectorAll("[data-drag-handle]").forEach(handle => {
    let dragging = false, offsetX = 0, offsetY = 0;
    const win = handle.closest(".window");

    handle.addEventListener("mousedown", e => {
      if (window.innerWidth < 900) return;
      if (e.target.classList.contains("dot")) return;
      dragging = true;
      bringToFront(win);
      const rect = win.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      win.style.position = "fixed";
      win.style.left = rect.left + "px";
      win.style.top = rect.top + "px";
      win.style.margin = "0";
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", e => {
      if (!dragging) return;
      win.style.left = e.clientX - offsetX + "px";
      win.style.top = e.clientY - offsetY + "px";
    });

    document.addEventListener("mouseup", () => {
      dragging = false;
      document.body.style.userSelect = "";
    });
  });

  window.openWindow = openWindow;
  window.closeWindow = closeWindow;
})();

/* ---------- projects data + render ---------- */
const PROJECTS = [
  {
    id: "DeepTrace",
    category: "Network Forensics / IPDR",
    status: "active",
    desc: "An advanced IPDR and network traffic analysis system that visualizes network activity and flags potentially malicious traffic.",
    tags: ["Network Security", "Forensics"],
    link: "",
  },
  {
    id: "digital-wallet.cpp",
    category: "Finance / C++",
    status: "stable",
    desc: "A C++ digital wallet with streamlined fund transfer and transaction-tracking functionality.",
    tags: ["C++"],
    link: "https://github.com/RadeelAhmad/Digital-Wallet/tree/main",
  },
  {
    id: "netmonitor.cs",
    category: "Networking / GUI",
    status: "stable",
    desc: "GUI-based network monitoring system in C# with a user-friendly interface for exploring network functions.",
    tags: ["C#", "GUI"],
    link: "https://github.com/iabdullah215/OOP2",
  },
  {
    id: "blockchain.java",
    category: "Blockchain / Java",
    status: "stable",
    desc: "Java-based blockchain with user authentication, transaction tracking, and dynamic coin-rate fluctuation. Built with a 3-person team.",
    tags: ["Java"],
    link: "https://github.com/RadeelAhmad/Block-Chain-Project",
  },
  {
    id: "bash-chat.sh",
    category: "Networking / Bash",
    status: "active",
    desc: "Terminal chat app for a local network — Bash scripting over Netcat for lightweight peer-to-peer messaging.",
    tags: ["Bash", "Netcat"],
    link: "https://github.com/RadeelAhmad/Bash-Chat/tree/main",
  },
  {
    id: "heaphound.py",
    category: "Forensics / Python",
    status: "active",
    desc: "Analyzes Java heap dumps (.hprof) to extract credentials, tokens, and other artifacts, producing JSON/HTML/text forensic reports.",
    tags: ["Python", "Forensics"],
    link: "https://github.com/iabdullah215/HeapHound",
  },
];

(function renderProjects() {
  const grid = document.getElementById("projectGrid");
  PROJECTS.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <div class="project-card-top">
        <span class="project-name">${p.id}</span>
        <span class="status-badge">${p.status}</span>
      </div>
      <div class="project-category">${p.category}</div>
      <div class="project-desc">${p.desc}</div>
      <div class="project-tags">${p.tags.map(t => `<span>${t}</span>`).join("")}</div>
    `;
    card.addEventListener("click", () => openProjectModal(idx));
    grid.appendChild(card);
  });
})();

/* ---------- shared modal reset ---------- */
function resetModal() {
  document.getElementById("modalDesc").style.display = "none";
  document.getElementById("modalDesc").textContent = "";
  document.getElementById("modalBullets").innerHTML = "";
  document.getElementById("modalTags").innerHTML = "";
  document.getElementById("modalTags").style.display = "none";
  document.getElementById("modalLink").style.display = "none";
  document.getElementById("modalBlogBody").innerHTML = "";
  const modalImage = document.getElementById("modalImage");
  modalImage.classList.remove("is-shown");
  modalImage.src = "";
  document.getElementById("win-modal").classList.remove("wide");
  document.querySelector("#win-modal .window-body").classList.remove("scrollable");
}

function openProjectModal(idx) {
  const p = PROJECTS[idx];
  resetModal();
  document.getElementById("modalTitle").textContent = p.id;
  document.getElementById("modalCategory").textContent = p.category;
  const modalDesc = document.getElementById("modalDesc");
  modalDesc.textContent = p.desc;
  modalDesc.style.display = "";
  const modalTags = document.getElementById("modalTags");
  modalTags.innerHTML = p.tags.map(t => `<span>${t}</span>`).join("");
  modalTags.style.display = "";
  const modalLink = document.getElementById("modalLink");
  modalLink.href = p.link || "#";
  modalLink.style.display = p.link ? "inline-block" : "none";
  document.getElementById("modalBackdrop").classList.add("is-open");
  showToast("FS", `Opened ${p.id} in read-only mode.`);
}

/* ---------- experience data + render ---------- */
const EXPERIENCE = [
  {
    title: "Penetration Testing Specialist",
    company: "Digilnn360",
    date: "2025/10 – Present",
    location: "Islamabad, Pakistan",
    bullets: [
      "Performed comprehensive black-box and white-box penetration testing on web applications and internal network infrastructures, leveraging industry-standard methodologies such as OWASP Top 10 and PTES.",
      "Identified, validated, and exploited vulnerabilities including authentication flaws, access control issues, and injection attacks (e.g., SQLi, XSS), followed by risk rating, impact analysis, and proof-of-concept development.",
      "Produced detailed technical and executive-level reports outlining attack vectors, exploitation steps, and prioritized remediation strategies, enhancing the overall security posture of web and network environments.",
    ],
  },
  {
    title: "HackTheBox Hall Of Famer",
    company: "HackTheBox",
    date: "Ongoing",
    location: "Online, Remote",
    bullets: [
      "Our team, MNM, is proudly ranked among the Top 100 teams worldwide on Hack The Box (HTB).",
      "We are honored to be the only team from Pakistan to be featured on the HTB Wall of Fame.",
    ],
  },
  {
    title: "Departmental Hall of Famer",
    company: "Air University, Cybersecurity Department",
    date: "2025/01 – 2026/01",
    location: "Islamabad, Pakistan",
    bullets: [
      "In recognition of our team's consistent performances in numerous national and international competitions, along with departmental contributions throughout our degree, we were honoured with a place in the Departmental Hall of Fame.",
    ],
  },
  {
    title: "Pentester Intern",
    company: "NCERT - National Cyber Emergency Response Team",
    date: "2025/07 – 2025/09",
    location: "Islamabad, Pakistan",
    bullets: [
      "Conducted penetration tests on 15+ web applications, networks, and systems, uncovering critical vulnerabilities and strengthening overall security posture.",
      "Collaborated with cross-functional teams to identify risks, leading to a 30% reduction in recurring security issues through effective mitigation strategies.",
      "Developed custom scripts and automation tools, improving testing efficiency by 40% and ensuring more accurate vulnerability detection.",
      "Documented findings and delivered comprehensive security reports, enabling stakeholders to prioritise remediation and reduce exploitation risk.",
    ],
  },
  {
    title: "CTF Team Lead",
    company: "Air University",
    date: "2025/02 – 2026/02",
    location: "Islamabad, Pakistan",
    bullets: [
      "Organised and conducted CTF competitions across multiple universities.",
      "Mentored and coordinated a team of developers, improving challenge quality and on-time delivery across multiple categories.",
      "Collaborated with Red and Blue teams to build their platform and assist in challenge development.",
      "Conducted workshops for beginner and intermediate-level CTF players.",
    ],
  },
  {
    title: "Cyber Security Intern",
    company: "Erasmus Project - Air University",
    date: "2024/07 – 2024/09",
    location: "Islamabad, Pakistan",
    bullets: [
      "Conducted vulnerability assessments across multiple systems, identifying and mitigating high-risk security flaws that improved overall defence posture.",
      "Monitored and analyzed real-time network traffic and security logs, identifying malicious patterns and accelerating incident response workflows.",
      "Assisted in the development of a CyberRange platform, providing a hands-on environment for cybersecurity training and skill-building.",
    ],
  },
];

(function renderExperience() {
  const grid = document.getElementById("experienceGrid");
  EXPERIENCE.forEach((x, idx) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <div class="project-card-top">
        <span class="project-name">${x.title}</span>
        <span class="status-badge">${x.date}</span>
      </div>
      <div class="project-category">${x.company} &middot; ${x.location}</div>
      <div class="project-desc">${x.bullets[0]}</div>
    `;
    card.addEventListener("click", () => openExperienceModal(idx));
    grid.appendChild(card);
  });
})();

function openExperienceModal(idx) {
  const x = EXPERIENCE[idx];
  resetModal();
  document.getElementById("modalTitle").textContent = x.title;
  document.getElementById("modalCategory").textContent = `${x.company} · ${x.date} · ${x.location}`;
  document.getElementById("modalBullets").innerHTML = x.bullets
    .map(b => `<li>${b}</li>`)
    .join("");
  document.getElementById("modalBackdrop").classList.add("is-open");
  showToast("LOG", `Opened ${x.title}.log in read-only mode.`);
}

document.querySelectorAll("[data-close-modal]").forEach(el => {
  el.addEventListener("click", () => {
    document.getElementById("modalBackdrop").classList.remove("is-open");
  });
});
document.getElementById("modalCloseBtn").addEventListener("click", () => {
  document.getElementById("modalBackdrop").classList.remove("is-open");
});
document.getElementById("modalBackdrop").addEventListener("click", e => {
  if (e.target.id === "modalBackdrop") {
    document.getElementById("modalBackdrop").classList.remove("is-open");
  }
});

/* ---------- certificate gallery ---------- */
const CERTS = [
  { file: "cpts.png", name: "Certified Penetration Testing Specialist (CPTS)", issuer: "Hack The Box", date: "01 Jun 2025" },
  { file: "Solar.png", name: "Solar — Mini Pro Lab", issuer: "Hack The Box", date: "01 Aug 2025" },
  { file: "FullHouse.png", name: "Full House — Mini Pro Lab", issuer: "Hack The Box", date: "07 Aug 2025" },
  { file: "ISOIEC-270012022-LeadAuditor.png", name: "ISO/IEC 27001:2022 Lead Auditor", issuer: "MASTERMIND", date: "24 May 2025" },
  { file: "RadeelAhmed-CertifiedNetworkSecurityPractitioner(CNSP)-1.png", name: "Certified Network Security Practitioner (CNSP)", issuer: "The SecOps Group", date: "11 Jun 2024" },
  { file: "SkillFrontSFE016a74a7284d-4312524795629-1.png", name: "ISO/IEC 27001:2022 Info Security Associate", issuer: "Skill Front", date: "21 Feb 2024" },
  { file: "88eca662-0dff-4270-9c8d-0ab895696554.png", name: "Network Defense Essentials", issuer: "EC-Council", date: "24 Jun 2024" },
  { file: "CertificateOfCompletion_CareerEssentialsinSystemAdministrationbyMicrosoftandLinkedIn-1.png", name: "Career Essentials in System Administration", issuer: "Microsoft & LinkedIn", date: "29 Aug 2024" },
  { file: "CertificateOfCompletion_CareerEssentialsinGitHubProfessionalCertificate-1.png", name: "Career Essentials in GitHub", issuer: "LinkedIn & GitHub", date: "29 Aug 2024" },
];

(function renderCertificates() {
  const grid = document.getElementById("certificateGrid");
  CERTS.forEach((c, idx) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <div class="project-card-top">
        <span class="project-name">${c.name}</span>
        <span class="status-badge">${c.date}</span>
      </div>
      <div class="project-category">${c.issuer}</div>
    `;
    card.addEventListener("click", () => openCertificateModal(idx));
    grid.appendChild(card);
  });
})();

function openCertificateModal(idx) {
  const c = CERTS[idx];
  resetModal();
  document.getElementById("win-modal").classList.add("wide");
  document.getElementById("modalTitle").textContent = c.name;
  document.getElementById("modalCategory").textContent = `${c.issuer} · ${c.date}`;
  const modalImage = document.getElementById("modalImage");
  modalImage.src = `assets/certificates/${encodeURIComponent(c.file)}`;
  modalImage.alt = c.name;
  modalImage.classList.add("is-shown");
  document.getElementById("modalBackdrop").classList.add("is-open");
  showToast("FS", `Opened ${c.file} in read-only mode.`);
}

/* ---------- generic "open a window" links, e.g. the certs link in About ---------- */
document.querySelectorAll("[data-open]").forEach(el => {
  el.addEventListener("click", () => openWindow(el.dataset.open));
});

/* ---------- email button: mailto + clipboard fallback ---------- */
document.querySelectorAll('a.social-btn[href^="mailto:"]').forEach(link => {
  link.addEventListener("click", () => {
    const email = link.href.replace(/^mailto:/, "").split("?")[0];
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email).catch(() => {});
    }
    showToast("MAIL", `No mail app? Address copied: ${email}`);
  });
});

/* ---------- blog data + render ---------- */
const BLOG_POSTS = [
  {
    title: "AWS — HTB — Fortresses",
    date: "2026-05-20",
    tags: ["hacking", "HTB", "Fortress", "AWS", "Active Directory"],
    description: "A 10-flag AWS Fortress chain: IDOR token brute-forcing, SSRF to an internal logs endpoint, MySQL time-based SQL injection, an itsdangerous account-confirmation bypass, ECDSA nonce-reuse JWT forgery, SSTI-to-RCE in a Flask ticket viewer, SUID binary reversing with GDB, DirtyPipe (CVE-2022-0847) for container root, AWS Lambda/SQS/DynamoDB/S3 abuse via LocalStack, and ASREPRoasting into Active Directory Domain Admin.",
    file: "blog/posts/AWS-Fortress-HTB.md",
    locked: true,
    password: "v3c70r221544",
  },
  {
    title: "Conversor — HTB",
    date: "2025-10-26",
    tags: ["hacking", "HTB", "XSLT", "RCE", "needrestart"],
    description: "Abusing an XSLT file-conversion feature's EXSLT document() extension to write a Python reverse shell to disk, cracking a leaked MD5 password hash for SSH access, and exploiting a NOPASSWD sudo rule on needrestart for root.",
    file: "blog/posts/Conversor-HTB.md",
  },
  {
    title: "Signed — HTB",
    date: "2025-10-12",
    tags: ["hacking", "HTB", "MSSQL", "NTLM", "Kerberos"],
    description: "MSSQL access, xp_dirtree SMB coercion to capture and crack an NTLMv2 hash, forging a Kerberos silver ticket with impacket's ticketer.py to enable xp_cmdshell, then forging elevated group SIDs and abusing OPENROWSET to read root's flag.",
    file: "blog/posts/Signed-HTB.md",
  },
  {
    title: "Imagery — HTB",
    date: "2025-09-30",
    tags: ["hacking", "HTB", "XSS", "LFI", "AES"],
    description: "Stealing an admin cookie via stored XSS, LFI to leak db.json password hashes, command injection through an image transformation parameter, cracking an AES-encrypted backup, and abusing the Charcol backup CLI's cron scheduler for root.",
    file: "blog/posts/Imagery-HTB.md",
  },
  {
    title: "Expressway — HTB",
    date: "2025-09-22",
    tags: ["hacking", "HTB", "IPsec", "IKE", "CVE-2025-32462", "sudo"],
    description: "Enumerating an IPsec/IKE VPN over UDP 500, cracking the PSK, XAUTH SSH access, and a sudo -h hostname bypass (CVE-2025-32462) for root.",
    file: "blog/posts/Expressway-HTB.md",
  },
  {
    title: "HackNet — HTB",
    date: "2025-09-15",
    tags: ["hacking", "HTB", "SSTI", "Django", "pickle", "GPG"],
    description: "SSTI in a username field leaking every user's credentials, a Django cache pickle-deserialization RCE as sandy, cracking a GPG-protected SQL backup, and recovering the root password.",
    file: "blog/posts/HackNet-HTB.md",
  },
  {
    title: "Soulmate — HTB",
    date: "2025-09-11",
    tags: ["hacking", "HTB", "CrushFTP", "CVE-2025-31161", "Erlang"],
    description: "CrushFTP CVE-2025-31161 auth bypass to admin, a PHP backdoor upload, pivoting into an Erlang SSH service, and OS command execution via the Erlang shell for root.",
    file: "blog/posts/Soulmate-HTB.md",
  },
  {
    title: "Guardian — HTB",
    date: "2025-09-02",
    tags: ["hacking", "HTB", "IDOR", "XSS", "LFI", "RCE"],
    description: "Subdomain fuzzing, credential brute-forcing, an IDOR chat leak, stored XSS in PhpSpreadsheet, a CSRF admin-creation exploit, LFI-to-RCE via PHP filter chains, and sudo privilege escalation to root.",
    file: "blog/posts/Guardian-HTB.md",
  },
  {
    title: "Previous — HTB",
    date: "2025-08-24",
    tags: ["hacking", "HTB", "Next.js", "CVE-2025-29927"],
    description: "Next.js middleware auth bypass, directory traversal via /api/download, and a malicious Terraform provider for root — Hack The Box 'Previous' walkthrough.",
    file: "blog/posts/Previous-HTB.md",
  },
  {
    title: "CodeTwo — HTB",
    date: "2025-08-17",
    tags: ["hacking", "HTB", "Flask", "js2py", "npbackup"],
    description: "Downloading a Flask app's source via an exposed app.zip endpoint to reveal MD5-hashed credentials, a js2py remote code execution flaw, and a hardcoded secret key, then abusing an unprotected npbackup-cli backup repository to exfiltrate root's SSH private key.",
    file: "blog/posts/CodeTwo-HTB.md",
  },
  {
    title: "Editor — HTB",
    date: "2025-08-03",
    tags: ["hacking", "HTB", "XWiki", "CVE-2025-24893", "netdata"],
    description: "Exploiting XWiki CVE-2025-24893 for remote code execution, leaking DB credentials from hibernate.cfg.xml for SSH access, and abusing an untrusted-search-path flaw in netdata's ndsudo SUID binary for root.",
    file: "blog/posts/Editor-HTB.md",
  },
  {
    title: "Era — HTB",
    date: "2025-07-30",
    tags: ["hacking", "HTB", "IDOR", "PHP"],
    description: "Brute-forcing sequential file-download IDs, cracking leaked bcrypt hashes from a SQLite DB, an IDOR in reset.php to hijack the admin's security question, an SSH2 stream-wrapper RCE in download.php, and a signature-bypass backdoor in a monitoring binary for root.",
    file: "blog/posts/Era-HTB.md",
  },
  {
    title: "DarkCorp — HTB",
    date: "2025-07-28",
    tags: ["hacking", "HTB", "Roundcube", "CVE-2024-42008", "Active Directory"],
    description: "Roundcube CVE-2024-42008 XSS to exfiltrate emails, PostgreSQL SQLi to RCE, pivoting through Active Directory via NTLM relay, PetitPotam, AD CS pass-the-cert, and a GPO abuse chain to Domain Admin.",
    file: "blog/posts/DarkCorp-HTB.md",
  },
  {
    title: "Deepseek Vulnerability",
    date: "2025-01-29",
    tags: ["Deepseek", "Vulnerability"],
    description: "Exploiting the \"Forgot Password\" vulnerability to gain unauthorized access to accounts without any user interaction.",
    file: "blog/posts/Deepseek-Vulnerability.md",
  },
  {
    title: "Kypo OpenStack",
    date: "2024-08-20",
    tags: ["cyber-range", "kypo", "openstack"],
    description: "A detailed method for deploying OpenStack on CentOS 8.",
    file: "blog/posts/Kypo-OpenStack.md",
  },
  {
    title: "Wifi Hacking",
    date: "2024-05-16",
    tags: ["hacking", "wireless-hacking", "wifi-hacking"],
    description: "Step-by-step method to hack WIFI using a network adapter.",
    file: "blog/posts/WIFI-Hacking-101.md",
  },
  {
    title: "Hacking Window 11",
    date: "2022-07-05",
    tags: ["hacking", "window hacking", "window 11"],
    description: "Hacking Window 11 Using PowerShell Script.",
    file: "blog/posts/Window-Hacking.md",
  },
  {
    title: "Cookies Hijacking",
    date: "2024-08-08",
    tags: ["hacking", "session-hacking", "cookies-hijacking"],
    description: "Step-by-step method to steal cookies.",
    file: "blog/posts/cookie-hijacking.md",
  },
];

(function renderBlog() {
  const grid = document.getElementById("blogGrid");
  BLOG_POSTS.forEach((post, idx) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <div class="project-card-top">
        <span class="project-name">${post.title}</span>
        <span class="status-badge">${post.locked ? "🔒 " : ""}${post.date}</span>
      </div>
      <div class="project-desc">${post.description}</div>
      <div class="project-tags">${post.tags.map(t => `<span>${t}</span>`).join("")}</div>
    `;
    card.addEventListener("click", () => openBlogModal(idx));
    grid.appendChild(card);
  });
})();

function stripFrontmatter(raw) {
  return raw.replace(/^---[\s\S]*?---\s*/, "");
}

function openBlogModal(idx) {
  const post = BLOG_POSTS[idx];
  resetModal();
  document.getElementById("win-modal").classList.add("wide");
  document.querySelector("#win-modal .window-body").classList.add("scrollable");
  document.getElementById("modalTitle").textContent = post.title;
  document.getElementById("modalCategory").textContent = (post.locked ? "🔒 " : "") + post.date;
  document.getElementById("modalBackdrop").classList.add("is-open");

  if (post.locked) {
    showBlogPasswordGate(post);
  } else {
    showModalTags(post);
    showToast("FS", `Opened ${post.title} in read-only mode.`);
    loadBlogPost(post);
  }
}

function showModalTags(post) {
  const modalTags = document.getElementById("modalTags");
  modalTags.innerHTML = post.tags.map(t => `<span>${t}</span>`).join("");
  modalTags.style.display = "";
}

function loadBlogPost(post) {
  const modalBlogBody = document.getElementById("modalBlogBody");
  modalBlogBody.innerHTML = `<p class="blog-loading">$ cat ${post.file} ...</p>`;

  fetch(post.file)
    .then(res => {
      if (!res.ok) throw new Error("fetch failed: " + res.status);
      return res.text();
    })
    .then(raw => {
      const body = stripFrontmatter(raw);
      modalBlogBody.innerHTML = window.marked ? marked.parse(body) : body;
    })
    .catch(() => {
      modalBlogBody.innerHTML = `<p class="blog-loading">Could not load this post. Try running the site from a local server instead of file://.</p>`;
    });
}

const BLOG_PASSWORD_MAX_ATTEMPTS = 10;
const BLOG_PASSWORD_LOCKOUT_MS = 30000;

function getPasswordGateState(post) {
  try {
    return JSON.parse(localStorage.getItem("bpGate:" + post.file)) || { attempts: 0, lockUntil: 0 };
  } catch (e) {
    return { attempts: 0, lockUntil: 0 };
  }
}

function setPasswordGateState(post, state) {
  try {
    localStorage.setItem("bpGate:" + post.file, JSON.stringify(state));
  } catch (e) {}
}

function showBlogPasswordGate(post) {
  const modalBlogBody = document.getElementById("modalBlogBody");
  modalBlogBody.innerHTML = `
    <div class="password-gate">
      <p class="output-text">$ sudo cat ${post.file}</p>
      <p class="output-text">[sudo] password required to read this post:</p>
      <form id="blogPasswordForm" class="password-form" autocomplete="off">
        <input type="text" name="fake-username" autocomplete="username" class="password-decoy" tabindex="-1" aria-hidden="true" />
        <input type="password" id="blogPasswordInput" name="unlock-code" class="password-input" placeholder="password" autocomplete="new-password" data-lpignore="true" data-1p-ignore data-bwignore data-form-type="other" />
        <button type="submit" class="close-fn-btn password-submit">unlock_post()</button>
      </form>
      <p class="output-text lock-msg" id="blogPasswordLockMsg" style="display:none"></p>
    </div>
  `;
  const form = document.getElementById("blogPasswordForm");
  const input = document.getElementById("blogPasswordInput");
  const submitBtn = form.querySelector(".password-submit");
  const lockMsg = document.getElementById("blogPasswordLockMsg");
  let countdownTimer = null;

  function applyLock() {
    input.disabled = true;
    submitBtn.disabled = true;
    lockMsg.style.display = "";
    clearInterval(countdownTimer);
    const tick = () => {
      const remaining = getPasswordGateState(post).lockUntil - Date.now();
      if (remaining <= 0) {
        clearInterval(countdownTimer);
        input.disabled = false;
        submitBtn.disabled = false;
        lockMsg.style.display = "none";
        input.value = "";
        input.focus();
      } else {
        lockMsg.textContent = `Too many attempts. Try again in ${Math.ceil(remaining / 1000)}s.`;
      }
    };
    tick();
    countdownTimer = setInterval(tick, 250);
  }

  if (getPasswordGateState(post).lockUntil > Date.now()) {
    applyLock();
  } else {
    input.focus();
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const state = getPasswordGateState(post);
    if (state.lockUntil > Date.now()) {
      applyLock();
      return;
    }
    if (input.value === post.password) {
      setPasswordGateState(post, { attempts: 0, lockUntil: 0 });
      document.getElementById("modalCategory").textContent = post.date;
      showModalTags(post);
      showToast("FS", `Access granted. Opened ${post.title} in read-only mode.`);
      loadBlogPost(post);
    } else {
      const attempts = state.attempts + 1;
      if (attempts >= BLOG_PASSWORD_MAX_ATTEMPTS) {
        setPasswordGateState(post, { attempts: 0, lockUntil: Date.now() + BLOG_PASSWORD_LOCKOUT_MS });
        showToast("AUTH", "Too many failed attempts. Locked for 30s.", true);
        applyLock();
      } else {
        setPasswordGateState(post, { attempts, lockUntil: 0 });
        showToast("AUTH", `Incorrect password. (${attempts}/${BLOG_PASSWORD_MAX_ATTEMPTS})`, true);
      }
      input.value = "";
      input.classList.add("shake");
      setTimeout(() => input.classList.remove("shake"), 400);
      input.focus();
    }
  });
}

/* ---------- toast system ---------- */
function showToast(tag, message, danger = false) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast" + (danger ? " danger" : "");
  toast.innerHTML = `<span class="toast-tag">${tag}</span>${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/* ambient system toasts, matching the reference demo's feel */
const AMBIENT_TOASTS = [
  ["SYSTEM", "Session established. Welcome back, V3c70r."],
  ["AUTH", "SSH key fingerprint verified."],
  ["NET", "Incoming packet on port 443 → logged."],
];
let ambientIdx = 0;
setTimeout(() => {
  showToast(...AMBIENT_TOASTS[0]);
  setInterval(() => {
    ambientIdx = (ambientIdx + 1) % AMBIENT_TOASTS.length;
    showToast(...AMBIENT_TOASTS[ambientIdx]);
  }, 14000);
}, 1500);
