"""
github_storage.py

GitHub Repository Storage Service for Course Notes and Scans.
Adapted from EduAI and DarkForgeArt.
Uploads, downloads, and deletes note images via GitHub Contents API.
"""
from __future__ import annotations

import base64
import logging
import os
import uuid
from dataclasses import dataclass
from typing import Optional
from urllib.parse import quote, unquote

import requests

LOG = logging.getLogger(__name__)


@dataclass(slots=True)
class GitHubUploadResult:
    repo_path: str      # e.g. "study_notes/SMA300/abc123_cauchy_proof.jpg"
    stored_path: str    # e.g. "github://owner/repo/main/study_notes/..."
    public_url: str     # e.g. "https://raw.githubusercontent.com/owner/repo/main/..."


class GitHubStorageService:
    """Uploads and deletes files in a GitHub repository via the Contents API."""

    def __init__(
        self,
        token: Optional[str] = None,
        repo_name: Optional[str] = None,
        branch: str = "main",
        upload_dir: str = "study_notes"
    ) -> None:
        self.token = (token or os.getenv("GITHUB_TOKEN") or "").strip()
        self.repo_name = (repo_name or os.getenv("GITHUB_REPO") or "").strip()
        self.branch = (branch or os.getenv("GITHUB_BRANCH") or "main").strip()
        self.upload_dir = upload_dir.strip("/")
        self.base_url = "https://api.github.com"
        self.session = requests.Session()
        if self.token:
            self.session.headers.update({
                "Authorization": f"token {self.token}",
                "Accept": "application/vnd.github+json",
            })

    def is_configured(self) -> bool:
        """Returns True if token and repository name are provided."""
        return bool(self.token and self.repo_name)

    def _get_file_sha(self, path: str) -> Optional[str]:
        """Fetch SHA of an existing file (required for updates/deletes)."""
        if not self.is_configured():
            return None
        try:
            resp = self.session.get(
                f"{self.base_url}/repos/{self.repo_name}/contents/{quote(path, safe='/')}",
                params={"ref": self.branch},
                timeout=15,
            )
            if resp.status_code >= 300:
                return None
            data = resp.json()
            if isinstance(data, dict):
                return data.get("sha")
        except Exception as err:
            LOG.warning(f"Failed to get file SHA for {path}: {err}")
        return None

    def upload_file(
        self,
        file_data: bytes | any,
        filename: str = "image.jpg",
        subdir: Optional[str] = None
    ) -> Optional[GitHubUploadResult]:
        """
        Upload file bytes to GitHub repository under upload_dir/subdir.
        Returns GitHubUploadResult with raw.githubusercontent.com public URL.
        """
        if not self.is_configured():
            raise ValueError("GitHub credentials not configured. Please set GITHUB_TOKEN and GITHUB_REPO in .env")

        # Read binary content
        if hasattr(file_data, "read"):
            try:
                file_data.seek(0)
            except Exception:
                pass
            content = file_data.read()
        else:
            content = bytes(file_data)

        if not content:
            return None

        # Sanitize filename
        safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in filename)
        if not safe_name or safe_name == ".":
            safe_name = "scan.jpg"
        unique_prefix = uuid.uuid4().hex[:8]
        unique_filename = f"{unique_prefix}_{safe_name}"

        base_dir = self.upload_dir
        if subdir:
            base_dir = f"{base_dir}/{subdir.strip('/')}"
        repo_path = f"{base_dir}/{unique_filename}"

        encoded = base64.b64encode(content).decode("utf-8")
        payload = {
            "message": f"[StudyScheduler] Upload note attachment {unique_filename}",
            "content": encoded,
            "branch": self.branch,
        }

        sha = self._get_file_sha(repo_path)
        if sha:
            payload["sha"] = sha

        resp = self.session.put(
            f"{self.base_url}/repos/{self.repo_name}/contents/{quote(repo_path, safe='/')}",
            json=payload,
            timeout=30,
        )

        if resp.status_code >= 300:
            err_msg = resp.text
            try:
                err_msg = resp.json().get("message", resp.text)
            except Exception:
                pass
            raise RuntimeError(f"GitHub API upload failed ({resp.status_code}): {err_msg}")

        stored_path = f"github://{self.repo_name}/{self.branch}/{repo_path}"
        public_url = self.get_public_url(repo_path)
        return GitHubUploadResult(
            repo_path=repo_path,
            stored_path=stored_path,
            public_url=public_url,
        )

    def delete_file(self, stored_path: str) -> bool:
        """Delete a file from GitHub by its stored_path."""
        if not self.is_configured():
            return False

        repo_path = self.repo_path_from_stored(stored_path)
        if not repo_path:
            return False

        sha = self._get_file_sha(repo_path)
        if not sha:
            return False

        payload = {
            "message": f"[StudyScheduler] Delete note attachment {repo_path}",
            "sha": sha,
            "branch": self.branch,
        }

        try:
            resp = self.session.delete(
                f"{self.base_url}/repos/{self.repo_name}/contents/{quote(repo_path, safe='/')}",
                json=payload,
                timeout=20,
            )
            return resp.status_code < 300
        except Exception as err:
            LOG.error(f"Failed to delete {repo_path} from GitHub: {err}")
            return False

    def get_public_url(self, repo_path: str) -> str:
        """Return the direct raw.githubusercontent.com URL for fast browser access."""
        owner, repo = self.repo_name.split("/", 1) if "/" in self.repo_name else ("", self.repo_name)
        return f"https://raw.githubusercontent.com/{owner}/{repo}/{self.branch}/{quote(repo_path.lstrip('/'), safe='/')}"

    @staticmethod
    def repo_path_from_stored(stored_path: str) -> Optional[str]:
        """Extract the repo-relative path from a stored_path string (github://owner/repo/branch/path)."""
        if not stored_path or not stored_path.startswith("github://"):
            return None
        rest = stored_path[len("github://"):]
        parts = rest.split("/", 3)
        if len(parts) < 4:
            return None
        return parts[3]
