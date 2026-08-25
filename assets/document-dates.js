(function () {
  'use strict';

  var EFFECTIVE_LABELS = ['生效日期', '生效日', 'Effective date', 'Effective Date'];
  var REVIEW_CYCLE_LABELS = ['審查週期', 'Review cycle', 'Review Cycle'];
  var NEXT_REVIEW_LABELS = ['下次審查日', '下次審查日期', 'Next review', 'Next Review'];

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function isLabel(value, labels) {
    var normalized = normalize(value).toLowerCase();
    return labels.some(function (label) {
      return normalized === label.toLowerCase();
    });
  }

  function localToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  }

  function addMonthsClamped(date, months) {
    var targetMonthStart = new Date(date.getFullYear(), date.getMonth() + months, 1, 12, 0, 0, 0);
    var lastDay = new Date(targetMonthStart.getFullYear(), targetMonthStart.getMonth() + 1, 0, 12, 0, 0, 0).getDate();
    return new Date(targetMonthStart.getFullYear(), targetMonthStart.getMonth(), Math.min(date.getDate(), lastDay), 12, 0, 0, 0);
  }

  function parseDate(value) {
    var match = String(value || '').match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (!match) return null;
    var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isoDate(date) {
    var year = String(date.getFullYear());
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function monthsFromReviewCycle(value) {
    var cycle = normalize(value).replace(/\s/g, '');
    var yearMatch = cycle.match(/(\d+)年/);
    var monthMatch = cycle.match(/(\d+)個?月/);
    if (yearMatch) return Math.max(1, Number(yearMatch[1]) * 12);
    if (monthMatch) return Math.max(1, Number(monthMatch[1]));
    if (/每五年|五年/.test(cycle)) return 60;
    if (/每三年|三年/.test(cycle)) return 36;
    if (/每兩年|每二年|兩年|二年/.test(cycle)) return 24;
    if (/每半年|半年/.test(cycle)) return 6;
    if (/每季|每季度/.test(cycle)) return 3;
    if (/每月/.test(cycle)) return 1;
    return 12;
  }

  function valueFromCell(cell) {
    if (!cell) return '';
    var control = cell.matches('input, select, textarea') ? cell : cell.querySelector('input, select, textarea');
    return control ? control.value : cell.textContent;
  }

  function writeDate(cell, date, role) {
    if (!cell) return;
    var control = cell.matches('input, textarea') ? cell : cell.querySelector('input, textarea');
    var current = control ? control.value : normalize(cell.textContent);
    var separator = /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(current) ? '/' : '-';
    var value = isoDate(date).replace(/-/g, separator);
    var title = role === 'effective'
      ? '依學員系統日期自動計算：系統日期往前 6 個月'
      : '依生效日期與審查週期自動計算';

    if (control) {
      control.value = control.type === 'date' ? isoDate(date) : value;
      control.dataset.tksgRelativeDate = role;
      control.title = title;
    } else {
      cell.textContent = value;
      cell.dataset.tksgRelativeDate = role;
      cell.title = title;
    }
  }

  function headerIndex(cells, labels) {
    for (var index = 0; index < cells.length; index += 1) {
      if (isLabel(cells[index].textContent, labels)) return index;
    }
    return -1;
  }

  function processHeaderTable(table, effectiveDate) {
    var headerRow = table.tHead && table.tHead.rows.length ? table.tHead.rows[table.tHead.rows.length - 1] : null;
    if (!headerRow) return false;
    var headers = Array.prototype.slice.call(headerRow.cells);
    var effectiveIndex = headerIndex(headers, EFFECTIVE_LABELS);
    var cycleIndex = headerIndex(headers, REVIEW_CYCLE_LABELS);
    var nextReviewIndex = headerIndex(headers, NEXT_REVIEW_LABELS);
    if (effectiveIndex < 0 && nextReviewIndex < 0) return false;

    var rows = [];
    Array.prototype.slice.call(table.tBodies || []).forEach(function (tbody) {
      rows = rows.concat(Array.prototype.slice.call(tbody.rows));
    });
    rows.forEach(function (row) {
      var cells = Array.prototype.slice.call(row.cells);
      if (effectiveIndex >= 0 && cells[effectiveIndex]) writeDate(cells[effectiveIndex], effectiveDate, 'effective');
      if (nextReviewIndex >= 0 && cells[nextReviewIndex]) {
        var cycle = cycleIndex >= 0 && cells[cycleIndex] ? valueFromCell(cells[cycleIndex]) : '';
        writeDate(cells[nextReviewIndex], addMonthsClamped(effectiveDate, monthsFromReviewCycle(cycle)), 'next-review');
      }
    });
    table.dataset.tksgRelativeDates = 'true';
    return true;
  }

  function processKeyValueTable(table, effectiveDate) {
    var processed = false;
    Array.prototype.slice.call(table.rows).forEach(function (row) {
      var cells = Array.prototype.slice.call(row.cells);
      for (var index = 0; index < cells.length - 1; index += 1) {
        if (cells[index + 1].tagName !== 'TD') continue;
        if (isLabel(cells[index].textContent, EFFECTIVE_LABELS)) {
          writeDate(cells[index + 1], effectiveDate, 'effective');
          processed = true;
        }
        if (isLabel(cells[index].textContent, NEXT_REVIEW_LABELS)) {
          writeDate(cells[index + 1], addMonthsClamped(effectiveDate, 12), 'next-review');
          processed = true;
        }
      }
    });
    if (processed) table.dataset.tksgRelativeDates = 'true';
    return processed;
  }

  function updateNextReviewFromEditedRow(target) {
    var row = target.closest('tr');
    var table = target.closest('table');
    if (!row || !table || !table.tHead || !table.tHead.rows.length) return;
    var headers = Array.prototype.slice.call(table.tHead.rows[table.tHead.rows.length - 1].cells);
    var effectiveIndex = headerIndex(headers, EFFECTIVE_LABELS);
    var cycleIndex = headerIndex(headers, REVIEW_CYCLE_LABELS);
    var nextReviewIndex = headerIndex(headers, NEXT_REVIEW_LABELS);
    if (nextReviewIndex < 0 || !row.cells[nextReviewIndex]) return;
    var effective = effectiveIndex >= 0 && row.cells[effectiveIndex]
      ? parseDate(valueFromCell(row.cells[effectiveIndex]))
      : null;
    if (!effective) effective = addMonthsClamped(localToday(), -6);
    var cycle = cycleIndex >= 0 && row.cells[cycleIndex] ? valueFromCell(row.cells[cycleIndex]) : '';
    writeDate(row.cells[nextReviewIndex], addMonthsClamped(effective, monthsFromReviewCycle(cycle)), 'next-review');
  }

  var effectiveDate = addMonthsClamped(localToday(), -6);
  var processedTables = 0;
  Array.prototype.slice.call(document.querySelectorAll('table')).forEach(function (table) {
    if (processHeaderTable(table, effectiveDate) || processKeyValueTable(table, effectiveDate)) processedTables += 1;
  });

  document.addEventListener('change', function (event) {
    var role = event.target.dataset.tksgRelativeDate;
    var table = event.target.closest('table');
    if (role === 'effective' || (table && table.dataset.tksgRelativeDates === 'true')) {
      updateNextReviewFromEditedRow(event.target);
    }
  });

  window.TKSGDocumentDates = {
    basis: 'learner-local-system-date',
    effectiveDate: isoDate(effectiveDate),
    defaultNextReviewDate: isoDate(addMonthsClamped(effectiveDate, 12)),
    processedTables: processedTables
  };
}());
