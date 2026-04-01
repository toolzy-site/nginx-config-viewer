# Changelog

## [0.0.7] - 2026-04-01

### Fixed
- **URL fragment parsing error**: URLs containing `#` (e.g. `proxy_pass https://host/path/#/route;`) were incorrectly split at the `#` character, which was treated as a comment. The lexer now only treats `#` as a comment when preceded by whitespace or special characters

---

### 수정
- **URL 내 `#` 파싱 오류**: `proxy_pass https://host/path/#/route;` 처럼 URL에 `#`이 포함된 경우 주석으로 잘못 인식되어 파싱이 실패하던 버그 수정. `#` 앞에 공백이나 특수문자가 있을 때만 주석으로 처리하도록 lexer 개선

## [0.0.6] - 2026-03-24

### Fixed
- **Inline comment parsing error**: Directives with an inline comment before the semicolon (e.g. `proxy_pass 10.10.10.1 #comment ;`) now parse correctly instead of throwing an unexpected token error

---

### 수정
- **인라인 주석 파싱 오류**: `proxy_pass 10.10.10.1 #주석 ;` 처럼 세미콜론 앞에 인라인 주석이 있는 지시어가 오류 없이 정상 파싱

## [0.0.5] - 2026-03-23

### Added
- **Diagram flow animation**: Connection lines in the Diagram view now display a flowing dash animation when hovering over a node or connection. An **Animation** toggle button in the toolbar lets you enable or disable the effect

---

### 추가
- **다이어그램 흐름 애니메이션**: 다이어그램 뷰에서 노드 또는 연결선을 hover 하면 연결선에 흐르는 대시 애니메이션이 표시됩니다. 툴바의 **Animation** 토글 버튼으로 효과를 켜고 끌 수 있습니다

## [0.0.4] - 2026-03-23

### Added
- **Include file tabs**: When a config file contains `include` directives, the editor area shows per-file tabs for browsing included file contents in read-only mode
- **Recursive include resolution**: Nested includes (include inside include) are now resolved recursively; circular references are prevented via a visited-file guard
- **Locations → include file navigation**: Clicking a location or server block from an included file now switches to the corresponding include tab and scrolls to the exact line
- **Diagram: server-level redirect badge**: Server nodes in the diagram now display `↪ <return directive>` when a server-level `return` is configured
- **Diagram detail panel: redirect section**: Clicking a server node with a `return` directive shows the redirect value in the detail panel
- **Summary: "from include" badge**: Virtual host cards sourced from included files are now marked with a `📎 from include` badge and a distinct border

### Fixed
- **Locations "from include" false positive**: Servers inside `http {}` in the main file were incorrectly marked as `fromInclude` due to passing a boolean instead of `sourceFile` when recursing into `http`/`stream` blocks
- **Include path resolution**: Relative paths in included files are now resolved against the nginx prefix directory (the directory of the main `nginx.conf`), matching nginx's own path resolution behavior — fixes cases like `include snippets/ssl-params.conf;` inside a `conf.d/` file

---

### 추가
- **Include 파일 탭**: 설정 파일에 `include` 지시어가 있으면 편집 영역 상단에 파일별 탭이 생성되어 포함된 파일 내용을 읽기 전용으로 확인 가능
- **재귀 include 해석**: include 파일 안의 include(중첩 include)도 재귀적으로 해석. 순환 참조는 방문 파일 추적으로 방지
- **Locations → include 파일 라인 이동**: include 파일에 속한 location 또는 서버 블록 클릭 시 해당 include 탭으로 전환되고 정확한 라인으로 스크롤 및 선택
- **다이어그램: 서버 레벨 redirect 뱃지**: 서버 블록에 `return` 지시어가 있으면 다이어그램 노드에 `↪ <return 값>` 형태로 표시
- **다이어그램 디테일 패널: redirect 섹션**: `return` 지시어가 있는 서버 노드 클릭 시 디테일 패널에 redirect 값 표시
- **Summary: "from include" 뱃지**: include 파일에서 불러온 가상 호스트 카드에 `📎 from include` 뱃지와 구분 테두리 표시

### 수정
- **Locations "from include" 오탐 버그**: 메인 파일의 `http {}` 블록 내 서버가 `fromInclude`로 잘못 표기되던 문제 수정 (`http`/`stream` 블록 재귀 탐색 시 boolean 대신 `sourceFile`을 전달하도록 변경)
- **Include 경로 해석 오류**: include 파일 내 상대 경로가 nginx prefix 디렉터리(main `nginx.conf` 위치) 기준으로 해석되지 않던 문제 수정 — `conf.d/` 파일 안의 `include snippets/ssl-params.conf;` 같은 패턴이 올바르게 동작

## [0.0.3] - 2026-03-23

### Added
- Localization support (Korean, Japanese, Simplified Chinese, Traditional Chinese)

## [0.0.1] - 2026-03-22

### Added
- Initial release
- Formatted view with syntax highlighting, line numbers, and indentation controls
- Tree view with hierarchical block explorer and source line navigation
- Summary view with virtual host cards and directive tooltips
- Locations view with priority analysis and global URL match testing
- Diagram view for server → upstream connection visualization
