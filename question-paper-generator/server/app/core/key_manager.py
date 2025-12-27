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
        self.task_keys = {
            "notes": os.getenv("1_GEMINI_API_KEY"),
            "flashcards": os.getenv("2_GEMINI_API_KEY"),
            "mindmap": os.getenv("3_GEMINI_API_KEY"),
            "quiz": os.getenv("4_GEMINI_API_KEY"),
        }

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
        keys = []
        
        # 0. Check for user-specified 'keys' variable (Edge case based on user comment)
        # "i ahve written them in format as keys=1,2,3,4"
        custom_keys = os.getenv("keys")
        if custom_keys:
            print(f"DEBUG: Found 'keys' env var: {custom_keys[:10]}...")
            for k in custom_keys.split(","):
                k = k.strip()
                if k and k not in keys:
                    keys.append(k)

        # 1. Load comma-separated pool (High Priority)
        # Support both GEMINI_API_KEYS and GEMINI_API_KEY (if it contains commas)
        env_vars = ["GEMINI_API_KEYS", "GEMINI_API_KEY"]
        
        for var_name in env_vars:
            val = os.getenv(var_name)
            if val:
                # If it looks like a list (contains comma), split it
                if "," in val:
                    print(f"DEBUG: Loading multiple keys from {var_name}")
                    for k in val.split(","):
                        k = k.strip()
                        if k and k not in keys:
                            keys.append(k)
                # Otherwise, if it's a single key and not already added
                elif val.strip() and val.strip() not in keys:
                    print(f"DEBUG: Loading single key from {var_name}")
                    keys.append(val.strip())
        
        # 2. Load numbered task keys (Legacy/Auxiliary)
        for i in range(1, 5):
            k = os.getenv(f"{i}_GEMINI_API_KEY")
            if k and k not in keys:
                keys.append(k)
            
        print(f"DEBUG: KeyManager loaded {len(keys)} unique keys.")
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
