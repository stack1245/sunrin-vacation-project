#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

const int N = 8;
int max_queens = 0; // 최대 퀸 개수를 저장할 변수

// 2차원 보드: 0(빈칸), 1(벽), 2(퀸)
vector<vector<int>> board(N, vector<int>(N, 0));

// (r, c) 위치에 퀸을 놓을 수 있는지 확인하는 함수 (방패 룰 적용)
bool is_safe(int r, int c) {
    for (int i = r - 1; i >= 0; i--) {
        if (board[i][c] == 1) break;       
        if (board[i][c] == 2) return false; 
    }
    for (int j = c - 1; j >= 0; j--) {
        if (board[r][j] == 1) break;
        if (board[r][j] == 2) return false;
    }
    for (int i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] == 1) break;
        if (board[i][j] == 2) return false;
    }
    for (int i = r - 1, j = c + 1; i >= 0 && j < N; i--, j++) {
        if (board[i][j] == 1) break;
        if (board[i][j] == 2) return false;
    }
    return true;
}

// 최대 퀸 개수를 찾기 위한 탐색
void find_max_queens(int r, int c, int queens_placed) {
    // 💡 현재까지 놓은 퀸의 수가 기존 최댓값보다 크면 갱신!
    if (queens_placed > max_queens) {
        max_queens = queens_placed;
    }
    
    // 보드의 끝(8번째 행)에 도달하면 탐색 종료
    if (r == N) {
        return;
    }

    // 다음 칸 좌표 계산
    int next_r = (c == N - 1) ? r + 1 : r;
    int next_c = (c == N - 1) ? 0 : c + 1;

    // 경우 1: 현재 칸에 퀸을 놓지 않고 그냥 넘어감
    find_max_queens(next_r, next_c, queens_placed);

    // 경우 2: 현재 칸에 퀸을 놓을 수 있다면 놓고 넘어감
    if (board[r][c] != 1 && is_safe(r, c)) {
        board[r][c] = 2; 
        find_max_queens(next_r, next_c, queens_placed + 1); 
        board[r][c] = 0; 
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int wall_count = 14;
    vector<string> wall_positions = {
        "a3", "a5", "b5", "b7", "c7", "d1", "d3", 
        "e6", "e8", "f2", "g2", "g4", "h4", "h6"
    };

    // 벽 배치
    for (int i = 0; i < wall_count; i++) {
        string pos = wall_positions[i];
        int c = pos[0] - 'a';
        int r = pos[1] - '1';
        if (r >= 0 && r < N && c >= 0 && c < N) {
            board[r][c] = 1;
        }
    }

    // 탐색 시작
    find_max_queens(0, 0, 0);

    cout << max_queens;

    return 0;
}