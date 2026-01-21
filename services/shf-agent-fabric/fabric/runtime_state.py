from fabric.mode_store import read_mode, write_mode
from fabric.settings import FABRIC_MODE_DEFAULT

def get_mode() -> str:
    return read_mode(default=FABRIC_MODE_DEFAULT)

def set_mode(mode: str) -> str:
    return write_mode(mode)
