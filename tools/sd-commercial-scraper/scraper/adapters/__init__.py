"""Adapter registry."""
from .craigslist import CraigslistAdapter
from .crexi import CrexiAdapter
from .generic import GenericAdapter
from .loopnet import LoopNetAdapter

# name -> adapter class, for the built-in sources
BUILTIN_ADAPTERS = {
    CraigslistAdapter.name: CraigslistAdapter,
    LoopNetAdapter.name: LoopNetAdapter,
    CrexiAdapter.name: CrexiAdapter,
}

__all__ = [
    "BUILTIN_ADAPTERS",
    "CraigslistAdapter",
    "LoopNetAdapter",
    "CrexiAdapter",
    "GenericAdapter",
]
