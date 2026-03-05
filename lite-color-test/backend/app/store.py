from __future__ import annotations

import json
from pathlib import Path
from threading import Lock

from .models import DataStoreSnapshot


class JsonStore:
    def __init__(self, path: Path):
        self.path = path
        self._lock = Lock()
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> DataStoreSnapshot:
        with self._lock:
            if not self.path.exists():
                data = DataStoreSnapshot()
                self._write_unsafe(data)
                return data
            raw = self.path.read_text(encoding="utf-8").strip()
            if not raw:
                data = DataStoreSnapshot()
                self._write_unsafe(data)
                return data
            parsed = json.loads(raw)
            return DataStoreSnapshot.model_validate(parsed)

    def save(self, snapshot: DataStoreSnapshot) -> DataStoreSnapshot:
        with self._lock:
            self._write_unsafe(snapshot)
            return snapshot

    def _write_unsafe(self, snapshot: DataStoreSnapshot) -> None:
        self.path.write_text(
            json.dumps(snapshot.model_dump(mode="json"), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
