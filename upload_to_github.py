#!/usr/bin/env python3
"""
AlertX - GitHub Automated Uploader
Uploads the AlertX repository directly to GitHub using GitHub's REST API.
"""

import os
import sys
import base64
import json
import urllib.request
import urllib.error

REPO_NAME = "alertx-smart-response"
REPO_DESCRIPTION = "AlertX Smart Response - Smart Emergency and Crime Reporting System for Women Safety with AI Priority Classifier and Suspect Sketcher"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def create_github_repo(token, repo_name, is_private=False):
    url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AlertX-Uploader"
    }
    payload = {
        "name": repo_name,
        "description": REPO_DESCRIPTION,
        "private": is_private,
        "auto_init": False
    }

    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            print(f"[+] Created new repository: {data.get('html_url')}")
            return data.get('owner', {}).get('login'), data.get('name')
    except urllib.error.HTTPError as e:
        if e.code == 422:
            print(f"[*] Repository '{repo_name}' already exists on your account. Proceeding to update files...")
            # Fetch user info to get username
            user_req = urllib.request.Request("https://api.github.com/user", headers=headers)
            with urllib.request.urlopen(user_req) as ures:
                udata = json.loads(ures.read().decode('utf-8'))
                return udata.get('login'), repo_name
        else:
            err_msg = e.read().decode('utf-8')
            print(f"[!] Error creating repository: {e.code} - {err_msg}")
            sys.exit(1)

def get_file_sha(token, owner, repo, path):
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AlertX-Uploader"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            return data.get('sha')
    except Exception:
        return None

def upload_file(token, owner, repo, local_path, repo_path):
    with open(local_path, "rb") as f:
        content_bytes = f.read()

    b64_content = base64.b64encode(content_bytes).decode('utf-8')
    sha = get_file_sha(token, owner, repo, repo_path)

    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{repo_path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AlertX-Uploader"
    }
    payload = {
        "message": f"Add/Update {repo_path}",
        "content": b64_content
    }
    if sha:
        payload["sha"] = sha

    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='PUT')
    try:
        with urllib.request.urlopen(req) as res:
            print(f"  [OK] Uploaded {repo_path}")
    except urllib.error.HTTPError as e:
        print(f"  [!] Failed to upload {repo_path}: {e.code} - {e.read().decode('utf-8')}")

def main():
    print("==================================================================")
    print("        ALERTX - GITHUB AUTOMATED REPOSITORY UPLOADER            ")
    print("==================================================================")
    
    token = os.environ.get("GITHUB_TOKEN")
    if not token and len(sys.argv) > 1:
        token = sys.argv[1]

    if not token:
        print("\nPlease provide your GitHub Personal Access Token (PAT):")
        print("You can generate one at: https://github.com/settings/tokens (with 'repo' scope)")
        try:
            token = input("Enter GitHub Token: ").strip()
        except EOFError:
            pass

    if not token:
        print("[!] No token provided. Exiting.")
        print("\nAlternatively, run:")
        print("  python upload_to_github.py YOUR_GITHUB_PERSONAL_ACCESS_TOKEN")
        sys.exit(1)

    print("\n[1/3] Authenticating & initializing GitHub repository...")
    owner, repo = create_github_repo(token, REPO_NAME)

    print("\n[2/3] Scanning project files...")
    ignore_files = {'.git', '__pycache__', 'alertx.db-journal', 'upload_to_github.py'}
    ignore_extensions = {'.pyc', '.token', '.zip'}

    files_to_upload = []
    for root, dirs, files in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in ignore_files]
        for file in files:
            if file in ignore_files:
                continue
            if any(file.endswith(ext) for ext in ignore_extensions):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, BASE_DIR).replace('\\', '/')
            files_to_upload.append((full_path, rel_path))

    print(f"[3/3] Uploading {len(files_to_upload)} files to https://github.com/{owner}/{repo}...")
    for full_path, rel_path in files_to_upload:
        upload_file(token, owner, repo, full_path, rel_path)

    print("\n==================================================================")
    print(f"🎉 SUCCESS! Repository is live at: https://github.com/{owner}/{repo}")
    print("==================================================================")

if __name__ == '__main__':
    main()
