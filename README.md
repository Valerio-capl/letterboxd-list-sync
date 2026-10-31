# Letterboxd List Sync

A browser extension that allows you to easily synchronize and share Letterboxd lists directly within the platform.

This project was born out of a desire to create a seamless way to share lists on Letterboxd by syncing missing films from a source list to a destination list.

**Credits:** The core idea for this extension was heavily inspired by [shared_movie_lists_maker](https://github.com/solid-cata/shared_movie_lists_maker). While his repository provides an external tool to generate and manage shared movie lists, I built this extension to bring a similar collaborative syncing capability natively into the browser UI.

## How it Works
The extension automates the process of comparing two different Letterboxd lists and importing the missing films.

1. Open your destination list on Letterboxd (it must contain at least one film, and you must be the owner).
2. Click on the extension icon in your browser toolbar.
3. Paste the URL of the source list you want to sync from.
4. Click Sync.
5. The extension will automatically compare the two lists, find the missing films, generate a CSV file in the background, and redirect you to the Letterboxd preview page to confirm the import.


## Installation
You can install this extension on Google Chrome (or Chromium-based browsers like Edge and Brave).

1. Click on the Code button, and select Download ZIP. 
Extract the downloaded .zip file into a folder on your computer. 
Or clone the repository:
```bash
git clone https://github.com/Valerio-capl/letterboxd-list-sync.git
```

2. Navigate to ```chrome://extensions/``` in your browser.
3. Enable Developer mode.
4. Click Load unpacked and select the cloned directory.
5. Start syncing.

