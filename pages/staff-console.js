import { useEffect, useState } from 'react';
import { getAllTestResults, mapTestResultsToTags, getChatId } from '../lib/profiling/profilingUtils';

const CHAT_HISTORY_KEY = 'benehab_chat_history';

const defaultStaffChat = [
    {
      id: 1,
      sender: 'doctor',
      message: 'Patient has been missing appointments and reports fatigue. Should we adjust medication?',
      timestamp: '2025-01-20 14:30'
    },
    {
      id: 2,
      sender: 'agent',
      message: 'Based on patient\'s fatigue score (8/10) and missed visits, I suggest not changing the medication but scheduling motivational support.',
      timestamp: '2025-01-20 14:31',
      source: 'SNOMED / dm+d / NHS.uk'
    },
    {
      id: 3,
      sender: 'doctor',
      message: 'What about the Metformin side effects?',
      timestamp: '2025-01-20 14:32'
    },
    {
      id: 4,
      sender: 'agent',
      message: 'Metformin (VMP 321028006) is not known to cause fatigue; primary cause is likely behavioral.',
      timestamp: '2025-01-20 14:33',
      source: 'SNOMED / dm+d / NHS.uk'
    }
  ];

export default function StaffConsolePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    patientInfo: false,
    medication: false,
    concerns: false,
    adherence: false,
    riskLevel: false
  });
  const [chatMessages, setChatMessages] = useState(defaultStaffChat);
  const [newMessage, setNewMessage] = useState('');
  const [overrideForms, setOverrideForms] = useState({
    attitude: '',
    typology: '',
    values: '',
    demographics: ''
  });
  const [overrideStatus, setOverrideStatus] = useState('');
  const [pibStatus, setPibStatus] = useState('');
  const [backendInstructionStatus, setBackendInstructionStatus] = useState('');
  const [clearStatus, setClearStatus] = useState('');
  const [localStorageStatus, setLocalStorageStatus] = useState('');
  const [instructionsPreview, setInstructionsPreview] = useState({
    patient_tags: [],
    dos: [],
    donts: [],
    specific_instructions: ''
  });
  const [colorMetrics, setColorMetrics] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [metricForm, setMetricForm] = useState({
    metric_name: '',
    similarity_same_weights: [],
    similarity_diff_weights: [],
    attractiveness_rank_weights: [],
  });
  const [colorInputs, setColorInputs] = useState({ colors: [], concepts: [] });
  const [conceptInput, setConceptInput] = useState('');
  const [conceptsStatus, setConceptsStatus] = useState('');
  const [metricStatus, setMetricStatus] = useState('');
  const [metricsLoaded, setMetricsLoaded] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'psychological', label: 'Psychological Profile' },
    { id: 'behavioral', label: 'Behavioral Metrics' },
    { id: 'chat', label: 'Agent Chat' },
    { id: 'profiling-overrides', label: 'Profiling Overrides' },
    { id: 'color-metrics', label: 'Color Metrics' }
  ];

  const safeParse = (value) => {
    if (!value) return null;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (err) {
      console.error('Error parsing JSON', err);
      return null;
    }
  };

  const matrixValueOptions = Array.from({ length: 11 }, (_, idx) => (idx / 10).toFixed(1));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((msg, index) => ({
            id: msg.id || index,
            sender: msg.type === 'user' ? 'patient' : 'agent',
            message: msg.text,
            timestamp: msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''
          }));
          setChatMessages(mapped);
        }
      } catch (error) {
        console.error('Error loading chat history for staff console:', error);
      }
    }

    loadProfilesFromBackend();
    loadInstructionsPreview();
    loadColorTestInputs();
    loadMetrics();
  }, []);

  useEffect(() => {
    // When inputs or metrics arrive, normalize current selection or pick the first available
    if (!metricsLoaded) return;
    if (colorInputs.concepts.length === 0 || colorInputs.colors.length === 0) return;

    const refreshedSelection = selectedMetric
      ? colorMetrics.find((m) => m.metric_name === selectedMetric.metric_name)
      : null;

    const metricToUse = refreshedSelection || selectedMetric || colorMetrics[0];

    if (metricToUse) handleSelectMetric(metricToUse);
  }, [colorInputs, colorMetrics, metricsLoaded, selectedMetric]); 

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const doctorMessage = {
        id: chatMessages.length + 1,
        sender: 'doctor',
        message: newMessage,
        timestamp: new Date().toLocaleString()
      };
      setChatMessages([...chatMessages, doctorMessage]);
      setNewMessage('');
    }
  };

  const handleOverrideChange = (key, value) => {
    setOverrideForms(prev => ({ ...prev, [key]: value }));
  };

  const saveOverrides = async () => {
    if (typeof window === 'undefined') return;
    setOverrideStatus('');

    const userId = localStorage.getItem('benehab_user_id');
    if (!userId) {
      setOverrideStatus('User is not created. Fill demographics to create user.');
      return;
    }

    try {
      const parsedAttitude = overrideForms.attitude ? JSON.parse(overrideForms.attitude) : null;
      const parsedTypology = overrideForms.typology ? JSON.parse(overrideForms.typology) : null;
      const parsedValues = overrideForms.values ? JSON.parse(overrideForms.values) : null;
      const parsedDemographics = overrideForms.demographics ? JSON.parse(overrideForms.demographics) : null;

      const baseUrl = typeof window === 'undefined'
        ? process.env.INTERNAL_API_URL
        : process.env.NEXT_PUBLIC_API_URL;
      const backendUrl = baseUrl || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/users/${userId}/profiles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attitude_profile: parsedAttitude,
          typology_profile: parsedTypology,
          values_profile: parsedValues,
          demographics: parsedDemographics
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to save overrides');
      }

      // Sync localStorage for compatibility with existing flows
      if (parsedAttitude) {
        localStorage.setItem('benehab_attitude_profile', JSON.stringify(parsedAttitude));
      }
      if (parsedTypology) {
        localStorage.setItem('benehab_typology_profile', JSON.stringify(parsedTypology));
      }
      if (parsedValues) {
        localStorage.setItem('benehab_values_profile', JSON.stringify(parsedValues));
      }
      if (parsedDemographics) {
        localStorage.setItem('benehab_demographics', JSON.stringify(parsedDemographics));
      }

      setOverrideStatus('Profiles saved to backend and synced locally.');
    } catch (error) {
      console.error('Error saving overrides:', error);
      setOverrideStatus(`Error: ${error.message}`);
    }
  };

  const regeneratePIB = async () => {
    if (typeof window === 'undefined') return;
    setPibStatus('Regenerating...');
    try {
      const response = await fetch('/api/profiling/pib', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          demographics: JSON.parse(localStorage.getItem('benehab_demographics') || '{}'),
          attitude_profile: JSON.parse(localStorage.getItem('benehab_attitude_profile') || '{}'),
          typology_profile: JSON.parse(localStorage.getItem('benehab_typology_profile') || '{}'),
          values_profile: JSON.parse(localStorage.getItem('benehab_values_profile') || '{}')
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to regenerate PIB');
      }

      const result = await response.json();
      localStorage.setItem('benehab.pib', JSON.stringify(result.pib));
      setPibStatus('✅ PIB regenerated and saved to localStorage.');
    } catch (error) {
      console.error('Error regenerating PIB:', error);
      setPibStatus(`Error: ${error.message}`);
    }
  };

  const loadInstructionsPreview = async () => {
    if (typeof window === 'undefined') return;
    const chatId = getChatId();
    if (!chatId) {
      setInstructionsPreview({
        patient_tags: [],
        dos: [],
        donts: [],
        specific_instructions: ''
      });
      return;
    }
    try {
      const response = await fetch(`/api/chats/${chatId}/instructions`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setInstructionsPreview(data);
    } catch (error) {
      console.error('Error loading instructions preview:', error);
    }
  };

  const loadProfilesFromBackend = async () => {
    if (typeof window === 'undefined') return;
    const userId = localStorage.getItem('benehab_user_id');
    if (!userId) {
      setOverrideStatus('User is not created. Fill demographics to create user.');
      return;
    }

    try {
      const baseUrl = typeof window === 'undefined'
        ? process.env.INTERNAL_API_URL
        : process.env.NEXT_PUBLIC_API_URL;
      const backendUrl = baseUrl || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/users/${userId}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to load user profiles');
      }
      const data = await response.json();

      const fromLocal = (key) => {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        } catch (err) {
          console.error(`Error parsing ${key} from localStorage`, err);
          return null;
        }
      };

      const attitudeProfile = data.attitude_profile || fromLocal('benehab_attitude_profile') || null;
      const typologyProfile = data.typology_profile || fromLocal('benehab_typology_profile') || null;
      const valuesProfile = data.values_profile || fromLocal('benehab_values_profile') || null;
      const demographicsProfile = data.demographics || fromLocal('benehab_demographics') || null;

      setOverrideForms({
        attitude: attitudeProfile ? JSON.stringify(attitudeProfile, null, 2) : '',
        typology: typologyProfile ? JSON.stringify(typologyProfile, null, 2) : '',
        values: valuesProfile ? JSON.stringify(valuesProfile, null, 2) : '',
        demographics: demographicsProfile ? JSON.stringify(demographicsProfile, null, 2) : ''
      });

      // Sync localStorage for other flows
      if (attitudeProfile) {
        localStorage.setItem('benehab_attitude_profile', JSON.stringify(attitudeProfile));
      }
      if (typologyProfile) {
        localStorage.setItem('benehab_typology_profile', JSON.stringify(typologyProfile));
      }
      if (valuesProfile) {
        localStorage.setItem('benehab_values_profile', JSON.stringify(valuesProfile));
      }
      if (demographicsProfile) {
        localStorage.setItem('benehab_demographics', JSON.stringify(demographicsProfile));
      }

      setOverrideStatus('Profiles loaded from backend.');
    } catch (error) {
      console.error('Error loading profiles:', error);
      setOverrideStatus(`Error loading profiles: ${error.message}`);
      // Try fallback to localStorage when backend unavailable
      const localAtt = localStorage.getItem('benehab_attitude_profile');
      const localTyp = localStorage.getItem('benehab_typology_profile');
      const localVal = localStorage.getItem('benehab_values_profile');
      const localDemo = localStorage.getItem('benehab_demographics');
      if (localAtt || localTyp || localVal || localDemo) {
        setOverrideForms({
          attitude: localAtt ? JSON.stringify(JSON.parse(localAtt), null, 2) : '',
          typology: localTyp ? JSON.stringify(JSON.parse(localTyp), null, 2) : '',
          values: localVal ? JSON.stringify(JSON.parse(localVal), null, 2) : '',
          demographics: localDemo ? JSON.stringify(JSON.parse(localDemo), null, 2) : ''
        });
        setOverrideStatus('Loaded profiles from localStorage (backend unavailable).');
      }
    }
  };

  const resetOverride = async (key) => {
    if (typeof window === 'undefined') return;
    const storageKeysMap = {
      attitude: ['benehab_attitude_profile', 'benehab_attitude_answers'],
      typology: ['benehab_typology_profile', 'benehab_typology_answers'],
      values: [
        'benehab_values_profile',
        'benehab_values_colors',
        'benehab_values_color_rankings',
        'benehab_color_test_result',
      ],
      demographics: ['benehab_demographics'],
    };
    const payloadKeyMap = {
      attitude: 'attitude_profile',
      typology: 'typology_profile',
      values: 'values_profile',
      demographics: 'demographics',
    };

    const payloadKey = payloadKeyMap[key];
    const userId = localStorage.getItem('benehab_user_id');

    if (userId && payloadKey) {
      try {
        await fetch(`/api/users/${userId}/profiles`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [payloadKey]: null }),
        });
      } catch (err) {
        console.error('Error resetting override on backend:', err);
      }
    }

    // Always clear localStorage copies
    (storageKeysMap[key] || []).forEach((k) => localStorage.removeItem(k));
    setOverrideForms((prev) => ({ ...prev, [key]: '' }));
    setOverrideStatus(
      `Cleared ${key} profile ${userId ? '(backend + localStorage)' : '(localStorage)'}`
    );
  };

  const loadColorTestInputs = async () => {
    try {
      const response = await fetch('/api/color-tests/inputs');
      if (response.ok) {
        const data = await response.json();
        const colors = data.colors || [];
        const concepts = data.concepts || [];
        setColorInputs((prev) => ({
          ...prev,
          colors,
          concepts,
        }));
        setConceptList(concepts, '', colors.length);
      }
    } catch (err) {
      console.error('Error loading color test inputs:', err);
    }
  };

  const ensureMatrices = (same, diff, rank) => {
    const n =
      colorInputs.concepts.length ||
      Math.max(same?.length || 0, diff?.length || 0);
    const r =
      colorInputs.colors.length ||
      Math.max(rank?.[0]?.length || 0, rank?.length || 0);

    const fillMatrix = (mat) => {
      const out = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => Number(mat?.[i]?.[j] ?? 0))
      );
      return out;
    };

    const fillRank = (mat) => {
      const out = Array.from({ length: n }, (_, i) =>
        Array.from({ length: r }, (_, j) => Number(mat?.[i]?.[j] ?? 0))
      );
      return out;
    };

    return {
      same: fillMatrix(same),
      diff: fillMatrix(diff),
      rank: fillRank(rank),
    };
  };

  const resizeMatricesForConcepts = (nextConcepts, rankColumnsOverride) => {
    setMetricForm((prev) => {
      const normalized = ensureMatrices(
        prev.similarity_same_weights,
        prev.similarity_diff_weights,
        prev.attractiveness_rank_weights
      );
      const conceptCount = nextConcepts.length;
      const rankColumns =
        normalized.rank?.[0]?.length ||
        rankColumnsOverride ||
        colorInputs.colors.length ||
        0;

      const resizeSquare = (mat) =>
        Array.from({ length: conceptCount }, (_, i) =>
          Array.from({ length: conceptCount }, (_, j) => Number(mat?.[i]?.[j] ?? 0))
        );

      const resizeRank = (mat) =>
        Array.from({ length: conceptCount }, (_, i) =>
          Array.from({ length: rankColumns }, (_, j) => Number(mat?.[i]?.[j] ?? 0))
        );

      return {
        ...prev,
        similarity_same_weights: resizeSquare(normalized.same),
        similarity_diff_weights: resizeSquare(normalized.diff),
        attractiveness_rank_weights: resizeRank(normalized.rank),
      };
    });
  };

  const setConceptList = (nextConcepts, statusMessage = '', rankColumnsOverride) => {
    const cleaned = nextConcepts.map((c) => c.trim()).filter(Boolean);
    resizeMatricesForConcepts(cleaned, rankColumnsOverride);
    setColorInputs((prev) => ({ ...prev, concepts: cleaned }));
    setConceptsStatus(statusMessage);
  };

  const handleAddConcept = () => {
    const normalized = conceptInput.trim();
    if (!normalized) return;
    if (colorInputs.concepts.some((c) => c.toLowerCase() === normalized.toLowerCase())) {
      setConceptsStatus('Такое понятие уже есть.');
      return;
    }
    persistConcepts([...colorInputs.concepts, normalized], 'Понятие добавлено.');
    setConceptInput('');
  };

  const handleRemoveConcept = (concept) => {
    const next = colorInputs.concepts.filter((c) => c !== concept);
    persistConcepts(next, 'Понятие удалено.');
  };

  const persistConcepts = async (nextConcepts, successMessage = '') => {
    setConceptsStatus('Сохраняем понятия на бэкенд...');
    try {
      const resp = await fetch('/api/color-tests/concepts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concepts: nextConcepts }),
      });
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      const data = await resp.json();
      setConceptList(
        data.concepts || nextConcepts,
        successMessage || 'Список понятий сохранён.'
      );
    } catch (err) {
      console.error('Error saving concepts:', err);
      setConceptsStatus(`Ошибка сохранения понятий: ${err.message}`);
      // Reload current list to stay in sync
      loadColorTestInputs();
    }
  };

  const ConceptMatrixEditor = ({ concepts, matrix, onChange, compact = false, onSet }) => {
    const [rowIdx, setRowIdx] = useState(0);
    const [colIdx, setColIdx] = useState(0);
    const [val, setVal] = useState(0);

    useEffect(() => {
      if (matrix?.[rowIdx]?.[colIdx] !== undefined) {
        setVal(matrix[rowIdx][colIdx]);
      }
    }, [rowIdx, colIdx, matrix]);

    const updateCell = (r, cc, nextVal) => {
      const numeric = Number(nextVal);
      const normalized = Number.isFinite(numeric) ? numeric : 0;
      const next = matrix.map((row, rowIdxValue) =>
        row.map((c, colIdxValue) =>
          rowIdxValue === r && colIdxValue === cc ? normalized : c
        )
      );
      onChange(next);
      if (onSet) onSet(next);
    };

    const apply = () => {
      const num = Number(val) || 0;
      const next = matrix.map((row, r) =>
        row.map((c, cc) => (r === rowIdx && cc === colIdx ? num : c))
      );
      onChange(next);
      if (onSet) onSet(next);
    };

    const renderTable = () => (
          <div className="max-h-64 overflow-auto border rounded-lg text-xs">
            <table className="min-w-full text-left text-gray-700">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-2 py-1 sticky left-0 bg-gray-50 z-10">Concept</th>
                  {concepts.map((c, idx) => (
                    <th key={c} className="px-2 py-1 whitespace-nowrap">
                      {idx + 1}. {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, r) => (
                  <tr key={r} className={r % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1 font-medium whitespace-nowrap sticky left-0 bg-white z-10">
                      {r + 1}. {concepts[r]}
                    </td>
                    {row.map((c, cc) => {
                      const isInactive = cc >= r;
                      return (
                        <td key={cc} className="px-2 py-1">
                          {isInactive ? (
                            <div className="w-full rounded-md bg-gray-200 px-2 py-1 text-xs text-gray-500 text-right">
                              {(Number(c) || 0).toFixed(1)}
                            </div>
                          ) : (
                            <select
                              value={(Number(c) || 0).toFixed(1)}
                              onChange={(e) => updateCell(r, cc, e.target.value)}
                              className="w-full border rounded-md px-2 py-1 text-xs text-gray-700"
                            >
                              {matrixValueOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
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
    );

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm text-gray-700">Row:</label>
          <select
            value={rowIdx}
            onChange={(e) => setRowIdx(Number(e.target.value))}
            className="border rounded-lg px-2 py-1 text-sm"
          >
            {concepts.map((c, idx) => (
              <option key={c} value={idx}>
                {idx + 1}. {c}
              </option>
            ))}
          </select>
          <label className="text-sm text-gray-700">Col:</label>
          <select
            value={colIdx}
            onChange={(e) => setColIdx(Number(e.target.value))}
            className="border rounded-lg px-2 py-1 text-sm"
          >
            {concepts.map((c, idx) => (
              <option key={c} value={idx}>
                {idx + 1}. {c}
              </option>
            ))}
          </select>
          <label className="text-sm text-gray-700">Value:</label>
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            min="0"
            max="1"
            step="0.1"
            className="w-24 border rounded-lg px-2 py-1 text-sm"
          />
          <button
            onClick={apply}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Set
          </button>
        </div>
        {!compact && renderTable()}
      </div>
    );
  };

  const RankMatrixEditor = ({ concepts, colors, matrix, onChange, onSet }) => {
    const [conceptIdx, setConceptIdx] = useState(0);
    const [colorIdx, setColorIdx] = useState(0);
    const [val, setVal] = useState(0);

    useEffect(() => {
      if (matrix?.[conceptIdx]?.[colorIdx] !== undefined) {
        setVal(matrix[conceptIdx][colorIdx]);
      }
    }, [conceptIdx, colorIdx, matrix]);

    const updateCell = (r, cc, nextVal) => {
      const numeric = Number(nextVal);
      const normalized = Number.isFinite(numeric) ? numeric : 0;
      const next = matrix.map((row, rowIdxValue) =>
        row.map((c, colIdxValue) =>
          rowIdxValue === r && colIdxValue === cc ? normalized : c
        )
      );
      onChange(next);
      if (onSet) onSet(next);
    };

    const apply = () => {
      const num = Number(val) || 0;
      const next = matrix.map((row, r) =>
        row.map((c, cc) => (r === conceptIdx && cc === colorIdx ? num : c))
      );
      onChange(next);
      if (onSet) onSet(next);
    };

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm text-gray-700">Concept:</label>
          <select
            value={conceptIdx}
            onChange={(e) => setConceptIdx(Number(e.target.value))}
            className="border rounded-lg px-2 py-1 text-sm"
          >
            {concepts.map((c, idx) => (
              <option key={c} value={idx}>
                {idx + 1}. {c}
              </option>
            ))}
          </select>
          <label className="text-sm text-gray-700">Color/Rank:</label>
          <select
            value={colorIdx}
            onChange={(e) => setColorIdx(Number(e.target.value))}
            className="border rounded-lg px-2 py-1 text-sm"
          >
            {colors.map((c, idx) => (
              <option key={c} value={idx}>
                {idx + 1}
              </option>
            ))}
          </select>
          <label className="text-sm text-gray-700">Value:</label>
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            min="0"
            max="1"
            step="0.1"
            className="w-24 border rounded-lg px-2 py-1 text-sm"
          />
          <button
            onClick={apply}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Set
          </button>
        </div>
        <div className="max-h-64 overflow-auto border rounded-lg text-xs">
          <table className="min-w-full text-left text-gray-700">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-2 py-1 sticky left-0 bg-gray-50 z-10">Concept \\ Color</th>
                {colors.map((c, idx) => (
                  <th key={c} className="px-2 py-1 whitespace-nowrap text-center">
                    {idx + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, r) => (
                <tr key={r} className={r % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1 font-medium whitespace-nowrap sticky left-0 bg-white z-10">
                      {r + 1}. {concepts[r]}
                    </td>
                    {row.map((c, cc) => (
                      <td key={cc} className="px-2 py-1">
                        <select
                          value={(Number(c) || 0).toFixed(1)}
                          onChange={(e) => updateCell(r, cc, e.target.value)}
                          className="w-full border rounded-md px-2 py-1 text-xs text-gray-700"
                        >
                          {matrixValueOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setColorMetrics(data || []);
      if (!data || !data.length) {
        handleSelectMetric(null);
      }
      setMetricsLoaded(true);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setMetricStatus(`Error loading metrics: ${err.message}`);
    }
  };

  const handleSelectMetric = (metric) => {
    if (!metric) {
      setSelectedMetric(null);
      setMetricForm({
        metric_name: '',
        similarity_same_weights: [],
        similarity_diff_weights: [],
        attractiveness_rank_weights: [],
      });
      return;
    }
    setSelectedMetric(metric);
    const normalized = ensureMatrices(
      metric.similarity_same_weights,
      metric.similarity_diff_weights,
      metric.attractiveness_rank_weights
    );
    setMetricForm({
      metric_name: metric.metric_name || '',
      similarity_same_weights: normalized.same,
      similarity_diff_weights: normalized.diff,
      attractiveness_rank_weights: normalized.rank,
    });
  };

  const handleMetricFieldChange = (field, value) => {
    setMetricForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveMetric = async (overrides = {}) => {
    setMetricStatus('');
    try {
      const resolvedName =
        (overrides.metric_name || metricForm.metric_name || '').trim() ||
        selectedMetric?.metric_name ||
        'default';
      if (!metricForm.metric_name.trim() && !overrides.metric_name) {
        setMetricForm((prev) => ({ ...prev, metric_name: resolvedName }));
      }
      const normalized = ensureMatrices(
        overrides.similarity_same_weights ?? metricForm.similarity_same_weights,
        overrides.similarity_diff_weights ?? metricForm.similarity_diff_weights,
        overrides.attractiveness_rank_weights ?? metricForm.attractiveness_rank_weights
      );
      const body = {
        metric_name: resolvedName,
        similarity_same_weights: normalized.same,
        similarity_diff_weights: normalized.diff,
        attractiveness_rank_weights: normalized.rank,
      };
      console.log('Saving metric', body.metric_name);
      let resp = await fetch(`/api/metrics/${body.metric_name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (resp.status === 404) {
        resp = await fetch('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      setMetricStatus(`Metric "${body.metric_name}" saved`);
      await loadMetrics();
    } catch (err) {
      console.error('Error saving metric:', err);
      setMetricStatus(`Error saving metric: ${err.message}`);
    }
  };

  const createMetric = async () => {
    setMetricStatus('');
    try {
      const normalized = ensureMatrices(
        metricForm.similarity_same_weights,
        metricForm.similarity_diff_weights,
        metricForm.attractiveness_rank_weights
      );
      const body = {
        metric_name: metricForm.metric_name.trim() || `metric_${Date.now()}`,
        similarity_same_weights: normalized.same,
        similarity_diff_weights: normalized.diff,
        attractiveness_rank_weights: normalized.rank,
      };
      const resp = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      setMetricStatus('Metric created');
      await loadMetrics();
    } catch (err) {
      console.error('Error creating metric:', err);
      setMetricStatus(`Error creating metric: ${err.message}`);
    }
  };

  const deleteMetric = async (metricName) => {
    setMetricStatus('');
    try {
      const resp = await fetch(`/api/metrics/${metricName}`, { method: 'DELETE' });
      if (!resp.ok && resp.status !== 204) {
        throw new Error(await resp.text());
      }
      setMetricStatus('Metric deleted');
      await loadMetrics();
      handleSelectMetric(null);
    } catch (err) {
      console.error('Error deleting metric:', err);
      setMetricStatus(`Error deleting metric: ${err.message}`);
    }
  };

  const setSingleMatrixValue = (type, i, j, value) => {
    const normalized = ensureMatrices(
      metricForm.similarity_same_weights,
      metricForm.similarity_diff_weights,
      metricForm.attractiveness_rank_weights
    );
    const matKey =
      type === 'same' ? 'similarity_same_weights' : 'similarity_diff_weights';
    const mat = type === 'same' ? normalized.same : normalized.diff;
    const next = mat.map((row, ri) =>
      row.map((col, cj) => {
        if ((ri === i && cj === j) || (type === 'same' && ri === j && cj === i)) {
          return value;
        }
        return col;
      })
    );
    setMetricForm((prev) => ({ ...prev, [matKey]: next }));
  };

  const setRankValue = (i, colorIndex, value) => {
    const normalized = ensureMatrices(
      metricForm.similarity_same_weights,
      metricForm.similarity_diff_weights,
      metricForm.attractiveness_rank_weights
    );
    const mat = normalized.rank.map((row, ri) =>
      row.map((col, cj) => {
        if (ri === i && cj === colorIndex) {
          return value;
        }
        return col;
      })
    );
    setMetricForm((prev) => ({ ...prev, attractiveness_rank_weights: mat }));
  };

  const zeroMatrices = () => {
    const n = colorInputs.concepts.length || 0;
    const r = colorInputs.colors.length || 0;
    const zerosSame = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
    const zerosRank = Array.from({ length: n }, () => Array.from({ length: r }, () => 0));
    setMetricForm((prev) => ({
      ...prev,
      similarity_same_weights: zerosSame,
      similarity_diff_weights: zerosSame.map((row) => [...row]),
      attractiveness_rank_weights: zerosRank,
    }));
  };

  const updateBackendInstructions = async () => {
    if (typeof window === 'undefined') return;
    setBackendInstructionStatus('');

    const chatId = getChatId();
    if (!chatId) {
      setBackendInstructionStatus('Чат не инициализирован. Сначала создайте чат на главной.');
      return;
    }

    const testResults = getAllTestResults();
    if (!testResults) {
      setBackendInstructionStatus('Нет профилей в localStorage. Сохраните overrides или пройдите тесты.');
      return;
    }

    const patientTags = mapTestResultsToTags(testResults);
    if (!patientTags.length) {
      setBackendInstructionStatus('Не удалось сформировать теги из профилей.');
      return;
    }

    try {
      setBackendInstructionStatus('Обновляем инструкции на бэкенде...');
      const response = await fetch(`/api/chats/${chatId}/refresh-instructions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_tags: patientTags })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'API error');
      }

      setBackendInstructionStatus('✅ Инструкции обновлены на бэкенде.');
      loadInstructionsPreview();
    } catch (error) {
      console.error('Error updating backend instructions:', error);
      setBackendInstructionStatus(`Error: ${error.message}`);
    }
  };

  const clearChatHistory = async () => {
    if (typeof window === 'undefined') return;
    setClearStatus('');

    const chatId = getChatId();
    if (!chatId) {
      setClearStatus('Чат не инициализирован. Сначала создайте чат на главной.');
      return;
    }

    try {
      setClearStatus('Очищаем чат на бэкенде...');
      const response = await fetch(`/api/chats/${chatId}/clear-history`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'API error');
      }

      // Clear local chat history for frontend
      localStorage.removeItem(CHAT_HISTORY_KEY);
      setChatMessages([]);

      setClearStatus('✅ История чата очищена (backend + локально).');
      loadInstructionsPreview();
    } catch (error) {
      console.error('Error clearing chat history:', error);
      setClearStatus(`Error: ${error.message}`);
    }
  };

  const clearAllLocalStorage = () => {
    if (typeof window === 'undefined') return;
    setLocalStorageStatus('');

    const confirmed = window.confirm(
      'Это удалит все данные из localStorage для этого домена. Продолжить?'
    );
    if (!confirmed) return;

    localStorage.clear();

    setOverrideForms({
      attitude: '',
      typology: '',
      values: '',
      demographics: ''
    });
    setInstructionsPreview({
      patient_tags: [],
      dos: [],
      donts: [],
      specific_instructions: ''
    });
    setChatMessages([]);
    setOverrideStatus('');
    setPibStatus('');
    setBackendInstructionStatus('');
    setClearStatus('');
    setLocalStorageStatus('✅ localStorage полностью очищен.');
  };

  const handleMarkCompleted = (visit) => {
    alert(`Marked "${visit}" as completed`);
  };

  const handleReschedule = (visit) => {
    alert(`Rescheduling "${visit}"`);
  };

  const sendNotification = () => {
    setShowNotificationModal(true);
    setTimeout(() => setShowNotificationModal(false), 3000);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Care-Team Console</h1>
              <p className="text-blue-100 mt-1">Clinical & Behavioral Overview</p>
            </div>
            <button
              onClick={sendNotification}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Send Notification
            </button>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Sent</h3>
              <p className="text-gray-600">Reminder sent to patient</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Profile Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Profile</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">Sarah Johnson</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">42 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="font-medium">PAT-2024-001234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-medium">Type 2 Diabetes Mellitus</span>
                  </div>
                  <div className="text-xs text-gray-500">(SNOMED 44054006)</div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Medication:</span>
                    <span className="font-medium">Metformin 500 mg tablet</span>
                  </div>
                  <div className="text-xs text-gray-500">(dm+d 321028006)</div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Visit Plan</h4>
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-3 py-2 text-sm text-gray-900">Endocrinology Check</td>
                          <td className="px-3 py-2 text-sm text-gray-900">2025-10-24</td>
                          <td className="px-3 py-2 text-sm text-green-600">Planned</td>
                          <td className="px-3 py-2 text-sm">
                            <button
                              onClick={() => handleMarkCompleted('Endocrinology Check')}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                            >
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleReschedule('Endocrinology Check')}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Reschedule
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-sm text-gray-900">Dietitian Coaching</td>
                          <td className="px-3 py-2 text-sm text-gray-900">2025-10-27</td>
                          <td className="px-3 py-2 text-sm text-green-600">Planned</td>
                          <td className="px-3 py-2 text-sm">
                            <button
                              onClick={() => handleMarkCompleted('Dietitian Coaching')}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                            >
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleReschedule('Dietitian Coaching')}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Reschedule
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-sm text-gray-900">GP Follow-up</td>
                          <td className="px-3 py-2 text-sm text-gray-900">2025-10-31</td>
                          <td className="px-3 py-2 text-sm text-red-600">Missed (2x history)</td>
                          <td className="px-3 py-2 text-sm">
                            <button
                              onClick={() => handleReschedule('GP Follow-up')}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Reschedule
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Engagement Summary Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last agent contact:</span>
                    <span className="font-medium">2 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adherence:</span>
                    <span className="font-medium">76%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk of Dropout:</span>
                    <span className="font-medium text-orange-600">Medium (0.54)</span>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Quick Stats</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Trust in Treatment</span>
                        <span className="text-sm font-medium">7/10</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Fatigue Barrier</span>
                        <span className="text-sm font-medium text-red-600">8/10</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Awareness</span>
                        <span className="text-sm font-medium text-green-600">9/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Psychological Profile Tab */}
          {activeTab === 'psychological' && (
            <div className="space-y-6">
              {/* Assessment Results */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">7.2</div>
                    <div className="text-sm text-gray-600">Anxiety Scale</div>
                    <div className="text-xs text-gray-500">(0-10 scale)</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">6.8</div>
                    <div className="text-sm text-gray-600">Self-Efficacy</div>
                    <div className="text-xs text-gray-500">(0-10 scale)</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">8.1</div>
                    <div className="text-sm text-gray-600">Health Awareness</div>
                    <div className="text-xs text-gray-500">(0-10 scale)</div>
                  </div>
                </div>
              </div>

              {/* Psychotype and Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Psychotype Analysis</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-600">Primary Type:</span>
                      <span className="font-medium ml-2">Anxious-Responsible</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Key Barriers:</span>
                      <ul className="mt-1 text-sm text-gray-700">
                        <li>• Fear of side effects</li>
                        <li>• Low self-efficacy</li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-gray-600">Motivational Triggers:</span>
                      <ul className="mt-1 text-sm text-gray-700">
                        <li>• Praise and reassurance</li>
                        <li>• Sense of control</li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-gray-600">Tone of Voice:</span>
                      <span className="font-medium ml-2">Soft, explanatory, non-directive</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Recommendations</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Communication Style</div>
                      <div className="text-sm text-blue-700">Speak calmly, highlight stability</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-900">Motivation Strategy</div>
                      <div className="text-sm text-green-700">Reinforce small wins</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-sm font-medium text-red-900">Avoid</div>
                      <div className="text-sm text-red-700">Threat-based motivation</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Behavioral Metrics Tab */}
          {activeTab === 'behavioral' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Behavioral Metrics</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Proactivity</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6.2/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↗ +0.3</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Moderate</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Motivation (Fear-based)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">4.1/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">↘ -0.5</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Awareness</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">9.0/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↗ +0.2</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">High</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Fears & Barriers</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">7.8/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">↗ +0.4</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">High</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Adherence</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">76%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↗ +5%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Moderate</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Emotional State</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5.4/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">↘ -0.8</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Moderate</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Trust in Treatment</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">7.0/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↗ +0.1</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Good</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Fatigue Barrier</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8.0/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">↗ +0.6</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">High</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Response to Reinforcement</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6.5/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">↗ +0.2</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Moderate</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Risk of Dropout</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.54</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">↗ +0.08</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Medium</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Agent Chat Tab */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Data Summary */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Data Summary</h3>
                <div className="space-y-3 text-sm">
                  {/* Patient Info */}
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('patientInfo')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Patient Information</div>
                        <div className="text-gray-600">Sarah Johnson, 42 • Type 2 Diabetes</div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.patientInfo ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.patientInfo && (
                      <div className="px-3 pb-3 border-t border-gray-200">
                        <div className="pt-3 space-y-2">
                          <div><span className="font-medium">Full Name:</span> Sarah Elizabeth Johnson</div>
                          <div><span className="font-medium">DOB:</span> March 15, 1982</div>
                          <div><span className="font-medium">Gender:</span> Female</div>
                          <div><span className="font-medium">Primary Diagnosis:</span> Type 2 Diabetes Mellitus (E11.9)</div>
                          <div><span className="font-medium">Secondary Diagnoses:</span> Hypertension (I10), Obesity (E66.9)</div>
                          <div><span className="font-medium">Allergies:</span> None known</div>
                          <div><span className="font-medium">Emergency Contact:</span> John Johnson (Spouse) - (555) 123-4567</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Medication */}
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('medication')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Current Medication</div>
                        <div className="text-gray-600">Metformin 500mg</div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.medication ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.medication && (
                      <div className="px-3 pb-3 border-t border-gray-200">
                        <div className="pt-3 space-y-2">
                          <div><span className="font-medium">Metformin:</span> 500mg twice daily with meals</div>
                          <div><span className="font-medium">Prescribed:</span> Dr. Smith, January 15, 2024</div>
                          <div><span className="font-medium">Last Refill:</span> December 20, 2024</div>
                          <div><span className="font-medium">Days Supply:</span> 30 days</div>
                          <div><span className="font-medium">Side Effects:</span> Mild gastrointestinal discomfort</div>
                          <div><span className="font-medium">Compliance:</span> 85% (missed 4 doses this month)</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Key Concerns */}
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('concerns')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Key Concerns</div>
                        <div className="text-gray-600">Fatigue (8/10), Missed visits</div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.concerns ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.concerns && (
                      <div className="px-3 pb-3 border-t border-gray-200">
                        <div className="pt-3 space-y-2">
                          <div><span className="font-medium">Fatigue Level:</span> 8/10 (High concern)</div>
                          <div><span className="font-medium">Missed Appointments:</span> 2 in last 3 months</div>
                          <div><span className="font-medium">Blood Sugar Control:</span> HbA1c 8.2% (Target: &lt;7%)</div>
                          <div><span className="font-medium">Weight Management:</span> +3kg in last 6 months</div>
                          <div><span className="font-medium">Exercise Compliance:</span> 2/5 days per week</div>
                          <div><span className="font-medium">Diet Adherence:</span> Moderate (60% compliance)</div>
                          <div><span className="font-medium">Stress Level:</span> High due to work pressure</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Adherence */}
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('adherence')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Adherence</div>
                        <div className="text-gray-600">76% (improving)</div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.adherence ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.adherence && (
                      <div className="px-3 pb-3 border-t border-gray-200">
                        <div className="pt-3 space-y-2">
                          <div><span className="font-medium">Medication Adherence:</span> 85% (Metformin)</div>
                          <div><span className="font-medium">Appointment Attendance:</span> 67% (4/6 appointments)</div>
                          <div><span className="font-medium">Dietary Guidelines:</span> 60% compliance</div>
                          <div><span className="font-medium">Exercise Routine:</span> 40% compliance</div>
                          <div><span className="font-medium">Blood Glucose Monitoring:</span> 70% (daily checks)</div>
                          <div><span className="font-medium">Overall Trend:</span> Improving (+12% vs last month)</div>
                          <div><span className="font-medium">Barriers:</span> Time constraints, forgetfulness</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Risk Level */}
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('riskLevel')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Risk Level</div>
                        <div className="text-orange-600">Medium dropout risk</div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.riskLevel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.riskLevel && (
                      <div className="px-3 pb-3 border-t border-gray-200">
                        <div className="pt-3 space-y-2">
                          <div><span className="font-medium">Dropout Risk Score:</span> 0.54 (Medium)</div>
                          <div><span className="font-medium">Risk Factors:</span> Missed appointments, high fatigue</div>
                          <div><span className="font-medium">Protective Factors:</span> Good medication compliance</div>
                          <div><span className="font-medium">Engagement Level:</span> Moderate (responds to messages)</div>
                          <div><span className="font-medium">Support System:</span> Strong (family support)</div>
                          <div><span className="font-medium">Previous Dropouts:</span> None</div>
                          <div><span className="font-medium">Intervention Needed:</span> Motivational support</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Window */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Chat</h3>
                
                {/* Chat Messages */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {chatMessages.map((msg) => {
                    const isDoctor = msg.sender === 'doctor';
                    const isPatient = msg.sender === 'patient';
                    const alignment = isDoctor ? 'justify-end' : 'justify-start';
                    const bubbleColor = isDoctor
                      ? 'bg-blue-600 text-white'
                      : isPatient
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'bg-gray-100 text-gray-900';
                    const timestampColor = isDoctor ? 'text-blue-100' : 'text-gray-500';

                    return (
                      <div key={msg.id} className={`flex ${alignment}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bubbleColor}`}>
                          <div className="text-xs font-semibold mb-1 capitalize">
                            {msg.sender || 'agent'}
                          </div>
                          <div className="text-sm">{msg.message}</div>
                          <div className={`text-xs mt-1 ${timestampColor}`}>
                            {msg.timestamp}
                          </div>
                          {msg.source && (
                            <div className="text-xs mt-1 text-gray-500 italic">
                              Source: {msg.source}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="border-t pt-4">
                  <div className="flex space-x-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message to the AI agent..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profiling Overrides Tab */}
          {activeTab === 'profiling-overrides' && (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Override Profiling Results</h3>
                    <p className="text-sm text-gray-600">
                      Paste JSON профили тестов, чтобы пересобрать результаты без повторного прохождения опросов.
                      После сохранения данные уйдут в backend (user profile) и синхронизируются локально.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={loadProfilesFromBackend}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Refresh from backend
                    </button>
                    <button
                      onClick={saveOverrides}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save overrides
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Attitude profile</label>
                      <button
                        onClick={() => resetOverride('attitude')}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Reset
                      </button>
                    </div>
                    <textarea
                      value={overrideForms.attitude}
                      onChange={(e) => handleOverrideChange('attitude', e.target.value)}
                      placeholder='{"levels":{"severity":"high"},"scales":{"severity":8}}'
                      className="w-full h-64 border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Typology profile</label>
                      <button
                        onClick={() => resetOverride('typology')}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Reset
                      </button>
                    </div>
                    <textarea
                      value={overrideForms.typology}
                      onChange={(e) => handleOverrideChange('typology', e.target.value)}
                      placeholder='{"leading_types":["cyclothymic","sensitive"]}'
                      className="w-full h-64 border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Values profile</label>
                      <button
                        onClick={() => resetOverride('values')}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Reset
                      </button>
                    </div>
                    <textarea
                      value={overrideForms.values}
                      onChange={(e) => handleOverrideChange('values', e.target.value)}
                      placeholder='{"value_indices":{"life_satisfaction":55,"treatment_attitude":72}}'
                      className="w-full h-64 border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Demographics</label>
                      <button
                        onClick={() => resetOverride('demographics')}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Reset
                      </button>
                    </div>
                    <textarea
                      value={overrideForms.demographics}
                      onChange={(e) => handleOverrideChange('demographics', e.target.value)}
                      placeholder='{"name":"John","gender":"male","age":35,"weight":80,"height":180}'
                      className="w-full h-32 border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={regeneratePIB}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Regenerate PIB
                  </button>
                  <button
                    onClick={updateBackendInstructions}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Push instructions to backend
                  </button>
                  <button
                    onClick={clearChatHistory}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear chat history
                  </button>
                  <button
                    onClick={clearAllLocalStorage}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Clear localStorage
                  </button>
                </div>

                {overrideStatus && (
                  <div className="mt-3 text-sm text-gray-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
                    {overrideStatus}
                  </div>
                )}
                {pibStatus && (
                  <div className="mt-2 text-sm text-gray-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                    {pibStatus}
                  </div>
                )}
                {backendInstructionStatus && (
                  <div className="mt-2 text-sm text-gray-700 bg-purple-50 border border-purple-100 px-3 py-2 rounded-lg">
                    {backendInstructionStatus}
                  </div>
                )}
                {clearStatus && (
                  <div className="mt-2 text-sm text-gray-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                    {clearStatus}
                  </div>
                )}
                {localStorageStatus && (
                  <div className="mt-2 text-sm text-gray-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                    {localStorageStatus}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Patient tags</div>
                    <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[72px] whitespace-pre-wrap">
                      {instructionsPreview.patient_tags.join(', ') || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Dos (raw)</div>
                    <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[120px] whitespace-pre-wrap overflow-y-auto">
                      {instructionsPreview.dos.length ? instructionsPreview.dos.join('\n') : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Don'ts (raw)</div>
                    <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[120px] whitespace-pre-wrap overflow-y-auto">
                      {instructionsPreview.donts.length ? instructionsPreview.donts.join('\n') : '—'}
                    </div>
                  </div>
                </div>
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Specific instructions (LLM summary)</div>
                <div className="text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[140px] whitespace-pre-wrap">
                  {instructionsPreview.specific_instructions || '—'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Profiling snapshots</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-800">Attitude</div>
                    <span className="text-xs text-gray-500">levels & risks</span>
                  </div>
                  {(() => {
                    const att = safeParse(overrideForms.attitude);
                    if (!att) return <div className="text-sm text-gray-500">Нет данных</div>;
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(att.levels || {}).map(([scale, lvl]) => {
                            const color =
                              lvl === 'high'
                                ? 'bg-red-100 text-red-800'
                                : lvl === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800';
                            return (
                              <span key={scale} className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                                {scale.replace(/_/g, ' ')}: {lvl}
                              </span>
                            );
                          })}
                        </div>
                        {!!(att.risk_tags?.length) && (
                          <div className="text-xs text-gray-700">
                            <div className="font-medium mb-1">Риски:</div>
                            <div className="flex flex-wrap gap-2">
                              {att.risk_tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 rounded-full bg-red-50 text-red-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {!!(att.comm_flags?.length) && (
                          <div className="text-xs text-gray-700">
                            <div className="font-medium mb-1">Коммуникация:</div>
                            <div className="flex flex-wrap gap-2">
                              {att.comm_flags.map((flag) => (
                                <span key={flag} className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                                  {flag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-800">Typology</div>
                    <span className="text-xs text-gray-500">leading types & scores</span>
                  </div>
                  {(() => {
                    const typ = safeParse(overrideForms.typology);
                    if (!typ) return <div className="text-sm text-gray-500">Нет данных</div>;
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {(typ.leading_types || []).map((t) => (
                            <span key={t} className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                              {t}
                            </span>
                          ))}
                          {!(typ.leading_types || []).length && (
                            <span className="text-xs text-gray-500">Ведущие типы не определены</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {Object.entries(typ.scores || {}).map(([type, score]) => (
                            <div key={type} className="text-xs">
                              <div className="flex justify-between text-gray-700">
                                <span>{type}</span>
                                <span className="font-semibold">{score}</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-purple-500 h-1.5"
                                  style={{ width: `${Math.min(Number(score || 0) * 10, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {typ.interpretation?.description && (
                          <div className="text-xs text-gray-700">
                            <div className="font-medium mb-1">Комментарий:</div>
                            <p>{typ.interpretation.description}</p>
                            {typ.interpretation.recommendation && (
                              <p className="mt-1 text-gray-600">{typ.interpretation.recommendation}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-800">Values / Color test</div>
                    <span className="text-xs text-gray-500">metrics & ranks</span>
                  </div>
                  {(() => {
                    const val = safeParse(overrideForms.values);
                    if (!val) return <div className="text-sm text-gray-500">Нет данных</div>;
                    const metrics = Object.entries(val.calculated_metrics || {});
                    const ranks = (val.concept_color_matrix || []).map((col) => col?.length || 0);
                    return (
                      <div className="space-y-3">
                        <div className="space-y-1 text-xs">
                          {metrics.length ? (
                            metrics.map(([name, v]) => (
                              <div key={name} className="flex justify-between text-gray-700">
                                <span>{name}</span>
                                <span className="font-semibold">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-500">Метрики отсутствуют</div>
                          )}
                        </div>
                        {ranks.length ? (
                          <div className="text-xs text-gray-700">
                            <div className="font-medium mb-1">Концептов по рангам:</div>
                            <div className="flex flex-wrap gap-2">
                              {ranks.map((cnt, idx) => (
                                <span key={idx} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                  #{idx + 1}: {cnt}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Color Metrics Tab */}
        {activeTab === 'color-metrics' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Color Metrics</h3>
                  <p className="text-sm text-gray-600">
                    Edit similarity/attractiveness matrices for the color test metrics.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={loadMetrics}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={createMetric}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create metric
                  </button>
                  <button
                    onClick={saveMetric}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Save metric
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric name
                </label>
                <input
                  type="text"
                  value={metricForm.metric_name}
                  onChange={(e) => handleMetricFieldChange('metric_name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="metric name"
                />
              </div>

              <div className="mb-6 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Концепты цветового теста</div>
                    <p className="text-xs text-gray-600">
                      Локально редактируйте список понятий: добавляйте новые или удаляйте лишние токеном с крестиком.
                    </p>
                  </div>
                  <div className="flex w-full md:w-auto gap-2">
                    <input
                      type="text"
                      value={conceptInput}
                      onChange={(e) => setConceptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddConcept();
                        }
                      }}
                      className="flex-1 md:flex-none px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Новое понятие"
                    />
                    <button
                      onClick={handleAddConcept}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colorInputs.concepts.length ? (
                    colorInputs.concepts.map((concept) => (
                      <span
                        key={concept}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm shadow-sm"
                      >
                        <span className="text-gray-800">{concept}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveConcept(concept)}
                          className="text-gray-500 hover:text-red-600"
                          aria-label={`Удалить ${concept}`}
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Список понятий пуст.</span>
                  )}
                </div>
                {conceptsStatus && (
                  <div className="mt-3 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    {conceptsStatus}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                {colorMetrics.map((m) => (
                  <button
                    key={m.metric_name}
                    onClick={() => handleSelectMetric(m)}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      selectedMetric?.metric_name === m.metric_name
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {m.metric_name}
                  </button>
                ))}
              </div>

              {colorInputs.concepts.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  Список понятий пуст — матрицы скрыты. Добавьте концепты, чтобы редактировать веса.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        similarity_same_weights (Concept x Concept)
                      </label>
                      <ConceptMatrixEditor
                        concepts={colorInputs.concepts}
                        matrix={ensureMatrices(
                          metricForm.similarity_same_weights,
                          metricForm.similarity_diff_weights,
                          metricForm.attractiveness_rank_weights
                        ).same}
                        onChange={(mat) =>
                          setMetricForm((prev) => ({ ...prev, similarity_same_weights: mat }))
                        }
                        onSet={(next) =>
                          saveMetric({
                            similarity_same_weights: next,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        similarity_diff_weights (Concept x Concept)
                      </label>
                      <ConceptMatrixEditor
                        concepts={colorInputs.concepts}
                        matrix={ensureMatrices(
                          metricForm.similarity_same_weights,
                          metricForm.similarity_diff_weights,
                          metricForm.attractiveness_rank_weights
                        ).diff}
                        onChange={(mat) =>
                          setMetricForm((prev) => ({ ...prev, similarity_diff_weights: mat }))
                        }
                        onSet={(next) =>
                          saveMetric({
                            similarity_diff_weights: next,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      attractiveness_rank_weights (Concept x Rank)
                    </label>
                    <RankMatrixEditor
                      concepts={colorInputs.concepts}
                      colors={colorInputs.colors}
                      matrix={ensureMatrices(
                        metricForm.similarity_same_weights,
                        metricForm.similarity_diff_weights,
                        metricForm.attractiveness_rank_weights
                      ).rank}
                      onChange={(mat) =>
                        setMetricForm((prev) => ({ ...prev, attractiveness_rank_weights: mat }))
                      }
                      onSet={(next) =>
                        saveMetric({
                          attractiveness_rank_weights: next,
                        })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Concepts: {colorInputs.concepts.length || '—'} | Colors/Ranks:{' '}
                      {colorInputs.colors.length || '—'}
                    </p>
                  </div>
                </div>
              )}

              {selectedMetric && (
                <div>
                  <button
                    onClick={() => deleteMetric(selectedMetric.metric_name)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete metric
                  </button>
                </div>
              )}

              {metricStatus && (
                <div className="text-sm text-gray-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
                  {metricStatus}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
