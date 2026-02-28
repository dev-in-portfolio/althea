"""Fallback audioop shim for environments where stdlib audioop is removed.

Gradio pulls in pydub which imports audioop. This shim avoids import errors
for apps that do not use audio processing.
"""


def _unsupported(*_args, **_kwargs):
    raise RuntimeError("audioop operations are not supported in this runtime")


add = _unsupported
adpcm2lin = _unsupported
alaw2lin = _unsupported
avg = _unsupported
avgpp = _unsupported
bias = _unsupported
cross = _unsupported
findfactor = _unsupported
findfit = _unsupported
findmax = _unsupported
getsample = _unsupported
lin2adpcm = _unsupported
lin2alaw = _unsupported
lin2lin = _unsupported
lin2ulaw = _unsupported
max = _unsupported
maxpp = _unsupported
minmax = _unsupported
mul = _unsupported
ratecv = _unsupported
reverse = _unsupported
rms = _unsupported
tomono = _unsupported
tostereo = _unsupported
ulaw2lin = _unsupported
