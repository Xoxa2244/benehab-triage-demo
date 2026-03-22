import { useEffect, useMemo, useState } from 'react';
import { api } from './api';

const VALUE_OPTIONS = Array.from({ length: 11 }, (_, index) => (index / 10).toFixed(1));

const STATUS_LABELS = {
  idle: '—',
  dirty: 'Есть несохраненные изменения',
  saving: 'Сохранение...',
  saved: 'Сохранено',
  error: 'Ошибка сохранения',
};

const STATUS_CLASS = {
  idle: 'badge badge-idle',
  dirty: 'badge badge-dirty',
  saving: 'badge badge-saving',
  saved: 'badge badge-saved',
  error: 'badge badge-error',
};

function createTempId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function reorder(items, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function ensureMatrixSize(matrix, rows, cols) {
  const out = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  for (let r = 0; r < Math.min(rows, matrix?.length || 0); r += 1) {
    for (let c = 0; c < Math.min(cols, matrix?.[r]?.length || 0); c += 1) {
      const numeric = Number(matrix[r][c] ?? 0);
      const bounded = Math.min(1, Math.max(0, numeric));
      out[r][c] = Math.round(bounded * 10) / 10;
    }
  }
  return out;
}

function normalizeMetric(metric, conceptCount, colorCount) {
  return {
    ...metric,
    similarity_same_weights: ensureMatrixSize(metric.similarity_same_weights, conceptCount, conceptCount),
    similarity_diff_weights: ensureMatrixSize(metric.similarity_diff_weights, conceptCount, conceptCount),
    attractiveness_rank_weights: ensureMatrixSize(
      metric.attractiveness_rank_weights,
      conceptCount,
      colorCount
    ),
  };
}

function StatusBadge({ status, message }) {
  return <span className={STATUS_CLASS[status]}>{message || STATUS_LABELS[status]}</span>;
}

function App() {
  const [activeTab, setActiveTab] = useState('config');
  const [appError, setAppError] = useState('');

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectDraft, setProjectDraft] = useState({ name: '', description: '', status: 'draft' });
  const [projectStatus, setProjectStatus] = useState({ state: 'idle', message: '' });

  const [concepts, setConcepts] = useState([]);
  const [palette, setPalette] = useState([]);
  const [conceptStatus, setConceptStatus] = useState({ state: 'idle', message: '' });
  const [paletteStatus, setPaletteStatus] = useState({ state: 'idle', message: '' });
  const [newConceptLabel, setNewConceptLabel] = useState('');
  const [newColor, setNewColor] = useState({ label: '', hex: '#3b82f6' });
  const [dragConceptIndex, setDragConceptIndex] = useState(-1);
  const [dragPaletteIndex, setDragPaletteIndex] = useState(-1);

  const [metrics, setMetrics] = useState([]);
  const [selectedMetricId, setSelectedMetricId] = useState('');
  const [newMetricName, setNewMetricName] = useState('');
  const [metricStatus, setMetricStatus] = useState({ state: 'idle', message: '' });
  const [metricOrderStatus, setMetricOrderStatus] = useState({ state: 'idle', message: '' });
  const [dragMetricIndex, setDragMetricIndex] = useState(-1);

  const [syntheticUsers, setSyntheticUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newUser, setNewUser] = useState({ display_name: '', note: '' });
  const [userStatus, setUserStatus] = useState('');

  const [surveyStage, setSurveyStage] = useState(1);
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [conceptChoices, setConceptChoices] = useState({});
  const [rankedColors, setRankedColors] = useState([]);
  const [draggedColor, setDraggedColor] = useState(null);
  const [surveyStatus, setSurveyStatus] = useState('');

  const [userResults, setUserResults] = useState([]);
  const [surveyRuns, setSurveyRuns] = useState([]);
  const [resultsStatus, setResultsStatus] = useState('');
  const [xlsxStatus, setXlsxStatus] = useState('');
  const [runsFilter, setRunsFilter] = useState({
    project_id: '',
    user_id: '',
    date_from: '',
    date_to: '',
  });

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const selectedMetric = useMemo(
    () => metrics.find((metric) => metric.id === selectedMetricId) || null,
    [metrics, selectedMetricId]
  );

  const activeConcepts = useMemo(
    () => [...concepts].filter((item) => item.is_active).sort((a, b) => a.position - b.position),
    [concepts]
  );

  const activePalette = useMemo(
    () => [...palette].filter((item) => item.is_active).sort((a, b) => a.position - b.position),
    [palette]
  );

  const unrankedColors = useMemo(
    () => activePalette.filter((color) => !rankedColors.includes(color.id)),
    [activePalette, rankedColors]
  );

  const allConceptsSelected =
    activeConcepts.length > 0 && activeConcepts.every((concept) => Boolean(conceptChoices[concept.id]));
  const allColorsRanked = activePalette.length > 0 && rankedColors.length === activePalette.length;

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setProjectDraft({
      name: selectedProject.name,
      description: selectedProject.description || '',
      status: selectedProject.status,
    });
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProjectId) return;
    loadProjectDetails(selectedProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  useEffect(() => {
    setRunsFilter((prev) => ({ ...prev, project_id: selectedProjectId || '' }));
  }, [selectedProjectId]);

  async function loadInitialData() {
    setAppError('');
    try {
      const [projectsData, usersData] = await Promise.all([api.listProjects(), api.listSyntheticUsers()]);
      setProjects(projectsData);
      setSyntheticUsers(usersData);

      if (projectsData.length) {
        setSelectedProjectId(projectsData[0].id);
      }

      if (usersData.length) {
        setSelectedUserId(usersData[0].id);
      }

      await loadResults();
    } catch (error) {
      setAppError(`Ошибка загрузки: ${error.message}`);
    }
  }

  function resetSurveyState() {
    setSurveyStage(1);
    setCurrentConceptIndex(0);
    setConceptChoices({});
    setRankedColors([]);
    setSurveyStatus('');
  }

  async function loadProjectDetails(projectId) {
    setAppError('');
    try {
      const [conceptsData, paletteData, metricsData] = await Promise.all([
        api.getConcepts(projectId),
        api.getPalette(projectId),
        api.getMetrics(projectId),
      ]);

      const sortedConcepts = [...conceptsData].sort((a, b) => a.position - b.position);
      const sortedPalette = [...paletteData].sort((a, b) => a.position - b.position);
      const normalizedMetrics = metricsData
        .sort((a, b) => a.position - b.position)
        .map((metric) => normalizeMetric(metric, sortedConcepts.length, sortedPalette.length));

      setConcepts(sortedConcepts);
      setPalette(sortedPalette);
      setMetrics(normalizedMetrics);

      const nextSelectedMetric = normalizedMetrics.find((item) => item.id === selectedMetricId)
        ? selectedMetricId
        : normalizedMetrics[0]?.id || '';
      setSelectedMetricId(nextSelectedMetric);

      setConceptStatus({ state: 'idle', message: '' });
      setPaletteStatus({ state: 'idle', message: '' });
      setMetricStatus({ state: 'idle', message: '' });
      setMetricOrderStatus({ state: 'idle', message: '' });
      resetSurveyState();
    } catch (error) {
      setAppError(`Ошибка загрузки проекта: ${error.message}`);
    }
  }

  async function loadResults() {
    setResultsStatus('Загрузка результатов...');
    try {
      const [usersRows, runsRows] = await Promise.all([
        api.listUserResults(),
        api.listSurveyRuns(runsFilter),
      ]);
      setUserResults(usersRows);
      setSurveyRuns(runsRows);
      setResultsStatus('');
    } catch (error) {
      setResultsStatus(`Ошибка загрузки результатов: ${error.message}`);
    }
  }

  function getFilenameFromContentDisposition(headerValue, fallback) {
    const match = headerValue?.match(/filename="?([^"]+)"?/i);
    return match?.[1] || fallback;
  }

  async function downloadUserResultsXlsx() {
    setXlsxStatus('Подготовка XLSX...');
    try {
      const response = await api.downloadUserResultsXlsx();
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed: ${response.status}`);
      }

      const blob = await response.blob();
      const fallbackName = 'user-results.xlsx';
      const filename = getFilenameFromContentDisposition(
        response.headers.get('content-disposition'),
        fallbackName
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setXlsxStatus(`XLSX скачан: ${filename}`);
    } catch (error) {
      setXlsxStatus(`Ошибка выгрузки XLSX: ${error.message}`);
    }
  }

  async function createProject() {
    const name = window.prompt('Название нового проекта');
    if (!name) return;

    try {
      const project = await api.createProject({
        name,
        description: '',
        status: 'draft',
      });
      const updated = [project, ...projects];
      setProjects(updated);
      setSelectedProjectId(project.id);
    } catch (error) {
      setAppError(`Ошибка создания проекта: ${error.message}`);
    }
  }

  async function removeProject(projectId) {
    const confirmed = window.confirm('Удалить проект и все его метрики/прохождения?');
    if (!confirmed) return;

    try {
      await api.deleteProject(projectId);
      const nextProjects = projects.filter((item) => item.id !== projectId);
      setProjects(nextProjects);
      setSelectedProjectId(nextProjects[0]?.id || '');
      await loadResults();
    } catch (error) {
      setAppError(`Ошибка удаления проекта: ${error.message}`);
    }
  }

  async function duplicateCurrentProject() {
    if (!selectedProjectId) return;
    try {
      const duplicated = await api.duplicateProject(selectedProjectId);
      setProjects((prev) => [duplicated, ...prev]);
      setSelectedProjectId(duplicated.id);
    } catch (error) {
      setAppError(`Ошибка дублирования проекта: ${error.message}`);
    }
  }

  function markProjectDirty(key, value) {
    setProjectDraft((prev) => ({ ...prev, [key]: value }));
    setProjectStatus({ state: 'dirty', message: '' });
  }

  async function saveProjectMeta() {
    if (!selectedProjectId) return;

    setProjectStatus({ state: 'saving', message: '' });
    try {
      const updated = await api.updateProject(selectedProjectId, projectDraft);
      setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setProjectStatus({ state: 'saved', message: '' });
    } catch (error) {
      setProjectStatus({ state: 'error', message: error.message });
    }
  }

  function updateConcept(index, patch) {
    setConcepts((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
    setConceptStatus({ state: 'dirty', message: '' });
  }

  function addConcept() {
    const label = newConceptLabel.trim();
    if (!label) return;

    const next = [
      ...concepts,
      {
        id: createTempId('concept'),
        label,
        position: concepts.length,
        is_active: true,
      },
    ];
    setConcepts(next);
    setNewConceptLabel('');
    setConceptStatus({ state: 'dirty', message: '' });
  }

  function deleteConcept(index) {
    const next = concepts
      .filter((_, itemIndex) => itemIndex !== index)
      .map((item, itemIndex) => ({ ...item, position: itemIndex }));
    setConcepts(next);
    setConceptStatus({ state: 'dirty', message: '' });
  }

  function dropConcept(toIndex) {
    if (dragConceptIndex === -1) return;
    const reordered = reorder(concepts, dragConceptIndex, toIndex).map((item, index) => ({
      ...item,
      position: index,
    }));
    setConcepts(reordered);
    setDragConceptIndex(-1);
    setConceptStatus({ state: 'dirty', message: '' });
  }

  async function saveConcepts() {
    if (!selectedProjectId) return;
    setConceptStatus({ state: 'saving', message: '' });

    try {
      const saved = await api.saveConcepts(selectedProjectId, concepts);
      setConcepts(saved.sort((a, b) => a.position - b.position));
      setConceptStatus({ state: 'saved', message: '' });
      await loadProjectDetails(selectedProjectId);
    } catch (error) {
      setConceptStatus({ state: 'error', message: error.message });
    }
  }

  function updatePalette(index, patch) {
    setPalette((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
    setPaletteStatus({ state: 'dirty', message: '' });
  }

  function addColor() {
    const label = newColor.label.trim();
    const hex = newColor.hex.trim();
    if (!label || !hex) return;

    const next = [
      ...palette,
      {
        id: createTempId('color'),
        label,
        hex,
        position: palette.length,
        is_active: true,
      },
    ];

    setPalette(next);
    setNewColor({ label: '', hex: '#3b82f6' });
    setPaletteStatus({ state: 'dirty', message: '' });
  }

  function deleteColor(index) {
    const next = palette
      .filter((_, itemIndex) => itemIndex !== index)
      .map((item, itemIndex) => ({ ...item, position: itemIndex }));
    setPalette(next);
    setPaletteStatus({ state: 'dirty', message: '' });
  }

  function dropPalette(toIndex) {
    if (dragPaletteIndex === -1) return;
    const reordered = reorder(palette, dragPaletteIndex, toIndex).map((item, index) => ({
      ...item,
      position: index,
    }));
    setPalette(reordered);
    setDragPaletteIndex(-1);
    setPaletteStatus({ state: 'dirty', message: '' });
  }

  async function savePalette() {
    if (!selectedProjectId) return;
    setPaletteStatus({ state: 'saving', message: '' });

    try {
      const saved = await api.savePalette(selectedProjectId, palette);
      setPalette(saved.sort((a, b) => a.position - b.position));
      setPaletteStatus({ state: 'saved', message: '' });
      await loadProjectDetails(selectedProjectId);
    } catch (error) {
      setPaletteStatus({ state: 'error', message: error.message });
    }
  }

  function dropMetric(toIndex) {
    if (dragMetricIndex === -1) return;
    const reordered = reorder(metrics, dragMetricIndex, toIndex).map((item, index) => ({
      ...item,
      position: index,
    }));
    setMetrics(reordered);
    setDragMetricIndex(-1);
    setMetricOrderStatus({ state: 'dirty', message: '' });
  }

  async function saveMetricOrder() {
    if (!selectedProjectId) return;

    setMetricOrderStatus({ state: 'saving', message: '' });
    try {
      await api.saveMetricsOrder(
        selectedProjectId,
        metrics.map((item) => item.id)
      );
      setMetricOrderStatus({ state: 'saved', message: '' });
      await loadProjectDetails(selectedProjectId);
    } catch (error) {
      setMetricOrderStatus({ state: 'error', message: error.message });
    }
  }

  async function addMetric() {
    if (!selectedProjectId) return;
    setMetricStatus({ state: 'saving', message: '' });

    try {
      const created = await api.createMetric(selectedProjectId, {
        name: newMetricName.trim() || `metric_${Date.now()}`,
      });
      setNewMetricName('');
      await loadProjectDetails(selectedProjectId);
      setSelectedMetricId(created.id);
      setMetricStatus({ state: 'saved', message: 'Метрика создана' });
    } catch (error) {
      setMetricStatus({ state: 'error', message: error.message });
    }
  }

  async function removeMetric(metricId) {
    if (!selectedProjectId) return;
    const confirmed = window.confirm('Удалить метрику?');
    if (!confirmed) return;

    setMetricStatus({ state: 'saving', message: '' });
    try {
      await api.deleteMetric(selectedProjectId, metricId);
      await loadProjectDetails(selectedProjectId);
      setMetricStatus({ state: 'saved', message: 'Метрика удалена' });
    } catch (error) {
      setMetricStatus({ state: 'error', message: error.message });
    }
  }

  function updateSelectedMetric(patch) {
    if (!selectedMetricId) return;
    setMetrics((prev) =>
      prev.map((item) => (item.id === selectedMetricId ? { ...item, ...patch } : item))
    );
    setMetricStatus({ state: 'dirty', message: '' });
  }

  function updateMetricCell(field, rowIndex, colIndex, value) {
    if (!selectedMetric) return;
    const numeric = Number(value);
    const isSymmetricField =
      field === 'similarity_same_weights' || field === 'similarity_diff_weights';

    const matrix = selectedMetric[field].map((row, r) =>
      row.map((cell, c) => {
        if (isSymmetricField) {
          if (r === rowIndex && c === colIndex) return numeric;
          if (r === colIndex && c === rowIndex) return numeric;
          if (r === c) return 0;
          return cell;
        }
        return r === rowIndex && c === colIndex ? numeric : cell;
      })
    );

    updateSelectedMetric({ [field]: matrix });
  }

  async function saveSelectedMetric() {
    if (!selectedProjectId || !selectedMetric) return;

    setMetricStatus({ state: 'saving', message: '' });
    try {
      const payload = {
        name: selectedMetric.name,
        is_active: selectedMetric.is_active,
        similarity_same_weights: selectedMetric.similarity_same_weights,
        similarity_diff_weights: selectedMetric.similarity_diff_weights,
        attractiveness_rank_weights: selectedMetric.attractiveness_rank_weights,
      };
      const saved = await api.updateMetric(selectedProjectId, selectedMetric.id, payload);

      const normalized = normalizeMetric(saved, concepts.length, palette.length);
      setMetrics((prev) => prev.map((item) => (item.id === normalized.id ? normalized : item)));
      setMetricStatus({ state: 'saved', message: '' });
    } catch (error) {
      setMetricStatus({ state: 'error', message: error.message });
    }
  }

  async function createSyntheticUser() {
    const name = newUser.display_name.trim();
    if (!name) return;

    setUserStatus('Сохранение synthetic user...');
    try {
      const created = await api.createSyntheticUser({
        display_name: name,
        note: newUser.note,
      });

      setSyntheticUsers((prev) => {
        const exists = prev.some((item) => item.id === created.id);
        if (exists) return prev;
        return [created, ...prev];
      });
      setSelectedUserId(created.id);
      setNewUser({ display_name: '', note: '' });
      setUserStatus('Synthetic user сохранен');
    } catch (error) {
      setUserStatus(`Ошибка synthetic user: ${error.message}`);
    }
  }

  async function removeSyntheticUser(userId) {
    const confirmed = window.confirm(
      'Удалить synthetic user? Удаление запрещено, если у пользователя уже есть прохождения.'
    );
    if (!confirmed) return;
    try {
      await api.deleteSyntheticUser(userId);
      const next = syntheticUsers.filter((item) => item.id !== userId);
      setSyntheticUsers(next);
      if (selectedUserId === userId) {
        setSelectedUserId(next[0]?.id || '');
      }
      setUserStatus('Synthetic user удален');
    } catch (error) {
      setUserStatus(`Ошибка удаления: ${error.message}`);
    }
  }

  function goToNextConcept() {
    if (currentConceptIndex < activeConcepts.length - 1) {
      setCurrentConceptIndex((prev) => prev + 1);
    }
  }

  function goToPreviousConcept() {
    if (currentConceptIndex > 0) {
      setCurrentConceptIndex((prev) => prev - 1);
    }
  }

  function setConceptColor(conceptId, colorId) {
    setConceptChoices((prev) => ({ ...prev, [conceptId]: colorId }));
    if (currentConceptIndex < activeConcepts.length - 1) {
      goToNextConcept();
    }
  }

  function ensureColorInRank(colorId, index = null) {
    setRankedColors((prev) => {
      const currentIndex = prev.indexOf(colorId);
      const next = prev.filter((item) => item !== colorId);

      if (index == null) {
        next.push(colorId);
        return next;
      }

      let targetIndex = index;
      if (currentIndex !== -1 && index > currentIndex) {
        // When moving down within the same list, account for removal shift.
        targetIndex -= 1;
      }

      if (targetIndex < 0) targetIndex = 0;
      if (targetIndex > next.length) targetIndex = next.length;
      next.splice(targetIndex, 0, colorId);
      return next;
    });
  }

  function removeColorFromRank(colorId) {
    setRankedColors((prev) => prev.filter((item) => item !== colorId));
  }

  function dropColorIntoRank(insertIndex) {
    if (!draggedColor) return;
    ensureColorInRank(draggedColor.colorId, insertIndex);
    setDraggedColor(null);
  }

  async function submitSurvey() {
    if (!selectedProjectId) return;
    if (!allConceptsSelected) {
      setSurveyStatus('Этап 1 не завершен: выберите цвет для каждого понятия.');
      return;
    }
    if (!allColorsRanked) {
      setSurveyStatus('Этап 2 не завершен: распределите все цвета по линейке.');
      return;
    }

    setSurveyStatus('Отправка прохождения...');

    try {
      let userId = selectedUserId;
      if (!userId) {
        const autoName = newUser.display_name.trim() || `Synthetic ${Date.now()}`;
        const created = await api.createSyntheticUser({
          display_name: autoName,
          note: newUser.note,
        });
        userId = created.id;
        setSyntheticUsers((prev) => [created, ...prev]);
        setSelectedUserId(created.id);
      }

      await api.submitSurveyRun(selectedProjectId, {
        user_id: userId,
        concept_color_choices: conceptChoices,
        color_rank_order: rankedColors,
      });

      setSurveyStatus('Прохождение сохранено.');
      await loadResults();
    } catch (error) {
      setSurveyStatus(`Ошибка сохранения прохождения: ${error.message}`);
    }
  }

  const currentConcept = activeConcepts[currentConceptIndex];

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Lite Color Test</h1>
          <p>Standalone app: projects, palette/concepts, metrics, survey runs, results.</p>
        </div>
      </header>

      {appError && <div className="error-banner">{appError}</div>}

      <section className="top-controls">
        <div className="project-picker">
          <label>Проект</label>
          <select
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
          >
            <option value="">Выберите проект</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button onClick={createProject}>Создать проект</button>
          {selectedProjectId && <button onClick={duplicateCurrentProject}>Дублировать</button>}
          {selectedProjectId && (
            <button className="danger" onClick={() => removeProject(selectedProjectId)}>
              Удалить проект
            </button>
          )}
        </div>

        <div className="tab-switcher">
          <button
            className={activeTab === 'config' ? 'active' : ''}
            onClick={() => setActiveTab('config')}
          >
            Конфигурация
          </button>
          <button
            className={activeTab === 'survey' ? 'active' : ''}
            onClick={() => setActiveTab('survey')}
          >
            Опрос
          </button>
          <button
            className={activeTab === 'results' ? 'active' : ''}
            onClick={() => setActiveTab('results')}
          >
            Результаты
          </button>
        </div>
      </section>

      {activeTab === 'config' && selectedProject && (
        <main className="grid two-columns">
          <div className="column">
            <section className="card">
              <div className="card-head">
                <h2>Project Meta</h2>
                <StatusBadge status={projectStatus.state} message={projectStatus.message} />
              </div>
              <div className="stack">
                <label>
                  Название
                  <input
                    value={projectDraft.name}
                    onChange={(event) => markProjectDirty('name', event.target.value)}
                  />
                </label>
                <label>
                  Описание
                  <textarea
                    value={projectDraft.description}
                    onChange={(event) => markProjectDirty('description', event.target.value)}
                  />
                </label>
                <label>
                  Статус
                  <select
                    value={projectDraft.status}
                    onChange={(event) => markProjectDirty('status', event.target.value)}
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="archived">archived</option>
                  </select>
                </label>
                <div>
                  <button onClick={saveProjectMeta}>Сохранить проект</button>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Concepts (list + reorder)</h2>
                <StatusBadge status={conceptStatus.state} message={conceptStatus.message} />
              </div>
              <div className="row add-row">
                <input
                  placeholder="Новое понятие"
                  value={newConceptLabel}
                  onChange={(event) => setNewConceptLabel(event.target.value)}
                />
                <button onClick={addConcept}>Добавить</button>
                <button onClick={saveConcepts}>Сохранить</button>
              </div>

              <div className="concept-scroll">
                <ul className="list">
                  {concepts.map((item, index) => (
                    <li
                      key={item.id}
                      draggable
                      onDragStart={() => setDragConceptIndex(index)}
                      onDragEnd={() => setDragConceptIndex(-1)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dropConcept(index)}
                      className="list-item"
                    >
                      <span className="drag-handle">⋮⋮</span>
                      <input
                        className="grow"
                        value={item.label}
                        onChange={(event) => updateConcept(index, { label: event.target.value })}
                      />
                      <label className="mini-check">
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={(event) => updateConcept(index, { is_active: event.target.checked })}
                        />
                        active
                      </label>
                      <button className="danger" onClick={() => deleteConcept(index)}>
                        Удалить
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Palette (editable + reorder)</h2>
                <StatusBadge status={paletteStatus.state} message={paletteStatus.message} />
              </div>

              <div className="row add-row">
                <input
                  placeholder="Label"
                  value={newColor.label}
                  onChange={(event) => setNewColor((prev) => ({ ...prev, label: event.target.value }))}
                />
                <input
                  type="color"
                  value={newColor.hex}
                  onChange={(event) => setNewColor((prev) => ({ ...prev, hex: event.target.value }))}
                />
                <button onClick={addColor}>Добавить</button>
                <button onClick={savePalette}>Сохранить</button>
              </div>

              <ul className="list">
                {palette.map((item, index) => (
                  <li
                    key={item.id}
                    draggable
                    onDragStart={() => setDragPaletteIndex(index)}
                    onDragEnd={() => setDragPaletteIndex(-1)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropPalette(index)}
                    className="list-item palette-item"
                  >
                    <span className="drag-handle">⋮⋮</span>
                    <span className="color-dot" style={{ backgroundColor: item.hex }} />
                    <input
                      className="grow"
                      value={item.label}
                      onChange={(event) => updatePalette(index, { label: event.target.value })}
                    />
                    <input
                      type="text"
                      value={item.hex}
                      onChange={(event) => updatePalette(index, { hex: event.target.value })}
                    />
                    <label className="mini-check">
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        onChange={(event) => updatePalette(index, { is_active: event.target.checked })}
                      />
                      active
                    </label>
                    <button className="danger" onClick={() => deleteColor(index)}>
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="column">
            <section className="card">
              <div className="card-head">
                <h2>Metrics</h2>
                <StatusBadge status={metricStatus.state} message={metricStatus.message} />
              </div>

              <div className="row add-row">
                <input
                  placeholder="Новая метрика"
                  value={newMetricName}
                  onChange={(event) => setNewMetricName(event.target.value)}
                />
                <button onClick={addMetric}>Создать</button>
                <button onClick={saveSelectedMetric} disabled={!selectedMetric}>
                  Сохранить метрику
                </button>
              </div>

              <div className="card-subhead">
                <strong>Порядок метрик</strong>
                <StatusBadge status={metricOrderStatus.state} message={metricOrderStatus.message} />
                <button onClick={saveMetricOrder}>Сохранить порядок</button>
              </div>

              <ul className="list">
                {metrics.map((metric, index) => (
                  <li
                    key={metric.id}
                    draggable
                    onDragStart={() => setDragMetricIndex(index)}
                    onDragEnd={() => setDragMetricIndex(-1)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropMetric(index)}
                    className={`list-item ${selectedMetricId === metric.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMetricId(metric.id)}
                  >
                    <span className="drag-handle">⋮⋮</span>
                    <input
                      className="grow"
                      value={metric.name}
                      onChange={(event) => {
                        setSelectedMetricId(metric.id);
                        setMetrics((prev) =>
                          prev.map((item) =>
                            item.id === metric.id ? { ...item, name: event.target.value } : item
                          )
                        );
                        setMetricStatus({ state: 'dirty', message: '' });
                      }}
                    />
                    <label className="mini-check">
                      <input
                        type="checkbox"
                        checked={metric.is_active}
                        onChange={(event) => {
                          setSelectedMetricId(metric.id);
                          setMetrics((prev) =>
                            prev.map((item) =>
                              item.id === metric.id
                                ? { ...item, is_active: event.target.checked }
                                : item
                            )
                          );
                          setMetricStatus({ state: 'dirty', message: '' });
                        }}
                      />
                      active
                    </label>
                    <button className="danger" onClick={() => removeMetric(metric.id)}>
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>

              {selectedMetric && (
                <div className="matrix-stack">
                  <MatrixEditor
                    title="similarity_same_weights"
                    rowLabels={concepts.map((item) => item.label)}
                    colLabels={concepts.map((item) => item.label)}
                    matrix={selectedMetric.similarity_same_weights}
                    symmetric
                    onChange={(row, col, value) =>
                      updateMetricCell('similarity_same_weights', row, col, value)
                    }
                  />

                  <MatrixEditor
                    title="similarity_diff_weights"
                    rowLabels={concepts.map((item) => item.label)}
                    colLabels={concepts.map((item) => item.label)}
                    matrix={selectedMetric.similarity_diff_weights}
                    symmetric
                    onChange={(row, col, value) =>
                      updateMetricCell('similarity_diff_weights', row, col, value)
                    }
                  />

                  <MatrixEditor
                    title="attractiveness_rank_weights"
                    rowLabels={concepts.map((item) => item.label)}
                    colLabels={palette.map((_, index) => String(index + 1))}
                    matrix={selectedMetric.attractiveness_rank_weights}
                    onChange={(row, col, value) =>
                      updateMetricCell('attractiveness_rank_weights', row, col, value)
                    }
                  />
                </div>
              )}
            </section>
          </div>
        </main>
      )}

      {activeTab === 'survey' && selectedProject && (
        <main className="grid two-columns">
          <div className="column">
            <section className="card">
              <div className="card-head">
                <h2>Synthetic users</h2>
              </div>

              <label>
                Текущий пользователь
                <select
                  value={selectedUserId}
                  onChange={(event) => {
                    setSelectedUserId(event.target.value);
                    setRunsFilter((prev) => ({ ...prev, user_id: event.target.value }));
                  }}
                >
                  <option value="">Не выбран</option>
                  {syntheticUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.display_name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="chips-wrap">
                {syntheticUsers.map((user) => (
                  <div key={user.id} className="user-chip">
                    <span>{user.display_name}</span>
                    <button className="danger" onClick={() => removeSyntheticUser(user.id)}>
                      x
                    </button>
                  </div>
                ))}
              </div>

              <div className="row add-row">
                <input
                  placeholder="Имя synthetic user"
                  value={newUser.display_name}
                  onChange={(event) =>
                    setNewUser((prev) => ({ ...prev, display_name: event.target.value }))
                  }
                />
                <input
                  placeholder="Комментарий"
                  value={newUser.note}
                  onChange={(event) => setNewUser((prev) => ({ ...prev, note: event.target.value }))}
                />
                <button onClick={createSyntheticUser}>Создать</button>
              </div>
              {userStatus && <div className="hint">{userStatus}</div>}
            </section>
          </div>

          <div className="column">
            <section className="card">
              <div className="card-head">
                <h2>Опрос: этап 1 (понятие → цвет)</h2>
              </div>

              {activeConcepts.length === 0 || activePalette.length === 0 ? (
                <p>Добавьте активные понятия и цвета в конфигурации проекта.</p>
              ) : (
                <>
                  <div className="survey-meta">
                    <span>
                      Этап {surveyStage} из 2 | Понятие {Math.min(currentConceptIndex + 1, activeConcepts.length)} из{' '}
                      {activeConcepts.length}
                    </span>
                    <span>
                      Выбрано: {Object.keys(conceptChoices).length}/{activeConcepts.length}
                    </span>
                  </div>

                  {surveyStage === 1 && currentConcept && (
                    <div className="stage-one">
                      <h3>{currentConcept.label}</h3>
                      <div className="palette-grid">
                        {activePalette.map((color) => {
                          const selected = conceptChoices[currentConcept.id] === color.id;
                          return (
                            <button
                              key={color.id}
                              className={`color-choice ${selected ? 'selected' : ''}`}
                              style={{ backgroundColor: color.hex }}
                              onClick={() => setConceptColor(currentConcept.id, color.id)}
                              title={color.label}
                            >
                              <span>{color.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="row">
                        <button onClick={goToPreviousConcept} disabled={currentConceptIndex === 0}>
                          Назад
                        </button>
                        <button
                          onClick={() => setSurveyStage(2)}
                          disabled={!allConceptsSelected}
                          className="primary"
                        >
                          К этапу 2
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Опрос: этап 2 (ранжирование цветов)</h2>
              </div>

              {surveyStage !== 2 ? (
                <p>Сначала завершите этап 1.</p>
              ) : (
                <div className="stage-two">
                  <div className="drag-columns">
                    <div
                      className="drop-zone"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (!draggedColor) return;
                        removeColorFromRank(draggedColor.colorId);
                        setDraggedColor(null);
                      }}
                    >
                      <h4>Репозиторий цветов</h4>
                      <div className="chips-wrap">
                        {unrankedColors.map((color) => (
                          <ColorChip
                            key={color.id}
                            color={color}
                            draggable
                            onDragStart={() =>
                              setDraggedColor({ colorId: color.id, source: 'repository' })
                            }
                            onDragEnd={() => setDraggedColor(null)}
                            onDoubleClick={() => ensureColorInRank(color.id, rankedColors.length)}
                          />
                        ))}
                      </div>
                    </div>

                    <div
                      className="drop-zone"
                      onDragOver={(event) => event.preventDefault()}
                    >
                      <h4>Линейка: самый приятный → самый неприятный</h4>
                      <div className="rank-line">
                        {rankedColors.map((colorId, index) => {
                          const color = activePalette.find((item) => item.id === colorId);
                          if (!color) return null;
                          return (
                            <div key={color.id} className="rank-slot-wrap">
                              <div
                                className="rank-drop-line"
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  dropColorIntoRank(index);
                                }}
                              />
                              <div
                                className="rank-slot"
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  dropColorIntoRank(index + 1);
                                }}
                              >
                                <button
                                  className="drag-grip"
                                  draggable
                                  onDragStart={() =>
                                    setDraggedColor({ colorId: color.id, source: 'ranking' })
                                  }
                                  onDragEnd={() => setDraggedColor(null)}
                                  aria-label={`Перетащить ${color.label}`}
                                >
                                  ⋮⋮
                                </button>
                                <span className="rank-index">#{index + 1}</span>
                                <ColorChip
                                  color={color}
                                  draggable={false}
                                />
                                <button onClick={() => removeColorFromRank(color.id)}>↩</button>
                              </div>
                            </div>
                          );
                        })}
                        <div
                          className="rank-drop-line rank-drop-line-end"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            dropColorIntoRank(rankedColors.length);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <button onClick={() => setSurveyStage(1)}>Назад к этапу 1</button>
                    <button className="primary" onClick={submitSurvey} disabled={!allColorsRanked}>
                      Завершить прохождение
                    </button>
                  </div>
                </div>
              )}

              {surveyStatus && <div className="hint">{surveyStatus}</div>}
            </section>
          </div>
        </main>
      )}

      {activeTab === 'results' && (
        <main className="grid one-column">
          <section className="card">
            <div className="card-head">
              <h2>Результаты пользователя</h2>
              <div className="row">
                <button onClick={downloadUserResultsXlsx}>Скачать XLSX</button>
                <button onClick={loadResults}>Обновить</button>
              </div>
            </div>

            {resultsStatus && <div className="hint">{resultsStatus}</div>}
            {xlsxStatus && <div className="hint">{xlsxStatus}</div>}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Проект</th>
                    <th>Прогоны</th>
                    <th>Последнее прохождение</th>
                    <th>Итоговые метрики</th>
                  </tr>
                </thead>
                <tbody>
                  {userResults.map((row) => (
                    <tr key={`${row.user_id}_${row.project_id}`}>
                      <td>{row.user_name}</td>
                      <td>{row.project_name}</td>
                      <td>{row.runs_count}</td>
                      <td>{new Date(row.last_completed_at).toLocaleString()}</td>
                      <td>
                        {Object.entries(row.latest_metrics).map(([name, value]) => (
                          <div key={name}>
                            {name}: <strong>{value}</strong>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                  {!userResults.length && (
                    <tr>
                      <td colSpan={5}>Нет данных</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Реестр прохождений</h2>
            </div>

            <div className="row filter-row">
              <label>
                Проект
                <select
                  value={runsFilter.project_id}
                  onChange={(event) =>
                    setRunsFilter((prev) => ({ ...prev, project_id: event.target.value }))
                  }
                >
                  <option value="">Все</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Пользователь
                <select
                  value={runsFilter.user_id}
                  onChange={(event) =>
                    setRunsFilter((prev) => ({ ...prev, user_id: event.target.value }))
                  }
                >
                  <option value="">Все</option>
                  {syntheticUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.display_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                С
                <input
                  type="datetime-local"
                  value={runsFilter.date_from}
                  onChange={(event) =>
                    setRunsFilter((prev) => ({ ...prev, date_from: event.target.value }))
                  }
                />
              </label>
              <label>
                По
                <input
                  type="datetime-local"
                  value={runsFilter.date_to}
                  onChange={(event) =>
                    setRunsFilter((prev) => ({ ...prev, date_to: event.target.value }))
                  }
                />
              </label>
              <button onClick={loadResults}>Применить фильтры</button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Кто</th>
                    <th>Когда</th>
                    <th>Проект</th>
                    <th>Метрики / показатели</th>
                  </tr>
                </thead>
                <tbody>
                  {surveyRuns.map((run) => (
                    <tr key={run.id}>
                      <td>{run.user_name_snapshot}</td>
                      <td>{new Date(run.completed_at).toLocaleString()}</td>
                      <td>{run.project_name_snapshot}</td>
                      <td>
                        {Object.entries(run.calculated_metrics).map(([name, value]) => (
                          <div key={name}>
                            {name}: <strong>{value}</strong>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                  {!surveyRuns.length && (
                    <tr>
                      <td colSpan={4}>Нет прохождений</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

function ColorChip({ color, ...rest }) {
  return (
    <div className="color-chip" style={{ backgroundColor: color.hex }} {...rest}>
      <span>{color.label}</span>
    </div>
  );
}

function MatrixEditor({ title, rowLabels, colLabels, matrix, onChange, symmetric = false }) {
  return (
    <div className="matrix-card">
      <h3>{title}</h3>
      <div className="table-wrap">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Concept</th>
              {colLabels.map((label, index) => (
                <th key={`${label}_${index}`}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((rowLabel, rowIndex) => (
              <tr key={`${rowLabel}_${rowIndex}`}>
                <td>{rowLabel}</td>
                {colLabels.map((_, colIndex) => {
                  const cellValue = Number(matrix?.[rowIndex]?.[colIndex] ?? 0).toFixed(1);
                  const isLocked = symmetric && colIndex >= rowIndex;
                  return (
                    <td key={`${rowIndex}_${colIndex}`}>
                      {isLocked ? (
                        <div className="matrix-cell-readonly">{cellValue}</div>
                      ) : (
                        <select
                          value={cellValue}
                          onChange={(event) => onChange(rowIndex, colIndex, event.target.value)}
                        >
                          {VALUE_OPTIONS.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
