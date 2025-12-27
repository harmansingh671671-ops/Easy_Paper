
import os
import time
from app.core.key_manager import KeyManager

def clear_env():
    keys_to_remove = ["GEMINI_API_KEYS", "GEMINI_API_KEY"]
    for i in range(1, 10):
        keys_to_remove.append(f"{i}_GEMINI_API_KEY")
        
    for k in keys_to_remove:
        if k in os.environ:
            del os.environ[k]

def test_key_loading():
    print("\n--- Testing Key Loading ---")
    clear_env()
    # Mock environment variables
    os.environ["GEMINI_API_KEYS"] = "key_A,key_B,key_C"
    os.environ["1_GEMINI_API_KEY"] = "key_legacy_1"
    
    km = KeyManager()
    print(f"Loaded keys: {km.keys}")
    
    # Order might vary depending on implementation, but set should match
    expected_set = {"key_A", "key_B", "key_C", "key_legacy_1"}
    if set(km.keys) == expected_set:
        print("✅ SUCCESS: Keys loaded correctly.")
    else:
        print(f"❌ FAILURE: Expected {expected_set}, got {km.keys}")

def test_key_rotation():
    print("\n--- Testing Key Rotation ---")
    clear_env()
    os.environ["GEMINI_API_KEYS"] = "key_1,key_2"
    km = KeyManager()
    print(f"Loaded keys: {km.keys}")
    
    # Simulate rate limit on key_1
    print("Marking key_1 as rate limited...")
    km.mark_rate_limited("key_1", cooldown_seconds=5)
    
    # Get valid key - MUST be key_2
    key = km.get_valid_key()
    print(f"Got key: {key}")
    
    if key == "key_2":
        print("✅ SUCCESS: Rotated to key_2.")
    else:
        print(f"❌ FAILURE: Expected key_2, got {key}")

    # Simulate rate limit on key_2
    print("Marking key_2 as rate limited...")
    km.mark_rate_limited("key_2", cooldown_seconds=5)
    
    # Try to get key - should verify exhaustion behavior
    try:
        km.get_valid_key()
        print("❌ FAILURE: Should have raised exception for exhausted keys.")
    except Exception as e:
        print(f"✅ SUCCESS: Correctly raised exception: {str(e)}")

if __name__ == "__main__":
    test_key_loading()
    test_key_rotation()
