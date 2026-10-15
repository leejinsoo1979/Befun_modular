# Befun 실사 아바타 이식 자료

다른 PC로 이 폴더 또는 ZIP 전체를 전달하세요. 기존 PC의 절대 경로는 필요하지 않습니다. 원본 프로젝트에서 남성·여성 아바타와 직접 의존하는 파일만 복사했습니다.

## 포함 파일
- `src/components/three/StudioPerson.tsx`: 인물 배치, 수직 빌보드 회전, 정지 이미지와 발 접촉 그림자.
- `src/components/three/StudioPersonMotion.tsx`: packed RGB/alpha 영상, 그림자 셰이더, 자동 재생 실패 시 정지 이미지, GPU/영상 자원 정리.
- `src/components/three/display/`: 남녀 선택 상태, 표시 스케일, 남성 프레임별 발 위치, 기존 선택 UI와 참고 CSS.
- `public/three/reference-studio/person/`: PNG 2장, MP4 2개.
- `APPLY-PROMPT.txt`: 새 프로젝트 담당자에게 전달할 지시문.
- `manifest.json`: 원본 파일 크기와 SHA-256.

## 연결 시 확인
이 자료는 기존 프로젝트의 원본 소스입니다. 대상 프로젝트 구조에 맞춰 연결해야 합니다. React/Three.js, React Three Fiber, Zustand를 사용합니다. 참고 선택 UI에는 react-icons가 포함돼 있습니다. 대상이 다른 렌더러라면 동작을 그 구조에 맞춰 이식하세요.

정적 파일은 웹에서 `/three/reference-studio/person/`로 접근할 수 있게 두거나 소스의 URL을 함께 수정하세요. 기존 원본 AvatarSelector의 `@/lib/commerce/useLocale` 의존은 대상 프로젝트의 번역 함수/라벨로 교체하고, `display.module.css`에서는 선택 UI에 필요한 스타일만 가져오세요. 원본 쇼핑몰 전체나 지역/결제 상태를 옮길 필요는 없습니다.

원본 장면 단위는 cm입니다. m 단위라면 크기/좌표/발 보정/접촉 그림자를 일관되게 변환하고, 부모 그룹의 바닥 높이와 맞추세요. 비디오는 왼쪽 RGB, 오른쪽 회색 알파 마스크를 담은 단일 H.264 MP4입니다. 두 절반을 하나의 VideoTexture에서 샘플링합니다. 경계 texel inset 및 알파 처리와 동일 프레임 그림자 처리를 유지하세요.

기존 바닥/벽의 receiveShadow, 조명과 renderer의 그림자 설정을 확인하세요. demand 프레임 루프에서는 재생 중 프레임 갱신을 연결해야 합니다. 기존 가구/카메라/전체 조명을 임의로 교체하지 마세요.

검증: 남녀 전환, 동영상/정지 이미지, 알파 경계, 발 접지, 회전·확대 시 수직 유지, 벽·바닥 그림자, 모바일 재생, reduced-motion, 자원 해제. 이 패키지는 원본 파일의 전달 자료이며 대상 PC/프로젝트 실행 검증은 포함하지 않습니다.
