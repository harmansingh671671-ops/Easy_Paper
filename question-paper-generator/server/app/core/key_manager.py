import os
import time
import random
from typing import List, Dict

class KeyManager:
    def __init__(self):
        self._ensure_env_loaded()
        self.keys: List[str] = self._load_keys()
        self.key_status: Dict[str, float] = {k: 0.0 for k in self.keys}
        
        # Helper map to find key by nickname/index if needed, or by task
        self.task_keys = {}

    def _ensure_env_loaded(self):
        """Manual fallback to load .env if load_dotenv failed"""
        if os.getenv("GEMINI_API_KEY"):
            return

        print("DEBUG: GEMINI_API_KEY not found in env, attempting manual .env load")
        try:
            # Try to find .env in current or parent dirs
            current = os.path.dirname(os.path.abspath(__file__))
            # Go up 2 levels: app/core -> app -> server
            base_dir = os.path.dirname(os.path.dirname(current))
            env_path = os.path.join(base_dir, ".env")
            
            if not os.path.exists(env_path):
                 # Try current dir
                 env_path = ".env"

            if os.path.exists(env_path):
                print(f"DEBUG: Loading .env from {env_path}")
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if "=" in line:
                            k, v = line.split("=", 1)
                            # Handle quotes
                            v = v.strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v
                                # print(f"DEBUG: Loaded {k}")
            else:
                print(f"DEBUG: .env not found at {env_path}")
        except Exception as e:
            print(f"DEBUG: Manual .env load failed: {e}")

    def _load_keys(self) -> List[str]:
        # User provided OpenRouter keys
        keys = [
            "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",
            "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",
            "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"
        ]
        print(f"DEBUG: KeyManager loaded {len(keys)} OpenRouter keys.")
        return keys

    def get_valid_key(self, task_type: str = None) -> str:
        """
        Get a key. If task_type is provided, prefer that specific key.
        """
        now = time.time()
        
        # 1. Try Task Specific Key
        if task_type:
            target_key = self.task_keys.get(task_type)
            if target_key:
                # Check status
                if target_key not in self.key_status:
                    self.key_status[target_key] = 0.0
                
                if self.key_status[target_key] <= now:
                    return target_key
                else:
                    print(f"DEBUG: Key for {task_type} is rate limited. Falling back to pool.")
        
        # 2. Pool Logic (Fallback)
        available_keys = [k for k in self.keys if self.key_status.get(k, 0) <= now]
        
        if available_keys:
            return random.choice(available_keys)
            
        if not self.keys:
             raise ValueError("No API keys found")
             
        # All keys exhausted
        raise Exception("All API keys are exhausted/rate-limited.")

    def mark_rate_limited(self, key: str, cooldown_seconds: int = 60):
        """Mark a key as rate limited"""
        self.key_status[key] = time.time() + cooldown_seconds
        print(f"Key ...{key[-4:]} marked as rate limited for {cooldown_seconds}s")

    def report_success(self, key: str):
        pass
