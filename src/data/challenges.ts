import type { CodingChallenge } from '../types';
import { researchAiCodingChallenges, researchDebuggingChallenges } from './research-import';

const debugBases: Omit<CodingChallenge, 'id' | 'title' | 'difficulty'>[] = [
  { category: 'Trees', language: 'cpp', statement: 'Read a level-order binary tree with -1 for an empty node and print its height.', starterCode: `#include <bits/stdc++.h>
using namespace std;

int height(const vector<int>& tree, int index) {
  if (index >= static_cast<int>(tree.size()) || tree[index] == -1) {
    return 0;
  }

  return height(tree, 2 * index + 1) + height(tree, 2 * index + 2) + 1;
}

int main() {
  int n;
  cin >> n;
  vector<int> tree(n);
  for (int& value : tree) {
    cin >> value;
  }
  cout << height(tree, 0) << "\\n";
}` , referenceSolution: `#include <bits/stdc++.h>
using namespace std;

int height(const vector<int>& tree, int index) {
  if (index >= static_cast<int>(tree.size()) || tree[index] == -1) {
    return 0;
  }
  return 1 + max(height(tree, 2 * index + 1), height(tree, 2 * index + 2));
}

int main() {
  int n;
  cin >> n;
  vector<int> tree(n);
  for (int& value : tree) {
    cin >> value;
  }
  cout << height(tree, 0) << "\\n";
}`, publicTests: [{ input: '3\n1 2 -1\n', expected: '2' }], hiddenTests: [{ input: '5\n1 2 -1 3 -1\n', expected: '3' }], bugMetadata: ['logic', 'tree recursion'] },
  { category: 'Graphs', language: 'cpp', statement: 'Print the shortest number of edges between s and t in an undirected graph, or -1 when no path exists.', starterCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
  int n, m, source, target;
  cin >> n >> m >> source >> target;
  vector<vector<int>> graph(n);
  while (m--) {
    int from, to;
    cin >> from >> to;
    graph[from].push_back(to);
    graph[to].push_back(from);
  }

  queue<int> queue;
  vector<int> distance(n);
  queue.push(source);
  while (!queue.empty()) {
    int node = queue.front();
    queue.pop();
    for (int next : graph[node]) {
      distance[next] = distance[node] + 1;
      queue.push(next);
    }
  }
  cout << distance[target] << "\\n";
}`, referenceSolution: `#include <bits/stdc++.h>
using namespace std;

int main() {
  int n, m, source, target;
  cin >> n >> m >> source >> target;
  vector<vector<int>> graph(n);
  while (m--) {
    int from, to;
    cin >> from >> to;
    graph[from].push_back(to);
    graph[to].push_back(from);
  }

  queue<int> queue;
  vector<int> distance(n, -1);
  distance[source] = 0;
  queue.push(source);
  while (!queue.empty()) {
    int node = queue.front();
    queue.pop();
    for (int next : graph[node]) {
      if (distance[next] == -1) {
        distance[next] = distance[node] + 1;
        queue.push(next);
      }
    }
  }
  cout << distance[target] << "\\n";
}`, publicTests: [{ input: '3 2 0 2\n0 1\n1 2\n', expected: '2' }], hiddenTests: [{ input: '3 1 0 2\n0 1\n', expected: '-1' }], bugMetadata: ['visited state', 'BFS'] },
];
export const debuggingChallenges: CodingChallenge[] = [...(Array.from({ length: 20 }, (_, index) => { const base = debugBases[index % debugBases.length]; return { ...base, id: `debug-${String(index + 1).padStart(3, '0')}`, title: `${base.category} debugging drill ${index + 1}`, difficulty: (['easy', 'medium', 'hard', 'medium'][index % 4] as CodingChallenge['difficulty']) }; }) as CodingChallenge[]), ...researchDebuggingChallenges];

const aiTitles = ['Palindrome with normalization', 'Two sum with duplicates', 'Merge sorted arrays in place', 'First non-repeating character', 'LRU cache', 'Merge overlapping intervals', 'Validate a BST', 'Shortest path in a grid', 'Top-k frequent elements', 'Rotate matrix'];
export const aiCodingChallenges: CodingChallenge[] = [...(Array.from({ length: 20 }, (_, index) => { const title = aiTitles[index % aiTitles.length]; return { id: `ai-code-${String(index + 1).padStart(3, '0')}`, title, category: 'AI-assisted coding', language: 'cpp', difficulty: (['easy', 'medium', 'hard', 'medium'][index % 4] as CodingChallenge['difficulty']), statement: `Solve ${title}. First restate inputs, outputs, constraints, and edge cases. Then propose an approach before code. This practice task measures the quality of your collaboration with the provided AI.`, starterCode: '// Explain your approach before implementing.\n#include <bits/stdc++.h>\nusing namespace std;\n', referenceSolution: '// Reference solution available after an attempted submission.', publicTests: [{ input: 'representative sample', expected: 'expected result' }], hiddenTests: [{ input: 'edge case', expected: 'correct handling' }], bugMetadata: ['prompt quality', 'review generated code'] }; }) as CodingChallenge[]), ...researchAiCodingChallenges];
