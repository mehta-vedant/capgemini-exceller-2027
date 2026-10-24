import json,subprocess,tempfile,pathlib,collections
p=pathlib.Path(__file__).parent
qs=json.loads((p/'questions.json').read_text());ds=json.loads((p/'debugging_challenges.json').read_text())
assert len({q['id'] for q in qs})==len(qs)
assert all(len(q['options'])==4 and q['correct_answer'] in 'ABCD' and q['explanation'] for q in qs)
results=[]
for d in ds:
 with tempfile.TemporaryDirectory() as td:
  path=pathlib.Path(td);(path/'main.cpp').write_text(d['reference_solution']);run=subprocess.run(['g++','-std=c++17','-O2',str(path/'main.cpp'),'-o',str(path/'solution')],capture_output=True,text=True)
  if run.returncode:
   results.append((d['id'],'COMPILE_FAIL',run.stderr[:200]));continue
  for j,t in enumerate(d['public_tests']+d['hidden_tests']):
   ret=subprocess.run([str(path/'solution')],input=t['input'],text=True,capture_output=True,timeout=3)
   ok=ret.returncode==0 and ret.stdout.strip()==t['output'].strip()
   results.append((d['id'],j,ok,ret.stdout.strip(),t['output'].strip()))
for r in results:print(r)
print('TOTAL TESTS',len(results),'PASS',sum(r[2] is True for r in results))
assert all(r[2] is True for r in results)
