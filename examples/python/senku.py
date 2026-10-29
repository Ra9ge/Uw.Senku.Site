"""Минимальный клиент публичного API Senku на Python (только стандартная библиотека)."""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

BASE_URL = "https://senku.one/api/v2"
USER_AGENT = "SenkuSDK-Python/0.1 (+https://github.com/Ra9ge/Uw.Senku.Site)"


class SenkuError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code


class Senku:
    def __init__(self, token: str | None = None, base_url: str = BASE_URL, retries: int = 2, timeout: float = 15) -> None:
        self.token = token
        self.base_url = base_url.rstrip("/")
        self.retries = retries
        self.timeout = timeout

    def get(self, path: str, **query: Any) -> Any:
        params = {k: v for k, v in query.items() if v not in (None, "")}
        url = f"{self.base_url}/{path.lstrip('/')}"
        if params:
            url += "?" + urllib.parse.urlencode(params)
        headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        for attempt in range(self.retries + 1):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=self.timeout) as res:
                    body = json.loads(res.read())
            except urllib.error.HTTPError as e:
                try:
                    body = json.loads(e.read())
                except ValueError:
                    body = {"ok": False, "error": {"code": "http", "message": str(e)}}
                if (e.code == 429 or e.code >= 500) and attempt < self.retries:
                    time.sleep(0.4 * 2**attempt)
                    continue
                err = body.get("error", {})
                raise SenkuError(e.code, err.get("code", "http"), err.get("message", str(e))) from None
            if not body.get("ok"):
                err = body.get("error", {})
                raise SenkuError(200, err.get("code", "error"), err.get("message", "API error"))
            return body["data"]
        raise SenkuError(0, "retries", "Senku is not responding")

    def anime(self, anime_id: int) -> dict:
        return self.get(f"anime/{anime_id}")

    def search(self, q: str) -> list[dict]:
        return self.get("search", q=q)["results"]

    def schedule(self) -> list[dict]:
        return self.get("schedule")["items"]

    def user(self, ref: int | str) -> dict:
        if isinstance(ref, int) or str(ref).isdigit():
            return self.get(f"users/{ref}")["user"]
        return self.get("users/0", username=ref)["user"]

    def user_stats(self, user_id: int) -> dict:
        return self.get(f"users/{user_id}/stats")

    def top(self) -> list[dict]:
        return self.get("top-users")["users"]


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    senku = Senku()
    print("Топ зрителей Senku:")
    for place, u in enumerate(senku.top()[:10], 1):
        hours = u["total_watch_seconds"] // 3600
        print(f"{place:>2}. {u['username']:<20} уровень {u['level']:<3} {hours} ч")
    hit = senku.search("Фрирен")[0]
    a = senku.anime(hit["id"])
    print(f"\n{a['title']} ({a['year']}) — {a['episodes_aired']} серий, жанры: {', '.join(a['genres'])}")
