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

print("Updated Phase 1 test contracts:")
for item in changed:
    print(f"- {item}")
