---
title: Cookies Hijacking
author: Radeel Ahmad
pubDatetime: 2024-08-8T12:22:23Z
slug:  cookies hijacking 101
featured: false
draft: false
tags:
  - hacking
  - session-hacking
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


First of all, we go to web server directory using.
```bash
cd /var/www/html
```

Now we clone DVWA using git clone command.
```bash
sudo git clone https://github.com/digininja/DVWA.git
```

Giving executable permission to DVWA directory.
```bash
sudo chmod -R 777 DVWA
```

Now we use cd command to go inside config directory with in DVWA.
```bash
cd DVWA/config
```

Now make copy of config.inc.php.dist file in same directory because original may be use in future.
```bash
sudo cp config.inc.php.dist config.inc.php
```

Now we open config.inc.php in no terminal and change default db_user to admin and db_password to password.
```bash
sudo nano config.inc.php
```

<img src="https://raw.githubusercontent.com/RadeelAhmad/my-portfolio/main/src/content/blog/Images/CH-1.jpg" alt="cookies hijacking">

DVWA configuration has been completed.

Now we set database for DVWA.
```bash
sudo service mysql start
```

Now login into mysql server as a root user.
```bash
sudo mysql -u root -p
```

Create database for DVWA.
```bash
create database dvwa
```
Because in configuration file we set the database name dvwa.

Now we create user in database.
```bash
create user 'admin'@'127.0.0.1' identified by 'password';
```

Here we grant all privilege to user.
```bash
grant all privileges on dvwa.* to 'admin'@'127.0.0.1';
```

Exit for mysql server using `exit` command.

**Now we start apache2 service on kali machine.**
```bash
sudo service apache2 start.
```

Now we have to do some changes in php configuration.
```bash
cd /etc/php/<php version>/apache2
nano php.ini
```

In this file turn ON allow_url_fopen and allow_url_include.
<img src="https://raw.githubusercontent.com/RadeelAhmad/my-portfolio/main/src/content/blog/Images/CH-2.jpg" alt="cookies hijacking">

**Now DVWM is install and configure in our kali machine we can simple check it by entering in URL `127.0.0.1/DVWA`**.
<img src="https://raw.githubusercontent.com/RadeelAhmad/my-portfolio/main/src/content/blog/Images/CH-3.jpg" alt="cookies hijacking">

Enter user `name` and `password` as set before, i.e. `admin` and `password`.

**Mechanism of session hijacking practical:**
The first step in Session Hijacking is stealing the victim’s cookie, which can be done in many 
ways. We will capture packets between a client and the webserver with Wireshark. Then, we’ll 
capture the victim’s cookie and send it to the attacker.
Open Firefox in Kali Linux. In Firefox, type the following into the URL bar and press Enter:
```bash
http://<Machine_ip>/DVWA/
```

<img src="https://raw.githubusercontent.com/RadeelAhmad/my-portfolio/main/src/content/blog/Images/CH-4.jpg" alt="cookies hijacking">
