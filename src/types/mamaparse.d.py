#!/usr/bin/env python3
"""
Simple VS-Code Activity Bot – with burst/lull randomness
=======================================================

Adds *epochs* that last 60–240 s.  At every epoch change the bot
  • rescales its action weights (≈ behaviour “mood”)
  • picks a new mean delay
so long-term metrics never stabilise to a flat average.

Usage
-----
    pip install pyautogui
    python dev_bot_irregular.py --delay 5 --interval 1.8
Stop with Ctrl-C or by flinging the mouse to the top-left corner.
"""

from __future__ import annotations
import argparse, logging, random, signal, sys, time
from typing import Callable, Dict, Tuple, List
import pyautogui

# ──────────────────────────────────────────────────────────────────────────────
# Config you may tweak
# ──────────────────────────────────────────────────────────────────────────────
KEYWORDS = [
    "",
]
SCROLL_AMOUNT = 5
MOVE_RANGE = 0.6
MOVE_STEP  = 90
# baseline weights (sum 100)
BASE_WEIGHTS: Dict[str, int] = {
    "_random_move":   25,
    "_random_click":  25,
    "_type_keyword":  10,
    "_flip_tab":      15,
    "_scroll":        10,
    "_idle":          15,
}

# ──────────────────────────────────────────────────────────────────────────────
# Low-level actions
# ──────────────────────────────────────────────────────────────────────────────
def _flip_tab() -> None:
    pyautogui.hotkey("ctrl", "s")
    pyautogui.hotkey("ctrl", "shift", "tab" if random.random() > .7 else "tab")

def _scroll() -> None:
    pyautogui.scroll(random.randint(-SCROLL_AMOUNT, SCROLL_AMOUNT))

def _random_move() -> None:
    dx, dy = (random.randint(-MOVE_STEP, MOVE_STEP) for _ in range(2))
    pyautogui.moveRel(dx, dy, duration=0.15 + random.random()*0.25)

def _random_click() -> None:
    w, h = pyautogui.size()
    cx, cy = (w*(1-MOVE_RANGE)/2, h*(1-MOVE_RANGE)/2)
    rx, ry = (w*MOVE_RANGE, h*MOVE_RANGE)
    x = int(cx + random.random()*rx)
    y = int(cy + random.random()*ry)
    pyautogui.moveTo(x, y, duration=0.2 + random.random()*0.3,
                     tween=pyautogui.easeInOutQuad)
    pyautogui.click()

def _type_keyword() -> None:
    pyautogui.typewrite(random.choice(KEYWORDS),
                        interval=0.06 + random.random()*0.08)

def _idle() -> None:
    pass

# map names → functions so we can build weights dynamically
FUNC_BY_NAME: Dict[str, Callable[[], None]] = {
    f.__name__: f
    for f in (_random_move, _random_click, _type_keyword,
              _flip_tab, _scroll, _idle)
}

# ──────────────────────────────────────────────────────────────────────────────
# Helper to create a new epoch profile
# ──────────────────────────────────────────────────────────────────────────────
def _new_epoch(base_int: float
               ) -> Tuple[Tuple[Callable[[], None], ...],
                          Tuple[float, ...],
                          float,                     # mean delay
                          float]:                    # epoch length
    # random-scale each baseline weight then renormalise
    scaled = {k: v * random.uniform(0.4, 1.6)
              for k, v in BASE_WEIGHTS.items()}
    funcs, weights = zip(*((FUNC_BY_NAME[n], w) for n, w in scaled.items()))
    # new mean delay 0.5×-1.5× user-chosen base
    mean_delay = base_int * random.uniform(0.5, 1.5)
    # next epoch in 1–4 minutes
    length = random.uniform(60, 240)
    logging.debug("🔄  New epoch: len≈%.0fs, mean delay≈%.2fs, weights=%s",
                  length, mean_delay,
                  {f.__name__: round(w,1) for f, w in zip(funcs, weights)})
    return funcs, weights, mean_delay, length

# ──────────────────────────────────────────────────────────────────────────────
# CLI & main loop
# ──────────────────────────────────────────────────────────────────────────────
def _parse() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--delay", type=float, default=3,
                   help="Seconds to wait before starting (default 3)")
    p.add_argument("--interval", type=float, default=1.8,
                   help="Base mean seconds between actions (default 1.8)")
    p.add_argument("--log", default="INFO",
                   choices=["DEBUG","INFO","WARNING","ERROR","CRITICAL"])
    p.add_argument("--no-failsafe", dest="failsafe", action="store_false")
    p.set_defaults(failsafe=True)
    return p.parse_args()

def main() -> None:
    args = _parse()
    logging.basicConfig(level=getattr(logging, args.log),
                        format="%(asctime)s %(levelname)s %(message)s",
                        datefmt="%H:%M:%S")
    pyautogui.FAILSAFE = args.failsafe

    logging.info("Focus VS Code now – starting in %.1fs…", args.delay)
    time.sleep(args.delay)
    signal.signal(signal.SIGINT, lambda *_: sys.exit(0))

    funcs, weights, mean_delay, epoch_left = _new_epoch(args.interval)
    cycle = 0
    while True:
        # pick & run action
        cycle += 1
        action = random.choices(funcs, weights=weights, k=1)[0]
        logging.debug("Cycle %d: %s", cycle, action.__name__)
        action()

        # sleep: Exp(λ) capped at 6 s, floor 0.2 s
        sleep_t = min(6.0, random.expovariate(1.0/mean_delay))
        time.sleep(max(0.2, sleep_t))

        # count down epoch time
        epoch_left -= sleep_t
        if epoch_left <= 0:
            funcs, weights, mean_delay, epoch_left = _new_epoch(args.interval)

if __name__ == "__main__":
    main()
