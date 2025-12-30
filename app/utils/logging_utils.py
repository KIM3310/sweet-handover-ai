import sys
import traceback


def safe_print(message: str) -> None:
    try:
        print(message)
    except UnicodeEncodeError:
        encoded = message.encode("utf-8", errors="replace").decode("utf-8")
        print(encoded)


def log_exception(prefix: str, error: Exception) -> None:
    safe_print(f"{prefix}{error}")
    traceback.print_exc()
