from pathlib import Path

changed = []

for path in sorted(Path("tests").glob("*.test.js")):
    text = path.read_text()
    original = text
    text = text.replace(
        "assert.equal(CURRENT_BACKUP_VERSION, 3);",
        "assert.equal(CURRENT_BACKUP_VERSION, 4);",
    )
    if path.name == "universal-phase-19.test.js":
        text = text.replace("/app-shell-v19/", "/app-shell-v20/")
        text = text.replace(
            "/Phase 19 service-worker cache boundary verified/",
            "/autopilot v20 service-worker cache boundary verified/",
        )
    if text != original:
        path.write_text(text)
        changed.append(str(path))

path = Path("tests/fix-pass-a-audit.test.js")
text = path.read_text()
original = text
anchor = '''  backup.data.templates.push(otherTemplate);
  backup.data.activeSession = {'''
replacement = '''  backup.data.templates.push(otherTemplate);
  backup.data.maintenanceTasksByTemplate[otherTemplate.id] = clone(
    backup.data.maintenanceTasksByTemplate[originalTemplate.id]
  );
  backup.data.activeSession = {'''
if anchor not in text:
    raise SystemExit("false-template-binding fixture anchor missing")
text = text.replace(anchor, replacement, 1)
if text != original:
    path.write_text(text)
    if str(path) not in changed:
        changed.append(str(path))

runtime = Path("scripts/verify-runtime.mjs")
text = runtime.read_text()
original = text
text = text.replace(
    '/app-shell-v19/, "Served service worker must use the Phase 19 cache boundary."',
    '/app-shell-v20/, "Served service worker must use the autopilot v20 cache boundary."',
)
if text == original:
    raise SystemExit("runtime verifier v19 anchor missing")
runtime.write_text(text)
changed.append(str(runtime))

print("Updated Phase 1 test/runtime contracts:")
for item in changed:
    print(f"- {item}")
