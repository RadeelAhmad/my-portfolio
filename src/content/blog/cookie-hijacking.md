---
title: Cookies Hijacking
author: Radeel Ahmad
pubDatetime: 2024-08-8T12:22:23Z
slug:  cookies hijacking 101
featured: false
draft: false
tags:
  - hacking
  - wireless-hacking
  - cookies-hijacking


description:
  step-by-step method to steal cookies.
---

## Introduction: 
Session hijacking is attack in which an attacker intercepts and stealth an active session between 
two end point, often between a user and a web application. This typically include stealing token 
and cookies. Which are then used for authenticate and authorized the user during a session.
In this project we first stole victim cookies and then then it to attacker machine. The attacker first 
use Wireshark to capture network traffic between victim and the website. Once the cookies are 
captured the attacker send it to their own machine using a tool. Finally, attacker inserts the stolen 
session cookie into their own web browser. By doing so, they effectively impersonate the victim's 
session on the targeted website.

## Tools Required: 
Following are the Tools used in this Project: 
- Virtual Box
- Window 10 
- Kali Linux VM.
- Wireshark.
- MySQL.
- Apache2
- DVWA (Damn Vulnerable Web Application). 

## Installing Tool: 
We need to install DVWA in our kali machine. It’s insecure web application designed to ne used 
for leaning and testing tool for Security. It is legal and safe environment to explore and 
understand common web application vulnerabilities.


**First of all, we go to web server directory using**
```bash
cd /var/www/html
```

**Now we clone DVWA using git clone command**
```bash
sudo git clone https://github.com/digininja/DVWA.git
```

**Giving executable permission to DVWA directory**
```bash
sudo chmod -R 777 DVWA
```
