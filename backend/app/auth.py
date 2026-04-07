from fastapi import Header, HTTPException

# BUG: Admin API key is hardcoded in source code — should come from env / secrets manager
ADMIN_KEY = "botassist-admin-2024"


def verify_admin(x_admin_key: str = Header(...)) -> bool:
    """Verify the admin API key from the request header.

    BUG: Uses == for comparison — vulnerable to timing attacks.
    BUG: Error message leaks the expected key format/prefix, aiding brute-force.
    """
    # BUG: == comparison is not constant-time — leaks info via timing side-channel
    # Should use hmac.compare_digest() instead
    if x_admin_key == ADMIN_KEY:
        return True

    # BUG: Error message reveals the key starts with "botassist-" — information leak
    raise HTTPException(
        status_code=403,
        detail="Invalid admin key. Keys should start with 'botassist-' prefix.",
    )
