# 원화 가격 표시

기존 가구 부품표와 가격 계산, 할인·조립·세금 계산, 디자인 저장 데이터는 CHF를 유지합니다. 사용자에게 보여 주는 가구 가격은 원화로 환산합니다. 통화 이름만 변경하지 않습니다.

환율은 [ECB 공식 참조환율](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html)의 **2026-10-14** 값을 고정했습니다. 1 EUR = 0.9330 CHF, 1 EUR = 1,496.54 KRW이므로 **1 CHF = 1,604.0085744908896 KRW**입니다. 각 표시 금액은 최종 단계에서 원 단위로 반올림합니다. 실시간 환율이 아니며 결제용 환율이나 한국 판매 가격을 의미하지 않습니다.

`src/currency.js`가 단일 설정입니다. `prepare-configurator.mjs`가 같은 파일을 `public/pricing/currency.js`로 복사하여 React 상점과 원본 iframe이 동일한 환율을 사용합니다. 환율을 바꿀 때 날짜와 두 ECB 환율을 함께 갱신합니다.

적용 범위: 원본 컨피규레이터 상단·모바일 가격, 주문 검토, 부품별 단가와 합계, PDF의 금액·환율 안내, React 상품 목록·상품 상세·검색·장바구니·주문 내역·배송 안내. JSON 디자인 내역은 원래 CHF 숫자를 보존하고 `displayPrice` / `displayTotal` 등에 KRW 금액과 환율 기준일을 별도 기록합니다.

할인은 원래 CHF 계산이 먼저 적용되며 전체 금액을 환산한 뒤 반올림합니다. 원화로 반올림된 개별 금액을 더한 값과 전체 환산 값 사이에는 1원 정도 차이가 생길 수 있습니다.
