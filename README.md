# 🚀 BigQuery Release Notes Broadcaster

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

## 📌 Project Overview
The **BigQuery Release Notes Broadcaster** is a real-time web application designed to track, categorize, and broadcast Google Cloud BigQuery updates. Instead of manually checking official documentation, this application fetches live XML/RSS feeds from Google Cloud, normalizes the data, and presents it in a highly interactive, glassmorphic dashboard. 

It also features a custom-built **X (formerly Twitter) Intent Composer** that allows developers to instantly draft, format, and publish updates directly to their social feeds.

**🔗 Live Demo:**  https://pradeep-bigquery-release-notes-h6ed.vercel.app/

---

## 🤖 Built with Agentic AI & MCP
This project was developed as part of the **Kaggle x Google "5-Day AI Agents: Intensive Vibe Coding Course"**. 
It showcases the power of **Vibe Coding** and AI collaboration, utilizing:
* **Antigravity CLI (Gemini 3.5 Flash):** For rapid prototyping, terminal execution, and file system management.
* **Model Context Protocol (MCP):** Configured with the Google Developer Knowledge MCP server to seamlessly connect the AI agent with external tools and official Google documentation.

---

## ✨ Comprehensive Feature List

### 1. ⚙️ Backend Integration & API Parsing
* **Live Feed Fetching:** Directly consumes the Google Cloud BigQuery XML feed.
* **Smart Parsing:** Reads unstructured XML and categorizes updates into logical buckets: `Features`, `Announcements`, `Issues`, and `Fixes`.
* **In-Memory Caching:** Implements a 5-minute memory cache to store API responses, drastically reducing load times and preventing rate-limiting from Google Cloud servers.

### 2. 🎨 Interactive UI & UX
* **Glassmorphic Design:** A modern, frosted-glass UI layout that looks premium and professional.
* **Skeleton Loaders:** Displays loading animations while the feed is being fetched, ensuring a smooth user experience.
* **Theme Switching:** Fully functional Dark (Slate) and Light mode toggle.
* **Real-time Filtering & Search:**
  * Search instantly for keywords (e.g., "Gemini", "SQL").
  * Clickable "Category Pills" to filter update cards.
  * Sort dropdown to view the timeline chronologically (Newest/Oldest).

### 3. 🐦 X (Twitter) Intent Composer
* **Live Broadcast Modal:** Clicking "Tweet Update" opens a modal pre-filled with the release note data.
* **Live Preview:** Renders a mock UI showing exactly how the tweet will look on X.
* **Smart Character Limit:** Actively tracks the 280-character limit, disabling the publish button and showing warnings if exceeded.
* **Auto-Shorten Algorithm:** A one-click utility to compress and format the draft to fit within bounds.
* **Tag Appender:** Automatically appends relevant hashtags (e.g., `#BigQuery`, `#GoogleCloud`).

---

## 🏗️ Technical Architecture

* **Backend:** Python, Flask, Gunicorn (for production)
* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Deployment:** Vercel (via `vercel.json` configuration)

---

## 🚀 Local Installation & Setup

Want to run this locally? Follow these steps:

**1. Clone the repository**
```bash
git clone [https://github.com/pradeep1330/pradeep-bigquery-release-notes.git](https://github.com/pradeep1330/pradeep-bigquery-release-notes.git)
cd pradeep-bigquery-release-notes

----

👨‍💻 Author 
Pradeep Pankaj
B.Tech CSE | AI & Full-Stack Enthusiast
