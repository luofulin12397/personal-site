import json
import os
from pathlib import Path
import subprocess
import sys

import duckdb

if len(sys.argv) != 3:
    raise SystemExit('Usage: python wren-orders.py NEW_LAB_DIR WRENAI_CHECKOUT')
upstream = Path(sys.argv[2]).resolve()
metadata = (upstream / 'examples/v5-jaffle/models/orders/metadata.yml').read_bytes()
root = Path(sys.argv[1]).resolve()
root.mkdir()
env = dict(os.environ, WREN_HOME=str(root / 'wren-home'), NO_COLOR='1')
cli = Path(sys.executable).with_name('wren')
project = root / 'project'
model = project / 'models/orders'
model.mkdir(parents=True)
(project / 'wren_project.yml').write_text('schema_version: 5\nname: orders_lab\ncatalog: wren\nschema: public\ndata_source: duckdb\n')
(model / 'metadata.yml').write_bytes(metadata)
(model / 'ref_sql.sql').write_text('SELECT id, customer_id, amount FROM fixture.public.raw_orders\n')
with duckdb.connect(str(root / 'fixture.duckdb')) as db:
    db.execute('CREATE SCHEMA public; CREATE TABLE public.raw_orders (id INTEGER NOT NULL, customer_id INTEGER, amount DOUBLE); INSERT INTO public.raw_orders VALUES (1, 101, 10), (2, 101, 20), (3, 202, 30)')
conn = json.dumps(dict(datasource='duckdb', url=str(root), format='duckdb'))
sql = 'SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id ORDER BY customer_id'


def run(*args, expected=0):
    result = subprocess.run([cli, *args], env=env, cwd=project, text=True, capture_output=True)
    print(f'\n$ wren {args[0]} [{result.returncode}]')
    print(result.stdout, end='')
    print(result.stderr, end='')
    if result.returncode != expected:
        raise SystemExit(f'Unexpected exit code: expected {expected}, got {result.returncode}')
    return result


run('context', 'build')
manifest = project / 'target/mdl.json'
control = project / 'target/mdl-without-orders.json'
original = json.loads(manifest.read_text())
assert [m['name'] for m in original['models']] == ['orders']
control.write_text(json.dumps(dict(original, models=[])))
plan = run('dry-plan', '--datasource', 'duckdb', '--sql', sql, '--mdl', str(manifest)).stdout
assert 'raw_orders' in plan.lower()
run('dry-run', '--sql', sql, '--mdl', str(manifest), '--connection-info', conn)
query = ('query', '--read-only', '--quiet', '--output', 'json', '--sql', sql, '--connection-info', conn)
baseline = run(*query, '--mdl', str(manifest))
assert [json.loads(line) for line in baseline.stdout.splitlines()] == [
    {'customer_id': 101, 'order_count': 2}, {'customer_id': 202, 'order_count': 1},
]
control_result = run(*query, '--mdl', str(control), expected=1)
assert 'orders' in control_result.stderr.lower(), control_result.stderr
with duckdb.connect(str(root / 'fixture.duckdb'), read_only=True) as db:
    rows = db.execute('SELECT COUNT(*) FROM public.raw_orders').fetchone()[0]
    assert rows == 3
    print(f'\nControl check: public.raw_orders still exists with {rows} rows.')
