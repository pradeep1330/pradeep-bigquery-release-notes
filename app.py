import os
import re
import requests
from datetime import datetime
from flask import Flask, render_template, jsonify, request
import xml.etree.ElementTree as ET

app = Flask(__name__)

# Constants
RELEASE_NOTES_FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_TIMEOUT_SECONDS = 300  # 5 minutes cache

# Simple in-memory cache
cache = {
    "data": None,
    "last_fetched": None
}

def parse_release_notes(xml_content):
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        print(f"XML parsing error: {e}")
        return []

    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    updates = []
    
    entries = root.findall('atom:entry', ns)
    for entry_idx, entry in enumerate(entries):
        date_elem = entry.find('atom:title', ns)
        date = date_elem.text.strip() if date_elem is not None else "Unknown Date"
        
        updated_elem = entry.find('atom:updated', ns)
        updated = updated_elem.text.strip() if updated_elem is not None else ""
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        # Split HTML content by <h3> tag boundaries to find separate release elements
        parts = re.split(r'<h3>(.*?)</h3>', content_html)
        if len(parts) > 1:
            update_idx = 0
            for i in range(1, len(parts), 2):
                update_type = parts[i].strip()
                update_desc = parts[i+1].strip() if i+1 < len(parts) else ""
                
                # Generate a plain text description for tweeting (removing HTML)
                # Replace <br> and </p> tags with spaces to avoid smashing words together
                clean_text = re.sub(r'</?(?:p|br|div|li|ul|ol)[^>]*>', ' ', update_desc)
                clean_text = re.sub(r'<[^>]+>', '', clean_text)
                clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                
                updates.append({
                    "id": f"note-{entry_idx}-{update_idx}",
                    "date": date,
                    "updated": updated,
                    "type": update_type,
                    "content": update_desc,
                    "text": clean_text
                })
                update_idx += 1
        else:
            # Fallback if no <h3> tags are found
            clean_text = re.sub(r'</?(?:p|br|div|li|ul|ol)[^>]*>', ' ', content_html)
            clean_text = re.sub(r'<[^>]+>', '', clean_text)
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()
            
            updates.append({
                "id": f"note-{entry_idx}-0",
                "date": date,
                "updated": updated,
                "type": "General",
                "content": content_html,
                "text": clean_text
            })
            
    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = datetime.now()
    
    # Check cache viability
    if (not force_refresh and 
        cache["data"] is not None and 
        cache["last_fetched"] is not None and 
        (now - cache["last_fetched"]).total_seconds() < CACHE_TIMEOUT_SECONDS):
        return jsonify({
            "status": "success",
            "source": "cache",
            "last_fetched": cache["last_fetched"].strftime("%Y-%m-%d %H:%M:%S"),
            "notes": cache["data"]
        })
        
    try:
        response = requests.get(RELEASE_NOTES_FEED_URL, timeout=15)
        if response.status_code == 200:
            parsed_notes = parse_release_notes(response.content)
            cache["data"] = parsed_notes
            cache["last_fetched"] = now
            return jsonify({
                "status": "success",
                "source": "live",
                "last_fetched": now.strftime("%Y-%m-%d %H:%M:%S"),
                "notes": parsed_notes
            })
        else:
            # Return cached data if available as a fallback on failure
            if cache["data"] is not None:
                return jsonify({
                    "status": "fallback",
                    "source": "cache_on_error",
                    "last_fetched": cache["last_fetched"].strftime("%Y-%m-%d %H:%M:%S"),
                    "notes": cache["data"],
                    "error": f"Failed to fetch live feed. Status code: {response.status_code}"
                })
            return jsonify({
                "status": "error",
                "message": f"Failed to fetch release notes from source feed. Status code: {response.status_code}"
            }), 502
    except Exception as e:
        # Fallback to cache on exception
        if cache["data"] is not None:
            return jsonify({
                "status": "fallback",
                "source": "cache_on_error",
                "last_fetched": cache["last_fetched"].strftime("%Y-%m-%d %H:%M:%S"),
                "notes": cache["data"],
                "error": str(e)
            })
        return jsonify({
            "status": "error",
            "message": f"Exception occurred while fetching release notes: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Run the server locally on port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
