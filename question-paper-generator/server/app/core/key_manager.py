import time

class KeyManager:
    def __init__(self):
        # 3 Specific Keys provided by user
        # 3 Specific Keys provided by user
        self.keys = [
            "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",
            "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",
            "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"
        ]
        self.current_index = 0
        self.last_switch_time = 0

    def get_active_key(self) -> str:
        """Returns the currently active key."""
        return self.keys[self.current_index]

    def switch_key(self):
        """Switches to the next key in the list."""
        old_index = self.current_index
        self.current_index = (self.current_index + 1) % len(self.keys)
        print(f"KeyManager: Switching from key index {old_index} to {self.current_index}")

    def mark_rate_limited(self, key: str, cooldown_seconds: int = 60):
        """
        Signals that the current key failed. Triggers a switch.
        Arguments ignore strict cooldown tracking in favor of simple sequential rotation.
        """
        # Only switch if the key reported as failing is actually the current one 
        # (to avoid race conditions if multiple failures come in)
        if key == self.keys[self.current_index]:
            self.switch_key()
