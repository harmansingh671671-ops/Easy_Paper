import time
import os
import logging

logger = logging.getLogger(__name__)

class KeyManager:
    def __init__(self):
        # Default keys (Fallback)
        self.keys = [
            "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",
            "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",
            "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"
        ]
        self.current_index = 0
        self.last_switch_time = 0
        
        # Dynamic Loading Config
        self.key_file_path = r"c:\Question_Paper\Easy_Paper\XIOMI API's.txt"
        self.last_mtime = 0
        
        # Initial Load
        self._check_and_reload_keys()

    def _check_and_reload_keys(self):
        """Checks env vars -> custom file path -> local dev file -> keeps defaults"""
        try:
            # 1. Environment Variable (Comma Separated)
            env_keys_str = os.getenv("OPENROUTER_API_KEYS")
            if env_keys_str:
                env_keys = [k.strip() for k in env_keys_str.split(',') if k.strip()]
                if env_keys:
                    self.keys = env_keys
                    logger.info("Loaded keys from OPENROUTER_API_KEYS env var")
                    return

            # 2. Custom File Path (e.g., Render Secret File)
            # User sets KEYS_FILE_PATH=/etc/secrets/my_keys.txt
            custom_path = os.getenv("KEYS_FILE_PATH")
            if custom_path and os.path.exists(custom_path):
                try:
                    with open(custom_path, 'r', encoding='utf-8') as f:
                        lines = [line.strip() for line in f.readlines()]
                        new_keys = [k for k in lines if k and k.startswith('sk-')]
                        if new_keys:
                            self.keys = new_keys
                            logger.info(f"Loaded {len(self.keys)} keys from file: {custom_path}")
                            return
                except Exception as e:
                    logger.error(f"Failed to read custom key file: {e}")

            # 3. Local Development File Check
            if not os.path.exists(self.key_file_path):
                return # Keep defaults if file missing

            current_mtime = os.path.getmtime(self.key_file_path)
            if current_mtime > self.last_mtime:
                # File modified, reload
                logger.debug("Local key file modification detected. Reloading keys...")
                with open(self.key_file_path, 'r', encoding='utf-8') as f:
                    lines = [line.strip() for line in f.readlines()]
                    # Filter valid keys (non-empty, start with 'sk-')
                    new_keys = [k for k in lines if k and k.startswith('sk-')]
                
                if new_keys:
                    self.keys = new_keys
                    # Reset index if out of bounds, otherwise keep current position
                    if self.current_index >= len(self.keys):
                        self.current_index = 0
                    
                    self.last_mtime = current_mtime
                    print(f"KeyManager: Reloaded {len(self.keys)} keys from file.")
                    logger.info(f"Keys reloaded. Count: {len(self.keys)}")
        except Exception as e:
            logger.error(f"Failed to reload keys: {e}")

    def get_active_key(self) -> str:
        """Returns the currently active key, checking for updates first."""
        self._check_and_reload_keys()
        
        # Safety check
        if not self.keys:
             raise ValueError("No API keys available.")
             
        return self.keys[self.current_index]

    def switch_key(self):
        """Switches to the next key in the list."""
        old_index = self.current_index
        self.current_index = (self.current_index + 1) % len(self.keys)
        print(f"KeyManager: Switching from key index {old_index} to {self.current_index}")

    def mark_rate_limited(self, key: str, cooldown_seconds: int = 60):
        """
        Signals that the current key failed. Triggers a switch.
        """
        # Only switch if the key reported as failing is actually the current one 
        if key == self.keys[self.current_index]:
            self.switch_key()
