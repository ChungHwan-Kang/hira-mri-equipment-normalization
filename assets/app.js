const SUMMARY_URL = "./data/summary.json";
const EQUIPMENT_URL = "./data/mri_equipment_2025.json";
const UPDATE_HISTORY_URL = "./data/update_history.json";
const INITIAL_RECORD_LIMIT = 50;
const DEFAULT_SEARCH_FIELDS = ["병원명", "제조사", "모델명", "테슬라"];
const REGION_COLUMN_CANDIDATES = ["시도명", "시도", "지역", "지역명", "광역시도", "광역시도명", "province", "region"];

const totalEquipmentElement = document.querySelector("#total-equipment");
const institutionTotalElement = document.querySelector("#institution-total");
const highTeslaTotalElement = document.querySelector("#high-tesla-total");
const highTeslaRatioElement = document.querySelector("#high-tesla-ratio");
const manufacturerTotalElement = document.querySelector("#manufacturer-total");
const teslaTotalElement = document.querySelector("#tesla-total");
const regionTotalElement = document.querySelector("#region-total");
const generatedAtElement = document.querySelector("#generated-at");
const manufacturerCountsElement = document.querySelector("#manufacturer-counts");
const teslaCountsElement = document.querySelector("#tesla-counts");
const errorMessageElement = document.querySelector("#error-message");
const metadataGeneratedAtElement = document.querySelector("#metadata-generated-at");
const equipmentSearchElement = document.querySelector("#equipment-search");
const manufacturerFilterElement = document.querySelector("#manufacturer-filter");
const teslaFilterElement = document.querySelector("#tesla-filter");
const sidoFilterElement = document.querySelector("#sido-filter");
const sigunguFilterElement = document.querySelector("#sigungu-filter");
const resetFiltersElement = document.querySelector("#reset-filters");
const clearSearchElement = document.querySelector("#clear-search");
const shareViewElement = document.querySelector("#share-view");
const shareStatusElement = document.querySelector("#share-status");
const manufacturerSummaryChartElement = document.querySelector("#manufacturer-summary-chart");
const teslaDistributionChartElement = document.querySelector("#tesla-distribution-chart");
const regionSummaryChartElement = document.querySelector("#region-summary-chart");
const manufacturerTeslaMatrixElement = document.querySelector("#manufacturer-tesla-matrix");
const regionTeslaMatrixElement = document.querySelector("#region-tesla-matrix");
const equipmentTableBodyElement = document.querySelector("#equipment-table-body");
const matchCountElement = document.querySelector("#match-count");
const showAllResultsElement = document.querySelector("#show-all-results");
const resultCountAnnouncementElement = document.querySelector("#result-count-announcement");
const activeFilterSummaryElement = document.querySelector("#active-filter-summary");
const appliedFilterChipsElement = document.querySelector("#applied-filter-chips");
const dataStatusSummaryElement = document.querySelector("#data-status-summary");
const detailsStatusElement = document.querySelector("#details-status");
const equipmentDetailsElement = document.querySelector("#equipment-details");
const sortHeaderElements = document.querySelectorAll("[data-sort-key]");
const clearFilterButtonElements = document.querySelectorAll("[data-clear-filter]");

const sidoSummaryListElement = document.querySelector("#sido-summary-list");
const sigunguSummaryListElement = document.querySelector("#sigungu-summary-list");
const sigunguSummarySubtitleElement = document.querySelector("#sigungu-summary-subtitle");
const sigunguSummaryTitleElement = document.querySelector("#sigungu-summary-title");

const infoReferenceDateElement = document.querySelector("#info-reference-date");
const infoStatusElement = document.querySelector("#info-status");
const infoPublishedDateElement = document.querySelector("#info-published-date");
const infoSourceElement = document.querySelector("#info-source");
const infoTotalEquipmentElement = document.querySelector("#info-total-equipment");
const historyListElement = document.querySelector("#history-list");
const viewTabElements = document.querySelectorAll('[role="tab"][data-view]');
const equipmentPanelElement = document.querySelector("#equipment-panel");
const statisticsPanelElement = document.querySelector("#statistics-panel");

let equipmentRecords = [];
let activeView = "equipment";
let regionColumnName = "";
let selectedRecordIndex = null;
let isRestoringUrlState = false;
let showAllResults = false;
let sortState = {
  key: "",
  direction: "asc",
};

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatGeneratedAt(value) {
  if (!value) {
    return "생성 시각 정보 없음";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `생성 시각: ${value}`;
  }

  return `생성 시각: ${date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`;
}

function formatMetadataGeneratedAt(value) {
  if (!value) {
    return "데이터 기준일은 제공된 메타데이터를 기준으로 표시됩니다.";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `데이터 생성 메타데이터: ${value}`;
  }

  return `데이터 생성일: ${date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`;
}

function sortedEntries(counts) {
  return Object.entries(counts ?? {}).sort((left, right) => {
    const valueDifference = right[1] - left[1];
    return valueDifference || left[0].localeCompare(right[0], "ko-KR");
  });
}

function renderCounts(container, counts) {
  const entries = sortedEntries(counts);
  container.replaceChildren();

  if (entries.length === 0) {
    const emptyRow = document.createElement("div");
    emptyRow.className = "count-row";
    emptyRow.textContent = "표시할 데이터가 없습니다.";
    container.append(emptyRow);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const [name, count] of entries) {
    const row = document.createElement("div");
    row.className = "count-row";

    const nameElement = document.createElement("span");
    nameElement.className = "count-name";
    nameElement.textContent = name;

    const valueElement = document.createElement("span");
    valueElement.className = "count-value";
    valueElement.textContent = formatNumber(count);

    row.append(nameElement, valueElement);
    fragment.append(row);
  }

  container.append(fragment);
}

function renderSummary(summary) {
  totalEquipmentElement.textContent = `${formatNumber(summary.total_equipment ?? 0)}대`;
  generatedAtElement.textContent = formatGeneratedAt(summary.generated_at);
  metadataGeneratedAtElement.textContent = formatMetadataGeneratedAt(summary.generated_at);
  renderCounts(manufacturerCountsElement, summary.manufacturer_counts);
  renderCounts(teslaCountsElement, summary.tesla_counts);
}

function countDistinctValues(records, fieldName) {
  if (!fieldName) {
    return 0;
  }

  return new Set(
    records
      .map((record) => record[fieldName])
      .filter((value) => !isEmptyValue(value)),
  ).size;
}

function renderSummaryCards(records) {
  const eqCount = getTotalEquipmentCount(records);
  totalEquipmentElement.textContent = `${formatNumber(eqCount)}대`;
  manufacturerTotalElement.textContent = `${formatNumber(countDistinctValues(records, "제조사"))}종`;
  teslaTotalElement.textContent = `${formatNumber(countDistinctValues(records, "테슬라"))}종`;
  regionTotalElement.textContent = `${formatNumber(countDistinctValues(records, regionColumnName))}개`;
}

function renderStatistics(records) {
  const totalEquipment = getTotalEquipmentCount(records);
  const highTeslaEquipment = getTotalEquipmentCount(
    records.filter((record) => record["테슬라"] === "3.0T+"),
  );
  const highTeslaRatio = totalEquipment > 0 ? (highTeslaEquipment / totalEquipment) * 100 : 0;

  totalEquipmentElement.textContent = formatNumber(totalEquipment);
  institutionTotalElement.textContent = formatNumber(countDistinctValues(records, "병원명"));
  highTeslaTotalElement.textContent = `${formatNumber(highTeslaEquipment)}대`;
  highTeslaRatioElement.textContent = `전체의 ${highTeslaRatio.toFixed(1)}%`;
  regionTotalElement.textContent = formatNumber(countDistinctValues(records, regionColumnName));
  renderManufacturerSummary(records);
  renderTeslaDistribution(records);
  renderRegionSummary(records);
  renderManufacturerTeslaMatrix(records);
  renderSidoSummary(buildSidoSummary(records));
}

function normalizeView(value) {
  return value === "statistics" ? "statistics" : "equipment";
}

function setActiveView(view, { updateUrl = true, focusTab = false } = {}) {
  activeView = normalizeView(view);
  const isEquipmentView = activeView === "equipment";

  equipmentPanelElement.hidden = !isEquipmentView;
  statisticsPanelElement.hidden = isEquipmentView;
  document.body.dataset.view = activeView;

  for (const tab of viewTabElements) {
    const isActive = tab.dataset.view === activeView;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    if (isActive && focusTab) {
      tab.focus();
    }
  }

  if (updateUrl) {
    const params = new URLSearchParams(window.location.search);
    params.set("view", activeView);
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.pushState({}, "", nextUrl);
    }
  }
}

function normalizeSearchText(value) {
  return String(value ?? "").trim().toLocaleLowerCase("ko-KR");
}

function recordMatchesSearch(record, query) {
  if (!query) {
    return true;
  }

  const searchFields = regionColumnName ? [...DEFAULT_SEARCH_FIELDS, regionColumnName] : DEFAULT_SEARCH_FIELDS;

  return searchFields.some((fieldName) => normalizeSearchText(record[fieldName]).includes(query));
}

function recordMatchesManufacturer(record, manufacturer) {
  if (!manufacturer) {
    return true;
  }

  return record["제조사"] === manufacturer;
}

function recordMatchesTesla(record, tesla) {
  if (!tesla) {
    return true;
  }

  return record["테슬라"] === tesla;
}

function recordMatchesSido(record, sido) {
  if (!sido) {
    return true;
  }
  return record["시도명"] === sido;
}

function recordMatchesSigungu(record, sigungu) {
  if (!sigungu) {
    return true;
  }
  return record["시군구명"] === sigungu;
}

function getSortFieldName(sortKey) {
  const sortFields = {
    hospital: "병원명",
    manufacturer: "제조사",
    model: "모델명",
    tesla: "테슬라",
    region: regionColumnName,
  };

  return sortFields[sortKey] ?? "";
}

function compareRecords(leftRecord, rightRecord, fieldName) {
  const leftValue = formatDetailValue(leftRecord[fieldName]);
  const rightValue = formatDetailValue(rightRecord[fieldName]);

  return leftValue.localeCompare(rightValue, "ko-KR", {
    numeric: true,
    sensitivity: "base",
  });
}

function sortRecords(records) {
  const fieldName = getSortFieldName(sortState.key);
  if (!fieldName) {
    return records;
  }

  const directionMultiplier = sortState.direction === "desc" ? -1 : 1;
  return [...records].sort((leftRecord, rightRecord) => (
    compareRecords(leftRecord, rightRecord, fieldName) * directionMultiplier
  ));
}

function getVisibleRecords(query, manufacturer, tesla, sido, sigungu) {
  const normalizedQuery = normalizeSearchText(query);
  const matches = equipmentRecords.filter(
    (record) => (
      recordMatchesSearch(record, normalizedQuery)
      && recordMatchesManufacturer(record, manufacturer)
      && recordMatchesTesla(record, tesla)
      && recordMatchesSido(record, sido)
      && recordMatchesSigungu(record, sigungu)
    ),
  );
  const sortedMatches = sortRecords(matches);
  const hasActiveFilter = normalizedQuery || manufacturer || tesla || sido || sigungu;
  const visibleRecords = hasActiveFilter || showAllResults
    ? sortedMatches
    : sortedMatches.slice(0, INITIAL_RECORD_LIMIT);

  return { matches: sortedMatches, visibleRecords };
}

function validateEquipmentCount(value) {
  const num = Number(value);
  if (Number.isInteger(num) && num > 0) {
    return num;
  }
  throw new Error("장비수는 유한한 양의 정수여야 합니다.");
}

function getRecordCount(records) {
  return Array.isArray(records) ? records.length : 0;
}

function getTotalEquipmentCount(records) {
  if (!Array.isArray(records)) {
    return 0;
  }
  let sum = 0;
  for (const r of records) {
    const val = validateEquipmentCount(r["장비수"]);
    sum += val;
  }
  return sum;
}

function isEmptyValue(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function formatDetailValue(value) {
  return isEmptyValue(value) ? "-" : String(value);
}

function formatFieldName(fieldName) {
  return String(fieldName ?? "").replaceAll("_", " ");
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = formatDetailValue(value);
  return cell;
}

function createViewButton(recordIndex) {
  const button = document.createElement("button");
  button.className = "view-button";
  button.type = "button";
  button.dataset.recordIndex = String(recordIndex);
  button.textContent = "View";
  return button;
}

function renderEquipmentTable(records) {
  equipmentTableBodyElement.replaceChildren();

  if (records.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.className = "empty-cell";
    cell.textContent = "조건에 맞는 MRI 장비가 없습니다. 검색어 또는 필터를 조정해 주세요.";
    row.append(cell);
    equipmentTableBodyElement.append(row);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const record of records) {
    const recordIndex = equipmentRecords.indexOf(record);
    const row = document.createElement("tr");
    row.dataset.recordIndex = String(recordIndex);
    if (recordIndex === selectedRecordIndex) {
      row.classList.add("selected-row");
    }

    const actionCell = document.createElement("td");
    actionCell.append(createViewButton(recordIndex));

    row.append(
      createCell(record["병원명"]),
      createCell(regionColumnName ? record[regionColumnName] : ""),
      createCell(record["제조사"]),
      createCell(record["모델명"]),
      createCell(record["테슬라"]),
      createCell(formatNumber(record["장비수"] ?? 0)),
      actionCell,
    );
    fragment.append(row);
  }

  equipmentTableBodyElement.append(fragment);
}

function renderEquipmentDetails(record) {
  equipmentDetailsElement.replaceChildren();

  if (!record) {
    detailsStatusElement.textContent = "상세 정보를 보려면 장비를 선택하세요.";
    return;
  }

  detailsStatusElement.textContent = record["병원명"]
    ? `${record["병원명"]} 상세 정보`
    : "선택한 장비 상세 정보";

  const fragment = document.createDocumentFragment();
  for (const [fieldName, value] of Object.entries(record)) {
    const term = document.createElement("dt");
    term.textContent = formatFieldName(fieldName);

    const description = document.createElement("dd");
    description.textContent = formatDetailValue(value);

    fragment.append(term, description);
  }

  equipmentDetailsElement.append(fragment);
}

function selectRecord(recordIndex) {
  selectedRecordIndex = recordIndex;
  renderEquipmentDetails(equipmentRecords[recordIndex]);
  renderEquipmentSearch();
}

function renderMatchCount(matches, visibleTotal, hasActiveFilter) {
  const matchTotal = getRecordCount(matches);
  const eqCount = getTotalEquipmentCount(matches);

  if (hasActiveFilter) {
    matchCountElement.textContent = `${formatNumber(matchTotal)}건 검색됨 (장비 ${formatNumber(eqCount)}대)`;
    resultCountAnnouncementElement.textContent = `필터 적용 결과 ${formatNumber(matchTotal)}건, 장비 ${formatNumber(eqCount)}대`;
    return;
  }

  if (visibleTotal === matchTotal) {
    matchCountElement.textContent = `전체 ${formatNumber(matchTotal)}건 표시 (장비 ${formatNumber(eqCount)}대)`;
    resultCountAnnouncementElement.textContent = `검색 결과 ${formatNumber(matchTotal)}건, 장비 ${formatNumber(eqCount)}대`;
    return;
  }

  matchCountElement.textContent = `전체 ${formatNumber(matchTotal)}건 중 ${formatNumber(visibleTotal)}건 표시 (장비 ${formatNumber(eqCount)}대)`;
  resultCountAnnouncementElement.textContent = `검색 결과 ${formatNumber(matchTotal)}건, 장비 ${formatNumber(eqCount)}대`;
}

function updateSearchInputTitle(matchTotal, hasSearchQuery, hasFilterSelection) {
  const titlePrefix = hasSearchQuery
    ? "검색 결과"
    : hasFilterSelection ? "필터 적용 결과" : "전체 결과";
  equipmentSearchElement.title = `${titlePrefix} ${formatNumber(matchTotal)}건`;
}

function renderActiveFilterSummary(query, manufacturer, tesla, sido, sigungu) {
  const activeFilters = [];
  const normalizedQuery = String(query ?? "").trim();

  if (normalizedQuery) {
    activeFilters.push(`검색어 "${normalizedQuery}"`);
  }
  if (manufacturer) {
    activeFilters.push(`제조사 ${manufacturer}`);
  }
  if (tesla) {
    activeFilters.push(`Tesla ${tesla}`);
  }
  if (sido) {
    activeFilters.push(`시도 ${sido}`);
  }
  if (sigungu) {
    activeFilters.push(`시군구 ${sigungu}`);
  }

  activeFilterSummaryElement.textContent = activeFilters.length > 0
    ? `적용 중: ${activeFilters.join(" · ")}`
    : "전체 데이터 표시 중";
}

function getAppliedFilters(query, manufacturer, tesla, sido, sigungu) {
  const filters = [];
  const normalizedQuery = String(query ?? "").trim();

  if (normalizedQuery) {
    filters.push({ key: "query", label: "검색", value: normalizedQuery });
  }
  if (manufacturer) {
    filters.push({ key: "manufacturer", label: "제조사", value: manufacturer });
  }
  if (tesla) {
    filters.push({ key: "tesla", label: "Tesla", value: tesla });
  }
  if (sido) {
    filters.push({ key: "sido", label: "시도", value: sido });
  }
  if (sigungu) {
    filters.push({ key: "sigungu", label: "시군구", value: sigungu });
  }

  return filters;
}

function renderAppliedFilterChips(query, manufacturer, tesla, sido, sigungu) {
  const filters = getAppliedFilters(query, manufacturer, tesla, sido, sigungu);
  appliedFilterChipsElement.replaceChildren();

  if (filters.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const filter of filters) {
    const chip = document.createElement("button");
    chip.className = "filter-chip";
    chip.type = "button";
    chip.dataset.filterKey = filter.key;
    chip.setAttribute("aria-label", `${filter.label}: ${filter.value} 필터 제거`);
    chip.textContent = `${filter.label}: ${filter.value} ×`;
    fragment.append(chip);
  }

  appliedFilterChipsElement.append(fragment);
}

function renderDataStatusSummary(filteredRecords, overallRecords, hasActiveFilter) {
  const filteredRecordCount = getRecordCount(filteredRecords);
  const filteredEquipmentCount = getTotalEquipmentCount(filteredRecords);
  const overallRecordCount = getRecordCount(overallRecords);
  const overallEquipmentCount = getTotalEquipmentCount(overallRecords);

  dataStatusSummaryElement.textContent = hasActiveFilter
    ? `현재 필터 결과 ${formatNumber(filteredRecordCount)}건 · ${formatNumber(filteredEquipmentCount)}대 / 전체 ${formatNumber(overallRecordCount)}건 · ${formatNumber(overallEquipmentCount)}대`
    : `전체 데이터 ${formatNumber(overallRecordCount)}건 · ${formatNumber(overallEquipmentCount)}대`;
}

function updateFilterUrl(query, manufacturer, tesla, sido, sigungu) {
  if (isRestoringUrlState) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const normalizedQuery = String(query ?? "").trim();
  for (const key of ["q", "manufacturer", "tesla", "sido", "sigungu"]) {
    params.delete(key);
  }
  params.set("view", activeView);

  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  }
  if (manufacturer) {
    params.set("manufacturer", manufacturer);
  }
  if (tesla) {
    params.set("tesla", tesla);
  }
  if (sido) {
    params.set("sido", sido);
  }
  if (sigungu) {
    params.set("sigungu", sigungu);
  }

  const queryString = params.toString();
  const nextUrl = queryString
    ? `${window.location.pathname}?${queryString}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.pushState({}, "", nextUrl);
  }
}

function getEquipmentCount(record) {
  return validateEquipmentCount(record["장비수"]);
}

function getEquipmentCountsByField(records, fieldName) {
  const counts = {};

  for (const record of records) {
    const groupName = formatDetailValue(record[fieldName]);
    counts[groupName] = (counts[groupName] ?? 0) + getEquipmentCount(record);
  }

  return counts;
}

function renderBarSummary(container, counts, emptyMessageText, maxEntries = null, filterKey = "") {
  const entries = sortedEntries(counts).slice(0, maxEntries ?? undefined);
  const maxCount = entries[0]?.[1] ?? 0;
  container.replaceChildren();

  if (entries.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "distribution-summary-empty";
    emptyMessage.textContent = emptyMessageText;
    container.append(emptyMessage);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const [name, count] of entries) {
    const row = document.createElement("div");
    row.className = "distribution-bar-row";
    if (filterKey) {
      row.classList.add("is-actionable");
      row.dataset.filterKey = filterKey;
      row.dataset.filterValue = name;
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `${name} ${formatNumber(count)}대 장비현황 보기`);
    }

    const nameElement = document.createElement("span");
    nameElement.className = "distribution-bar-name";
    nameElement.textContent = name;

    const barTrack = document.createElement("span");
    barTrack.className = "distribution-bar-track";

    const barFill = document.createElement("span");
    barFill.className = "distribution-bar-fill";
    barFill.style.width = `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`;
    barTrack.append(barFill);

    const valueElement = document.createElement("span");
    valueElement.className = "distribution-bar-value";
    valueElement.textContent = formatNumber(count);

    row.append(nameElement, barTrack, valueElement);
    fragment.append(row);
  }

  container.append(fragment);
}

function renderManufacturerSummary(records) {
  renderBarSummary(
    manufacturerSummaryChartElement,
    getEquipmentCountsByField(records, "제조사"),
    "표시할 제조사 데이터가 없습니다.",
    null,
    "manufacturer",
  );
}

function renderTeslaDistribution(records) {
  renderBarSummary(
    teslaDistributionChartElement,
    getEquipmentCountsByField(records, "테슬라"),
    "표시할 Tesla 데이터가 없습니다.",
    null,
    "tesla",
  );
}

function renderRegionSummary(records) {
  renderBarSummary(
    regionSummaryChartElement,
    regionColumnName ? getEquipmentCountsByField(records, regionColumnName) : {},
    "표시할 지역 데이터가 없습니다.",
    10,
    "sido",
  );
}

function renderTeslaMatrix(container, records, rowFieldName, rowHeaderLabel, emptyMessageText, maxRows = 10) {
  container.replaceChildren();

  if (records.length === 0 || !rowFieldName) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "matrix-empty";
    emptyMessage.textContent = emptyMessageText;
    container.append(emptyMessage);
    return;
  }

  const topRowNames = sortedEntries(getEquipmentCountsByField(records, rowFieldName))
    .slice(0, maxRows)
    .map(([rowName]) => rowName);
  const teslaCategories = sortedEntries(getEquipmentCountsByField(records, "테슬라"))
    .map(([tesla]) => tesla);

  if (topRowNames.length === 0 || teslaCategories.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "matrix-empty";
    emptyMessage.textContent = emptyMessageText;
    container.append(emptyMessage);
    return;
  }

  const matrix = {};
  for (const rowName of topRowNames) {
    matrix[rowName] = {};
  }

  for (const record of records) {
    const rowName = formatDetailValue(record[rowFieldName]);
    if (!matrix[rowName]) {
      continue;
    }

    const tesla = formatDetailValue(record["테슬라"]);
    matrix[rowName][tesla] = (matrix[rowName][tesla] ?? 0) + getEquipmentCount(record);
  }

  const table = document.createElement("table");
  table.className = "matrix-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const rowHeader = document.createElement("th");
  rowHeader.scope = "col";
  rowHeader.textContent = rowHeaderLabel;
  headerRow.append(rowHeader);

  for (const tesla of teslaCategories) {
    const header = document.createElement("th");
    header.scope = "col";
    header.textContent = tesla;
    headerRow.append(header);
  }

  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  for (const rowName of topRowNames) {
    const row = document.createElement("tr");
    const rowHeader = document.createElement("th");
    rowHeader.scope = "row";
    rowHeader.textContent = rowName;
    row.append(rowHeader);

    for (const tesla of teslaCategories) {
      const cell = document.createElement("td");
      cell.textContent = formatNumber(matrix[rowName][tesla] ?? 0);
      row.append(cell);
    }

    tbody.append(row);
  }

  table.append(tbody);
  container.append(table);
}

function renderManufacturerTeslaMatrix(records) {
  renderTeslaMatrix(
    manufacturerTeslaMatrixElement,
    records,
    "제조사",
    "제조사",
    "표시할 제조사 × Tesla 데이터가 없습니다.",
  );
}

function renderRegionTeslaMatrix(records) {
  renderTeslaMatrix(
    regionTeslaMatrixElement,
    records,
    regionColumnName,
    "지역",
    "표시할 지역 × Tesla 데이터가 없습니다.",
  );
}

function renderEquipmentSearch() {
  const query = equipmentSearchElement.value;
  const manufacturer = manufacturerFilterElement.value;
  const tesla = teslaFilterElement.value;
  const sido = sidoFilterElement.value;
  const sigungu = sigunguFilterElement.value;
  const hasSearchQuery = normalizeSearchText(query).length > 0;
  const hasFilterSelection = manufacturer.length > 0 || tesla.length > 0 || sido.length > 0 || sigungu.length > 0;
  const hasActiveFilter = hasSearchQuery || hasFilterSelection;
  const { matches, visibleRecords } = getVisibleRecords(query, manufacturer, tesla, sido, sigungu);

  renderEquipmentTable(visibleRecords);
  renderMatchCount(matches, visibleRecords.length, hasActiveFilter);
  showAllResultsElement.hidden = hasActiveFilter
    || showAllResults
    || matches.length <= INITIAL_RECORD_LIMIT;
  showAllResultsElement.textContent = `전체 ${formatNumber(matches.length)}건 보기`;
  updateSearchInputTitle(matches.length, hasSearchQuery, hasFilterSelection);
  renderActiveFilterSummary(query, manufacturer, tesla, sido, sigungu);
  renderAppliedFilterChips(query, manufacturer, tesla, sido, sigungu);
  renderDataStatusSummary(matches, equipmentRecords, hasActiveFilter);
  updateFilterUrl(query, manufacturer, tesla, sido, sigungu);
  clearShareStatus();
  clearSearchElement.disabled = normalizeSearchText(query).length === 0;
  updateClearFilterButtons();
  updateSortIndicators();
}

function clearShareStatus() {
  shareStatusElement.textContent = "";
}

async function shareCurrentView() {
  const currentUrl = window.location.href;

  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error("Clipboard API is unavailable.");
    }

    await navigator.clipboard.writeText(currentUrl);
    shareStatusElement.textContent = "현재 화면 링크를 복사했습니다.";
  } catch {
    shareStatusElement.textContent = `복사할 수 없습니다. 주소창의 URL을 직접 복사해 주세요: ${currentUrl}`;
  }
}

function clearSearchQuery() {
  equipmentSearchElement.value = "";
  equipmentSearchElement.focus();
  renderEquipmentSearch();
}

function resetFilters() {
  equipmentSearchElement.value = "";
  manufacturerFilterElement.value = "";
  teslaFilterElement.value = "";
  sidoFilterElement.value = "";
  populateSigunguFilter(equipmentRecords, "");
  showAllResults = false;
  renderEquipmentSearch();
}

function showAllEquipmentResults() {
  showAllResults = true;
  renderEquipmentSearch();
}

function clearFilter(filterKey) {
  if (filterKey === "sido") {
    sidoFilterElement.value = "";
    populateSigunguFilter(equipmentRecords, "");
  } else if (filterKey === "sigungu") {
    sigunguFilterElement.value = "";
  } else {
    const filterElements = {
      query: equipmentSearchElement,
      manufacturer: manufacturerFilterElement,
      tesla: teslaFilterElement,
    };
    const filterElement = filterElements[filterKey];
    if (filterElement) {
      filterElement.value = "";
    }
  }
  renderEquipmentSearch();
}

function updateClearFilterButtons() {
  const filterValues = {
    manufacturer: manufacturerFilterElement.value,
    tesla: teslaFilterElement.value,
    sido: sidoFilterElement.value,
    sigungu: sigunguFilterElement.value,
  };

  for (const button of clearFilterButtonElements) {
    const filterKey = button.dataset.clearFilter ?? "";
    button.disabled = !filterValues[filterKey];
  }
}

function updateSortIndicators() {
  for (const headerElement of sortHeaderElements) {
    const indicatorElement = headerElement.querySelector(".sort-indicator");
    const sortKey = headerElement.dataset.sortKey;
    const isActiveSort = sortState.key === sortKey;

    headerElement.setAttribute(
      "aria-sort",
      isActiveSort && sortState.direction === "desc" ? "descending" : isActiveSort ? "ascending" : "none",
    );

    if (indicatorElement) {
      indicatorElement.textContent = isActiveSort && sortState.direction === "desc" ? "↓" : isActiveSort ? "↑" : "";
    }
  }
}

function handleSortClick(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const headerElement = event.target.closest("[data-sort-key]");
  if (!headerElement) {
    return;
  }

  const sortKey = headerElement.dataset.sortKey ?? "";
  if (!getSortFieldName(sortKey)) {
    return;
  }

  sortState = {
    key: sortKey,
    direction: sortState.key === sortKey && sortState.direction === "asc" ? "desc" : "asc",
  };
  renderEquipmentSearch();
}

function detectRegionColumn(records) {
  const sampleRecord = records.find((record) => record && typeof record === "object") ?? {};
  const columns = Object.keys(sampleRecord);
  return REGION_COLUMN_CANDIDATES.find((candidate) => columns.includes(candidate)) ?? "";
}

function buildOptions(selectElement, records, fieldName, allLabel) {
  const currentValue = selectElement.value;
  const values = fieldName
    ? [...new Set(records.map((record) => record[fieldName]).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, "ko-KR"))
    : [];
  const fragment = document.createDocumentFragment();

  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    fragment.append(option);
  }

  selectElement.replaceChildren(new Option(allLabel, ""), fragment);
  selectElement.value = values.includes(currentValue) ? currentValue : "";
}

function getUniqueSidoOptions(records) {
  const sidos = new Set();
  for (const r of records) {
    if (r["시도명"]) {
      sidos.add(String(r["시도명"]).trim());
    }
  }
  return Array.from(sidos).sort((left, right) => left.localeCompare(right, "ko-KR"));
}

function getSigunguOptionsForSido(records, sido) {
  if (!sido) {
    return [];
  }
  const sigungus = new Set();
  for (const r of records) {
    if (r["시도명"] === sido && r["시군구명"]) {
      sigungus.add(String(r["시군구명"]).trim());
    }
  }
  return Array.from(sigungus).sort((left, right) => left.localeCompare(right, "ko-KR"));
}

function populateSidoFilter(records) {
  const sidos = getUniqueSidoOptions(records);
  const fragment = document.createDocumentFragment();
  for (const sido of sidos) {
    const opt = document.createElement("option");
    opt.value = sido;
    opt.textContent = sido;
    fragment.append(opt);
  }
  sidoFilterElement.replaceChildren(new Option("전체 시도", ""), fragment);
}

function populateSigunguFilter(records, sido) {
  const sigungus = getSigunguOptionsForSido(records, sido);
  const fragment = document.createDocumentFragment();
  for (const sigungu of sigungus) {
    const opt = document.createElement("option");
    opt.value = sigungu;
    opt.textContent = sigungu;
    fragment.append(opt);
  }
  sigunguFilterElement.replaceChildren(new Option("전체 시군구", ""), fragment);
  if (sido) {
    sigunguFilterElement.disabled = false;
  } else {
    sigunguFilterElement.value = "";
    sigunguFilterElement.disabled = true;
  }
}

function buildFilters(records) {
  buildOptions(manufacturerFilterElement, records, "제조사", "All manufacturers");
  buildOptions(teslaFilterElement, records, "테슬라", "All Tesla");
  populateSidoFilter(records);
  populateSigunguFilter(records, "");
}

function buildSidoSummary(records) {
  const bySido = new Map();

  for (const record of records) {
    const sido = record["시도명"];
    if (isEmptyValue(sido)) {
      continue;
    }

    if (!bySido.has(sido)) {
      bySido.set(sido, { sido, recordCount: 0, equipmentCount: 0, sigungus: new Set() });
    }

    const entry = bySido.get(sido);
    entry.recordCount += 1;
    entry.equipmentCount += validateEquipmentCount(record["장비수"]);
    if (!isEmptyValue(record["시군구명"])) {
      entry.sigungus.add(String(record["시군구명"]).trim());
    }
  }

  return Array.from(bySido.values())
    .map((entry) => ({
      sido: entry.sido,
      recordCount: entry.recordCount,
      equipmentCount: entry.equipmentCount,
      sigunguCount: entry.sigungus.size,
    }))
    .sort((left, right) => (
      right.equipmentCount - left.equipmentCount
      || left.sido.localeCompare(right.sido, "ko-KR")
    ));
}

function createSidoSummaryButton(entry, selectedSido) {
  const isSelected = entry.sido === selectedSido;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sido-summary-item";
  button.dataset.sido = entry.sido;
  if (isSelected) {
    button.classList.add("is-selected");
    button.setAttribute("aria-current", "true");
  }

  const nameRow = document.createElement("span");
  nameRow.className = "sido-summary-name";

  const nameText = document.createElement("span");
  nameText.className = "sido-summary-name-text";
  nameText.textContent = entry.sido;
  nameRow.append(nameText);

  if (isSelected) {
    const selectedTag = document.createElement("span");
    selectedTag.className = "sido-summary-selected-tag";
    selectedTag.textContent = "선택됨";
    nameRow.append(selectedTag);
  }

  const statsRow = document.createElement("span");
  statsRow.className = "sido-summary-stats";
  statsRow.textContent = `MRI 장비 ${formatNumber(entry.equipmentCount)}대 · ${formatNumber(entry.recordCount)}건 · ${formatNumber(entry.sigunguCount)}개 시군구`;

  button.append(nameRow, statsRow);
  button.setAttribute(
    "aria-label",
    `${entry.sido}, MRI 장비 ${formatNumber(entry.equipmentCount)}대, ${formatNumber(entry.recordCount)}건, ${formatNumber(entry.sigunguCount)}개 시군구${isSelected ? ", 현재 선택됨" : ""}`,
  );

  return button;
}

function renderSidoSummary(summary) {
  const selectedSido = sidoFilterElement.value;
  sidoSummaryListElement.replaceChildren();

  if (summary.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "sido-summary-empty";
    emptyMessage.textContent = "표시할 시도 데이터가 없습니다.";
    sidoSummaryListElement.append(emptyMessage);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const entry of summary) {
    fragment.append(createSidoSummaryButton(entry, selectedSido));
  }
  sidoSummaryListElement.append(fragment);
}

function activateSidoFilter(sido) {
  sidoFilterElement.value = sido;
  populateSigunguFilter(equipmentRecords, sido);
  renderEquipmentSearch();
  setActiveView("equipment");
  equipmentSearchElement.closest(".search-panel")?.scrollIntoView({ block: "start" });
  sidoFilterElement.focus();
}

function buildSigunguSummary(records, sido) {
  if (!sido) {
    return [];
  }

  const bySigungu = new Map();

  for (const record of records) {
    if (record["시도명"] !== sido || isEmptyValue(record["시군구명"])) {
      continue;
    }

    const sigungu = String(record["시군구명"]).trim();
    if (!bySigungu.has(sigungu)) {
      bySigungu.set(sigungu, { sigungu, recordCount: 0, equipmentCount: 0 });
    }

    const entry = bySigungu.get(sigungu);
    entry.recordCount += 1;
    entry.equipmentCount += validateEquipmentCount(record["장비수"]);
  }

  return Array.from(bySigungu.values()).sort((left, right) => (
    right.equipmentCount - left.equipmentCount
    || left.sigungu.localeCompare(right.sigungu, "ko-KR")
  ));
}

function createSigunguSummaryButton(entry, sido, selectedSigungu) {
  const isSelected = entry.sigungu === selectedSigungu;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sigungu-summary-item";
  button.dataset.sido = sido;
  button.dataset.sigungu = entry.sigungu;
  if (isSelected) {
    button.classList.add("is-selected");
    button.setAttribute("aria-current", "true");
  }

  const nameRow = document.createElement("span");
  nameRow.className = "sigungu-summary-name";

  const nameText = document.createElement("span");
  nameText.className = "sigungu-summary-name-text";
  nameText.textContent = entry.sigungu;
  nameRow.append(nameText);

  if (isSelected) {
    const selectedTag = document.createElement("span");
    selectedTag.className = "sigungu-summary-selected-tag";
    selectedTag.textContent = "선택됨";
    nameRow.append(selectedTag);
  }

  const statsRow = document.createElement("span");
  statsRow.className = "sigungu-summary-stats";
  statsRow.textContent = `MRI 장비 ${formatNumber(entry.equipmentCount)}대 · ${formatNumber(entry.recordCount)}건`;

  button.append(nameRow, statsRow);
  button.setAttribute(
    "aria-label",
    `${entry.sigungu}, MRI 장비 ${formatNumber(entry.equipmentCount)}대, ${formatNumber(entry.recordCount)}건${isSelected ? ", 현재 선택됨" : ""}`,
  );

  return button;
}

function renderSigunguSummary(summary, sido) {
  const selectedSigungu = sigunguFilterElement.value;
  sigunguSummaryListElement.replaceChildren();

  if (!sido) {
    sigunguSummaryTitleElement.textContent = "시군구별 MRI 장비 현황";
    sigunguSummarySubtitleElement.textContent = "시도를 선택하면 시군구별 현황을 확인할 수 있습니다.";
    return;
  }

  sigunguSummaryTitleElement.textContent = `${sido} 시군구별 MRI 장비 현황`;
  sigunguSummarySubtitleElement.textContent = `${sido} 전체 데이터 기준 · 항목을 선택하면 시군구 필터에 반영됩니다.`;

  if (summary.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "sigungu-summary-empty";
    emptyMessage.textContent = "표시할 시군구 데이터가 없습니다.";
    sigunguSummaryListElement.append(emptyMessage);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const entry of summary) {
    fragment.append(createSigunguSummaryButton(entry, sido, selectedSigungu));
  }
  sigunguSummaryListElement.append(fragment);
}

function syncSigunguSummarySelection() {
  renderSigunguSummary(buildSigunguSummary(equipmentRecords, sidoFilterElement.value), sidoFilterElement.value);
}

function activateSigunguFilter(sido, sigungu) {
  sidoFilterElement.value = sido;
  populateSigunguFilter(equipmentRecords, sido);
  sigunguFilterElement.value = sigungu;
  renderEquipmentSearch();
  equipmentSearchElement.closest(".search-panel")?.scrollIntoView({ block: "start" });
  sigunguFilterElement.focus();
}

function restoreFilterStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const manufacturer = params.get("manufacturer") ?? "";
  const tesla = params.get("tesla") ?? "";
  const sido = params.get("sido") ?? "";
  const sigungu = params.get("sigungu") ?? "";

  equipmentSearchElement.value = params.get("q") ?? "";
  manufacturerFilterElement.value = manufacturer;
  teslaFilterElement.value = tesla;

  if (sido && [...sidoFilterElement.options].some(opt => opt.value === sido)) {
    sidoFilterElement.value = sido;
    populateSigunguFilter(equipmentRecords, sido);
    if (sigungu && [...sigunguFilterElement.options].some(opt => opt.value === sigungu)) {
      sigunguFilterElement.value = sigungu;
    } else {
      sigunguFilterElement.value = "";
    }
  } else {
    sidoFilterElement.value = "";
    populateSigunguFilter(equipmentRecords, "");
  }
}

function activateStatisticsFilter(filterKey, filterValue) {
  resetFilters();
  if (filterKey === "manufacturer") {
    manufacturerFilterElement.value = filterValue;
  } else if (filterKey === "tesla") {
    teslaFilterElement.value = filterValue;
  } else if (filterKey === "sido") {
    sidoFilterElement.value = filterValue;
    populateSigunguFilter(equipmentRecords, filterValue);
  }
  setActiveView("equipment");
  renderEquipmentSearch();
  equipmentSearchElement.closest(".search-panel")?.scrollIntoView({ block: "start" });
}

function renderEquipment(records) {
  equipmentRecords = Array.isArray(records) ? records : [];
  selectedRecordIndex = null;
  showAllResults = false;
  regionColumnName = detectRegionColumn(equipmentRecords);
  buildFilters(equipmentRecords);
  isRestoringUrlState = true;
  restoreFilterStateFromUrl();
  setActiveView(new URLSearchParams(window.location.search).get("view"), { updateUrl: false });
  renderEquipmentDetails(null);
  renderEquipmentSearch();
  renderStatistics(equipmentRecords);
  isRestoringUrlState = false;
}

function showError(message) {
  errorMessageElement.hidden = false;
  errorMessageElement.textContent = message;
  generatedAtElement.textContent = "데이터 로딩 실패";
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load JSON: ${url}`);
  }

  return response.json();
}

async function loadDashboard() {
  try {
    const [summary, equipment] = await Promise.all([
      fetchJson(SUMMARY_URL),
      fetchJson(EQUIPMENT_URL),
    ]);
    renderSummary(summary);
    renderEquipment(equipment);
  } catch (error) {
    showError("대시보드 데이터를 불러오지 못했습니다. web/data 파일을 확인해 주세요.");
    console.error("Dashboard core loading failed:", error);
  }

  try {
    const history = await fetchJson(UPDATE_HISTORY_URL);
    renderUpdateHistory(history);
  } catch (error) {
    renderUpdateHistoryError("업데이트 이력을 불러오는 중 오류가 발생했습니다.");
    console.error("Update history loading failed:", error);
  }
}

equipmentSearchElement.addEventListener("input", renderEquipmentSearch);
manufacturerFilterElement.addEventListener("change", renderEquipmentSearch);
teslaFilterElement.addEventListener("change", renderEquipmentSearch);
sidoFilterElement.addEventListener("change", (event) => {
  populateSigunguFilter(equipmentRecords, event.target.value);
  renderEquipmentSearch();
});
sigunguFilterElement.addEventListener("change", renderEquipmentSearch);
window.addEventListener("popstate", () => {
  isRestoringUrlState = true;
  showAllResults = false;
  restoreFilterStateFromUrl();
  setActiveView(new URLSearchParams(window.location.search).get("view"), { updateUrl: false });
  renderEquipmentSearch();
  isRestoringUrlState = false;
});
for (const tab of viewTabElements) {
  tab.addEventListener("click", () => setActiveView(tab.dataset.view, { focusTab: true }));
  tab.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveView(tab.dataset.view, { focusTab: true });
    }
  });
}
for (const container of [
  manufacturerSummaryChartElement,
  teslaDistributionChartElement,
  regionSummaryChartElement,
]) {
  const activateRow = (event) => {
    const row = event.target.closest?.("[data-filter-key][data-filter-value]");
    if (!row) {
      return;
    }
    if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    activateStatisticsFilter(row.dataset.filterKey, row.dataset.filterValue);
  };
  container.addEventListener("click", activateRow);
  container.addEventListener("keydown", activateRow);
}
resetFiltersElement.addEventListener("click", resetFilters);
showAllResultsElement.addEventListener("click", showAllEquipmentResults);
clearSearchElement.addEventListener("click", clearSearchQuery);
shareViewElement.addEventListener("click", shareCurrentView);
for (const button of clearFilterButtonElements) {
  button.addEventListener("click", () => clearFilter(button.dataset.clearFilter));
}
appliedFilterChipsElement.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const chip = event.target.closest("[data-filter-key]");
  if (!chip) {
    return;
  }

  clearFilter(chip.dataset.filterKey);
});
sidoSummaryListElement.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest(".sido-summary-item");
  if (!button) {
    return;
  }

  activateSidoFilter(button.dataset.sido ?? "");
});
sigunguSummaryListElement.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest(".sigungu-summary-item");
  if (!button) {
    return;
  }

  activateSigunguFilter(button.dataset.sido ?? "", button.dataset.sigungu ?? "");
});
equipmentTableBodyElement.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest(".view-button");
  if (!button) {
    return;
  }

  selectRecord(Number(button.dataset.recordIndex));
});
for (const headerElement of sortHeaderElements) {
  headerElement.addEventListener("click", handleSortClick);
}

function getStatusLabel(status) {
  switch (status) {
    case "planned":
      return "공개 준비 중";
    case "published":
      return "공개 완료";
    case "corrected":
      return "수정 완료";
    default:
      return status || "-";
  }
}

function formatHistoryDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function renderCurrentDataInfo(latestRelease) {
  if (!latestRelease) {
    return;
  }

  infoReferenceDateElement.textContent = latestRelease.data_reference_date || "-";

  const status = latestRelease.status || "";
  const label = getStatusLabel(status);

  const badge = document.createElement("span");
  badge.className = `status-badge status-${status}`;
  badge.textContent = label;
  infoStatusElement.replaceChildren(badge);

  if (status === "planned" && latestRelease.published_at === null) {
    infoPublishedDateElement.textContent = "공개 준비 중";
  } else {
    infoPublishedDateElement.textContent = latestRelease.published_at
      ? formatHistoryDateTime(latestRelease.published_at)
      : "-";
  }

  infoSourceElement.textContent = latestRelease.source_name || "-";

  if (status === "planned" && latestRelease.total_equipment === null) {
    infoTotalEquipmentElement.textContent = "-";
  } else {
    infoTotalEquipmentElement.textContent = latestRelease.total_equipment !== null && latestRelease.total_equipment !== undefined
      ? `${formatNumber(latestRelease.total_equipment)}대`
      : "-";
  }
}

function renderUpdateHistory(history) {
  historyListElement.replaceChildren();

  const releases = history?.releases;
  if (!Array.isArray(releases) || releases.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.textContent = "등록된 업데이트 이력이 없습니다.";
    historyListElement.append(emptyMsg);
    return;
  }

  renderCurrentDataInfo(releases[0]);

  const fragment = document.createDocumentFragment();

  for (const release of releases) {
    const item = document.createElement("article");
    item.className = "history-item";

    const header = document.createElement("div");
    header.className = "history-header";

    const titleWrap = document.createElement("h3");
    titleWrap.className = "history-version-title";

    const versionSpan = document.createElement("span");
    versionSpan.textContent = `v${release.version}`;
    titleWrap.append(versionSpan);

    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge status-${release.status}`;
    statusBadge.textContent = getStatusLabel(release.status);
    titleWrap.append(statusBadge);

    const meta = document.createElement("div");
    meta.className = "history-meta";

    const refDateSpan = document.createElement("span");
    refDateSpan.textContent = `기준일: ${release.data_reference_date}`;
    meta.append(refDateSpan);

    const pubDateSpan = document.createElement("span");
    if (release.status === "planned" && release.published_at === null) {
      pubDateSpan.textContent = "공개일: 공개 준비 중";
    } else {
      pubDateSpan.textContent = `공개일: ${release.published_at ? formatHistoryDateTime(release.published_at) : "-"}`;
    }
    meta.append(pubDateSpan);

    const countSpan = document.createElement("span");
    if (release.status === "planned" && release.total_equipment === null) {
      countSpan.textContent = "장비 수: -";
    } else {
      countSpan.textContent = `장비 수: ${release.total_equipment !== null && release.total_equipment !== undefined ? formatNumber(release.total_equipment) : "-"}대`;
    }
    meta.append(countSpan);

    header.append(titleWrap, meta);

    const summary = document.createElement("p");
    summary.className = "history-summary";
    summary.textContent = release.change_summary;

    const details = document.createElement("div");
    details.className = "history-details";

    const hasCorrections = Array.isArray(release.corrections) && release.corrections.length > 0;
    const correctionsSection = document.createElement("div");
    correctionsSection.className = "history-detail-section";

    const corrTitle = document.createElement("h4");
    corrTitle.className = "history-detail-title";
    corrTitle.textContent = "정정 사항";
    correctionsSection.append(corrTitle);

    if (hasCorrections) {
      const corrList = document.createElement("ul");
      corrList.className = "history-detail-list";
      for (const corr of release.corrections) {
        const li = document.createElement("li");
        li.textContent = corr;
        corrList.append(li);
      }
      correctionsSection.append(corrList);
    } else {
      const noCorr = document.createElement("p");
      noCorr.className = "history-detail-list";
      noCorr.textContent = "정정 사항 없음";
      correctionsSection.append(noCorr);
    }

    const hasNotes = Array.isArray(release.data_quality_notes) && release.data_quality_notes.length > 0;
    if (hasNotes) {
      const notesSection = document.createElement("div");
      notesSection.className = "history-detail-section";

      const notesTitle = document.createElement("h4");
      notesTitle.className = "history-detail-title";
      notesTitle.textContent = "데이터 품질 주의사항";
      notesSection.append(notesTitle);

      const notesList = document.createElement("ul");
      notesList.className = "history-detail-list";
      for (const note of release.data_quality_notes) {
        const li = document.createElement("li");
        li.textContent = note;
        notesList.append(li);
      }
      notesSection.append(notesList);

      details.append(correctionsSection, notesSection);
    } else {
      details.append(correctionsSection);
    }

    item.append(header, summary, details);
    fragment.append(item);
  }

  historyListElement.append(fragment);
}

function renderUpdateHistoryError(message) {
  historyListElement.replaceChildren();
  const errorMsg = document.createElement("p");
  errorMsg.className = "history-error";
  errorMsg.setAttribute("role", "status");
  errorMsg.textContent = message;
  historyListElement.append(errorMsg);

  infoReferenceDateElement.textContent = "오류";
  infoStatusElement.textContent = "오류";
  infoPublishedDateElement.textContent = "오류";
  infoSourceElement.textContent = "오류";
  infoTotalEquipmentElement.textContent = "오류";
}

loadDashboard();
