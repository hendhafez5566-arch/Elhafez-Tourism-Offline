import pathlib, subprocess, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
files=sorted((ROOT/"scripts").glob("*-browser-smoke.py"))
failed=[]
for f in files:
    print(f"\n===== {f.name} =====", flush=True)
    r=subprocess.run([sys.executable,str(f)],cwd=ROOT)
    if r.returncode: failed.append(f.name)
print(f"\nBrowser smoke summary: {len(files)-len(failed)}/{len(files)} passed")
if failed:
    print("Failed: "+", ".join(failed))
    raise SystemExit(1)
