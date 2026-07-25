# NOTICE

이 저장소는 서로 다른 두 종류의 콘텐츠를 포함하며, 각각 다른 조건이 적용됩니다.

## 1. 소프트웨어 코드 (MIT License)

이 저장소에 포함된 직접 작성 소프트웨어 코드는 [LICENSE](LICENSE) 파일의 MIT License를 따릅니다. 여기에는 다음이 포함됩니다.

- `index.html`
- `assets/` 아래의 JavaScript(`app.js`), CSS(`style.css`)
- `.github/workflows/deploy-pages.yml` (GitHub Actions workflow)
- 이 저장소의 원본 문서(`README.md`, `DATA_SOURCE.md`, 이 `NOTICE.md` 자체)

## 2. 데이터 파일 (MIT License 대상 아님)

`data/` 디렉터리의 JSON 파일(`mri_equipment_2025.json`, `summary.json`, `update_history.json`)은 **MIT License의 적용 대상이 아닙니다.**

- 이 데이터는 **건강보험심사평가원(HIRA)** 이 공개한 의료장비 상세현황 공공데이터를 가공·정제하여 생성한 2차 산출물입니다.
- 이 데이터의 이용은 원출처(건강보험심사평가원 공공데이터)의 이용조건과 출처표시 요구사항을 따라야 합니다.
- 이 저장소는 원본 raw data 또는 가공(processed) 중간 산출물 자체를 재배포하지 않으며, 조회용으로 가공된 최종 JSON만 포함합니다.
- 데이터에는 병원의 상세 도로명 주소나 환자 개인의 진료·건강 정보(patient data)가 포함되어 있지 않습니다.

## 정정 문의

데이터 오류 또는 정정이 필요한 사항은 이 저장소의 **GitHub Issues**를 통해 제보해 주시기 바랍니다. Issue 등록 시 환자정보, 개인정보, 비공개 기관 자료는 절대 포함하지 마시기 바랍니다.
